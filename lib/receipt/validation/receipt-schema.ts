/**
 * Deterministic validation for LLM (Gemini / GPT) receipt extraction.
 * Zod parse → tolerance cross-check (Σ quantity×unitPrice vs totalAmount).
 */

import { z } from "zod";
import type { ExtractionValidationResult } from "@/lib/receipt/types";

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const TIME_REGEX = /^\d{2}:\d{2}$/;

const unitTypeEnum = z.enum(["adet", "kg", "g", "l", "ml"]);

export const receiptLineItemSchema = z.object({
  name: z.string().min(1),
  quantity: z.number().positive().nullable(),
  unitType: unitTypeEnum.nullable(),
  unitPrice: z.number().nonnegative().nullable(),
  totalPrice: z.number().nonnegative().nullable(),
  vatRate: z.number().min(0).max(1).nullable(),
});

/** Unified extraction shape (GeminiReceiptResult / GPT full receipt compatible). */
export const receiptExtractionSchema = z.object({
  merchantName: z.preprocess((v) => (v === "" || v === undefined ? null : v), z.string().nullable()),
  merchantAddress: z.preprocess((v) => (v === "" || v === undefined ? null : v), z.string().nullable()),
  branchInfo: z.preprocess((v) => (v === "" || v === undefined ? null : v), z.string().nullable()),
  taxId: z.preprocess((v) => (v === "" || v === undefined ? null : v), z.string().nullable()),
  date: z.preprocess(
    (v) => (v === "" || v === undefined ? null : v),
    z.union([z.string().regex(DATE_REGEX, "date must be YYYY-MM-DD"), z.null()])
  ),
  time: z.preprocess(
    (v) => (v === "" || v === undefined ? null : v),
    z.union([z.string().regex(TIME_REGEX, "time must be HH:MM"), z.null()])
  ),
  receiptNo: z.preprocess((v) => (v === "" || v === undefined ? null : v), z.string().nullable()),
  totalAmount: z.number().positive("totalAmount must be a positive number"),
  totalVat: z.preprocess(
    (v) => (v === undefined ? null : v),
    z.union([z.number().min(0), z.null()])
  ),
  lineItems: z.array(receiptLineItemSchema),
});

export type ReceiptExtractionInput = z.input<typeof receiptExtractionSchema>;
export type ReceiptExtractionValidated = z.infer<typeof receiptExtractionSchema>;

export type ValidateReceiptExtractionResult =
  | { status: "accepted"; data: ReceiptExtractionValidated }
  | {
      status: "needs_review";
      data: ReceiptExtractionValidated;
      reason: string;
      details: {
        linesSum: number;
        totalAmount: number;
        delta: number;
        tolerance: number;
        linesWithQtyUnitPrice: number;
      };
    }
  | { status: "rejected"; reason: string; zodErrors: string[] };

export const LINE_TOTAL_REASON = "Line items total deviates from grand total beyond tolerance";
export const NO_QTY_UP_REASON =
  "Line items present but quantity×unitPrice cannot be computed for any line (needs manual review)";

export const NO_STRUCTURED_LINES_REASON =
  "No structured line items; Gemini/GPT extraction did not produce purchasable lines";

export function isSoftLineItemReviewReason(reason: string | undefined): boolean {
  return reason === NO_STRUCTURED_LINES_REASON || reason === NO_QTY_UP_REASON;
}

function flattenZodErrors(err: z.ZodError): string[] {
  return err.issues.map((e) => (e.path.length ? `${e.path.join(".")}: ${e.message}` : e.message));
}

function computeQtyUnitPriceSum(lineItems: ReceiptExtractionValidated["lineItems"]): {
  sum: number;
  countedLines: number;
} {
  let sum = 0;
  let countedLines = 0;
  for (const line of lineItems) {
    const q = line.quantity;
    const up = line.unitPrice;
    if (
      typeof q === "number" &&
      typeof up === "number" &&
      Number.isFinite(q) &&
      Number.isFinite(up) &&
      q > 0 &&
      up >= 0
    ) {
      sum += q * up;
      countedLines += 1;
    }
  }
  return { sum, countedLines };
}

/**
 * Tolerance: max(1.00 TRY, 2% of totalAmount).
 */
export function lineTotalTolerance(totalAmount: number): number {
  return Math.max(1, 0.02 * totalAmount);
}

export function validateReceiptExtraction(data: unknown): ValidateReceiptExtractionResult {
  const parsed = receiptExtractionSchema.safeParse(data);
  if (!parsed.success) {
    return {
      status: "rejected",
      reason: "Extraction failed schema validation",
      zodErrors: flattenZodErrors(parsed.error),
    };
  }

  const validated = parsed.data;
  const { lineItems, totalAmount } = validated;

  if (lineItems.length === 0) {
    return {
      status: "needs_review",
      data: validated,
      reason: NO_STRUCTURED_LINES_REASON,
      details: {
        linesSum: 0,
        totalAmount,
        delta: totalAmount,
        tolerance: lineTotalTolerance(totalAmount),
        linesWithQtyUnitPrice: 0,
      },
    };
  }

  const { sum: linesSum, countedLines } = computeQtyUnitPriceSum(lineItems);

  if (countedLines === 0) {
    return {
      status: "needs_review",
      data: validated,
      reason: NO_QTY_UP_REASON,
      details: {
        linesSum: 0,
        totalAmount,
        delta: totalAmount,
        tolerance: lineTotalTolerance(totalAmount),
        linesWithQtyUnitPrice: 0,
      },
    };
  }

  const delta = Math.abs(linesSum - totalAmount);
  const tolerance = lineTotalTolerance(totalAmount);

  if (delta > tolerance) {
    return {
      status: "needs_review",
      data: validated,
      reason: LINE_TOTAL_REASON,
      details: {
        linesSum,
        totalAmount,
        delta,
        tolerance,
        linesWithQtyUnitPrice: countedLines,
      },
    };
  }

  return { status: "accepted", data: validated };
}

/** Normalize raw geminiLineItems / API blobs to objects Zod can parse. */
export function normalizeRawLineItems(raw: unknown): Array<Record<string, unknown>> {
  if (!Array.isArray(raw)) return [];
  const out: Array<Record<string, unknown>> = [];
  for (const it of raw) {
    if (!it || typeof it !== "object") continue;
    const o = it as Record<string, unknown>;
    const name = typeof o.name === "string" ? o.name.trim() : "";
    if (!name) continue;
    const q = o.quantity;
    const up = o.unitPrice;
    const tp = o.totalPrice;
    const vr = o.vatRate;
    const ut = o.unitType;
    out.push({
      name,
      quantity: typeof q === "number" && Number.isFinite(q) && q > 0 ? q : null,
      unitType:
        ut === "adet" || ut === "kg" || ut === "g" || ut === "l" || ut === "ml" ? ut : null,
      unitPrice: typeof up === "number" && Number.isFinite(up) && up >= 0 ? up : null,
      totalPrice: typeof tp === "number" && Number.isFinite(tp) && tp >= 0 ? tp : null,
      vatRate:
        typeof vr === "number" && Number.isFinite(vr) && vr >= 0 && vr <= 1
          ? vr
          : typeof vr === "number" && Number.isFinite(vr) && vr > 1 && vr <= 100
            ? vr / 100
            : null,
    });
  }
  return out;
}

/**
 * Build validation payload from DB row + receipts.receipt_data (post-process / backfill).
 */
export function buildReceiptExtractionPayloadFromStoredReceipt(
  receiptData: unknown,
  row: {
    pricing_total_paid: number | null;
    pricing_vat_amount: number | null;
    merchant_name: string | null;
    extraction_date_value: string | null;
    extraction_time_value: string | null;
  }
): unknown {
  let data: Record<string, unknown> = {};
  try {
    data =
      typeof receiptData === "string"
        ? (JSON.parse(receiptData) as Record<string, unknown>)
        : ((receiptData as Record<string, unknown>) ?? {});
  } catch {
    data = {};
  }

  const merchantObj = data.merchant as Record<string, unknown> | undefined;
  const merchantFromJson = typeof merchantObj?.name === "string" ? merchantObj.name : null;

  const extraction = data.extraction as Record<string, unknown> | undefined;
  const dateObj = extraction?.date as { value?: unknown } | undefined;
  const timeObj = extraction?.time as { value?: unknown } | undefined;
  const totalObj = extraction?.total as { value?: unknown } | undefined;
  const vatObj = extraction?.vat as { value?: unknown } | undefined;

  const dateVal =
    typeof dateObj?.value === "string" && DATE_REGEX.test(dateObj.value)
      ? dateObj.value
      : row.extraction_date_value && DATE_REGEX.test(row.extraction_date_value)
        ? row.extraction_date_value
        : null;

  const timeVal =
    typeof timeObj?.value === "string" && TIME_REGEX.test(timeObj.value)
      ? timeObj.value
      : row.extraction_time_value && TIME_REGEX.test(row.extraction_time_value)
        ? row.extraction_time_value
        : null;

  const totalAmount =
    typeof totalObj?.value === "number" && Number.isFinite(totalObj.value) && totalObj.value > 0
      ? totalObj.value
      : typeof row.pricing_total_paid === "number" &&
          Number.isFinite(row.pricing_total_paid) &&
          row.pricing_total_paid > 0
        ? row.pricing_total_paid
        : null;

  const totalVatRaw = vatObj?.value;
  const totalVat =
    typeof totalVatRaw === "number" && Number.isFinite(totalVatRaw) && totalVatRaw >= 0
      ? totalVatRaw
      : typeof row.pricing_vat_amount === "number" &&
          Number.isFinite(row.pricing_vat_amount) &&
          row.pricing_vat_amount >= 0
        ? row.pricing_vat_amount
        : null;

  // merchantAddress — merchant.address inside receipt_data, or merchantAddress directly
  const merchantAddress: string | null = (() => {
    const ma = data.merchantAddress;
    if (typeof ma === "string" && ma.trim()) return ma.trim();
    const merch = data.merchant as Record<string, unknown> | null | undefined;
    if (merch && typeof merch.address === "string" && merch.address.trim()) return merch.address.trim();
    return null;
  })();

  // branchInfo — receipt_data.branchInfo (top-level, post-fix) or gptFullReceiptResult fallback (legacy)
  const branchInfo: string | null = (() => {
    const bi = data.branchInfo;
    if (typeof bi === "string" && bi.trim()) return bi.trim();
    const gpt = data.gptFullReceiptResult as Record<string, unknown> | undefined;
    const gptBi = gpt?.branchInfo;
    if (typeof gptBi === "string" && gptBi.trim()) return gptBi.trim();
    return null;
  })();

  // lineItems — geminiLineItems first, otherwise gptFullReceiptResult.lineItems
  const geminiLines = normalizeRawLineItems(data.geminiLineItems);
  const lineItems = geminiLines.length > 0
    ? geminiLines
    : normalizeRawLineItems(
        (data.gptFullReceiptResult as Record<string, unknown> | undefined)?.lineItems
      );

  return {
    merchantName: merchantFromJson ?? row.merchant_name ?? null,
    merchantAddress,
    branchInfo,
    taxId: null,
    date: dateVal,
    time: timeVal,
    receiptNo: null,
    totalAmount,
    totalVat,
    lineItems,
  };
}

export function extractionValidationToStoredShape(
  result: ValidateReceiptExtractionResult
): ExtractionValidationResult {
  if (result.status === "accepted") {
    return { status: "accepted" };
  }
  if (result.status === "rejected") {
    return {
      status: "rejected",
      reason: result.reason,
      zodErrors: result.zodErrors,
    };
  }
  return {
    status: "needs_review",
    reason: result.reason,
    details: result.details,
  };
}

/** Merge validation snapshot into receipts.receipt_data JSON (string for sql tagged template). */
export function mergeExtractionValidationIntoReceiptData(
  receiptData: unknown,
  validation: ExtractionValidationResult
): string {
  let obj: Record<string, unknown> = {};
  try {
    obj =
      typeof receiptData === "string"
        ? (JSON.parse(receiptData) as Record<string, unknown>)
        : { ...((receiptData ?? {}) as Record<string, unknown>) };
  } catch {
    obj = {};
  }
  obj.extractionValidation = validation;
  return JSON.stringify(obj);
}

export function buildReceiptExtractionPayloadFromAnalyzeContext(input: {
  merchantName?: string | null;
  merchantTaxId?: string | null;
  date?: string | null;
  time?: string | null;
  totalPaid?: number | null;
  vatAmount?: number | null;
  geminiLineItems: unknown;
}): unknown {
  return {
    merchantName: input.merchantName ?? null,
    merchantAddress: null,
    branchInfo: null,
    taxId: input.merchantTaxId ?? null,
    date: input.date ?? null,
    time: input.time ?? null,
    receiptNo: null,
    totalAmount: input.totalPaid,
    totalVat: input.vatAmount ?? null,
    lineItems: normalizeRawLineItems(input.geminiLineItems),
  };
}
