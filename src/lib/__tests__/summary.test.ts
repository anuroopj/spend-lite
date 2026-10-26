import type { Expense } from '../types';
import { summarizeCached } from '../summary';

const expenses: Expense[] = [
  { id: '1', amount: '12.10', description: 'Groceries', category: 'FOOD', expenseDate: '2026-10-31', createdAt: '2026-10-31T23:00:00Z', updatedAt: '2026-10-31T23:00:00Z' },
  { id: '2', amount: '4.20', description: 'Bus', category: 'TRANSPORT', expenseDate: '2026-10-01', createdAt: '2026-10-01T12:00:00Z', updatedAt: '2026-10-01T12:00:00Z' },
  { id: '3', amount: '99.99', description: 'Older', category: 'OTHER', expenseDate: '2026-09-30', createdAt: '2026-09-30T12:00:00Z', updatedAt: '2026-09-30T12:00:00Z' },
];

describe('cached summaries', () => {
  it('uses integer cents and scopes totals to the selected month', () => {
    const summary = summarizeCached('2026-10', expenses);
    expect(summary.totalAmount).toBe('16.30');
    expect(summary.expenseCount).toBe(2);
    expect(summary.categoryTotals).toHaveLength(2);
    expect(summary.recentExpenses.map((expense) => expense.id)).toEqual(['1', '2']);
  });

  it('summarizes all cached dates for all-time history', () => {
    expect(summarizeCached('all', expenses).totalAmount).toBe('116.29');
  });
});
