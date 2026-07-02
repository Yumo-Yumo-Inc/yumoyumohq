"use client";

import {
  hasBootstrapCache,
  readBootstrapSnapshot,
  writeBootstrapPayload,
} from "@/lib/offline/cache";
import type { BootstrapPayload, BootstrapSnapshot } from "@/lib/offline/types";

let bootstrapPromise: Promise<BootstrapSnapshot> | null = null;

export async function loadBootstrapSnapshot(): Promise<BootstrapSnapshot> {
  if (bootstrapPromise) {
    return bootstrapPromise;
  }

  bootstrapPromise = (async () => {
    const cached = await hasBootstrapCache();
    if (cached) {
      return readBootstrapSnapshot();
    }

    const response = await fetch("/api/mobile/bootstrap", {
      method: "GET",
      credentials: "include",
      cache: "no-store",
    });

    if (response.status === 401) {
      return readBootstrapSnapshot();
    }
    if (!response.ok) {
      throw new Error(`Bootstrap failed with status ${response.status}`);
    }

    const payload = (await response.json()) as BootstrapPayload;
    await writeBootstrapPayload(payload);
    return readBootstrapSnapshot();
  })();

  try {
    return await bootstrapPromise;
  } finally {
    bootstrapPromise = null;
  }
}
