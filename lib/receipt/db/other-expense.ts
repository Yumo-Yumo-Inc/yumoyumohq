import { db } from "@/lib/db/client";
import type { ReceiptAnalysis } from "@/lib/receipt/types";
export type ReceiptExpenseFilter = "personal" | "other" | null;

const OTHER_EXPENSE_TABLE_SQL = `
  CREATE TABLE IF NOT EXISTS other_expense_receipts (
    receipt_id uuid PRIMARY KEY,
    username text NOT NULL,
    expense_type text NOT NULL DEFAULT 'other',
    status text NOT NULL DEFAULT 'rewarded_other',
    merchant_name text,
    pricing_total_paid double precision,
    pricing_currency text,
    reward_final double precision,
    reward_token text,
    receipt_data jsonb NOT NULL DEFAULT '{}'::jsonb,
    source_receipt_id uuid,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
  );
`;

let ensured = false;

async function ensureOtherExpenseTable(): Promise<void> {
  if (ensured) return;
  await db.query(OTHER_EXPENSE_TABLE_SQL);
  ensured = true;
}

export async function upsertOtherExpenseReceipt(receipt: ReceiptAnalysis): Promise<void> {
  await ensureOtherExpenseTable();
  const merchantName = receipt.merchant?.name ?? null;
  const totalPaid = Number(receipt.pricing?.totalPaid ?? 0) || 0;
  const currency = receipt.pricing?.currency ?? null;
  const rewardFinal = Number(receipt.reward?.final ?? 0) || 0;
  const rewardToken = receipt.reward?.token ?? "cPoints";
  const status = receipt.status ?? "rewarded_other";

  await db.query(
    `
      INSERT INTO other_expense_receipts (
        receipt_id,
        username,
        expense_type,
        status,
        merchant_name,
        pricing_total_paid,
        pricing_currency,
        reward_final,
        reward_token,
        receipt_data,
        source_receipt_id,
        created_at,
        updated_at
      ) VALUES (
        $1, $2, 'other', $3, $4, $5, $6, $7, $8, $9::jsonb, $10, now(), now()
      )
      ON CONFLICT (receipt_id) DO UPDATE SET
        username = EXCLUDED.username,
        expense_type = 'other',
        status = EXCLUDED.status,
        merchant_name = EXCLUDED.merchant_name,
        pricing_total_paid = EXCLUDED.pricing_total_paid,
        pricing_currency = EXCLUDED.pricing_currency,
        reward_final = EXCLUDED.reward_final,
        reward_token = EXCLUDED.reward_token,
        receipt_data = EXCLUDED.receipt_data,
        source_receipt_id = EXCLUDED.source_receipt_id,
        updated_at = now()
    `,
    [
      receipt.receiptId,
      receipt.username,
      status,
      merchantName,
      totalPaid,
      currency,
      rewardFinal,
      rewardToken,
      JSON.stringify(receipt),
      receipt.receiptId,
    ]
  );
}

export async function getOtherExpenseReceiptById(
  receiptId: string,
  username?: string,
  isAdmin: boolean = false
): Promise<ReceiptAnalysis | null> {
  await ensureOtherExpenseTable();
  const result = await db.query<{
    receipt_data: ReceiptAnalysis | string;
    username: string;
  }>(
    `SELECT receipt_data, username
       FROM other_expense_receipts
      WHERE receipt_id = $1
      LIMIT 1`,
    [receiptId]
  );
  const row = result.rows?.[0];
  if (!row) return null;
  if (username && !isAdmin && row.username !== username) return null;
  const raw = row.receipt_data;
  const parsed =
    typeof raw === "string"
      ? (JSON.parse(raw) as ReceiptAnalysis)
      : ({ ...(raw as ReceiptAnalysis), username: row.username } as ReceiptAnalysis);
  parsed.expenseType = "other";
  parsed.username = row.username;
  return parsed;
}

export async function deleteOtherExpenseReceipt(
  receiptId: string,
  username: string,
  isAdmin: boolean = false
): Promise<boolean> {
  await ensureOtherExpenseTable();
  const existing = await db.query<{ username: string }>(
    `SELECT username FROM other_expense_receipts WHERE receipt_id = $1 LIMIT 1`,
    [receiptId]
  );
  const row = existing.rows?.[0];
  if (!row) return false;
  if (!isAdmin && row.username !== username) return false;
  await db.query(`DELETE FROM other_expense_receipts WHERE receipt_id = $1`, [receiptId]);
  return true;
}

type CombinedListParams = {
  username: string;
  limit: number;
  offset: number;
  search: string;
  statusValues: string[];
  expenseFilter: ReceiptExpenseFilter;
};

function buildCombinedListFilters(params: CombinedListParams): {
  sql: string;
  values: unknown[];
} {
  const { username, search, statusValues, expenseFilter } = params;
  const values: unknown[] = [username];
  const clauses: string[] = [];

  if (statusValues.length > 0) {
    values.push(statusValues);
    clauses.push(`combined.status = ANY($${values.length}::text[])`);
  }

  const searchTrimmed = search.trim();
  if (searchTrimmed) {
    values.push(`%${searchTrimmed}%`);
    clauses.push(
      `(combined.receipt_id::text ILIKE $${values.length} OR combined.merchant_name ILIKE $${values.length})`
    );
  }

  if (expenseFilter === "personal") {
    clauses.push(`combined.expense_type = 'personal'`);
  } else if (expenseFilter === "other") {
    clauses.push(`combined.expense_type = 'other'`);
  }

  const whereExtra = clauses.length > 0 ? ` AND ${clauses.join(" AND ")}` : "";
  return { sql: whereExtra, values };
}

const COMBINED_RECEIPTS_SUBQUERY = `
  SELECT
    r.receipt_id::text AS receipt_id,
    r.username,
    r.status,
    r.created_at,
    r.merchant_name,
    r.merchant_country,
    r.merchant_category,
    r.merchant_place_id,
    r.extraction_date_value,
    r.extraction_time_value,
    r.pricing_total_paid,
    r.pricing_vat_amount,
    r.pricing_paid_ex_tax,
    r.pricing_currency,
    r.hidden_cost_core,
    r.hidden_cost_breakdown_import_system,
    r.hidden_cost_breakdown_retail_hidden,
    r.hidden_cost_reference_price,
    rr.bint_amount AS ayumo_amount,
    rr.bint_bonus_amount AS ryumo_bonus_amount,
    r.reward_final,
    COALESCE(r.expense_type, 'personal') AS expense_type
  FROM receipts r
  LEFT JOIN receipt_rewards rr ON r.receipt_id = rr.receipt_id
  WHERE r.username = $1

  UNION ALL

  SELECT
    o.receipt_id::text AS receipt_id,
    o.username,
    o.status,
    o.created_at,
    o.merchant_name,
    NULL::text AS merchant_country,
    NULL::text AS merchant_category,
    NULL::text AS merchant_place_id,
    NULL::text AS extraction_date_value,
    NULL::text AS extraction_time_value,
    o.pricing_total_paid,
    NULL::double precision AS pricing_vat_amount,
    NULL::double precision AS pricing_paid_ex_tax,
    o.pricing_currency,
    NULL::double precision AS hidden_cost_core,
    NULL::double precision AS hidden_cost_breakdown_import_system,
    NULL::double precision AS hidden_cost_breakdown_retail_hidden,
    NULL::double precision AS hidden_cost_reference_price,
    o.reward_final AS ayumo_amount,
    NULL::double precision AS ryumo_bonus_amount,
    o.reward_final,
    'other'::text AS expense_type
  FROM other_expense_receipts o
  WHERE o.username = $1
    AND NOT EXISTS (
      SELECT 1 FROM receipts r2 WHERE r2.receipt_id::text = o.receipt_id::text
    )
`;

export async function fetchCombinedUserReceiptsLite(
  params: CombinedListParams
): Promise<Record<string, unknown>[]> {
  await ensureOtherExpenseTable();
  const { limit, offset } = params;
  const { sql: whereExtra, values } = buildCombinedListFilters(params);
  const queryValues = [...values, limit, offset];
  const limitIdx = values.length + 1;
  const offsetIdx = values.length + 2;

  const result = await db.query(
    `
      SELECT * FROM (
        ${COMBINED_RECEIPTS_SUBQUERY}
      ) combined
      WHERE 1=1${whereExtra}
      ORDER BY combined.created_at DESC NULLS LAST
      LIMIT $${limitIdx} OFFSET $${offsetIdx}
    `,
    queryValues
  );
  return (result.rows ?? []) as Record<string, unknown>[];
}

export async function countCombinedUserReceipts(
  params: Omit<CombinedListParams, "limit" | "offset">
): Promise<number> {
  await ensureOtherExpenseTable();
  const { sql: whereExtra, values } = buildCombinedListFilters({
    ...params,
    limit: 0,
    offset: 0,
  });
  const result = await db.query<{ count: string }>(
    `
      SELECT COUNT(*)::text AS count FROM (
        ${COMBINED_RECEIPTS_SUBQUERY}
      ) combined
      WHERE 1=1${whereExtra}
    `,
    values
  );
  return parseInt(result.rows?.[0]?.count ?? "0", 10);
}
