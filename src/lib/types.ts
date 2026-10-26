import type { CategoryId } from "./categories";

export type Expense = {
  id: string;
  amount: string;
  description: string;
  category: CategoryId;
  expenseDate: string;
  createdAt: string;
  updatedAt: string;
};

export type ExpensePage = {
  content: Expense[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  hasNext: boolean;
};

export type Summary = {
  month: string;
  totalAmount: string;
  expenseCount: number;
  categoryTotals: { category: CategoryId; totalAmount: string; count: number }[];
  recentExpenses: Expense[];
};

export type ExpenseInput = Pick<Expense, "amount" | "description" | "category" | "expenseDate">;
export type ExpenseSort = "newest" | "oldest" | "amount-desc" | "amount-asc";
