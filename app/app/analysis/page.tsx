"use client";

/**
 * /app/analysis — "Analysis"
 *
 * Three layers over the user's own receipt data:
 *   Essentials — price tracking, merchant comparison, unit-price traps,
 *                time-of-day heatmap, loyalty cost.
 *   Deep      — personal inflation vs official CPI, shrinkflation,
 *                purchasing power, category inflation league.
 *   Community — anonymous city-level basket comparison.
 *
 * Every section renders real data from /api/analysis; when a section's data
 * is missing or insufficient it shows an empty state — no fabricated values.
 */

import type { ReactNode } from "react";
import { Fragment, useEffect, useMemo, useState } from "react";
import {
  Activity,
  Clock3,
  Coffee,
  Gauge,
  LineChart,
  MapPin,
  Package,
  PackageMinus,
  Repeat,
  Scale,
  Sparkles,
  Store,
  TrendingDown,
  TrendingUp,
  Users,
} from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { AppShell } from "@/components/app/app-shell";
import { useAppLocale } from "@/lib/i18n/app-context";
import type {
  AnalysisPayload,
  CategoryInflationRow,
  LoyaltyItem,
  PriceTrack,
  ShrinkflationHit,
  UnitTrap,
} from "@/lib/analysis/types";
import {
  TXT_MINI_CAPS,
  TXT_SECTION_LABEL,
  TXT_SECTION_TITLE,
  NUM_FEAT,
} from "@/components/insights/typography";

// ────────────────────────────────────────────────────────────────────────────
// Data hook
// ────────────────────────────────────────────────────────────────────────────

function useAnalysis(): { data: AnalysisPayload | null; loading: boolean } {
  const [data, setData] = useState<AnalysisPayload | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch("/api/analysis", { cache: "no-store" });
        if (!alive) return;
        if (res.ok) {
          const json = (await res.json()) as AnalysisPayload | { analysis?: AnalysisPayload };
          const payload = "overview" in json ? json : (json.analysis ?? null);
          setData(payload && "overview" in payload ? payload : null);
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

  return { data, loading };
}

// ────────────────────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────────────────────

function fmtCurrency(amount: number, currency: string, locale: string, digits = 0) {
  try {
    return new Intl.NumberFormat(locale === "tr" ? "tr-TR" : "en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: digits,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(digits)}`;
  }
}

function fmtPct(ratio: number, locale: string, signed = true) {
  const pct = Math.round(Math.abs(ratio) * 1000) / 10;
  const sign = !signed ? "" : ratio > 0 ? "+" : ratio < 0 ? "−" : "";
  return locale === "tr" ? `${sign}%${pct}` : `${sign}${pct}%`;
}

const UP = "#F87171";
const DOWN = "#34D399";

// ────────────────────────────────────────────────────────────────────────────
// Page
// ────────────────────────────────────────────────────────────────────────────

type TabKey = "essentials" | "deep" | "community";

export default function AnalysisPage() {
  const { locale } = useAppLocale();
  const { data, loading } = useAnalysis();
  const reduced = useReducedMotion();
  const [tab, setTab] = useState<TabKey>("essentials");
  const tr = locale === "tr";

  const currency = data?.currency ?? "TRY";
  const money = (n: number, digits = 0) => fmtCurrency(n, currency, locale, digits);

  const tabs: Array<{ key: TabKey; label: string }> = [
    { key: "essentials", label: tr ? "Temel" : "Essentials" },
    { key: "deep", label: tr ? "Derin" : "Deep" },
    { key: "community", label: tr ? "Topluluk" : "Community" },
  ];

  return (
    <AppShell>
      <div className="space-y-4 pb-24 lg:pb-8">
        {/* Header */}
        <header className="flex items-center gap-3 px-1 pt-2">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-2xl"
            style={{
              background: "linear-gradient(160deg, rgba(232,201,122,0.18), rgba(201,168,76,0.04))",
              border: "1px solid var(--app-gold-border)",
              color: "var(--app-gold-light)",
            }}
          >
            <LineChart size={18} strokeWidth={2} />
          </div>
          <div>
            <h1 className="m-0 text-[26px] font-bold leading-none tracking-[-0.02em] text-app-text-primary">
              {tr ? "Analiz" : "Analysis"}
            </h1>
            {data && data.overview.receiptCount > 0 && (
              <div className={"mt-1 " + TXT_SECTION_LABEL} style={NUM_FEAT}>
                {data.overview.receiptCount} {tr ? "fiş" : "receipts"}
              </div>
            )}
          </div>
        </header>

        {/* Tabs — segmented, gold active pill */}
        <div
          className="sticky top-2 z-10 flex gap-1 rounded-2xl border p-1 backdrop-blur-md"
          style={{
            background: "color-mix(in srgb, var(--app-bg-elevated) 82%, transparent)",
            borderColor: "var(--app-border)",
            boxShadow: "var(--app-shadow-card)",
          }}
        >
          {tabs.map((item) => {
            const active = item.key === tab;
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => setTab(item.key)}
                aria-pressed={active}
                className="relative flex-1 cursor-pointer rounded-xl px-3 py-2 text-[13px] font-semibold tracking-wide transition-colors"
                style={{ color: active ? "var(--app-gold-light)" : "var(--app-text-muted)" }}
              >
                {active && (
                  <motion.span
                    layoutId="analysis-tab-pill"
                    transition={reduced ? { duration: 0 } : { type: "spring", stiffness: 500, damping: 40 }}
                    className="absolute inset-0 rounded-xl"
                    style={{
                      background: "linear-gradient(180deg, rgba(201,168,76,0.20), rgba(201,168,76,0.08))",
                      border: "1px solid var(--app-gold-border)",
                      boxShadow: "inset 0 1px 0 rgba(232,201,122,0.16)",
                    }}
                  />
                )}
                <span className="relative">{item.label}</span>
              </button>
            );
          })}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={reduced ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduced ? undefined : { opacity: 0, y: -6 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="space-y-4"
          >
            {tab === "essentials" && <EssentialsPanel data={data} loading={loading} money={money} tr={tr} locale={locale} />}
            {tab === "deep" && <DeepPanel data={data} loading={loading} money={money} tr={tr} locale={locale} />}
            {tab === "community" && <CommunityPanel data={data} loading={loading} money={money} tr={tr} locale={locale} />}
          </motion.div>
        </AnimatePresence>
      </div>
    </AppShell>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Shared shells
// ────────────────────────────────────────────────────────────────────────────

interface PanelProps {
  data: AnalysisPayload | null;
  loading: boolean;
  money: (n: number, digits?: number) => string;
  tr: boolean;
  locale: string;
}

function Card({
  icon,
  eyebrow,
  title,
  subtitle,
  children,
}: {
  icon: ReactNode;
  eyebrow: string;
  title: string;
  subtitle?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section
      className="relative overflow-hidden rounded-3xl border"
      style={{
        background: "linear-gradient(165deg, var(--app-bg-surface), var(--app-bg-elevated) 70%)",
        borderColor: "var(--app-border)",
        boxShadow: "var(--app-shadow-card), inset 0 1px 0 var(--app-border-strong)",
      }}
    >
      <div className="px-5 pb-5 pt-5 sm:px-6">
        <div className="flex items-start gap-3">
          <span
            className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl"
            style={{
              background: "linear-gradient(160deg, rgba(232,201,122,0.20), rgba(201,168,76,0.05))",
              border: "1px solid var(--app-gold-border)",
              boxShadow: "inset 0 1px 0 rgba(232,201,122,0.16)",
              color: "var(--app-gold-light)",
            }}
          >
            {icon}
          </span>
          <div className="min-w-0">
            <div className={TXT_MINI_CAPS} style={{ color: "var(--app-gold)" }}>
              {eyebrow}
            </div>
            <h2 className={"mt-0.5 " + TXT_SECTION_TITLE}>{title}</h2>
            {subtitle && <div className="mt-0.5 text-[12px] leading-snug text-app-text-secondary">{subtitle}</div>}
          </div>
        </div>
        <div className="mt-4">{children}</div>
      </div>
    </section>
  );
}

/** Consistent empty state — explains what unlocks the section. */
function EmptyState({ tr, hint }: { tr: boolean; hint: string }) {
  return (
    <div
      className="flex flex-col items-center gap-2 rounded-2xl border border-dashed px-4 py-7 text-center"
      style={{ borderColor: "var(--app-border-strong)", background: "rgba(255,255,255,0.015)" }}
    >
      <Sparkles size={18} style={{ color: "var(--app-text-muted)" }} />
      <div className="text-[13px] font-medium text-app-text-secondary">
        {tr ? "Henüz yeterli veri yok" : "Not enough data yet"}
      </div>
      <div className="max-w-[300px] text-[12px] leading-snug text-app-text-muted">{hint}</div>
    </div>
  );
}

function StaggerList({ children }: { children: ReactNode[] }) {
  const reduced = useReducedMotion();
  return (
    <div>
      {children.map((child, i) => (
        <motion.div
          key={i}
          initial={reduced ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: reduced ? 0 : i * 0.045, duration: 0.25, ease: "easeOut" }}
        >
          {child}
        </motion.div>
      ))}
    </div>
  );
}

/** Horizontal metric bar with mono value on the right. */
function MetricBar({
  label,
  valueText,
  ratio,
  color,
  bold,
}: {
  label: ReactNode;
  valueText: string;
  ratio: number; // 0..1 of track width
  color?: string;
  bold?: boolean;
}) {
  const reduced = useReducedMotion();
  return (
    <div className="mb-2.5 flex items-center gap-3 last:mb-0">
      <span
        className={"w-[92px] shrink-0 truncate text-[12.5px] " + (bold ? "font-bold text-app-text-primary" : "text-app-text-secondary")}
      >
        {label}
      </span>
      <div
        className="h-[9px] flex-1 overflow-hidden rounded-full"
        style={{ background: "var(--app-bg-surface3)" }}
      >
        <motion.div
          className="h-full rounded-full"
          initial={reduced ? false : { width: 0 }}
          animate={{ width: `${Math.max(0, Math.min(1, ratio)) * 100}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          style={{
            background: color ?? "linear-gradient(90deg, var(--app-gold-dim), var(--app-gold-light))",
          }}
        />
      </div>
      <span className="w-[64px] shrink-0 text-right font-mono text-[12.5px] font-semibold text-app-text-primary" style={NUM_FEAT}>
        {valueText}
      </span>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// ESSENTIALS
// ────────────────────────────────────────────────────────────────────────────

function EssentialsPanel({ data, loading, money, tr, locale }: PanelProps) {
  const ov = data?.overview ?? null;
  const monthDelta =
    ov && ov.prevMonthTotal != null && ov.prevMonthTotal > 0
      ? (ov.monthTotal - ov.prevMonthTotal) / ov.prevMonthTotal
      : null;

  return (
    <>
      {/* Stat duo */}
      <div className="grid grid-cols-2 gap-3">
        <StatTile
          label={tr ? "Bu ay toplam" : "This month"}
          value={ov ? money(ov.monthTotal) : "—"}
          sub={
            monthDelta != null ? (
              <span style={{ color: monthDelta > 0 ? UP : DOWN }}>
                {monthDelta > 0 ? "▲" : "▼"} {fmtPct(monthDelta, locale, false)}{" "}
                {tr ? "geçen aya göre" : "vs last month"}
              </span>
            ) : (
              <span>{tr ? "önceki ay verisi yok" : "no prior month data"}</span>
            )
          }
          loading={loading}
        />
        <StatTile
          label={tr ? "Gizli maliyet (bu ay)" : "Hidden cost (this month)"}
          value={ov?.hiddenCostMonth != null ? money(ov.hiddenCostMonth) : "—"}
          gold
          sub={
            ov?.hiddenCostMonth != null ? (
              <span>{tr ? "fişlerinden hesaplandı" : "computed from your receipts"}</span>
            ) : (
              <span>{tr ? "bu ay hesaplanmadı" : "not computed this month"}</span>
            )
          }
          loading={loading}
        />
      </div>

      <PriceTrackCard tracks={data?.priceTracks ?? []} money={money} tr={tr} locale={locale} />
      <MerchantCompareCard data={data} money={money} tr={tr} />
      <UnitTrapCard traps={data?.unitTraps ?? []} money={money} tr={tr} locale={locale} />
      <HeatmapCard data={data} tr={tr} locale={locale} />
      <LoyaltyCard items={data?.loyalty ?? []} money={money} tr={tr} locale={locale} />
    </>
  );
}

function StatTile({
  label,
  value,
  sub,
  gold,
  loading,
}: {
  label: string;
  value: string;
  sub: ReactNode;
  gold?: boolean;
  loading?: boolean;
}) {
  return (
    <div
      className="rounded-3xl border px-4 py-4"
      style={{
        background: gold
          ? "linear-gradient(160deg, rgba(201,168,76,0.10), var(--app-bg-elevated) 65%)"
          : "linear-gradient(165deg, var(--app-bg-surface), var(--app-bg-elevated) 70%)",
        borderColor: gold ? "var(--app-gold-border)" : "var(--app-border)",
        boxShadow: "var(--app-shadow-card), inset 0 1px 0 var(--app-border-strong)",
      }}
    >
      <div className={TXT_MINI_CAPS}>{label}</div>
      <div
        className={"mt-1.5 font-mono text-[22px] font-bold leading-none tracking-[-0.02em] " + (loading ? "animate-pulse" : "")}
        style={{ ...NUM_FEAT, color: gold ? "var(--app-gold-light)" : "var(--app-text-primary)" }}
      >
        {loading ? "···" : value}
      </div>
      <div className="mt-1.5 text-[11.5px] leading-snug text-app-text-muted">{sub}</div>
    </div>
  );
}

/** Signature sparkline for the top tracked product + compact list of the rest. */
function PriceTrackCard({
  tracks,
  money,
  tr,
  locale,
}: {
  tracks: PriceTrack[];
  money: (n: number, digits?: number) => string;
  tr: boolean;
  locale: string;
}) {
  const top = tracks[0] ?? null;
  const rest = tracks.slice(1, 4);

  return (
    <Card
      icon={<Activity size={16} strokeWidth={2} />}
      eyebrow={tr ? "Kalem takibi" : "Price tracking"}
      title={top ? trackLabel(top) : tr ? "Tekrar aldığın ürünler" : "Products you rebuy"}
      subtitle={
        top
          ? (tr ? "Fişlerinden otomatik eşleştirildi · " : "Auto-matched from your receipts · ") +
            `${top.sampleSize} ${tr ? "alım" : "purchases"}`
          : undefined
      }
    >
      {top ? (
        <>
          <div className="mb-2 flex items-baseline justify-between">
            <span
              className="rounded-full px-2.5 py-1 font-mono text-[12px] font-bold"
              style={{
                ...NUM_FEAT,
                color: top.deltaRatio > 0 ? UP : DOWN,
                background: top.deltaRatio > 0 ? "rgba(248,113,113,0.10)" : "rgba(52,211,153,0.10)",
              }}
            >
              {fmtPct(top.deltaRatio, locale)} · {Math.round(top.spanDays / 30)} {tr ? "ay" : "mo"}
            </span>
            <span className="font-mono text-[13px] font-bold text-app-text-primary" style={NUM_FEAT}>
              {money(top.latestUnitPrice, 2)}
              <span className="ml-1 text-[10.5px] font-medium text-app-text-muted">
                /{top.unitType ?? (tr ? "birim" : "unit")}
              </span>
            </span>
          </div>
          <Sparkline points={top.series.map((p) => p.unitPrice)} rising={top.deltaRatio > 0} />
          {rest.length > 0 && (
            <div className="mt-4 border-t pt-3" style={{ borderColor: "var(--app-border)" }}>
              <StaggerList>
                {rest.map((t) => (
                  <div key={t.name + String(t.packSize)} className="flex items-center justify-between py-1.5">
                    <span className="truncate text-[13px] font-medium text-app-text-primary">{trackLabel(t)}</span>
                    <span
                      className="ml-3 shrink-0 font-mono text-[12px] font-bold"
                      style={{ ...NUM_FEAT, color: t.deltaRatio > 0 ? UP : DOWN }}
                    >
                      {fmtPct(t.deltaRatio, locale)}
                    </span>
                  </div>
                ))}
              </StaggerList>
            </div>
          )}
        </>
      ) : (
        <EmptyState
          tr={tr}
          hint={
            tr
              ? "Aynı ürünü birkaç hafta arayla 3+ kez taradığında fiyat serisi burada belirir."
              : "Scan the same product 3+ times across a few weeks and its price series appears here."
          }
        />
      )}
    </Card>
  );
}

function trackLabel(t: PriceTrack): string {
  const pack = t.packSize && t.unitType ? ` ${t.packSize}${t.unitType}` : "";
  return `${t.name}${pack}`;
}

function Sparkline({ points, rising }: { points: number[]; rising: boolean }) {
  const reduced = useReducedMotion();
  const path = useMemo(() => {
    if (points.length < 2) return null;
    const min = Math.min(...points);
    const max = Math.max(...points);
    const span = max - min || 1;
    const coords = points.map((v, i) => {
      const x = (i / (points.length - 1)) * 320;
      const y = 78 - ((v - min) / span) * 64;
      return [Math.round(x * 10) / 10, Math.round(y * 10) / 10] as const;
    });
    return { coords, d: coords.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x},${y}`).join(" ") };
  }, [points]);

  if (!path) return null;
  const last = path.coords[path.coords.length - 1];
  const stroke = rising ? "url(#spark-up)" : "url(#spark-down)";

  return (
    <svg viewBox="0 0 320 88" className="block w-full" role="img" aria-hidden>
      <defs>
        <linearGradient id="spark-up" x1="0" x2="1">
          <stop offset="0" stopColor="var(--app-gold-dim)" />
          <stop offset="1" stopColor="var(--app-gold-light)" />
        </linearGradient>
        <linearGradient id="spark-down" x1="0" x2="1">
          <stop offset="0" stopColor="#0d9488" />
          <stop offset="1" stopColor="#34D399" />
        </linearGradient>
        <linearGradient id="spark-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="rgba(201,168,76,0.16)" />
          <stop offset="1" stopColor="rgba(201,168,76,0)" />
        </linearGradient>
      </defs>
      <path d={`${path.d} L320,88 L0,88 Z`} fill={rising ? "url(#spark-fill)" : "none"} opacity={0.8} />
      <motion.path
        d={path.d}
        fill="none"
        stroke={stroke}
        strokeWidth={2.5}
        strokeLinecap="round"
        initial={reduced ? false : { pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      />
      <circle cx={last[0]} cy={last[1]} r={4} fill={rising ? "var(--app-gold-light)" : "#34D399"} />
    </svg>
  );
}

function MerchantCompareCard({ data, money, tr }: { data: AnalysisPayload | null; money: (n: number, digits?: number) => string; tr: boolean }) {
  const mc = data?.merchantComparison ?? null;
  // Density rule: never render a wall — cheapest 3 + priciest 3 tell the story.
  const sorted = useMemo(
    () => (mc ? [...mc.rows].sort((a, b) => a.avgUnitPrice - b.avgUnitPrice) : []),
    [mc]
  );
  const rows = sorted.length > 6 ? [...sorted.slice(0, 3), ...sorted.slice(-3)] : sorted;
  const hiddenCount = sorted.length - rows.length;
  const max = rows.length > 0 ? Math.max(...rows.map((r) => r.avgUnitPrice)) : 0;

  return (
    <Card
      icon={<Store size={16} strokeWidth={2} />}
      eyebrow={tr ? "Nerede daha ucuz?" : "Where is it cheaper?"}
      title={tr ? "Aynı ürünler, farklı market" : "Same products, different stores"}
      subtitle={
        mc
          ? tr
            ? `${mc.itemCount} ortak ürün üzerinden, senin fişlerinden`
            : `Across ${mc.itemCount} shared products, from your receipts`
          : undefined
      }
    >
      {mc && rows.length >= 2 ? (
        <>
          {mc.items.length > 0 && (
            <div className="mb-3 flex flex-wrap gap-1.5">
              {mc.items.map((item) => (
                <span
                  key={item}
                  className="rounded-full border px-2.5 py-1 text-[11px] font-medium text-app-text-secondary"
                  style={{ borderColor: "var(--app-border-strong)", background: "var(--app-bg-surface3)" }}
                >
                  {item}
                </span>
              ))}
            </div>
          )}
          <StaggerList>
            {rows.map((row, i) => (
              <MetricBar
                key={row.merchant}
                label={row.merchant}
                valueText={money(row.avgUnitPrice, 2)}
                ratio={max > 0 ? row.avgUnitPrice / max : 0}
                color={
                  i === 0
                    ? "linear-gradient(90deg, #0d9488, #34D399)"
                    : i === rows.length - 1
                      ? "linear-gradient(90deg, #b91c1c, #F87171)"
                      : undefined
                }
              />
            ))}
          </StaggerList>
          {hiddenCount > 0 && (
            <div className="mt-2 text-[11px] text-app-text-muted" style={NUM_FEAT}>
              {tr
                ? `+ aradaki ${hiddenCount} market gizlendi — uçlar gösteriliyor`
                : `+ ${hiddenCount} stores in between hidden — showing the extremes`}
            </div>
          )}
        </>
      ) : (
        <EmptyState
          tr={tr}
          hint={
            tr
              ? "Aynı ürünü iki farklı markette aldığında karşılaştırma burada belirir."
              : "Buy the same product at two different stores and the comparison appears here."
          }
        />
      )}
    </Card>
  );
}

function UnitTrapCard({
  traps,
  money,
  tr,
  locale,
}: {
  traps: UnitTrap[];
  money: (n: number, digits?: number) => string;
  tr: boolean;
  locale: string;
}) {
  return (
    <Card
      icon={<Scale size={16} strokeWidth={2} />}
      eyebrow={tr ? "Birim fiyat" : "Unit price"}
      title={tr ? "Küçük paket tuzağı" : "The small-pack trap"}
      subtitle={tr ? "Birim bazında pahalıya gelen alımların" : "Purchases that cost more per unit"}
    >
      {traps.length > 0 ? (
        <StaggerList>
          {traps.map((trap) => (
            <div
              key={trap.name + String(trap.packSize)}
              className="flex items-center gap-3 border-b py-2.5 last:border-b-0"
              style={{ borderColor: "var(--app-border)" }}
            >
              <span
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                style={{ background: "var(--app-bg-surface3)", color: "var(--app-text-secondary)" }}
              >
                <Package size={15} />
              </span>
              <div className="min-w-0 flex-1">
                <div className="truncate text-[13.5px] font-semibold text-app-text-primary">
                  {trap.name} {trap.packSize}
                  {trap.unitType}
                </div>
                <div className="text-[11.5px] text-app-text-muted" style={NUM_FEAT}>
                  {tr
                    ? `Birimde ${money(trap.perUnitPaid, 2)} · ${trap.altPackSize}${trap.unitType} boyu ${fmtPct(trap.savingsRatio, locale, false)} ucuz`
                    : `${money(trap.perUnitPaid, 2)} per unit · ${trap.altPackSize}${trap.unitType} size is ${fmtPct(trap.savingsRatio, locale, false)} cheaper`}
                </div>
              </div>
              <span className="shrink-0 font-mono text-[12px] font-bold" style={{ ...NUM_FEAT, color: UP }}>
                {fmtPct(trap.savingsRatio, locale, false)}
              </span>
            </div>
          ))}
        </StaggerList>
      ) : (
        <EmptyState
          tr={tr}
          hint={
            tr
              ? "Aynı ürünün farklı boylarını taradığında birim fiyat karşılaştırması burada belirir."
              : "Scan different sizes of the same product and the per-unit comparison appears here."
          }
        />
      )}
    </Card>
  );
}

function HeatmapCard({ data, tr, locale }: { data: AnalysisPayload | null; tr: boolean; locale: string }) {
  const hm = data?.timeHeatmap ?? null;
  const days = tr ? ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"] : ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const slots = tr ? ["Sabah", "Öğlen", "Akşam", "Gece"] : ["Morning", "Noon", "Evening", "Night"];
  const max = hm ? Math.max(1, ...hm.grid.flat()) : 1;

  return (
    <Card
      icon={<Clock3 size={16} strokeWidth={2} />}
      eyebrow={tr ? "Zaman alışkanlığı" : "Time habits"}
      title={tr ? "Ne zaman harcıyorsun?" : "When do you spend?"}
      subtitle={
        hm?.nightShare != null
          ? tr
            ? `Alışverişlerinin ${fmtPct(hm.nightShare, locale, false)} kadarı 21:00 sonrası`
            : `${fmtPct(hm.nightShare, locale, false)} of your purchases happen after 9pm`
          : undefined
      }
    >
      {hm && hm.sampleSize > 0 ? (
        <div className="grid grid-cols-[52px_repeat(7,1fr)] gap-1.5 text-[10px] text-app-text-muted">
          <div />
          {days.map((d) => (
            <div key={d} className="text-center">
              {d}
            </div>
          ))}
          {hm.grid.map((row, ri) => (
            <Fragment key={ri}>
              <div className="flex items-center">{slots[ri]}</div>
              {row.map((count, ci) => {
                const intensity = count / max;
                return (
                  <div
                    key={`${ri}-${ci}`}
                    className="aspect-square rounded-md"
                    title={`${count}`}
                    style={{
                      background:
                        count === 0
                          ? "var(--app-bg-surface3)"
                          : `rgba(201,168,76,${0.14 + intensity * 0.72})`,
                    }}
                  />
                );
              })}
            </Fragment>
          ))}
        </div>
      ) : (
        <EmptyState
          tr={tr}
          hint={
            tr
              ? "Fişlerinde saat bilgisi okunabildiğinde harcama saatlerin burada belirir."
              : "When your receipts carry a readable time of day, your spending hours appear here."
          }
        />
      )}
    </Card>
  );
}

function LoyaltyCard({
  items,
  money,
  tr,
  locale,
}: {
  items: LoyaltyItem[];
  money: (n: number, digits?: number) => string;
  tr: boolean;
  locale: string;
}) {
  return (
    <Card
      icon={<Repeat size={16} strokeWidth={2} />}
      eyebrow={tr ? "Sadakat maliyeti" : "Loyalty cost"}
      title={tr ? "En sık aldıkların" : "Your most frequent buys"}
      subtitle={tr ? "Yıllıklandırılmış harcama, kendi fişlerinden" : "Annualised spend, from your receipts"}
    >
      {items.length > 0 ? (
        <StaggerList>
          {items.map((item) => (
            <div
              key={item.name}
              className="flex items-center gap-3 border-b py-2.5 last:border-b-0"
              style={{ borderColor: "var(--app-border)" }}
            >
              <span
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                style={{ background: "var(--app-bg-surface3)", color: "var(--app-text-secondary)" }}
              >
                <Coffee size={15} />
              </span>
              <div className="min-w-0 flex-1">
                <div className="truncate text-[13.5px] font-semibold text-app-text-primary">{item.name}</div>
                <div className="text-[11.5px] text-app-text-muted" style={NUM_FEAT}>
                  {tr
                    ? `Ayda ${Math.round(item.purchasesPerMonth)} kez`
                    : `${Math.round(item.purchasesPerMonth)}× per month`}
                </div>
              </div>
              <div className="shrink-0 text-right">
                <div className="font-mono text-[13px] font-bold text-app-text-primary" style={NUM_FEAT}>
                  {money(item.annualizedSpend)}
                  <span className="text-[10.5px] font-medium text-app-text-muted">/{tr ? "yıl" : "yr"}</span>
                </div>
                {item.deltaRatio != null && (
                  <div className="font-mono text-[11px] font-semibold" style={{ ...NUM_FEAT, color: item.deltaRatio > 0 ? UP : DOWN }}>
                    {item.deltaRatio > 0 ? "▲" : "▼"} {fmtPct(item.deltaRatio, locale, false)}
                  </div>
                )}
              </div>
            </div>
          ))}
        </StaggerList>
      ) : (
        <EmptyState
          tr={tr}
          hint={
            tr
              ? "Düzenli aldığın ürünler netleştikçe yıllık maliyetleri burada belirir."
              : "As your regular purchases build up, their yearly cost appears here."
          }
        />
      )}
    </Card>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// DEEP
// ────────────────────────────────────────────────────────────────────────────

function DeepPanel({ data, loading, money, tr, locale }: PanelProps) {
  return (
    <>
      <InflationGauge data={data} tr={tr} locale={locale} />
      <ShrinkflationCard hits={data?.shrinkflation ?? []} tr={tr} locale={locale} />
      <PurchasingPowerCard data={data} money={money} tr={tr} locale={locale} />
      <CategoryLeagueCard rows={data?.categoryLeague ?? []} tr={tr} locale={locale} />
    </>
  );
}

/** Signature surface — personal inflation vs the official index. */
function InflationGauge({ data, tr, locale }: { data: AnalysisPayload | null; tr: boolean; locale: string }) {
  const pi = data?.personalInflation ?? null;
  const reduced = useReducedMotion();

  return (
    <section
      className="relative overflow-hidden rounded-3xl border px-5 pb-5 pt-5 sm:px-6"
      style={{
        background: "linear-gradient(160deg, var(--app-bg-surface), var(--app-bg-dashboard))",
        borderColor: "var(--app-gold-border)",
        boxShadow: "var(--app-shadow-card), inset 0 1px 0 rgba(232,201,122,0.10)",
      }}
    >
      <div
        className="pointer-events-none absolute -left-16 -top-24 h-64 w-64 rounded-full"
        style={{ background: "radial-gradient(closest-side, var(--app-gold-glow), transparent)" }}
      />
      <div className="flex items-center gap-3">
        <span
          className="flex h-9 w-9 items-center justify-center rounded-2xl"
          style={{
            background: "linear-gradient(160deg, rgba(232,201,122,0.24), rgba(201,168,76,0.06))",
            border: "1px solid var(--app-gold-border)",
            color: "var(--app-gold-light)",
          }}
        >
          <Gauge size={16} strokeWidth={2} />
        </span>
        <div className={TXT_MINI_CAPS} style={{ color: "var(--app-gold)" }}>
          {tr ? "Kişisel enflasyon" : "Personal inflation"}
        </div>
      </div>

      {pi ? (
        <>
          <motion.div
            className="mt-3 flex items-baseline gap-2"
            initial={reduced ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <span
              className="font-mono text-[44px] font-bold leading-none tracking-[-0.03em]"
              style={{
                ...NUM_FEAT,
                background: "linear-gradient(140deg, var(--app-gold-light), var(--app-gold-dim))",
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                color: "transparent",
              }}
            >
              {fmtPct(pi.personalPct, locale, false)}
            </span>
            <span className="text-[13px] text-app-text-secondary">
              {tr
                ? `senin sepetin · son ${Math.round(pi.windowDays / 30)} ay, yıllıklandırılmış`
                : `your basket · last ${Math.round(pi.windowDays / 30)} months, annualised`}
            </span>
          </motion.div>

          {pi.officialPct != null && (
            <div className="mt-4">
              <div className="relative h-[12px] rounded-full" style={{ background: "var(--app-bg-surface3)" }}>
                <motion.div
                  className="absolute bottom-0 left-0 top-0 rounded-full"
                  initial={reduced ? false : { width: 0 }}
                  animate={{
                    width: `${Math.min(100, (pi.personalPct / Math.max(pi.personalPct, pi.officialPct) || 1) * 100)}%`,
                  }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                  style={{ background: "linear-gradient(90deg, var(--app-gold-dim), var(--app-gold-light))" }}
                />
                <div
                  className="absolute -bottom-1 -top-1 w-[2px] rounded-full"
                  style={{
                    left: `${Math.min(98, (pi.officialPct / Math.max(pi.personalPct, pi.officialPct)) * 100)}%`,
                    background: "#34D399",
                  }}
                />
              </div>
              <div className="mt-2 flex justify-between text-[12px] text-app-text-secondary" style={NUM_FEAT}>
                <span>
                  {tr ? "Sen" : "You"}:{" "}
                  <b style={{ color: "var(--app-gold-light)" }}>{fmtPct(pi.personalPct, locale, false)}</b>
                </span>
                <span>
                  {pi.officialSource ?? "CPI"}:{" "}
                  <b style={{ color: "#34D399" }}>{fmtPct(pi.officialPct, locale, false)}</b>
                </span>
              </div>
              <p className="mt-3 text-[11.5px] leading-relaxed text-app-text-muted">
                {tr
                  ? `Gerçek fişlerinden, ${pi.productCount} ürün serisi üzerinden hesaplandı. Resmî endeksle fark ${fmtPct(Math.abs(pi.personalPct - pi.officialPct), locale, false)}.`
                  : `Computed from your real receipts across ${pi.productCount} product series. The gap to the official index is ${fmtPct(Math.abs(pi.personalPct - pi.officialPct), locale, false)}.`}
              </p>
            </div>
          )}
        </>
      ) : (
        <div className="mt-4">
          <EmptyState
            tr={tr}
            hint={
              tr
                ? "Kişisel enflasyon için en az 3 ay boyunca tekrar alınan ürün verisi gerekir. Tarama sürdükçe burada belirir."
                : "Personal inflation needs at least 3 months of repeat-purchase data. Keep scanning and it appears here."
            }
          />
        </div>
      )}
    </section>
  );
}

function ShrinkflationCard({ hits, tr, locale }: { hits: ShrinkflationHit[]; tr: boolean; locale: string }) {
  return (
    <Card
      icon={<PackageMinus size={16} strokeWidth={2} />}
      eyebrow={tr ? "Gramaj takibi" : "Shrink tracking"}
      title={tr ? "Gizli zamlar" : "Hidden increases"}
      subtitle={tr ? "Fiyat sabit kaldı, paket küçüldü" : "The price held while the pack shrank"}
    >
      {hits.length > 0 ? (
        <StaggerList>
          {hits.map((hit) => (
            <div
              key={hit.name + hit.observedAt}
              className="flex items-center gap-3 border-b py-2.5 last:border-b-0"
              style={{ borderColor: "var(--app-border)" }}
            >
              <span
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                style={{ background: "rgba(248,113,113,0.08)", color: UP }}
              >
                <PackageMinus size={15} />
              </span>
              <div className="min-w-0 flex-1">
                <div className="truncate text-[13.5px] font-semibold text-app-text-primary">
                  {hit.brand ? `${hit.brand} ` : ""}
                  {hit.name}
                </div>
                <div className="text-[11.5px] text-app-text-muted" style={NUM_FEAT}>
                  {hit.oldPackSize}
                  {hit.unitType} → {hit.newPackSize}
                  {hit.unitType} · {hit.observedAt.slice(0, 7)}
                </div>
              </div>
              <span className="shrink-0 font-mono text-[12px] font-bold" style={{ ...NUM_FEAT, color: UP }}>
                {tr ? "gizli " : "hidden "}
                {fmtPct(hit.impliedPct, locale)}
              </span>
            </div>
          ))}
        </StaggerList>
      ) : (
        <EmptyState
          tr={tr}
          hint={
            tr
              ? "Aynı ürünün paket boyu senin fişlerinde küçülürse burada yakalanır."
              : "If a product's pack size shrinks across your receipts, it gets caught here."
          }
        />
      )}
    </Card>
  );
}

function PurchasingPowerCard({ data, money, tr, locale }: { data: AnalysisPayload | null; money: (n: number, digits?: number) => string; tr: boolean; locale: string }) {
  const pp = data?.purchasingPower ?? null;
  return (
    <Card
      icon={<TrendingDown size={16} strokeWidth={2} />}
      eyebrow={tr ? "Satın alma gücü" : "Purchasing power"}
      title={tr ? "Zaman makinesi" : "Time machine"}
      subtitle={
        pp
          ? tr
            ? `Bugünkü ${money(pp.baseAmount)} geçmişte neye denkti · kaynak: ${pp.source}`
            : `What today's ${money(pp.baseAmount)} was worth before · source: ${pp.source}`
          : undefined
      }
    >
      {pp && pp.steps.length > 0 ? (
        <StaggerList>
          {[
            <MetricBar key="now" label={tr ? "Bugün" : "Today"} valueText={money(pp.baseAmount)} ratio={1} bold />,
            ...pp.steps.map((step) => (
              <MetricBar
                key={step.monthsAgo}
                label={tr ? `${step.monthsAgo} ay önce` : `${step.monthsAgo} mo ago`}
                valueText={money(step.equivalentValue)}
                ratio={step.equivalentValue / pp.baseAmount}
                color="linear-gradient(90deg, var(--app-bg-surface3), var(--app-gold-dim))"
              />
            )),
          ]}
        </StaggerList>
      ) : (
        <EmptyState
          tr={tr}
          hint={
            tr
              ? "Ülkenin resmî fiyat endeksi bağlandığında bu karşılaştırma burada belirir."
              : "Once your country's official price index is connected, this comparison appears here."
          }
        />
      )}
    </Card>
  );
}

const CATEGORY_LABELS: Record<string, { tr: string; en: string }> = {
  grocery: { tr: "Market", en: "Grocery" },
  food_drink: { tr: "Yeme & İçme", en: "Food & drink" },
  restaurant: { tr: "Restoran", en: "Restaurant" },
  cafe: { tr: "Kafe", en: "Café" },
  fuel: { tr: "Yakıt", en: "Fuel" },
  pharmacy_health: { tr: "Sağlık", en: "Health" },
  health: { tr: "Sağlık", en: "Health" },
  electronics: { tr: "Elektronik", en: "Electronics" },
  apparel: { tr: "Giyim", en: "Apparel" },
  transport: { tr: "Ulaşım", en: "Transport" },
  services: { tr: "Hizmetler", en: "Services" },
  home: { tr: "Ev", en: "Home" },
  entertainment: { tr: "Eğlence", en: "Entertainment" },
  other: { tr: "Diğer", en: "Other" },
};

function categoryLabel(key: string, tr: boolean): string {
  const hit = CATEGORY_LABELS[key];
  if (hit) return tr ? hit.tr : hit.en;
  return key.replace(/[_-]+/g, " ").replace(/^./, (c) => c.toUpperCase());
}

// Positional bar colors — distinct color per row (chart color rule, 2026-06-20).
const LEAGUE_PALETTE = [
  "linear-gradient(90deg, #ea580c, #fb923c)", // orange
  "linear-gradient(90deg, #0284c7, #38bdf8)", // sky blue
  "linear-gradient(90deg, #7c3aed, #a78bfa)", // purple
  "linear-gradient(90deg, #0d9488, #34D399)", // teal
  "linear-gradient(90deg, #be185d, #f472b6)", // pink
  "linear-gradient(90deg, #64748b, #94a3b8)", // slate
];

function CategoryLeagueCard({ rows, tr, locale }: { rows: CategoryInflationRow[]; tr: boolean; locale: string }) {
  const usable = rows.filter((r) => r.personalPct != null || r.officialPct != null);
  const max = Math.max(0.01, ...usable.map((r) => Math.abs(r.personalPct ?? r.officialPct ?? 0)));

  return (
    <Card
      icon={<TrendingUp size={16} strokeWidth={2} />}
      eyebrow={tr ? "Kategori ligi" : "Category league"}
      title={tr ? "Senin verinde en hızlı zamlananlar" : "Fastest risers in your data"}
      subtitle={tr ? "Yıllık, kendi fişlerinden" : "Yearly, from your receipts"}
    >
      {usable.length > 0 ? (
        <StaggerList>
          {usable
            .slice()
            .sort((a, b) => (b.personalPct ?? b.officialPct ?? 0) - (a.personalPct ?? a.officialPct ?? 0))
            .slice(0, 6)
            .map((row, i) => {
              const val = row.personalPct ?? row.officialPct ?? 0;
              return (
                <MetricBar
                  key={row.category}
                  label={categoryLabel(row.category, tr)}
                  valueText={fmtPct(val, locale, false)}
                  ratio={Math.abs(val) / max}
                  // Chart color rule (2026-06-20): every bar gets its own positional color.
                  color={LEAGUE_PALETTE[i % LEAGUE_PALETTE.length]}
                />
              );
            })}
        </StaggerList>
      ) : (
        <EmptyState
          tr={tr}
          hint={
            tr
              ? "Kategori bazlı enflasyon için birkaç aylık tarama geçmişi gerekir."
              : "Category-level inflation needs a few months of scanning history."
          }
        />
      )}
    </Card>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// COMMUNITY
// ────────────────────────────────────────────────────────────────────────────

function CommunityPanel({ data, money, tr }: PanelProps) {
  const com = data?.community ?? null;
  const rows = com?.cities ?? [];
  const max = Math.max(0.01, ...rows.map((c) => c.avgBasket), com?.userAvgBasket ?? 0);

  return (
    <>
      <Card
        icon={<Users size={16} strokeWidth={2} />}
        eyebrow={tr ? "Topluluk karşılaştırması" : "Community comparison"}
        title={tr ? "Ortalama sepete kim ne ödüyor?" : "What does the average basket cost?"}
        subtitle={tr ? "Anonim, şehir bazlı Yumo Yumo verisi" : "Anonymous, city-level Yumo Yumo data"}
      >
        {rows.length >= 2 && com?.userAvgBasket != null ? (
          <>
            <StaggerList>
              {[
                ...rows.map((c) => (
                  <MetricBar
                    key={c.city}
                    label={
                      <span className="flex items-center gap-1.5">
                        <MapPin size={11} style={{ color: "var(--app-text-muted)" }} />
                        {c.city}
                      </span>
                    }
                    valueText={money(c.avgBasket)}
                    ratio={c.avgBasket / max}
                    color="linear-gradient(90deg, var(--app-text-muted), var(--app-text-secondary))"
                  />
                )),
                <MetricBar
                  key="you"
                  label={tr ? "Sen" : "You"}
                  valueText={money(com.userAvgBasket)}
                  ratio={com.userAvgBasket / max}
                  bold
                />,
              ]}
            </StaggerList>
            {com.city && (
              <p className="mt-3 text-[11.5px] leading-relaxed text-app-text-muted">
                {tr
                  ? `Karşılaştırma yalnız yeterli katkıcısı olan şehirleri içerir. Senin şehrin: ${com.city}.`
                  : `The comparison only includes cities with enough contributors. Your city: ${com.city}.`}
              </p>
            )}
          </>
        ) : (
          <EmptyState
            tr={tr}
            hint={
              tr
                ? "Şehir karşılaştırması, yeterli sayıda katkıcı toplandığında açılır. Fiş taradıkça topluluğu sen de büyütürsün."
                : "City comparison opens once enough contributors join. Every receipt you scan grows the pool."
            }
          />
        )}
      </Card>
    </>
  );
}
