"use client";

/**
 * Season & Quests — the season's progress card (name, days left, XP, current +
 * next tier with reward), the full tier ladder, and the embedded quest board.
 * When no season is running it shows a calm "starts soon" state (no fake data).
 */

import dynamic from "next/dynamic";
import { motion, useReducedMotion, type Variants } from "framer-motion";
import { CalendarClock, Coins } from "lucide-react";
import { getSeasonConfig } from "@/config/seasons";
import { pickLabel, SEASON_TIER_LABELS } from "@/config/season-content";
import { useAppLocale } from "@/lib/i18n/app-context";
import { useSeasonStatus } from "@/components/app/account/hooks";

const QuestsScreen = dynamic(
  () => import("@/components/app/quests-screen").then((m) => m.QuestsScreen),
  { ssr: false, loading: () => <QuestsFallback /> },
);

function QuestsFallback() {
  return (
    <div className="h-40 w-full animate-pulse rounded-2xl" style={{ background: "var(--app-bg-elevated)" }} />
  );
}

const item: Variants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 320, damping: 30 } },
};

function surfaceStyle(): React.CSSProperties {
  return {
    background: "linear-gradient(160deg, var(--app-bg-elevated), var(--app-bg-surface))",
    border: "1px solid var(--app-border)",
    borderRadius: 16,
    boxShadow: "var(--app-shadow-card)",
  };
}

export function SeasonSection() {
  const reduce = useReducedMotion();
  const { locale } = useAppLocale();
  const loc = locale as string;
  const tr = (t: string, e: string) => (loc === "tr" ? t : e);
  const numFmt = loc === "tr" ? "tr-TR" : "en-US";
  const { data, loading } = useSeasonStatus();

  const active = data?.active ?? null;
  const progress = data?.progress;
  const config = active ? getSeasonConfig(active.seasonNumber) : null;
  const seasonXp = progress?.seasonXp ?? 0;
  const nextTier = progress?.nextTier ?? null;
  const currentTier = progress?.currentTier ?? null;
  const nextPct = nextTier ? Math.min(100, Math.round((seasonXp / nextTier.minSeasonXp) * 100)) : 100;

  const wrap = (children: React.ReactNode) =>
    reduce ? <div className="space-y-4">{children}</div> : (
      <motion.div initial="hidden" animate="show" transition={{ staggerChildren: 0.06 }} className="space-y-4">
        {children}
      </motion.div>
    );
  const block = (children: React.ReactNode, key?: string) =>
    reduce ? <div key={key}>{children}</div> : <motion.div key={key} variants={item}>{children}</motion.div>;

  if (loading) {
    return <div className="h-48 w-full animate-pulse rounded-2xl" style={{ background: "var(--app-bg-elevated)" }} />;
  }

  return wrap(
    <>
      {!active ? (
        block(
          <div className="p-8 text-center" style={surfaceStyle()}>
            <CalendarClock className="mx-auto mb-3 h-7 w-7" style={{ color: "var(--app-primary)" }} />
            <h3 className="text-lg font-bold" style={{ color: "var(--app-text-primary)" }}>
              {tr("Sezon yakında başlıyor", "The season starts soon")}
            </h3>
            <p className="mx-auto mt-1 max-w-xs text-[13px]" style={{ color: "var(--app-text-muted)" }}>
              {tr("Fiş taradıkça topladığın XP, sezon açıldığında ilk günden sayılmaya başlar.", "The XP you build by scanning receipts starts counting from day one when the season opens.")}
            </p>
          </div>,
        )
      ) : (
        block(
          <div className="relative overflow-hidden p-5" style={surfaceStyle()}>
            <div className="absolute inset-x-0 top-0 h-px" style={{ background: "var(--app-gold-border)" }} />
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-[0.14em]" style={{ color: "var(--app-text-muted)" }}>
                  {tr("Sezon", "Season")}
                </div>
                <h3 className="text-xl font-black tracking-tight" style={{ color: "var(--app-text-primary)" }}>
                  {active.name}
                </h3>
              </div>
              <span
                className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold"
                style={{ background: "var(--app-bg-base)", color: "var(--app-text-secondary)", border: "1px solid var(--app-border)" }}
              >
                <CalendarClock className="h-3 w-3" />
                {tr(`${active.daysLeft} gün kaldı`, `${active.daysLeft} days left`)}
              </span>
            </div>

            <div className="mt-4 flex items-end justify-between gap-3">
              <div>
                <div className="font-mono text-3xl font-black tabular-nums" style={{ color: "var(--app-text-primary)" }}>
                  {seasonXp.toLocaleString(numFmt)}
                </div>
                <div className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: "var(--app-text-muted)" }}>
                  {tr("Sezon XP", "Season XP")}
                </div>
              </div>
              {currentTier && (
                <span
                  className="rounded-full px-3 py-1 text-[12px] font-bold uppercase tracking-wide"
                  style={{ background: "var(--app-gold-glow)", color: "var(--app-gold)", border: "1px solid var(--app-gold-border)" }}
                >
                  {pickLabel(SEASON_TIER_LABELS, currentTier.key, loc)}
                </span>
              )}
            </div>

            {/* progress to next tier */}
            {nextTier ? (
              <div className="mt-4">
                <div className="flex items-center justify-between text-[11px] font-semibold" style={{ color: "var(--app-text-muted)" }}>
                  <span>{tr("Sıradaki", "Next")}: {pickLabel(SEASON_TIER_LABELS, nextTier.key, loc)}</span>
                  <span className="inline-flex items-center gap-1" style={{ color: "var(--app-gold)" }}>
                    <Coins className="h-3 w-3" />+{nextTier.cpointsReward.toLocaleString(numFmt)}
                  </span>
                </div>
                <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full" style={{ background: "color-mix(in srgb, var(--app-text-primary) 10%, transparent)" }}>
                  <div className="h-full rounded-full transition-[width] duration-700" style={{ width: `${nextPct}%`, background: "linear-gradient(90deg,#2BC4AE,#F2B33D)" }} />
                </div>
                <div className="mt-1 text-right text-[11px] font-mono tabular-nums" style={{ color: "var(--app-text-muted)" }}>
                  {seasonXp.toLocaleString(numFmt)} / {nextTier.minSeasonXp.toLocaleString(numFmt)}
                </div>
              </div>
            ) : (
              <p className="mt-4 text-[13px] font-semibold" style={{ color: "var(--app-gold)" }}>
                {tr("En üst kademeye ulaştın.", "You've reached the top tier.")}
              </p>
            )}
          </div>,
        )
      )}

      {/* Tier ladder */}
      {config && block(
        <div className="p-5" style={surfaceStyle()}>
          <h3 className="mb-3 text-base font-bold tracking-tight" style={{ color: "var(--app-text-primary)" }}>
            {tr("Kademeler", "Tiers")}
          </h3>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {config.tiers.map((tier) => {
              const reached = seasonXp >= tier.minSeasonXp;
              return (
                <div
                  key={tier.key}
                  className="flex flex-col gap-1 rounded-xl p-3"
                  style={{
                    background: "var(--app-bg-base)",
                    border: reached ? "1px solid var(--app-gold-border)" : "1px solid var(--app-border)",
                    opacity: reached ? 1 : 0.72,
                  }}
                >
                  <span className="text-[13px] font-bold" style={{ color: reached ? "var(--app-gold)" : "var(--app-text-secondary)" }}>
                    {pickLabel(SEASON_TIER_LABELS, tier.key, loc)}
                  </span>
                  <span className="font-mono text-[11px] tabular-nums" style={{ color: "var(--app-text-muted)" }}>
                    {tier.minSeasonXp.toLocaleString(numFmt)} XP
                  </span>
                  <span className="inline-flex items-center gap-1 font-mono text-[12px] font-bold tabular-nums" style={{ color: "var(--app-text-primary)" }}>
                    <Coins className="h-3 w-3" style={{ color: "var(--app-gold)" }} />
                    +{tier.cpointsReward.toLocaleString(numFmt)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>,
      )}

      {/* Quest board */}
      {block(
        <div>
          <h3 className="mb-3 px-1 text-base font-bold tracking-tight" style={{ color: "var(--app-text-primary)" }}>
            {tr("Görevler", "Quests")}
          </h3>
          <QuestsScreen />
        </div>,
      )}
    </>,
  );
}
