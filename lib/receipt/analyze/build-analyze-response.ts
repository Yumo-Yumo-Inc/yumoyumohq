import type { ReceiptContext } from "@/app/api/receipt/analyze/types";
import type { ExtractionValidationResult, HiddenCostBreakdownItem } from "@/lib/receipt/types";
import { normalizeReceiptCategory } from "@/lib/receipt/categories";
import { resolveNoRewardReasonForContext, resolveDuplicateNoRewardCode } from "@/lib/receipt/vision-post-rules";

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
  const ctxAny = context as any;
  const earlyDuplicateInfo = ctxAny.earlyDuplicateInfo as
    | { existingUsername?: string | null }
    | undefined;
  let effectiveRewardAmount = rewardAmount;
  if (earlyDuplicateInfo) {
    effectiveRewardAmount = 0;
    ctxAny.noRewardReasonCode = resolveDuplicateNoRewardCode(
      earlyDuplicateInfo.existingUsername,
      context.username
    );
    ctxAny.noRewardExplanation = undefined;
  }

  const finalRewardAmount = effectiveRewardAmount;
  const finalBintAmount =
    finalRewardAmount <= 0 ? 0 : Math.round((bintAmount * finalRewardAmount) / Math.max(rewardAmount, 1) * 100) / 100;
  let noRewardReasonCode =
    finalRewardAmount > 0 ? undefined : (ctxAny.noRewardReasonCode as string | undefined);
  let noRewardExplanation =
    finalRewardAmount > 0 ? undefined : (ctxAny.noRewardExplanation as string | undefined);

  if (finalRewardAmount <= 0 && !noRewardReasonCode) {
    const resolved = resolveNoRewardReasonForContext({
      existingCode: noRewardReasonCode ?? null,
      rewardAmount: finalRewardAmount,
      hiddenCostCore: hiddenCostCore,
      judgment:
        (ctxAny.llmJudgment as { rewardDecision?: string } | undefined)?.rewardDecision ??
        null,
      documentType: (ctxAny.documentType as string | null) ?? null,
      paymentProven: (ctxAny.paymentProven as boolean | null) ?? null,
      receiptDate: context.date ?? null,
      rewardEligibility: (ctxAny.rewardEligibility as string | null) ?? null,
      posSlipOverride: false,
      isDuplicate: !!earlyDuplicateInfo,
      duplicateUsername: earlyDuplicateInfo?.existingUsername ?? null,
      currentUsername: context.username,
    });
    noRewardReasonCode = resolved.code;
    noRewardExplanation = resolved.explanation;
    ctxAny.noRewardReasonCode = resolved.code;
    ctxAny.noRewardExplanation = resolved.explanation;
  }

  const trustedMerchantMatch =
    (context as any).merchantMatchTrusted === true ? (context as any).merchantMatch : undefined;

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
    merchantLegalName:
      (context as { merchantLegalName?: string | null }).merchantLegalName ?? null,
    // Phase 7: Payment and tax details — sourced from Gemini, written to the DB.
    cardLast4: (context as { cardLast4?: string | null }).cardLast4 ?? null,
    posProvider:
      (context as { posProvider?: string | null }).posProvider ?? null,
    taxOffice: (context as { taxOffice?: string | null }).taxOffice ?? null,
    taxNumber: (context as { taxNumber?: string | null }).taxNumber ?? null,
    paymentMethod:
      (context as { paymentMethod?: string | null }).paymentMethod ?? null,
    paymentProven:
      (context as { paymentProven?: boolean | null }).paymentProven ?? null,
    receiptNo: (context as { receiptNo?: string | null }).receiptNo ?? null,
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
      category: normalizeReceiptCategory((context as any).pricingSourceCategory ?? context.category) ?? undefined,
      internalCategory: (context as any).pricingInternalCategory ?? undefined,
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
      provenance: (context as any).hiddenCostProvenance ?? undefined,
      completeShare: (context as any).hiddenCostCompleteShare ?? undefined,
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
      raw: finalRewardAmount,
      final: finalRewardAmount,
      ryumo: finalBintAmount,
      token: "cPoints",
      capsApplied: [],
      verifiedThankYou: !!(context as any).verifiedThankYou,
      noRewardReasonCode,
      noRewardExplanation,
      rewardFraction:
        typeof (context as any).rewardFraction === "number"
          ? (context as any).rewardFraction
          : undefined,
      fullRewardEstimate:
        typeof (context as any).rewardFullEstimate === "number"
          ? (context as any).rewardFullEstimate
          : undefined,
      pendingItemizedReceipt:
        (context as any).pendingItemizedReceipt === true ? true : undefined,
      pendingSlipReceiptId:
        (context as any).pendingItemizedReceipt === true
          ? context.receiptId
          : undefined,
    },
    flags: {
      needsLLM: false,
      reasons: [],
      docType: (context as any).documentType ?? "receipt",
      revised: !!(context as any).revisedFromMandatoryFallback,
      revisionSource:
        typeof (context as any).llmMandatoryResolvedBy === "string"
          ? (context as any).llmMandatoryResolvedBy
          : undefined,
      ...(extractionFlagsRejected ? { rejected: true as const } : {}),
    },
    ocr: {
      lines: context.ocrLines,
      rawText: context.fullText,
    },
    verification: {
      hash: context.hash || "",
      isDuplicate: !!(context as any).earlyDuplicateInfo || !!(context as any).reviewExistingReceiptId,
      duplicateReceiptId: (context as any).earlyDuplicateInfo?.existingReceiptId || (context as any).reviewExistingReceiptId,
      duplicateType: (context as any).earlyDuplicateInfo?.duplicateType || ((context as any).reviewExistingReceiptId ? "content" : undefined),
      duplicateUsername: (context as any).earlyDuplicateInfo?.existingUsername || (context as any).reviewExistingUsername,
      confidenceScore: 0.8,
      merchantVerified: !!context.placesResult,
      passedGating: true,
    },
    receiptHash: context.hash || null,
    imagePhash: context.finalPerceptualHash || context.perceptualHash || null,
    contentHash: context.contentHash || null,
    fraud: (context as any).fraudSignals ? {
      fraudScore: (context as any).fraudSignals.fraudScore,
      riskLevel: (context as any).fraudSignals.riskLevel,
      isValid: (context as any).fraudSignals.isValid,
      rejectionReasons: (context as any).fraudSignals.rejectionReasons || [],
      warnings: (context as any).fraudSignals.warnings || [],
      checks: (context as any).fraudSignals.checks || {},
    } : undefined,
    riskScore: (context as any).fraudSignals?.fraudScore || null,
    qualityHonor: (context as any).qualityHonorResult
      ? {
          level: (context as any).qualityHonorResult.level,
          honorDelta: (context as any).qualityHonorResult.honorDelta,
          rewardPct: (context as any).qualityHonorResult.rewardPct,
          honorBonusApplied: (context as any).qualityHonorResult.honorBonusApplied,
          reasons: (context as any).qualityHonorResult.reasons,
          securityReasons: (context as any).qualityHonorResult.securityReasons,
          qualityScore: (context as any).qualityHonorResult.qualityScore,
        }
      : undefined,
    marginViolation: (context as any).marginViolationInfo || undefined,
    rejectionInfo: (context as any).rejectionInfo || undefined,
    pipelineLog: logBuffer.length > 0 ? logBuffer.join("\n") : undefined,
    blobFilename: (context as any).blobFilename || null,
    blobUrl: (context as any).blobUrl || null,
    requiresMerchantApproval: (context as any).requiresMerchantApproval || false,
    visionRawJson: (context as any).visionRawJson ?? undefined,
    visionMarkdown:
      typeof (context as any).geminiMarkdown === "string"
        ? (context as any).geminiMarkdown
        : typeof context.fullText === "string" && context.fullText.length > 0
          ? context.fullText
          : null,
    documentType: (context as any).documentType ?? null,
    isPaymentProof: (context as any).isPaymentProof ?? null,
    proofStatus: (context as any).proofStatus ?? null,
    completeSlipReceiptId: (context as any).completeSlipReceiptId ?? null,
    geminiLineItems: Array.isArray((context as any).geminiLineItems)
      ? (context as any).geminiLineItems
      : undefined,
    gptFullReceiptResult: (context as any).gptFullReceiptResult ?? undefined,
    merchantAddress: (context as any).merchantAddress
      ? String((context as any).merchantAddress).trim() || undefined
      : undefined,
    branchInfo: (context as any).branchInfo
      ? String((context as any).branchInfo).trim() || undefined
      : undefined,
    addressCity: (context as any).addressCity
      ? String((context as any).addressCity).trim() || undefined
      : undefined,
    addressDistrict: (context as any).addressDistrict
      ? String((context as any).addressDistrict).trim() || undefined
      : undefined,
    addressNeighborhood: (context as any).addressNeighborhood
      ? String((context as any).addressNeighborhood).trim() || undefined
      : undefined,
    addressStreet: (context as any).addressStreet
      ? String((context as any).addressStreet).trim() || undefined
      : undefined,
    extractionValidation: extractionValidationSnap,
    postProcessState: postProcessStateOut,
  };
}
