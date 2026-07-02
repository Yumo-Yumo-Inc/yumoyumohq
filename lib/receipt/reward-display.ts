import {
  applyCurrentMonthRewardGate,
  resolveNoRewardReasonForContext,
  resolveDuplicateNoRewardCode,
  type NoRewardReasonCode,
} from "@/lib/receipt/vision-post-rules";

export type RewardDisplayFields = {
  amount?: number;
  final?: number;
  ryumo?: number;
  noRewardReasonCode?: string;
  noRewardExplanation?: string;
  rewardFraction?: number;
  fullRewardEstimate?: number;
  pendingItemizedReceipt?: boolean;
};

export type ResolveNoRewardOptions = {
  receiptDate?: string | null;
  referenceDate?: Date;
  documentType?: string | null;
  paymentProven?: boolean | null;
  rewardEligibility?: string | null;
  judgment?: string | null;
  hiddenCostCore?: number;
  posSlipOverride?: boolean;
  isDuplicate?: boolean;
  duplicateUsername?: string | null;
  currentUsername?: string | null;
};

export function getBintAmount(reward?: RewardDisplayFields | null): number {
  return Number(reward?.final ?? reward?.amount ?? 0) || 0;
}

export function getTotalRewardAmount(reward?: RewardDisplayFields | null): number {
  const bint = getBintAmount(reward);
  const bintBonus = reward?.ryumo != null ? Number(reward.ryumo) : 0;
  return bint + bintBonus;
}

function resolveNoRewardCode(
  reward: RewardDisplayFields | null | undefined,
  options?: ResolveNoRewardOptions
): NoRewardReasonCode | undefined {
  if (options?.isDuplicate) {
    return resolveDuplicateNoRewardCode(
      options.duplicateUsername,
      options.currentUsername
    );
  }

  const gated = applyCurrentMonthRewardGate({
    rewardAmount: getTotalRewardAmount(reward),
    receiptDate: options?.receiptDate,
    existingCode: reward?.noRewardReasonCode ?? null,
    existingExplanation: reward?.noRewardExplanation ?? null,
    referenceDate: options?.referenceDate,
  });
  if (gated.noRewardReasonCode) return gated.noRewardReasonCode;

  const resolved = resolveNoRewardReasonForContext({
    existingCode: reward?.noRewardReasonCode ?? null,
    rewardAmount: getTotalRewardAmount(reward),
    hiddenCostCore: options?.hiddenCostCore,
    judgment: options?.judgment ?? null,
    documentType: options?.documentType ?? null,
    paymentProven: options?.paymentProven ?? null,
    receiptDate: options?.receiptDate ?? null,
    referenceDate: options?.referenceDate,
    rewardEligibility: options?.rewardEligibility ?? null,
    posSlipOverride: options?.posSlipOverride,
    isDuplicate: options?.isDuplicate,
    duplicateUsername: options?.duplicateUsername ?? null,
    currentUsername: options?.currentUsername ?? null,
  });
  if (resolved.code !== "generic") return resolved.code;

  const raw = reward?.noRewardReasonCode;
  return raw ? (raw as NoRewardReasonCode) : resolved.code;
}

export function resolveNoRewardMessage(
  reward: RewardDisplayFields | null | undefined,
  t: (key: string, params?: Record<string, string | number>) => string,
  options?: ResolveNoRewardOptions
): string | null {
  if (getTotalRewardAmount(reward) > 0) return null;

  const code = resolveNoRewardCode(reward, options);
  if (code) {
    const key = `rewardCard.noReward.${code}`;
    const translated = t(key);
    if (translated !== key) return translated;
  }

  return reward?.noRewardExplanation || t("rewardCard.noReward.generic");
}

export function shouldShowPartialRewardNotice(reward?: RewardDisplayFields | null): boolean {
  if (!reward?.pendingItemizedReceipt) return false;
  const fraction = reward.rewardFraction ?? 1;
  return fraction > 0 && fraction < 1 && getTotalRewardAmount(reward) > 0;
}
