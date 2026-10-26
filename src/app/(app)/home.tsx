import { useAuth, useUser } from "@clerk/expo";
import { Link, router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { Card, EmptyState, Heading, Notice, PrimaryButton, Screen } from "@/components/ui";
import { ExpenseRow } from "@/components/expense-row";
import { MonthSelector } from "@/components/month-selector";
import { NetworkBanner, useIsOffline } from "@/components/network-banner";
import { cacheSummary, readCachedHistory, readLastSync, readSummary } from "@/lib/cache";
import { getSummary } from "@/lib/api";
import { localMonth } from "@/lib/dates";
import { formatMoney } from "@/lib/money";
import { summarizeCached } from "@/lib/summary";
import type { Summary } from "@/lib/types";
import { colors } from "@/theme";

export default function HomeScreen() {
  const { getToken } = useAuth();
  const { user } = useUser();
  const offline = useIsOffline();
  const [month, setMonth] = useState(localMonth());
  const [summary, setSummary] = useState<Summary | null>(null);
  const [syncedAt, setSyncedAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    if (!offline) {
      try {
        const fresh = await getSummary(month, getToken);
        await cacheSummary(fresh);
        setSummary(fresh);
        setSyncedAt(new Date().toISOString());
        setLoading(false);
        return;
      } catch (requestError) {
        setError(requestError instanceof Error ? requestError.message : "Could not load your spending.");
      }
    }
    const cached = await readSummary(month);
    if (cached) {
      setSummary(cached.summary);
      setSyncedAt(cached.syncedAt);
    } else {
      const history = await readCachedHistory({ month, category: "all", sort: "newest" });
      setSummary(summarizeCached(month, history.expenses));
      setSyncedAt(history.syncedAt ?? await readLastSync());
    }
    setLoading(false);
  }, [getToken, month, offline]);

  useFocusEffect(useCallback(() => {
    const timer = setTimeout(() => { void load(); }, 0);
    return () => clearTimeout(timer);
  }, [load]));

  const firstName = user?.firstName?.trim() || "there";
  return <Screen>
    <Heading eyebrow="SPENDLITE" title={`Hello, ${firstName}`} subtitle="Your spending, at a glance." />
    <NetworkBanner syncedAt={syncedAt} />
    {error && !summary ? <Notice tone="error">{error}</Notice> : null}
    <Card style={{ backgroundColor: colors.greenDark, borderColor: colors.greenDark, padding: 22 }}>
      <MonthSelector month={month} onChange={setMonth} />
      <Text style={{ color: "#BEDCC9", fontSize: 12, marginTop: 22, marginBottom: 5 }}>TOTAL SPENT</Text>
      {loading && !summary ? <ActivityIndicator color="#fff" style={{ alignSelf: "flex-start", marginVertical: 10 }} /> : <Text style={{ color: "#fff", fontSize: 37, fontWeight: "700", letterSpacing: -1 }}>{formatMoney(summary?.totalAmount ?? "0.00")}</Text>}
      <View style={{ height: 1, backgroundColor: "#4B8063", marginVertical: 18 }} />
      <Text style={{ color: "#E0F0E5", fontSize: 14 }}>{summary?.expenseCount ?? 0} {summary?.expenseCount === 1 ? "expense" : "expenses"} recorded</Text>
    </Card>
    <PrimaryButton label="Add expense" icon="＋" onPress={() => router.push("/expense/new")} disabled={offline} />
    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 2 }}>
      <Text style={{ color: colors.ink, fontSize: 18, fontWeight: "700" }}>Recent expenses</Text>
      <Link href="/history" asChild><Pressable><Text style={{ color: colors.green, fontSize: 13, fontWeight: "700" }}>See all</Text></Pressable></Link>
    </View>
    <Card>
      {loading && !summary ? <ActivityIndicator color={colors.green} /> : summary?.recentExpenses.length ? summary.recentExpenses.map((expense, index) => <View key={expense.id}><Link href={`/expense/${expense.id}`} asChild><ExpenseRow expense={expense} onPress={() => {}} /></Link>{index < summary.recentExpenses.length - 1 ? <View style={{ height: 1, backgroundColor: colors.line }} /> : null}</View>) : <EmptyState title="A fresh start" body="Add your first expense to see your spending take shape." />}
    </Card>
  </Screen>;
}
