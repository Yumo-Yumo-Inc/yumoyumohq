/** Admin-only: fills empty fields on the duplicate + original record from this analysis; DUPLICATE_ENRICH_ORIGINAL=0 disables it. */

import { getSql } from "@/lib/db/client";
import { runPostProcess } from "@/lib/receipt/post-process/run-post-process";
import type { ReceiptContext } from "@/app/api/receipt/analyze/types";

export function isDuplicateEnrichEnabled(): boolean {
  const v = (process.env.DUPLICATE_ENRICH_ORIGINAL ?? "true").trim().toLowerCase();
  return v !== "0" && v !== "false" && v !== "no" && v !== "off";
}

function isBlank(v: unknown): boolean {
  if (v == null) return true;
  if (typeof v === "string") return v.trim() === "";
  if (typeof v === "number") return !Number.isFinite(v);
  return false;
}

/** Whether the pipeline has meaningful data at the moment of DuplicateError (absent on an early duplicate). */
export function duplicateContextHasEnrichmentData(ctx: ReceiptContext | undefined): boolean {
  if (!ctx) return false;
  const gl = (ctx as { geminiLineItems?: unknown }).geminiLineItems;
  if (Array.isArray(gl) && gl.length > 0) return true;
  const ft = (ctx.fullText || "").trim();
  if (ft.length >= 24) return true;
  if (!isBlank(ctx.merchantName) && ctx.merchantName !== "Unknown Merchant") return true;
  return false;
}

export type EnrichDuplicateResult = {
  ok: boolean;
  originalReceiptId: string;
  fieldsUpdated: string[];
  postProcessOk: boolean;
  postProcessState?: string;
  postProcessError?: string;
  error?: string;
};

export async function enrichOriginalReceiptFromDuplicateContext(
  originalReceiptId: string,
  context: ReceiptContext
): Promise<EnrichDuplicateResult> {
  const fieldsUpdated: string[] = [];
  const sql = getSql();
  if (!sql) {
    return {
      ok: false,
      originalReceiptId,
      fieldsUpdated,
      postProcessOk: false,
      error: "Database not configured",
    };
  }

  const rows = await sql`
    SELECT
      receipt_id,
      receipt_data,
      merchant_name,
      merchant_place_id,
      extraction_date_value,
      extraction_time_value,
      pricing_total_paid,
      pricing_vat_amount,
      pricing_currency,
      merchant_country,
      merchant_category,
      merchant_address,
      branch_info,
      merchant_city,
      merchant_district,
      merchant_neighborhood,
      merchant_street,
      vision_json
    FROM receipts
    WHERE receipt_id = ${originalReceiptId}
    LIMIT 1
  `;

  if (rows.length === 0) {
    return {
      ok: false,
      originalReceiptId,
      fieldsUpdated,
      postProcessOk: false,
      error: "Original receipt not found",
    };
  }

  const row = rows[0] as Record<string, unknown>;
  let data: Record<string, unknown> = {};
  try {
    const rd = row.receipt_data;
    data =
      typeof rd === "string"
        ? (JSON.parse(rd) as Record<string, unknown>)
        : ((rd as Record<string, unknown>) || {});
  } catch {
    data = {};
  }

  const ctxAny = context as unknown as Record<string, unknown>;

  // blobUrl
  const blob = ctxAny.blobUrl;
  if (typeof blob === "string" && blob.startsWith("http") && isBlank(data.blobUrl)) {
    data.blobUrl = blob;
    fieldsUpdated.push("receipt_data.blobUrl");
  }

  // geminiLineItems — admin re-upload: the new analysis always overwrites
  const gl = ctxAny.geminiLineItems;
  if (Array.isArray(gl) && gl.length > 0) {
    data.geminiLineItems = gl;
    fieldsUpdated.push("receipt_data.geminiLineItems");
  }

  // visionRawJson inside receipt_data
  const vrj = ctxAny.visionRawJson;
  if (vrj != null && (data.visionRawJson == null || data.visionRawJson === undefined)) {
    data.visionRawJson = vrj;
    fieldsUpdated.push("receipt_data.visionRawJson");
  }

  // merchant block (address, name)
  if (!data.merchant || typeof data.merchant !== "object") {
    data.merchant = {};
  }
  const merchant = data.merchant as Record<string, unknown>;
  if (isBlank(merchant.name) && !isBlank(context.merchantName)) {
    merchant.name = context.merchantName;
    fieldsUpdated.push("receipt_data.merchant.name");
  }
  const addr = context.merchantAddress;
  if (typeof addr === "string" && addr.trim()) {
    const prev = merchant.address;
    if (isBlank(prev) || (typeof prev === "object" && prev !== null && isBlank((prev as { value?: string }).value))) {
      merchant.address = addr.trim();
      fieldsUpdated.push("receipt_data.merchant.address");
    }
  }

  // Branch — first the direct context (Gemini), then GPT full-receipt fallback
  const directBranch = ctxAny.branchInfo;
  const gptFr = ctxAny.gptFullReceiptResult as { branchInfo?: string | null } | undefined;
  const branchFromGpt = gptFr?.branchInfo;
  const branchValue =
    (typeof directBranch === "string" && directBranch.trim() ? directBranch.trim() : null) ??
    (typeof branchFromGpt === "string" && branchFromGpt.trim() ? branchFromGpt.trim() : null);
  if (branchValue && isBlank(data.branchInfo)) {
    data.branchInfo = branchValue;
    fieldsUpdated.push("receipt_data.branchInfo");
  }

  // extraction (date, time, total, VAT — only if empty)
  if (!data.extraction || typeof data.extraction !== "object") {
    data.extraction = {};
  }
  const ext = data.extraction as Record<string, unknown>;

  if (context.date) {
    const d = ext.date as { value?: string } | undefined;
    if (!d || isBlank(d.value)) {
      ext.date = { value: context.date, confidence: 0.85 };
      fieldsUpdated.push("receipt_data.extraction.date");
    }
  }
  if (context.time) {
    const t = ext.time as { value?: string } | undefined;
    if (!t || isBlank(t.value)) {
      ext.time = { value: context.time, confidence: 0.8 };
      fieldsUpdated.push("receipt_data.extraction.time");
    }
  }
  if (context.totalPaid != null && context.totalPaid > 0) {
    const tot = ext.total as { value?: number } | undefined;
    if (!tot || tot.value == null || tot.value === 0) {
      ext.total = { value: context.totalPaid, confidence: 0.85 };
      fieldsUpdated.push("receipt_data.extraction.total");
    }
  }
  if (context.vatAmount != null && context.vatAmount >= 0) {
    const vat = ext.vat as { value?: number } | undefined;
    if (!vat || vat.value == null) {
      ext.vat = {
        value: context.vatAmount,
        confidence: 0.8,
        ...(context.vatRate != null ? { rate: context.vatRate } : {}),
      };
      fieldsUpdated.push("receipt_data.extraction.vat");
    }
  }

  data.duplicateEnrichedAt = new Date().toISOString();
  data.duplicateEnrichedFromUploadAttemptId = context.receiptId;
  data.duplicateEnrichedFromUsername = context.username || null;

  // Columns (only if empty)
  const patch: {
    merchant_name?: string;
    merchant_place_id?: string;
    extraction_date_value?: string;
    extraction_time_value?: string;
    pricing_total_paid?: number;
    pricing_vat_amount?: number;
    pricing_currency?: string;
    merchant_country?: string;
    merchant_category?: string;
    merchant_address?: string;
    branch_info?: string;
    merchant_city?: string;
    merchant_district?: string;
    merchant_neighborhood?: string;
    merchant_street?: string;
  } = {};

  if (isBlank(row.merchant_name) && !isBlank(context.merchantName)) {
    patch.merchant_name = context.merchantName!;
    fieldsUpdated.push("merchant_name");
  }
  if (isBlank(row.merchant_place_id) && !isBlank(context.merchantPlaceId)) {
    patch.merchant_place_id = context.merchantPlaceId!;
    fieldsUpdated.push("merchant_place_id");
  }
  if (isBlank(row.extraction_date_value) && context.date) {
    patch.extraction_date_value = context.date;
    fieldsUpdated.push("extraction_date_value");
  }
  if (isBlank(row.extraction_time_value) && context.time) {
    patch.extraction_time_value = context.time;
    fieldsUpdated.push("extraction_time_value");
  }
  if ((row.pricing_total_paid == null || row.pricing_total_paid === 0) && context.totalPaid && context.totalPaid > 0) {
    patch.pricing_total_paid = context.totalPaid;
    fieldsUpdated.push("pricing_total_paid");
  }
  if ((row.pricing_vat_amount == null || row.pricing_vat_amount === 0) && context.vatAmount != null && context.vatAmount > 0) {
    patch.pricing_vat_amount = context.vatAmount;
    fieldsUpdated.push("pricing_vat_amount");
  }
  if (isBlank(row.pricing_currency) && !isBlank(context.currency)) {
    patch.pricing_currency = context.currency ?? undefined;
    fieldsUpdated.push("pricing_currency");
  }
  if (isBlank(row.merchant_country) && !isBlank(context.detectedCountry)) {
    patch.merchant_country = context.detectedCountry ?? undefined;
    fieldsUpdated.push("merchant_country");
  }
  if (isBlank(row.merchant_category) && !isBlank(context.category)) {
    patch.merchant_category = context.category;
    fieldsUpdated.push("merchant_category");
  }

  // merchant_address: from context (Gemini or GPT) → write only if empty
  const addrPatch =
    (typeof ctxAny.merchantAddress === "string" && ctxAny.merchantAddress.trim()
      ? ctxAny.merchantAddress.trim()
      : null) ??
    (context.merchantAddress?.trim() || null);
  if (addrPatch && isBlank(row.merchant_address)) {
    patch.merchant_address = addrPatch;
    fieldsUpdated.push("merchant_address");
  }

  // branch_info: data.branchInfo already updated; sync the column too
  if (typeof data.branchInfo === "string" && data.branchInfo.trim() && isBlank(row.branch_info)) {
    patch.branch_info = data.branchInfo.trim();
    fieldsUpdated.push("branch_info");
  }

  // Structured address components — City/District/Neighborhood/Street
  const cityVal = typeof ctxAny.addressCity === "string" && ctxAny.addressCity.trim()
    ? ctxAny.addressCity.trim() : null;
  const districtVal = typeof ctxAny.addressDistrict === "string" && ctxAny.addressDistrict.trim()
    ? ctxAny.addressDistrict.trim() : null;
  const neighborhoodVal = typeof ctxAny.addressNeighborhood === "string" && ctxAny.addressNeighborhood.trim()
    ? ctxAny.addressNeighborhood.trim() : null;
  const streetVal = typeof ctxAny.addressStreet === "string" && ctxAny.addressStreet.trim()
    ? ctxAny.addressStreet.trim() : null;

  if (cityVal && isBlank(row.merchant_city)) {
    patch.merchant_city = cityVal;
    data.addressCity = cityVal;
    fieldsUpdated.push("merchant_city");
  }
  if (districtVal && isBlank(row.merchant_district)) {
    patch.merchant_district = districtVal;
    data.addressDistrict = districtVal;
    fieldsUpdated.push("merchant_district");
  }
  if (neighborhoodVal && isBlank(row.merchant_neighborhood)) {
    patch.merchant_neighborhood = neighborhoodVal;
    data.addressNeighborhood = neighborhoodVal;
    fieldsUpdated.push("merchant_neighborhood");
  }
  if (streetVal && isBlank(row.merchant_street)) {
    patch.merchant_street = streetVal;
    data.addressStreet = streetVal;
    fieldsUpdated.push("merchant_street");
  }

  const mergedJson = JSON.stringify(data);

  await sql`
    UPDATE receipts
    SET
      receipt_data = ${mergedJson}::jsonb,
      merchant_name = COALESCE(${patch.merchant_name ?? null}, merchant_name),
      merchant_place_id = COALESCE(${patch.merchant_place_id ?? null}, merchant_place_id),
      extraction_date_value = COALESCE(${patch.extraction_date_value ?? null}, extraction_date_value),
      extraction_time_value = COALESCE(${patch.extraction_time_value ?? null}, extraction_time_value),
      pricing_total_paid = COALESCE(${patch.pricing_total_paid ?? null}, pricing_total_paid),
      pricing_vat_amount = COALESCE(${patch.pricing_vat_amount ?? null}, pricing_vat_amount),
      pricing_currency = COALESCE(${patch.pricing_currency ?? null}, pricing_currency),
      merchant_country = COALESCE(${patch.merchant_country ?? null}, merchant_country),
      merchant_category = COALESCE(${patch.merchant_category ?? null}, merchant_category),
      merchant_address = COALESCE(${patch.merchant_address ?? null}, merchant_address),
      branch_info = COALESCE(${patch.branch_info ?? null}, branch_info),
      merchant_city = COALESCE(${patch.merchant_city ?? null}, merchant_city),
      merchant_district = COALESCE(${patch.merchant_district ?? null}, merchant_district),
      merchant_neighborhood = COALESCE(${patch.merchant_neighborhood ?? null}, merchant_neighborhood),
      merchant_street = COALESCE(${patch.merchant_street ?? null}, merchant_street),
      post_process_state = 'pending',
      post_process_started_at = NULL
    WHERE receipt_id = ${originalReceiptId}
  `;

  if (ctxAny.visionRawJson != null) {
    const vj = JSON.stringify(ctxAny.visionRawJson);
    try {
      await sql`
        UPDATE receipts
        SET vision_json = COALESCE(vision_json, ${vj}::jsonb)
        WHERE receipt_id = ${originalReceiptId}
      `;
      fieldsUpdated.push("vision_json(column)");
    } catch (e) {
      console.warn("[duplicate-enrich] vision_json column update skipped:", (e as Error)?.message);
    }
  }

  // receipt_vision_raw: fill only if existing vision is empty
  if (ctxAny.visionRawJson != null) {
    try {
      const vjson = JSON.stringify(ctxAny.visionRawJson);
      await sql`
        INSERT INTO receipt_vision_raw (receipt_id, vision_json)
        VALUES (${originalReceiptId}, ${vjson}::jsonb)
        ON CONFLICT (receipt_id) DO UPDATE SET
          vision_json = COALESCE(receipt_vision_raw.vision_json, EXCLUDED.vision_json)
      `;
      fieldsUpdated.push("receipt_vision_raw(merge)");
    } catch (e) {
      console.warn("[duplicate-enrich] receipt_vision_raw skipped:", (e as Error)?.message);
    }
  }

  const pp = await runPostProcess(originalReceiptId);
  return {
    ok: true,
    originalReceiptId,
    fieldsUpdated,
    postProcessOk: pp.ok,
    postProcessState: pp.state,
    postProcessError: pp.error,
  };
}
