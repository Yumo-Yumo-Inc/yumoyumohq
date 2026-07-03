"use client";

import { refreshBootstrapCacheFromServer } from "@/lib/bootstrap";
import { clearOfflineSessionCache } from "@/lib/offline/cache";

/** Wipe offline stores after logout so the next session never reads stale data. */
export async function clearAuthenticatedSessionCache(): Promise<void> {
  await clearOfflineSessionCache();
}

/** After login: clear any prior session cache, then hydrate from the server. */
export async function prepareAuthenticatedSessionCache(): Promise<void> {
  await clearOfflineSessionCache();
  await refreshBootstrapCacheFromServer();
}
