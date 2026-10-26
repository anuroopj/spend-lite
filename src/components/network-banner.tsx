import { useNetworkState } from "expo-network";
import { Notice } from "./ui";

export function useIsOffline() {
  const network = useNetworkState();
  return network.isConnected === false || network.isInternetReachable === false;
}

export function NetworkBanner({ syncedAt }: { syncedAt: string | null }) {
  const offline = useIsOffline();
  if (!offline) return null;
  const synced = syncedAt ? new Intl.DateTimeFormat("en-CA", { hour: "numeric", minute: "2-digit" }).format(new Date(syncedAt)) : "not synced yet";
  return <Notice tone="offline">Offline — last synced {synced}. Showing records already loaded on this device.</Notice>;
}
