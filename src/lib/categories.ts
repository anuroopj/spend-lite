export const CATEGORIES = [
  { id: "FOOD", label: "Food", icon: "🥑" },
  { id: "TRANSPORT", label: "Transport", icon: "🚲" },
  { id: "SHOPPING", label: "Shopping", icon: "🛍️" },
  { id: "BILLS", label: "Bills", icon: "🧾" },
  { id: "HEALTH", label: "Health", icon: "🌿" },
  { id: "OTHER", label: "Other", icon: "✦" },
] as const;

export type CategoryId = (typeof CATEGORIES)[number]["id"];
export function categoryFor(id: string) {
  return CATEGORIES.find((category) => category.id === id) ?? CATEGORIES[5];
}
