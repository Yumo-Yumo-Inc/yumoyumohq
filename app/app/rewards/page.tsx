"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/app/app-shell";
import { Surface, SurfaceHeader, SurfaceTitle, SurfaceBody } from "@/components/ui/surface";
import { StaggerReveal, Reveal } from "@/components/ui/stagger-reveal";
import { Button } from "@/components/ui/button";
import { useCountUp } from "@/lib/hooks/use-count-up";
import {
  Trophy, ReceiptText, CheckCircle2, Zap, Target,
  TrendingUp, Flame, ArrowRight, Sparkles, ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ClaimButton } from "@/components/rewards/claim-button";
import { AlphaPeriodLeaderboard } from "@/components/rewards/alpha-period-leaderboard";
import { ReferralEarningsCard } from "@/components/app/referral-earnings-card";
import { loadBootstrapSnapshot } from "@/lib/bootstrap";
import { useAppLocale } from "@/lib/i18n/app-context";
import { getQuestTitle } from "@/lib/quests/quest-pools";
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
  const cuLevel = useCountUp(seasonLevel);

  // Best move today: first incomplete daily, then weekly
  const pendingDaily = quests.find((q) => q.questKind === "daily" && q.status !== "completed");
  const pendingWeekly = !pendingDaily ? quests.find((q) => q.questKind === "weekly" && q.status !== "completed") : undefined;
  const bestMove = pendingDaily ?? pendingWeekly ?? null;

  // Season recap
  const verifiedReceipts = receipts.filter((r) => {
    const status = String(r.status || "").toLowerCase();
    return status === "verified" || status === "analyzed";
  });
  const completedQuests = quests.filter((q) => q.status === "completed");

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

        {/* ── Points leaderboard (Genesis + Alpha tabs) ───────────────── */}
        <AlphaPeriodLeaderboard viewerUsername={profile?.username} />

        {/* ── 1. Season Progress ───────────────────────────────────────── */}
        <Surface variant="value" accent="gold" glow radius="lg" className="p-5">
          <div className="relative mb-4 flex items-start justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em]" style={{ color: "var(--app-text-muted)" }}>
                {seasonName}
              </p>
              <p className="mt-1.5 flex items-baseline gap-1.5">
                <span className="text-base font-semibold" style={{ color: "var(--app-text-secondary)" }}>Lv.</span>
                <span className="scanui-hero-num text-[46px] tabular-nums">{Math.round(cuLevel)}</span>
              </p>
            </div>
            <div className="space-y-1 text-right">
              {daysLeft !== null && (
                <p className="text-[11px]" style={{ color: "var(--app-text-muted)" }}>{t("rewardsPage.daysLeft", { count: daysLeft })}</p>
              )}
              <p className="text-[11px] font-semibold" style={{ color: "var(--app-gold)" }}>Boost {multiplier.toFixed(2)}x</p>
            </div>
          </div>
          <div className="space-y-2">
            <div className="h-2.5 overflow-hidden rounded-full" style={{ background: "var(--app-border)" }}>
              <div
                className="h-full rounded-full transition-[width] duration-700 ease-out"
                style={{
                  width: `${xpPct}%`,
                  background: "linear-gradient(90deg, var(--app-gold-dim), var(--app-gold-light))",
                  boxShadow: "0 0 12px var(--app-gold-glow)",
                }}
              />
            </div>
            <div className="flex justify-between text-[11px]" style={{ color: "var(--app-text-muted)" }}>
              <span className="tabular-nums">{fmt(xpCurrent)} XP</span>
              <span className="font-medium" style={{ color: "var(--app-text-secondary)" }}>
                {fmt(xpTotal - xpCurrent)} XP → Lv.{seasonLevel + 1}
              </span>
              <span className="tabular-nums">{fmt(xpTotal)} XP</span>
            </div>
          </div>
        </Surface>

        {/* ── 1b. Unlock Journey entry (permanent account ladder) ──────── */}
        <Surface
          as={Link}
          href="/app/rewards/journey"
          variant="value"
          accent="gold"
          radius="md"
          interactive
          className="flex items-center gap-3 px-4 py-3.5"
        >
          <div className="flex-shrink-0 rounded-xl p-2" style={{ background: "var(--app-gold-glow)" }}>
            <Sparkles className="h-4 w-4" style={{ color: "var(--app-gold)" }} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold" style={{ color: "var(--app-text-primary)" }}>{t("rewardsPage.journeyLink")}</p>
            <p className="text-xs leading-snug" style={{ color: "var(--app-text-muted)" }}>{t("rewardsPage.journeyLinkDesc")}</p>
          </div>
          <span className="flex-shrink-0 font-mono text-sm font-bold tabular-nums" style={{ color: "var(--app-gold)" }}>
            Lv.{profile?.accountLevel ?? 1}
          </span>
          <ArrowRight className="h-4 w-4 flex-shrink-0" style={{ color: "var(--app-gold-dim)" }} />
        </Surface>

        {/* ── 1c. On-chain claim (ships dark; renders only when the
               claim-proof API returns an allocation) ─────────────────── */}
        <ClaimButton />

        {/* ── 2. Today's Best Move ─────────────────────────────────────── */}
        {bestMove && (
          <Surface variant="glass" accent="gold" glow radius="lg" className="p-4">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex-shrink-0 rounded-xl p-2" style={{ background: "var(--app-gold-glow)" }}>
                <Flame className="h-4 w-4" style={{ color: "var(--app-gold)" }} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.14em]" style={{ color: "var(--app-gold)" }}>
                  {t("rewardsPage.bestMove")}
                </p>
                <p className="text-sm font-medium leading-snug" style={{ color: "var(--app-text-primary)" }}>{getQuestTitle(bestMove.type, locale, bestMove.title)}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {bestMove.rewardSeasonXp > 0 && (
                    <span className="rounded-full px-2 py-0.5 text-xs font-semibold" style={{ background: "var(--app-gold-glow)", color: "var(--app-gold)" }}>
                      +{bestMove.rewardSeasonXp} Season XP
                    </span>
                  )}
                </div>
              </div>
              <Link href="/app/tasks">
                <Button size="sm" variant="outline" className="flex-shrink-0 border-amber-500/40 text-amber-400 hover:bg-amber-500/10">
                  <span className="text-xs">{t("rewardsPage.go")}</span>
                  <ArrowRight className="ml-1 h-3 w-3" />
                </Button>
              </Link>
            </div>
          </Surface>
        )}

        {/* ── 4. Season Recap (user's own stats) ───────────────────────── */}
        <Surface variant="elevated" radius="lg">
          <SurfaceHeader>
            <SurfaceTitle className="flex items-center gap-2">
              <Trophy className="h-4 w-4" style={{ color: "var(--app-gold)" }} />
              {t("rewardsPage.seasonRecap")}
            </SurfaceTitle>
          </SurfaceHeader>
          <SurfaceBody>
            <StaggerReveal className="grid grid-cols-2 gap-x-6 gap-y-4">
              {[
                { label: t("rewardsPage.receiptsVerified"), value: fmt(verifiedReceipts.length) },
                { label: t("rewardsPage.questsCompleted"), value: fmt(completedQuests.length) },
                { label: t("rewardsPage.seasonXp"), value: fmt(seasonXp) },
                { label: t("rewardsPage.currentLevel"), value: `Lv.${seasonLevel}` },
                { label: t("rewardsPage.rewardBoost"), value: `${multiplier.toFixed(2)}x` },
              ].map(({ label, value }) => (
                <Reveal key={label}>
                  <p className="text-xs" style={{ color: "var(--app-text-muted)" }}>{label}</p>
                  <p className="mt-0.5 text-base font-bold tabular-nums" style={{ color: "var(--app-text-primary)" }}>{value}</p>
                </Reveal>
              ))}
            </StaggerReveal>
          </SurfaceBody>
        </Surface>

        {/* ── 5. Next Unlocks ──────────────────────────────────────────── */}
        <Surface variant="elevated" radius="lg">
          <SurfaceHeader>
            <SurfaceTitle className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" style={{ color: "var(--app-gold)" }} />
              {t("rewardsPage.nextUnlocks")}
            </SurfaceTitle>
          </SurfaceHeader>
          <SurfaceBody className="pt-1">
            <div className="divide-y" style={{ borderColor: "var(--app-border)" }}>
              {nextUnlocks.map(({ level, kind, multiplier: m }) => {
                const xpNeeded = Math.max(0, (SEASON_LEVEL_XP_THRESHOLDS[level - 1] ?? 0) - seasonXp);
                const label = kind === "boost"
                  ? t("rewardsPage.rewardBoostArrow", { multiplier: (m ?? 1).toFixed(2) })
                  : t("rewardsPage.milestoneChallenge");
                return (
                  <div key={level} className="flex items-center justify-between py-2.5 first:pt-0">
                    <div className="flex items-center gap-2.5">
                      <div className="flex-shrink-0 rounded-lg p-1.5" style={{ background: "var(--app-gold-glow)" }}>
                        {kind === "boost"
                          ? <Zap className="h-3.5 w-3.5" style={{ color: "var(--app-gold)" }} />
                          : <Trophy className="h-3.5 w-3.5" style={{ color: "var(--app-gold)" }} />}
                      </div>
                      <div>
                        <p className="text-xs font-semibold" style={{ color: "var(--app-text-primary)" }}>Lv.{level}</p>
                        <p className="text-xs" style={{ color: "var(--app-text-muted)" }}>{label}</p>
                      </div>
                    </div>
                    <span className="ml-4 flex-shrink-0 text-xs tabular-nums" style={{ color: "var(--app-text-muted)" }}>
                      {xpNeeded > 0 ? `${fmt(xpNeeded)} XP` : t("rewardsPage.reached")}
                    </span>
                  </div>
                );
              })}
            </div>
          </SurfaceBody>
        </Surface>

        {/* ── 6. How You Earn ──────────────────────────────────────────── */}
        <Surface variant="elevated" radius="lg">
          <SurfaceHeader>
            <SurfaceTitle>{t("rewardsPage.howYouEarn")}</SurfaceTitle>
          </SurfaceHeader>
          <SurfaceBody className="space-y-3.5">
            {earnSources.map(({ icon: Icon, color, bg, label, desc }) => (
              <div key={label} className="flex items-start gap-2.5">
                <div className={cn("mt-0.5 flex-shrink-0 rounded-lg p-1.5", bg)}>
                  <Icon className={cn("h-3.5 w-3.5", color)} />
                </div>
                <div>
                  <p className="text-xs font-semibold" style={{ color: "var(--app-text-primary)" }}>{label}</p>
                  <p className="text-xs" style={{ color: "var(--app-text-muted)" }}>{desc}</p>
                </div>
              </div>
            ))}
          </SurfaceBody>
        </Surface>

        {/* ── 7. Referral earnings — the full network hub lives in Friends → My Network ── */}
        <div className="pt-3">
          <div
            className="mb-5 h-px w-full"
            style={{ background: "linear-gradient(90deg, transparent, var(--app-border-strong), transparent)" }}
          />
          <ReferralEarningsCard />
        </div>

      </div>
    </AppShell>
  );
}
