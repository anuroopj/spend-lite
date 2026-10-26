import { normalizeAmount, validateAmount } from '../money';

describe('expense amount validation', () => {
  it.each(['0.01', '10', '999999.99'])('accepts %s', (amount) => {
    expect(validateAmount(amount)).toBeNull();
  });

  it.each(['', '0', '0.001', '-1', '1000000', '1.234', '1.', 'abc'])('rejects %s', (amount) => {
    expect(validateAmount(amount)).not.toBeNull();
  });

  it('normalizes valid values to two decimal places', () => {
    expect(normalizeAmount('12')).toBe('12.00');
    expect(normalizeAmount('12.3')).toBe('12.30');
  });
});
