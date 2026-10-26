import type { PropsWithChildren, ReactNode } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, radius } from "@/theme";

export function Screen({ children, scroll = true, contentStyle }: PropsWithChildren<{ scroll?: boolean; contentStyle?: object }>) {
  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      {scroll ? <ScrollView contentContainerStyle={[styles.content, contentStyle]} keyboardShouldPersistTaps="handled">{children}</ScrollView> : <View style={[styles.content, contentStyle]}>{children}</View>}
    </SafeAreaView>
  );
}

export function Heading({ eyebrow, title, subtitle, right }: { eyebrow?: string; title: string; subtitle?: string; right?: ReactNode }) {
  return <View style={styles.headingRow}><View style={{ flex: 1 }}>{eyebrow ? <Text style={styles.eyebrow}>{eyebrow.toUpperCase()}</Text> : null}<Text style={styles.title}>{title}</Text>{subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}</View>{right}</View>;
}

export function Card({ children, style }: PropsWithChildren<{ style?: object }>) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function PrimaryButton({ label, onPress, disabled, loading, icon }: { label: string; onPress: () => void; disabled?: boolean; loading?: boolean; icon?: string }) {
  return <Pressable onPress={onPress} disabled={disabled || loading} style={({ pressed }) => [styles.primary, (disabled || loading) && styles.disabled, pressed && !disabled && styles.pressed]}><>{loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryText}>{icon ? `${icon}  ` : ""}{label}</Text>}</></Pressable>;
}

export function SecondaryButton({ label, onPress, destructive = false, disabled = false }: { label: string; onPress: () => void; destructive?: boolean; disabled?: boolean }) {
  return <Pressable onPress={onPress} disabled={disabled} style={({ pressed }) => [styles.secondary, destructive && styles.destructive, (pressed || disabled) && styles.pressed, disabled && styles.disabled]}><Text style={[styles.secondaryText, destructive && { color: colors.red }]}>{label}</Text></Pressable>;
}

export function Pill({ children, tone = "neutral" }: PropsWithChildren<{ tone?: "neutral" | "green" | "orange" }>) {
  const toneStyle = tone === "green" ? styles.pillGreen : tone === "orange" ? styles.pillOrange : styles.pillNeutral;
  return <View style={[styles.pill, toneStyle]}><Text style={[styles.pillText, tone === "green" ? { color: colors.greenDark } : tone === "orange" ? { color: colors.orange } : { color: colors.muted }]}>{children}</Text></View>;
}

export function Notice({ children, tone = "neutral" }: PropsWithChildren<{ tone?: "neutral" | "error" | "offline" }>) {
  return <View style={[styles.notice, tone === "error" ? styles.noticeError : tone === "offline" ? styles.noticeOffline : null]}><Text style={[styles.noticeText, tone === "error" ? { color: colors.red } : tone === "offline" ? { color: colors.orange } : null]}>{children}</Text></View>;
}

export function EmptyState({ title, body, action }: { title: string; body: string; action?: ReactNode }) {
  return <View style={styles.empty}><Text style={styles.emptySpark}>✦</Text><Text style={styles.emptyTitle}>{title}</Text><Text style={styles.emptyBody}>{body}</Text>{action}</View>;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.paper },
  content: { padding: 20, paddingBottom: 32, gap: 18 },
  headingRow: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 2 },
  eyebrow: { color: colors.green, fontSize: 11, letterSpacing: 1.6, fontWeight: "700", marginBottom: 6 },
  title: { color: colors.ink, fontSize: 29, fontWeight: "700", letterSpacing: -0.5 },
  subtitle: { color: colors.muted, fontSize: 14, marginTop: 5, lineHeight: 20 },
  card: { backgroundColor: colors.surface, borderRadius: radius.card, borderWidth: 1, borderColor: colors.line, padding: 18 },
  primary: { minHeight: 54, borderRadius: radius.control, alignItems: "center", justifyContent: "center", paddingHorizontal: 18, backgroundColor: colors.green },
  primaryText: { color: "#fff", fontSize: 15, fontWeight: "700" },
  disabled: { opacity: 0.5 },
  pressed: { opacity: 0.78, transform: [{ scale: 0.99 }] },
  secondary: { minHeight: 48, borderRadius: radius.control, alignItems: "center", justifyContent: "center", paddingHorizontal: 16, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.surface },
  destructive: { borderColor: "#E9C9C9", backgroundColor: colors.redTint },
  secondaryText: { color: colors.ink, fontSize: 14, fontWeight: "600" },
  pill: { borderRadius: radius.pill, paddingHorizontal: 12, paddingVertical: 7, alignSelf: "flex-start" },
  pillNeutral: { backgroundColor: "#EEF0EC" },
  pillGreen: { backgroundColor: colors.greenTint },
  pillOrange: { backgroundColor: colors.orangeTint },
  pillText: { fontSize: 11, fontWeight: "700" },
  notice: { padding: 12, borderRadius: radius.control, backgroundColor: "#EEF0EC" },
  noticeError: { backgroundColor: colors.redTint },
  noticeOffline: { backgroundColor: colors.orangeTint },
  noticeText: { color: colors.muted, fontSize: 12, lineHeight: 18, fontWeight: "600" },
  empty: { alignItems: "center", paddingVertical: 30, paddingHorizontal: 20, gap: 9 },
  emptySpark: { color: colors.green, fontSize: 30, marginBottom: 2 },
  emptyTitle: { color: colors.ink, fontSize: 18, fontWeight: "700", textAlign: "center" },
  emptyBody: { color: colors.muted, fontSize: 14, lineHeight: 21, textAlign: "center", maxWidth: 260 },
});
