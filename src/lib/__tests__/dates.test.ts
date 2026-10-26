import { dateLabel, localDate, localMonth, monthLabel, shiftMonth } from '../dates';

describe('local calendar dates', () => {
  it('formats local date parts without UTC conversion', () => {
    const date = new Date(2026, 9, 31, 23, 30);
    expect(localDate(date)).toBe('2026-10-31');
    expect(localMonth(date)).toBe('2026-10');
  });

  it('shifts months across year boundaries', () => {
    expect(shiftMonth('2026-01', -1)).toBe('2025-12');
    expect(shiftMonth('2026-12', 1)).toBe('2027-01');
  });

  it('formats date and month labels', () => {
    expect(monthLabel('2026-10')).toContain('October');
    expect(dateLabel('2026-10-31')).toContain('31');
  });
});
