"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Coins, ChevronDown, ShieldCheck, Gauge } from "lucide-react";
import type { Reward } from "@/lib/receipt/types";
import type { RewardBreakdown } from "@/lib/receipt/reward-breakdown";
import { useAppLocale } from "@/lib/i18n/app-context";
import { resolveNoRewardMessage } from "@/lib/receipt/reward-display";
import { ReferralInviteCta } from "@/components/app/referral-invite-cta";

interface RewardCardProps {
  reward: Reward;
  /**
   * Points (bINT) earned for this receipt — the user-visible number. Comes from
   * the status poll (bint_bonus_amount); falls back to reward.final for instant
   * display. Labelled "puan" in the UI. null before either is known.
   */
  bint?: number | null;
  /**
   * XP earned for this receipt. null = still being computed in the background;
   * 0 = the daily XP receipt limit was already reached (no XP for this one).
   */
  xp?: number | null;
  /**
   * Structured decomposition of how the points were computed. Comes from the
   * status poll (reward_breakdown); null until post-process has written it.
   */
  breakdown?: RewardBreakdown | null;
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

/** Trim a multiplier to a compact label: 1.5 → "×1.5", 1.32 → "×1.32", 2 → "×2". */
function formatMultiplier(factor: number): string {
  const n = Math.round((Number(factor) || 1) * 100) / 100;
  const text = Number.isInteger(n) ? String(n) : String(n).replace(/0+$/, "").replace(/\.$/, "");
  return `×${text}`;
}

function formatAmount(value: number): string {
  const n = Number(value) || 0;
  // Sub-unit hidden-cost slices would round to 0; keep one decimal so the base
  // line is never a misleading "+0".
  if (n > 0 && n < 1) return `+${(Math.round(n * 10) / 10).toFixed(1)}`;
  return `+${Math.round(n)}`;
}

type BreakdownRow =
  | { kind: "value"; key: string; label: string; value: string }
  | { kind: "flag"; key: string; label: string; icon: "honor" | "cap" };

function buildBreakdownRows(
  b: RewardBreakdown,
  t: (key: string) => string
): BreakdownRow[] {
  const rows: BreakdownRow[] = [];
  if (b.baseSlice > 0)
    rows.push({ kind: "value", key: "base", label: t("rewardCard.breakdown.base"), value: formatAmount(b.baseSlice) });
  if (b.scanBonus > 0)
    rows.push({ kind: "value", key: "scan", label: t("rewardCard.breakdown.scanBonus"), value: formatAmount(b.scanBonus) });
  if (b.firstScanOfDayBonus > 0)
    rows.push({ kind: "value", key: "firstScan", label: t("rewardCard.breakdown.firstScanOfDay"), value: formatAmount(b.firstScanOfDayBonus) });
  if (b.itemizedMultiplier > 1)
    rows.push({ kind: "value", key: "itemized", label: t("rewardCard.breakdown.itemized"), value: formatMultiplier(b.itemizedMultiplier) });
  if (b.streakMultiplier > 1)
    rows.push({ kind: "value", key: "streak", label: t("rewardCard.breakdown.streak"), value: formatMultiplier(b.streakMultiplier) });
  if ((b.cpiMultiplier ?? 1) > 1)
    rows.push({ kind: "value", key: "cpi", label: t("rewardCard.breakdown.cpi"), value: formatMultiplier(b.cpiMultiplier ?? 1) });
  if ((b.seasonLevelMultiplier ?? 1) > 1)
    rows.push({ kind: "value", key: "season", label: t("rewardCard.breakdown.seasonLevel"), value: formatMultiplier(b.seasonLevelMultiplier ?? 1) });
  // Sensitive calibration — surfaced as flags only, never as numbers (CLAUDE.md §9).
  if (b.honorApplied)
    rows.push({ kind: "flag", key: "honor", label: t("rewardCard.breakdown.honor"), icon: "honor" });
  if (b.capApplied !== "none" || b.postProcessCapApplied)
    rows.push({ kind: "flag", key: "cap", label: t("rewardCard.breakdown.cap"), icon: "cap" });
  return rows;
}

export function RewardCard({ reward, bint, xp, breakdown, receiptDate, qualityHonor, onRequestItemizedUpload }: RewardCardProps) {
  const { t } = useAppLocale();
  const [showBreakdown, setShowBreakdown] = useState(false);
  const noRewardMessage = resolveNoRewardMessage(reward, t, { receiptDate });
  const pendingItemized = reward?.pendingItemizedReceipt === true;
  const fullEstimate = reward?.fullRewardEstimate ?? null;
  // Points shown = user-visible unit (reward.ryumo; reward.final is the base
  // unit of the SAME amount, never added on top). The poll refines from the
  // ledger, and only upward: a higher settled value replaces the estimate,
  // a lower one leaves the screen alone (kurgu: the ledger stays authoritative,
  // the result screen never walks a shown reward back).
  const estimate = reward?.ryumo ?? reward?.final ?? 0;
  const points = bint != null ? Math.max(bint, estimate) : estimate;
  // XP is granted by background trust-update, so it may lag the first render.
  const isCalculatingXp = xp == null && !noRewardMessage;

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
              {`+${Math.round(points)}`}
            </div>
            <p className="text-sm text-muted-foreground">{t("rewardCard.pointsUnit")}</p>
            {!noRewardMessage && (
              <div className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
                <span>{isCalculatingXp ? t("rewardCard.calculatingXp") : `+${Math.round(xp ?? 0)} XP`}</span>
              </div>
            )}
            {xp === 0 && !noRewardMessage && (
              <p className="text-xs text-muted-foreground mt-1.5">{t("rewardCard.xpDailyLimit")}</p>
            )}
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

          {!noRewardMessage && breakdown && (breakdown.finalPoints ?? 0) > 0 && (
            <div className="rounded-xl border border-primary/15 bg-gradient-to-b from-primary/[0.04] to-transparent overflow-hidden">
              <button
                type="button"
                onClick={() => setShowBreakdown((v) => !v)}
                aria-expanded={showBreakdown}
                className="flex w-full items-center justify-between gap-2 px-3.5 py-2.5 text-left text-sm font-medium text-primary transition-colors hover:bg-primary/[0.06]"
              >
                <span>{showBreakdown ? t("rewardCard.breakdown.hide") : t("rewardCard.breakdown.toggle")}</span>
                <motion.span animate={{ rotate: showBreakdown ? 180 : 0 }} transition={{ duration: 0.2 }}>
                  <ChevronDown className="h-4 w-4" />
                </motion.span>
              </button>
              <AnimatePresence initial={false}>
                {showBreakdown && (
                  <motion.div
                    key="breakdown-body"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.24, ease: [0.4, 0, 0.2, 1] }}
                    className="overflow-hidden"
                  >
                    <div className="px-3.5 pb-3 pt-0.5">
                      <ul className="divide-y divide-border/60">
                        {buildBreakdownRows(breakdown, t).map((row, i) => (
                          <motion.li
                            key={row.key}
                            initial={{ opacity: 0, x: -6 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.04 * i, duration: 0.18 }}
                            className="flex items-center justify-between gap-3 py-2"
                          >
                            {row.kind === "value" ? (
                              <>
                                <span className="text-sm text-muted-foreground">{row.label}</span>
                                <span className="font-mono text-sm font-semibold tabular-nums text-foreground">
                                  {row.value}
                                </span>
                              </>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                                {row.icon === "honor" ? (
                                  <ShieldCheck className="h-3.5 w-3.5 text-primary/70" />
                                ) : (
                                  <Gauge className="h-3.5 w-3.5 text-amber-500/80" />
                                )}
                                {row.label}
                              </span>
                            )}
                          </motion.li>
                        ))}
                      </ul>
                      <div className="mt-2 flex items-center justify-between gap-3 rounded-lg border border-primary/20 bg-primary/[0.06] px-3 py-2">
                        <span className="text-sm font-semibold text-foreground">
                          {t("rewardCard.breakdown.total")}
                        </span>
                        <span className="font-mono text-base font-bold tabular-nums text-primary">
                          {`+${Math.round(breakdown.finalPoints ?? 0)}`}
                        </span>
                      </div>
                      {(breakdown.capApplied !== "none" || breakdown.postProcessCapApplied) && (
                        <p className="mt-2 text-xs text-muted-foreground">
                          {t("rewardCard.breakdown.capNote")}
                        </p>
                      )}
                      {breakdown.honorApplied && (
                        <p className="mt-1 text-xs text-muted-foreground">
                          {t("rewardCard.breakdown.honorNote")}
                        </p>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {qualityHonor != null && (
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("rewardCard.quality")}</span>
                <span>{qualityHonor.level}</span>
              </div>
            </div>
          )}

          <ReferralInviteCta />
        </div>
      </CardContent>
    </Card>
  );
}
