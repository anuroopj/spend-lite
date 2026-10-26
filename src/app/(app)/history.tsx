import { useAuth } from "@clerk/expo";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { Card, EmptyState, Heading, Notice, Screen } from "@/components/ui";
import { ExpenseRow } from "@/components/expense-row";
import { MonthSelector } from "@/components/month-selector";
import { NetworkBanner, useIsOffline } from "@/components/network-banner";
import { CATEGORIES } from "@/lib/categories";
import { getExpenses } from "@/lib/api";
import { cachePage, readCachedHistory, readLastSync } from "@/lib/cache";
import { localMonth } from "@/lib/dates";
import type { Expense, ExpenseSort } from "@/lib/types";
import { colors } from "@/theme";

const sortOptions: { value: ExpenseSort; label: string }[] = [
  { value: "newest", label: "Newest first" },
  { value: "oldest", label: "Oldest first" },
  { value: "amount-desc", label: "Highest amount" },
  { value: "amount-asc", label: "Lowest amount" },
];

export default function HistoryScreen() {
  const { getToken } = useAuth();
  const offline = useIsOffline();
  const [month, setMonth] = useState(localMonth());
  const [category, setCategory] = useState("all");
  const [sort, setSort] = useState<ExpenseSort>("newest");
  const [sortOpen, setSortOpen] = useState(false);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [page, setPage] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const [syncedAt, setSyncedAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadPage = useCallback(async (pageToLoad: number, append: boolean) => {
    if (append) setLoadingMore(true); else setLoading(true);
    setError(null);
    const query = { month, category, sort, page: pageToLoad };
    if (!offline) {
      try {
        const result = await getExpenses(query, getToken);
        await cachePage(query, result);
        setExpenses((previous) => append ? [...previous, ...result.content] : result.content);
        setPage(result.page);
        setHasNext(result.hasNext);
        setSyncedAt(new Date().toISOString());
        setLoading(false); setLoadingMore(false);
        return;
      } catch (requestError) {
        setError(requestError instanceof Error ? requestError.message : "Could not load history.");
      }
    }
    const cached = await readCachedHistory({ month, category, sort });
    setExpenses(cached.expenses);
    setHasNext(cached.hasNext);
    setSyncedAt(cached.syncedAt ?? await readLastSync());
    setPage(0);
    setLoading(false); setLoadingMore(false);
  }, [category, getToken, month, offline, sort]);

  useFocusEffect(useCallback(() => {
    const timer = setTimeout(() => { void loadPage(0, false); }, 0);
    return () => clearTimeout(timer);
  }, [loadPage]));
  const selectedSort = useMemo(() => sortOptions.find((option) => option.value === sort)?.label, [sort]);

  return <Screen>
    <Heading eyebrow="YOUR RECORDS" title="History" subtitle="Every expense, all in one place." />
    <NetworkBanner syncedAt={syncedAt} />
    {error ? <Notice tone="error">{error}</Notice> : null}
    <MonthSelector month={month} onChange={setMonth} includeAll />
    <View style={{ gap: 10 }}>
      <Text style={{ color: colors.muted, fontSize: 11, fontWeight: "700", letterSpacing: 1 }}>CATEGORY</Text>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
        <FilterChip selected={category === "all"} label="All" onPress={() => setCategory("all")} />
        {CATEGORIES.map((item) => <FilterChip key={item.id} selected={category === item.id} label={`${item.icon} ${item.label}`} onPress={() => setCategory(item.id)} />)}
      </View>
    </View>
    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
      <Text style={{ color: colors.ink, fontSize: 17, fontWeight: "700" }}>Transactions</Text>
      <Pressable onPress={() => setSortOpen((open) => !open)} style={{ paddingVertical: 8, paddingHorizontal: 11, borderRadius: 12, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line }}>
        <Text style={{ color: colors.greenDark, fontSize: 12, fontWeight: "700" }}>{selectedSort}  ⌄</Text>
      </Pressable>
    </View>
    {sortOpen ? <Card style={{ padding: 7 }}>{sortOptions.map((option) => <Pressable key={option.value} onPress={() => { setSort(option.value); setSortOpen(false); }} style={{ padding: 12 }}><Text style={{ color: sort === option.value ? colors.green : colors.ink, fontWeight: "600" }}>{option.label}</Text></Pressable>)}</Card> : null}
    <Card>
      {loading ? <ActivityIndicator color={colors.green} style={{ padding: 24 }} /> : expenses.length === 0 ? <EmptyState title="Nothing here yet" body="Try another month or category, or add an expense." /> : expenses.map((expense, index) => <View key={expense.id}><ExpenseRow expense={expense} onPress={() => router.push(`/expense/${expense.id}`)} />{index < expenses.length - 1 ? <View style={{ height: 1, backgroundColor: colors.line }} /> : null}</View>)}
      {!loading && hasNext && !offline ? <Pressable disabled={loadingMore} onPress={() => void loadPage(page + 1, true)} style={{ alignItems: "center", paddingVertical: 16 }}>{loadingMore ? <ActivityIndicator color={colors.green} /> : <Text style={{ color: colors.green, fontWeight: "700" }}>Load more</Text>}</Pressable> : null}
      {!loading && offline && hasNext ? <Text style={{ color: colors.muted, fontSize: 12, textAlign: "center", paddingTop: 10 }}>More history hasn’t been downloaded for offline use.</Text> : null}
    </Card>
  </Screen>;
}

function FilterChip({ selected, label, onPress }: { selected: boolean; label: string; onPress: () => void }) {
  return <Pressable onPress={onPress} style={{ borderRadius: 999, backgroundColor: selected ? colors.greenTint : colors.surface, borderWidth: 1, borderColor: selected ? colors.green : colors.line, paddingHorizontal: 12, paddingVertical: 9 }}><Text style={{ color: selected ? colors.greenDark : colors.muted, fontSize: 12, fontWeight: selected ? "700" : "500" }}>{selected ? "✓ " : ""}{label}</Text></Pressable>;
}
