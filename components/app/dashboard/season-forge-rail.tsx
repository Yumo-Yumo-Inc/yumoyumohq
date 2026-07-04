"use client";

/**
 * Season Forge Rail — the dashboard's bespoke season-progress hero.
 *
 * NOT a copy of the account page's quest cards. The fire tier ladder
 * (Spark → Ember → Flame → Forge) is rendered as a single horizontal *heat rail*:
 * four tier nodes sit along a track, the user's season XP heats the rail up to a
 * glowing flame marker, and one action ("Scan → earn XP") ties the season to the
 * core receipt loop. Compact by design — the fuller season view lives at
 * /app/account. Purely presentational; all data comes from /api/season/status.
 *
 * Honesty rules (CLAUDE.md): backend null → calm pre-season teaser or nothing,
 * never fabricated XP. Anti-abuse/eligibility params never surface here.
 */

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { Camera, ChevronRight, Flame } from "lucide-react";
import { useSeasonStatus } from "@/components/app/account/hooks";
import { getSeasonConfig } from "@/config/seasons";
import { SEASON_TIER_LABELS, pickLabel } from "@/config/season-content";
import type { YumoLocale } from "@/lib/product-architecture/dashboard-contract";

/* ---- copy ------------------------------------------------------------- */

function byLocale(
  locale: YumoLocale,
  tr: string,
  en: string,
  ru: string,
  th: string,
  es: string,
  zh: string,
): string {
  if (locale === "tr") return tr;
  if (locale === "ru") return ru;
  if (locale === "th") return th;
  if (locale === "es") return es;
  if (locale === "zh") return zh;
  return en;
}

function intlTag(locale: YumoLocale): string {
  switch (locale) {
    case "tr": return "tr-TR";
    case "ru": return "ru-RU";
    case "th": return "th-TH";
    case "es": return "es-ES";
    case "zh": return "zh-CN";
    default:   return "en-US";
  }
}

function fmt(n: number, locale: YumoLocale): string {
  try {
    return new Intl.NumberFormat(intlTag(locale), { maximumFractionDigits: 0 }).format(n);
  } catch {
    return String(Math.round(n));
  }
}

/* ---- per-tier heat accents (node color as the rail warms) ------------- */

const TIER_ACCENT: Record<string, string> = {
  spark: "#fbbf24", // amber — first heat
  ember: "#fb923c", // orange
  flame: "#f97316", // deep orange
  forge: "#ffd27a", // white-gold, forged
};

/* ---- rail geometry ---------------------------------------------------- */

type RailNode = { key: string; pos: number; reached: boolean; accent: string };

/**
 * Map season XP onto the rail. Stops = [0, tier1..tierN] XP, evenly spaced along
 * the track so each tier gets equal visual weight; the marker interpolates inside
 * the current segment. Returns marker % and node positions/reached flags.
 */
function computeHeat(
  seasonXp: number,
  tiers: Array<{ key: string; minSeasonXp: number }>,
): { markerPct: number; nodes: RailNode[] } {
  const stopsXp = [0, ...tiers.map((t) => t.minSeasonXp)];
  const stopCount = stopsXp.length;
  const posOf = (i: number) => (stopCount > 1 ? (i / (stopCount - 1)) * 100 : 0);

  let markerPct = 100;
  for (let i = 0; i < stopsXp.length - 1; i++) {
    const lo = stopsXp[i];
    const hi = stopsXp[i + 1];
    if (seasonXp <= hi) {
      const f = hi > lo ? (seasonXp - lo) / (hi - lo) : 0;
      markerPct = posOf(i) + f * (posOf(i + 1) - posOf(i));
      break;
    }
  }
  if (seasonXp >= stopsXp[stopsXp.length - 1]) markerPct = 100;

  const nodes: RailNode[] = tiers.map((t, i) => ({
    key: t.key,
    pos: posOf(i + 1),
    reached: seasonXp >= t.minSeasonXp,
    accent: TIER_ACCENT[t.key] ?? "#fb923c",
  }));

  return { markerPct: Math.max(0, Math.min(100, markerPct)), nodes };
}

/* ---- shared surface --------------------------------------------------- */

function surfaceStyle(): React.CSSProperties {
  return {
    backgroundImage:
      "linear-gradient(150deg, var(--app-bg-elevated), var(--app-bg-surface))",
    borderColor: "var(--app-border)",
    boxShadow: "var(--app-shadow-card)",
  };
}

/* ---- the rail track --------------------------------------------------- */

function HeatTrack({
  markerPct,
  nodes,
  locale,
  dim = false,
}: {
  markerPct: number;
  nodes: RailNode[];
  locale: YumoLocale;
  dim?: boolean;
}) {
  const reduce = useReducedMotion();
  const fillPct = dim ? 0 : markerPct;

  return (
    <div className="px-1.5">
      {/* track */}
      <div className="relative h-2.5">
        <div
          className="absolute inset-0 rounded-full"
          style={{ background: "color-mix(in srgb, var(--app-text-muted) 16%, transparent)" }}
        />
        {/* heat fill */}
        <motion.div
          className="absolute inset-y-0 left-0 rounded-full"
          style={{
            backgroundImage:
              "linear-gradient(90deg, #f59e0b 0%, #fb7a1a 55%, #ffd27a 100%)",
            boxShadow: dim ? "none" : "0 0 12px 1px rgba(255,150,40,0.45)",
          }}
          initial={reduce ? false : { width: 0 }}
          animate={{ width: `${fillPct}%` }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        />
        {/* nodes */}
        {nodes.map((n, i) => (
          <div
            key={n.key}
            className="absolute top-1/2"
            style={{ left: `${n.pos}%`, transform: "translate(-50%, -50%)" }}
          >
            <motion.span
              className="grid place-items-center rounded-full"
              style={{
                height: 16,
                width: 16,
                background: n.reached && !dim ? n.accent : "var(--app-bg-elevated)",
                border: `2px solid ${n.reached && !dim ? n.accent : "color-mix(in srgb, var(--app-text-muted) 40%, transparent)"}`,
                boxShadow: n.reached && !dim ? `0 0 10px 0 ${n.accent}aa` : "none",
              }}
              initial={reduce ? false : { scale: 0.4, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: reduce ? 0 : 0.25 + i * 0.08, type: "spring", stiffness: 420, damping: 24 }}
            >
              {n.reached && !dim && (
                <span className="h-1.5 w-1.5 rounded-full bg-white/90" />
              )}
            </motion.span>
          </div>
        ))}
        {/* flame marker */}
        {!dim && (
          <motion.div
            className="absolute top-1/2 z-10"
            style={{ transform: "translate(-50%, -50%)" }}
            initial={reduce ? { left: `${markerPct}%` } : { left: 0 }}
            animate={{ left: `${markerPct}%` }}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          >
            <span className="relative grid place-items-center">
              {!reduce && (
                <motion.span
                  className="absolute rounded-full"
                  style={{ height: 26, width: 26, background: "radial-gradient(circle, rgba(255,170,60,0.55), transparent 70%)" }}
                  animate={{ scale: [1, 1.35, 1], opacity: [0.65, 0.25, 0.65] }}
                  transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
                />
              )}
              <span
                className="relative grid h-5 w-5 place-items-center rounded-full"
                style={{
                  backgroundImage: "linear-gradient(160deg, #ffd27a, #ff8a1a)",
                  boxShadow: "0 0 12px 2px rgba(255,150,40,0.6)",
                }}
              >
                <Flame className="h-3 w-3 text-[#3a1a00]" strokeWidth={2.6} fill="#3a1a00" />
              </span>
            </span>
          </motion.div>
        )}
      </div>

      {/* node labels */}
      <div className="relative mt-2 h-3">
        {nodes.map((n) => (
          <span
            key={n.key}
            className="absolute text-[9.5px] font-bold uppercase tracking-[0.08em]"
            style={{
              left: `${n.pos}%`,
              transform: "translateX(-50%)",
              color: n.reached && !dim ? "var(--app-text-secondary)" : "var(--app-text-muted)",
              whiteSpace: "nowrap",
            }}
          >
            {pickLabel(SEASON_TIER_LABELS, n.key, locale)}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ---- main ------------------------------------------------------------- */

export function SeasonForgeRail({ locale }: { locale: YumoLocale }) {
  const live = useSeasonStatus();
  // TEMP preview toggle (?forgePreview=1) — lets Uğur view the active-season
  // rail before Genesis is live. Remove after sign-off.
  const isPreview = typeof window !== "undefined" && window.location.search.includes("forgePreview");
  const data = isPreview
    ? {
        active: { seasonNumber: 2, name: "Genesis", key: "genesis", startAt: "", endAt: "", daysLeft: 21 },
        progress: { seasonXp: 4200, seasonLevel: 12, currentTier: { index: 2, key: "ember", cpointsReward: 2500 }, nextTier: { index: 3, key: "flame", minSeasonXp: 7000, cpointsReward: 5000 } },
      }
    : live.data;
  const loading = isPreview ? false : live.loading;
  const error = isPreview ? false : live.error;

  if (loading) {
    return (
      <section
        className="rounded-[24px] border p-4 sm:p-5"
        style={surfaceStyle()}
      >
        <div className="animate-pulse space-y-4">
          <div className="flex items-center justify-between">
            <div className="h-4 w-24 rounded-full bg-[var(--app-text-muted)]/15" />
            <div className="h-4 w-16 rounded-full bg-[var(--app-text-muted)]/12" />
          </div>
          <div className="h-2.5 w-full rounded-full bg-[var(--app-text-muted)]/12" />
          <div className="h-8 w-40 rounded-full bg-[var(--app-text-muted)]/12" />
        </div>
      </section>
    );
  }

  // Backend unreachable → stay out of the way, never fabricate a season.
  if (error) return null;

  const active = data?.active ?? null;
  const config = active ? getSeasonConfig(active.seasonNumber) : getSeasonConfig(2);
  const tiers = config?.tiers ?? [];
  if (tiers.length === 0) return null;

  const seasonName = active?.name ?? config?.name ?? "Genesis";

  /* ---- pre-season teaser (no active season) ---- */
  if (!active) {
    const { nodes } = computeHeat(0, tiers);
    return (
      <section className="relative overflow-hidden rounded-[24px] border p-4 sm:p-5" style={surfaceStyle()}>
        <div className="mb-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span
              className="grid h-7 w-7 place-items-center rounded-xl"
              style={{ backgroundImage: "linear-gradient(160deg, #ffd27a33, #ff8a1a22)", border: "1px solid #ff8a1a44" }}
            >
              <Flame className="h-3.5 w-3.5 text-[#fb923c]" strokeWidth={2.4} />
            </span>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--app-text-muted)]">
                {byLocale(locale, "Sezon", "Season", "Сезон", "ซีซัน", "Temporada", "赛季")}
              </p>
              <p className="text-sm font-black text-[var(--app-text-primary)]">{seasonName}</p>
            </div>
          </div>
          <span className="rounded-full border border-[var(--app-border)] bg-[var(--app-bg-surface3)] px-2.5 py-1 text-[10px] font-bold text-[var(--app-text-secondary)]">
            {byLocale(locale, "Çok yakında", "Coming soon", "Скоро", "เร็ว ๆ นี้", "Muy pronto", "即将开始")}
          </span>
        </div>
        <HeatTrack markerPct={0} nodes={nodes} locale={locale} dim />
        <p className="mt-3 text-[11.5px] font-medium leading-snug text-[var(--app-text-secondary)]">
          {byLocale(
            locale,
            "Fişlerini tarayarak XP topla, kademe atla, sezon ödüllerini aç.",
            "Scan receipts to earn XP, climb the tiers, and unlock season rewards.",
            "Сканируй чеки, копи XP, поднимайся по уровням и открывай награды сезона.",
            "สแกนใบเสร็จเพื่อรับ XP ไต่ระดับ และปลดล็อกรางวัลประจำซีซัน",
            "Escanea recibos para ganar XP, sube de nivel y desbloquea recompensas.",
            "扫描收据赚取 XP，逐级晋升，解锁赛季奖励。",
          )}
        </p>
      </section>
    );
  }

  /* ---- active season ---- */
  const { seasonXp, currentTier, nextTier } = data!.progress;
  const { markerPct, nodes } = computeHeat(seasonXp, tiers);

  const nextLabel = nextTier ? pickLabel(SEASON_TIER_LABELS, nextTier.key, locale) : null;
  const remaining = nextTier ? Math.max(0, nextTier.minSeasonXp - seasonXp) : 0;
  const isMaxed = !nextTier;

  const progressLine = isMaxed
    ? byLocale(
        locale,
        `${fmt(seasonXp, locale)} XP · en yüksek kademe`,
        `${fmt(seasonXp, locale)} XP · top tier reached`,
        `${fmt(seasonXp, locale)} XP · высший уровень`,
        `${fmt(seasonXp, locale)} XP · ระดับสูงสุด`,
        `${fmt(seasonXp, locale)} XP · nivel máximo`,
        `${fmt(seasonXp, locale)} XP · 已达最高等级`,
      )
    : byLocale(
        locale,
        `${fmt(seasonXp, locale)} XP · ${nextLabel}'a ${fmt(remaining, locale)} XP kaldı`,
        `${fmt(seasonXp, locale)} XP · ${fmt(remaining, locale)} XP to ${nextLabel}`,
        `${fmt(seasonXp, locale)} XP · до ${nextLabel} ${fmt(remaining, locale)} XP`,
        `${fmt(seasonXp, locale)} XP · อีก ${fmt(remaining, locale)} XP ถึง ${nextLabel}`,
        `${fmt(seasonXp, locale)} XP · ${fmt(remaining, locale)} XP para ${nextLabel}`,
        `${fmt(seasonXp, locale)} XP · 距 ${nextLabel} 还差 ${fmt(remaining, locale)} XP`,
      );

  const rewardValue = nextTier?.cpointsReward ?? currentTier?.cpointsReward ?? 0;

  return (
    <motion.section
      className="relative overflow-hidden rounded-[24px] border p-4 sm:p-5"
      style={surfaceStyle()}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
    >
      {/* warm top glow */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-20"
        style={{ background: "linear-gradient(180deg, rgba(255,150,40,0.08), transparent)" }}
      />

      {/* header */}
      <div className="relative mb-3.5 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span
            className="grid h-7 w-7 place-items-center rounded-xl"
            style={{ backgroundImage: "linear-gradient(160deg, #ffd27a33, #ff8a1a22)", border: "1px solid #ff8a1a44" }}
          >
            <Flame className="h-3.5 w-3.5 text-[#fb923c]" strokeWidth={2.4} />
          </span>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--app-text-muted)]">
              {byLocale(locale, "Sezon", "Season", "Сезон", "ซีซัน", "Temporada", "赛季")}
            </p>
            <p className="text-sm font-black leading-tight text-[var(--app-text-primary)]">{seasonName}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-full border border-[#ff8a1a44] bg-[#ff8a1a14] px-2.5 py-1 text-[10px] font-bold text-[#fb923c]">
            {byLocale(
              locale,
              `${active.daysLeft} gün kaldı`,
              `${active.daysLeft} days left`,
              `${active.daysLeft} дн.`,
              `เหลือ ${active.daysLeft} วัน`,
              `${active.daysLeft} días`,
              `剩 ${active.daysLeft} 天`,
            )}
          </span>
          <Link
            href="/app/account#season"
            aria-label={byLocale(locale, "Sezon detayı", "Season details", "Детали сезона", "รายละเอียดซีซัน", "Detalles", "详情")}
            className="grid h-7 w-7 place-items-center rounded-full border border-[var(--app-border)] bg-[var(--app-bg-surface3)] text-[var(--app-text-secondary)] transition hover:brightness-110"
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>

      {/* progress line */}
      <p className="relative mb-2.5 text-[12.5px] font-bold text-[var(--app-text-primary)]">
        {progressLine}
      </p>

      {/* the rail */}
      <HeatTrack markerPct={markerPct} nodes={nodes} locale={locale} />

      {/* reward + CTA */}
      <div className="relative mt-4 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[9.5px] font-bold uppercase tracking-[0.16em] text-[var(--app-text-muted)]">
            {isMaxed
              ? byLocale(locale, "Kazanılan ödül", "Reward earned", "Награда", "รางวัลที่ได้", "Recompensa", "已获奖励")
              : byLocale(locale, "Sonraki ödül", "Next reward", "След. награда", "รางวัลถัดไป", "Próxima recompensa", "下个奖励")}
          </p>
          <p className="truncate text-sm font-black" style={{ color: "var(--app-gold-text, #f0b90b)" }}>
            {fmt(rewardValue, locale)} cPoints
          </p>
        </div>
        <Link
          href="/app/mine"
          className="inline-flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2 text-xs font-black text-white transition active:scale-95"
          style={{ backgroundImage: "linear-gradient(160deg, #ff8a1a, #f97316)", boxShadow: "0 6px 16px -6px rgba(249,115,22,0.7)" }}
        >
          <Camera className="h-3.5 w-3.5" strokeWidth={2.4} />
          {byLocale(locale, "Fiş Tara", "Scan receipt", "Скан чека", "สแกนใบเสร็จ", "Escanear", "扫描收据")}
        </Link>
      </div>
    </motion.section>
  );
}
