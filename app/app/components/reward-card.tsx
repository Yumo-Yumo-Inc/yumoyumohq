"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Coins } from "lucide-react";
import type { Reward } from "@/lib/receipt/types";
import { useAppLocale } from "@/lib/i18n/app-context";
import { resolveNoRewardMessage } from "@/lib/receipt/reward-display";

interface RewardCardProps {
  reward: Reward;
  /** Per-receipt contribution points (cPoints). null = still being computed in the background. */
  cPoints?: number | null;
  receiptDate?: string | null;
  qualityHonor?: {
    level: string;
    honorDelta: number;
    rewardPct: number;
    honorBonusApplied: boolean;
    reasons: string[];
  };
  onRequestItemizedUpload?: () => void;
}

export function RewardCard({ reward, cPoints, receiptDate, qualityHonor, onRequestItemizedUpload }: RewardCardProps) {
  const { t } = useAppLocale();
  const noRewardMessage = resolveNoRewardMessage(reward, t, { receiptDate });
  const pendingItemized = reward?.pendingItemizedReceipt === true;
  const fullEstimate = reward?.fullRewardEstimate ?? null;
  // cPoints are written by background post-process after analyze responds, so on
  // first render the real value isn't ready yet → show a calculating state.
  const isCalculating = cPoints == null && !noRewardMessage;

  return (
    <Card className="border-primary">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Coins className="h-5 w-5 text-primary" />
          <CardTitle>{t("rewardCard.title")}</CardTitle>
        </div>
        <CardDescription>{t("rewardCard.subtitle")}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="text-center">
            <p className="text-xs font-medium mb-1 text-muted-foreground uppercase tracking-wide">
              {t("rewardCard.totalPoints")}
            </p>
            <div className="text-4xl font-bold text-primary mb-1">
              {isCalculating ? "…" : `+${Math.round(cPoints ?? 0)}`}
            </div>
            <p className="text-sm text-muted-foreground">
              {isCalculating ? t("rewardCard.calculating") : "cPoints"}
            </p>
            {qualityHonor?.honorBonusApplied && (
              <p className="text-sm text-primary mt-2 font-medium">{t("rewardCard.honorBonus")}</p>
            )}
            {reward?.verifiedThankYou && (
              <p className="text-sm text-green-600 dark:text-green-400 mt-2 font-medium">
                {t("rewardCard.firstMerchantBonus")}
              </p>
            )}
            {pendingItemized && (
              <div className="mt-3 space-y-2 rounded-md border border-sky-500/30 bg-sky-500/10 px-3 py-2 text-left">
                {fullEstimate != null && fullEstimate > 0 && (
                  <p className="text-sm font-medium text-sky-900 dark:text-sky-100">
                    {t("rewardCard.partial.ceiling", {
                      current: String(Math.round(reward?.final ?? 0)),
                      full: String(Math.round(fullEstimate)),
                    })}
                  </p>
                )}
                <p className="text-sm text-sky-800 dark:text-sky-200">{t("rewardCard.partial.followUp")}</p>
                {onRequestItemizedUpload && (
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    className="mt-1"
                    onClick={onRequestItemizedUpload}
                  >
                    {t("rewardCard.partial.uploadCta")}
                  </Button>
                )}
              </div>
            )}
            {noRewardMessage && (
              <p className="text-sm text-amber-700 dark:text-amber-300 mt-3 rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2">
                {noRewardMessage}
              </p>
            )}
          </div>

          {qualityHonor != null && (
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("rewardCard.quality")}</span>
                <span>{qualityHonor.level}</span>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
