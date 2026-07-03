"use client";

import {
  hasBootstrapCache,
  readBootstrapSnapshot,
  writeBootstrapPayload,
} from "@/lib/offline/cache";
import type { BootstrapPayload, BootstrapSnapshot } from "@/lib/offline/types";

let bootstrapPromise: Promise<BootstrapSnapshot> | null = null;

async function fetchBootstrapFromNetwork(): Promise<void> {
  const response = await fetch("/api/mobile/bootstrap", {
    method: "GET",
    credentials: "include",
    cache: "no-store",
  });

  if (response.status === 401) {
    return;
  }
  if (!response.ok) {
    throw new Error(`Bootstrap failed with status ${response.status}`);
  }

  const payload = (await response.json()) as BootstrapPayload;
  await writeBootstrapPayload(payload);
}

/** Always fetch bootstrap from the server and replace the local offline cache. */
export async function refreshBootstrapCacheFromServer(): Promise<BootstrapSnapshot> {
  bootstrapPromise = null;
  await fetchBootstrapFromNetwork();
  return readBootstrapSnapshot();
}

export async function loadBootstrapSnapshot(): Promise<BootstrapSnapshot> {
  if (bootstrapPromise) {
    return bootstrapPromise;
  }

  bootstrapPromise = (async () => {
    const cached = await hasBootstrapCache();
    if (cached) {
      void fetchBootstrapFromNetwork().catch((error) => {
        console.warn("[bootstrap] background revalidate failed:", error);
      });
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
