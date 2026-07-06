"use client";

/**
 * Device-local receipt photo cache (IndexedDB, `receipt_images` store).
 *
 * The photo is written once after a successful upload on this device and read
 * by the receipt detail view before falling back to the server image endpoint.
 * Server retention stays short (see lib/scheduled-deletion.ts); the user's own
 * device keeps the copy they scanned.
 */

import { localDb } from "@/lib/local-db";
import type { CachedReceiptImageRecord } from "@/lib/offline/types";

// Keep the cache bounded: newest MAX_CACHED_IMAGES receipts, oldest evicted.
const MAX_CACHED_IMAGES = 40;

export async function saveLocalReceiptImage(receiptId: string, file: Blob): Promise<void> {
  if (!receiptId || !file || file.size === 0) return;
  try {
    const record: CachedReceiptImageRecord = {
      id: receiptId,
      updated_at: new Date().toISOString(),
      version: Date.now(),
      blob: file,
      contentType: file.type || "image/jpeg",
      sizeBytes: file.size,
    };
    await localDb.set("receipt_images", record);
    await evictOldImages();
  } catch (error) {
    console.warn("[receipt-images] Failed to cache receipt image locally:", error);
  }
}

export async function getLocalReceiptImage(receiptId: string): Promise<Blob | null> {
  if (!receiptId) return null;
  try {
    const record = await localDb.get("receipt_images", receiptId);
    return record?.blob instanceof Blob && record.blob.size > 0 ? record.blob : null;
  } catch {
    return null;
  }
}

export async function deleteLocalReceiptImage(receiptId: string): Promise<void> {
  if (!receiptId) return;
  await localDb.delete("receipt_images", receiptId).catch(() => {});
}

async function evictOldImages(): Promise<void> {
  const records = await localDb.list("receipt_images");
  if (records.length <= MAX_CACHED_IMAGES) return;
  const oldestFirst = [...records].sort((a, b) => a.updated_at.localeCompare(b.updated_at));
  const excess = oldestFirst.slice(0, records.length - MAX_CACHED_IMAGES);
  for (const record of excess) {
    await localDb.delete("receipt_images", record.id).catch(() => {});
  }
}
