"use client";

import {
  hasBootstrapCache,
  readBootstrapSnapshot,
  writeBootstrapPayload,
} from "@/lib/offline/cache";
import type { BootstrapPayload, BootstrapSnapshot } from "@/lib/offline/types";

const BOOTSTRAP_FRESH_SESSION_KEY = "yumo:bootstrap-fresh";

let bootstrapPromise: Promise<BootstrapSnapshot> | null = null;

// Background revalidation must be time-throttled, not per-call: every offline
// query fn calls loadBootstrapSnapshot, and each network fetch rewrites the
// local cache, which fires a local-db change event, which invalidates those
// queries, which call loadBootstrapSnapshot again — an infinite fetch loop.
let lastRevalidateStartedAt = 0;
const REVALIDATE_MIN_INTERVAL_MS = 60_000;

type FetchBootstrapOptions = {
  requireAuth?: boolean;
};

async function fetchBootstrapFromNetwork(options?: FetchBootstrapOptions): Promise<void> {
  const response = await fetch("/api/mobile/bootstrap", {
    method: "GET",
    credentials: "include",
    cache: "no-store",
  });

  if (response.status === 401) {
    if (options?.requireAuth) {
      throw new Error("Bootstrap unauthorized");
    }
    return;
  }
  if (!response.ok) {
    throw new Error(`Bootstrap failed with status ${response.status}`);
  }

  const payload = (await response.json()) as BootstrapPayload;
  await writeBootstrapPayload(payload);
}

export function markBootstrapFreshForNextLoad(): void {
  if (typeof sessionStorage === "undefined") return;
  sessionStorage.setItem(BOOTSTRAP_FRESH_SESSION_KEY, "1");
}

/** Always fetch bootstrap from the server and replace the local offline cache. */
export async function refreshBootstrapCacheFromServer(
  options?: FetchBootstrapOptions
): Promise<BootstrapSnapshot> {
  bootstrapPromise = null;
  lastRevalidateStartedAt = Date.now();
  await fetchBootstrapFromNetwork(options);
  return readBootstrapSnapshot();
}

export async function loadBootstrapSnapshot(): Promise<BootstrapSnapshot> {
  if (bootstrapPromise) {
    return bootstrapPromise;
  }

  bootstrapPromise = (async () => {
    const forceFresh =
      typeof sessionStorage !== "undefined" &&
      sessionStorage.getItem(BOOTSTRAP_FRESH_SESSION_KEY) === "1";

    if (forceFresh) {
      sessionStorage.removeItem(BOOTSTRAP_FRESH_SESSION_KEY);
      await refreshBootstrapCacheFromServer({ requireAuth: true });
      return readBootstrapSnapshot();
    }

    const cached = await hasBootstrapCache();
    if (cached) {
      if (Date.now() - lastRevalidateStartedAt >= REVALIDATE_MIN_INTERVAL_MS) {
        lastRevalidateStartedAt = Date.now();
        void fetchBootstrapFromNetwork().catch((error) => {
          console.warn("[bootstrap] background revalidate failed:", error);
        });
      }
      return readBootstrapSnapshot();
    }

    await fetchBootstrapFromNetwork();
    return readBootstrapSnapshot();
  })();

  try {
    return await bootstrapPromise;
  } finally {
    bootstrapPromise = null;
  }
}
