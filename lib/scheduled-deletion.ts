/**
 * Scheduled Deletion Service
 *
 * Handles scheduling and processing automatic deletion of receipt images
 * after 48 hours, across every storage backend the upload route can use:
 * Vercel Blob, the Neon `receipt_upload_fallback` table, and local disk.
 *
 * The storage kind is encoded in the `blob_url` column so no schema change
 * is needed: a real https URL means Vercel Blob, `neon-fallback://<id>`
 * means the Neon table, `local-disk://<id>` means local disk files.
 *
 * Once the image artifacts are gone, the raw extraction data for the receipt
 * (Vision JSON, OCR lines) is purged too — structured receipt_data stays.
 *
 * SERVER-ONLY: Do not import in client components
 */

import { getSql } from "@/lib/db/client";
import { del, list } from "@vercel/blob";
import { unlink, readdir } from "fs/promises";
import path from "path";
import { getReceiptUploadDir } from "@/lib/receipt/upload-dir";

// Default deletion delay: 48 hours
const DEFAULT_DELETION_DELAY_MS = 48 * 60 * 60 * 1000;

export const NEON_FALLBACK_URL_PREFIX = "neon-fallback://";
export const LOCAL_DISK_URL_PREFIX = "local-disk://";

/** Sentinel `blob_url` for images stored in receipt_upload_fallback. */
export function neonFallbackDeletionUrl(receiptId: string): string {
  return `${NEON_FALLBACK_URL_PREFIX}${receiptId}`;
}

/** Sentinel `blob_url` for images stored on local disk. */
export function localDiskDeletionUrl(receiptId: string): string {
  return `${LOCAL_DISK_URL_PREFIX}${receiptId}`;
}

export interface ScheduledDeletion {
  id: number;
  receipt_id: string;
  blob_url: string;
  delete_at: Date;
  status: 'pending' | 'processing' | 'deleted' | 'failed' | 'cancelled';
  attempts: number;
  last_error: string | null;
  created_at: Date;
  processed_at: Date | null;
}

/**
 * Schedule a blob for deletion after a delay
 * @param receiptId - The receipt ID (UUID)
 * @param blobUrl - The full Vercel Blob URL
 * @param delayMs - Delay in milliseconds (default: 48 hours)
 */
export async function scheduleDeletion(
  receiptId: string,
  blobUrl: string,
  delayMs: number = DEFAULT_DELETION_DELAY_MS
): Promise<boolean> {
  const sql = getSql();
  if (!sql) {
    console.error("[scheduled-deletion] Database connection not available");
    return false;
  }

  try {
    const deleteAt = new Date(Date.now() + delayMs);
    
    await sql`
      INSERT INTO scheduled_deletions (receipt_id, blob_url, delete_at, status)
      VALUES (${receiptId}, ${blobUrl}, ${deleteAt}, 'pending')
      ON CONFLICT (receipt_id) 
      DO UPDATE SET 
        blob_url = EXCLUDED.blob_url,
        delete_at = EXCLUDED.delete_at,
        status = 'pending',
        attempts = 0,
        last_error = NULL
    `;
    
    console.log(`[scheduled-deletion] ⏰ Scheduled deletion for receipt ${receiptId} at ${deleteAt.toISOString()}`);
    return true;
  } catch (error: any) {
    console.error("[scheduled-deletion] Failed to schedule deletion:", error.message);
    return false;
  }
}

/**
 * Cancel a scheduled deletion (e.g., if user deletes receipt manually)
 * @param receiptId - The receipt ID to cancel deletion for
 */
export async function cancelScheduledDeletion(receiptId: string): Promise<boolean> {
  const sql = getSql();
  if (!sql) return false;

  try {
    await sql`
      UPDATE scheduled_deletions 
      SET status = 'cancelled', processed_at = NOW()
      WHERE receipt_id = ${receiptId} AND status = 'pending'
    `;
    console.log(`[scheduled-deletion] Cancelled scheduled deletion for receipt ${receiptId}`);
    return true;
  } catch (error: any) {
    console.error("[scheduled-deletion] Failed to cancel deletion:", error.message);
    return false;
  }
}

/**
 * Get all pending deletions that are due
 * @param limit - Maximum number of records to fetch
 */
export async function getPendingDeletions(limit: number = 100): Promise<ScheduledDeletion[]> {
  const sql = getSql();
  if (!sql) return [];

  try {
    const result = await sql`
      SELECT * FROM scheduled_deletions
      WHERE status = 'pending' AND delete_at <= NOW()
      ORDER BY delete_at ASC
      LIMIT ${limit}
    `;
    return result as ScheduledDeletion[];
  } catch (error: any) {
    console.error("[scheduled-deletion] Failed to get pending deletions:", error.message);
    return [];
  }
}

/**
 * Mark a deletion as processing (to prevent duplicate processing)
 */
export async function markAsProcessing(id: number): Promise<boolean> {
  const sql = getSql();
  if (!sql) return false;

  try {
    const result = await sql`
      UPDATE scheduled_deletions 
      SET status = 'processing', attempts = attempts + 1
      WHERE id = ${id} AND status = 'pending'
      RETURNING id
    `;
    return result.length > 0;
  } catch (error: any) {
    console.error("[scheduled-deletion] Failed to mark as processing:", error.message);
    return false;
  }
}

/**
 * Mark a deletion as completed
 */
export async function markAsDeleted(id: number): Promise<void> {
  const sql = getSql();
  if (!sql) return;

  try {
    await sql`
      UPDATE scheduled_deletions 
      SET status = 'deleted', processed_at = NOW()
      WHERE id = ${id}
    `;
  } catch (error: any) {
    console.error("[scheduled-deletion] Failed to mark as deleted:", error.message);
  }
}

/**
 * Mark a deletion as failed with error message
 */
export async function markAsFailed(id: number, errorMessage: string): Promise<void> {
  const sql = getSql();
  if (!sql) return;

  try {
    await sql`
      UPDATE scheduled_deletions 
      SET status = CASE WHEN attempts >= 3 THEN 'failed' ELSE 'pending' END,
          last_error = ${errorMessage},
          processed_at = CASE WHEN attempts >= 3 THEN NOW() ELSE NULL END
      WHERE id = ${id}
    `;
  } catch (error: any) {
    console.error("[scheduled-deletion] Failed to mark as failed:", error.message);
  }
}

/**
 * Delete every Vercel Blob stored under receipts/<receiptId> (main + .full variant).
 * Falls back to deleting the stored URL directly if listing is unavailable.
 */
async function deleteVercelBlobs(receiptId: string, blobUrl: string | null): Promise<void> {
  const blobToken = process.env.BLOB_READ_WRITE_TOKEN;
  if (!blobToken) {
    throw new Error("BLOB_READ_WRITE_TOKEN not configured");
  }

  const urls = new Set<string>();
  if (blobUrl && blobUrl.startsWith("http")) urls.add(blobUrl);
  try {
    const listed = await list({ prefix: `receipts/${receiptId}`, token: blobToken });
    for (const blob of listed.blobs) urls.add(blob.url);
  } catch (error: any) {
    console.warn(`[scheduled-deletion] Blob list failed for ${receiptId} (deleting stored URL only):`, error?.message);
  }

  for (const url of urls) {
    await del(url, { token: blobToken });
  }
}

/** Delete the Neon receipt_upload_fallback row for a receipt. */
async function deleteNeonFallbackImage(receiptId: string): Promise<void> {
  const sql = getSql();
  if (!sql) throw new Error("Database connection not available");
  await sql`DELETE FROM receipt_upload_fallback WHERE receipt_id = ${receiptId}`;
}

/** Delete local-disk image files (receiptId.<ext> and receiptId.full.<ext>). */
async function deleteLocalDiskImages(receiptId: string): Promise<void> {
  const uploadDir = getReceiptUploadDir();
  let entries: string[] = [];
  try {
    entries = await readdir(uploadDir);
  } catch {
    return; // Directory absent — nothing stored locally
  }
  for (const entry of entries) {
    if (entry === receiptId || entry.startsWith(`${receiptId}.`)) {
      await unlink(path.join(uploadDir, entry)).catch(() => {});
    }
  }
}

/**
 * Delete the image artifacts for one receipt based on the storage kind
 * encoded in `blob_url`. Throws on failure so the caller can retry.
 */
async function deleteImageArtifacts(receiptId: string, blobUrl: string | null): Promise<void> {
  if (blobUrl?.startsWith(NEON_FALLBACK_URL_PREFIX)) {
    await deleteNeonFallbackImage(receiptId);
  } else if (blobUrl?.startsWith(LOCAL_DISK_URL_PREFIX)) {
    await deleteLocalDiskImages(receiptId);
  } else {
    await deleteVercelBlobs(receiptId, blobUrl);
  }
}

/**
 * Purge raw extraction data once the image is gone: Vision JSON copies and
 * OCR lines. Structured receipt_data, line items, rewards and fraud records
 * stay. Each statement is guarded so missing tables/columns are ignored.
 */
export async function purgeRawExtraction(receiptId: string): Promise<void> {
  const sql = getSql();
  if (!sql) return;

  const run = async (fn: () => Promise<unknown>) => {
    try {
      await fn();
    } catch (e: unknown) {
      const code = (e as { code?: string })?.code;
      if (code === "42P01" || code === "42703") return; // missing table/column
      console.warn("[scheduled-deletion] raw-extraction purge (non-fatal):", (e as Error)?.message ?? e);
    }
  };

  await run(() => sql`DELETE FROM receipt_ocr_lines WHERE receipt_id = ${receiptId}`);
  await run(() => sql`DELETE FROM receipt_vision_raw WHERE receipt_id = ${receiptId}`);
  await run(() => sql`DELETE FROM receipt_vision_pending WHERE receipt_id = ${receiptId}`);
  await run(
    () =>
      sql`UPDATE receipts SET vision_json = NULL, ocr_raw_text = NULL, receipt_data = (receipt_data - 'visionRawJson') - 'ocrRawText' WHERE receipt_id = ${receiptId}`
  );
}

/**
 * Immediately delete a receipt's image artifacts across all storage backends.
 * Best-effort: used by manual receipt deletion, never throws.
 */
export async function deleteReceiptImageArtifacts(receiptId: string): Promise<void> {
  const sql = getSql();
  let blobUrl: string | null = null;
  if (sql) {
    try {
      const rows = await sql`SELECT blob_url FROM scheduled_deletions WHERE receipt_id = ${receiptId} LIMIT 1`;
      blobUrl = (rows[0] as { blob_url?: string } | undefined)?.blob_url ?? null;
    } catch {
      // scheduled_deletions missing or unreadable — still try all backends below
    }
  }

  // A receipt may have artifacts in more than one backend (e.g. blob upload
  // succeeded after a fallback write), so sweep all three regardless of kind.
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    await deleteVercelBlobs(receiptId, blobUrl?.startsWith("http") ? blobUrl : null).catch((e) =>
      console.warn(`[scheduled-deletion] Manual blob delete failed for ${receiptId}:`, e?.message)
    );
  }
  await deleteNeonFallbackImage(receiptId).catch(() => {});
  await deleteLocalDiskImages(receiptId).catch(() => {});
}

/**
 * Process all pending deletions
 * Called by cron job
 * @returns Summary of processed deletions
 */
export async function processPendingDeletions(): Promise<{
  total: number;
  deleted: number;
  failed: number;
  errors: string[];
}> {
  const result = {
    total: 0,
    deleted: 0,
    failed: 0,
    errors: [] as string[]
  };

  const pendingDeletions = await getPendingDeletions(150); // Batch size per hourly run — sized to drain the 48h-backfill backlog within days while staying inside the cron function's time budget
  result.total = pendingDeletions.length;

  console.log(`[scheduled-deletion] 🔄 Processing ${pendingDeletions.length} pending deletions...`);

  for (const deletion of pendingDeletions) {
    // Mark as processing to prevent duplicate processing
    const acquired = await markAsProcessing(deletion.id);
    if (!acquired) {
      console.log(`[scheduled-deletion] Skipping ${deletion.receipt_id} - already being processed`);
      continue;
    }

    try {
      await deleteImageArtifacts(deletion.receipt_id, deletion.blob_url);
      await purgeRawExtraction(deletion.receipt_id);

      // Mark as deleted
      await markAsDeleted(deletion.id);
      result.deleted++;

      console.log(`[scheduled-deletion] Deleted image artifacts for receipt ${deletion.receipt_id}`);
    } catch (error: any) {
      const errorMsg = error.message || String(error);
      result.failed++;
      result.errors.push(`${deletion.receipt_id}: ${errorMsg}`);

      // Mark as failed (will retry if attempts < 3)
      await markAsFailed(deletion.id, errorMsg);

      console.error(`[scheduled-deletion] Failed to delete image artifacts for receipt ${deletion.receipt_id}:`, errorMsg);
    }
  }

  console.log(`[scheduled-deletion] 📊 Summary: ${result.deleted} deleted, ${result.failed} failed out of ${result.total} total`);
  return result;
}

/**
 * Get deletion statistics
 */
export async function getDeletionStats(): Promise<{
  pending: number;
  deleted: number;
  failed: number;
  cancelled: number;
}> {
  const sql = getSql();
  if (!sql) return { pending: 0, deleted: 0, failed: 0, cancelled: 0 };

  try {
    const result = await sql`
      SELECT 
        status,
        COUNT(*) as count
      FROM scheduled_deletions
      GROUP BY status
    `;
    
    const stats = { pending: 0, deleted: 0, failed: 0, cancelled: 0 };
    for (const row of result as any[]) {
      if (row.status in stats) {
        stats[row.status as keyof typeof stats] = parseInt(row.count);
      }
    }
    return stats;
  } catch (error: any) {
    console.error("[scheduled-deletion] Failed to get stats:", error.message);
    return { pending: 0, deleted: 0, failed: 0, cancelled: 0 };
  }
}
