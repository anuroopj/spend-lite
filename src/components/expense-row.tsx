import { Pressable, StyleSheet, Text, View } from "react-native";
import type { Expense } from "@/lib/types";
import { categoryFor } from "@/lib/categories";
import { dateLabel } from "@/lib/dates";
import { formatMoney } from "@/lib/money";
import { colors } from "@/theme";

export function ExpenseRow({ expense, onPress }: { expense: Expense; onPress?: () => void }) {
  const category = categoryFor(expense.category);
  const row = <View style={styles.row}><View style={styles.icon}><Text style={styles.iconText}>{category.icon}</Text></View><View style={styles.copy}><Text style={styles.description} numberOfLines={1}>{expense.description}</Text><Text style={styles.meta}>{category.label} · {dateLabel(expense.expenseDate)}</Text></View><Text style={styles.amount}>{formatMoney(expense.amount)}</Text></View>;
  return onPress ? <Pressable onPress={onPress} style={({ pressed }) => [pressed && { opacity: 0.7 }]}>{row}</Pressable> : row;
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 13 },
  icon: { width: 42, height: 42, borderRadius: 14, backgroundColor: colors.greenTint, alignItems: "center", justifyContent: "center" },
  iconText: { fontSize: 18 },
  copy: { flex: 1, gap: 4 },
  description: { color: colors.ink, fontSize: 14, fontWeight: "600" },
  meta: { color: colors.muted, fontSize: 11 },
  amount: { color: colors.ink, fontSize: 14, fontWeight: "700" },
});
