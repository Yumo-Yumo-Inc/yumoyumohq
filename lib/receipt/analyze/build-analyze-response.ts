import type { PipelineContext, ReceiptContext } from "@/app/api/receipt/analyze/types";
import type { ExtractionValidationResult, HiddenCostBreakdownItem } from "@/lib/receipt/types";
import { normalizeReceiptCategory } from "@/lib/receipt/categories";
import { resolveNoRewardReasonForContext, resolveDuplicateNoRewardCode, shouldComputeHiddenCost } from "@/lib/receipt/vision-post-rules";
import { buildUploadRewardBreakdown } from "@/lib/receipt/reward-breakdown";
import type { RewardCapResult } from "@/lib/receipt/reward-caps";

type BuildAnalyzeResponseArgs = {
  context: ReceiptContext;
  receiptStatus: "analyzed" | "pending" | "rejected";
  extractionValidationSnap?: ExtractionValidationResult;
  postProcessStateOut?: string;
  extractionFlagsRejected: boolean;
  paidExTax: number;
  hiddenCostCore: number;
  hiddenRate: number;
  referencePrice: number;
  rewardAmount: number;
  bintAmount: number;
  importSystemRate: number;
  retailHiddenRate: number;
  importSystemCost: number;
  retailHiddenCost: number;
  breakdownItems: HiddenCostBreakdownItem[];
  logBuffer: string[];
};

/** Fraud-analyzer output attached mid-pipeline; narrowed here from unknown. */
interface FraudSignalsShape {
  fraudScore?: number;
  riskLevel?: string;
  isValid?: boolean;
  rejectionReasons?: string[];
  warnings?: string[];
  checks?: Record<string, unknown>;
}

export function buildAnalyzeResponse({
  context,
  receiptStatus,
  extractionValidationSnap,
  postProcessStateOut,
  extractionFlagsRejected,
  paidExTax,
  hiddenCostCore,
  hiddenRate,
  referencePrice,
  rewardAmount,
  bintAmount,
  importSystemRate,
  retailHiddenRate,
  importSystemCost,
  retailHiddenCost,
  breakdownItems,
  logBuffer,
}: BuildAnalyzeResponseArgs) {
  const ctx = context as PipelineContext;
  const fraudSignals = (ctx.fraudSignals ?? null) as FraudSignalsShape | null;
  const earlyDuplicateInfo = ctx.earlyDuplicateInfo ?? undefined;
  let effectiveRewardAmount = rewardAmount;
  if (earlyDuplicateInfo) {
    effectiveRewardAmount = 0;
    ctx.noRewardReasonCode = resolveDuplicateNoRewardCode(
      earlyDuplicateInfo.existingUsername,
      context.username
    );
    ctx.noRewardExplanation = undefined;
  }

  const finalRewardAmount = effectiveRewardAmount;
  const finalBintAmount =
    finalRewardAmount <= 0 ? 0 : Math.round((bintAmount * finalRewardAmount) / Math.max(rewardAmount, 1) * 100) / 100;
  let noRewardReasonCode =
    finalRewardAmount > 0 ? undefined : ctx.noRewardReasonCode ?? undefined;
  let noRewardExplanation =
    finalRewardAmount > 0 ? undefined : ctx.noRewardExplanation ?? undefined;

  if (finalRewardAmount <= 0 && !noRewardReasonCode) {
    const resolved = resolveNoRewardReasonForContext({
      existingCode: noRewardReasonCode ?? null,
      rewardAmount: finalRewardAmount,
      hiddenCostCore: hiddenCostCore,
      judgment: ctx.llmJudgment?.rewardDecision ?? null,
      documentType: ctx.documentType ?? null,
      paymentProven: ctx.paymentProven ?? null,
      receiptDate: context.date ?? null,
      rewardEligibility: ctx.rewardEligibility ?? null,
      posSlipOverride: false,
      isDuplicate: !!earlyDuplicateInfo,
      duplicateUsername: earlyDuplicateInfo?.existingUsername ?? null,
      currentUsername: context.username,
    });
    noRewardReasonCode = resolved.code;
    noRewardExplanation = resolved.explanation;
    ctx.noRewardReasonCode = resolved.code;
    ctx.noRewardExplanation = resolved.explanation;
  }

  const trustedMerchantMatch =
    ctx.merchantMatchTrusted === true ? ctx.merchantMatch ?? undefined : undefined;

  return {
    receiptId: context.receiptId,
    status: receiptStatus,
    // User-declared in scanner step 1; persisted as receipts.expense_type
    // and consumed by the price-comparison / insights filters.
    expenseType: context.expenseType ?? "personal",
    detectedCountry: context.detectedCountry || undefined,
    llmSource: context.llmSource || undefined,
    // Phase 6: merchant.name = display (short storefront name shown in the UI).
    // merchantLegalName = full legal name (separate DB column, admin panel).
    merchantLegalName: ctx.merchantLegalName ?? null,
    // Phase 7: Payment and tax details — sourced from Gemini, written to the DB.
    cardLast4: ctx.cardLast4 ?? null,
    posProvider: ctx.posProvider ?? null,
    taxOffice: ctx.taxOffice ?? null,
    taxNumber: ctx.taxNumber ?? null,
    paymentMethod: ctx.paymentMethod ?? null,
    paymentProven: ctx.paymentProven ?? null,
    receiptNo: ctx.receiptNo ?? null,
    merchant: {
      name: trustedMerchantMatch?.displayName ?? context.merchantName,
      placeId: context.merchantPlaceId,
      category:
        normalizeReceiptCategory(trustedMerchantMatch?.category ?? context.category) ??
        undefined,
      utilityType: context.utilityType ?? undefined,
      country: context.detectedCountry || undefined,
      channel: context.hiddenCostBreakdown?.merchant.channel,
      signals: context.hiddenCostBreakdown?.merchant.signals,
      merchantId: trustedMerchantMatch?.merchantId ?? undefined,
      tier: trustedMerchantMatch?.tier ?? undefined,
      matchLayer: trustedMerchantMatch?.layerUsed ?? undefined,
      matchConfidence: trustedMerchantMatch?.confidence ?? undefined,
    },
    extraction: {
      date: context.date ? { value: context.date, confidence: 0.8 } : undefined,
      time: context.time ? { value: context.time, confidence: 0.8 } : undefined,
      total: { value: context.totalPaid, confidence: 0.8 },
      vat: { value: context.vatAmount, rate: context.vatRate, confidence: 0.8 },
      serviceCharge: context.serviceCharge ? { value: context.serviceCharge, confidence: 0.8 } : undefined,
    },
    pricing: {
      totalPaid: context.totalPaid,
      paidExTax,
      vatAmount: context.vatAmount,
      vatRate: context.vatRate,
      serviceCharge: context.serviceCharge || 0,
      paidPriceExTax: paidExTax,
      stateLayerTax: context.vatAmount,
      importSystemRate,
      retailHiddenRate,
      currency: context.currency,
      symbol: context.currencySymbol,
      category: normalizeReceiptCategory(ctx.pricingSourceCategory ?? context.category) ?? undefined,
      internalCategory: ctx.pricingInternalCategory ?? undefined,
    },
    hiddenCost: {
      referencePrice,
      hiddenCostCore,
      breakdown: {
        importSystemCost: importSystemCost || hiddenCostCore * 0.35,
        retailHiddenCost: retailHiddenCost || hiddenCostCore * 0.65,
        // Embedded excise (ÖTV) surfaced as its own slice so the UI can show it
        // as a distinct layer instead of folding it into the commercial margin.
        exciseTaxCost: context.hiddenCostBreakdown?.layers?.exciseTax?.amount ?? 0,
        items: breakdownItems,
      },
      totalHidden: hiddenCostCore,
      hiddenRate,
      // Computation provenance — drives the mandatory "sector average" notice.
      provenance:
        (ctx.hiddenCostProvenance as string | undefined) ??
        (hiddenCostCore <= 0 &&
        shouldComputeHiddenCost(String(ctx.documentType ?? "receipt"))
          ? "unavailable"
          : undefined),
      completeShare: ctx.hiddenCostCompleteShare ?? undefined,
      layers: context.hiddenCostBreakdown ? {
        platformEcosystem: context.hiddenCostBreakdown.layers.platformEcosystem,
        storeOperations: context.hiddenCostBreakdown.layers.storeOperations,
        supplyChain: context.hiddenCostBreakdown.layers.supplyChain,
        retailBrand: context.hiddenCostBreakdown.layers.retailBrand,
        exciseTax: context.hiddenCostBreakdown.layers.exciseTax,
        stateLayer: context.hiddenCostBreakdown.layers.stateLayer,
      } : undefined,
      shipping: context.hiddenCostBreakdown?.shipping,
    },
    reward: {
      conversionRate: 1,
      // raw = pre-fraction full estimate when a partial (base) reward was
      // granted; proof matching / manual item completion unlock up to this.
      raw:
        typeof ctx.rewardFullEstimate === "number"
          ? ctx.rewardFullEstimate
          : finalRewardAmount,
      final: finalRewardAmount,
      ryumo: finalBintAmount,
      token: "cPoints",
      capsApplied: [],
      verifiedThankYou: !!ctx.verifiedThankYou,
      noRewardReasonCode,
      noRewardExplanation,
      rewardFraction:
        typeof ctx.rewardFraction === "number" ? ctx.rewardFraction : undefined,
      fullRewardEstimate:
        typeof ctx.rewardFullEstimate === "number" ? ctx.rewardFullEstimate : undefined,
      pendingItemizedReceipt: ctx.pendingItemizedReceipt === true ? true : undefined,
      pendingSlipReceiptId:
        ctx.pendingItemizedReceipt === true ? context.receiptId : undefined,
      // Upload-pass decomposition (base slice, scan bonuses, itemized/streak
      // multipliers, cap + honor flags). Post-process appends the CPI/season
      // factors and the final points. null when the receipt earned nothing.
      breakdown:
        buildUploadRewardBreakdown({
          capResult: (ctx.rewardCap as RewardCapResult | undefined) ?? null,
          rewardFinal: finalRewardAmount,
          honorApplied:
            typeof ctx.honorRewardFactor === "number" && ctx.honorRewardFactor < 1,
        }) ?? undefined,
    },
    flags: {
      needsLLM: false,
      reasons: [],
      docType: ctx.documentType ?? "receipt",
      revised: !!ctx.revisedFromMandatoryFallback,
      revisionSource:
        typeof ctx.llmMandatoryResolvedBy === "string"
          ? ctx.llmMandatoryResolvedBy
          : undefined,
      ...(extractionFlagsRejected ? { rejected: true as const } : {}),
    },
    ocr: {
      lines: context.ocrLines,
      rawText: context.fullText,
    },
    verification: {
      hash: context.hash || "",
      isDuplicate: !!ctx.earlyDuplicateInfo || !!ctx.reviewExistingReceiptId,
      duplicateReceiptId:
        ctx.earlyDuplicateInfo?.existingReceiptId || ctx.reviewExistingReceiptId,
      duplicateType:
        ctx.earlyDuplicateInfo?.duplicateType ||
        (ctx.reviewExistingReceiptId ? "content" : undefined),
      duplicateUsername:
        ctx.earlyDuplicateInfo?.existingUsername || ctx.reviewExistingUsername,
      confidenceScore: 0.8,
      merchantVerified: !!context.placesResult,
      passedGating: true,
    },
    receiptHash: context.hash || null,
    imagePhash: context.finalPerceptualHash || context.perceptualHash || null,
    // A content duplicate is still retained for audit, but must not be written
    // as an active hash row: the partial unique index would make its later
    // post-process fail. A payment proof that completes a restaurant tab is
    // likewise a linked evidence row, not a second canonical expense hash.
    contentHash:
      ctx.earlyDuplicateInfo || ctx.proofCompletionExistingReceiptId
        ? null
        : context.contentHash || null,
    fraud: fraudSignals
      ? {
          fraudScore: fraudSignals.fraudScore,
          riskLevel: fraudSignals.riskLevel,
          isValid: fraudSignals.isValid,
          rejectionReasons: fraudSignals.rejectionReasons || [],
          warnings: fraudSignals.warnings || [],
          checks: fraudSignals.checks || {},
        }
      : undefined,
    riskScore: fraudSignals?.fraudScore || null,
    qualityHonor: ctx.qualityHonorResult
      ? {
          level: ctx.qualityHonorResult.level,
          honorDelta: ctx.qualityHonorResult.honorDelta,
          rewardPct: ctx.qualityHonorResult.rewardPct,
          honorBonusApplied: ctx.qualityHonorResult.honorBonusApplied,
          reasons: ctx.qualityHonorResult.reasons,
          securityReasons: ctx.qualityHonorResult.securityReasons,
          qualityScore: ctx.qualityHonorResult.qualityScore,
        }
      : undefined,
    marginViolation: ctx.marginViolationInfo || undefined,
    rejectionInfo: ctx.rejectionInfo || undefined,
    pipelineLog: logBuffer.length > 0 ? logBuffer.join("\n") : undefined,
    blobFilename: ctx.blobFilename || null,
    blobUrl: ctx.blobUrl || null,
    requiresMerchantApproval: ctx.requiresMerchantApproval || false,
    visionRawJson: ctx.visionRawJson ?? undefined,
    visionMarkdown:
      typeof ctx.geminiMarkdown === "string"
        ? ctx.geminiMarkdown
        : typeof context.fullText === "string" && context.fullText.length > 0
          ? context.fullText
          : null,
    documentType: ctx.documentType ?? null,
    isPaymentProof: ctx.isPaymentProof ?? null,
    proofStatus: ctx.proofStatus ?? null,
    completeSlipReceiptId: ctx.completeSlipReceiptId ?? null,
    geminiLineItems: Array.isArray(ctx.geminiLineItems) ? ctx.geminiLineItems : undefined,
    gptFullReceiptResult: ctx.gptFullReceiptResult ?? undefined,
    merchantAddress: ctx.merchantAddress
      ? String(ctx.merchantAddress).trim() || undefined
      : undefined,
    branchInfo: ctx.branchInfo ? String(ctx.branchInfo).trim() || undefined : undefined,
    addressCity: ctx.addressCity ? String(ctx.addressCity).trim() || undefined : undefined,
    addressDistrict: ctx.addressDistrict
      ? String(ctx.addressDistrict).trim() || undefined
      : undefined,
    addressNeighborhood: ctx.addressNeighborhood
      ? String(ctx.addressNeighborhood).trim() || undefined
      : undefined,
    addressStreet: ctx.addressStreet
      ? String(ctx.addressStreet).trim() || undefined
      : undefined,
    extractionValidation: extractionValidationSnap,
    postProcessState: postProcessStateOut,
  };
}
