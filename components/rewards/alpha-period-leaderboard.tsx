"use client";

import { useCallback, useEffect, useMemo, useState, type CSSProperties } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { useCountUp } from "@/lib/hooks/use-count-up";
import { useAppLocale } from "@/lib/i18n/app-context";

/**
 * Rewards standings — a dramatized, non-list leaderboard.
 *   - Genesis: season XP while active; official season_leaderboard snapshot
 *     after close (warm gold).
 *   - Alpha  (frozen): frozen pre-Genesis snapshot — cool ice tint.
 *
 * Composition (not a flat list): a spotlight champion (#1) with a rotating
 * conic ring + radial glow + shimmer, a two-up runner-up pair (#2/#3), a tight
 * chase strip (#4/#5), and a distinct "your position" card with a
 * distance-to-next meter. Critical layout uses inline styles so a stale
 * service-worker CSS cache can never collapse an arbitrary Tailwind class.
 * Raw cPoints never reach the client.
 */

type Tab = "genesis" | "alpha";

type Entry = {
  rank: number;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  country: string | null;
  points: number;
};

type LeaderboardResponse = {
  viewerUsername?: string;
  snapshotAt?: string | null;
  status?: "active" | "closed" | "none";
  leaderboard?: Entry[];
  error?: string;
};

const TOP_N = 5;

const TAB_ENDPOINT: Record<Tab, string> = {
  genesis: "/api/rewards/season-leaderboard?limit=200",
  alpha: "/api/rewards/alpha-leaderboard?limit=200",
};

// Per-tab accent: warm gold for the live season, cool ice for the frozen snapshot.
const THEME: Record<Tab, { main: string; light: string; rgb: string }> = {
  genesis: { main: "#F5A623", light: "#FFD98A", rgb: "245,166,35" },
  alpha: { main: "#93B4CE", light: "#D3E6F5", rgb: "147,180,206" },
};

// Runner-up ring metals.
const METAL: Record<number, { ring: string; rgb: string }> = {
  2: { ring: "#C7CCD1", rgb: "199,204,209" },
  3: { ring: "#CD9B6A", rgb: "205,155,106" },
};

function label(e: Entry): string {
  return e.displayName?.trim() || e.username;
}
function initials(e: Entry): string {
  return label(e).slice(0, 2).toUpperCase();
}

function Avatar({ entry, size, ring, ringWidth = 2 }: { entry: Entry; size: number; ring?: string; ringWidth?: number }) {
  return (
    <span
      className="inline-flex items-center justify-center overflow-hidden rounded-full font-semibold"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.3,
        background: entry.avatarUrl ? undefined : "var(--app-bg-elevated)",
        color: "var(--app-text-secondary)",
        boxShadow: ring ? `0 0 0 ${ringWidth}px ${ring}` : "inset 0 0 0 1px var(--app-border)",
      }}
    >
      {entry.avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={entry.avatarUrl} alt="" className="h-full w-full object-cover" />
      ) : (
        initials(entry)
      )}
    </span>
  );
}

function AnimatedNumber({
  value,
  run,
  locale,
  className,
  style,
}: {
  value: number;
  run: boolean;
  locale: string;
  className?: string;
  style?: CSSProperties;
}) {
  const v = useCountUp(value, { durationMs: 1000, start: run });
  return (
    <span className={className} style={{ fontVariantNumeric: "tabular-nums", ...style }}>
      {Math.round(v).toLocaleString(locale, { maximumFractionDigits: 0 })}
    </span>
  );
}

/* ── Champion (#1) ──────────────────────────────────────────────────────── */
function Champion({
  entry,
  isViewer,
  theme,
  reduce,
  locale,
  leaderLabel,
  pointsLabel,
  youLabel,
}: {
  entry: Entry;
  isViewer: boolean;
  theme: { main: string; light: string; rgb: string };
  reduce: boolean;
  locale: string;
  leaderLabel: string;
  pointsLabel: string;
  youLabel: string;
}) {
  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 18, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 210, damping: 24, delay: 0.05 }}
      className="relative overflow-hidden"
      style={{
        borderRadius: 24,
        padding: "22px 18px 20px",
        background: `linear-gradient(165deg, rgba(${theme.rgb},0.14), rgba(${theme.rgb},0.02) 60%), var(--surface-grad-elevated)`,
        boxShadow: `inset 0 1px 0 rgba(255,255,255,0.10), inset 0 0 0 1px rgba(${theme.rgb},0.22), 0 22px 48px -24px rgba(0,0,0,0.6)`,
      }}
    >
      {/* radial glow puddle behind the avatar */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 -translate-x-1/2"
        style={{
          top: -30,
          width: 240,
          height: 240,
          borderRadius: "9999px",
          background: `radial-gradient(circle, rgba(${theme.rgb},0.35), transparent 62%)`,
          filter: "blur(26px)",
        }}
      />
      {/* shimmer sweep */}
      {!reduce && (
        <motion.div
          aria-hidden
          className="pointer-events-none absolute inset-y-0"
          style={{
            width: "45%",
            background: `linear-gradient(100deg, transparent, rgba(255,255,255,0.14), transparent)`,
          }}
          initial={{ x: "-160%" }}
          animate={{ x: "320%" }}
          transition={{ duration: 1.4, repeat: Infinity, repeatDelay: 3.2, ease: "easeInOut" }}
        />
      )}

      <div className="relative flex flex-col items-center text-center">
        {/* rank chip */}
        <div
          className="mb-3 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1"
          style={{ background: `rgba(${theme.rgb},0.14)`, boxShadow: `inset 0 0 0 1px rgba(${theme.rgb},0.35)` }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill={theme.main} aria-hidden>
            <path d="M5 16l-2-9 5.5 4L12 4l3.5 7L21 7l-2 9H5zm0 2h14v2H5v-2z" />
          </svg>
          <span className="text-[10px] font-bold uppercase tracking-[0.14em]" style={{ color: theme.main }}>
            {leaderLabel}
          </span>
        </div>

        {/* avatar with rotating conic ring */}
        <div className="relative" style={{ width: 104, height: 104 }}>
          <motion.div
            aria-hidden
            className="absolute inset-0 rounded-full"
            style={{
              background: `conic-gradient(from 0deg, ${theme.main}, rgba(${theme.rgb},0.05), ${theme.light}, rgba(${theme.rgb},0.05), ${theme.main})`,
            }}
            animate={reduce ? undefined : { rotate: 360 }}
            transition={reduce ? undefined : { duration: 9, repeat: Infinity, ease: "linear" }}
          />
          <div
            className="absolute rounded-full"
            style={{ inset: 4, background: "var(--app-bg-surface)" }}
          />
          <div className="absolute" style={{ inset: 7 }}>
            <Avatar entry={entry} size={90} />
          </div>
        </div>

        {/* name */}
        <p className="mt-3 flex items-center gap-1.5 text-[19px] font-bold" style={{ color: "var(--app-text-primary)" }}>
          <span className="max-w-[220px] truncate">{label(entry)}</span>
          {isViewer && (
            <span className="text-[10px] font-bold uppercase tracking-[0.14em]" style={{ color: theme.main }}>
              {youLabel}
            </span>
          )}
        </p>

        {/* points */}
        <div className="mt-1 flex items-baseline gap-1.5">
          <AnimatedNumber
            value={entry.points}
            run={!reduce}
            locale={locale}
            className="font-mono text-[42px] font-black leading-none"
            style={{ color: theme.main }}
          />
          <span className="text-[13px] font-medium" style={{ color: "var(--app-text-muted)" }}>
            {pointsLabel}
          </span>
        </div>
      </div>
    </motion.div>
  );
}

/* ── Runner-up (#2 / #3) tile ───────────────────────────────────────────── */
function RunnerTile({
  entry,
  isViewer,
  reduce,
  locale,
  delay,
  pointsLabel,
  youLabel,
}: {
  entry: Entry;
  isViewer: boolean;
  reduce: boolean;
  locale: string;
  delay: number;
  pointsLabel: string;
  youLabel: string;
}) {
  const metal = METAL[entry.rank] ?? METAL[3];
  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 240, damping: 26, delay }}
      className="relative flex flex-1 flex-col items-center overflow-hidden text-center"
      style={{
        borderRadius: 20,
        padding: "16px 10px 14px",
        background: `linear-gradient(165deg, rgba(${metal.rgb},0.10), transparent 70%), var(--surface-grad-elevated)`,
        boxShadow: `inset 0 1px 0 rgba(255,255,255,0.08), inset 0 0 0 1px var(--app-border)`,
      }}
    >
      {/* rank badge */}
      <span
        className="mb-2 inline-flex items-center justify-center rounded-full font-mono text-[11px] font-black"
        style={{
          width: 22,
          height: 22,
          color: metal.ring,
          background: `rgba(${metal.rgb},0.12)`,
          boxShadow: `inset 0 0 0 1px rgba(${metal.rgb},0.4)`,
        }}
      >
        {entry.rank}
      </span>
      <Avatar entry={entry} size={54} ring={metal.ring} ringWidth={2} />
      <p className="mt-2 flex items-center gap-1 text-[13px] font-semibold" style={{ color: "var(--app-text-primary)" }}>
        <span className="max-w-[92px] truncate">{label(entry)}</span>
        {isViewer && <span className="text-[9px] font-bold uppercase" style={{ color: metal.ring }}>{youLabel}</span>}
      </p>
      <div className="mt-0.5 flex items-baseline gap-1">
        <AnimatedNumber
          value={entry.points}
          run={!reduce}
          locale={locale}
          className="font-mono text-[16px] font-bold"
          style={{ color: "var(--app-text-secondary)" }}
        />
        <span className="text-[9px]" style={{ color: "var(--app-text-muted)" }}>{pointsLabel}</span>
      </div>
    </motion.div>
  );
}

/* ── Chase strip (#4 / #5) ──────────────────────────────────────────────── */
function ChaseRow({
  entry,
  isViewer,
  locale,
  youLabel,
  theme,
}: {
  entry: Entry;
  isViewer: boolean;
  locale: string;
  youLabel: string;
  theme: { main: string; rgb: string };
}) {
  return (
    <div
      className="flex items-center gap-3"
      style={{
        padding: "10px 12px",
        borderRadius: 14,
        background: isViewer ? `rgba(${theme.rgb},0.08)` : "transparent",
        boxShadow: isViewer ? `inset 0 0 0 1px rgba(${theme.rgb},0.3)` : undefined,
      }}
    >
      <span className="w-5 text-center font-mono text-[13px] font-bold tabular-nums" style={{ color: "var(--app-text-muted)" }}>
        {entry.rank}
      </span>
      <Avatar entry={entry} size={34} />
      <span className="flex min-w-0 flex-1 items-center gap-1.5">
        <span className="truncate text-[14px] font-medium" style={{ color: "var(--app-text-primary)" }}>{label(entry)}</span>
        {isViewer && <span className="text-[9px] font-bold uppercase" style={{ color: theme.main }}>{youLabel}</span>}
      </span>
      <span className="font-mono text-[14px] font-semibold tabular-nums" style={{ color: "var(--app-text-secondary)" }}>
        {entry.points.toLocaleString(locale, { maximumFractionDigits: 0 })}
      </span>
    </div>
  );
}

/* ── Your-position card with distance-to-next meter ─────────────────────── */
function YouCard({
  entry,
  above,
  theme,
  reduce,
  locale,
  t,
  yourRankLabel,
  pointsLabel,
}: {
  entry: Entry;
  above: Entry | null;
  theme: { main: string; light: string; rgb: string };
  reduce: boolean;
  locale: string;
  t: (k: string, p?: Record<string, string | number>) => string;
  yourRankLabel: string;
  pointsLabel: string;
}) {
  const gap = above ? Math.max(0, Math.round(above.points - entry.points)) : 0;
  // Progress toward the person directly above (visual only).
  const pct = above && above.points > 0 ? Math.max(6, Math.min(100, Math.round((entry.points / above.points) * 100))) : 100;

  return (
    <div
      className="relative overflow-hidden"
      style={{
        borderRadius: 20,
        padding: "16px 16px 15px",
        background: `linear-gradient(160deg, rgba(${theme.rgb},0.16), rgba(${theme.rgb},0.03) 65%), var(--surface-grad-elevated)`,
        boxShadow: `inset 0 1px 0 rgba(255,255,255,0.10), inset 0 0 0 1px rgba(${theme.rgb},0.3), 0 16px 36px -22px rgba(0,0,0,0.55)`,
      }}
    >
      <p className="text-[10px] font-semibold uppercase tracking-[0.18em]" style={{ color: theme.main }}>
        {yourRankLabel}
      </p>
      <div className="mt-2 flex items-center gap-3">
        <span className="font-mono text-[26px] font-black tabular-nums" style={{ color: theme.main }}>
          #{entry.rank}
        </span>
        <Avatar entry={entry} size={40} ring={`rgba(${theme.rgb},0.55)`} />
        <span className="min-w-0 flex-1 truncate text-[15px] font-semibold" style={{ color: "var(--app-text-primary)" }}>
          {label(entry)}
        </span>
        <span className="text-right">
          <AnimatedNumber
            value={entry.points}
            run={!reduce}
            locale={locale}
            className="font-mono text-[18px] font-black"
            style={{ color: theme.main }}
          />
          <span className="ml-1 text-[10px]" style={{ color: "var(--app-text-muted)" }}>{pointsLabel}</span>
        </span>
      </div>

      {above && gap > 0 && (
        <div className="mt-3">
          <div className="mb-1.5 flex items-center gap-1.5 text-[11px]" style={{ color: "var(--app-text-secondary)" }}>
            <Avatar entry={above} size={16} />
            <span>
              {t("rewardsPage.leaderboardToPass", {
                points: gap.toLocaleString(locale, { maximumFractionDigits: 0 }),
                name: label(above),
              })}
            </span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full" style={{ background: "var(--app-border)" }}>
            <motion.div
              className="h-full rounded-full"
              style={{ background: `linear-gradient(90deg, rgba(${theme.rgb},0.7), ${theme.main})` }}
              initial={reduce ? false : { width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 0.9, ease: "easeOut", delay: 0.2 }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export function AlphaPeriodLeaderboard({ viewerUsername }: { viewerUsername?: string }) {
  const { locale, t } = useAppLocale();
  const reduce = !!useReducedMotion();

  const [tab, setTab] = useState<Tab>("genesis");
  const [cache, setCache] = useState<Record<Tab, Entry[] | undefined>>({ genesis: undefined, alpha: undefined });
  const [genesisClosed, setGenesisClosed] = useState(false);
  const [loadingTab, setLoadingTab] = useState<Tab | null>("genesis");

  const load = useCallback(
    async (target: Tab) => {
      if (cache[target]) return;
      setLoadingTab(target);
      try {
        const res = await fetch(TAB_ENDPOINT[target]);
        const data = (await res.json()) as LeaderboardResponse;
        const entries = res.ok && Array.isArray(data.leaderboard) ? data.leaderboard : [];
        setCache((prev) => ({ ...prev, [target]: entries }));
        if (target === "genesis" && res.ok) {
          setGenesisClosed(data.status === "closed");
        }
      } catch {
        setCache((prev) => ({ ...prev, [target]: [] }));
      }
      setLoadingTab((cur) => (cur === target ? null : cur));
    },
    [cache]
  );

  useEffect(() => {
    void load(tab);
  }, [tab, load]);

  const entries = cache[tab];
  const loading = loadingTab === tab && !entries;
  const theme = THEME[tab];
  const isFrozen = tab === "alpha" || (tab === "genesis" && genesisClosed);

  const { top, viewerEntry, aboveEntry } = useMemo(() => {
    const list = entries ?? [];
    const vw = viewerUsername
      ? list.find((e) => e.username.toLowerCase() === viewerUsername.toLowerCase())
      : undefined;
    const above = vw && vw.rank > 1 ? list.find((e) => e.rank === vw.rank - 1) ?? null : null;
    return { top: list.slice(0, TOP_N), viewerEntry: vw, aboveEntry: above };
  }, [entries, viewerUsername]);

  const isViewer = (e: Entry) => !!viewerUsername && e.username.toLowerCase() === viewerUsername.toLowerCase();
  const viewerInTop = !!viewerEntry && viewerEntry.rank <= TOP_N;
  const youLabel = t("rewardsPage.leaderboardYou");
  const pointsLabel = t("rewardsPage.leaderboardPoints");

  const TABS: { key: Tab; label: string }[] = [
    { key: "genesis", label: t("rewardsPage.leaderboardTabGenesis") },
    { key: "alpha", label: t("rewardsPage.leaderboardTabAlpha") },
  ];

  return (
    <section aria-label={t("rewardsPage.leaderboardTitle")} className="relative overflow-hidden" style={{ borderRadius: 26, padding: 4 }}>
      {/* ambient drifting orbs */}
      <div aria-hidden className="pointer-events-none absolute inset-0" style={{ opacity: 0.6 }}>
        <motion.div
          className="absolute rounded-full"
          style={{ top: -60, left: -40, width: 260, height: 260, background: `radial-gradient(circle, rgba(${theme.rgb},0.22), transparent 65%)`, filter: "blur(50px)" }}
          animate={reduce ? undefined : { x: [0, 24, 0], y: [0, 18, 0] }}
          transition={reduce ? undefined : { duration: 22, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute rounded-full"
          style={{ bottom: -80, right: -50, width: 240, height: 240, background: "radial-gradient(circle, rgba(124,58,237,0.16), transparent 65%)", filter: "blur(55px)" }}
          animate={reduce ? undefined : { x: [0, -20, 0], y: [0, -16, 0] }}
          transition={reduce ? undefined : { duration: 26, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      <div className="relative px-2 pt-2">
        {/* header: eyebrow + tab pills */}
        <div className="flex items-center justify-between gap-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em]" style={{ color: "var(--app-text-muted)" }}>
            {t("rewardsPage.leaderboardTitle")}
          </p>
          <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.14em]" style={{ color: theme.main }}>
            {!isFrozen && !reduce && (
              <motion.span
                className="inline-block rounded-full"
                style={{ width: 6, height: 6, background: theme.main }}
                animate={{ opacity: [1, 0.3, 1] }}
                transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
              />
            )}
            {t(isFrozen ? "rewardsPage.leaderboardFrozen" : "rewardsPage.leaderboardLive")}
          </span>
        </div>

        <div className="mt-2 inline-flex gap-1 rounded-full p-1" style={{ background: "var(--app-bg-elevated)", boxShadow: "inset 0 0 0 1px var(--app-border)" }}>
          {TABS.map((tb) => {
            const active = tab === tb.key;
            return (
              <button
                key={tb.key}
                type="button"
                onClick={() => setTab(tb.key)}
                className="relative rounded-full px-4 py-1.5 text-[13px] font-semibold outline-none"
                style={{ color: active ? "#0a0a0a" : "var(--app-text-muted)" }}
              >
                {active && (
                  <motion.span
                    layoutId="rewards-lb-tab"
                    className="absolute inset-0 rounded-full"
                    style={{ background: `linear-gradient(135deg, ${theme.main}, ${theme.light})`, boxShadow: `0 3px 12px rgba(${theme.rgb},0.5)` }}
                    transition={{ type: "spring", stiffness: 420, damping: 34 }}
                  />
                )}
                <span className="relative z-10">{tb.label}</span>
              </button>
            );
          })}
        </div>

        <p className="mt-2.5 text-[12px] leading-snug" style={{ color: "var(--app-text-muted)" }}>
          {tab === "alpha"
            ? t("rewardsPage.leaderboardAlphaSubtitle")
            : genesisClosed
              ? t("rewardsPage.leaderboardGenesisFinalSubtitle")
              : t("rewardsPage.leaderboardGenesisSubtitle")}
        </p>

        {/* body */}
        <div className="mt-4 pb-2">
          {loading ? (
            <div className="space-y-3">
              <div className="h-52 animate-pulse rounded-3xl" style={{ background: "var(--app-bg-elevated)" }} />
              <div className="flex gap-3">
                <div className="h-32 flex-1 animate-pulse rounded-[20px]" style={{ background: "var(--app-bg-elevated)" }} />
                <div className="h-32 flex-1 animate-pulse rounded-[20px]" style={{ background: "var(--app-bg-elevated)" }} />
              </div>
            </div>
          ) : top.length === 0 ? (
            <p className="py-10 text-center text-[13px]" style={{ color: "var(--app-text-muted)" }}>
              {t("rewardsPage.leaderboardEmpty")}
            </p>
          ) : (
            <div key={tab} className="space-y-3">
              {/* Champion */}
              {top[0] && (
                <Champion
                  entry={top[0]}
                  isViewer={isViewer(top[0])}
                  theme={theme}
                  reduce={reduce}
                  locale={locale}
                  leaderLabel={t("rewardsPage.leaderboardLeader")}
                  pointsLabel={pointsLabel}
                  youLabel={youLabel}
                />
              )}

              {/* Runner-up pair */}
              {(top[1] || top[2]) && (
                <div className="flex items-stretch gap-3">
                  {top[1] && (
                    <RunnerTile entry={top[1]} isViewer={isViewer(top[1])} reduce={reduce} locale={locale} delay={0.14} pointsLabel={pointsLabel} youLabel={youLabel} />
                  )}
                  {top[2] && (
                    <RunnerTile entry={top[2]} isViewer={isViewer(top[2])} reduce={reduce} locale={locale} delay={0.2} pointsLabel={pointsLabel} youLabel={youLabel} />
                  )}
                </div>
              )}

              {/* Chase strip 4-5 */}
              {top.length > 3 && (
                <div className="space-y-0.5 pt-1">
                  {top.slice(3).map((e) => (
                    <ChaseRow key={e.username} entry={e} isViewer={isViewer(e)} locale={locale} youLabel={youLabel} theme={theme} />
                  ))}
                </div>
              )}

              {/* Your position (only when the viewer isn't already in the shown top) */}
              {viewerEntry && !viewerInTop && (
                <div className="pt-1">
                  <YouCard
                    entry={viewerEntry}
                    above={aboveEntry}
                    theme={theme}
                    reduce={reduce}
                    locale={locale}
                    t={t}
                    yourRankLabel={t("rewardsPage.leaderboardYourRank")}
                    pointsLabel={pointsLabel}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
