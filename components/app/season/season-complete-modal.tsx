"use client";

/**
 * SeasonCompleteModal — one-shot celebration after a season closes.
 * First authenticated visit shows: season complete, congratulations, final rank.
 * Seen state is stored in localStorage (keyed by season number), same pattern
 * as unlock reveals. Respects prefers-reduced-motion.
 */

import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { useAppLocale } from "@/lib/i18n/app-context";
import { pickLabel, SEASON_TIER_LABELS } from "@/config/season-content";

export type SeasonCompletePayload = {
  seasonNumber: number;
  name: string;
  key: string | null;
  rank: number;
  seasonXp: number;
  tier: { key: string; index: number; pointsReward: number } | null;
};

const SEEN_KEY = "yumo_season_complete_seen";

export function readSeenSeasonNumbers(): number[] {
  try {
    const raw = JSON.parse(window.localStorage.getItem(SEEN_KEY) ?? "[]");
    return Array.isArray(raw) ? raw.map(Number).filter((n) => Number.isFinite(n) && n > 0) : [];
  } catch {
    return [];
  }
}

export function markSeasonCompleteSeen(seasonNumber: number): void {
  try {
    const seen = readSeenSeasonNumbers();
    if (seen.includes(seasonNumber)) return;
    window.localStorage.setItem(SEEN_KEY, JSON.stringify([...seen, seasonNumber]));
  } catch {
    /* private mode — in-memory dismiss still ends this session */
  }
}

const HEAT = "#FF9D47";
const GOLD = "#FFD66B";

export function SeasonCompleteModal({
  payload,
  onDismiss,
}: {
  payload: SeasonCompletePayload;
  onDismiss: () => void;
}) {
  const { t, locale } = useAppLocale();
  const reduced = useReducedMotion();
  const [stage, setStage] = useState<"enter" | "revealed">(reduced ? "revealed" : "enter");

  useEffect(() => {
    if (reduced) return;
    const timer = window.setTimeout(() => setStage("revealed"), 420);
    return () => window.clearTimeout(timer);
  }, [reduced]);

  useEffect(() => {
    if (reduced || stage !== "revealed") return;
    if (typeof navigator !== "undefined" && typeof navigator.vibrate === "function") {
      navigator.vibrate([0, 25, 35, 55]);
    }
  }, [stage, reduced]);

  const fmt = (n: number) => n.toLocaleString(locale === "tr" ? "tr-TR" : "en-US");
  const tierLabel = payload.tier
    ? pickLabel(SEASON_TIER_LABELS, payload.tier.key, locale)
    : null;

  return (
    <div className="fixed inset-0 z-[88] flex items-center justify-center px-5 py-8">
      <motion.button
        type="button"
        aria-label={t("seasonComplete.dismiss")}
        className="absolute inset-0 bg-black/70 backdrop-blur-md"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.35 }}
        onClick={onDismiss}
      />

      <motion.div
        role="dialog"
        aria-modal="true"
        aria-label={t("seasonComplete.aria")}
        className="relative w-full max-w-[380px] overflow-hidden rounded-[22px] border border-white/10 px-6 pb-6 pt-7 text-center shadow-[0_30px_80px_rgba(0,0,0,0.55)]"
        style={{
          background:
            "radial-gradient(280px 180px at 80% -10%, rgba(255,157,71,0.30), transparent 62%), " +
            "radial-gradient(240px 160px at 10% 110%, rgba(255,214,107,0.16), transparent 58%), " +
            "linear-gradient(165deg, #171B2A, #0A0C12)",
          color: "#F0F0FF",
        }}
        initial={reduced ? false : { opacity: 0, y: 28, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: "spring", stiffness: 280, damping: 22 }}
      >
        {stage === "revealed" && !reduced && (
          <motion.div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.55, 0] }}
            transition={{ duration: 0.9 }}
            style={{
              background:
                "radial-gradient(circle at 50% 35%, rgba(255,214,107,0.35), transparent 55%)",
            }}
          />
        )}

        <div className="relative">
          <div
            className="text-[11px] font-extrabold uppercase tracking-[0.2em]"
            style={{ color: HEAT }}
          >
            {t("seasonComplete.kicker", { name: payload.name })}
          </div>

          <motion.h2
            className="mt-4 font-dm-sans text-[28px] font-extrabold leading-tight tracking-tight"
            initial={reduced ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: reduced ? 0 : 0.15 }}
          >
            {t("seasonComplete.title")}
          </motion.h2>

          <motion.div
            className="mt-5"
            initial={reduced ? false : { opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: reduced ? 0 : 0.28, type: "spring", stiffness: 260, damping: 16 }}
          >
            <div
              className="font-mono text-[64px] font-extrabold leading-none tracking-[-0.04em] tabular-nums"
              style={{
                background: `linear-gradient(180deg, #FFE9B0, ${GOLD} 55%, #C9A84C)`,
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                color: "transparent",
              }}
            >
              #{fmt(payload.rank)}
            </div>
            <p className="mt-2 text-[15px] font-semibold text-white/85">
              {t("seasonComplete.rankLine", { rank: fmt(payload.rank) })}
            </p>
          </motion.div>

          <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
            {payload.seasonXp > 0 ? (
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 font-mono text-[12px] tabular-nums text-white/75">
                {t("seasonComplete.xpLine", { xp: fmt(payload.seasonXp) })}
              </span>
            ) : null}
            {payload.tier && tierLabel ? (
              <span
                className="rounded-full px-3 py-1.5 text-[12px] font-bold"
                style={{
                  border: `1px solid ${HEAT}66`,
                  background: `${HEAT}18`,
                  color: "#F0F0FF",
                }}
              >
                {payload.tier.pointsReward > 0
                  ? t("seasonComplete.rewardLine", {
                      points: fmt(payload.tier.pointsReward),
                      tier: tierLabel,
                    })
                  : tierLabel}
              </span>
            ) : null}
          </div>

          <button
            type="button"
            onClick={onDismiss}
            className="mt-7 w-full rounded-full px-5 py-3.5 text-[14px] font-bold transition-transform active:scale-[0.98]"
            style={{
              background: `linear-gradient(135deg, ${GOLD}, ${HEAT})`,
              color: "#1a1206",
            }}
          >
            {t("seasonComplete.cta")}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
