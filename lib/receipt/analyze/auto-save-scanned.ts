import { insertReceipt } from "@/lib/receipt/db/queries/insert";
import type { ReceiptAnalysis } from "@/lib/receipt/types";
import { getSql, warmUpConnection } from "@/lib/db/client";
import { upsertOtherExpenseReceipt } from "@/lib/receipt/db/other-expense";
import { persistReceiptProofFields } from "@/lib/receipt/db/persist-proof-fields";

export async function autoSaveScannedReceipt(
  username: string | undefined,
  payload: Record<string, unknown>,
  options?: { isAdmin?: boolean; skipPostProcess?: boolean }
) : Promise<void> {
  if (!username) {
    console.warn("[Pipeline] Auto-save skipped: username missing");
    return;
  }

  const data: ReceiptAnalysis = {
    ...(payload as unknown as ReceiptAnalysis),
    username,
    status: "scanned",
    createdAt: new Date().toISOString(),
  };
  const isOtherExpense = data.expenseType === "other";

  // Allow the same receipt to be reprocessed repeatedly in local/admin test
  // flows by bypassing the duplicate-hash unique constraint.
  if (options?.isAdmin) {
    (data as any).receiptHash = null;
    (data as any).imagePhash = null;
    (data as any).contentHash = null;
  }

  let savedReceiptId = data.receiptId;

  if (isOtherExpense) {
    data.expenseType = "other";
    data.status = data.status === "scanned" ? "scanned" : (data.status || "rewarded_other");
  }

  try {
    const saved = await insertReceipt(data, { skipPostProcess: options?.skipPostProcess });
    if (saved?.receiptId) {
      savedReceiptId = saved.receiptId;
    }
    // Proof-field columns are a NON-CRITICAL post-insert enrichment. The receipt
    // itself is already saved above, so a failure here must be isolated — it must
    // NOT propagate to the outer catch and trigger the receipt re-insert fallback
    // (which would risk overwriting the already-persisted row).
    try {
      await persistReceiptProofFields(data);
    } catch (proofErr: any) {
      console.warn(
        "[Pipeline] persistReceiptProofFields failed (non-fatal, receipt already saved):",
        proofErr?.message
      );
    }
    console.log("[Pipeline] Auto-save (scanned) persisted:", savedReceiptId);
  } catch (error: any) {
    // insertReceipt is the canonical save (maps every column, upserts, and
    // handles proof fields internally). There is no usable lighter-weight insert
    // to retry with — the schema requires many NOT NULL columns the old fallback
    // omitted, and an ON CONFLICT re-insert risked overwriting a row another path
    // (storage-db) already persisted correctly. So on failure we log and stop.
    console.warn("[Pipeline] Auto-save (scanned) failed:", error?.message);
    // A normal receipt has no persisted row now → skip the verified notification
    // below (it would reference a non-existent receipt). Other-expense receipts
    // are archived in their own table further down, so let those continue.
    if (!isOtherExpense) return;
  }

  if (isOtherExpense) {
    try {
      await upsertOtherExpenseReceipt({
        ...data,
        status: "rewarded_other",
        expenseType: "other",
      });
      console.log("[Pipeline] Auto-save (other expense) archived:", savedReceiptId);
    } catch (error: any) {
      console.warn("[Pipeline] Auto-save (other expense archive) failed:", error?.message);
    }
    return;
  }

  // Emit verified-style notification at analyze completion as a reliable fallback
  // for background/PWA flows. Post-process also tries to insert the same type and
  // receipt_id, but both sides are deduped to avoid duplicates.
  try {
    const sql = getSql();
    if (!sql) return;
    await warmUpConnection();
    await sql`
      INSERT INTO user_notifications (username, type, title, body, payload, receipt_id)
      SELECT
        ${username},
        'receipt_verified',
        'Receipt verified',
        'Your receipt analysis is completed. Tap to open claim.',
        ${JSON.stringify({ receiptId: savedReceiptId, target: "claim_done" })}::jsonb,
        ${savedReceiptId}
      WHERE NOT EXISTS (
        SELECT 1
        FROM user_notifications
        WHERE username = ${username}
          AND receipt_id = ${savedReceiptId}
          AND type = 'receipt_verified'
      )
    `;
  } catch (error: any) {
    console.warn("[Pipeline] Auto-save verified notification insert failed:", error?.message);
  }
}
