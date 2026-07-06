import {
  applyVisionPostRules,
  type VisionPostRulesInput,
  type VisionPostRulesResult,
} from "@/lib/receipt/vision-post-rules";
import {
  computeHiddenRate,
  computeRewardFromHiddenSlice,
} from "@/lib/receipt/reward-from-hidden-slice";
import { getItemizedMultiplier } from "@/lib/receipt/vision-post-rules";

export type GrantedRewardResolution = {
  rules: VisionPostRulesResult;
  eligible: boolean;
  rewardFraction: number;
  fullRewardEstimate: number;
  grantedBint: number;
  isPaymentProof: boolean;
  proofStatus: string | null;
  pendingItemizedReceipt: boolean;
  documentType: string;
};

function asRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object") return {};
  return value as Record<string, unknown>;
}

function readString(data: Record<string, unknown>, ...keys: string[]): string | null {
  for (const key of keys) {
    const value = data[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return null;
}

function readBoolean(data: Record<string, unknown>, ...keys: string[]): boolean | null {
  for (const key of keys) {
    const value = data[key];
    if (typeof value === "boolean") return value;
  }
  return null;
}

function readLineItems(data: Record<string, unknown>): Array<{ name?: string | null }> {
  const raw = data.geminiLineItems;
  if (!Array.isArray(raw)) return [];
  return raw.map((item) => {
    const row = asRecord(item);
    const name = readString(row, "name", "productName", "raw_name");
    return { name };
  });
}

export function buildVisionPostRulesInputFromStoredReceipt(input: {
  receiptData: unknown;
  merchantName?: string | null;
  extractionDate?: string | null;
  paymentProven?: boolean | null;
  referenceDate?: Date;
}): VisionPostRulesInput {
  const data = asRecord(input.receiptData);
  const merchant = asRecord(data.merchant);
  const lineItems = readLineItems(data);

  return {
    documentType: readString(data, "documentType", "document_type") ?? "unknown",
    paymentProven:
      input.paymentProven ??
      readBoolean(data, "paymentProven", "payment_proven"),
    receiptDate:
      input.extractionDate ??
      readString(data, "receiptDate", "receipt_date") ??
      null,
    lineItems,
    itemsCount: lineItems.length > 0 ? lineItems.length : null,
    taxNumber: readString(data, "taxNumber", "tax_number"),
    taxOffice: readString(data, "taxOffice", "tax_office"),
    merchantLegalName:
      readString(data, "merchantLegalName", "merchant_legal_name") ??
      readString(merchant, "legalName"),
    merchantDisplayName:
      readString(data, "merchantDisplayName", "merchant_display_name") ??
      input.merchantName ??
      readString(merchant, "name"),
    posProvider: readString(data, "posProvider", "pos_provider"),
    cardLast4: readString(data, "cardLast4", "card_last4"),
    paymentMethod: readString(data, "paymentMethod", "payment_method"),
    rawText:
      readString(data, "visionMarkdown", "vision_markdown") ??
      readString(asRecord(data.ocr), "rawText") ??
      "",
    rejectionReason: null,
    referenceDate: input.referenceDate ?? new Date(),
  };
}

export function resolveGrantedReward(input: {
  receiptData: unknown;
  merchantName?: string | null;
  extractionDate?: string | null;
  paymentProven?: boolean | null;
  paidExTax: number;
  hiddenCostCore: number;
  usdRate: number;
  storedRewardFinal?: number | null;
  referenceDate?: Date;
}): GrantedRewardResolution {
  const rulesInput = buildVisionPostRulesInputFromStoredReceipt(input);
  const rules = applyVisionPostRules(rulesInput);
  const eligible = rules.judgment === "reward_eligible";
  const paidExTax = Math.max(0, input.paidExTax);
  const hiddenCostCore = Math.max(0, input.hiddenCostCore);
  const usdRate = Math.max(0.0001, input.usdRate);
  const rate = computeHiddenRate(paidExTax, hiddenCostCore);
  // Base = hidden-cost slice; the itemized multiplier is the ceiling every
  // payment-proven document can reach (karar 2026-07-04, revizyon 2026-07-06).
  // rules.rewardFraction maps the granted share onto that ceiling: 1 for
  // documents that prove their items, 1/multiplier for itemless proofs.
  const baseReward =
    paidExTax > 0 && hiddenCostCore > 0
      ? computeRewardFromHiddenSlice(paidExTax, rate, usdRate)
      : 0;
  const fullRewardEstimate =
    baseReward > 0
      ? Math.round(baseReward * getItemizedMultiplier() * 100) / 100
      : 0;
  const rewardFraction =
    eligible && rules.rewardFraction > 0 ? rules.rewardFraction : 0;
  const computedGranted =
    eligible && fullRewardEstimate > 0
      ? Math.round(fullRewardEstimate * rewardFraction * 100) / 100
      : 0;
  const stored = Number(input.storedRewardFinal ?? 0) || 0;
  const grantedBint = stored > 0 ? stored : computedGranted;

  return {
    rules,
    eligible,
    rewardFraction,
    fullRewardEstimate,
    grantedBint,
    isPaymentProof: rules.pendingItemizedReceipt === true,
    proofStatus: rules.pendingItemizedReceipt ? "pending" : null,
    pendingItemizedReceipt: rules.pendingItemizedReceipt === true,
    documentType: rules.documentType,
  };
}

export function mergeGrantedRewardIntoReceiptData(
  receiptData: unknown,
  granted: GrantedRewardResolution,
  bintBonus?: number
): Record<string, unknown> {
  const data = asRecord(receiptData);
  const reward = asRecord(data.reward);
  const nextReward = {
    ...reward,
    raw: granted.grantedBint,
    final: granted.grantedBint,
    ryumo: bintBonus ?? reward.ryumo ?? 0,
    token: reward.token ?? "cPoints",
    rewardFraction: granted.rewardFraction,
    fullRewardEstimate:
      granted.fullRewardEstimate > 0 ? granted.fullRewardEstimate : reward.fullRewardEstimate,
    pendingItemizedReceipt: granted.pendingItemizedReceipt || undefined,
    noRewardReasonCode: granted.grantedBint > 0 ? null : reward.noRewardReasonCode ?? "generic",
    noRewardExplanation: granted.grantedBint > 0 ? null : reward.noRewardExplanation ?? null,
  };

  return {
    ...data,
    documentType: granted.documentType,
    isPaymentProof: granted.isPaymentProof ? true : data.isPaymentProof ?? null,
    proofStatus: granted.proofStatus,
    reward: nextReward,
  };
}
