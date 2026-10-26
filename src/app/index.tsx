import { useAuth } from "@clerk/expo";
import { AuthView } from "@clerk/expo/native-components";
import { Redirect } from "expo-router";
import { ActivityIndicator, Text, View } from "react-native";
import { colors } from "@/theme";

export default function EntryScreen() {
  const { isLoaded, isSignedIn } = useAuth({ treatPendingAsSignedOut: false });
  if (!isLoaded) return <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}><ActivityIndicator color={colors.green} /></View>;
  if (isSignedIn) return <Redirect href="/home" />;
  return (
    <View style={{ flex: 1, backgroundColor: colors.paper, paddingHorizontal: 24, paddingTop: 72 }}>
      <Text style={{ color: colors.green, fontSize: 13, fontWeight: "700", letterSpacing: 2, marginBottom: 12 }}>SPENDLITE</Text>
      <Text style={{ color: colors.ink, fontSize: 34, fontWeight: "700", lineHeight: 40, marginBottom: 8 }}>A clearer view of your spending.</Text>
      <Text style={{ color: colors.muted, fontSize: 16, lineHeight: 23, marginBottom: 24 }}>Simple, private expense tracking. All amounts in Canadian dollars.</Text>
      <AuthView isDismissible={false} />
    </View>
  );
}
