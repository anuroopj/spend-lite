import { useAuth } from "@clerk/expo";
import DateTimePicker, { type DateTimePickerEvent } from "@react-native-community/datetimepicker";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Alert, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { Card, Heading, Notice, PrimaryButton, Screen, SecondaryButton } from "@/components/ui";
import { useIsOffline } from "@/components/network-banner";
import { deleteExpense, createExpense, updateExpense } from "@/lib/api";
import { cacheMutation, invalidateSummaries, readCachedExpense, removeCachedExpense } from "@/lib/cache";
import { CATEGORIES, type CategoryId } from "@/lib/categories";
import { dateLabel, localDate } from "@/lib/dates";
import { MAX_AMOUNT, normalizeAmount, validateAmount } from "@/lib/money";
import { colors } from "@/theme";

export default function ExpenseFormScreen() {
  const params = useLocalSearchParams<{ id?: string }>();
  const id = typeof params.id === "string" ? params.id : null;
  const editing = Boolean(id);
  const { getToken } = useAuth();
  const offline = useIsOffline();
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<CategoryId | null>(null);
  const [expenseDate, setExpenseDate] = useState(localDate());
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notCached, setNotCached] = useState(false);

  useEffect(() => {
    if (!id) return;
    let mounted = true;
    void readCachedExpense(id).then((expense) => {
      if (!mounted) return;
      if (!expense) { setNotCached(true); return; }
      setAmount(expense.amount);
      setDescription(expense.description);
      setCategory(expense.category);
      setExpenseDate(expense.expenseDate);
    });
    return () => { mounted = false; };
  }, [id]);

  const parsedDate = useMemo(() => {
    const [year, month, day] = expenseDate.split("-").map(Number);
    return new Date(year, month - 1, day, 12);
  }, [expenseDate]);

  async function save() {
    setError(null);
    const amountError = validateAmount(amount);
    if (amountError) { setError(amountError); return; }
    if (!description.trim()) { setError("Add a description for this expense."); return; }
    if (description.trim().length > 160) { setError("Description must be 160 characters or fewer."); return; }
    if (!category) { setError("Choose a category before saving."); return; }
    setBusy(true);
    try {
      const input = { amount: normalizeAmount(amount), description: description.trim(), category, expenseDate };
      const saved = editing ? await updateExpense(id!, input, getToken) : await createExpense(input, getToken);
      await cacheMutation(saved);
      await invalidateSummaries();
      router.back();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Could not save this expense.");
    } finally { setBusy(false); }
  }

  function remove() {
    if (!id) return;
    Alert.alert("Delete this expense?", "It will be permanently removed from your history and totals.", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => { void performDelete(); } },
    ]);
  }

  async function performDelete() {
    if (!id) return;
    setBusy(true); setError(null);
    try {
      await deleteExpense(id, getToken);
      await removeCachedExpense(id);
      router.back();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Could not delete this expense.");
    } finally { setBusy(false); }
  }

  function onDateChange(event: DateTimePickerEvent, selectedDate?: Date) {
    setDatePickerOpen(Platform.OS === "ios");
    if (event.type === "set" && selectedDate) setExpenseDate(localDate(selectedDate));
  }

  return <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.paper }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
    <Screen>
      <Heading eyebrow={editing ? "UPDATE RECORD" : "NEW RECORD"} title={editing ? "Edit expense" : "Add expense"} subtitle={editing ? "Change the details below." : "A few details and you’re done."} />
      {offline ? <Notice tone="offline">Expenses can only be added, edited, or deleted while online.</Notice> : null}
      {notCached ? <Notice tone="error">This expense isn’t available in the offline cache. Go online and open it from your history.</Notice> : null}
      {error ? <Notice tone="error">{error}</Notice> : null}
      <Card style={{ gap: 17 }}>
        <View style={styles.field}>
          <Text style={styles.label}>Amount <Text style={styles.required}>*</Text></Text>
          <View style={styles.amountInput}><Text style={styles.dollar}>$</Text><TextInput value={amount} onChangeText={setAmount} placeholder="0.00" keyboardType="decimal-pad" maxLength={9} editable={!offline} style={styles.amountText} accessibilityLabel="Expense amount in Canadian dollars" /></View>
          <Text style={styles.helper}>CAD · up to ${MAX_AMOUNT.toLocaleString("en-CA", { minimumFractionDigits: 2 })}</Text>
        </View>
        <View style={styles.field}>
          <Text style={styles.label}>Description <Text style={styles.required}>*</Text></Text>
          <TextInput value={description} onChangeText={setDescription} placeholder="What was it for?" maxLength={160} editable={!offline} style={styles.input} returnKeyType="done" />
        </View>
        <View style={styles.field}>
          <Text style={styles.label}>Category <Text style={styles.required}>*</Text></Text>
          <View style={styles.categories}>{CATEGORIES.map((item) => {
            const selected = category === item.id;
            return <Pressable key={item.id} disabled={offline} onPress={() => setCategory(item.id)} style={[styles.category, selected && styles.categorySelected]}>
              <Text style={styles.categoryIcon}>{item.icon}</Text><Text style={[styles.categoryLabel, selected && { color: colors.greenDark }]}>{item.label}</Text>{selected ? <Text style={styles.check}>✓</Text> : null}
            </Pressable>;
          })}</View>
        </View>
        <View style={styles.field}>
          <Text style={styles.label}>Date <Text style={styles.required}>*</Text></Text>
          <Pressable disabled={offline} onPress={() => setDatePickerOpen(true)} style={styles.input}><Text style={{ color: colors.ink }}>{dateLabel(expenseDate)}  ▦</Text></Pressable>
        </View>
      </Card>
      {datePickerOpen ? <DateTimePicker value={parsedDate} mode="date" display="default" maximumDate={new Date()} onChange={onDateChange} /> : null}
      <PrimaryButton label={busy ? "Saving…" : editing ? "Save changes" : "Save expense"} onPress={() => void save()} loading={busy} disabled={offline || notCached} />
      {editing ? <SecondaryButton label="Delete expense" onPress={remove} destructive disabled={busy || offline} /> : null}
      <SecondaryButton label="Cancel" onPress={() => router.back()} />
    </Screen>
  </KeyboardAvoidingView>;
}

const styles = StyleSheet.create({
  field: { gap: 8 },
  label: { color: colors.ink, fontSize: 13, fontWeight: "700" },
  required: { color: colors.green },
  input: { minHeight: 50, borderRadius: 13, borderColor: colors.line, borderWidth: 1, paddingHorizontal: 14, justifyContent: "center", backgroundColor: "#FCFDFC", color: colors.ink, fontSize: 15 },
  amountInput: { height: 63, borderRadius: 14, borderColor: colors.line, borderWidth: 1, paddingHorizontal: 15, alignItems: "center", flexDirection: "row", backgroundColor: "#FCFDFC" },
  dollar: { color: colors.muted, fontSize: 21, marginRight: 8 },
  amountText: { flex: 1, color: colors.ink, fontSize: 27, fontWeight: "700", padding: 0 },
  helper: { color: colors.muted, fontSize: 11 },
  categories: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  category: { minWidth: "30%", flexGrow: 1, minHeight: 65, borderRadius: 13, borderWidth: 1, borderColor: colors.line, backgroundColor: "#FCFDFC", padding: 9, alignItems: "center", justifyContent: "center", gap: 4, position: "relative" },
  categorySelected: { borderColor: colors.green, backgroundColor: colors.greenTint, borderWidth: 1.5 },
  categoryIcon: { fontSize: 17 },
  categoryLabel: { color: colors.muted, fontSize: 11, fontWeight: "600" },
  check: { position: "absolute", right: 7, top: 4, color: colors.green, fontWeight: "800", fontSize: 12 },
});
