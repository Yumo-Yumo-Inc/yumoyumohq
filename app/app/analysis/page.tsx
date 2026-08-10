"use client";

/**
 * /app/analysis — "Analysis"
 *
 * Two layers over the user's own receipt data:
 *   Spending — the plain, easily verifiable views moved from the old Wallet
 *              page: overview, category breakdown, top products, top places,
 *              brands (SpendingPanel).
 *   Deep     — price tracking, merchant comparison, unit-price traps,
 *              time-of-day heatmap, loyalty cost, personal inflation vs
 *              official CPI, shrinkflation, purchasing power, category
 *              inflation league and the anonymous city comparison.
 *
 * Layout language: open bands on the page background separated by hairlines —
 * card surfaces are reserved for the two signature moments (price-track chart,
 * inflation gauge). Sections without enough data collapse into a single
 * compact "on the way" strip instead of a stack of empty boxes.
 *
 * Every figure comes from /api/analysis real data; nothing is fabricated.
 */

import type { ReactNode } from "react";
import { Fragment, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Activity,
  ChevronRight,
  Clock3,
  Gauge,
  LineChart,
  MapPin,
  Package,
  PackageMinus,
  Repeat,
  Scale,
  ShoppingBasket,
  Sparkles,
  Store,
  TrendingDown,
  TrendingUp,
  Users,
  type LucideIcon,
} from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { AppShell } from "@/components/app/app-shell";
import { SpendingPanel } from "@/components/insights/spending-sections";
import { useAppLocale, type AppLocale } from "@/lib/i18n/app-context";
import { formatUnitType } from "@/lib/format/unit-type";
import { DeepInsightsPanel } from "@/components/insights/deep-insights-panel";
import { ProductPriceDetail } from "@/components/insights/product-price-detail";
import type {
  AnalysisPayload,
  CategoryInflationRow,
  LoyaltyItem,
  PriceTrack,
  ShrinkflationHit,
  UnitTrap,
} from "@/lib/analysis/types";
import { TXT_MINI_CAPS, TXT_SECTION_LABEL, NUM_FEAT } from "@/components/insights/typography";

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

function unitLabel(unitType: string | null | undefined, locale: string): string | null {
  return formatUnitType(unitType, locale as AppLocale);
}

const UP = "#F87171";
const DOWN = "#34D399";

// ────────────────────────────────────────────────────────────────────────────
// Page
// ────────────────────────────────────────────────────────────────────────────

type TabKey = "spending" | "deep";

export default function AnalysisPage() {
  const { locale } = useAppLocale();
  const { data, loading } = useAnalysis();
  const reduced = useReducedMotion();
  const [tab, setTab] = useState<TabKey>("spending");
  const tr = locale === "tr";

  const currency = data?.currency ?? "TRY";
  const money = (n: number, digits = 0) => fmtCurrency(n, currency, locale, digits);

  const tabs: Array<{ key: TabKey; label: string }> = [
    { key: "spending", label: tr ? "Harcama" : "Spending" },
    { key: "deep", label: tr ? "Derin" : "Deep" },
  ];

  return (
    <AppShell>
      <div className="pb-24 lg:pb-8">
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
          <div className="min-w-0 flex-1">
            <h1 className="m-0 text-[26px] font-bold leading-none tracking-[-0.02em] text-app-text-primary">
              {tr ? "Analiz" : "Analysis"}
            </h1>
            {data && data.overview.receiptCount > 0 && (
              <div className={"mt-1 " + TXT_SECTION_LABEL} style={NUM_FEAT}>
                {data.overview.receiptCount} {tr ? "fiş" : "receipts"}
              </div>
            )}
          </div>
          <Link
            href="/app/ledger"
            className="inline-flex shrink-0 items-center gap-0.5 rounded-full border border-[var(--app-border)] bg-[var(--app-bg-elevated)] px-3 py-1.5 text-[12px] font-bold text-[var(--app-text-primary)] transition hover:brightness-110"
          >
            {tr ? "Defter" : "Ledger"}
            <ChevronRight className="h-3.5 w-3.5 text-[var(--app-text-muted)]" />
          </Link>
        </header>

        {/* Tabs — segmented, gold active pill */}
        <div
          className="sticky top-2 z-10 mt-4 flex gap-1 rounded-2xl border p-1 backdrop-blur-md"
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
          >
            {tab === "spending" && (
              <div className="mt-4">
                <SpendingPanel />
              </div>
            )}
            {tab === "deep" && (
              <>
                <DeepInsightsPanel />
                <Hairline />
                <EssentialsPanel data={data} loading={loading} money={money} tr={tr} locale={locale} />
                <Hairline />
                <DeepPanel data={data} loading={loading} money={money} tr={tr} locale={locale} />
                <Hairline />
                <CommunityPanel data={data} loading={loading} money={money} tr={tr} locale={locale} />
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </AppShell>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Layout primitives — open bands, hairline dividers, one pending strip
// ────────────────────────────────────────────────────────────────────────────

interface PanelProps {
  data: AnalysisPayload | null;
  loading: boolean;
  money: (n: number, digits?: number) => string;
  tr: boolean;
  locale: string;
}

/** Gradient hairline between bands — the separator is light, not a box. */
function Hairline() {
  return (
    <div
      className="my-7 h-px w-full"
      style={{
        background: "linear-gradient(90deg, transparent, var(--app-border-strong) 18%, var(--app-border-strong) 82%, transparent)",
      }}
    />
  );
}

/** Open section band: typographic head + content on the page background. */
function Band({
  icon: Icon,
  eyebrow,
  title,
  subtitle,
  children,
}: {
  icon: LucideIcon;
  eyebrow: string;
  title: string;
  subtitle?: ReactNode;
  children: ReactNode;
}) {
  const reduced = useReducedMotion();
  return (
    <motion.section
      className="px-1"
      initial={reduced ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
    >
      <div className="flex items-center gap-2">
        <Icon size={13} strokeWidth={2.2} style={{ color: "var(--app-gold)" }} />
        <span className={TXT_MINI_CAPS} style={{ color: "var(--app-gold)" }}>
          {eyebrow}
        </span>
      </div>
      <h2 className="mt-1.5 text-[19px] font-bold leading-tight tracking-[-0.015em] text-app-text-primary">{title}</h2>
      {subtitle && <div className="mt-1 text-[12.5px] leading-snug text-app-text-secondary">{subtitle}</div>}
      <div className="mt-4">{children}</div>
    </motion.section>
  );
}

/**
 * Sections whose data hasn't accumulated yet collapse into one quiet strip —
 * a promise of what unlocks next, instead of a stack of empty boxes.
 */
function PendingStrip({ tr, entries }: { tr: boolean; entries: Array<{ icon: LucideIcon; label: string; hint: string }> }) {
  if (entries.length === 0) return null;
  return (
    <section className="px-1">
      <div className="flex items-center gap-2">
        <Sparkles size={13} strokeWidth={2.2} style={{ color: "var(--app-text-muted)" }} />
        <span className={TXT_MINI_CAPS}>{tr ? "Fiş taradıkça açılacaklar" : "Unlocks as you scan"}</span>
      </div>
      <div
        className="mt-3 overflow-hidden rounded-2xl border"
        style={{ borderColor: "var(--app-border)", background: "color-mix(in srgb, var(--app-bg-elevated) 55%, transparent)" }}
      >
        {entries.map(({ icon: Icon, label, hint }, i) => (
          <div
            key={label}
            className="flex items-center gap-3 px-4 py-3"
            style={i > 0 ? { borderTop: "1px solid var(--app-border)" } : undefined}
          >
            <Icon size={15} strokeWidth={2} style={{ color: "var(--app-text-muted)" }} />
            <div className="min-w-0">
              <div className="text-[13px] font-semibold text-app-text-secondary">{label}</div>
              <div className="text-[11.5px] leading-snug text-app-text-muted">{hint}</div>
            </div>
          </div>
        ))}
      </div>
    </section>
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
  ratio: number;
  color?: string;
  bold?: boolean;
}) {
  const reduced = useReducedMotion();
  return (
    <div className="mb-2.5 flex items-center gap-3 last:mb-0">
      <span
        className={"w-[96px] shrink-0 truncate text-[12.5px] " + (bold ? "font-bold text-app-text-primary" : "text-app-text-secondary")}
      >
        {label}
      </span>
      <div className="h-[9px] flex-1 overflow-hidden rounded-full" style={{ background: "var(--app-bg-surface3)" }}>
        <motion.div
          className="h-full rounded-full"
          initial={reduced ? false : { width: 0 }}
          animate={{ width: `${Math.max(0, Math.min(1, ratio)) * 100}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          style={{ background: color ?? "linear-gradient(90deg, var(--app-gold-dim), var(--app-gold-light))" }}
        />
      </div>
      <span className="w-[70px] shrink-0 text-right font-mono text-[12.5px] font-semibold text-app-text-primary" style={NUM_FEAT}>
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
  const tracks = data?.priceTracks ?? [];
  const mc = data?.merchantComparison ?? null;
  const traps = data?.unitTraps ?? [];
  const hm = data?.timeHeatmap ?? null;
  const loyalty = data?.loyalty ?? [];

  const [selectedProductKey, setSelectedProductKey] = useState<string | null>(null);

  const pending: Array<{ icon: LucideIcon; label: string; hint: string }> = [];
  if (tracks.length === 0)
    pending.push({
      icon: Activity,
      label: tr ? "Kalem fiyat takibi" : "Price tracking",
      hint: tr ? "Aynı ürünü birkaç hafta arayla 3+ kez tara." : "Scan the same product 3+ times across a few weeks.",
    });
  if (!mc || mc.rows.length < 2)
    pending.push({
      icon: Store,
      label: tr ? "Market karşılaştırması" : "Store comparison",
      hint: tr ? "Aynı ürünleri iki farklı markette al." : "Buy the same products at two different stores.",
    });
  if (traps.length === 0)
    pending.push({
      icon: Scale,
      label: tr ? "Küçük paket tuzağı" : "Small-pack trap",
      hint: tr ? "Aynı ürünün farklı boylarını tara." : "Scan different sizes of the same product.",
    });
  if (!hm || hm.sampleSize === 0)
    pending.push({
      icon: Clock3,
      label: tr ? "Zaman alışkanlığı" : "Time habits",
      hint: tr ? "Saat bilgisi okunabilen fişler gerekir." : "Needs receipts with a readable time of day.",
    });
  if (loyalty.length === 0)
    pending.push({
      icon: Repeat,
      label: tr ? "Sadakat maliyeti" : "Loyalty cost",
      hint: tr ? "Düzenli aldığın ürünler netleşince açılır." : "Opens once your regular purchases build up.",
    });

  return (
    <div className="mt-6">
      <OverviewHero ov={ov} money={money} tr={tr} locale={locale} loading={loading} />

      {tracks.length > 0 && (
        <>
          <Hairline />
          <PriceTrackSection
            tracks={tracks}
            money={money}
            tr={tr}
            locale={locale}
            onSelectTrack={setSelectedProductKey}
          />
        </>
      )}

      {mc && mc.rows.length >= 2 && (
        <>
          <Hairline />
          <MerchantCompareSection mc={mc} money={money} tr={tr} />
        </>
      )}

      {traps.length > 0 && (
        <>
          <Hairline />
          <UnitTrapSection traps={traps} money={money} tr={tr} locale={locale} />
        </>
      )}

      {hm && hm.sampleSize > 0 && (
        <>
          <Hairline />
          <HeatmapSection hm={hm} tr={tr} locale={locale} />
        </>
      )}

      {loyalty.length > 0 && (
        <>
          <Hairline />
          <LoyaltySection items={loyalty} money={money} tr={tr} locale={locale} />
        </>
      )}

      {pending.length > 0 && (
        <>
          <Hairline />
          <PendingStrip tr={tr} entries={pending} />
        </>
      )}

      {selectedProductKey && (
        <ProductPriceDetail
          productKey={selectedProductKey}
          money={money}
          tr={tr}
          locale={locale}
          onClose={() => setSelectedProductKey(null)}
        />
      )}
    </div>
  );
}

/** Typographic hero — no boxes. Month total, delta, hidden cost in one breath. */
function OverviewHero({
  ov,
  money,
  tr,
  locale,
  loading,
}: {
  ov: AnalysisPayload["overview"] | null;
  money: (n: number, digits?: number) => string;
  tr: boolean;
  locale: string;
  loading: boolean;
}) {
  const reduced = useReducedMotion();
  const monthDelta =
    ov && ov.prevMonthTotal != null && ov.prevMonthTotal > 0 && ov.monthTotal > 0
      ? (ov.monthTotal - ov.prevMonthTotal) / ov.prevMonthTotal
      : null;
  const noReceiptsThisMonth = !!ov && ov.monthTotal === 0;

  return (
    <section className="px-1">
      <div className={TXT_MINI_CAPS}>{tr ? "Bu ay" : "This month"}</div>
      <motion.div
        initial={reduced ? false : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="mt-2 flex flex-wrap items-baseline gap-x-3 gap-y-1"
      >
        <span
          className={"font-mono text-[40px] font-bold leading-none tracking-[-0.03em] " + (loading ? "animate-pulse" : "")}
          style={{
            ...NUM_FEAT,
            background: "linear-gradient(140deg, var(--app-text-primary), var(--app-text-secondary))",
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            color: "transparent",
          }}
        >
          {loading ? "···" : ov ? (noReceiptsThisMonth ? money(0) : money(ov.monthTotal)) : "—"}
        </span>
        {monthDelta != null && (
          <span className="font-mono text-[13px] font-semibold" style={{ ...NUM_FEAT, color: monthDelta > 0 ? UP : DOWN }}>
            {monthDelta > 0 ? "▲" : "▼"} {fmtPct(monthDelta, locale, false)} {tr ? "geçen aya göre" : "vs last month"}
          </span>
        )}
      </motion.div>
      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[12.5px] text-app-text-secondary">
        {noReceiptsThisMonth && ov?.prevMonthTotal != null && ov.prevMonthTotal > 0 && (
          <span>
            {tr ? "Bu ay henüz fiş yok · geçen ay " : "No receipts this month yet · last month "}
            <b className="font-mono text-app-text-primary" style={NUM_FEAT}>
              {money(ov.prevMonthTotal)}
            </b>
          </span>
        )}
        {ov?.hiddenCostMonth != null && ov.hiddenCostMonth > 0 && (
          <span>
            {tr ? "Gizli maliyet: " : "Hidden cost: "}
            <b className="font-mono" style={{ ...NUM_FEAT, color: "var(--app-gold-light)" }}>
              {money(ov.hiddenCostMonth)}
            </b>
          </span>
        )}
      </div>
    </section>
  );
}

/** Signature surface #1 — the price-track chart card. */
function PriceTrackSection({
  tracks,
  money,
  tr,
  locale,
  onSelectTrack,
}: {
  tracks: PriceTrack[];
  money: (n: number, digits?: number) => string;
  tr: boolean;
  locale: string;
  onSelectTrack: (productKey: string) => void;
}) {
  const top = tracks[0];
  const rest = tracks.slice(1, 4);

  return (
    <Band
      icon={Activity}
      eyebrow={tr ? "Kalem fiyat takibi" : "Price tracking"}
      title={trackLabel(top, locale)}
      subtitle={
        (tr ? "Birim fiyat, kendi fişlerinden · " : "Unit price, from your receipts · ") +
        `${top.sampleSize} ${tr ? "alım" : "purchases"}`
      }
    >
      <div
        className="relative cursor-pointer overflow-hidden rounded-3xl border px-4 pb-3 pt-4 transition-transform active:scale-[0.98]"
        onClick={() => onSelectTrack(top.productKey)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") onSelectTrack(top.productKey); }}
        style={{
          background: "linear-gradient(160deg, var(--app-bg-surface), var(--app-bg-elevated) 75%)",
          borderColor: "var(--app-border)",
          boxShadow: "var(--app-shadow-card), inset 0 1px 0 var(--app-border-strong)",
        }}
      >
        <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
          {/* What moved, spelled out: unit price from → to */}
          <span className="font-mono text-[14px] font-bold text-app-text-primary" style={NUM_FEAT}>
            {money(top.baselineUnitPrice, 2)}
            <span className="mx-1 text-app-text-muted">→</span>
            {money(top.latestUnitPrice, 2)}
            <span className="ml-1 text-[10.5px] font-medium text-app-text-muted">/{unitLabel(top.unitType, locale) ?? (tr ? "birim" : "unit")}</span>
          </span>
          <span
            className="rounded-full px-2.5 py-1 font-mono text-[12px] font-bold"
            style={{
              ...NUM_FEAT,
              color: top.deltaRatio > 0 ? UP : DOWN,
              background: top.deltaRatio > 0 ? "rgba(248,113,113,0.10)" : "rgba(52,211,153,0.10)",
            }}
          >
            {fmtPct(top.deltaRatio, locale)} {tr ? "birim fiyat" : "unit price"}
          </span>
        </div>
        <Sparkline points={top.series.map((p) => p.unitPrice)} rising={top.deltaRatio > 0} />
      </div>

      {rest.length > 0 && (
        <div className="mt-3">
          {rest.map((t) => (
            <div
              key={t.name + String(t.packSize)}
              className="flex cursor-pointer items-center justify-between border-b py-2 transition-colors last:border-b-0 hover:bg-app-bg-surface/50"
              onClick={() => onSelectTrack(t.productKey)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") onSelectTrack(t.productKey); }}
              style={{ borderColor: "var(--app-border)" }}
            >
              <span className="truncate text-[13px] font-medium text-app-text-primary">{trackLabel(t, locale)}</span>
              <span className="ml-3 flex shrink-0 items-baseline gap-2">
                <span className="font-mono text-[11.5px] text-app-text-muted" style={NUM_FEAT}>
                  {money(t.baselineUnitPrice, 2)} → {money(t.latestUnitPrice, 2)}
                </span>
                <span className="font-mono text-[12px] font-bold" style={{ ...NUM_FEAT, color: t.deltaRatio > 0 ? UP : DOWN }}>
                  {fmtPct(t.deltaRatio, locale)}
                </span>
              </span>
            </div>
          ))}
        </div>
      )}
    </Band>
  );
}

function trackLabel(t: PriceTrack, locale: string): string {
  const unit = unitLabel(t.unitType, locale);
  const pack = t.packSize && unit ? ` ${t.packSize}${unit}` : "";
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
        stroke={rising ? "url(#spark-up)" : "url(#spark-down)"}
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

function MerchantCompareSection({
  mc,
  money,
  tr,
}: {
  mc: NonNullable<AnalysisPayload["merchantComparison"]>;
  money: (n: number, digits?: number) => string;
  tr: boolean;
}) {
  const sorted = useMemo(() => [...mc.rows].sort((a, b) => a.avgUnitPrice - b.avgUnitPrice), [mc]);
  const rows = sorted.length > 6 ? [...sorted.slice(0, 3), ...sorted.slice(-3)] : sorted;
  const hiddenCount = sorted.length - rows.length;
  const max = rows.length > 0 ? Math.max(...rows.map((r) => r.avgUnitPrice)) : 0;

  return (
    <Band
      icon={Store}
      eyebrow={tr ? "Nerede daha ucuz?" : "Where is it cheaper?"}
      title={tr ? "Aynı ürünler, farklı market" : "Same products, different stores"}
      subtitle={tr ? `${mc.itemCount} ortak ürün üzerinden, senin fişlerinden` : `Across ${mc.itemCount} shared products, from your receipts`}
    >
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
      {hiddenCount > 0 && (
        <div className="mt-2 text-[11px] text-app-text-muted" style={NUM_FEAT}>
          {tr ? `+ aradaki ${hiddenCount} market gizlendi — uçlar gösteriliyor` : `+ ${hiddenCount} stores in between hidden — showing the extremes`}
        </div>
      )}
    </Band>
  );
}

function UnitTrapSection({
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
    <Band
      icon={Scale}
      eyebrow={tr ? "Birim fiyat" : "Unit price"}
      title={tr ? "Küçük paket tuzağı" : "The small-pack trap"}
      subtitle={tr ? "Birim bazında pahalıya gelen alımların" : "Purchases that cost more per unit"}
    >
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
              {unitLabel(trap.unitType, locale)}
            </div>
            <div className="text-[11.5px] text-app-text-muted" style={NUM_FEAT}>
              {tr
                ? `Birimde ${money(trap.perUnitPaid, 2)} · ${trap.altPackSize}${unitLabel(trap.unitType, locale)} boyu ${fmtPct(trap.savingsRatio, locale, false)} ucuz`
                : `${money(trap.perUnitPaid, 2)} per unit · ${trap.altPackSize}${unitLabel(trap.unitType, locale)} size is ${fmtPct(trap.savingsRatio, locale, false)} cheaper`}
            </div>
          </div>
          <span className="shrink-0 font-mono text-[12px] font-bold" style={{ ...NUM_FEAT, color: UP }}>
            {fmtPct(trap.savingsRatio, locale, false)}
          </span>
        </div>
      ))}
    </Band>
  );
}

function HeatmapSection({ hm, tr, locale }: { hm: NonNullable<AnalysisPayload["timeHeatmap"]>; tr: boolean; locale: string }) {
  const days = tr ? ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"] : ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const slots = tr ? ["Sabah", "Öğlen", "Akşam", "Gece"] : ["Morning", "Noon", "Evening", "Night"];
  const max = Math.max(1, ...hm.grid.flat());

  return (
    <Band
      icon={Clock3}
      eyebrow={tr ? "Zaman alışkanlığı" : "Time habits"}
      title={tr ? "Ne zaman harcıyorsun?" : "When do you spend?"}
      subtitle={
        hm.nightShare != null
          ? tr
            ? `Alışverişlerinin ${fmtPct(hm.nightShare, locale, false)} kadarı 21:00 sonrası`
            : `${fmtPct(hm.nightShare, locale, false)} of your purchases happen after 9pm`
          : undefined
      }
    >
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
                    background: count === 0 ? "var(--app-bg-surface3)" : `rgba(201,168,76,${0.14 + intensity * 0.72})`,
                  }}
                />
              );
            })}
          </Fragment>
        ))}
      </div>
    </Band>
  );
}

function LoyaltySection({
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
    <Band
      icon={Repeat}
      eyebrow={tr ? "Sadakat maliyeti" : "Loyalty cost"}
      title={tr ? "En sık aldıkların" : "Your most frequent buys"}
      subtitle={tr ? "Yıllıklandırılmış harcama, kendi fişlerinden" : "Annualised spend, from your receipts"}
    >
      {items.map((item) => (
        <div key={item.name} className="flex items-center gap-3 border-b py-2.5 last:border-b-0" style={{ borderColor: "var(--app-border)" }}>
          <span
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
            style={{ background: "var(--app-bg-surface3)", color: "var(--app-text-secondary)" }}
          >
            <ShoppingBasket size={15} />
          </span>
          <div className="min-w-0 flex-1">
            <div className="truncate text-[13.5px] font-semibold text-app-text-primary">{item.name}</div>
            <div className="text-[11.5px] text-app-text-muted" style={NUM_FEAT}>
              {tr ? `Ayda ${Math.round(item.purchasesPerMonth)} kez` : `${Math.round(item.purchasesPerMonth)}× per month`}
            </div>
          </div>
          <div className="shrink-0 text-right">
            <div className="font-mono text-[13px] font-bold text-app-text-primary" style={NUM_FEAT}>
              {money(item.annualizedSpend)}
              <span className="text-[10.5px] font-medium text-app-text-muted">/{tr ? "yıl" : "yr"}</span>
            </div>
            {item.deltaRatio != null && item.deltaRatio !== 0 && (
              <div className="font-mono text-[11px] font-semibold" style={{ ...NUM_FEAT, color: item.deltaRatio > 0 ? UP : DOWN }}>
                {item.deltaRatio > 0 ? "▲" : "▼"} {fmtPct(item.deltaRatio, locale, false)} {tr ? "birim fiyat" : "unit price"}
              </div>
            )}
          </div>
        </div>
      ))}
    </Band>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// DEEP
// ────────────────────────────────────────────────────────────────────────────

function DeepPanel({ data, money, tr, locale }: PanelProps) {
  const pi = data?.personalInflation ?? null;
  const hits = data?.shrinkflation ?? [];
  const pp = data?.purchasingPower ?? null;
  const league = (data?.categoryLeague ?? []).filter((r) => r.personalPct != null || r.officialPct != null);

  const pending: Array<{ icon: LucideIcon; label: string; hint: string }> = [];
  if (!pi)
    pending.push({
      icon: Gauge,
      label: tr ? "Kişisel enflasyon" : "Personal inflation",
      hint: tr ? "En az 3 aylık tekrar-alım verisiyle açılır." : "Opens with 3+ months of repeat-purchase data.",
    });
  if (hits.length === 0)
    pending.push({
      icon: PackageMinus,
      label: tr ? "Gramaj takibi" : "Shrink tracking",
      hint: tr ? "Paket boyu okunabilen tekrar alımlar gerekir." : "Needs repeat purchases with readable pack sizes.",
    });

  return (
    <div className="mt-6">
      {pi ? <InflationGauge pi={pi} tr={tr} locale={locale} /> : null}

      {hits.length > 0 && (
        <>
          {pi && <Hairline />}
          <ShrinkflationSection hits={hits} tr={tr} locale={locale} />
        </>
      )}

      {pp && pp.steps.length > 0 && (
        <>
          {(pi || hits.length > 0) && <Hairline />}
          <Band
            icon={TrendingDown}
            eyebrow={tr ? "Satın alma gücü" : "Purchasing power"}
            title={tr ? "Zaman makinesi" : "Time machine"}
            subtitle={
              tr
                ? `Bugünkü ${money(pp.baseAmount)} geçmişte neye denkti · kaynak: ${pp.source}`
                : `What today's ${money(pp.baseAmount)} was worth before · source: ${pp.source}`
            }
          >
            <MetricBar label={tr ? "Bugün" : "Today"} valueText={money(pp.baseAmount)} ratio={1} bold />
            {pp.steps.map((step) => (
              <MetricBar
                key={step.monthsAgo}
                label={tr ? `${step.monthsAgo} ay önce` : `${step.monthsAgo} mo ago`}
                valueText={money(step.equivalentValue)}
                ratio={step.equivalentValue / pp.baseAmount}
                color="linear-gradient(90deg, var(--app-bg-surface3), var(--app-gold-dim))"
              />
            ))}
          </Band>
        </>
      )}

      {league.length > 0 && (
        <>
          <Hairline />
          <CategoryLeagueSection rows={league} tr={tr} locale={locale} />
        </>
      )}

      {pending.length > 0 && (
        <>
          <Hairline />
          <PendingStrip tr={tr} entries={pending} />
        </>
      )}
    </div>
  );
}

/** Signature surface #2 — personal inflation vs the official index. */
function InflationGauge({ pi, tr, locale }: { pi: NonNullable<AnalysisPayload["personalInflation"]>; tr: boolean; locale: string }) {
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
      <div className="flex items-center gap-2">
        <Gauge size={14} strokeWidth={2.2} style={{ color: "var(--app-gold)" }} />
        <span className={TXT_MINI_CAPS} style={{ color: "var(--app-gold)" }}>
          {tr ? "Kişisel enflasyon" : "Personal inflation"}
        </span>
      </div>

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
              animate={{ width: `${Math.min(100, (pi.personalPct / Math.max(pi.personalPct, pi.officialPct) || 1) * 100)}%` }}
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
              {tr ? "Sen" : "You"}: <b style={{ color: "var(--app-gold-light)" }}>{fmtPct(pi.personalPct, locale, false)}</b>
            </span>
            <span>
              {pi.officialSource ?? "CPI"}: <b style={{ color: "#34D399" }}>{fmtPct(pi.officialPct, locale, false)}</b>
            </span>
          </div>
          <p className="mt-3 text-[11.5px] leading-relaxed text-app-text-muted">
            {tr
              ? `Gerçek fişlerinden, ${pi.productCount} ürün serisi üzerinden hesaplandı. Resmî endeksle fark ${fmtPct(Math.abs(pi.personalPct - pi.officialPct), locale, false)}.`
              : `Computed from your real receipts across ${pi.productCount} product series. The gap to the official index is ${fmtPct(Math.abs(pi.personalPct - pi.officialPct), locale, false)}.`}
          </p>
        </div>
      )}
    </section>
  );
}

function ShrinkflationSection({ hits, tr, locale }: { hits: ShrinkflationHit[]; tr: boolean; locale: string }) {
  return (
    <Band
      icon={PackageMinus}
      eyebrow={tr ? "Gramaj takibi" : "Shrink tracking"}
      title={tr ? "Gizli zamlar" : "Hidden increases"}
      subtitle={tr ? "Fiyat sabit kaldı, paket küçüldü" : "The price held while the pack shrank"}
    >
      {hits.map((hit) => (
        <div key={hit.name + hit.observedAt} className="flex items-center gap-3 border-b py-2.5 last:border-b-0" style={{ borderColor: "var(--app-border)" }}>
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl" style={{ background: "rgba(248,113,113,0.08)", color: UP }}>
            <PackageMinus size={15} />
          </span>
          <div className="min-w-0 flex-1">
            <div className="truncate text-[13.5px] font-semibold text-app-text-primary">
              {hit.brand ? `${hit.brand} ` : ""}
              {hit.name}
            </div>
            <div className="text-[11.5px] text-app-text-muted" style={NUM_FEAT}>
              {hit.oldPackSize}
              {unitLabel(hit.unitType, locale)} → {hit.newPackSize}
              {unitLabel(hit.unitType, locale)} · {hit.observedAt.slice(0, 7)}
            </div>
          </div>
          <span className="shrink-0 font-mono text-[12px] font-bold" style={{ ...NUM_FEAT, color: UP }}>
            {tr ? "gizli " : "hidden "}
            {fmtPct(hit.impliedPct, locale)}
          </span>
        </div>
      ))}
    </Band>
  );
}

const CATEGORY_LABELS: Record<string, { tr: string; en: string }> = {
  grocery: { tr: "Market", en: "Grocery" },
  groceries: { tr: "Market", en: "Grocery" },
  food_drink: { tr: "Yeme & İçme", en: "Food & drink" },
  restaurant: { tr: "Restoran", en: "Restaurant" },
  cafe: { tr: "Kafe", en: "Café" },
  fuel: { tr: "Yakıt", en: "Fuel" },
  pharmacy_health: { tr: "Sağlık", en: "Health" },
  pharmacy: { tr: "Sağlık", en: "Health" },
  health: { tr: "Sağlık", en: "Health" },
  electronics: { tr: "Elektronik", en: "Electronics" },
  apparel: { tr: "Giyim", en: "Apparel" },
  transport: { tr: "Ulaşım", en: "Transport" },
  services: { tr: "Hizmetler", en: "Services" },
  home: { tr: "Ev", en: "Home" },
  entertainment: { tr: "Eğlence", en: "Entertainment" },
  cosmetics: { tr: "Kozmetik", en: "Cosmetics" },
  alcohol: { tr: "Alkollü içecek", en: "Alcohol" },
  tobacco: { tr: "Tütün", en: "Tobacco" },
  pets: { tr: "Evcil hayvan", en: "Pets" },
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

function CategoryLeagueSection({ rows, tr, locale }: { rows: CategoryInflationRow[]; tr: boolean; locale: string }) {
  const max = Math.max(0.01, ...rows.map((r) => Math.abs(r.personalPct ?? r.officialPct ?? 0)));
  return (
    <Band
      icon={TrendingUp}
      eyebrow={tr ? "Kategori ligi" : "Category league"}
      title={tr ? "Senin verinde en hızlı zamlananlar" : "Fastest risers in your data"}
      subtitle={tr ? "Yıllık, kendi fişlerinden" : "Yearly, from your receipts"}
    >
      {rows
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
              color={LEAGUE_PALETTE[i % LEAGUE_PALETTE.length]}
            />
          );
        })}
    </Band>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// COMMUNITY
// ────────────────────────────────────────────────────────────────────────────

function CommunityPanel({ data, money, tr }: PanelProps) {
  const com = data?.community ?? null;
  const rows = com?.cities ?? [];
  const hasData = rows.length >= 2 && com?.userAvgBasket != null;
  const max = Math.max(0.01, ...rows.map((c) => c.avgBasket), com?.userAvgBasket ?? 0);

  return (
    <div className="mt-6">
      {hasData ? (
        <Band
          icon={Users}
          eyebrow={tr ? "Topluluk karşılaştırması" : "Community comparison"}
          title={tr ? "Ortalama sepete kim ne ödüyor?" : "What does the average basket cost?"}
          subtitle={tr ? "Anonim, şehir bazlı Yumo Yumo verisi" : "Anonymous, city-level Yumo Yumo data"}
        >
          {rows.map((c) => (
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
          ))}
          <MetricBar label={tr ? "Sen" : "You"} valueText={money(com!.userAvgBasket!)} ratio={com!.userAvgBasket! / max} bold />
          {com?.city && (
            <p className="mt-3 text-[11.5px] leading-relaxed text-app-text-muted">
              {tr
                ? `Karşılaştırma yalnız yeterli katkıcısı olan şehirleri içerir. Senin şehrin: ${com.city}.`
                : `The comparison only includes cities with enough contributors. Your city: ${com.city}.`}
            </p>
          )}
        </Band>
      ) : (
        <PendingStrip
          tr={tr}
          entries={[
            {
              icon: Users,
              label: tr ? "Şehir karşılaştırması" : "City comparison",
              hint: tr
                ? "Yeterli sayıda katkıcı toplandığında açılır — her fiş havuzu büyütür."
                : "Opens once enough contributors join — every receipt grows the pool.",
            },
          ]}
        />
      )}
    </div>
  );
}
