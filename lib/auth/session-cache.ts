"use client";

import { markBootstrapFreshForNextLoad, refreshBootstrapCacheFromServer } from "@/lib/bootstrap";
import { clearOfflineSessionCache } from "@/lib/offline/cache";
import {
  resetSessionAccountCountry,
  syncSessionAccountCountryToCache,
} from "@/lib/auth/account-country";

const BOOTSTRAP_RETRY_ATTEMPTS = 4;
const BOOTSTRAP_RETRY_BASE_MS = 150;

async function refreshBootstrapWithRetry(): Promise<void> {
  let lastError: unknown;
  for (let attempt = 0; attempt < BOOTSTRAP_RETRY_ATTEMPTS; attempt++) {
    try {
      await refreshBootstrapCacheFromServer({ requireAuth: true });
      return;
    } catch (error) {
      lastError = error;
      if (attempt < BOOTSTRAP_RETRY_ATTEMPTS - 1) {
        await new Promise((resolve) => {
          window.setTimeout(resolve, BOOTSTRAP_RETRY_BASE_MS * (attempt + 1));
        });
      }
    }
  }
  throw lastError instanceof Error ? lastError : new Error("Bootstrap refresh failed");
}

/** Wipe offline stores after logout so the next session never reads stale data. */
export async function clearAuthenticatedSessionCache(): Promise<void> {
  resetSessionAccountCountry();
  await clearOfflineSessionCache();
}

/** After login: clear any prior session cache, then hydrate from the server. */
export async function prepareAuthenticatedSessionCache(): Promise<void> {
  resetSessionAccountCountry();
  await clearOfflineSessionCache();
  markBootstrapFreshForNextLoad();
  await refreshBootstrapWithRetry();
  const country = await syncSessionAccountCountryToCache();
  if (!country) {
    throw new Error("Account country hydration failed");
  }
}
