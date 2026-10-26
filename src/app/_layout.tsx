import { ClerkProvider } from "@clerk/expo";
import { tokenCache } from "@clerk/expo/token-cache";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Text, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { colors } from "@/theme";

const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;

function MissingConfiguration() {
  return (
    <SafeAreaProvider>
      <View style={{ flex: 1, justifyContent: "center", padding: 28, backgroundColor: colors.paper }}>
        <Text style={{ color: colors.ink, fontSize: 25, fontWeight: "700", marginBottom: 10 }}>SpendLite</Text>
        <Text style={{ color: colors.muted, fontSize: 15, lineHeight: 23 }}>
          Add EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY to your local environment to connect authentication.
        </Text>
      </View>
    </SafeAreaProvider>
  );
}

export default function RootLayout() {
  if (!publishableKey) return <MissingConfiguration />;

  return (
    <ClerkProvider publishableKey={publishableKey} tokenCache={tokenCache}>
      <SafeAreaProvider>
        <StatusBar style="dark" />
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.paper } }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="(app)" />
          <Stack.Screen name="expense/new" options={{ presentation: "modal" }} />
          <Stack.Screen name="expense/[id]" options={{ presentation: "modal" }} />
        </Stack>
      </SafeAreaProvider>
    </ClerkProvider>
  );
}
