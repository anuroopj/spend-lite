import * as Crypto from "expo-crypto";
import * as SecureStore from "expo-secure-store";
import * as SQLite from "expo-sqlite";
import type { Expense, ExpensePage, ExpenseSort, Summary } from "./types";

let database: SQLite.SQLiteDatabase | null = null;
let activeUserId: string | null = null;

function databaseName(userId: string) {
  const safeId = userId.replace(/[^a-zA-Z0-9_-]/g, "_");
  return `spendlite_${safeId}.db`;
}

async function getDatabaseKey(userId: string) {
  const keyName = `spendlite-sqlcipher-${userId}`;
  let key = await SecureStore.getItemAsync(keyName);
  if (!key) {
    key = Array.from(Crypto.getRandomBytes(32), (byte) => byte.toString(16).padStart(2, "0")).join("");
    await SecureStore.setItemAsync(keyName, key, { keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY });
  }
  return key;
}

async function initSchema(db: SQLite.SQLiteDatabase) {
  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS expenses (
      id TEXT PRIMARY KEY NOT NULL,
      amount TEXT NOT NULL,
      description TEXT NOT NULL,
      category TEXT NOT NULL,
      expense_date TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(expense_date DESC);
    CREATE TABLE IF NOT EXISTS summaries (
      month TEXT PRIMARY KEY NOT NULL,
      data TEXT NOT NULL,
      synced_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS history_pages (
      cache_key TEXT PRIMARY KEY NOT NULL,
      page INTEGER NOT NULL,
      has_next INTEGER NOT NULL,
      total_elements INTEGER NOT NULL,
      synced_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS cache_state (
      id INTEGER PRIMARY KEY NOT NULL CHECK (id = 1),
      synced_at TEXT NOT NULL
    );
  `);
}

export async function openAccountCache(userId: string) {
  if (database && activeUserId === userId) return database;
  if (database) {
    const previousUserId = activeUserId;
    await database.closeAsync();
    database = null;
    activeUserId = null;
    if (previousUserId) {
      await SQLite.deleteDatabaseAsync(databaseName(previousUserId));
      await SecureStore.deleteItemAsync(`spendlite-sqlcipher-${previousUserId}`);
    }
  }
  activeUserId = userId;
  const db = await SQLite.openDatabaseAsync(databaseName(userId));
  const key = await getDatabaseKey(userId);
  await db.execAsync(`PRAGMA key = "x'${key}'";`);
  const cipher = await db.getFirstAsync<{ cipher_version: string }>("PRAGMA cipher_version");
  if (!cipher?.cipher_version) {
    await db.closeAsync();
    throw new Error("Encrypted local storage is unavailable. Install a development build with SQLCipher enabled.");
  }
  await initSchema(db);
  database = db;
  return db;
}

function pageKey(month: string, category: string, sort: ExpenseSort, page: number) {
  return `${month}|${category}|${sort}|${page}`;
}

export async function cacheSummary(summary: Summary) {
  if (!database) return;
  const now = new Date().toISOString();
  await database.runAsync(
    "INSERT OR REPLACE INTO summaries(month, data, synced_at) VALUES (?, ?, ?)",
    summary.month,
    JSON.stringify(summary),
    now,
  );
  await database.runAsync("INSERT OR REPLACE INTO cache_state(id, synced_at) VALUES (1, ?)", now);
  await cacheExpenses(summary.recentExpenses);
}

export async function readSummary(month: string): Promise<{ summary: Summary; syncedAt: string } | null> {
  if (!database) return null;
  const row = await database.getFirstAsync<{ data: string; synced_at: string }>("SELECT data, synced_at FROM summaries WHERE month = ?", month);
  if (!row) return null;
  return { summary: JSON.parse(row.data) as Summary, syncedAt: row.synced_at };
}

export async function cachePage(query: { month: string; category: string; sort: ExpenseSort; page: number }, result: ExpensePage) {
  if (!database) return;
  await cacheExpenses(result.content);
  const now = new Date().toISOString();
  await database.runAsync(
    "INSERT OR REPLACE INTO history_pages(cache_key, page, has_next, total_elements, synced_at) VALUES (?, ?, ?, ?, ?)",
    pageKey(query.month, query.category, query.sort, query.page), query.page, result.hasNext ? 1 : 0, result.totalElements, now,
  );
  await database.runAsync("INSERT OR REPLACE INTO cache_state(id, synced_at) VALUES (1, ?)", now);
}

async function cacheExpenses(expenses: Expense[]) {
  if (!database || expenses.length === 0) return;
  await database.withTransactionAsync(async () => {
    for (const expense of expenses) {
      await database!.runAsync(
        "INSERT OR REPLACE INTO expenses(id, amount, description, category, expense_date, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
        expense.id, expense.amount, expense.description, expense.category, expense.expenseDate, expense.createdAt, expense.updatedAt,
      );
    }
  });
}

export async function cacheMutation(expense: Expense) {
  await cacheExpenses([expense]);
}

export async function removeCachedExpense(id: string) {
  if (!database) return;
  await database.runAsync("DELETE FROM expenses WHERE id = ?", id);
  await database.runAsync("DELETE FROM summaries");
}

export async function invalidateSummaries() {
  if (database) await database.runAsync("DELETE FROM summaries");
}

export async function readCachedHistory(query: { month: string; category: string; sort: ExpenseSort }) {
  if (!database) return { expenses: [] as Expense[], syncedAt: null as string | null, hasNext: false };
  const rows = await database.getAllAsync<{
    id: string; amount: string; description: string; category: Expense["category"];
    expense_date: string; created_at: string; updated_at: string;
  }>("SELECT id, amount, description, category, expense_date, created_at, updated_at FROM expenses");
  let expenses: Expense[] = rows.map((row) => ({
    id: row.id, amount: row.amount, description: row.description, category: row.category,
    expenseDate: row.expense_date, createdAt: row.created_at, updatedAt: row.updated_at,
  }));
  if (query.month !== "all") expenses = expenses.filter((expense) => expense.expenseDate.startsWith(query.month));
  if (query.category !== "all") expenses = expenses.filter((expense) => expense.category === query.category);
  expenses.sort((a, b) => {
    if (query.sort === "amount-desc") return Number(b.amount) - Number(a.amount) || b.expenseDate.localeCompare(a.expenseDate);
    if (query.sort === "amount-asc") return Number(a.amount) - Number(b.amount) || b.expenseDate.localeCompare(a.expenseDate);
    return query.sort === "oldest" ? a.expenseDate.localeCompare(b.expenseDate) : b.expenseDate.localeCompare(a.expenseDate);
  });
  const cacheRows = await database.getAllAsync<{ synced_at: string; has_next: number }>(
    "SELECT synced_at, has_next, page FROM history_pages WHERE cache_key LIKE ? ORDER BY page DESC, synced_at DESC",
    `${query.month}|${query.category}|${query.sort}|%`,
  );
  const summaryRow = query.month !== "all"
    ? await database.getFirstAsync<{ synced_at: string }>("SELECT synced_at FROM summaries WHERE month = ?", query.month)
    : null;
  const timestamps = [summaryRow?.synced_at, ...cacheRows.map((row) => row.synced_at)].filter(Boolean) as string[];
  const syncedAt = timestamps.sort().at(-1) ?? null;
  return { expenses, syncedAt, hasNext: cacheRows.length === 0 || cacheRows[0]?.has_next === 1 };
}

export async function readCachedExpense(id: string): Promise<Expense | null> {
  if (!database) return null;
  const row = await database.getFirstAsync<{
    id: string; amount: string; description: string; category: Expense["category"];
    expense_date: string; created_at: string; updated_at: string;
  }>("SELECT id, amount, description, category, expense_date, created_at, updated_at FROM expenses WHERE id = ?", id);
  if (!row) return null;
  return { id: row.id, amount: row.amount, description: row.description, category: row.category, expenseDate: row.expense_date, createdAt: row.created_at, updatedAt: row.updated_at };
}

export async function readLastSync() {
  if (!database) return null;
  const row = await database.getFirstAsync<{ synced_at: string }>("SELECT synced_at FROM cache_state WHERE id = 1");
  return row?.synced_at ?? null;
}

export async function clearAccountCache(userId: string) {
  if (database && activeUserId === userId) {
    await database.closeAsync();
    database = null;
    activeUserId = null;
  }
  await SQLite.deleteDatabaseAsync(databaseName(userId));
  await SecureStore.deleteItemAsync(`spendlite-sqlcipher-${userId}`);
}
