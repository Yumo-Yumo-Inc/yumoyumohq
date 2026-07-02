import { getSql } from "@/lib/db/client";
import type { ReceiptAnalysis } from "@/lib/receipt/types";

/** Writes migration-082 proof columns after receipt insert. */
export async function persistReceiptProofFields(
  receipt: ReceiptAnalysis
): Promise<void> {
  const sql = getSql();
  if (!sql || !receipt.receiptId) return;

  const documentType = receipt.documentType ?? null;
  const isPaymentProof = receipt.isPaymentProof ?? null;
  const proofStatus = receipt.proofStatus ?? null;
  const completeSlipReceiptId = receipt.completeSlipReceiptId ?? null;

  if (!documentType && isPaymentProof == null && !proofStatus && !completeSlipReceiptId) {
    return;
  }

  await sql`
    UPDATE receipts
    SET
      document_type = COALESCE(${documentType}, document_type),
      is_payment_proof = COALESCE(${isPaymentProof}, is_payment_proof),
      proof_status = COALESCE(${proofStatus}, proof_status),
      receipt_data = CASE
        WHEN ${completeSlipReceiptId}::text IS NOT NULL THEN jsonb_set(
          COALESCE(receipt_data, '{}'::jsonb),
          '{completeSlipReceiptId}',
          to_jsonb(${completeSlipReceiptId}::text),
          true
        )
        ELSE receipt_data
      END,
      updated_at = now()
    WHERE receipt_id = ${receipt.receiptId}
  `;
}
