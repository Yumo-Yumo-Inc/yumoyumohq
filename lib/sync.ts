"use client";

import { applySyncPayload } from "@/lib/offline/cache";
import { getMetaValue } from "@/lib/local-db";
import {
  LAST_SYNC_META_ID,
  type SyncPayload,
} from "@/lib/offline/types";
import {
  readReceiptHistorySyncState,
  writeReceiptHistorySyncState,
} from "@/lib/offline/cache";
import { createReceiptRecordFromApiReceipt } from "@/lib/offline/receipt-cache";
import { localDb } from "@/lib/local-db";
import type { ReceiptAnalysis } from "@/lib/receipt/types";

let syncPromise: Promise<SyncPayload | null> | null = null;
let historyHydrationPromise: Promise<void> | null = null;
const HISTORY_PAGE_SIZE = 100;
const MIN_SYNC_INTERVAL_MS = 15_000;
const AUTH_RETRY_BACKOFF_MS = 5_000;
let lastSyncStartedAt = 0;
let authRetryAfter = 0;

/**
 * @param options.fullProfile  Send `last_sync_at = null` so the server returns the
 *                             full payload (used after destructive actions where
 *                             a delta might miss new rows). This controls PAYLOAD
 *                             SHAPE only — it no longer bypasses the throttle.
 * @param options.force        Bypass the {@link MIN_SYNC_INTERVAL_MS} throttle.
 *                             Use sparingly — only for explicit user-driven
 *                             refresh actions (pull-to-refresh, login, etc.).
 *                             Action handlers that already update IndexedDB
 *                             optimistically should NOT set this.
 */
export async function syncMobileData(options?: {
  fullProfile?: boolean;
  force?: boolean;
}): Promise<SyncPayload | null> {
  const now = Date.now();
  if (syncPromise) {
    return syncPromise;
  }
  if (now < authRetryAfter) {
    return null;
  }
  if (!options?.force && now - lastSyncStartedAt < MIN_SYNC_INTERVAL_MS) {
    return null;
  }

  const nextSyncPromise = (async () => {
    lastSyncStartedAt = Date.now();
    const lastSyncAt = await getMetaValue(LAST_SYNC_META_ID);
    const response = await fetch("/api/mobile/sync", {
      method: "POST",
      credentials: "include",
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ last_sync_at: options?.fullProfile ? null : lastSyncAt }),
    });

    if (response.status === 401) {
      authRetryAfter = Date.now() + AUTH_RETRY_BACKOFF_MS;
      return null;
    }
    if (!response.ok) {
      throw new Error(`Sync failed with status ${response.status}`);
    }

    const payload = (await response.json()) as SyncPayload;
    authRetryAfter = 0;
    await applySyncPayload(payload);
    return payload;
  })();

  syncPromise = nextSyncPromise;

  try {
    return await nextSyncPromise;
  } finally {
    syncPromise = null;
  }
}

export async function hydrateReceiptHistoryInBackground(): Promise<void> {
  if (historyHydrationPromise) {
    return historyHydrationPromise;
  }

  historyHydrationPromise = (async () => {
    const state = await readReceiptHistorySyncState();
    if (state.complete) {
      return;
    }

    let currentPage = state.nextPage;
    await writeReceiptHistorySyncState({ complete: false, nextPage: currentPage });

    while (true) {
      const response = await fetch(
        `/api/receipts?page=${currentPage}&pageSize=${HISTORY_PAGE_SIZE}`,
        {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        }
      );

      if (response.status === 401) {
        return;
      }
      if (!response.ok) {
        throw new Error(`History hydration failed with status ${response.status}`);
      }

      const body = (await response.json()) as {
        receipts?: Array<Partial<ReceiptAnalysis> & { receiptId?: string }>;
        pagination?: { totalPages?: number; total?: number; page?: number };
      };

      const receiptRecords = (body.receipts ?? [])
        .filter((receipt): receipt is Partial<ReceiptAnalysis> & { receiptId: string } =>
          typeof receipt?.receiptId === "string" && receipt.receiptId.trim().length > 0
        )
        .map((receipt) => createReceiptRecordFromApiReceipt(receipt));

      const toWrite = [];
      for (const record of receiptRecords) {
        const existing = await localDb.get("receipts", record.id);
        if (!existing || record.version > existing.version) {
          toWrite.push(record);
        }
      }
      if (toWrite.length > 0) {
        await localDb.bulkSet("receipts", toWrite);
      }

      const totalPages = Math.max(1, Number(body.pagination?.totalPages ?? 1) || 1);
      const isComplete = currentPage >= totalPages || receiptRecords.length === 0;
      const nextPage = isComplete ? currentPage : currentPage + 1;

      await writeReceiptHistorySyncState({
        nextPage,
        complete: isComplete,
        hydratedAt: isComplete ? new Date().toISOString() : undefined,
      });

      if (isComplete) {
        return;
      }

      currentPage += 1;
    }
  })();

  try {
    await historyHydrationPromise;
  } finally {
    historyHydrationPromise = null;
  }
}
