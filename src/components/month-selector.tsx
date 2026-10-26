import { Pressable, StyleSheet, Text, View } from "react-native";
import { localMonth, monthLabel, shiftMonth } from "@/lib/dates";
import { colors } from "@/theme";

export function MonthSelector({ month, onChange, includeAll = false }: { month: string; onChange: (value: string) => void; includeAll?: boolean }) {
  const current = localMonth();
  const all = month === "all";
  return <View style={styles.wrap}>
    {all ? <Pressable onPress={() => onChange(current)} style={styles.arrow}><Text style={styles.arrowText}>‹</Text></Pressable> : <Pressable onPress={() => onChange(shiftMonth(month, -1))} style={styles.arrow}><Text style={styles.arrowText}>‹</Text></Pressable>}
    <Pressable onPress={() => all && onChange(current)} style={styles.label}><Text style={styles.labelText}>{all ? "All time" : monthLabel(month)}</Text><Text style={styles.helper}>{all ? "Every recorded expense" : "Monthly spending"}</Text></Pressable>
    {!all && month < current ? <Pressable onPress={() => onChange(shiftMonth(month, 1))} style={styles.arrow}><Text style={styles.arrowText}>›</Text></Pressable> : <View style={styles.arrow} />}
    {includeAll && !all ? <Pressable onPress={() => onChange("all")} style={styles.all}><Text style={styles.allText}>All time</Text></Pressable> : null}
  </View>;
}

const styles = StyleSheet.create({
  wrap: { flexDirection: "row", alignItems: "center", minHeight: 50 },
  arrow: { width: 40, height: 40, alignItems: "center", justifyContent: "center", borderRadius: 14, backgroundColor: colors.surface, borderColor: colors.line, borderWidth: 1 },
  arrowText: { color: colors.ink, fontSize: 25, lineHeight: 28 },
  label: { flex: 1, alignItems: "center", gap: 3 },
  labelText: { color: colors.ink, fontSize: 15, fontWeight: "700" },
  helper: { color: colors.muted, fontSize: 11 },
  all: { marginLeft: 8, paddingVertical: 9, paddingHorizontal: 12, borderRadius: 12, backgroundColor: colors.greenTint },
  allText: { color: colors.greenDark, fontSize: 11, fontWeight: "700" },
});
