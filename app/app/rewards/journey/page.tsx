"use client";

/**
 * Kilit Yolculuğu — the permanent account-ladder screen (karar 2026-07-02).
 * Vertical unlock ladder 1→50 driven by config/account-unlocks.ts. Season-ladder
 * rewards live on the rewards page; this screen is only the persistent ladder.
 */

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { AppShell } from "@/components/app/app-shell";
import { ArrowLeft, Lock, LockOpen, Sparkles, Hourglass } from "lucide-react";
import { useAppLocale } from "@/lib/i18n/app-context";
import { useAppProfile } from "@/lib/app/profile-context";
import {
  ACCOUNT_LEVEL_XP_THRESHOLDS,
  ACCOUNT_LEVEL_MAX,
} from "@/config/account-level-config";
import { ACCOUNT_UNLOCKS, type AccountUnlock } from "@/config/account-unlocks";
import { pickLabel } from "@/config/season-content";

const GOLD = "var(--app-gold, #F5A623)";

function xpForLevel(level: number): number {
  return ACCOUNT_LEVEL_XP_THRESHOLDS[level - 1] ?? 0;
}

export default function UnlockJourneyPage() {
  const { locale, t } = useAppLocale();
  const { profile } = useAppProfile();
  const reduced = useReducedMotion();
  const fmt = (n: number) => n.toLocaleString(locale);

  const accountLevel = profile?.accountLevel ?? 1;
  const accountXp = profile?.accountXp ?? 0;
  const lo = xpForLevel(accountLevel);
  const hi = accountLevel < ACCOUNT_LEVEL_MAX ? xpForLevel(accountLevel + 1) : lo;
  const pct = hi > lo ? Math.min(100, ((accountXp - lo) / (hi - lo)) * 100) : 100;

  const titleTable = Object.fromEntries(ACCOUNT_UNLOCKS.map((u) => [u.key, u.title]));
  const descTable = Object.fromEntries(ACCOUNT_UNLOCKS.map((u) => [u.key, u.description]));
  const nextUnlock = ACCOUNT_UNLOCKS.find((u) => u.level > accountLevel);

  const nodeState = (u: AccountUnlock): "open" | "next" | "locked" =>
    u.level <= accountLevel ? "open" : u.key === nextUnlock?.key ? "next" : "locked";

  return (
    <AppShell>
      <div className="mx-auto max-w-2xl space-y-5 pb-10">
        {/* header */}
        <div className="flex items-center gap-2 pt-1">
          <Link
            href="/app/rewards"
            className="flex h-8 w-8 items-center justify-center rounded-lg border transition-opacity hover:opacity-75"
            style={{ borderColor: "var(--app-border)" }}
            aria-label={t("journeyPage.back")}
          >
            <ArrowLeft className="h-4 w-4" style={{ color: "var(--app-text-muted)" }} />
          </Link>
          <h1 className="text-xl font-bold">{t("journeyPage.title")}</h1>
        </div>

        {/* hero — current account level, gold value language */}
        <motion.div
          initial={reduced ? false : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="relative overflow-hidden border px-5 py-5"
          style={{
            borderColor: "rgba(245,166,35,0.28)",
            borderRadius: "var(--app-radius-lg, 14px)",
            background: "linear-gradient(160deg, var(--app-bg-elevated, #181E2D), var(--app-bg-surface, #0F1117))",
            boxShadow: "var(--app-shadow-card, 0 12px 40px rgba(0,0,0,0.35))",
          }}
        >
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 h-px"
            style={{ background: "linear-gradient(90deg, transparent, rgba(245,166,35,0.5), transparent)" }}
          />
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider" style={{ color: "var(--app-text-muted)" }}>
                {t("journeyPage.accountLevel")}
              </p>
              <p className="mt-0.5 font-mono text-4xl font-black tabular-nums leading-none">
                <span style={{ color: GOLD }}>{accountLevel}</span>
                <span className="text-base font-bold" style={{ color: "var(--app-text-muted)" }}> / {ACCOUNT_LEVEL_MAX}</span>
              </p>
            </div>
            {nextUnlock && (
              <div className="text-right">
                <p className="text-xs" style={{ color: "var(--app-text-muted)" }}>
                  {t("journeyPage.nextUnlockAt", { level: nextUnlock.level })}
                </p>
                <p className="mt-0.5 text-sm font-semibold">{pickLabel(titleTable, nextUnlock.key, locale)}</p>
              </div>
            )}
          </div>
          {accountLevel < ACCOUNT_LEVEL_MAX && (
            <div className="mt-4 space-y-1.5">
              <div className="h-2 w-full overflow-hidden rounded-full" style={{ background: "rgba(255,255,255,0.07)" }}>
                <motion.div
                  className="h-full rounded-full"
                  initial={reduced ? false : { width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                  style={{ background: `linear-gradient(90deg, ${GOLD}, #B45309)` }}
                />
              </div>
              <div className="flex justify-between text-xs tabular-nums" style={{ color: "var(--app-text-muted)" }}>
                <span>{fmt(accountXp - lo)} XP</span>
                <span>{fmt(hi - accountXp)} XP → Lv.{accountLevel + 1}</span>
              </div>
            </div>
          )}
        </motion.div>

        {/* ladder */}
        <div className="relative pl-5">
          {/* spine */}
          <div
            aria-hidden
            className="absolute bottom-3 left-[9px] top-3 w-px"
            style={{ background: "linear-gradient(180deg, rgba(245,166,35,0.55), rgba(245,166,35,0.12) 60%, transparent)" }}
          />
          <div className="space-y-2.5">
            {ACCOUNT_UNLOCKS.map((u, i) => {
              const state = nodeState(u);
              const isOpen = state === "open";
              const isNext = state === "next";
              return (
                <motion.div
                  key={u.key}
                  initial={reduced ? false : { opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: reduced ? 0 : Math.min(i * 0.04, 0.6) }}
                  className="relative"
                >
                  {/* node dot on the spine */}
                  <span
                    aria-hidden
                    className="absolute -left-5 top-5 flex h-[18px] w-[18px] items-center justify-center rounded-full border"
                    style={{
                      transform: "translateX(-50%)",
                      left: "-11px",
                      borderColor: isOpen ? "rgba(245,166,35,0.7)" : isNext ? "rgba(245,166,35,0.45)" : "var(--app-border)",
                      background: isOpen
                        ? `radial-gradient(circle, ${GOLD} 0%, #B45309 100%)`
                        : "var(--app-bg-surface, #0F1117)",
                      boxShadow: isOpen ? "0 0 12px rgba(245,166,35,0.45)" : isNext ? "0 0 10px rgba(245,166,35,0.2)" : "none",
                    }}
                  />
                  <div
                    className="ml-3 border px-4 py-3.5"
                    style={{
                      borderColor: isNext
                        ? "rgba(245,166,35,0.4)"
                        : isOpen
                          ? "rgba(245,166,35,0.18)"
                          : "var(--app-border)",
                      borderRadius: "var(--app-radius-md, 10px)",
                      background: isNext
                        ? "linear-gradient(160deg, rgba(245,166,35,0.09), var(--app-bg-surface, #0F1117))"
                        : "linear-gradient(160deg, var(--app-bg-elevated, #161B29), var(--app-bg-surface, #0F1117))",
                      opacity: state === "locked" ? 0.62 : 1,
                    }}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className="font-mono text-[11px] font-bold tabular-nums"
                            style={{ color: isOpen || isNext ? GOLD : "var(--app-text-muted)" }}
                          >
                            Lv.{u.level}
                          </span>
                          {u.reveal && <Sparkles className="h-3 w-3" style={{ color: GOLD }} aria-hidden />}
                          {u.phase === 2 && (
                            <span
                              className="rounded-full border px-1.5 py-px text-[10px] font-semibold"
                              style={{ borderColor: "var(--app-border)", color: "var(--app-text-muted)" }}
                            >
                              <Hourglass className="mr-0.5 inline h-2.5 w-2.5" aria-hidden />
                              {t("journeyPage.comingSoon")}
                            </span>
                          )}
                        </div>
                        <p className="mt-1 text-sm font-semibold leading-snug">
                          {pickLabel(titleTable, u.key, locale)}
                        </p>
                        <p className="mt-0.5 text-xs leading-relaxed" style={{ color: "var(--app-text-muted)" }}>
                          {pickLabel(descTable, u.key, locale)}
                        </p>
                      </div>
                      <div className="mt-0.5 flex-shrink-0">
                        {isOpen ? (
                          <LockOpen className="h-4 w-4" style={{ color: GOLD }} aria-label={t("journeyPage.unlocked")} />
                        ) : (
                          <Lock className="h-4 w-4" style={{ color: "var(--app-text-muted)" }} aria-label={t("journeyPage.locked")} />
                        )}
                      </div>
                    </div>
                    {isNext && (
                      <p className="mt-2 text-xs font-semibold tabular-nums" style={{ color: GOLD }}>
                        {t("journeyPage.xpToUnlock", { xp: fmt(Math.max(0, xpForLevel(u.level) - accountXp)) })}
                      </p>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
