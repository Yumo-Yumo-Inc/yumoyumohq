"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/app/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Trophy, ReceiptText, CheckCircle2, Zap, Target,
  TrendingUp, Flame, ArrowRight, Sparkles, ShieldCheck, Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ReferralShareCard } from "@/components/app/referral-share-card";
import { ClaimButton } from "@/components/rewards/claim-button";
import { ReferralList } from "@/components/app/referral-list";
import { loadBootstrapSnapshot } from "@/lib/bootstrap";
import { useAppLocale } from "@/lib/i18n/app-context";
import { getQuestTitle } from "@/lib/quests/quest-pools";
import { questXpToCPoints } from "@/config/contribution-config";
import { useAppProfile } from "@/lib/app/profile-context";
import { subscribeLocalDbChanges } from "@/lib/local-db";
import { readCachedReceipts, readCachedQuests } from "@/lib/offline/cache";
import {
  SEASON_LEVEL_XP_THRESHOLDS,
  getSeasonLevelMultiplier,
} from "@/config/season-level-config";
import type { CachedReceiptRecord, CachedQuestRecord } from "@/lib/offline/types";

// ─── helpers ────────────────────────────────────────────────────────────────

function getDaysLeft(endAt?: string | null): number | null {
  if (!endAt) return null;
  const ms = new Date(endAt).getTime() - Date.now();
  return Math.max(0, Math.ceil(ms / 86_400_000));
}

function xpProgress(level: number, xp: number) {
  const lo = SEASON_LEVEL_XP_THRESHOLDS[level - 1] ?? 0;
  const hi = SEASON_LEVEL_XP_THRESHOLDS[level] ?? lo + 500;
  const current = xp - lo;
  const total = hi - lo;
  return { current, total, pct: Math.min(100, (current / total) * 100) };
}

function getNextUnlocks(seasonLevel: number) {
  const MILESTONES = [5, 10, 15, 20, 25, 30];
  const unlocks: Array<{ level: number; kind: "boost" | "milestone"; multiplier?: number }> = [];
  const nextBoost = Math.ceil((seasonLevel + 1) / 3) * 3;
  const nextMilestone = MILESTONES.find((m) => m > seasonLevel);
  unlocks.push({ level: nextBoost, kind: "boost", multiplier: 1 + Math.floor(nextBoost / 3) * 0.01 });
  if (nextMilestone) unlocks.push({ level: nextMilestone, kind: "milestone" });
  const afterBoost = nextBoost + 3;
  if (afterBoost !== nextMilestone) {
    unlocks.push({ level: afterBoost, kind: "boost", multiplier: 1 + Math.floor(afterBoost / 3) * 0.01 });
  }
  return unlocks.sort((a, b) => a.level - b.level).slice(0, 4);
}

// ─── page ───────────────────────────────────────────────────────────────────

export default function RewardsPage() {
  const { locale, t } = useAppLocale();
  const fmt = (n: number) => n.toLocaleString(locale);
  const { profile, refresh: refreshProfile } = useAppProfile();
  const [receipts, setReceipts] = useState<CachedReceiptRecord[]>([]);
  const [quests, setQuests] = useState<CachedQuestRecord[]>([]);

  useEffect(() => { void refreshProfile(); }, [refreshProfile]);

  useEffect(() => {
    void loadData();
    const unsub = subscribeLocalDbChanges((stores) => {
      if (stores.some((s) => ["receipts", "quests", "wallet", "progress"].includes(s))) {
        void loadData();
      }
    });
    return unsub;
  }, []);

  async function loadData() {
    try {
      await loadBootstrapSnapshot().catch(() => {});
      const [r, q] = await Promise.all([readCachedReceipts(), readCachedQuests()]);
      setReceipts(r);
      setQuests(q);
    } catch (e) { console.error(e); }
  }

  // ── derived values ────────────────────────────────────────────────────────
  const seasonLevel = profile?.seasonLevel ?? 1;
  const seasonXp = profile?.seasonXp ?? 0;
  const { current: xpCurrent, total: xpTotal, pct: xpPct } = xpProgress(seasonLevel, seasonXp);
  const multiplier = getSeasonLevelMultiplier(seasonLevel);
  const daysLeft = getDaysLeft(profile?.currentSeason?.endAt);
  const seasonName = profile?.currentSeason?.name ?? `Season ${profile?.currentSeason?.seasonNumber ?? 1}`;

  const totalContrib = profile?.contributionPoints?.total ?? 0;
  const fromReceipts = profile?.contributionPoints?.fromReceipts ?? 0;
  const fromQuests = profile?.contributionPoints?.fromQuests ?? 0;
  // Best move today: first incomplete daily, then weekly
  const pendingDaily = quests.find((q) => q.questKind === "daily" && q.status !== "completed");
  const pendingWeekly = !pendingDaily ? quests.find((q) => q.questKind === "weekly" && q.status !== "completed") : undefined;
  const bestMove = pendingDaily ?? pendingWeekly ?? null;

  // Season recap
  const verifiedReceipts = receipts.filter((r) => r.status === "VERIFIED" || r.status === "analyzed");
  const completedQuests = quests.filter((q) => q.status === "completed");
  // Single source of truth: the user's total contribution points (cPoints).
  const totalCPointsEarned = totalContrib;

  const nextUnlocks = getNextUnlocks(seasonLevel);

  // How You Earn entries
  const earnSources = [
    {
      icon: ReceiptText,
      color: "text-primary",
      bg: "bg-primary/10",
      label: t("rewardsPage.earnReceiptLabel"),
      desc: t("rewardsPage.earnReceiptDesc"),
    },
    {
      icon: ShieldCheck,
      color: "text-sky-400",
      bg: "bg-sky-500/10",
      label: t("rewardsPage.earnVerifyLabel"),
      desc: t("rewardsPage.earnVerifyDesc"),
    },
    {
      icon: CheckCircle2,
      color: "text-emerald-400",
      bg: "bg-emerald-500/10",
      label: t("rewardsPage.earnDailyLabel"),
      desc: t("rewardsPage.earnDailyDesc"),
    },
    {
      icon: Target,
      color: "text-amber-400",
      bg: "bg-amber-500/10",
      label: t("rewardsPage.earnWeeklyLabel"),
      desc: t("rewardsPage.earnWeeklyDesc"),
    },
    {
      icon: Sparkles,
      color: "text-violet-400",
      bg: "bg-violet-500/10",
      label: t("rewardsPage.earnQualityLabel"),
      desc: t("rewardsPage.earnQualityDesc"),
    },
  ];

  // ── render ───────────────────────────────────────────────────────────────
  return (
    <AppShell>
      <div className="max-w-2xl mx-auto space-y-5 pb-8">

        {/* header */}
        <div className="flex items-center gap-2 pt-1">
          <Trophy className="h-5 w-5 text-primary" />
          <h1 className="text-xl font-bold">{t("rewardsPage.title")}</h1>
        </div>

        {/* ── 1. Season Progress ───────────────────────────────────────── */}
        <Card className="card-cinematic card-secondary border-primary/40 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/8 via-transparent to-transparent pointer-events-none" />
          <CardContent className="pt-5 pb-5 relative">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{seasonName}</p>
                <p className="text-3xl font-black tabular-nums mt-0.5">
                  Lv.<span className="text-primary">{seasonLevel}</span>
                </p>
              </div>
              <div className="text-right space-y-1">
                {daysLeft !== null && (
                  <p className="text-xs text-muted-foreground">{t("rewardsPage.daysLeft", { count: daysLeft })}</p>
                )}
                <p className="text-xs font-semibold text-primary/80">Boost {multiplier.toFixed(2)}x</p>
              </div>
            </div>
            <div className="space-y-2">
              <Progress value={xpPct} className="h-2.5 rounded-full" />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span className="tabular-nums">{fmt(xpCurrent)} XP</span>
                <span className="font-medium text-foreground/70">
                  {fmt(xpTotal - xpCurrent)} XP → Lv.{seasonLevel + 1}
                </span>
                <span className="tabular-nums">{fmt(xpTotal)} XP</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ── 1b. Unlock Journey entry (permanent account ladder) ──────── */}
        <Link href="/app/rewards/journey" className="block group">
          <div
            className="relative flex items-center gap-3 overflow-hidden border px-4 py-3.5 transition-transform group-hover:scale-[1.01] group-active:scale-[0.99]"
            style={{
              borderColor: "rgba(245,166,35,0.3)",
              borderRadius: "var(--app-radius-md, 10px)",
              background: "linear-gradient(135deg, rgba(245,166,35,0.08), var(--app-bg-surface, transparent))",
            }}
          >
            <div
              aria-hidden
              className="pointer-events-none absolute inset-x-0 top-0 h-px"
              style={{ background: "linear-gradient(90deg, transparent, rgba(245,166,35,0.5), transparent)" }}
            />
            <div className="p-2 rounded-xl flex-shrink-0" style={{ background: "rgba(245,166,35,0.14)" }}>
              <Sparkles className="h-4 w-4" style={{ color: "#F5A623" }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold">{t("rewardsPage.journeyLink")}</p>
              <p className="text-xs text-muted-foreground leading-snug">{t("rewardsPage.journeyLinkDesc")}</p>
            </div>
            <span className="font-mono text-sm font-bold tabular-nums flex-shrink-0" style={{ color: "#F5A623" }}>
              Lv.{profile?.accountLevel ?? 1}
            </span>
            <ArrowRight className="h-4 w-4 flex-shrink-0" style={{ color: "rgba(245,166,35,0.7)" }} />
          </div>
        </Link>

        {/* ── 1c. On-chain claim (ships dark; renders only when the
               claim-proof API returns an allocation) ─────────────────── */}
        <ClaimButton />

        {/* ── 2. Today's Best Move ─────────────────────────────────────── */}
        {bestMove && (
          <Card className="card-cinematic border-amber-500/30 bg-amber-500/5">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-xl bg-amber-500/15 mt-0.5 flex-shrink-0">
                  <Flame className="h-4 w-4 text-amber-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-amber-400 uppercase tracking-wider mb-1">
                    {t("rewardsPage.bestMove")}
                  </p>
                  <p className="text-sm font-medium leading-snug">{getQuestTitle(bestMove.type, locale, bestMove.title)}</p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {bestMove.rewardSeasonXp > 0 && (
                      <span className="text-xs bg-primary/15 text-primary px-2 py-0.5 rounded-full font-semibold">
                        +{bestMove.rewardSeasonXp} Season XP
                      </span>
                    )}
                    {questXpToCPoints(bestMove.rewardSeasonXp) > 0 && (
                      <span className="text-xs bg-emerald-500/15 text-emerald-400 px-2 py-0.5 rounded-full font-semibold">
                        +{fmt(questXpToCPoints(bestMove.rewardSeasonXp))} cPoints
                      </span>
                    )}
                  </div>
                </div>
                <Link href="/app/tasks">
                  <Button size="sm" variant="outline" className="flex-shrink-0 border-amber-500/40 text-amber-400 hover:bg-amber-500/10">
                    <span className="text-xs">{t("rewardsPage.go")}</span>
                    <ArrowRight className="h-3 w-3 ml-1" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ── 3. Your Rewards ──────────────────────────────────────────── */}
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            {t("rewardsPage.yourRewards")}
          </p>
          <div className="grid grid-cols-2 gap-3">
            <Card className="card-cinematic card-secondary col-span-2">
              <CardContent className="pt-4 pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground">{t("rewardsPage.contributionBalance")}</p>
                    <p className="text-2xl font-black tabular-nums text-primary mt-0.5">{fmt(Math.round(totalContrib))}</p>
                    <p className="text-xs text-muted-foreground mt-1">{t("rewardsPage.totalProof")}</p>
                  </div>
                  <Target className="h-7 w-7 text-primary/25 mt-0.5 flex-shrink-0" />
                </div>
                <div className="flex gap-6 mt-3 pt-3 border-t border-border/50">
                  <div>
                    <p className="text-xs text-muted-foreground">{t("rewardsPage.fromReceipts")}</p>
                    <p className="text-sm font-semibold tabular-nums">{fmt(Math.round(fromReceipts))}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">{t("rewardsPage.fromQuests")}</p>
                    <p className="text-sm font-semibold tabular-nums">{fmt(Math.round(fromQuests))}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="card-cinematic card-secondary border-violet-500/25">
              <CardContent className="pt-4 pb-4">
                <Sparkles className="h-4 w-4 text-violet-400 mb-2" />
                <p className="text-xl font-black tabular-nums text-violet-400">{fmt(Math.round(fromReceipts))}</p>
                <p className="text-xs font-semibold mt-0.5">{t("rewardsPage.receiptCPoints")}</p>
                <p className="text-xs text-muted-foreground mt-1 leading-snug">{t("rewardsPage.earnedFromReceipts")}</p>
              </CardContent>
            </Card>

            <Card className="card-cinematic card-secondary border-emerald-500/25">
              <CardContent className="pt-4 pb-4">
                <Zap className="h-4 w-4 text-emerald-400 mb-2" />
                <p className="text-xl font-black tabular-nums text-emerald-400">{fmt(Math.round(fromQuests))}</p>
                <p className="text-xs font-semibold mt-0.5">{t("rewardsPage.bonusCPoints")}</p>
                <p className="text-xs text-muted-foreground mt-1 leading-snug">{t("rewardsPage.earnedFromQuests")}</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* ── 4. Season Recap (user's own stats) ───────────────────────── */}
        <Card className="card-cinematic card-secondary">
          <CardHeader className="pb-2 pt-4">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Trophy className="h-4 w-4 text-amber-400" />
              {t("rewardsPage.seasonRecap")}
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-4">
            <div className="grid grid-cols-2 gap-x-6 gap-y-4">
              {[
                { label: t("rewardsPage.receiptsVerified"), value: fmt(verifiedReceipts.length) },
                { label: t("rewardsPage.questsCompleted"), value: fmt(completedQuests.length) },
                { label: t("rewardsPage.cPointsEarned"), value: fmt(Math.round(totalCPointsEarned)) },
                { label: t("rewardsPage.seasonXp"), value: fmt(seasonXp) },
                { label: t("rewardsPage.currentLevel"), value: `Lv.${seasonLevel}` },
                { label: t("rewardsPage.rewardBoost"), value: `${multiplier.toFixed(2)}x` },
              ].map(({ label, value }) => (
                <div key={label}>
                  <p className="text-xs text-muted-foreground">{label}</p>
                  <p className="text-base font-bold tabular-nums mt-0.5">{value}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* ── 5. Next Unlocks ──────────────────────────────────────────── */}
        <Card className="card-cinematic card-secondary">
          <CardHeader className="pb-1 pt-4">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              {t("rewardsPage.nextUnlocks")}
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-4 space-y-0 divide-y divide-border/40">
            {nextUnlocks.map(({ level, kind, multiplier: m }) => {
              const xpNeeded = Math.max(0, (SEASON_LEVEL_XP_THRESHOLDS[level - 1] ?? 0) - seasonXp);
              const label = kind === "boost"
                ? t("rewardsPage.rewardBoostArrow", { multiplier: (m ?? 1).toFixed(2) })
                : t("rewardsPage.milestoneChallenge");
              return (
                <div key={level} className="flex items-center justify-between py-2.5 first:pt-2">
                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 rounded-lg bg-primary/10 flex-shrink-0">
                      {kind === "boost"
                        ? <Zap className="h-3.5 w-3.5 text-primary" />
                        : <Trophy className="h-3.5 w-3.5 text-primary" />}
                    </div>
                    <div>
                      <p className="text-xs font-semibold">Lv.{level}</p>
                      <p className="text-xs text-muted-foreground">{label}</p>
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground tabular-nums flex-shrink-0 ml-4">
                    {xpNeeded > 0 ? `${fmt(xpNeeded)} XP` : t("rewardsPage.reached")}
                  </span>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* ── 6. How You Earn ──────────────────────────────────────────── */}
        <Card className="card-cinematic card-secondary">
          <CardHeader className="pb-2 pt-4">
            <CardTitle className="text-sm font-semibold">
              {t("rewardsPage.howYouEarn")}
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-4 space-y-3.5">
            {earnSources.map(({ icon: Icon, color, bg, label, desc }) => (
              <div key={label} className="flex items-start gap-2.5">
                <div className={cn("p-1.5 rounded-lg flex-shrink-0 mt-0.5", bg)}>
                  <Icon className={cn("h-3.5 w-3.5", color)} />
                </div>
                <div>
                  <p className="text-xs font-semibold">{label}</p>
                  <p className="text-xs text-muted-foreground">{desc}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* ── 7. Invites (affiliate) — its own zone, other people's data ── */}
        <div className="pt-3">
          <div
            className="mb-5 h-px w-full"
            style={{ background: "linear-gradient(90deg, transparent, var(--app-border-strong), transparent)" }}
          />
          <div className="flex items-start gap-2.5 mb-3">
            <div className="p-1.5 rounded-lg bg-primary/10 mt-0.5 flex-shrink-0">
              <Users className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold">{t("rewardsPage.invitesTitle")}</p>
              <p className="text-xs text-muted-foreground leading-snug">{t("rewardsPage.invitesSubtitle")}</p>
            </div>
          </div>
          <div className="space-y-3">
            <ReferralShareCard accountLevel={profile?.accountLevel ?? 1} />
            <ReferralList />
          </div>
        </div>

      </div>
    </AppShell>
  );
}
