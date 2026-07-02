/**
 * Map ReceiptAnalysis to database columns
 * SERVER-ONLY: Do not import in client components
 */

import type { ReceiptAnalysis } from "../../types";
import { normalizeMerchantDisplayName } from "@/lib/receipt/name-normalization";

function buildReceiptDataSnapshot(receipt: ReceiptAnalysis): string {
  const { visionRawJson: _visionRawJson, ...snapshot } = receipt;
  return JSON.stringify(snapshot);
}

/**
 * Helper function to clamp rate/confidence values to 0-1 range
 * If value > 1, assume it's a percentage and divide by 100
 */
export function clampRate(value: number | null | undefined): number | null {
  if (value == null || !isFinite(value)) return null;
  if (value > 1) {
    // Likely a percentage (e.g., 20 for 20%), convert to decimal (0.20)
    const clamped = value / 100;
    console.warn(`[storage-db] Rate/confidence value ${value} > 1, converting to ${clamped} (assuming percentage)`);
    return Math.max(0, Math.min(1, clamped));
  }
  return Math.max(0, Math.min(1, value));
}

/**
 * Convert ReceiptAnalysis to database column values
 */
export function receiptToDbColumns(receipt: ReceiptAnalysis) {
  const merchant = receipt.merchant || { name: "Unknown" };
  const extractionRaw = receipt.extraction || {};
  const extraction = {
    date: extractionRaw.date || { value: "", confidence: 0 },
    total: extractionRaw.total || { value: 0, confidence: 0 },
    vat: extractionRaw.vat || { value: 0, confidence: 0 },
  };
  const pricingRaw = receipt.pricing || {};
  const pricing = {
    totalPaid: pricingRaw.totalPaid ?? 0,
    vatAmount: pricingRaw.vatAmount ?? 0,
    paidExTax: pricingRaw.paidExTax ?? 0,
    importSystemRate: pricingRaw.importSystemRate ?? 0,
    retailHiddenRate: pricingRaw.retailHiddenRate ?? 0,
    currency: pricingRaw.currency ?? "USD",
    vatRate: pricingRaw.vatRate,
    symbol: pricingRaw.symbol,
  };
  const hiddenCost = receipt.hiddenCost || { referencePrice: 0, hiddenCostCore: 0, breakdown: { importSystemCost: 0, retailHiddenCost: 0, items: [] } };
  const reward = receipt.reward || { conversionRate: 1, raw: 0, final: 0, token: "cPoints", capsApplied: [] };
  const flags = receipt.flags || { needsLLM: false, reasons: [] };
  const ocr = receipt.ocr || { lines: [], rawText: "" };

  // Clamp all rate and confidence values to ensure they're in 0-1 range
  const safeDateConfidence = clampRate(extraction.date.confidence);
  const safeTotalConfidence = clampRate(extraction.total.confidence);
  const safeVatConfidence = clampRate(extraction.vat.confidence);
  const safeVatRate = clampRate(extraction.vat.rate);
  const safePricingVatRate = clampRate(pricing.vatRate);
  const safeImportSystemRate = clampRate(pricing.importSystemRate);
  const safeRetailHiddenRate = clampRate(pricing.retailHiddenRate);
  
  // gateConfidence is stored as integer (0-100) in database, not decimal (0-1)
  let safeGateConfidence: number | null = null;
  if (flags.gateConfidence != null && isFinite(flags.gateConfidence)) {
    if (flags.gateConfidence <= 1) {
      safeGateConfidence = Math.round(Math.max(0, Math.min(100, flags.gateConfidence * 100)));
    } else {
      safeGateConfidence = Math.round(Math.max(0, Math.min(100, flags.gateConfidence)));
    }
  }

  // Extract metadata fields
  const proofType = receipt.proofType || null;
  const isRewarded = receipt.isRewarded !== undefined 
    ? receipt.isRewarded 
    : (receipt.proofType !== "manual" ? true : null);
  const rewardTier = receipt.rewardTier || (receipt.proofType !== "manual" ? "A" : null);
  const riskScore = receipt.riskScore !== undefined && receipt.riskScore !== null ? receipt.riskScore : null;
  const evidence = receipt.evidence ? JSON.stringify(receipt.evidence) : null;
  const source = receipt.source ? JSON.stringify(receipt.source) : null;
  const receiptHash = receipt.receiptHash || null;
  const imagePhash = receipt.imagePhash || null;
  const contentHash = receipt.contentHash || null;
  const blobUrl = (receipt as any).blobUrl || null;

  return {
    receiptId: receipt.receiptId,
    status: receipt.status,
    username: receipt.username || null,
    merchantName: normalizeMerchantDisplayName(merchant.name) ?? merchant.name,
    // Phase 6: Legal name is a separate column. When it comes from Gemini,
    // Receipt.merchantLegalName is populated; existing records stay null.
    merchantLegalName:
      (receipt as { merchantLegalName?: string | null }).merchantLegalName ?? null,
    merchantId: merchant.merchantId || null,
    merchantPlaceId: merchant.placeId || null,
    merchantCategory: merchant.category || null,
    merchantCountry: merchant.country || null,
    expenseType: receipt.expenseType ?? "personal",
    extractionDateValue: extraction.date.value,
    extractionTimeValue: (extraction as any).time?.value || null,
    extractionDateConfidence: safeDateConfidence,
    extractionTotalValue: extraction.total.value,
    extractionTotalConfidence: safeTotalConfidence,
    extractionVatValue: extraction.vat.value,
    extractionVatConfidence: safeVatConfidence,
    extractionVatRate: safeVatRate,
    pricingTotalPaid: pricing.totalPaid,
    pricingVatAmount: pricing.vatAmount,
    pricingPaidExTax: pricing.paidExTax,
    pricingVatRate: safePricingVatRate,
    pricingImportSystemRate: safeImportSystemRate,
    pricingRetailHiddenRate: safeRetailHiddenRate,
    pricingCurrency: pricing.currency || null,
    pricingSymbol: pricing.symbol || null,
    hiddenCostReferencePrice: hiddenCost.referencePrice,
    hiddenCostCore: hiddenCost.hiddenCostCore,
    hiddenCostBreakdownImportSystem: hiddenCost.breakdown.importSystemCost,
    hiddenCostBreakdownRetailHidden: hiddenCost.breakdown.retailHiddenCost,
    rewardConversionRate: reward.conversionRate,
    rewardRaw: reward.raw,
    rewardFinal: reward.final,
    rewardToken: reward.token,
    flagsNeedsLlm: flags.needsLLM || false,
    flagsRejected: flags.rejected || false,
    flagsGateConfidence: safeGateConfidence,
    flagsDocType: flags.docType || null,
    ocrRawText: ocr.rawText,
    walletAddress: receipt.walletAddress || null,
    receiptData: buildReceiptDataSnapshot(receipt),
    createdAt: receipt.createdAt ? new Date(receipt.createdAt) : new Date(),
    updatedAt: new Date(),
    proofType: proofType,
    isRewarded: isRewarded,
    rewardTier: rewardTier,
    riskScore: riskScore,
    evidence: evidence,
    source: source,
    receiptHash: receiptHash,
    imagePhash: imagePhash,
    contentHash: contentHash,
    blobUrl: blobUrl,
    // Merchant address fields (Gemini / GPT-4o fallback) — dedicated columns added in migration 037/038
    merchantAddress: receipt.merchantAddress ?? null,
    branchInfo: receipt.branchInfo ?? null,
    merchantCity: receipt.addressCity ?? null,
    merchantDistrict: receipt.addressDistrict ?? null,
    merchantNeighborhood: receipt.addressNeighborhood ?? null,
    merchantStreet: receipt.addressStreet ?? null,
    // Oracle: post-process pipeline (Phase1 → Phase2); allow analyze to pin needs_review / validation_rejected
    postProcessState: (receipt as { postProcessState?: string }).postProcessState ?? "pending",
    postProcessRetryCount: 0,
    slotType: "general",
    rewarded: receipt.isRewarded !== undefined ? receipt.isRewarded : true,
    visionJson: receipt.visionRawJson != null ? JSON.stringify(receipt.visionRawJson) : null,
    // Gemini's verbatim Markdown report — UI renders this directly.
    visionMarkdown:
      (receipt as { visionMarkdown?: string | null }).visionMarkdown ?? null,
    // Phase 7: Payment and tax fields — sourced from Gemini, separate DB columns.
    cardLast4: (receipt as { cardLast4?: string | null }).cardLast4 ?? null,
    posProvider: (receipt as { posProvider?: string | null }).posProvider ?? null,
    taxOffice: (receipt as { taxOffice?: string | null }).taxOffice ?? null,
    taxNumber: (receipt as { taxNumber?: string | null }).taxNumber ?? null,
    paymentMethod:
      (receipt as { paymentMethod?: string | null }).paymentMethod ?? null,
    paymentProven:
      (receipt as { paymentProven?: boolean | null }).paymentProven ?? null,
    receiptNo: (receipt as { receiptNo?: string | null }).receiptNo ?? null,
    // Also return nested data for parallel operations
    breakdownItems: hiddenCost.breakdown.items || [],
    flagsReasons: flags.reasons || [],
    ocrLines: ocr.lines || [],
  };
}
