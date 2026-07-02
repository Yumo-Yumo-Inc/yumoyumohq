/**
 * Receipt field-correction submission (Faz 3, honor edit flow).
 * SERVER-ONLY.
 *
 * The result screen lets a user submit the CORRECT value for a field. Reward
 * fields (total/vat) and the +10% bonus are admin-gated — this module only
 * queues them. Harmless fields (merchant_name/date/time) are written to the
 * receipt immediately. Nothing mints or penalises here; the verdict is the
 * admin's (see Karar A/C).
 *
 * See: memory/decisions/2026-06-03-honor-tabanli-odul-ve-edit-akisi.md (Faz 3).
 */

import { sql, warmUpConnection } from "@/lib/db/client";
import { isDatabaseAvailable } from "@/lib/receipt/db/connection";
import { isAmountInconsistent } from "@/lib/receipt/quality/honor-quality";

export const EDITABLE_FIELDS = ["merchant_name", "date", "time", "total", "vat"] as const;
export type EditableField = (typeof EDITABLE_FIELDS)[number];

/** Reward-amount fields (used for value/column updates + contradiction check). */
export const REWARD_FIELDS: ReadonlySet<EditableField> = new Set(["total", "vat"]);

/**
 * Fields that can change the reward AMOUNT or reward ELIGIBILITY → held pending
 * admin approval; on approve the receipt is recomputed and may flip ineligible →
 * eligible (base reward granted). `date` is here because it drives the
 * out_of_current_month eligibility gate. See decision 2026-06-03 (Faz 3, Karar A).
 */
export const RECOMPUTE_FIELDS: ReadonlySet<EditableField> = new Set(["total", "vat", "date"]);

const MERCHANT_NAME_MAX = 200;

/** Harmless fields written to the receipt immediately (no reward/eligibility impact). */
const IMMEDIATE_FIELDS: ReadonlySet<EditableField> = new Set(["merchant_name", "time"]);

export interface SubmitCorrectionInput {
  receiptId: string;
  username: string;
  field: string;
  newValue: string;
}

export type SubmitCorrectionResult =
  | {
      ok: true;
      correctionId: string;
      status: "pending";
      affectsReward: boolean;
      appliedImmediately: boolean;
      contradictionFlag: boolean;
    }
  | { ok: false; error: string; code: "invalid_field" | "invalid_value" | "not_found" | "duplicate" | "db" };

function isEditableField(field: string): field is EditableField {
  return (EDITABLE_FIELDS as readonly string[]).includes(field);
}

/** Validate + normalise the submitted value per field. Returns null on invalid. */
function normaliseValue(field: EditableField, raw: string): string | null {
  const v = (raw ?? "").trim();
  if (v.length === 0) return null;
  switch (field) {
    case "merchant_name":
      return v.slice(0, MERCHANT_NAME_MAX);
    case "date": {
      // Accept ISO-ish YYYY-MM-DD (optionally with time component, keep date part).
      const m = v.match(/^(\d{4}-\d{2}-\d{2})/);
      return m ? m[1] : null;
    }
    case "time": {
      const m = v.match(/^(\d{1,2}:\d{2}(?::\d{2})?)/);
      return m ? m[1] : null;
    }
    case "total":
    case "vat": {
      const n = Number(v.replace(",", "."));
      if (!Number.isFinite(n) || n < 0) return null;
      return String(Math.round(n * 100) / 100);
    }
  }
}

interface ReceiptCorrectionContext {
  merchant_name: string | null;
  extraction_date_value: string | null;
  extraction_time_value: string | null;
  pricing_total_paid: number | null;
  pricing_vat_amount: number | null;
}

function oldValueForField(field: EditableField, ctx: ReceiptCorrectionContext): string | null {
  switch (field) {
    case "merchant_name":
      return ctx.merchant_name ?? null;
    case "date":
      return ctx.extraction_date_value ?? null;
    case "time":
      return ctx.extraction_time_value ?? null;
    case "total":
      return ctx.pricing_total_paid != null ? String(ctx.pricing_total_paid) : null;
    case "vat":
      return ctx.pricing_vat_amount != null ? String(ctx.pricing_vat_amount) : null;
  }
}

export async function submitCorrection(input: SubmitCorrectionInput): Promise<SubmitCorrectionResult> {
  const { receiptId, username } = input;
  if (!isEditableField(input.field)) {
    return { ok: false, error: "Field is not editable", code: "invalid_field" };
  }
  const field = input.field;
  const newValue = normaliseValue(field, input.newValue);
  if (newValue === null) {
    return { ok: false, error: "Invalid value for field", code: "invalid_value" };
  }
  if (!isDatabaseAvailable() || !sql) {
    return { ok: false, error: "Database not available", code: "db" };
  }
  const dbSql = sql;

  try {
    await warmUpConnection();

    // Ownership + current values in one read.
    const rows = await dbSql`
      SELECT merchant_name, extraction_date_value, extraction_time_value,
             pricing_total_paid, pricing_vat_amount
      FROM receipts
      WHERE receipt_id = ${receiptId} AND username = ${username}
      LIMIT 1
    `;
    const ctx = (rows as ReceiptCorrectionContext[])[0];
    if (!ctx) {
      return { ok: false, error: "Receipt not found", code: "not_found" };
    }

    const oldValue = oldValueForField(field, ctx);
    // affects_reward column = "held for admin review + recompute on approve".
    const affectsReward = RECOMPUTE_FIELDS.has(field);

    // Admin pre-flag: does a new total contradict stored line items? (signal only)
    let contradictionFlag = false;
    if (field === "total") {
      try {
        const sumRows = await dbSql`
          SELECT COALESCE(SUM(line_total), 0)::float8 AS s
          FROM receipt_line_items WHERE receipt_id = ${receiptId}
        `;
        const sumLineTotals = Number((sumRows as any[])[0]?.s ?? 0);
        contradictionFlag = isAmountInconsistent(sumLineTotals, Number(newValue));
      } catch { /* no line items → no flag */ }
    }

    // Harmless fields apply to the receipt immediately; reward fields wait.
    const appliedImmediately = IMMEDIATE_FIELDS.has(field);
    if (appliedImmediately) {
      switch (field) {
        case "merchant_name":
          await dbSql`UPDATE receipts SET merchant_name = ${newValue}, updated_at = now()
                      WHERE receipt_id = ${receiptId} AND username = ${username}`;
          break;
        case "time":
          await dbSql`UPDATE receipts SET extraction_time_value = ${newValue}, updated_at = now()
                      WHERE receipt_id = ${receiptId} AND username = ${username}`;
          break;
      }
    }

    const inserted = await dbSql`
      INSERT INTO receipt_corrections (
        receipt_id, username, field, old_value, new_value,
        status, affects_reward, applied_immediately, contradiction_flag
      )
      VALUES (
        ${receiptId}, ${username}, ${field}, ${oldValue}, ${newValue},
        'pending', ${affectsReward}, ${appliedImmediately}, ${contradictionFlag}
      )
      ON CONFLICT (receipt_id, field) WHERE status = 'pending' DO NOTHING
      RETURNING id
    `;
    const correctionId = (inserted as any[])[0]?.id as string | undefined;
    if (!correctionId) {
      return { ok: false, error: "A pending correction for this field already exists", code: "duplicate" };
    }

    return {
      ok: true,
      correctionId,
      status: "pending",
      affectsReward,
      appliedImmediately,
      contradictionFlag,
    };
  } catch (e) {
    console.error("[corrections] submitCorrection failed:", e);
    return { ok: false, error: "Failed to submit correction", code: "db" };
  }
}
