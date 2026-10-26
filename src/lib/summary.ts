import type { Expense, Summary } from "./types";

export function summarizeCached(month: string, expenses: Expense[]): Summary {
  const filtered = month === "all" ? expenses : expenses.filter((expense) => expense.expenseDate.startsWith(month));
  const byCategory = new Map<string, { total: number; count: number }>();
  for (const expense of filtered) {
    const current = byCategory.get(expense.category) ?? { total: 0, count: 0 };
    current.total += Math.round(Number(expense.amount) * 100);
    current.count += 1;
    byCategory.set(expense.category, current);
  }
  return {
    month,
    totalAmount: (filtered.reduce((sum, expense) => sum + Math.round(Number(expense.amount) * 100), 0) / 100).toFixed(2),
    expenseCount: filtered.length,
    categoryTotals: Array.from(byCategory, ([category, values]) => ({ category: category as Summary["categoryTotals"][number]["category"], totalAmount: (values.total / 100).toFixed(2), count: values.count })),
    recentExpenses: [...filtered].sort((a, b) => b.expenseDate.localeCompare(a.expenseDate) || b.createdAt.localeCompare(a.createdAt)).slice(0, 5),
  };
}
