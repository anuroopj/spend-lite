import { useAuth } from "@clerk/expo";
import { useCallback, useState } from "react";
import { useFocusEffect } from "expo-router";
import { ActivityIndicator, Text, View } from "react-native";
import { Card, EmptyState, Heading, Notice, Screen } from "@/components/ui";
import { MonthSelector } from "@/components/month-selector";
import { NetworkBanner, useIsOffline } from "@/components/network-banner";
import { getSummary } from "@/lib/api";
import { cacheSummary, readCachedHistory, readLastSync, readSummary } from "@/lib/cache";
import { categoryFor } from "@/lib/categories";
import { localMonth } from "@/lib/dates";
import { formatMoney } from "@/lib/money";
import { summarizeCached } from "@/lib/summary";
import type { Summary } from "@/lib/types";
import { colors } from "@/theme";

export default function BreakdownScreen() {
  const { getToken } = useAuth();
  const offline = useIsOffline();
  const [month, setMonth] = useState(localMonth());
  const [summary, setSummary] = useState<Summary | null>(null);
  const [syncedAt, setSyncedAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    if (!offline) {
      try {
        const fresh = await getSummary(month, getToken);
        await cacheSummary(fresh);
        setSummary(fresh); setSyncedAt(new Date().toISOString()); setLoading(false); return;
      } catch (requestError) { setError(requestError instanceof Error ? requestError.message : "Could not load breakdown."); }
    }
    const cached = await readSummary(month);
    if (cached) { setSummary(cached.summary); setSyncedAt(cached.syncedAt); }
    else {
      const history = await readCachedHistory({ month, category: "all", sort: "newest" });
      setSummary(summarizeCached(month, history.expenses)); setSyncedAt(history.syncedAt ?? await readLastSync());
    }
    setLoading(false);
  }, [getToken, month, offline]);
  useFocusEffect(useCallback(() => {
    const timer = setTimeout(() => { void load(); }, 0);
    return () => clearTimeout(timer);
  }, [load]));

  const maximum = Math.max(1, ...(summary?.categoryTotals.map((row) => Number(row.totalAmount)) ?? []));
  return <Screen>
    <Heading eyebrow="SPENDING PATTERNS" title="Breakdown" subtitle="See where this month’s money goes." />
    <NetworkBanner syncedAt={syncedAt} />
    {error ? <Notice tone="error">{error}</Notice> : null}
    <MonthSelector month={month} onChange={setMonth} />
    <Card style={{ backgroundColor: colors.greenDark, borderColor: colors.greenDark }}>
      <Text style={{ color: "#BEDCC9", fontSize: 12, marginBottom: 6 }}>TOTAL SPENT</Text>
      {loading && !summary ? <ActivityIndicator color="#fff" /> : <Text style={{ color: "#fff", fontSize: 32, fontWeight: "700" }}>{formatMoney(summary?.totalAmount ?? "0.00")}</Text>}
      <Text style={{ color: "#D5E9DC", marginTop: 7, fontSize: 13 }}>{summary?.expenseCount ?? 0} recorded {summary?.expenseCount === 1 ? "expense" : "expenses"}</Text>
    </Card>
    <Text style={{ color: colors.ink, fontSize: 18, fontWeight: "700" }}>By category</Text>
    <Card>
      {loading ? <ActivityIndicator color={colors.green} style={{ padding: 24 }} /> : !summary?.categoryTotals.length ? <EmptyState title="No spending yet" body="Your category totals will appear here when you add an expense." /> : summary.categoryTotals.map((row) => {
        const category = categoryFor(row.category);
        const percentage = Math.max(3, Number(row.totalAmount) / maximum * 100);
        return <View key={row.category} style={{ paddingVertical: 12, gap: 9 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 9 }}><Text style={{ fontSize: 18 }}>{category.icon}</Text><Text style={{ flex: 1, color: colors.ink, fontWeight: "600" }}>{category.label}</Text><Text style={{ color: colors.ink, fontWeight: "700" }}>{formatMoney(row.totalAmount)}</Text></View>
          <View style={{ height: 7, backgroundColor: "#EFF1ED", borderRadius: 8 }}><View style={{ width: `${percentage}%`, height: 7, backgroundColor: colors.green, borderRadius: 8 }} /></View>
          <Text style={{ color: colors.muted, fontSize: 11 }}>{row.count} {row.count === 1 ? "expense" : "expenses"}</Text>
        </View>;
      })}
    </Card>
  </Screen>;
}
