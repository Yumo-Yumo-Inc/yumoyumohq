/**
 * Service provider bill uploads — uses the receipts table in digital_bill mode.
 *
 * Pipeline logic mirrors the classic receipt flow (Vercel Blob → analyze → DB);
 * the validation criteria differ: provider match + amount + period; line-item
 * parsing is optional.
 *
 * This module handles the DB side of the upload endpoint; OCR and provider
 * fuzzy-matching happen further down the analyze pipeline (phase 2). For now a
 * stub row is written.
 */

import { sql } from "@/lib/db/client";

export type BillStub = {
  receiptId: string;
  providerId: number;
  blobUrl: string | null;
  status: "pending_bill_review";
};

export async function insertDigitalBillStub(input: {
  receiptId: string;
  username: string;
  providerId: number;
  providerName: string;
  blobUrl: string | null;
  receiptHash: string | null;
  imagePhash: string | null;
}): Promise<BillStub> {
  const {
    receiptId,
    username,
    providerId,
    providerName,
    blobUrl,
    receiptHash,
    imagePhash,
  } = input;

  // 14 columns on the receipts table are NOT NULL (pricing_*, hidden_cost_*, reward_*,
  // receipt_data). Real values are unknown until the analyze pipeline runs, so we
  // write stub 0 / empty jsonb values to satisfy the NOT NULL constraints on INSERT.
  //
  // receipt_hash / image_phash: idx_receipts_hash_unique is a global unique partial
  // index (WHERE receipt_hash IS NOT NULL) used for classic receipt fraud detection.
  // For digital bills, the same file (e.g. the same PDF sample) can be uploaded by
  // two different users — or re-uploaded by the same user on retry — so the bills
  // flow leaves the hash null to avoid triggering the unique check. Since the hash
  // is preserved inside the blob, fraud checking for bill-mode happens separately,
  // later in that pipeline.
  const stubReceiptData = JSON.stringify({
    kind: "service_provider_bill_upload",
    providerId,
    providerName,
    status: "pending_bill_review",
    receiptHash,
    imagePhash,
    // resolveReceiptImageBuffer reads receipt_data.blobUrl — required so the
    // analyze pipeline can load the bill image after this stub insert.
    blobUrl,
  });
  const stubSource = JSON.stringify({
    kind: "service_provider_bill_upload",
    providerId,
  });

  await sql`
    INSERT INTO receipts (
      receipt_id, status, username,
      merchant_name,
      receipt_kind,
      matched_service_provider_id,
      matched_provider_confidence,
      receipt_hash, image_phash,
      source,
      pricing_total_paid, pricing_vat_amount, pricing_paid_ex_tax,
      pricing_import_system_rate, pricing_retail_hidden_rate,
      hidden_cost_reference_price, hidden_cost_core,
      hidden_cost_breakdown_import_system, hidden_cost_breakdown_retail_hidden,
      reward_conversion_rate, reward_raw, reward_final, reward_token,
      receipt_data,
      created_at, updated_at
    ) VALUES (
      ${receiptId}, 'pending_bill_review', ${username},
      ${providerName},
      'digital_bill',
      ${providerId},
      1.0,
      NULL, NULL,
      ${stubSource}::jsonb,
      0, 0, 0,
      0, 0,
      0, 0,
      0, 0,
      0, 0, 0, 'bINT',
      ${stubReceiptData}::jsonb,
      NOW(), NOW()
    )
    ON CONFLICT (receipt_id) DO NOTHING
  `;

  return {
    receiptId,
    providerId,
    blobUrl,
    status: "pending_bill_review",
  };
}

export async function listBillHistoryForProvider(
  username: string,
  providerId: number,
): Promise<
  Array<{
    receiptId: string;
    amount: number | null;
    currency: string | null;
    billDate: string | null;
    periodStart: string | null;
    periodEnd: string | null;
    status: string;
    createdAt: string;
  }>
> {
  const rows = (await sql`
    SELECT receipt_id,
           pricing_total_paid AS amount,
           pricing_currency   AS currency,
           extraction_date_value AS bill_date,
           bill_period_start,
           bill_period_end,
           status,
           created_at
    FROM receipts
    WHERE username = ${username}
      AND matched_service_provider_id = ${providerId}
      AND receipt_kind = 'digital_bill'
    ORDER BY created_at DESC
    LIMIT 24
  `) as Array<{
    receipt_id: string;
    amount: number | null;
    currency: string | null;
    bill_date: string | null;
    bill_period_start: string | null;
    bill_period_end: string | null;
    status: string;
    created_at: string;
  }>;

  return rows.map((row) => ({
    receiptId: row.receipt_id,
    amount: row.amount === null ? null : Number(row.amount),
    currency: row.currency,
    billDate: row.bill_date,
    periodStart: row.bill_period_start,
    periodEnd: row.bill_period_end,
    status: row.status,
    createdAt: row.created_at,
  }));
}
