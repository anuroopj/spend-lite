import { useAuth, useUser } from "@clerk/expo";
import { Tabs, Redirect } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import { openAccountCache } from "@/lib/cache";
import { colors } from "@/theme";

const tabs = [
  { name: "home", title: "Home", icon: "⌂" },
  { name: "history", title: "History", icon: "↗" },
  { name: "breakdown", title: "Breakdown", icon: "◔" },
  { name: "settings", title: "Settings", icon: "☰" },
];

export default function AppTabs() {
  const { isLoaded, isSignedIn } = useAuth({ treatPendingAsSignedOut: false });
  const { user } = useUser();
  const [cacheReady, setCacheReady] = useState(false);
  const [cacheError, setCacheError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    if (!user?.id || !isSignedIn) return;
    openAccountCache(user.id)
      .then(() => { if (mounted) setCacheReady(true); })
      .catch((error: unknown) => { if (mounted) setCacheError(error instanceof Error ? error.message : "Could not open local cache."); });
    return () => { mounted = false; };
  }, [isSignedIn, user?.id]);

  if (!isLoaded) return <View style={{ flex: 1, justifyContent: "center" }}><ActivityIndicator color={colors.green} /></View>;
  if (!isSignedIn) return <Redirect href="/" />;
  if (cacheError) return <View style={{ flex: 1, justifyContent: "center", padding: 28 }}><Text style={{ color: colors.ink, fontSize: 17 }}>{cacheError}</Text></View>;
  if (!cacheReady) return <View style={{ flex: 1, justifyContent: "center" }}><ActivityIndicator color={colors.green} /></View>;

  return (
    <Tabs screenOptions={{
      headerShown: false,
      tabBarActiveTintColor: colors.green,
      tabBarInactiveTintColor: colors.muted,
      tabBarStyle: { height: 66, paddingTop: 7, paddingBottom: 9, borderTopColor: colors.line, backgroundColor: colors.surface },
      tabBarLabelStyle: { fontSize: 11, fontWeight: "600" },
    }}>
      {tabs.map((tab) => <Tabs.Screen key={tab.name} name={tab.name} options={{ title: tab.title, tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20, fontWeight: "600" }}>{tab.icon}</Text> }} />)}
    </Tabs>
  );
}
