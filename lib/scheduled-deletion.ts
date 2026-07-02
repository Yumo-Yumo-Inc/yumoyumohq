/**
 * Scheduled Deletion Service
 * 
 * Handles scheduling and processing automatic deletion of receipt images
 * from Vercel Blob Storage after 48 hours.
 * 
 * SERVER-ONLY: Do not import in client components
 */

import { getSql } from "@/lib/db/client";
import { del } from "@vercel/blob";

// Default deletion delay: 48 hours
const DEFAULT_DELETION_DELAY_MS = 48 * 60 * 60 * 1000;

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

  const blobToken = process.env.BLOB_READ_WRITE_TOKEN;
  if (!blobToken) {
    console.error("[scheduled-deletion] BLOB_READ_WRITE_TOKEN not set");
    result.errors.push("BLOB_READ_WRITE_TOKEN not configured");
    return result;
  }

  const pendingDeletions = await getPendingDeletions(50); // Process 50 at a time
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
      // Delete from Vercel Blob Storage
      await del(deletion.blob_url, { token: blobToken });
      
      // Mark as deleted
      await markAsDeleted(deletion.id);
      result.deleted++;
      
      console.log(`[scheduled-deletion] Deleted blob for receipt ${deletion.receipt_id}`);
    } catch (error: any) {
      const errorMsg = error.message || String(error);
      result.failed++;
      result.errors.push(`${deletion.receipt_id}: ${errorMsg}`);
      
      // Mark as failed (will retry if attempts < 3)
      await markAsFailed(deletion.id, errorMsg);
      
      console.error(`[scheduled-deletion] Failed to delete blob for receipt ${deletion.receipt_id}:`, errorMsg);
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
