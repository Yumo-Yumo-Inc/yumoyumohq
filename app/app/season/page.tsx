"use client";

/**
 * Sezon — the single season hub (karar 2026-07-09). Everything season-related
 * lives here: progress, battle pass (per-level cosmetic track), tier rewards, and
 * the season leaderboard, split across segmented tabs.
 *
 * Design: no boxed cards for sections — the identity/progress header is separated
 * by whitespace + a hairline + typography, not a bordered surface (karar
 * 2026-07-09 "kutu yasağı"). Distinct from the account journey (/app/rewards/journey,
 * the permanent 1→50 unlock ladder).
 */

import { useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { AppShell } from "@/components/app/app-shell";
import { SeasonPassTrack } from "@/components/app/season/season-pass-track";
import { SeasonRewardSheet } from "@/components/app/season/season-reward-sheet";
import { SeasonRecapPanel } from "@/components/app/season/season-recap-panel";
import { SeasonXray } from "@/components/app/season/season-xray";
import { AlphaPeriodLeaderboard } from "@/components/rewards/alpha-period-leaderboard";
import { useAppLocale } from "@/lib/i18n/app-context";
import { useAppProfile } from "@/lib/app/profile-context";
import { useSeasonStatus } from "@/components/app/account/hooks";
import { getSeasonConfig } from "@/config/seasons";
import { SEASON_TIER_LABELS, pickLabel } from "@/config/season-content";
import {
  buildSeasonPassNodes,
  getSeasonPassZones,
  SEASON_PASS_MAX_LEVEL,
  type SeasonPassNode,
} from "@/config/season-pass";
import { buildSeasonCosmetics, getSeasonCosmetic } from "@/config/season-cosmetics";
import {
  SEASON_LEVEL_XP_THRESHOLDS,
  getSeasonLevelMultiplier,
} from "@/config/season-level-config";

const HEAT: Record<string, string> = {
  spark: "#4FB4FF",
  ember: "#FF9D47",
  flame: "#FF5D3B",
  forge: "#FFD66B",
};

type TabKey = "pass" | "rewards" | "leaderboard";

export default function SeasonHubPage() {
  const { locale } = useAppLocale();
  const { profile } = useAppProfile();
  const { data, loading } = useSeasonStatus();
  const reduced = useReducedMotion();
  const [tab, setTab] = useState<TabKey>("pass");
  const [selected, setSelected] = useState<SeasonPassNode | null>(null);
  const l = (tr: string, en: string) => (locale === "tr" ? tr : en);
  const fmt = (n: number) => n.toLocaleString(locale);

  // Dev-only preview (?passPreview=1) — view the hub before an active season exists.
  const isPreview =
    process.env.NODE_ENV !== "production" &&
    typeof window !== "undefined" &&
    window.location.search.includes("passPreview");

  const active = isPreview
    ? { seasonNumber: 2, name: "Genesis", key: "genesis", startAt: "", endAt: "", daysLeft: 18 }
    : (data?.active ?? null);
  const config = active ? getSeasonConfig(active.seasonNumber) : null;
  const seasonLevel = isPreview ? 7 : (data?.progress.seasonLevel ?? 1);
  const seasonXp = isPreview ? 1520 : (data?.progress.seasonXp ?? 0);

  const nodes = config ? buildSeasonPassNodes(config) : [];
  const zones = config ? getSeasonPassZones(config) : [];
  const cosmeticLabels: Record<string, string> = config
    ? Object.fromEntries(
        buildSeasonCosmetics(config).map((c) => [c.key, locale === "tr" ? c.label.tr : c.label.en]),
      )
    : {};

  const lo = SEASON_LEVEL_XP_THRESHOLDS[seasonLevel - 1] ?? 0;
  const hi = SEASON_LEVEL_XP_THRESHOLDS[seasonLevel] ?? lo;
  const pct = hi > lo ? Math.min(100, ((seasonXp - lo) / (hi - lo)) * 100) : 100;
  const isMaxLevel = seasonLevel >= SEASON_PASS_MAX_LEVEL;
  const multiplier = getSeasonLevelMultiplier(seasonLevel);
  // Highest tier zone the current season level sits in (for the recap card).
  const currentTierKey = [...zones].reverse().find((z) => seasonLevel >= z.startLevel)?.key ?? zones[0]?.key ?? "spark";

  const tabs: { key: TabKey; label: string }[] = [
    { key: "pass", label: l("Battle Pass", "Battle Pass") },
    { key: "rewards", label: l("Ödüller", "Rewards") },
    { key: "leaderboard", label: l("Sıralama", "Leaderboard") },
  ];

  return (
    <AppShell>
      <div className="mx-auto max-w-3xl pb-16">
        {/* ── identity + progress header (no box: whitespace + hairline) ── */}
        {!active && !loading ? (
          <p className="py-16 text-center text-sm" style={{ color: "var(--app-text-muted)" }}>
            {l("Şu an aktif bir sezon yok.", "No season is active right now.")}
          </p>
        ) : active ? (
          <motion.header
            initial={reduced ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="relative pt-2"
          >
            <div
              aria-hidden
              className="pointer-events-none absolute -top-6 right-0 h-40 w-64"
              style={{
                background: "radial-gradient(300px 160px at 80% 0%, rgba(255,157,71,0.16), transparent 65%)",
              }}
            />
            <span
              className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em]"
              style={{ color: HEAT.ember }}
            >
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: HEAT.ember, boxShadow: `0 0 10px ${HEAT.ember}` }} />
              {l("Aktif Sezon", "Active Season")} · {active.daysLeft} {l("gün kaldı", "days left")}
            </span>

            <div className="mt-2 flex items-end justify-between gap-4">
              <h1 className="text-4xl font-black leading-none tracking-tight sm:text-5xl">{active.name}</h1>
              <div className="text-right">
                <div className="font-mono text-4xl font-black leading-none tabular-nums" style={{ color: HEAT.forge }}>
                  {String(seasonLevel).padStart(2, "0")}
                  <span className="text-base font-bold" style={{ color: "var(--app-text-muted)" }}> / {SEASON_PASS_MAX_LEVEL}</span>
                </div>
                <div className="mt-1 text-[11px] uppercase tracking-wide" style={{ color: "var(--app-text-muted)" }}>
                  {l("Sezon Seviyesi", "Season Level")}
                </div>
              </div>
            </div>

            {/* xp bar */}
            <div className="mt-4 h-2 w-full overflow-hidden rounded-full" style={{ background: "rgba(255,255,255,0.06)" }}>
              <motion.div
                className="h-full rounded-full"
                initial={reduced ? false : { width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                style={{ background: `linear-gradient(90deg, ${HEAT.ember}, ${HEAT.forge})`, boxShadow: "0 0 14px rgba(255,157,71,0.45)" }}
              />
            </div>
            <div className="mt-1.5 flex justify-between font-mono text-xs tabular-nums" style={{ color: "var(--app-text-muted)" }}>
              <span>{fmt(seasonXp)} XP</span>
              <span>
                {isMaxLevel ? l("En üst seviye", "Top level") : `${fmt(hi)} XP · ${l("çarpan", "mult.")} ×${multiplier.toFixed(2)}`}
              </span>
            </div>

            {/* hairline under the header — the only divider, no boxes */}
            <div className="mt-6 h-px w-full" style={{ background: "var(--app-border)" }} />
          </motion.header>
        ) : null}

        {active && config && (
          <>
            {/* ── segmented tabs ── */}
            <div className="sticky top-0 z-10 -mx-1 mt-4 flex gap-1 px-1 py-2 backdrop-blur-md">
              {tabs.map((t) => {
                const activeTab = tab === t.key;
                return (
                  <button
                    key={t.key}
                    type="button"
                    onClick={() => setTab(t.key)}
                    className="relative flex-1 rounded-full px-3 py-2 text-[13px] font-semibold transition-colors"
                    style={{ color: activeTab ? "var(--app-text-primary)" : "var(--app-text-muted)" }}
                  >
                    {activeTab && (
                      <motion.span
                        layoutId="season-tab-pill"
                        className="absolute inset-0 rounded-full"
                        style={{ background: "var(--app-bg-elevated, #181e2d)", border: "1px solid var(--app-border-strong, rgba(255,255,255,0.14))" }}
                        transition={{ type: "spring", stiffness: 400, damping: 32 }}
                      />
                    )}
                    <span className="relative">{t.label}</span>
                  </button>
                );
              })}
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={tab}
                initial={reduced ? false : { opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduced ? undefined : { opacity: 0, y: -6 }}
                transition={{ duration: 0.22 }}
                className="mt-4"
              >
                {tab === "pass" && (
                  <section>
                    {/* tier zone legend — inline text, not boxed rows */}
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs" style={{ color: "var(--app-text-muted)" }}>
                      {zones.map((z, idx) => {
                        const nextStart = zones[idx + 1]?.startLevel;
                        const range = nextStart ? `${z.startLevel}–${nextStart - 1}` : `${z.startLevel}–${SEASON_PASS_MAX_LEVEL}`;
                        const activeZone = seasonLevel >= z.startLevel && (!nextStart || seasonLevel < nextStart);
                        return (
                          <span key={z.key} className="inline-flex items-center gap-1.5">
                            <span className="h-2 w-2 rounded-full" style={{ background: HEAT[z.key] ?? HEAT.ember }} />
                            <b style={{ color: activeZone ? "var(--app-text-primary)" : "var(--app-text-secondary)" }}>
                              {pickLabel(SEASON_TIER_LABELS, z.key, locale)}
                            </b>
                            <span className="font-mono">L{range}</span>
                          </span>
                        );
                      })}
                    </div>

                    <h2 className="mb-1 mt-5 text-[15px] font-bold">{l("Potanı Isıt", "Heat Your Crucible")}</h2>
                    <SeasonPassTrack nodes={nodes} seasonLevel={seasonLevel} cosmeticLabels={cosmeticLabels} onSelect={setSelected} />

                    <p className="mt-4 text-[13px] leading-relaxed" style={{ color: "var(--app-text-muted)" }}>
                      {l(
                        "Her seviye farklı bir ödül açar — kozmetik, yetenek, mühür. Kademe puanları sezon kapanışında hesabına geçer.",
                        "Every level unlocks a different reward — cosmetics, capabilities, seals. Tier points are credited at season close.",
                      )}
                    </p>
                  </section>
                )}

                {tab === "rewards" && (
                  <section>
                    <SeasonRecapPanel
                      seasonName={active.name}
                      tierKey={currentTierKey}
                      tierLabel={pickLabel(SEASON_TIER_LABELS, currentTierKey, locale)}
                      seasonLevel={seasonLevel}
                      maxLevel={SEASON_PASS_MAX_LEVEL}
                    />
                    <p className="text-[13px] leading-relaxed" style={{ color: "var(--app-text-muted)" }}>
                      {l(
                        "Ulaştığın en yüksek kademenin puanı sezon kapanışında hesabına geçer.",
                        "The points for the highest tier you reach are credited at season close.",
                      )}
                    </p>
                    <ul className="mt-4">
                      {zones.map((z) => {
                        const reached = seasonLevel >= z.startLevel;
                        return (
                          <li
                            key={z.key}
                            className="flex items-center gap-3 border-t py-4 first:border-t-0"
                            style={{ borderColor: "var(--app-border)" }}
                          >
                            <span
                              className="h-9 w-1 rounded-full"
                              style={{ background: HEAT[z.key] ?? HEAT.ember, opacity: reached ? 1 : 0.4 }}
                            />
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <b className="text-[15px]">{pickLabel(SEASON_TIER_LABELS, z.key, locale)}</b>
                                {reached && (
                                  <span className="text-[11px] font-bold" style={{ color: HEAT.forge }}>
                                    ✓ {l("ulaşıldı", "reached")}
                                  </span>
                                )}
                              </div>
                              <div className="font-mono text-xs tabular-nums" style={{ color: "var(--app-text-muted)" }}>
                                {l("Seviye", "Level")} {z.startLevel}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-mono text-[15px] font-bold tabular-nums" style={{ color: "var(--app-text-primary)" }}>
                                {fmt(z.cpoints)}
                              </div>
                              <div className="text-[11px] uppercase tracking-wide" style={{ color: "var(--app-text-muted)" }}>
                                {l("puan", "points")}
                              </div>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                    <SeasonXray />
                  </section>
                )}

                {tab === "leaderboard" && (
                  <section>
                    <AlphaPeriodLeaderboard viewerUsername={profile?.username} />
                  </section>
                )}
              </motion.div>
            </AnimatePresence>
          </>
        )}
      </div>

      {selected && (
        <SeasonRewardSheet
          node={selected}
          cosmetic={selected.cosmeticKey ? getSeasonCosmetic(selected.cosmeticKey) : null}
          seasonLevel={seasonLevel}
          onClose={() => setSelected(null)}
        />
      )}
    </AppShell>
  );
}
