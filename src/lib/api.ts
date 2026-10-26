import type { ExpenseInput, ExpensePage, ExpenseSort, Summary } from "./types";

const API_URL = (process.env.EXPO_PUBLIC_API_URL || "http://10.0.2.2:8080").replace(/\/$/, "");

export class ApiError extends Error {
  constructor(message: string, public status?: number) {
    super(message);
    this.name = "ApiError";
  }
}

async function request<T>(path: string, getToken: () => Promise<string | null>, init: RequestInit = {}): Promise<T> {
  const token = await getToken();
  if (!token) throw new ApiError("Your session has expired. Sign in again.", 401);
  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      ...init,
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`, ...init.headers },
    });
  } catch {
    throw new ApiError("Could not connect. Check your connection and try again.");
  }
  if (!response.ok) {
    let message = "Something went wrong. Please try again.";
    try {
      const body = await response.json();
      message = body.message || body.detail || message;
    } catch { /* server returned no JSON */ }
    throw new ApiError(message, response.status);
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export function getSummary(month: string, getToken: () => Promise<string | null>) {
  return request<Summary>(`/api/v1/summary?month=${encodeURIComponent(month)}`, getToken);
}

export function getExpenses(query: { month: string; category: string; sort: ExpenseSort; page: number }, getToken: () => Promise<string | null>) {
  const params = new URLSearchParams({ month: query.month, category: query.category, sort: query.sort, page: String(query.page), size: "50" });
  return request<ExpensePage>(`/api/v1/expenses?${params.toString()}`, getToken);
}

export function createExpense(input: ExpenseInput, getToken: () => Promise<string | null>) {
  return request<import("./types").Expense>("/api/v1/expenses", getToken, { method: "POST", body: JSON.stringify(input) });
}

export function updateExpense(id: string, input: ExpenseInput, getToken: () => Promise<string | null>) {
  return request<import("./types").Expense>(`/api/v1/expenses/${encodeURIComponent(id)}`, getToken, { method: "PUT", body: JSON.stringify(input) });
}

export function deleteExpense(id: string, getToken: () => Promise<string | null>) {
  return request<void>(`/api/v1/expenses/${encodeURIComponent(id)}`, getToken, { method: "DELETE" });
}

export type DeletionJob = { jobId: string; statusToken: string; status: "PENDING" | "RUNNING" | "COMPLETE" };

export function startAccountDeletion(getToken: () => Promise<string | null>) {
  return request<DeletionJob>("/api/v1/account/deletion", getToken, { method: "POST", body: JSON.stringify({ confirmation: true }) });
}

export async function getDeletionStatus(jobId: string, statusToken: string): Promise<{ status: "PENDING" | "RUNNING" | "COMPLETE" }> {
  let response: Response;
  try {
    response = await fetch(`${API_URL}/api/v1/account/deletion/${encodeURIComponent(jobId)}`, { headers: { Authorization: `Bearer ${statusToken}` } });
  } catch {
    throw new ApiError("Deletion is still processing. Check your connection and try again.");
  }
  if (!response.ok) throw new ApiError("Could not check deletion status.", response.status);
  return response.json();
}
