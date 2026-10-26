export const MIN_AMOUNT = 0.01;
export const MAX_AMOUNT = 999999.99;

export function formatMoney(amount: string | number): string {
  const numeric = typeof amount === "number" ? amount : Number(amount);
  if (!Number.isFinite(numeric)) return "$0.00";
  return new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format(numeric);
}

export function validateAmount(value: string): string | null {
  const trimmed = value.trim();
  if (!/^\d+(?:\.\d{1,2})?$/.test(trimmed)) return "Enter an amount with up to two decimal places.";
  const amount = Number(trimmed);
  if (amount < MIN_AMOUNT) return "Amount must be at least $0.01.";
  if (amount > MAX_AMOUNT) return "Amount cannot be more than $999,999.99.";
  return null;
}

export function normalizeAmount(value: string): string {
  return Number(value).toFixed(2);
}
