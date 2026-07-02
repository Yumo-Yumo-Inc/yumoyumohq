/**
 * Convert ReceiptAnalysis (from API) to Receipt (for UI)
 * This allows the mine page to use real OCR data
 */

import type { ReceiptAnalysis } from "./types";
import type { Receipt, HiddenCost, Reward, OCRLine, TotalCandidate } from "@/lib/mock/types";
import type { FraudDetectionResult } from "@/lib/fraud/fraud-detection";
import { displayHiddenCost } from "@/lib/receipt/display-hidden-cost";

function resolveReceiptBintAmount(analysis: ReceiptAnalysis): number {
  if (analysis.reward?.final != null) {
    return Number(analysis.reward.final) || 0;
  }
  if (analysis.rewards?.ayumo_amount != null) {
    return Number(analysis.rewards.ayumo_amount) || 0;
  }
  return 0;
}

function resolveReceiptBintBonus(analysis: ReceiptAnalysis): number | undefined {
  const bint = analysis.rewards?.ryumo_bonus_amount ?? analysis.reward?.ryumo;
  if (bint == null) return undefined;
  return Number(bint) || 0;
}

export function convertReceiptAnalysisToReceipt(analysis: ReceiptAnalysis, imageUrl?: string): Receipt {
  const blobUrl = (analysis as any).blobUrl as string | undefined;
  const resolvedImageUrl = imageUrl ?? blobUrl;
  const normalizedStatus = String(analysis.status || "").toLowerCase();
  // Convert OCR lines
  const ocrLines: OCRLine[] = (analysis.ocr?.lines || []).map((line) => ({
    lineNo: line.lineNo,
    text: line.text,
  }));

  // Convert total candidate
  const pickedTotalCandidate: TotalCandidate = {
    value: analysis.extraction?.total?.value || 0,
    score: analysis.extraction?.total?.confidence || 0,
    fromLine: analysis.extraction?.total?.sourceLine || 0,
    reasons: analysis.flags?.reasons || [],
  };

  // Check if this is a flight receipt (has hiddenTotal field)
  const isFlight = !!(analysis.hiddenCost as any)?.hiddenTotal;
  
  // Convert hidden cost - handle missing breakdown items
  // For flights: filter out "Base Transport Value" and "Supply Chain & Journey" items
  const allBreakdownItems = (analysis.hiddenCost?.breakdown?.items || []);
  const breakdownItems = allBreakdownItems
    .filter(item => {
      // For flights: exclude Base Transport Value and Supply Chain & Journey items
      if (isFlight) {
        const label = item.label.toLowerCase();
        return !label.includes("base transport") && 
               !label.includes("fuel & energy") &&
               item.bucket !== "supply"; // Exclude supply bucket (Supply Chain & Journey)
      }
      return true; // For non-flights, include all items
    })
    .map(item => ({
      label: item.label,
      amount: item.amount,
      description: item.description,
      bucket: item.bucket, // Use bucket from API (set by buildHiddenCostBreakdownItems)
      estimated: item.estimated !== false, // Default to true unless explicitly false
    }));

  // For flights: calculate retailBrand from breakdownCore components (retail bucket items)
  let retailBrand = analysis.hiddenCost?.breakdown?.retailHiddenCost || 0;
  if (isFlight && breakdownItems.length > 0) {
    // Sum retail bucket items (Retail & Brand, Distribution, Operator Margin, Risk & Compliance)
    retailBrand = breakdownItems
      .filter(item => item.bucket === "retail")
      .reduce((sum, item) => sum + item.amount, 0);
  }
  
  // Normalize negative productValue: if negative, set to 0 and store absolute value as systemSubsidy
  const originalProductValue = analysis.hiddenCost?.referencePrice || 0;
  const productValue = originalProductValue < 0 ? 0 : originalProductValue;
  const systemSubsidy = originalProductValue < 0 ? Math.abs(originalProductValue) : undefined;
  
  const totalPaid = analysis.pricing?.totalPaid || 0;
  const rawTotalHidden = isFlight
    ? ((analysis.hiddenCost as { hiddenTotal?: number })?.hiddenTotal ||
        analysis.hiddenCost?.hiddenCostCore ||
        0)
    : (analysis.hiddenCost?.hiddenCostCore || 0);
  const totalHidden = displayHiddenCost({
    totalPaid,
    hiddenCost: { totalHidden: rawTotalHidden },
  });

  // Embedded excise (ÖTV) on tobacco / alcohol / fuel — surfaced as its own layer.
  const exciseTax = isFlight ? 0 : (analysis.hiddenCost?.breakdown?.exciseTaxCost || 0);

  const hiddenCost: HiddenCost = {
    importSystem: isFlight ? 0 : (analysis.hiddenCost?.breakdown?.importSystemCost || 0), // Flights don't have import system cost
    retailBrand,
    state: isFlight
      ? (analysis.pricing?.stateLayerTax || 0) // Use stateLayerTax for flights (from flightHiddenCost.stateLayer)
      : (analysis.pricing?.vatAmount || 0),
    ...(exciseTax > 0 ? { exciseTax } : {}),
    productValue, // Normalized: 0 if originally negative
    ...(systemSubsidy !== undefined && systemSubsidy > 0 ? { systemSubsidy } : {}), // Only include if > 0
    totalHidden,
    breakdownItems,
    ...(analysis.hiddenCost?.provenance ? { provenance: analysis.hiddenCost.provenance } : {}),
    ...(analysis.hiddenCost?.completeShare !== undefined ? { completeShare: analysis.hiddenCost.completeShare } : {}),
  };

  // Convert reward values to cPoints display model.
  const reward: Reward = {
    amount: resolveReceiptBintAmount(analysis),
    symbol: "cPoints",
    claimable: normalizedStatus === "verified" || normalizedStatus === "saved",
    ryumo: resolveReceiptBintBonus(analysis),
    noRewardReasonCode: analysis.reward?.noRewardReasonCode,
    noRewardExplanation: analysis.reward?.noRewardExplanation,
    rewardFraction: analysis.reward?.rewardFraction,
    fullRewardEstimate: analysis.reward?.fullRewardEstimate,
    pendingItemizedReceipt: analysis.reward?.pendingItemizedReceipt,
  };

  // Convert status
  const status: Receipt["status"] =
    normalizedStatus === "verified" || normalizedStatus === "saved"
      ? "VERIFIED"
      : normalizedStatus === "rewarded_other"
        ? "rewarded_other"
        : normalizedStatus === "rejected"
          ? "REJECTED"
          : normalizedStatus === "analyzed"
            ? "analyzed"
            : normalizedStatus === "scanned"
              ? "scanned"
              : "PENDING";

  return {
    id: analysis.receiptId,
    merchantName: analysis.merchant?.name || "Unknown Merchant",
    merchantPlaceId: analysis.merchant?.placeId,
    country: analysis.merchant?.country || "TH",
    currency: analysis.pricing?.currency || "THB",
    date: analysis.extraction?.date?.value || new Date().toISOString().split("T")[0],
    total: totalPaid,
    totalPaid, // Alias for compatibility
    vat: analysis.pricing?.vatAmount || 0,
    paidExTax: analysis.pricing?.paidExTax || 0,
    status,
    expenseType: analysis.expenseType === "other" ? "other" : "personal",
    confidence: Math.round((analysis.extraction?.total?.confidence || 0) * 100),
    hiddenCost,
    reward,
    reasons: analysis.flags?.reasons || [],
    ocrLines,
    pickedTotalCandidate,
    duplicateCheck: {
      isDuplicate: analysis.verification?.isDuplicate || false,
      matchedReceiptId: analysis.verification?.duplicateReceiptId,
      duplicateType: analysis.verification?.duplicateType,
      duplicateUsername: analysis.verification?.duplicateUsername,
    },
    imageUrl: resolvedImageUrl,
    createdAt: analysis.createdAt || new Date().toISOString(),
    category: analysis.merchant?.category,
    lineItems: analysis.lineItems, // Client-safe printed line items (no hidden-cost split)
    utilityType: analysis.merchant?.utilityType,
    time: analysis.extraction?.time?.value,
    ocrRawText: analysis.ocr?.rawText, // Add OCR raw text for admin viewing
    username: analysis.username, // Add username for admin viewing
    displayName: (analysis as any).displayName, // Display name (user_profiles.display_name)
    merchantChannel: analysis.merchant?.channel || "other", // Add merchant channel (fallback to "other")
    // Fraud detection information (for admin display)
    fraudInfo: analysis.fraud ? {
      fraudScore: analysis.fraud.fraudScore,
      riskLevel: analysis.fraud.riskLevel,
      isValid: analysis.fraud.isValid,
      rejectionReasons: analysis.fraud.rejectionReasons || [],
      warnings: analysis.fraud.warnings || [],
      checks: analysis.fraud.checks ? {
        hasExif: analysis.fraud.checks.hasExif,
        hasDate: analysis.fraud.checks.hasDate,
        hasTime: analysis.fraud.checks.hasTime,
        merchantVerified: analysis.fraud.checks.merchantVerified,
        hasInfrastructure: analysis.fraud.checks.hasInfrastructure,
        hasHandwritingSignals: analysis.fraud.checks.hasHandwritingSignals,
        isScreenshot: analysis.fraud.checks.isScreenshot,
        ocrConfidence: analysis.fraud.checks.ocrConfidence,
      } : undefined,
    } : undefined,
    riskScore: analysis.riskScore ?? null,
    // Margin violation info (for friendly reminder to all users)
    marginViolation: (analysis as any).marginViolation || undefined,
    // Rejection info (for admin display - shows all rejection reasons that were bypassed)
    rejectionInfo: (analysis as any).rejectionInfo || undefined,
    // Pipeline log for admin evidence (terminal-style logs)
    pipelineLog: (analysis as any).pipelineLog,
    blobFilename: (analysis as any).blobFilename,
    qualityHonor: analysis.qualityHonor
      ? {
          level: analysis.qualityHonor.level,
          honorDelta: analysis.qualityHonor.honorDelta,
          rewardPct: analysis.qualityHonor.rewardPct,
          honorBonusApplied: analysis.qualityHonor.honorBonusApplied,
          reasons: analysis.qualityHonor.reasons,
          qualityScore: analysis.qualityHonor.qualityScore,
          securityReasons: analysis.qualityHonor.securityReasons,
        }
      : undefined,
  };
}
