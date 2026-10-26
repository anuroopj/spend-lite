import { useAuth, useUser } from "@clerk/expo";
import { useCallback, useEffect, useState } from "react";
import { Alert, Linking, Pressable, Text, View } from "react-native";
import * as SecureStore from "expo-secure-store";
import { Card, Heading, Notice, Screen, SecondaryButton } from "@/components/ui";
import { clearAccountCache } from "@/lib/cache";
import { getDeletionStatus, startAccountDeletion } from "@/lib/api";
import { colors } from "@/theme";

const DELETION_KEY_PREFIX = "spendlite-deletion-job-";

export default function SettingsScreen() {
  const { signOut, getToken } = useAuth();
  const { user } = useUser();
  const userId = user?.id;
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const completeDeletion = useCallback(async (jobId: string, statusToken: string) => {
    if (!userId) return;
    const key = `${DELETION_KEY_PREFIX}${userId}`;
    await SecureStore.setItemAsync(key, JSON.stringify({ jobId, statusToken }));
    setMessage("Account deletion is processing. This may take a few moments.");
    for (let attempt = 0; attempt < 25; attempt += 1) {
      try {
        const result = await getDeletionStatus(jobId, statusToken);
        if (result.status === "COMPLETE") {
          await clearAccountCache(userId);
          await SecureStore.deleteItemAsync(key);
          Alert.alert("Account deleted", "Your account and expense data have been permanently deleted.");
          await signOut();
          return;
        }
      } catch {
        // The durable server job continues retrying if the app temporarily loses connection.
      }
      await new Promise((resolve) => setTimeout(resolve, 2500));
    }
    setMessage("Deletion is still in progress. Your data is unavailable while this completes.");
    setBusy(false);
  }, [signOut, userId]);

  useEffect(() => {
    if (!userId || busy) return;
    let cancelled = false;
    void SecureStore.getItemAsync(`${DELETION_KEY_PREFIX}${userId}`).then((value) => {
      if (!value || cancelled) return;
      const stored = JSON.parse(value) as { jobId: string; statusToken: string };
      setBusy(true);
      void completeDeletion(stored.jobId, stored.statusToken);
    }).catch(() => undefined);
    return () => { cancelled = true; };
  }, [busy, completeDeletion, userId]);

  async function handleSignOut() {
    if (!userId) return;
    setBusy(true);
    try {
      await clearAccountCache(userId);
      await signOut();
    } finally { setBusy(false); }
  }

  async function handleDeleteAccount() {
    setError(null); setBusy(true);
    try {
      const job = await startAccountDeletion(getToken);
      await completeDeletion(job.jobId, job.statusToken);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Could not start account deletion.");
      setBusy(false);
    }
  }

  function confirmDelete() {
    Alert.alert("Delete your account?", "This permanently deletes your expenses and account. This action cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete account", style: "destructive", onPress: () => { void handleDeleteAccount(); } },
    ]);
  }

  const supportEmail = process.env.EXPO_PUBLIC_SUPPORT_EMAIL;
  return <Screen>
    <Heading eyebrow="YOUR SPACE" title="Settings" subtitle="Account and app information." />
    {message ? <Notice>{message}</Notice> : null}
    {error ? <Notice tone="error">{error}</Notice> : null}
    <Card>
      <Text style={{ color: colors.muted, fontSize: 11, fontWeight: "700", letterSpacing: 1, marginBottom: 14 }}>ACCOUNT</Text>
      <Text style={{ color: colors.ink, fontSize: 16, fontWeight: "700" }}>{user?.fullName || "SpendLite user"}</Text>
      <Text style={{ color: colors.muted, fontSize: 13, marginTop: 4 }}>{user?.primaryEmailAddress?.emailAddress || "Signed in"}</Text>
      <View style={{ height: 1, backgroundColor: colors.line, marginVertical: 16 }} />
      <SettingLine title="Currency" value="CAD · Canadian dollar" />
    </Card>
    <Card style={{ gap: 0 }}>
      <Text style={{ color: colors.muted, fontSize: 11, fontWeight: "700", letterSpacing: 1, marginBottom: 14 }}>PRIVACY</Text>
      <Pressable onPress={() => Alert.alert("Privacy & data", "Your expenses are private to your account and stored on the SpendLite API. Clerk handles sign-in. A small encrypted copy of pages you have loaded is kept on this device for offline viewing. Sign out or delete your account to clear the local copy. SpendLite records operational errors only; expense descriptions and amounts are excluded from logs and analytics. SpendLite does not connect to your bank, share expenses, or convert currencies.")}>
        <Text style={{ color: colors.ink, fontSize: 14, fontWeight: "600", marginBottom: 5 }}>Privacy policy and data handling  ›</Text>
      </Pressable>
      <Text style={{ color: colors.muted, fontSize: 13, lineHeight: 20 }}>Your records are tied to your account. SpendLite collects operational error information only; expense descriptions and amounts are excluded from logs and analytics.</Text>
      <View style={{ height: 1, backgroundColor: colors.line, marginVertical: 16 }} />
      <SettingLine title="App version" value="1.0.0" />
      <Pressable onPress={() => supportEmail ? void Linking.openURL(`mailto:${supportEmail}`) : Alert.alert("Support", "Support contact will be available before public release.")} style={{ paddingTop: 14 }}><SettingLine title="Support contact" value={supportEmail || "Contact support"} /></Pressable>
    </Card>
    <SecondaryButton label={busy ? "Please wait…" : "Sign out"} onPress={() => void handleSignOut()} />
    <SecondaryButton label="Delete account permanently" onPress={confirmDelete} destructive />
  </Screen>;
}

function SettingLine({ title, value }: { title: string; value: string }) {
  return <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 10 }}><Text style={{ color: colors.ink, fontSize: 13, fontWeight: "600" }}>{title}</Text><Text style={{ color: colors.muted, fontSize: 13, textAlign: "right", flexShrink: 1 }}>{value}</Text></View>;
}
