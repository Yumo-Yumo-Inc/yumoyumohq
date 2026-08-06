"use client";

/**
 * /app/insights — "Wallet"
 *
 * The user's balances in one place: points (bINT), season XP + level,
 * account level, on-chain claim entry and a staking placeholder. The
 * spending sections that used to live here moved to /app/analysis
 * (SpendingPanel).
 *
 * Every figure comes from the profile source or /api/wallet/summary;
 * missing data renders an empty state — no fabricated values.
 */

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Archive,
  ArrowRight,
  Landmark,
  Lock,
  Medal,
  Receipt,
  Sparkles,
  Star,
  Wallet,
  Zap,
} from "lucide-react";
import { motion } from "framer-motion";
import { AppShell } from "@/components/app/app-shell";
import { Surface } from "@/components/ui/surface";
import { useCountUp } from "@/lib/hooks/use-count-up";
import { useAppLocale } from "@/lib/i18n/app-context";
import { useAppProfile } from "@/lib/app/profile-context";
import { ClaimButton } from "@/components/rewards/claim-button";
import {
  SEASON_LEVEL_XP_THRESHOLDS,
  getSeasonLevelMultiplier,
} from "@/config/season-level-config";
import { TXT_CARD_TITLE, TXT_MINI_CAPS, NUM_FEAT } from "@/components/insights/typography";

// ────────────────────────────────────────────────────────────────────────────
// Wallet summary data (points = bINT)
// ────────────────────────────────────────────────────────────────────────────

interface WalletSummaryData {
  points: { total: number; fromReceipts: number; fromQuests: number };
  alphaEarnings: number;
  receiptCount: number;
}

function useWalletSummary(): { summary: WalletSummaryData | null; loading: boolean } {
  const [summary, setSummary] = useState<WalletSummaryData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch("/api/wallet/summary", { cache: "no-store" });
        if (!alive) return;
        if (res.ok) {
          const json = (await res.json()) as WalletSummaryData;
          if (json && json.points) setSummary(json);
        }
      } catch {
        // network failure → keep null, page shows empty states
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  return { summary, loading };
}

// ────────────────────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────────────────────

function xpProgress(level: number, xp: number) {
  // Level 30 is the season cap (thresholds array length); the bar reads full.
  const atCap = level >= SEASON_LEVEL_XP_THRESHOLDS.length;
  const lo = SEASON_LEVEL_XP_THRESHOLDS[level - 1] ?? 0;
  const hi = SEASON_LEVEL_XP_THRESHOLDS[level] ?? lo + 500;
  const current = Math.max(0, xp - lo);
  const total = Math.max(1, hi - lo);
  return { current, total, pct: atCap ? 100 : Math.min(100, (current / total) * 100), atCap };
}

// ────────────────────────────────────────────────────────────────────────────
// Page
// ────────────────────────────────────────────────────────────────────────────

export default function WalletPage() {
  const { locale } = useAppLocale();
  const tr = locale === "tr";
  const { profile } = useAppProfile();
  const { summary } = useWalletSummary();

  const nf = (n: number) => Math.round(n).toLocaleString(tr ? "tr-TR" : "en-US");

  const seasonLevel = profile?.seasonLevel ?? 1;
  const seasonXp = profile?.seasonXp ?? 0;
  const accountLevel = profile?.accountLevel ?? 1;
  const { current: xpCurrent, total: xpTotal, pct: xpPct, atCap } = xpProgress(seasonLevel, seasonXp);
  const multiplier = getSeasonLevelMultiplier(seasonLevel);

  return (
    <AppShell>
      <div className="space-y-4 pb-24 lg:pb-8">
        {/* Page header */}
        <header className="flex items-center gap-3 px-1 pt-2">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-2xl"
            style={{
              background: "linear-gradient(160deg, rgba(232,201,122,0.18), rgba(201,168,76,0.04))",
              border: "1px solid var(--app-gold-border)",
              color: "var(--app-gold-light)",
            }}
          >
            <Wallet size={18} strokeWidth={2} />
          </div>
          <h1 className="m-0 text-[26px] font-bold leading-none tracking-[-0.02em] text-app-text-primary">
            {tr ? "Cüzdan" : "Wallet"}
          </h1>
        </header>

        {/* Points (bINT) — the reward unit shown on the result screen; the wallet's hero value */}
        <PointsCard summary={summary} tr={tr} nf={nf} />

        {/* Season XP + level */}
        <UnitCard
          icon={<Zap size={15} strokeWidth={2.2} />}
          label={tr ? "Sezon XP" : "Season XP"}
          delay={0.08}
        >
          <div className="flex items-end justify-between gap-3">
            <div
              className="font-mono font-bold leading-none tracking-[-0.03em] text-app-text-primary"
              style={{ fontSize: "clamp(26px, 6vw, 34px)", ...NUM_FEAT }}
            >
              {nf(seasonXp)}
              <span className="ml-1.5 align-middle text-[12px] font-semibold text-app-text-muted">XP</span>
            </div>
            <div className="text-right">
              <div className="font-mono text-[18px] font-bold leading-none text-app-text-primary" style={NUM_FEAT}>
                Lv.<span style={{ color: "var(--app-gold-light)" }}>{seasonLevel}</span>
              </div>
              <div className="mt-1 text-[11px] text-app-text-muted">Boost {multiplier.toFixed(2)}x</div>
            </div>
          </div>
          <div className="mt-3">
            <div className="h-2 overflow-hidden rounded-full" style={{ background: "rgba(255,255,255,0.06)" }}>
              <div
                className="h-full rounded-full"
                style={{
                  width: `${Math.max(2, xpPct)}%`,
                  background: "linear-gradient(90deg, var(--app-gold), var(--app-gold-light))",
                }}
              />
            </div>
            <div className="mt-1.5 flex justify-between text-[11px] text-app-text-muted">
              <span className="font-mono" style={NUM_FEAT}>{nf(xpCurrent)} XP</span>
              <span className="font-medium">
                {atCap
                  ? (tr ? "Sezon tavanı" : "Season cap")
                  : `${nf(Math.max(0, xpTotal - xpCurrent))} XP → Lv.${seasonLevel + 1}`}
              </span>
            </div>
          </div>
        </UnitCard>

        {/* Account level — permanent ladder, links to the journey */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.12, ease: "easeOut" }}
        >
          <Surface as={Link} href="/app/rewards/journey" variant="value" accent="gold" glow interactive radius="lg" className="flex items-center gap-3 px-4 py-3.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl" style={{ background: "var(--app-gold-glow)" }}>
              <Medal size={16} strokeWidth={2.2} style={{ color: "var(--app-gold)" }} />
            </div>
            <div className="min-w-0 flex-1">
              <div className={TXT_CARD_TITLE}>{tr ? "Hesap seviyesi" : "Account level"}</div>
              <div className="mt-0.5 text-[12px] leading-snug text-app-text-muted">
                {tr ? "Kalıcı yolculuk — sezonla sıfırlanmaz" : "Permanent ladder — survives seasons"}
              </div>
            </div>
            <span className="shrink-0 font-mono text-[16px] font-bold" style={{ color: "var(--app-gold)", ...NUM_FEAT }}>
              Lv.{accountLevel}
            </span>
            <ArrowRight size={15} className="shrink-0" style={{ color: "var(--app-gold-dim)" }} />
          </Surface>
        </motion.div>

        {/* On-chain claim — renders only when the claim-proof API returns an allocation */}
        <ClaimButton />

        {/* Staking — placeholder; ships in a later phase */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.16, ease: "easeOut" }}
        >
          <Surface variant="elevated" radius="lg" className="px-4 py-4" aria-disabled>
          <div className="flex items-center gap-3">
            <div
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
              style={{ background: "rgba(148,163,184,0.10)", color: "var(--app-text-muted)" }}
            >
              <Landmark size={16} strokeWidth={2} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className={TXT_CARD_TITLE} style={{ color: "var(--app-text-secondary)" }}>
                  Staking
                </span>
                <span
                  className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[9.5px] font-semibold uppercase tracking-[0.08em]"
                  style={{ background: "rgba(201,168,76,0.10)", color: "var(--app-gold-light)", border: "1px solid var(--app-gold-border)" }}
                >
                  <Lock size={9} strokeWidth={2.5} />
                  {tr ? "Yakında" : "Coming soon"}
                </span>
              </div>
              <div className="mt-0.5 text-[12px] leading-snug text-app-text-muted">
                {tr
                  ? "Token stake etme bu ekranda açılacak."
                  : "Token staking will open on this screen."}
              </div>
            </div>
          </div>
          </Surface>
        </motion.div>
      </div>
    </AppShell>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Unit card shell — shared frame for balance cards
// ────────────────────────────────────────────────────────────────────────────

function UnitCard({
  icon,
  label,
  delay = 0,
  gold = false,
  children,
}: {
  icon: ReactNode;
  label: string;
  delay?: number;
  /** Value surface (gold) — used for the points/money card. */
  gold?: boolean;
  children: ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: "easeOut" }}
    >
      <Surface
        variant={gold ? "value" : "elevated"}
        accent={gold ? "gold" : "none"}
        glow={gold}
        radius="lg"
        className="px-4 py-4 sm:px-5"
      >
        <div className="flex items-center gap-2">
          <span
            className="flex h-6 w-6 items-center justify-center rounded-lg"
            style={{
              background: "linear-gradient(160deg, rgba(232,201,122,0.20), rgba(201,168,76,0.05))",
              border: "1px solid var(--app-gold-border)",
              color: "var(--app-gold-light)",
            }}
          >
            {icon}
          </span>
          <span className={TXT_MINI_CAPS}>{label}</span>
        </div>
        <div className="mt-3">{children}</div>
      </Surface>
    </motion.div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Points (bINT) card
// ────────────────────────────────────────────────────────────────────────────

function PointsCard({
  summary,
  tr,
  nf,
}: {
  summary: WalletSummaryData | null;
  tr: boolean;
  nf: (n: number) => string;
}) {
  const total = summary?.points.total ?? 0;
  const alphaEarnings = summary?.alphaEarnings ?? 0;
  const display = useCountUp(total);
  return (
    <UnitCard icon={<Star size={13} strokeWidth={2.2} />} label={tr ? "Puan" : "Points"} delay={0.04} gold>
      <div
        className="font-mono font-bold leading-none tracking-[-0.03em] text-app-text-primary"
        style={{ fontSize: "clamp(26px, 6vw, 34px)", ...NUM_FEAT }}
      >
        {nf(Math.round(display))}
      </div>
      {summary && total > 0 && (
        <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-app-text-secondary">
          <span className="inline-flex items-center gap-1.5">
            <Receipt size={12} strokeWidth={2} className="text-app-text-muted" />
            <span>
              {tr ? "Fişlerden" : "From receipts"}{" "}
              <span className="font-mono font-semibold text-app-text-primary" style={NUM_FEAT}>
                {nf(summary.points.fromReceipts)}
              </span>
            </span>
          </span>
          <span className="text-app-text-muted">·</span>
          <span className="inline-flex items-center gap-1.5">
            <Sparkles size={12} strokeWidth={2} className="text-app-text-muted" />
            <span>
              {tr ? "Görevlerden" : "From quests"}{" "}
              <span className="font-mono font-semibold text-app-text-primary" style={NUM_FEAT}>
                {nf(summary.points.fromQuests)}
              </span>
            </span>
          </span>
        </div>
      )}
      {summary && total === 0 && (
        <div className="mt-2 text-[12px] leading-snug text-app-text-muted">
          {tr
            ? "Fiş taradıkça puanların burada birikir."
            : "Points collect here as you scan receipts."}
        </div>
      )}
      {summary && alphaEarnings > 0 && (
        <div
          className="mt-3 flex items-center justify-between gap-2 rounded-lg border px-2.5 py-2 text-[12px]"
          style={{ borderColor: "var(--app-border)", background: "rgba(255,255,255,0.02)" }}
        >
          <span className="inline-flex items-center gap-1.5 text-app-text-secondary">
            <Archive size={12} strokeWidth={2} className="text-app-text-muted" />
            {tr ? "Alpha sezonu kazancı" : "Alpha season earnings"}
          </span>
          <span className="font-mono font-semibold text-app-text-primary" style={NUM_FEAT}>
            {nf(alphaEarnings)}
          </span>
        </div>
      )}
    </UnitCard>
  );
}
