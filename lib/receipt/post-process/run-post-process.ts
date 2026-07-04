/**
 * Phase-2 post-process worker (Oracle plan).
 * Input: receiptId. Reads receipt_vision_raw.vision_json + receipts row.
 * Steps: Vision -> canonical extract -> receipt_canonical + receipt_line_items ->
 * line-level hidden cost -> compare with category hidden ->
 * receipt_rewards (bINT base, bINT bonus) -> notifications -> verified -> trust-update.
 *
 * Reward formula:
 *   bINT = HiddenCost / USD_rate  (hidden cost in local currency → USD-equivalent reward)
 *   bINT bonus = bINT × CPI × Level_Catalyzer × Category_Catalyzer
 */

import { getSql } from "@/lib/db/client";
import { normalizeProductCategoryLvl1 } from "@/lib/receipt/category-taxonomy";
import { isTrustWorkerEnabled } from "@/config/oracle-phases";
import { writeReceiptContributionPoints } from "@/lib/receipt/db/contribution-points";
import {
  computeReceiptQuality,
  computeHonorDelta,
  isAmountInconsistent,
} from "@/lib/receipt/quality/honor-quality";
import { updateUserHonor } from "@/lib/receipt/db/user-honor";
import { matchProofToPendingReceipts, matchItemizedReceiptToPendingSlip, matchSlipToExistingItemizedReceipt } from "@/lib/receipt/proof-matching";
import {
  mergeGrantedRewardIntoReceiptData,
  resolveGrantedReward,
} from "@/lib/receipt/resolve-granted-reward";
import { autoLinkUtilityReceipt } from "@/lib/service-providers/auto-link";
import { checkAndActivateReferral } from "@/lib/referral/referral-activation";
import { applyReferralBonus } from "@/lib/referral/referral-bonus";
import {
  extractCanonicalFromVision,
  parseStructuredLineItemsFromReceiptData,
  allocateLinePricesWhenMissing,
  computeLineHiddenCosts,
  fetchProductionCostWeights,
  fetchEconomicIndexMultipliers,
  fetchEconomicYoYMap,
  fetchTaxonomyBulk,
  fetchTaxonomyBulkV3,
  resolveCanonicalObservations,
  resolveCanonicalObservationsV3,
} from "@/lib/receipt/canonical";
import type { VisionResponseLike } from "@/lib/receipt/canonical";
import { resolveObservationBrands } from "@/lib/receipt/canonical/resolve-brand";
import { getUsdRate, getUsdRateAsync, getCpiSeriesForCategory } from "@/config/reward-formula";
import {
  computeHiddenRate,
  computeRewardFromHiddenSlice,
} from "@/lib/receipt/reward-from-hidden-slice";
import { getSeasonLevelMultiplier } from "@/config/season-level-config";
import { getEconomicIndexFromDB } from "@/lib/db/economicIndex";
import { getTuikReferencePriceBulk } from "@/lib/mining/tuikReferencePrice";
import {
  validateReceiptExtraction,
  buildReceiptExtractionPayloadFromStoredReceipt,
  extractionValidationToStoredShape,
  mergeExtractionValidationIntoReceiptData,
} from "@/lib/receipt/validation";
import { upsertOtherExpenseReceipt } from "@/lib/receipt/db/other-expense";
import { evaluateAchievements } from "@/lib/achievements/evaluate";
import {
  gptFullReceiptToGeminiLineItems,
  parseFullReceiptWithGemini,
} from "@/app/api/receipt/analyze/services/gpt-full-receipt-service";

function merchantCategoryToInternal(category: string | null | undefined): string {
  const raw = (category ?? "").toLowerCase().trim();
  const map: Record<string, string> = {
    gıda: "groceries_fmcg", gida: "groceries_fmcg", grocery: "groceries_fmcg", groceries: "groceries_fmcg",
    supermarket: "groceries_fmcg", fmcg: "groceries_fmcg",
    giyim: "apparel_fashion", apparel: "apparel_fashion", fashion: "apparel_fashion",
    elektronik: "electronics", electronics: "electronics",
    kozmetik: "beauty_personal_care", beauty: "beauty_personal_care",
    ev: "home_living", home: "home_living", mobilya: "home_living",
    seyahat: "travel_ticket", travel: "travel_ticket",
    yemek: "food_delivery", food: "food_delivery", restoran: "food_delivery",
    dijital: "services_digital", digital: "services_digital",
    konaklama: "hospitality_lodging", hotel: "hospitality_lodging",
  };
  return map[raw] ?? "other";
}

/** Migration 110 adds `source`; keep post-process working until it is applied. */
async function deleteOcrLineItemsForReceipt(
  sql: NonNullable<ReturnType<typeof getSql>>,
  receiptId: string
): Promise<void> {
  try {
    await sql`DELETE FROM receipt_line_items WHERE receipt_id = ${receiptId} AND source <> 'user_manual'`;
  } catch (err) {
    const msg = (err as Error)?.message ?? String(err);
    if (msg.includes("source") && msg.includes("does not exist")) {
      await sql`DELETE FROM receipt_line_items WHERE receipt_id = ${receiptId}`;
      return;
    }
    throw err;
  }
}

export interface PostProcessResult {
  ok: boolean;
  receiptId: string;
  state: string;
  error?: string;
  /** receipt_line_items INSERT count (if canonical ran) */
  lineItemsWritten?: number;
}

interface ReceiptRow {
  receipt_id: string;
  post_process_state: string | null;
  username: string | null;
  hidden_cost_core: number;
  merchant_name: string | null;
  merchant_id: string | null;
  extraction_date_value: string | null;
  extraction_time_value: string | null;
  pricing_paid_ex_tax: number | null;
  pricing_total_paid: number | null;
  pricing_vat_amount: number | null;
  reward_final: number | null;
  reward_raw: number | null;
  is_payment_proof: boolean | null;
  proof_status: string | null;
  payment_proven: boolean | null;
  document_type: string | null;
  pricing_currency: string | null;
  merchant_country: string | null;
  merchant_category: string | null;
  vision_json: unknown;
  vision_from_raw: unknown;
  receipt_data: unknown;
  expense_type: string | null;
  ocr_raw_text: string | null;
}

type SqlClient = NonNullable<ReturnType<typeof getSql>>;

async function receiptRowExists(sql: SqlClient, receiptId: string): Promise<boolean> {
  const rows = await sql`
    SELECT 1 AS ok FROM receipts WHERE receipt_id = ${receiptId} LIMIT 1
  `;
  return rows.length > 0;
}

function isReceiptParentFkViolation(err: unknown): boolean {
  const msg = (err as Error)?.message ?? String(err);
  return (
    msg.includes("receipt_line_items_receipt_id_fkey") ||
    msg.includes("receipt_canonical_receipt_id_fkey") ||
    (msg.includes("violates foreign key constraint") && msg.includes("receipt_id"))
  );
}

function cloneReceiptData(receiptData: unknown): Record<string, unknown> {
  if (!receiptData) return {};
  if (typeof receiptData === "string") {
    try {
      return JSON.parse(receiptData) as Record<string, unknown>;
    } catch {
      return {};
    }
  }
  if (typeof receiptData === "object") {
    return { ...(receiptData as Record<string, unknown>) };
  }
  return {};
}

function hasStoredStructuredLineItems(receiptData: unknown): boolean {
  const data = cloneReceiptData(receiptData);
  const gemini = data.geminiLineItems;
  if (Array.isArray(gemini) && gemini.length > 0) return true;
  const gpt = data.gptFullReceiptResult as Record<string, unknown> | undefined;
  return Array.isArray(gpt?.lineItems) && gpt.lineItems.length > 0;
}

function readStoredOcrText(receiptData: unknown, fallback: string | null | undefined): string {
  const data = cloneReceiptData(receiptData);
  const ocr = data.ocr as Record<string, unknown> | undefined;
  const rawText = typeof ocr?.rawText === "string" ? ocr.rawText : "";
  if (rawText.trim()) return rawText.trim();

  const fullText = typeof data.fullText === "string" ? data.fullText : "";
  if (fullText.trim()) return fullText.trim();

  const ocrRawText = typeof fallback === "string" ? fallback : "";
  return ocrRawText.trim();
}

async function ensureLineItemsForPostProcess(
  sql: NonNullable<ReturnType<typeof getSql>>,
  receiptId: string,
  row: ReceiptRow,
  receiptData: unknown
): Promise<unknown> {
  if (hasStoredStructuredLineItems(receiptData)) return receiptData;

  const country = (row.merchant_country ?? "TR").trim().toUpperCase().slice(0, 2);
  if (country !== "TR") return receiptData;

  const ocrText = readStoredOcrText(receiptData, row.ocr_raw_text);
  if (!ocrText) return receiptData;

  console.log(`[run-post-process] ${receiptId}: structured lines missing; extracting line items in background post-process`);
  const gptResult = await parseFullReceiptWithGemini(ocrText, {
    countryCode: country,
    preferHighAccuracy: true,
  });

  if (!gptResult?.lineItems?.length) {
    console.warn(`[run-post-process] ${receiptId}: background line-item extraction returned no purchasable lines`);
    return receiptData;
  }

  const geminiLineItems = gptFullReceiptToGeminiLineItems(gptResult);
  if (geminiLineItems.length === 0) {
    console.warn(`[run-post-process] ${receiptId}: background line-item extraction normalized to zero usable lines`);
    return receiptData;
  }

  const nextData = {
    ...cloneReceiptData(receiptData),
    geminiLineItems,
    gptFullReceiptResult: gptResult,
  };

  await sql`
    UPDATE receipts
    SET receipt_data = ${JSON.stringify(nextData)}::jsonb,
        updated_at = now()
    WHERE receipt_id = ${receiptId}
  `;

  console.log(`[run-post-process] ${receiptId}: background line-item extraction stored ${geminiLineItems.length} line(s)`);
  return nextData;
}

function isFuelLikeCategory(raw: string | null | undefined): boolean {
  const c = (raw ?? "").toLowerCase().trim();
  if (!c) return false;
  return [
    "fuel",
    "gas station",
    "gas_station",
    "gasoline",
    "petrol",
    "diesel",
    "benzin",
    "motorin",
    "dizel",
    "yakıt",
    "yakit",
    "akaryakıt & enerji",
  ].includes(c);
}

export async function runPostProcess(receiptId: string): Promise<PostProcessResult> {
  const sql = getSql();
  if (!sql) {
    return { ok: false, receiptId, state: "error", error: "Database not available" };
  }

  try {
    const rows = await sql`
      SELECT
        r.receipt_id,
        r.post_process_state,
        r.username,
        COALESCE(r.hidden_cost_core, 0)::float as hidden_cost_core,
        r.merchant_name,
        r.merchant_id,
        r.is_payment_proof,
        r.extraction_date_value,
        r.extraction_time_value,
        r.pricing_paid_ex_tax,
        r.pricing_total_paid,
        r.pricing_vat_amount,
        r.reward_final,
        r.reward_raw,
        r.proof_status,
        r.document_type,
        r.payment_proven,
        r.pricing_currency,
        r.merchant_country,
        r.merchant_category,
        r.vision_json,
        v.vision_json as vision_from_raw,
        r.receipt_data,
        r.ocr_raw_text,
        r.expense_type
      FROM receipts r
      LEFT JOIN receipt_vision_raw v ON v.receipt_id = r.receipt_id
      WHERE r.receipt_id = ${receiptId}
      LIMIT 1
    `;
    const row = rows[0] as ReceiptRow | undefined;
    if (!row) {
      return { ok: false, receiptId, state: "not_found", error: "Receipt not found" };
    }
    if (row.post_process_state && row.post_process_state !== "pending") {
      return { ok: true, receiptId, state: row.post_process_state, lineItemsWritten: 0 };
    }

    // Atomic claim: the UPDATE itself is the lock. If it affects zero rows,
    // another worker won the race between our SELECT above and here, so we
    // must NOT continue — otherwise both runs execute the pipeline and
    // value-bearing side effects (e.g. referral bonus) get applied twice.
    const claimed = await sql`
      UPDATE receipts
      SET post_process_started_at = now(), post_process_state = 'processing'
      WHERE receipt_id = ${receiptId} AND (post_process_state IS NULL OR post_process_state = 'pending')
      RETURNING receipt_id
    `;
    if (claimed.length === 0) {
      return { ok: true, receiptId, state: "processing", lineItemsWritten: 0 };
    }

    const receiptDataForProcessing = await ensureLineItemsForPostProcess(sql, receiptId, row, row.receipt_data);

    const vPayload = buildReceiptExtractionPayloadFromStoredReceipt(receiptDataForProcessing, {
      pricing_total_paid: row.pricing_total_paid,
      pricing_vat_amount: row.pricing_vat_amount,
      merchant_name: row.merchant_name,
      extraction_date_value: row.extraction_date_value,
      extraction_time_value: row.extraction_time_value,
    });
    const vr = validateReceiptExtraction(vPayload);
    if (vr.status === "rejected") {
      // Hard abort — Zod schema failure (bad data that cannot be processed at all)
      const stored = extractionValidationToStoredShape(vr);
      const mergedJson = mergeExtractionValidationIntoReceiptData(receiptDataForProcessing, stored);
      await sql`
        UPDATE receipts
        SET receipt_data = ${mergedJson}::jsonb,
            post_process_state = 'validation_rejected'
        WHERE receipt_id = ${receiptId}
      `;
      console.warn(`[run-post-process] Extraction validation rejected (Zod): ${vr.zodErrors.join("; ")}`);
      return { ok: true, receiptId, state: "validation_rejected", lineItemsWritten: 0 };
    }
    if (vr.status === "needs_review") {
      // Soft flag — empty/mismatched line items; record the result but DO NOT abort.
      // Canonical pipeline may still run if geminiLineItems exists; rewards always run.
      const stored = extractionValidationToStoredShape(vr);
      const mergedJson = mergeExtractionValidationIntoReceiptData(receiptDataForProcessing, stored);
      await sql`
        UPDATE receipts
        SET receipt_data = ${mergedJson}::jsonb
        WHERE receipt_id = ${receiptId}
      `;
      console.warn(`[run-post-process] Extraction validation needs_review: ${vr.reason} — continuing pipeline`);
    }

    const categoryHidden = Number(row.hidden_cost_core) ?? 0;
    const isOtherExpense = row.expense_type === "other";
    const paidExTax = Number(row.pricing_paid_ex_tax) ?? 0;
    const country = (row.merchant_country ?? "TR") as string;
    const yearMonth = row.extraction_date_value
      ? String(row.extraction_date_value).slice(0, 7)
      : new Date().toISOString().slice(0, 7);

    let totalHiddenCanonical: number | null = null;
    let lineItemsWritten = 0;
    const visionJson = (row.vision_from_raw ?? row.vision_json) as VisionResponseLike | null | undefined;
    const rawStructured = parseStructuredLineItemsFromReceiptData(receiptDataForProcessing);
    const paidForAlloc =
      paidExTax > 0 ? paidExTax : Math.max(0, Number(row.pricing_total_paid) || 0);
    const geminiLineItems = rawStructured?.length
      ? allocateLinePricesWhenMissing(rawStructured, paidForAlloc)
      : undefined;
    const canRunCanonical = Boolean(geminiLineItems && geminiLineItems.length > 0);

    if (!canRunCanonical) {
      console.warn(
        `[run-post-process] ${receiptId}: receipt_data'da yapılandırılmış satır yok (geminiLineItems / gptFullReceiptResult); receipt_line_items yazılmadı`
      );
    }

    if (canRunCanonical) {
      try {
        const payload = extractCanonicalFromVision(visionJson ?? null, {
          receiptId,
          merchantName: row.merchant_name ?? undefined,
          totalPaid: row.pricing_total_paid ?? undefined,
          paidExTax: paidExTax || undefined,
          date: row.extraction_date_value ?? undefined,
          currency: row.pricing_currency ?? undefined,
          category: row.merchant_category ?? undefined,
          geminiLineItems,
        });

        // Taxonomy fuzzy match (pg_trgm) → LLM fallback → upsert new canonical rows.
        // RAC mode (USE_RAC_PRODUCT=true) shows existing canonical_products to LLM
        // as candidates → matches instead of creating duplicates. Default OFF.
        const useV3 = process.env.USE_TAXONOMY_V3 === "true";
        if (useV3) {
          await resolveCanonicalObservationsV3(payload.observations, {
            merchantId: row.merchant_id ?? null,
            language: row.merchant_country ?? undefined,
          });
        } else {
          await resolveCanonicalObservations(payload.observations);
        }

        // Brand resolution + classification (registry match → status), shared by
        // both resolve paths. Fills missing brands deterministically and marks
        // brand-expected gaps as 'needs_user' for the result-screen prompt.
        await resolveObservationBrands(sql, payload.observations);

        const fallbackHiddenRate =
          paidExTax > 0 && categoryHidden >= 0 ? categoryHidden / paidExTax : 0.35;
        // Research-data overrides (tax_rates + commercial_margins) — load before compute.
        const { ensureHiddenCostOverrides } = await import("@/lib/mining/hiddenCostOverrides");
        await ensureHiddenCostOverrides(country);
        const { getHiddenCostTier } = await import("@/lib/receipt/canonical/hidden-cost-tier");
        const hiddenCostTier = await getHiddenCostTier(country);
        const weights = await fetchProductionCostWeights(country);
        // Category-based + up-to-date + bug-free YoY multiplier map (replaces the old global multipliers).
        const economicYoY = await fetchEconomicYoYMap(country, yearMonth);
        const economicMultipliers = await fetchEconomicIndexMultipliers(country, yearMonth);

        // TÜİK average-price lookup — fetch all lines in a single query
        const tuikPrices = await getTuikReferencePriceBulk(
          payload.observations.map((o) => ({ name: o.canonical_name || o.raw_name, unit: o.unit_type ?? undefined })),
          yearMonth
        );

        // Product-level taxonomy lookup — canonical_product_taxonomy (legacy) or canonical_product_cost_weights (v3)
        const taxonomyByName = useV3
          ? await fetchTaxonomyBulkV3(
              payload.observations.map((o) => o.canonical_name || o.raw_name)
            )
          : await fetchTaxonomyBulk(
              payload.observations.map((o) => o.canonical_name || o.raw_name)
            );

        // Fresh-produce wholesale reference — current İzmir wholesale market (real data; scraping REMOVED)
        const { fetchIzmirHalBulk } = await import("@/lib/receipt/canonical/line-hidden-cost");
        const halPrices = await fetchIzmirHalBulk();

        const { results, totalHiddenCanonical: total } = computeLineHiddenCosts({
          payload,
          country,
          yearMonth,
          fallbackHiddenRate: Math.min(0.7, Math.max(0.1, fallbackHiddenRate)),
          weightsByCategory: weights,
          economicMultipliers: economicMultipliers ?? undefined,
          economicYoY,
          tuikPrices,
          taxonomyByName,
          halPrices,
          hiddenCostTier,
        });
        totalHiddenCanonical = total;

        if (!(await receiptRowExists(sql, receiptId))) {
          console.warn(
            `[run-post-process] ${receiptId}: receipt deleted before canonical write, aborting`
          );
          return { ok: true, receiptId, state: "orphaned", lineItemsWritten: 0 };
        }

        await sql`
          INSERT INTO receipt_canonical (receipt_id, payload, total_hidden_canonical, analyzed_at)
          VALUES (${receiptId}, ${JSON.stringify(payload)}::jsonb, ${total}, now())
          ON CONFLICT (receipt_id) DO UPDATE SET
            payload = EXCLUDED.payload,
            total_hidden_canonical = EXCLUDED.total_hidden_canonical,
            analyzed_at = now()
        `;

        // user_manual rows are user-typed completions, not OCR output — a
        // re-analyze must not wipe them.
        await deleteOcrLineItemsForReceipt(sql, receiptId);
        lineItemsWritten = 0;
        for (const r of results) {
          if (!(await receiptRowExists(sql, receiptId))) {
            console.warn(
              `[run-post-process] ${receiptId}: receipt deleted during line-item write (${lineItemsWritten} written), aborting`
            );
            return { ok: true, receiptId, state: "orphaned", lineItemsWritten };
          }
          const o = r.observation;
          // Category priority: 1) taxonomy DB match, 2) GPT/LLM output, 3) merchant category
          const productKey = (o.canonical_name || o.raw_name || "").toLowerCase().trim();
          const taxRow = productKey ? taxonomyByName.get(productKey) : undefined;
          const rawCategoryLvl1 =
            isFuelLikeCategory(o.category_lvl1) && !isFuelLikeCategory(taxRow?.category_lvl1)
              ? (o.category_lvl1 || taxRow?.category_lvl1 || null)
              : (taxRow?.category_lvl1 || o.category_lvl1 || null);
          // Single canonical lvl1 taxonomy — short English enum regardless of whether it comes from taxonomy or LLM.
          const finalCategoryLvl1 = normalizeProductCategoryLvl1(rawCategoryLvl1);
          const finalCategoryLvl2 = taxRow?.category_lvl2 || o.category_lvl2 || null;
          await sql`
            INSERT INTO receipt_line_items (
              receipt_id, raw_name, canonical_name, brand, brand_status, category_lvl1, category_lvl2,
              pack_size, unit_type, quantity, unit_price, line_total, unit_price_gross, line_total_gross,
              discount_amount, vat_rate, confidence_score, reference_price, hidden_cost_line,
              category_path, display_name_tr, attributes, lifestyle_tags, consumption_occasions,
              allergens, price_tier, canonical_id
            )
            VALUES (
              ${receiptId},
              ${o.raw_name ?? null},
              ${o.canonical_name ?? null},
              ${o.brand ?? null},
              ${o.brand_status ?? null},
              ${finalCategoryLvl1},
              ${finalCategoryLvl2},
              ${o.pack_size ?? null},
              ${o.unit_type ?? null},
              ${o.quantity ?? 1},
              ${o.unit_price_gross ?? o.line_total_gross ?? null},
              ${o.line_total_gross ?? null},
              ${o.unit_price_gross ?? null},
              ${o.line_total_gross ?? null},
              ${o.discount_amount ?? 0},
              ${o.vat_rate ?? null},
              ${o.confidence_score ?? null},
              ${r.reference_price},
              ${r.hidden_cost_line},
              ${o.category_path ?? null},
              ${o.display_name_tr ?? null},
              ${JSON.stringify(o.attributes ?? {})}::jsonb,
              ${o.lifestyle_tags ?? null},
              ${o.consumption_occasions ?? null},
              ${o.allergens ?? null},
              ${o.price_tier ?? null},
              ${o.canonical_id ?? null}
            )
          `;
          lineItemsWritten += 1;
        }
      } catch (canonicalErr) {
        const msg = (canonicalErr as Error)?.message ?? String(canonicalErr);
        if (isReceiptParentFkViolation(canonicalErr)) {
          console.warn(
            `[run-post-process] ${receiptId}: canonical aborted — parent receipt missing (${msg})`
          );
          return { ok: true, receiptId, state: "orphaned", lineItemsWritten };
        }
        console.error("[run-post-process] Canonical pipeline failed:", msg);
        throw canonicalErr;
      }
    }

    const usdRate = Math.max(
      0.0001,
      await getUsdRateAsync(row.pricing_currency, country, yearMonth)
    );
    const baseRate = computeHiddenRate(paidExTax, categoryHidden);
    const baseBint = computeRewardFromHiddenSlice(paidExTax, baseRate, usdRate);
    let extraReward = 0;
    let finalHiddenCost = categoryHidden;

    // SINGLE COMPUTE (product decision): hidden cost + reward were computed via
    // cascade at UPLOAD time (categoryHidden = receipts.hidden_cost_core). Post-process
    // does NOT recompute it — it only writes the line items (receipt_line_items).
    // No extraReward; finalHiddenCost = the upload-time value.
    // Note: if the upload cascade did not run (old/edge-case receipt), categoryHidden
    // is already 0/fallback.
    void totalHiddenCanonical;

    const bintTotal = baseBint + extraReward;
    const cpiValue = await getEconomicIndexFromDB(country as "TR" | "US" | "TH" | "MY", "CPI", yearMonth, "GENEL");
    const cpiMultiplier = cpiValue != null && Number(cpiValue) > 0 ? Number(cpiValue) : (country === "MY" ? 2 : 1.0);
    const categoryCatalyzer = 1.0;
    let seasonLevelMultiplier = 1.0;
    if (row.username) {
      const profileRows = await sql`
        SELECT COALESCE(season_level, 1)::int AS season_level FROM user_profiles WHERE username = ${row.username} LIMIT 1
      `;
      if (profileRows.length > 0) {
        const level = Number((profileRows[0] as { season_level: number }).season_level) || 1;
        seasonLevelMultiplier = getSeasonLevelMultiplier(level);
      }
    }
    const bintBonus = Math.round(bintTotal * cpiMultiplier * seasonLevelMultiplier * categoryCatalyzer * 100) / 100;
    const extraBintBonus =
      extraReward > 0
        ? Math.round(extraReward * cpiMultiplier * seasonLevelMultiplier * categoryCatalyzer * 100) / 100
        : 0;

    const storedRewardFinal = Number(row.reward_final ?? 0) || 0;
    const granted = resolveGrantedReward({
      receiptData: receiptDataForProcessing,
      merchantName: row.merchant_name,
      extractionDate: row.extraction_date_value,
      paymentProven: row.payment_proven,
      paidExTax,
      hiddenCostCore: categoryHidden,
      usdRate,
      storedRewardFinal,
    });
    const grantedBaseBint = granted.grantedBint;
    const grantedBintTotal =
      grantedBaseBint > 0
        ? Math.round((grantedBaseBint + extraReward) * 100) / 100
        : 0;
    const grantedBintBonus =
      grantedBintTotal > 0
        ? Math.round(grantedBintTotal * cpiMultiplier * seasonLevelMultiplier * categoryCatalyzer * 100) / 100
        : 0;
    const mergedReceiptData = mergeGrantedRewardIntoReceiptData(
      receiptDataForProcessing,
      granted,
      grantedBintBonus
    );

    if (grantedBintTotal > 0) {
      const proofStatusValue = granted.proofStatus;
      await sql`
        UPDATE receipts
        SET
          reward_final = ${grantedBintTotal},
          reward_raw = ${Math.round(granted.fullRewardEstimate * 100) / 100},
          document_type = COALESCE(${granted.documentType}, document_type),
          is_payment_proof = COALESCE(${granted.isPaymentProof ? true : null}, is_payment_proof),
          proof_status = COALESCE(${proofStatusValue}, proof_status),
          receipt_data = ${JSON.stringify(mergedReceiptData)}::jsonb,
          updated_at = now()
        WHERE receipt_id = ${receiptId}
      `;
      row.is_payment_proof = granted.isPaymentProof ? true : row.is_payment_proof;
      row.proof_status = granted.proofStatus ?? row.proof_status;
      row.reward_final = grantedBintTotal;
    } else if (storedRewardFinal <= 0) {
      await sql`
        UPDATE receipt_rewards
        SET
          base_reward_amount = 0,
          extra_reward_amount = 0,
          bint_amount = 0,
          bint_bonus_amount = 0,
          updated_at = now()
        WHERE receipt_id = ${receiptId}
      `;
    }

    const bintPersist = grantedBintTotal > 0 ? grantedBintTotal : 0;
    const bintBonusPersist = grantedBintTotal > 0 ? grantedBintBonus : 0;

    if (bintPersist > 0) {
      await sql`
        INSERT INTO receipt_rewards (
          receipt_id, base_reward_amount, extra_reward_amount, base_hidden_cost, final_hidden_cost,
          bint_amount,
          bint_bonus_amount, cpi_multiplier_used, exchange_rate_used, season_level_multiplier_used,
          reward_version
        )
        VALUES (
          ${receiptId}, ${grantedBaseBint}, ${extraReward}, ${categoryHidden}, ${finalHiddenCost},
          ${bintPersist},
          ${bintBonusPersist}, ${cpiMultiplier}, ${usdRate}, ${seasonLevelMultiplier},
          2
        )
        ON CONFLICT (receipt_id) DO UPDATE SET
          base_reward_amount = EXCLUDED.base_reward_amount,
          extra_reward_amount = EXCLUDED.extra_reward_amount,
          base_hidden_cost = EXCLUDED.base_hidden_cost,
          final_hidden_cost = EXCLUDED.final_hidden_cost,
          bint_amount = EXCLUDED.bint_amount,
          bint_bonus_amount = EXCLUDED.bint_bonus_amount,
          cpi_multiplier_used = EXCLUDED.cpi_multiplier_used,
          exchange_rate_used = EXCLUDED.exchange_rate_used,
          season_level_multiplier_used = EXCLUDED.season_level_multiplier_used,
          updated_at = now()
      `;
    }

    if (isOtherExpense) {
      try {
        await upsertOtherExpenseReceipt({
          receiptId,
          status: "rewarded_other",
          username: row.username ?? "",
          merchant: {
            name: row.merchant_name ?? "Other Expense",
            country: row.merchant_country ?? undefined,
            category: row.merchant_category ?? undefined,
          },
          extraction: {
            date: {
              value: row.extraction_date_value ?? new Date().toISOString().slice(0, 10),
              confidence: 0.8,
            },
            total: {
              value: Number(row.pricing_total_paid ?? 0) || 0,
              confidence: 0.8,
            },
            vat: {
              value: Number(row.pricing_vat_amount ?? 0) || 0,
              confidence: 0.8,
            },
          },
          pricing: {
            totalPaid: Number(row.pricing_total_paid ?? 0) || 0,
            vatAmount: Number(row.pricing_vat_amount ?? 0) || 0,
            paidExTax,
            paidPriceExTax: paidExTax,
            stateLayerTax: Number(row.pricing_vat_amount ?? 0) || 0,
            importSystemRate: 0,
            retailHiddenRate: 0,
            currency: row.pricing_currency ?? "TRY",
          },
          hiddenCost: {
            referencePrice: Number(row.pricing_total_paid ?? 0) || 0,
            hiddenCostCore: finalHiddenCost,
            breakdown: {
              importSystemCost: finalHiddenCost * 0.35,
              retailHiddenCost: finalHiddenCost * 0.65,
              items: [],
            },
          },
          reward: {
            conversionRate: 1,
            raw: bintTotal,
            final: bintBonus,
            token: "cPoints",
            capsApplied: [],
            ryumo: bintBonus,
          },
          flags: {
            needsLLM: false,
            reasons: [],
          },
          ocr: {
            lines: [],
            rawText: "",
          },
          expenseType: "other",
          createdAt: new Date().toISOString(),
        });
      } catch (archiveErr) {
        console.warn("[run-post-process] other expense archive failed:", archiveErr);
      }

      await sql`
        UPDATE receipts
        SET
          status = 'rewarded_other',
          post_process_state = 'rewarded_other',
          post_process_completed_at = now(),
          receipt_data = jsonb_set(
            COALESCE(receipt_data, '{}'::jsonb),
            '{status}',
            to_jsonb('rewarded_other'::text),
            true
          )
        WHERE receipt_id = ${receiptId}
      `;

      return { ok: true, receiptId, state: "rewarded_other", lineItemsWritten };
    }
    // Verified: update state + sync receipt_data.status + fill address fields
    await sql`
      UPDATE receipts
      SET
        status = 'verified',
        post_process_state = 'verified',
        post_process_completed_at = now(),
        receipt_data = jsonb_set(
          COALESCE(receipt_data, '{}'::jsonb),
          '{status}',
          to_jsonb('verified'::text),
          true
        ),
        merchant_address = COALESCE(
          merchant_address,
          receipt_data->>'merchantAddress',
          receipt_data->'merchant'->>'address'
        ),
        branch_info = COALESCE(
          branch_info,
          receipt_data->>'branchInfo',
          receipt_data->'gptFullReceiptResult'->>'branchInfo'
        ),
        merchant_city = COALESCE(
          merchant_city,
          receipt_data->>'addressCity',
          receipt_data->'gptFullReceiptResult'->>'addressCity'
        ),
        merchant_district = COALESCE(
          merchant_district,
          receipt_data->>'addressDistrict',
          receipt_data->'gptFullReceiptResult'->>'addressDistrict'
        ),
        merchant_neighborhood = COALESCE(
          merchant_neighborhood,
          receipt_data->>'addressNeighborhood',
          receipt_data->'gptFullReceiptResult'->>'addressNeighborhood'
        ),
        merchant_street = COALESCE(
          merchant_street,
          receipt_data->>'addressStreet',
          receipt_data->'gptFullReceiptResult'->>'addressStreet'
        )
      WHERE receipt_id = ${receiptId}
    `;

    if (row.username) {
      await sql`
        INSERT INTO user_notifications (username, type, title, body, payload, receipt_id)
        SELECT
          ${row.username},
          'receipt_verified',
          'Receipt verified',
          'Your receipt analysis is completed. Tap to open claim.',
          ${JSON.stringify({ receiptId, target: 'claim_done' })}::jsonb,
          ${receiptId}
        WHERE NOT EXISTS (
          SELECT 1
          FROM user_notifications
          WHERE username = ${row.username}
            AND receipt_id = ${receiptId}
            AND type = 'receipt_verified'
        )
      `;

      if (extraBintBonus > 0 && grantedBintTotal > 0) {
        await sql`
          INSERT INTO user_notifications (username, type, title, body, payload, receipt_id)
          SELECT
            ${row.username},
            'reward_topup',
            'Line-item bonus',
            ${`Detailed line analysis added +${extraBintBonus.toFixed(2)} bINT to this receipt.`},
            ${JSON.stringify({
              receiptId,
              extraRewardBint: extraReward,
              extraRewardBintBonus: extraBintBonus,
              baseRate,
              lineRate: totalHiddenCanonical != null ? computeHiddenRate(paidExTax, totalHiddenCanonical) : baseRate,
            })}::jsonb,
            ${receiptId}
          WHERE NOT EXISTS (
            SELECT 1
            FROM user_notifications
            WHERE username = ${row.username}
              AND receipt_id = ${receiptId}
              AND type = 'reward_topup'
          )
        `;
      }
    }

    // Proof matching — POS slip uploaded → legacy pending tabs or existing itemized receipts
    if (row.is_payment_proof === true && row.username && row.pricing_total_paid && row.extraction_date_value) {
      matchProofToPendingReceipts(receiptId, {
        userId: row.username,
        canonicalMerchantId: row.merchant_id ?? undefined,
        merchantName: row.merchant_name ?? undefined,
        total: row.pricing_total_paid,
        date: row.extraction_date_value,
      }).then((results) => {
        if (results.length > 0) {
          console.log(`[run-post-process] 🔗 Proof matched ${results.length} pending receipt(s) for ${receiptId}`);
        }
      }).catch((e) => {
        console.warn("[run-post-process] proof matching failed (non-blocking):", e);
      });

      try {
        const reverseResults = await matchSlipToExistingItemizedReceipt(receiptId, {
          userId: row.username,
          merchantName: row.merchant_name ?? undefined,
          total: row.pricing_total_paid,
          date: row.extraction_date_value,
        });
        if (reverseResults.length > 0) {
          console.log(
            `[run-post-process] 🔗 Slip ${receiptId} completed ${reverseResults.length} existing itemized receipt(s)`
          );
        }
      } catch (e) {
        console.warn("[run-post-process] slip→itemized matching failed:", e);
      }
    }

    // Itemized receipt uploaded → complete pending POS slip (50% → 100%)
    if (
      lineItemsWritten > 0 &&
      row.is_payment_proof !== true &&
      row.username &&
      row.pricing_total_paid &&
      row.extraction_date_value
    ) {
      let linkedSlipReceiptId: string | null = null;
      try {
        const data =
          typeof row.receipt_data === "string"
            ? JSON.parse(row.receipt_data)
            : row.receipt_data;
        linkedSlipReceiptId =
          typeof data?.completeSlipReceiptId === "string"
            ? data.completeSlipReceiptId
            : null;
      } catch {
        linkedSlipReceiptId = null;
      }

      try {
        const results = await matchItemizedReceiptToPendingSlip(receiptId, {
          userId: row.username,
          merchantName: row.merchant_name ?? undefined,
          total: row.pricing_total_paid,
          date: row.extraction_date_value,
          lineItemCount: lineItemsWritten,
          linkedSlipReceiptId,
        });
        if (results.length > 0) {
          console.log(
            `[run-post-process] 🔗 Itemized receipt ${receiptId} completed ${results.length} POS slip(s)`
          );
        }
      } catch (e) {
        console.warn("[run-post-process] itemized→slip matching failed:", e);
      }
    }

    // Utility bill → bills section: whatever channel the document came from,
    // a core utility bill (electricity/water/gas) is linked to (or creates) a
    // service provider so it shows up under Faturalarım. No-op for other types.
    if ((row.document_type ?? "") === "utility_bill") {
      autoLinkUtilityReceipt(receiptId).catch((e) => {
        console.warn("[run-post-process] utility auto-link failed (non-blocking):", e);
      });
    }

    // Referral: activation check + bonus (fire-and-forget)
    if (row.username) {
      try {
        const activation = await checkAndActivateReferral(row.username);
        if (activation.activated && activation.referrerUsername) {
          await sql`
            INSERT INTO user_notifications (username, type, title, body, payload)
            VALUES (
              ${activation.referrerUsername},
              'referral_activated',
              'Referral activated',
              ${`${row.username} completed activation. You earn 5% bonus for 30 days!`},
              ${JSON.stringify({ refereeUsername: row.username })}::jsonb
            )
          `;
        }
      } catch (e) {
        console.warn("[run-post-process] referral activation check failed:", e);
      }

      try {
        // Base the referrer bonus on the gated amount the referee actually
        // received, not the ungated estimate — order pages / unproven-payment
        // receipts grant the referee 0 and must not mint a referrer bonus.
        const bonus = await applyReferralBonus(receiptId, row.username, grantedBintBonus);
        if (bonus.applied && bonus.referrerUsername) {
          await sql`
            INSERT INTO user_notifications (username, type, title, body, payload, receipt_id)
            SELECT
              ${bonus.referrerUsername},
              'referral_bonus',
              'Referral bonus earned',
              ${`You earned ${bonus.bonusAmount.toFixed(2)} bINT from ${row.username}'s receipt.`},
              ${JSON.stringify({ refereeUsername: row.username, bonusAmount: bonus.bonusAmount })}::jsonb,
              ${receiptId}
            WHERE NOT EXISTS (
              SELECT 1 FROM user_notifications
              WHERE username = ${bonus.referrerUsername}
                AND receipt_id = ${receiptId}
                AND type = 'referral_bonus'
            )
          `;
        }
      } catch (e) {
        console.warn("[run-post-process] referral bonus failed:", e);
      }
    }

    // Phase 2: receipt_quality (tier) + honor (live). MUST run BEFORE contribution
    // points so cPoints quality_x reads a populated tier, and feeds the
    // data-product sellability marking. Honor moves per-receipt: tier → recovery,
    // B (POS slip) / A (amount mismatch) → penalty. Non-fatal.
    // Per the product decision (2026-06-03).
    if (row.username) {
      try {
        const quality = computeReceiptQuality({
          hasMerchant: !!(
            row.merchant_name &&
            row.merchant_name.trim() &&
            row.merchant_name !== "Unknown Merchant"
          ),
          hasDate: !!row.extraction_date_value,
          hasTime: !!row.extraction_time_value,
          hasTotal: (Number(row.pricing_total_paid) || 0) > 0,
          hasVat: row.pricing_vat_amount != null,
          lineItemCount: lineItemsWritten,
        });
        // RETURNING (xmax = 0): true on INSERT (first verification), false on
        // UPDATE (a re-run, e.g. recompute after an admin-approved correction).
        // Honor delta applies ONCE per receipt — never double-counted on recompute.
        const qRows = await sql`
          INSERT INTO receipt_quality (receipt_id, score, tier, reasons)
          VALUES (${receiptId}, ${quality.score}, ${quality.tier}, ${JSON.stringify(quality.reasons)}::jsonb)
          ON CONFLICT (receipt_id) DO UPDATE SET
            score = EXCLUDED.score, tier = EXCLUDED.tier, reasons = EXCLUDED.reasons
          RETURNING (xmax = 0) AS inserted
        `;
        const firstVerification = (qRows as any[])[0]?.inserted === true;

        if (firstVerification) {
          // A-guard re-derivation from persisted line totals (Σ line_total vs total).
          let sumLineTotals = 0;
          try {
            const sumRows = await sql`
              SELECT COALESCE(SUM(line_total), 0)::float8 AS s
              FROM receipt_line_items WHERE receipt_id = ${receiptId}
            `;
            sumLineTotals = Number((sumRows as any[])[0]?.s ?? 0);
          } catch { /* sum unavailable → treat as consistent */ }

          const honorDelta = computeHonorDelta({
            tier: quality.tier,
            isPosSlip: (row.document_type ?? "").toLowerCase() === "payment_receipt",
            amountInconsistent: isAmountInconsistent(sumLineTotals, Number(row.pricing_total_paid)),
          });
          await updateUserHonor(row.username, honorDelta);
          console.log(
            `[run-post-process] ${receiptId}: quality=${quality.tier}(${quality.score}) honorDelta=${honorDelta}`
          );
        } else {
          console.log(
            `[run-post-process] ${receiptId}: quality=${quality.tier}(${quality.score}) recompute — honor unchanged`
          );
        }
      } catch (e) {
        console.warn("[run-post-process] quality/honor update failed (non-fatal):", e);
      }
    }

    // Contribution points — write points after the receipt is verified (fire-and-forget)
    if (row.username) {
      let currentSeasonNumber: number | null = null;
      try {
        const seasonRows = await sql`
          SELECT season_number FROM seasons WHERE status = 'active' ORDER BY start_at DESC LIMIT 1
        `;
        currentSeasonNumber = (seasonRows as any[])[0]?.season_number ?? null;
      } catch { /* stays null if there is no active season */ }

      let hiddenCostLineCount = 0;
      try {
        const lineRows = await sql`
          SELECT COUNT(*) FILTER (WHERE hidden_cost_line IS NOT NULL)::int AS hidden_cost_line_count
          FROM receipt_line_items WHERE receipt_id = ${receiptId}
        `;
        hiddenCostLineCount = Number((lineRows as any[])[0]?.hidden_cost_line_count ?? 0);
      } catch { /* fallback 0 */ }

      writeReceiptContributionPoints(sql, {
        receiptId,
        username: row.username,
        seasonNumber: currentSeasonNumber,
        lineCount: lineItemsWritten,
        hiddenCostLineCount,
        merchantName: row.merchant_name,
        merchantCategory: row.merchant_category,
        merchantCountry: row.merchant_country,
        merchantCity: null,
      }).catch((e) => console.warn("[run-post-process] contribution-points failed:", e));
    }

    if (isTrustWorkerEnabled()) {
      const base = process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
      const internalSecret = process.env.INTERNAL_SECRET;
      fetch(`${base}/api/internal/trust-update?receiptId=${encodeURIComponent(receiptId)}`, {
        method: "POST",
        cache: "no-store",
        ...(internalSecret && { headers: { Authorization: `Bearer ${internalSecret}` } }),
      }).catch((err) => console.warn("[run-post-process] trust-update fire-and-forget failed:", err?.message));
    }

    // Achievements: recompute the user's tiered tracks and grant any newly-earned
    // tier badges. Idempotent + defensive (never throws) — must not break the
    // pipeline. Catalog: config/achievements.ts.
    if (row.username) {
      await evaluateAchievements(row.username);
    }

    return { ok: true, receiptId, state: "verified", lineItemsWritten };
  } catch (err: unknown) {
    const sqlFail = getSql();
    if (sqlFail) {
      sqlFail`
        UPDATE receipts
        SET post_process_state = 'failed', post_process_failed_at = now(),
            post_process_retry_count = COALESCE(post_process_retry_count, 0) + 1
        WHERE receipt_id = ${receiptId}
      `.catch(() => {});
    }
    return {
      ok: false,
      receiptId,
      state: "failed",
      error: err instanceof Error ? err.message : String(err),
    };
  }
}
