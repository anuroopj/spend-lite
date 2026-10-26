export function localDate(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function localMonth(date = new Date()): string {
  return localDate(date).slice(0, 7);
}

export function shiftMonth(month: string, offset: number): string {
  const [year, oneBasedMonth] = month.split("-").map(Number);
  const value = new Date(year, oneBasedMonth - 1 + offset, 1);
  return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}`;
}

export function monthLabel(month: string): string {
  const [year, oneBasedMonth] = month.split("-").map(Number);
  return new Intl.DateTimeFormat("en-CA", { month: "long", year: "numeric" }).format(new Date(year, oneBasedMonth - 1, 1));
}

export function dateLabel(date: string): string {
  const [year, month, day] = date.split("-").map(Number);
  return new Intl.DateTimeFormat("en-CA", { month: "short", day: "numeric", year: "numeric" }).format(new Date(year, month - 1, day));
}
