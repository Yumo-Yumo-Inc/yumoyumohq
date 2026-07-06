/**
 * DELETE queries for receipts
 * SERVER-ONLY: Do not import in client components
 */

import { db, sql } from "@/lib/db/client";
import { getReceiptById as getReceiptByIdFile, deleteReceipt as deleteReceiptFile } from "../../storage";
import { isDatabaseAvailable } from "../connection";
import { deleteOtherExpenseReceipt } from "../other-expense";
import { deleteReceiptImageArtifacts } from "@/lib/scheduled-deletion";

/**
 * Remove dependent rows so `DELETE FROM receipts` does not fail on FK constraints
 * (pending / partially processed receipts may have line items, vision, rewards, etc.).
 */
async function deleteReceiptChildRows(receiptId: string): Promise<void> {
  const run = async (q: string) => {
    try {
      await db.query(q, [receiptId]);
    } catch (e: unknown) {
      const code = (e as { code?: string })?.code;
      if (code === "42P01" || code === "42703") {
        return;
      }
      console.warn(`[storage-db] child delete (non-fatal):`, (e as Error)?.message ?? e);
    }
  };

  // Order: leaf / dependent tables first; ignore missing tables in older DBs
  for (const q of [
    "DELETE FROM receipt_line_items WHERE receipt_id = $1",
    "DELETE FROM receipt_canonical WHERE receipt_id = $1",
    "DELETE FROM receipt_rewards WHERE receipt_id = $1",
    "DELETE FROM receipt_quality WHERE receipt_id = $1",
    "DELETE FROM referral_reward_log WHERE receipt_id = $1",
    "DELETE FROM receipt_ocr_lines WHERE receipt_id = $1",
    "DELETE FROM receipt_breakdown_items WHERE receipt_id = $1",
    "DELETE FROM receipt_flags_reasons WHERE receipt_id = $1",
    "DELETE FROM receipt_vision_raw WHERE receipt_id = $1",
    "DELETE FROM receipt_vision_pending WHERE receipt_id = $1",
    "DELETE FROM receipt_upload_fallback WHERE receipt_id = $1",
    "DELETE FROM user_notifications WHERE receipt_id = $1",
    "DELETE FROM receipt_feedback WHERE receipt_id = $1",
    "DELETE FROM scheduled_deletions WHERE receipt_id = $1",
  ]) {
    await run(q);
  }

  await run(
    "DELETE FROM account_xp_events WHERE reference_id = $1 AND source_type = 'receipt_verified'"
  );
  await run(
    "DELETE FROM season_xp_events WHERE reference_id = $1 AND source_type = 'receipt_verified'"
  );
}

export async function deleteReceipt(
  receiptId: string,
  username: string,
  isAdmin: boolean = false
): Promise<boolean> {
  if (!isDatabaseAvailable() || !sql) {
    const receipt = await getReceiptByIdFile(receiptId);
    if (!receipt) {
      return false;
    }
    if (!isAdmin && receipt.username !== username) {
      return false;
    }
    return deleteReceiptFile(receiptId);
  }

  const dbSql = sql;

  try {
    const rows = await dbSql`
      SELECT username 
      FROM receipts 
      WHERE receipt_id = ${receiptId}
      LIMIT 1
    `;
    
    if (rows.length === 0) {
      return deleteOtherExpenseReceipt(receiptId, username, isAdmin);
    }
    
    if (!isAdmin && rows[0].username !== username) {
      return false;
    }
    
    const targetUsername = String(rows[0].username ?? "");

    // Physically remove image artifacts (Vercel Blob / Neon fallback / local
    // disk) before the scheduled_deletions row disappears with the child rows —
    // otherwise the blob would be orphaned with no pending deletion left.
    await deleteReceiptImageArtifacts(receiptId).catch(() => {});

    await deleteReceiptChildRows(receiptId);

    await dbSql`
      INSERT INTO receipt_sync_deletions (receipt_id, username, deleted_at, version)
      VALUES (${receiptId}, ${targetUsername}, NOW(), EXTRACT(EPOCH FROM NOW())::bigint * 1000)
      ON CONFLICT (receipt_id) DO UPDATE SET
        username = EXCLUDED.username,
        deleted_at = EXCLUDED.deleted_at,
        version = EXCLUDED.version
    `;

    await dbSql`
      DELETE FROM receipts 
      WHERE receipt_id = ${receiptId}
    `;

    await deleteOtherExpenseReceipt(receiptId, targetUsername, isAdmin).catch(() => false);

    console.log(`[storage-db] Receipt deleted from database: ${receiptId}${isAdmin ? " (admin)" : ""}`);
    return true;
  } catch (error) {
    console.error("[storage-db] Failed to delete receipt from database:", error);
    const receipt = await getReceiptByIdFile(receiptId);
    if (!receipt) {
      return false;
    }
    if (!isAdmin && receipt.username !== username) {
      return false;
    }
    return deleteReceiptFile(receiptId);
  }
}
