"use client";

/**
 * /app/insights — "Wallet"
 *
 * Spending-focused page. Each section has its own 7/30/90/All range picker;
 * there is no single page-level range (the user compares per section).
 *
 * Patterns (aha card, silent changes) were removed from here — they will
 * live on the future /patterns page. Legacy page: page-legacy.tsx.bak.
 */

import type { ReactNode } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Wallet,
  Receipt,
  Store,
  ShoppingBag,
  Coins,
  Sparkles,
  Flame,
  Tag,
  TrendingUp,
  TrendingDown,
  Minus,
  // Category icons
  ShoppingCart,
  UtensilsCrossed,
  Coffee,
  Fuel,
  Package,
  Pill,
  Smartphone,
  ShoppingBasket,
  type LucideIcon,
} from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { AppShell } from "@/components/app/app-shell";
import { useAppLocale } from "@/lib/i18n/app-context";
import { useAppProfile } from "@/lib/app/profile-context";
import { CategoryGrid } from "@/components/insights/CategoryGrid";
import { CategoryDetail } from "@/components/insights/CategoryDetail";
import { MerchantCard } from "@/components/insights/MerchantCard";
import { getReceiptsForMerchant } from "@/components/insights/mock-receipts";
import {
  TXT_SECTION_TITLE,
  TXT_SECTION_LABEL,
  TXT_MINI_CAPS,
  TXT_CARD_TITLE,
  NUM_FEAT,
} from "@/components/insights/typography";

// ────────────────────────────────────────────────────────────────────────────
// Types
// ────────────────────────────────────────────────────────────────────────────

type Range = "7d" | "30d" | "90d" | "all";
type DeltaDir = "down" | "up" | "flat" | "new";

interface Totals {
  currency: string;
  totalSpend: number;
  receiptCount: number;
  merchantCount: number;
  avgBasket: number;
  deltaSpendPct: number; // negative = down
  deltaReceipts: number;
  deltaBasketAbs: number;
}

interface CategorySlice {
  key: string;
  label: string;
  amount: number;
  pct: number;
  deltaPct: number;
  color: string;
}

interface ProductRow {
  name: string;
  brand: string;
  receiptCount: number;
  quantity: number;
  avgPrice: number;
  // If the line item name is a category name (e.g. "Food"), holds the category key; a "generic" badge is shown.
  categoryKey?: string;
}

interface MerchantTile {
  name: string;
  category: string;
  visits: number;
  total: number;
  avgBasket: number;
  accent: string; // hex
  initial: string;
  // Domain for Logo.dev (e.g. migros.com.tr). null → icon fallback.
  domain?: string;
  // Logo URL on our own server, from the merchant_logos registry.
  logoUrl?: string;
  // 30-element 0/1 array — whether there was a visit on each of the last 30 days.
  timeline?: number[];
}

interface BrandRow {
  name: string;
  hint: string;
  amount: number;
  deltaPct: number;
  ratio: number;
  domain?: string; // Logo.dev lookup
}

interface Bucket {
  totals: Totals;
  categories: CategorySlice[];
  products: ProductRow[];
  merchants: MerchantTile[];
  brands: BrandRow[];
  // For the hero: total spend trend over the last n days
  sparkline: number[];
}

// ────────────────────────────────────────────────────────────────────────────
// Mock: 4 separate datasets for 4 separate ranges — figures change when the user switches tabs
// ────────────────────────────────────────────────────────────────────────────

// Category palette — 8 evenly spaced hues around the color wheel.
// Each is 45° apart, clearly distinct from the others. All saturated, over a luxe slate background.
const PAL = {
  grocery: "#E0B33C",      // golden-yellow (0°)
  cafe: "#EF6E3D",         // orange (45°)
  restaurant: "#E54667",   // terracotta-pink (90°)
  apparel: "#C84BD4",      // magenta (135°)
  marketplace: "#7C5CFF",  // purple-blue (180°)
  electronics: "#3B82F6",  // blue (225°)
  pharmacy: "#1FBF8F",     // teal-green (270°)
  fuel: "#7B8AAB",         // matte slate-indigo (315°)
  convenience: "#94A3B8",  // neutral slate (fallback)
};

// ────────────────────────────────────────────────────────────────────────────
// Empty bucket — skeleton for when there's no real data yet (loading / no receipts).
// Produces no fake values; the UI shows empty states.
// ────────────────────────────────────────────────────────────────────────────

function emptyBucket(): Bucket {
  return {
    totals: {
      currency: "TRY",
      totalSpend: 0,
      receiptCount: 0,
      merchantCount: 0,
      avgBasket: 0,
      deltaSpendPct: 0,
      deltaReceipts: 0,
      deltaBasketAbs: 0,
    },
    categories: [],
    products: [],
    merchants: [],
    brands: [],
    sparkline: [],
  };
}

const EMPTY_BUCKETS: Record<Range, Bucket> = {
  "7d": emptyBucket(),
  "30d": emptyBucket(),
  "90d": emptyBucket(),
  all: emptyBucket(),
};

// Fetches a single range from the API. Returns an empty bucket on error or missing session.
async function fetchBucket(range: Range): Promise<Bucket> {
  try {
    const res = await fetch(`/api/insights/bucket?range=${range}`, { cache: "no-store" });
    if (!res.ok) return emptyBucket();
    const data = (await res.json()) as { bucket?: Bucket };
    return data.bucket ?? emptyBucket();
  } catch {
    return emptyBucket();
  }
}

// Hook that fetches all four ranges in parallel and stores them in state.
function useBuckets(): { buckets: Record<Range, Bucket>; loading: boolean } {
  const [buckets, setBuckets] = useState<Record<Range, Bucket>>(EMPTY_BUCKETS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      const ranges: Range[] = ["7d", "30d", "90d", "all"];
      const results = await Promise.all(ranges.map((r) => fetchBucket(r)));
      if (!alive) return;
      setBuckets({ "7d": results[0], "30d": results[1], "90d": results[2], all: results[3] });
      setLoading(false);
    })();
    return () => {
      alive = false;
    };
  }, []);

  return { buckets, loading };
}

// ────────────────────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────────────────────

function fmt(amount: number, currency: string, locale: string) {
  try {
    return new Intl.NumberFormat(locale === "tr" ? "tr-TR" : "en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(0)}`;
  }
}

function deltaLabel(pct: number, locale: string): { text: string; dir: DeltaDir } {
  if (pct === 0) return { text: locale === "tr" ? "sabit" : "flat", dir: "flat" };
  if (pct > 0) return { text: `+%${Math.abs(pct)}`, dir: "up" };
  return { text: `−%${Math.abs(pct)}`, dir: "down" };
}

function deltaColor(dir: DeltaDir): string {
  if (dir === "down") return "#34D399";
  if (dir === "up") return "#FBBF24";
  if (dir === "new") return "#60A5FA";
  return "var(--app-text-muted)";
}


// ────────────────────────────────────────────────────────────────────────────
// Page
// ────────────────────────────────────────────────────────────────────────────

export default function InsightsPage() {
  const { locale, t } = useAppLocale();

  // Real data: all four ranges are fetched from the API. EMPTY_BUCKETS while loading/empty.
  const { buckets } = useBuckets();

  // cPoints balance + lifetime contribution counters — from the real profile source.
  const { profile } = useAppProfile();

  // Each section has its own range — deliberate; the user compares per section.
  const [rOverview, setROverview] = useState<Range>("30d");
  const [rCategories, setRCategories] = useState<Range>("30d");
  const [rProducts, setRProducts] = useState<Range>("30d");
  const [rMerchants, setRMerchants] = useState<Range>("30d");

  const overview = buckets[rOverview];
  const dCurrency = (n: number) => fmt(n, overview.totals.currency, locale);

  return (
    <AppShell>
      <div className="space-y-4 pb-24 lg:pb-8">
        {/* Page header — minimal, no breadcrumb, no description */}
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
            {locale === "tr" ? "Cüzdan" : "Wallet"}
          </h1>
        </header>

        {/* Overview card — main summary, own range tab */}
        <Section
          icon={<TrendingDown size={16} strokeWidth={2} />}
          title={locale === "tr" ? "Genel bakış" : "Overview"}
          range={rOverview}
          onRangeChange={setROverview}
        >
          <OverviewGrid totals={overview.totals} sparkline={overview.sparkline} dCurrency={dCurrency} locale={locale} />
        </Section>

        {/* Category breakdown — no frame, no title; the tiles stand on their own.
            Only the functional range picker stays in the top-right. */}
        <div className="px-1">
          <div className="mb-1 flex justify-end">
            <RangePicker value={rCategories} onChange={setRCategories} />
          </div>
          <CategorySection bucket={buckets[rCategories]} dCurrency={(n) => fmt(n, buckets[rCategories].totals.currency, locale)} locale={locale} />
        </div>

        {/* Wallet balance — accumulated cPoints + lifetime contribution. The single gold
            surface carrying the page's "Wallet" identity; real data, no fabrication. */}
        <WalletSummary
          cPoints={profile?.contributionPoints?.total ?? null}
          fromReceipts={profile?.contributionPoints?.fromReceipts ?? 0}
          fromQuests={profile?.contributionPoints?.fromQuests ?? 0}
          contributionReceipts={profile?.contributionPoints?.contributionReceipts ?? 0}
          lastContributionAt={profile?.contributionPoints?.lastContributionAt ?? null}
          streak={profile?.streak ?? 0}
          lifetimeReceipts={buckets.all.totals.receiptCount}
          locale={locale}
        />

        <Section
          icon={<ShoppingBag size={16} strokeWidth={2} />}
          title={locale === "tr" ? "En çok aldığın ürünler" : "Top products"}
          range={rProducts}
          onRangeChange={setRProducts}
        >
          <ProductsSection products={buckets[rProducts].products} dCurrency={(n) => fmt(n, buckets[rProducts].totals.currency, locale)} locale={locale} />
        </Section>

        <Section
          icon={<Store size={16} strokeWidth={2} />}
          title={locale === "tr" ? "En çok uğradığın yerler" : "Top places"}
          range={rMerchants}
          onRangeChange={setRMerchants}
        >
          <MerchantsSection merchants={buckets[rMerchants].merchants} dCurrency={(n) => fmt(n, buckets[rMerchants].totals.currency, locale)} locale={locale} />
        </Section>

        {/* Brands — no time range, always "all-time top" */}
        <Section
          icon={<Tag size={18} strokeWidth={2.5} />}
          title={locale === "tr" ? "Favori markalar" : "Brands"}
          subtitle={locale === "tr" ? "Bu ayın en çok harcananları" : "This month's top brands"}
        >
          <BrandsSection brands={buckets["30d"].brands} dCurrency={(n) => fmt(n, buckets["30d"].totals.currency, locale)} locale={locale} />
        </Section>
      </div>
    </AppShell>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Section shell — every section shares the same frame
// ────────────────────────────────────────────────────────────────────────────

interface SectionProps {
  icon: ReactNode;
  title: string;
  subtitle?: string;
  // range is optional — some sections (e.g. Brands) don't have a range picker
  range?: Range;
  onRangeChange?: (r: Range) => void;
  children: ReactNode;
}

function Section({ icon, title, subtitle, range, onRangeChange, children }: SectionProps) {
  return (
    <section
      className="overflow-hidden rounded-3xl border"
      style={{
        background: "var(--app-bg-elevated)",
        borderColor: "var(--app-border)",
        boxShadow: "var(--app-shadow-card)",
      }}
    >
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 pb-3 pt-5 sm:px-6 sm:pt-6">
        <div className="flex items-center gap-3">
          <span
            className="flex h-9 w-9 items-center justify-center rounded-2xl"
            style={{
              background:
                "linear-gradient(160deg, rgba(232, 201, 122, 0.22), rgba(201, 168, 76, 0.06))",
              border: "1px solid var(--app-gold-border)",
              boxShadow: "inset 0 1px 0 rgba(232, 201, 122, 0.18)",
              color: "var(--app-gold-light)",
            }}
          >
            {icon}
          </span>
          <div>
            <h2 className={TXT_SECTION_TITLE}>
              {title}
            </h2>
            {subtitle && (
              <div className={"mt-1 " + TXT_SECTION_LABEL}>
                {subtitle}
              </div>
            )}
          </div>
        </div>
        {range !== undefined && onRangeChange && (
          <RangePicker value={range} onChange={onRangeChange} />
        )}
      </div>
      <div className="px-5 pb-5 pt-3 sm:px-6 sm:pb-6">{children}</div>
    </section>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Range picker — compact, top-right of the card
// ────────────────────────────────────────────────────────────────────────────

function RangePicker({ value, onChange }: { value: Range; onChange: (r: Range) => void }) {
  const tabs: { key: Range; label: string }[] = [
    { key: "7d", label: "7G" },
    { key: "30d", label: "30G" },
    { key: "90d", label: "90G" },
    { key: "all", label: "TÜM" },
  ];
  return (
    <div
      className="inline-flex rounded-full border p-0.5"
      style={{ background: "rgba(255,255,255,0.025)", borderColor: "var(--app-border)" }}
    >
      {tabs.map((t) => {
        const active = t.key === value;
        return (
          <button
            key={t.key}
            type="button"
            onClick={() => onChange(t.key)}
            aria-pressed={active}
            className="cursor-pointer rounded-full px-3 py-1 text-[11px] font-semibold tracking-wide transition-colors"
            style={
              active
                ? {
                    background: "linear-gradient(180deg, rgba(201,168,76,0.22), rgba(201,168,76,0.10))",
                    color: "var(--app-gold-light)",
                    border: "1px solid var(--app-gold-border)",
                  }
                : {
                    background: "transparent",
                    color: "var(--app-text-muted)",
                    border: "1px solid transparent",
                  }
            }
          >
            {t.label}
          </button>
        );
      })}
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Overview — 4 big numbers + delta
// ────────────────────────────────────────────────────────────────────────────

interface OverviewGridProps {
  totals: Totals;
  sparkline: number[];
  dCurrency: (n: number) => string;
  locale: string;
}

function OverviewGrid({ totals, sparkline, dCurrency, locale }: OverviewGridProps) {
  const spendDelta = deltaLabel(totals.deltaSpendPct, locale);
  const SpendIcon = spendDelta.dir === "up" ? TrendingUp : spendDelta.dir === "down" ? TrendingDown : Minus;
  const basketDelta = totals.deltaBasketAbs === 0
    ? { text: locale === "tr" ? "sabit" : "flat", dir: "flat" as DeltaDir }
    : totals.deltaBasketAbs > 0
      ? { text: `+${dCurrency(totals.deltaBasketAbs)}`, dir: "up" as DeltaDir }
      : { text: `−${dCurrency(Math.abs(totals.deltaBasketAbs))}`, dir: "down" as DeltaDir };

  return (
    <div className="grid items-center gap-6 md:grid-cols-[1fr_auto]">
      {/* Hero: large amount + sparkline */}
      <div className="min-w-0">
        <div className="text-[11px] font-medium uppercase tracking-[0.1em] text-app-text-muted">
          {locale === "tr" ? "Toplam harcama" : "Total spend"}
        </div>
        <div
          className="mt-2 font-mono font-bold leading-none tracking-[-0.03em] text-app-text-primary"
          style={{ fontSize: "clamp(36px, 8vw, 48px)", fontFeatureSettings: '"tnum"' }}
        >
          {dCurrency(totals.totalSpend)}
        </div>
        <div className="mt-3 flex items-center gap-2 text-[13px]" style={{ color: deltaColor(spendDelta.dir) }}>
          <SpendIcon size={14} strokeWidth={2.5} />
          <span className="font-medium">{spendDelta.text}</span>
          <span className="text-app-text-muted">·</span>
          <span className="text-app-text-muted">{locale === "tr" ? "geçen aya göre" : "vs last month"}</span>
        </div>
        <div className="mt-4">
          <Sparkline values={sparkline} height={56} />
        </div>
      </div>

      {/* Right: 3 small stat columns, vertical dividers */}
      <div className="grid grid-cols-3 gap-0 md:gap-0 md:border-l md:pl-6" style={{ borderColor: "var(--app-border)" }}>
        <MiniStat
          icon={<Receipt size={14} strokeWidth={2} />}
          label={locale === "tr" ? "Fiş" : "Receipts"}
          value={String(totals.receiptCount)}
          delta={totals.deltaReceipts === 0 ? (locale === "tr" ? "sabit" : "flat") : totals.deltaReceipts > 0 ? `+${totals.deltaReceipts}` : `${totals.deltaReceipts}`}
          deltaDir={totals.deltaReceipts === 0 ? "flat" : totals.deltaReceipts > 0 ? "up" : "down"}
          divider
        />
        <MiniStat
          icon={<Store size={14} strokeWidth={2} />}
          label={locale === "tr" ? "Yer" : "Places"}
          value={String(totals.merchantCount)}
          delta={locale === "tr" ? "farklı" : "unique"}
          deltaDir="flat"
          divider
        />
        <MiniStat
          icon={<ShoppingBag size={14} strokeWidth={2} />}
          label={locale === "tr" ? "Ort. sepet" : "Avg basket"}
          value={dCurrency(totals.avgBasket)}
          delta={basketDelta.text}
          deltaDir={basketDelta.dir}
        />
      </div>
    </div>
  );
}

function MiniStat({
  icon, label, value, delta, deltaDir, divider,
}: {
  icon: ReactNode; label: string; value: string; delta: string; deltaDir: DeltaDir; divider?: boolean;
}) {
  return (
    <div
      className="px-3 md:px-4"
      style={divider ? { borderRight: "1px solid var(--app-border)" } : undefined}
    >
      <div className="flex items-center gap-1.5 text-[10.5px] font-medium uppercase tracking-[0.08em] text-app-text-muted">
        {icon}
        <span>{label}</span>
      </div>
      <div
        className="mt-1.5 font-mono text-[18px] font-bold leading-none tracking-[-0.02em] text-app-text-primary"
        style={{ fontFeatureSettings: '"tnum"' }}
      >
        {value}
      </div>
      <div className="mt-1 text-[11px]" style={{ color: deltaColor(deltaDir) }}>
        {delta}
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Wallet summary — accumulated cPoints balance + lifetime contribution counters.
// Identity card for the "Wallet" page: gold = value. All values come from the real
// profile/bucket source; produces no fake numbers when data is missing — shows an empty state instead.
// ────────────────────────────────────────────────────────────────────────────

/** rAF-based count-up; respects prefers-reduced-motion. */
function useCountUp(target: number, durationMs = 900): number {
  const reduce = useReducedMotion();
  const [val, setVal] = useState(0);
  const fromRef = useRef(0);
  const rafRef = useRef<number | null>(null);
  useEffect(() => {
    if (reduce) {
      setVal(target);
      fromRef.current = target;
      return;
    }
    const from = fromRef.current;
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / durationMs);
      const eased = 1 - Math.pow(1 - p, 3);
      setVal(Math.round(from + (target - from) * eased));
      if (p < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        fromRef.current = target;
      }
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [target, durationMs, reduce]);
  return val;
}

/** ISO date → "today / yesterday / 3 days ago / Jun 12" (locale-aware). */
function relContributionDate(iso: string, locale: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "";
  const days = Math.floor((Date.now() - then) / 86_400_000);
  if (days <= 0) return locale === "tr" ? "bugün" : "today";
  if (days === 1) return locale === "tr" ? "dün" : "yesterday";
  if (days < 7) return locale === "tr" ? `${days} gün önce` : `${days} days ago`;
  return new Date(then).toLocaleDateString(locale === "tr" ? "tr-TR" : "en-US", {
    day: "numeric",
    month: "short",
  });
}

interface WalletSummaryProps {
  cPoints: number | null;
  fromReceipts: number;
  fromQuests: number;
  contributionReceipts: number;
  lastContributionAt: string | null;
  streak: number;
  lifetimeReceipts: number;
  locale: string;
}

function WalletSummary({
  cPoints,
  fromReceipts,
  fromQuests,
  contributionReceipts,
  lastContributionAt,
  streak,
  lifetimeReceipts,
  locale,
}: WalletSummaryProps) {
  const reduce = useReducedMotion();
  const tr = locale === "tr";
  const total = Math.round(cPoints ?? 0);
  const display = useCountUp(total);
  const nf = (n: number) => Math.round(n).toLocaleString(tr ? "tr-TR" : "en-US");

  // If there's no contribution/receipt at all: a guiding empty state instead of a wall of zeros.
  const isEmpty = total === 0 && lifetimeReceipts === 0 && contributionReceipts === 0;

  const reveal = reduce
    ? {}
    : {
        initial: { opacity: 0, y: 16 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] as const },
      };

  return (
    <motion.section
      {...reveal}
      className="relative overflow-hidden rounded-3xl border"
      style={{
        background:
          "linear-gradient(158deg, rgba(232,201,122,0.12), rgba(201,168,76,0.03) 52%, var(--app-bg-elevated) 100%)",
        borderColor: "var(--app-gold-border)",
        boxShadow:
          "var(--app-shadow-card), inset 0 1px 0 rgba(255,255,255,0.05), 0 18px 50px -28px var(--app-gold-glow)",
      }}
    >
      {/* Top corner glow — value surface signature */}
      <div
        aria-hidden
        className="pointer-events-none absolute -right-16 -top-20 h-48 w-48 rounded-full"
        style={{ background: "radial-gradient(closest-side, var(--app-gold-glow), transparent)" }}
      />

      <div className="relative px-5 pb-5 pt-5 sm:px-6 sm:pb-6 sm:pt-6">
        {isEmpty ? (
          <div className="flex items-center gap-4">
            <span
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl"
              style={{
                background: "linear-gradient(160deg, rgba(232,201,122,0.22), rgba(201,168,76,0.06))",
                border: "1px solid var(--app-gold-border)",
                color: "var(--app-gold-light)",
              }}
            >
              <Coins size={22} strokeWidth={2} />
            </span>
            <div className="min-w-0">
              <div className={TXT_CARD_TITLE}>
                {tr ? "Henüz cPoints biriktirmedin" : "No cPoints yet"}
              </div>
              <div className="mt-1 text-[13px] leading-snug text-app-text-secondary">
                {tr
                  ? "İlk fişini tara — kazandığın cPoints burada birikir."
                  : "Scan your first receipt — the cPoints you earn collect here."}
              </div>
            </div>
          </div>
        ) : (
          <div className="grid items-center gap-6 md:grid-cols-[1fr_auto]">
            {/* Hero: accumulated cPoints */}
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span
                  className="flex h-7 w-7 items-center justify-center rounded-xl"
                  style={{
                    background: "linear-gradient(160deg, rgba(232,201,122,0.24), rgba(201,168,76,0.06))",
                    border: "1px solid var(--app-gold-border)",
                    color: "var(--app-gold-light)",
                  }}
                >
                  <Coins size={15} strokeWidth={2.2} />
                </span>
                <span className="text-[11px] font-medium uppercase tracking-[0.12em] text-app-text-muted">
                  {tr ? "Biriken cPoints" : "cPoints earned"}
                </span>
              </div>

              <div
                className="mt-2.5 font-mono font-bold leading-none tracking-[-0.03em]"
                style={{
                  fontSize: "clamp(38px, 9vw, 52px)",
                  ...NUM_FEAT,
                  background: "linear-gradient(180deg, var(--app-gold-light), var(--app-gold))",
                  WebkitBackgroundClip: "text",
                  backgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  color: "transparent",
                }}
              >
                {nf(display)}
              </div>

              {total > 0 && (
                <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12.5px] text-app-text-secondary">
                  <span className="inline-flex items-center gap-1.5">
                    <Receipt size={13} strokeWidth={2} className="text-app-text-muted" />
                    <span>
                      {tr ? "Fişlerden" : "From receipts"}{" "}
                      <span className="font-mono font-semibold text-app-text-primary" style={NUM_FEAT}>
                        {nf(fromReceipts)}
                      </span>
                    </span>
                  </span>
                  <span className="text-app-text-muted">·</span>
                  <span className="inline-flex items-center gap-1.5">
                    <Sparkles size={13} strokeWidth={2} className="text-app-text-muted" />
                    <span>
                      {tr ? "Görevlerden" : "From quests"}{" "}
                      <span className="font-mono font-semibold text-app-text-primary" style={NUM_FEAT}>
                        {nf(fromQuests)}
                      </span>
                    </span>
                  </span>
                </div>
              )}

              {lastContributionAt && (
                <div className="mt-2 text-[11.5px] text-app-text-muted">
                  {tr ? "Son katkı " : "Last earned "}
                  {relContributionDate(lastContributionAt, locale)}
                </div>
              )}
            </div>

            {/* Right: lifetime contribution counters */}
            <div
              className="grid grid-cols-3 md:border-l md:pl-6"
              style={{ borderColor: "var(--app-gold-border)" }}
            >
              <WalletStat
                icon={<Receipt size={14} strokeWidth={2} />}
                label={tr ? "Toplam fiş" : "Receipts"}
                value={nf(lifetimeReceipts)}
                divider
              />
              <WalletStat
                icon={<Sparkles size={14} strokeWidth={2} />}
                label={tr ? "Ödül getiren" : "Rewarded"}
                value={nf(contributionReceipts)}
                divider
              />
              <WalletStat
                icon={<Flame size={14} strokeWidth={2} />}
                label={tr ? "Gün serisi" : "Streak"}
                value={nf(streak)}
              />
            </div>
          </div>
        )}
      </div>
    </motion.section>
  );
}

function WalletStat({
  icon,
  label,
  value,
  divider,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  divider?: boolean;
}) {
  return (
    <div
      className="px-3 first:pl-0 md:px-4"
      style={divider ? { borderRight: "1px solid var(--app-gold-border)" } : undefined}
    >
      <div className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-[0.08em] text-app-text-muted">
        <span style={{ color: "var(--app-gold-light)" }}>{icon}</span>
      </div>
      <div
        className="mt-1.5 font-mono text-[18px] font-bold leading-none tracking-[-0.02em] text-app-text-primary"
        style={NUM_FEAT}
      >
        {value}
      </div>
      <div className="mt-1 text-[10.5px] leading-tight text-app-text-muted">{label}</div>
    </div>
  );
}

// Sparkline — plain SVG, premium gold gradient + dot highlight
function Sparkline({ values, height = 56 }: { values: number[]; height?: number }) {
  if (values.length < 2) return null;
  const W = 320;
  const H = height;
  const pad = 4;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = Math.max(1, max - min);
  const step = (W - pad * 2) / (values.length - 1);
  const pts = values.map((v, i) => {
    const x = pad + i * step;
    const y = pad + (1 - (v - min) / range) * (H - pad * 2);
    return [x, y] as const;
  });
  const line = pts.map(([x, y], i) => (i === 0 ? `M${x},${y}` : `L${x},${y}`)).join(" ");
  const area = `${line} L${pts[pts.length - 1][0]},${H} L${pts[0][0]},${H} Z`;
  const last = pts[pts.length - 1];
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} preserveAspectRatio="none" style={{ display: "block" }}>
      <defs>
        <linearGradient id="spark-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#C9A84C" stopOpacity="0.32" />
          <stop offset="100%" stopColor="#C9A84C" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="spark-line" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#A07830" />
          <stop offset="100%" stopColor="#E8C97A" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#spark-fill)" />
      <path d={line} fill="none" stroke="url(#spark-line)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={last[0]} cy={last[1]} r="3.5" fill="#E8C97A" stroke="#0F1117" strokeWidth="2" />
    </svg>
  );
}

function Stat({
  label,
  primary,
  delta,
  deltaDir,
  icon,
}: {
  label: string;
  primary: string;
  delta: string;
  deltaDir: DeltaDir;
  icon?: ReactNode;
}) {
  const DeltaIcon = deltaDir === "up" ? TrendingUp : deltaDir === "down" ? TrendingDown : Minus;
  return (
    <div
      className="rounded-2xl border p-4"
      style={{
        background: "var(--app-bg-surface)",
        borderColor: "var(--app-border)",
      }}
    >
      <div className="mb-2 flex items-center gap-1.5 text-[10.5px] font-medium uppercase tracking-[0.08em] text-app-text-muted">
        {icon}
        <span>{label}</span>
      </div>
      <div
        className="font-mono text-[22px] font-bold leading-tight tracking-[-0.02em] text-app-text-primary"
        style={{ fontFeatureSettings: '"tnum"' }}
      >
        {primary}
      </div>
      <div className="mt-1.5 flex items-center gap-1 text-[12px]" style={{ color: deltaColor(deltaDir) }}>
        <DeltaIcon size={12} strokeWidth={2.5} />
        <span className="font-medium">{delta}</span>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Categories — donut (full width on mobile) + list
// ────────────────────────────────────────────────────────────────────────────

function CategorySection({
  bucket,
  dCurrency,
  locale,
}: {
  bucket: Bucket;
  dCurrency: (n: number) => string;
  locale: string;
}) {
  const { t } = useAppLocale();
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  // Convert to grid format
  const items = bucket.categories.map((c) => ({
    key: c.key,
    label: categoryLabel(c.key, t),
    amount: c.amount,
    pct: c.pct,
    color: c.color,
  }));
  const selected = selectedKey ? bucket.categories.find((c) => c.key === selectedKey) : null;

  return (
    <div className="space-y-3">
      <CategoryGrid
        categories={items}
        selectedKey={selectedKey}
        onSelect={setSelectedKey}
        dCurrency={dCurrency}
      />
      {selected && (
        <CategoryDetail
          categoryKey={selected.key}
          label={categoryLabel(selected.key, t)}
          color={selected.color}
          Icon={CATEGORY_ICONS[selected.key] ?? Tag}
          amount={selected.amount}
          pct={selected.pct}
          dCurrency={dCurrency}
          locale={locale}
          onClose={() => setSelectedKey(null)}
        />
      )}
    </div>
  );
}

// Squarified treemap — Bruls/Huijbregts/van Wijk algorithm (plain TS)
interface TreemapNode {
  key: string;
  label: string;
  amount: number;
  pct: number;
  deltaPct: number;
  color: string;
}

interface LaidRect { x: number; y: number; w: number; h: number; node: TreemapNode; }

function squarify(items: TreemapNode[], x: number, y: number, w: number, h: number): LaidRect[] {
  if (items.length === 0) return [];
  const total = items.reduce((s, n) => s + n.amount, 0);
  if (total <= 0) return [];
  const area = w * h;
  // Each node's "area" within the treemap
  const sized = items.map((n) => ({ node: n, value: (n.amount / total) * area }));
  return layout(sized, x, y, w, h);
}

function layout(items: { node: TreemapNode; value: number }[], x: number, y: number, w: number, h: number): LaidRect[] {
  const out: LaidRect[] = [];
  let cx = x, cy = y, cw = w, ch = h;
  let remaining = items.slice();
  while (remaining.length > 0) {
    const short = Math.min(cw, ch);
    const row: { node: TreemapNode; value: number }[] = [];
    let bestRatio = Infinity;
    // Accumulate a row based on the shortest side
    while (remaining.length > 0) {
      const candidate = [...row, remaining[0]];
      const ratio = worstRatio(candidate, short);
      if (ratio <= bestRatio || row.length === 0) {
        bestRatio = ratio;
        row.push(remaining.shift()!);
      } else {
        break;
      }
    }
    // Place the row
    const rowValue = row.reduce((s, r) => s + r.value, 0);
    const long = rowValue / short;
    let offset = 0;
    if (cw >= ch) {
      // Place from the left (vertical row)
      for (const r of row) {
        const rh = (r.value / rowValue) * ch;
        out.push({ x: cx, y: cy + offset, w: long, h: rh, node: r.node });
        offset += rh;
      }
      cx += long; cw -= long;
    } else {
      // Place from the top (horizontal row)
      for (const r of row) {
        const rw = (r.value / rowValue) * cw;
        out.push({ x: cx + offset, y: cy, w: rw, h: long, node: r.node });
        offset += rw;
      }
      cy += long; ch -= long;
    }
  }
  return out;
}

function worstRatio(row: { value: number }[], short: number): number {
  if (row.length === 0) return Infinity;
  const sum = row.reduce((s, r) => s + r.value, 0);
  if (sum === 0) return Infinity;
  const min = Math.min(...row.map((r) => r.value));
  const max = Math.max(...row.map((r) => r.value));
  const s2 = short * short;
  return Math.max((s2 * max) / (sum * sum), (sum * sum) / (s2 * min));
}

// Category → Lucide icon mapping
// Category key → display label. The server sends the raw key ("grocery"…);
// the label comes from i18n (messages/<lang>.json → app.insights.categories.<key>),
// so all 6 languages (EN/TR/RU/TH/ES/ZH) are covered automatically. If there's
// no translation, the raw key is shown as-is (no fabrication).
function categoryLabel(key: string, t: (k: string) => string): string {
  const translated = t(`insights.categories.${key}`);
  // t() returns the key itself when no translation is found; in that case show the raw category key.
  return translated === `insights.categories.${key}` ? key : translated;
}

const CATEGORY_ICONS: Record<string, LucideIcon> = {
  grocery: ShoppingCart,
  restaurant: UtensilsCrossed,
  cafe: Coffee,
  fuel: Fuel,
  marketplace: Package,
  pharmacy: Pill,
  electronics: Smartphone,
  convenience: ShoppingBasket,
};

// Treemap — plain div-based (instead of foreignObject), so React components
// like Lucide and Tailwind icons can be placed easily.
function Treemap({
  categories, dCurrency, locale,
}: { categories: CategorySlice[]; dCurrency: (n: number) => string; locale: string }) {
  // viewBox coordinates — squarify operates in this space.
  const W = 800;
  const H = 460;
  const rects = useMemo(
    () => squarify(categories.map((c) => ({ ...c })), 0, 0, W, H),
    [categories]
  );
  // Dynamically adjust aspect ratio based on card width — via ResizeObserver,
  // without relying on Tailwind 4's arbitrary classes.
  const canvasRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;
    const apply = () => {
      const w = el.offsetWidth;
      if (w >= 720) {
        el.style.aspectRatio = "16 / 9";
        el.style.minHeight = "";
      } else if (w >= 520) {
        el.style.aspectRatio = "5 / 4";
        el.style.minHeight = "";
      } else {
        el.style.aspectRatio = "4 / 5";
        el.style.minHeight = "380px";
      }
    };
    apply();
    const ro = new ResizeObserver(apply);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return (
    <div
      ref={canvasRef}
      className="relative w-full overflow-hidden rounded-2xl border"
      style={{
        borderColor: "var(--app-border)",
        background: "var(--app-bg-base)",
        // Fallback values for SSR / first render — the effect overrides them after mount.
        aspectRatio: "4 / 5",
        minHeight: 380,
      }}
    >
      {rects.map((r) => {
        const d = deltaLabel(r.node.deltaPct, locale);
        const Icon = CATEGORY_ICONS[r.node.key] ?? Tag;
        // Tile width in pixels — the fit decision is based on this number.
        // Since r.w is given within an 800px viewBox, tile width in px = (r.w / 800) * actual width.
        // Typical mobile card width 320-360px, desktop 720-900px.
        // r.w value (in viewBox coordinates) → 100px = ~12.5% width.
        // Tier thresholds: w < 90 = xs (icon), 90-150 = s, 150-260 = m, 260+ = l
        const w = r.w;
        const h = r.h;
        const tier: "xs" | "s" | "m" | "l" =
          w < 90 || h < 64 ? "xs"
            : w < 150 || h < 100 ? "s"
              : w < 260 || h < 150 ? "m"
                : "l";
        // Amount font: in viewBox coordinates, rescaled on screen by the % scale.
        // What matters: set it per tier so long numbers don't overflow.
        const amountFontPx =
          tier === "xs" ? 11
            : tier === "s" ? 13
              : tier === "m" ? 17
                : 24;
        const labelFontPx =
          tier === "xs" ? 0
            : tier === "s" ? 11
              : tier === "m" ? 12.5
                : 14;
        const padding =
          tier === "xs" ? 6
            : tier === "s" ? 8
              : tier === "m" ? 12
                : 16;
        const iconBoxSize =
          tier === "xs" ? 18
            : tier === "s" ? 22
              : tier === "m" ? 26
                : 30;
        const iconStrokeSize = tier === "xs" || tier === "s" ? 12 : tier === "m" ? 13 : 15;
        const txtColor = textOn(r.node.color);
        const shadow = txtColor === "#FFFFFF" ? "0 1px 2px rgba(0,0,0,0.3)" : undefined;
        return (
          <div
            key={r.node.key}
            className="absolute"
            style={{
              left: `${(r.x / W) * 100}%`,
              top: `${(r.y / H) * 100}%`,
              width: `${(r.w / W) * 100}%`,
              height: `${(r.h / H) * 100}%`,
              padding: 3,
              boxSizing: "border-box",
            }}
          >
            <div
              className="relative flex h-full w-full flex-col overflow-hidden rounded-xl"
              style={{
                background: `linear-gradient(150deg, ${r.node.color} 0%, ${shade(r.node.color, -0.15)} 100%)`,
                boxShadow: `inset 0 1px 0 ${shade(r.node.color, 0.3)}66, inset 0 -1px 0 rgba(0,0,0,0.25)`,
                padding,
              }}
            >
              {tier === "xs" ? (
                // XS: icon + % only (center-aligned)
                <div className="flex h-full w-full flex-col items-center justify-center gap-0.5">
                  <Icon size={iconBoxSize - 4} strokeWidth={2.5} style={{ color: txtColor }} />
                  <div
                    className="font-mono font-bold"
                    style={{ fontSize: 10, color: txtColor, textShadow: shadow, lineHeight: 1 }}
                  >
                    %{r.node.pct}
                  </div>
                </div>
              ) : (
                <div className="flex h-full w-full flex-col justify-between gap-1">
                  {/* Top: icon + name (if present) */}
                  <div className="flex min-w-0 items-center gap-1.5">
                    <div
                      className="flex shrink-0 items-center justify-center rounded-md"
                      style={{
                        width: iconBoxSize,
                        height: iconBoxSize,
                        background: "rgba(0,0,0,0.18)",
                        color: txtColor,
                      }}
                    >
                      <Icon size={iconStrokeSize} strokeWidth={2.5} />
                    </div>
                    {tier !== "s" && (
                      <div
                        className="truncate font-semibold"
                        style={{
                          fontSize: labelFontPx,
                          color: txtColor,
                          textShadow: shadow,
                          minWidth: 0,
                        }}
                      >
                        {r.node.label}
                      </div>
                    )}
                  </div>
                  {/* Bottom: amount + meta */}
                  <div className="min-w-0">
                    <div
                      className="font-mono font-bold tracking-[-0.02em]"
                      style={{
                        fontSize: amountFontPx,
                        lineHeight: 1.05,
                        color: txtColor,
                        textShadow: shadow,
                        fontFeatureSettings: '"tnum"',
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                      title={dCurrency(r.node.amount)}
                    >
                      {dCurrency(r.node.amount)}
                    </div>
                    {tier !== "s" ? (
                      <div
                        className="mt-0.5 flex items-center gap-1.5 font-mono font-medium"
                        style={{ color: txtColor, opacity: 0.85, fontSize: 11 }}
                      >
                        <span>%{r.node.pct}</span>
                        <span style={{ opacity: 0.5 }}>·</span>
                        <span
                          style={{
                            color:
                              d.dir === "down" ? "#86EFAC"
                              : d.dir === "up" ? "#FDE68A"
                              : txtColor,
                          }}
                        >
                          {d.text}
                        </span>
                      </div>
                    ) : (
                      // s tier: % only
                      <div
                        className="mt-0.5 font-mono font-medium"
                        style={{ color: txtColor, opacity: 0.85, fontSize: 10.5 }}
                      >
                        %{r.node.pct}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Darken/lighten a hex color (amount -1..1)
function shade(hex: string, amount: number): string {
  const m = hex.replace("#", "").match(/.{2}/g);
  if (!m) return hex;
  const [r, g, b] = m.map((h) => parseInt(h, 16));
  const adjust = (v: number) =>
    Math.max(0, Math.min(255, Math.round(v + (amount > 0 ? (255 - v) * amount : v * amount))));
  const toHex = (v: number) => v.toString(16).padStart(2, "0");
  return `#${toHex(adjust(r))}${toHex(adjust(g))}${toHex(adjust(b))}`;
}

// Readable text color on a given background color (white or dark)
function textOn(hex: string): string {
  const m = hex.replace("#", "").match(/.{2}/g);
  if (!m) return "#FFFFFF";
  const [r, g, b] = m.map((h) => parseInt(h, 16));
  // Relative luminance (sRGB approximation)
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return lum > 0.62 ? "#1A1505" : "#FFFFFF";
}

// ────────────────────────────────────────────────────────────────────────────
// Donut
// ────────────────────────────────────────────────────────────────────────────

function Donut({
  slices,
  centerAmount,
  centerLabel,
}: {
  slices: { pct: number; color: string }[];
  centerAmount: string;
  centerLabel: string;
}) {
  const R = 70;
  const C = 2 * Math.PI * R;
  let cumulative = 0;
  return (
    <svg viewBox="0 0 200 200" width={200} height={200} style={{ display: "block", overflow: "visible", maxWidth: "100%" }}>
      <g transform="translate(100 100) rotate(-90)">
        <circle cx="0" cy="0" r={R} fill="transparent" stroke="rgba(255,255,255,0.04)" strokeWidth={22} />
        {slices.map((s, i) => {
          const len = (s.pct / 100) * C;
          const offset = -cumulative;
          cumulative += len;
          return (
            <circle
              key={i}
              cx="0"
              cy="0"
              r={R}
              fill="transparent"
              stroke={s.color}
              strokeWidth={22}
              strokeDasharray={`${len.toFixed(2)} ${(C - len).toFixed(2)}`}
              strokeDashoffset={offset.toFixed(2)}
              strokeLinecap="butt"
            />
          );
        })}
      </g>
      <text
        x="100"
        y="96"
        textAnchor="middle"
        style={{
          fontFamily: '"DM Mono", ui-monospace, monospace',
          fontSize: 22,
          fontWeight: 700,
          letterSpacing: "-0.02em",
          fill: "var(--app-text-primary)",
        }}
      >
        {centerAmount}
      </text>
      <text
        x="100"
        y="114"
        textAnchor="middle"
        style={{
          fontSize: 9,
          fontWeight: 500,
          letterSpacing: "0.14em",
          fill: "var(--app-text-muted)",
          textTransform: "uppercase",
        }}
      >
        {centerLabel}
      </text>
    </svg>
  );
}

// ────────────────────────────────────────────────────────────────────────────

function ProductsSection({ products, dCurrency, locale }: { products: ProductRow[]; dCurrency: (n: number) => string; locale: string }) {
  const { t } = useAppLocale();
  return (
    <ul className="m-0 list-none divide-y p-0" style={{ borderColor: "var(--app-border)" }}>
      {products.map((p, i) => {
        // If the line item name is a category (e.g. "Food"), show a badge that
        // signals it isn't an actual product. The label comes from i18n; falls back to a neutral value if missing.
        const generic = p.categoryKey
          ? (t("insights.products.genericItem") === "insights.products.genericItem"
              ? (locale === "tr" ? "genel kalem" : "generic item")
              : t("insights.products.genericItem"))
          : null;
        return (
        <li key={p.name} className="grid items-center gap-4 py-3.5" style={{ gridTemplateColumns: "28px minmax(0,1fr) auto", borderColor: "var(--app-border)" }}>
          <div className="flex h-7 w-7 items-center justify-center rounded-lg font-mono text-[11px] font-bold" style={{ background: "rgba(201, 168, 76, 0.08)", color: "var(--app-gold-light)" }}>
            {i + 1}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 min-w-0">
              <span className="truncate text-[14px] font-medium text-app-text-primary">{p.name}</span>
              {generic && (
                <span className="shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide" style={{ background: "rgba(148,163,184,0.14)", color: "var(--app-text-muted)" }}>
                  {generic}
                </span>
              )}
            </div>
            <div className="mt-0.5 text-[12px] text-app-text-muted">{p.brand} · {p.receiptCount} {locale === "tr" ? "fişte" : "receipts"}</div>
          </div>
          <div className="text-right">
            <div className="font-mono text-[14px] font-semibold text-app-text-primary">×{p.quantity}</div>
            <div className="font-mono text-[11px] text-app-text-muted">{locale === "tr" ? "ort." : "avg"} {dCurrency(p.avgPrice)}</div>
          </div>
        </li>
        );
      })}
    </ul>
  );
}

function MerchantsSection({ merchants, dCurrency, locale }: { merchants: MerchantTile[]; dCurrency: (n: number) => string; locale: string }) {
  const { t } = useAppLocale();
  const [expandedName, setExpandedName] = useState<string | null>(null);
  return (
    <ul className="m-0 list-none space-y-3 p-0">
      {merchants.map((m) => (
        <MerchantCard
          key={m.name}
          merchant={{
            name: m.name,
            category: categoryLabel(m.category, t),
            visits: m.visits,
            total: m.total,
            avgBasket: m.avgBasket,
            accent: m.accent,
            domain: m.domain,
            logoUrl: m.logoUrl,
            timeline: m.timeline,
          }}
          receipts={getReceiptsForMerchant(m.name)}
          expanded={expandedName === m.name}
          onToggle={() => setExpandedName(expandedName === m.name ? null : m.name)}
          dCurrency={dCurrency}
          locale={locale}
        />
      ))}
    </ul>
  );
}

const PODIUM_THEMES = [
  { rank: 1, ribbon: "linear-gradient(160deg, #F0D080, #C9A84C 55%, #A07830)", accent: "#E8C97A", ring: "rgba(232,201,122,0.45)", label: "1" },
  { rank: 2, ribbon: "linear-gradient(160deg, #E2E2EA, #B8B8C5 55%, #7A7A88)", accent: "#D0D0DC", ring: "rgba(208,208,220,0.45)", label: "2" },
  { rank: 3, ribbon: "linear-gradient(160deg, #E0A06A, #B57843 55%, #7A4E26)", accent: "#D89060", ring: "rgba(216,144,96,0.45)", label: "3" },
] as const;

// ────────────────────────────────────────────────────────────────────────────
// Brand logo — shared; Logo.dev retina + onError monogram fallback
// ────────────────────────────────────────────────────────────────────────────

const LOGO_DEV_TOKEN = process.env.NEXT_PUBLIC_LOGODEV_TOKEN || "";

function logoDevSrc(domain: string, size: number) {
  // retina=true => 2x DPR sharpening, fallback=404 => triggers our onError monogram
  return `https://img.logo.dev/${domain}?token=${LOGO_DEV_TOKEN}&size=${size}&format=png&retina=true&fallback=404`;
}

function BrandLogo({
  name,
  domain,
  size,
  ringColor,
}: {
  name: string;
  domain?: string;
  size: number;
  ringColor?: string;
}) {
  const [failed, setFailed] = useState(false);
  const inner = Math.round(size * 0.75);
  const src = domain && !failed ? logoDevSrc(domain, 256) : null;
  return (
    <div
      className="relative flex shrink-0 items-center justify-center overflow-hidden rounded-full"
      style={{
        width: size,
        height: size,
        background: "rgba(255,255,255,0.96)",
        boxShadow: ringColor
          ? `0 0 0 2px ${ringColor}, 0 4px 14px rgba(0,0,0,0.3)`
          : "0 0 0 1px rgba(255,255,255,0.08), 0 2px 6px rgba(0,0,0,0.2)",
      }}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={name + " logo"}
          width={inner}
          height={inner}
          loading="lazy"
          decoding="async"
          onError={() => setFailed(true)}
          style={{ display: "block", objectFit: "contain", width: inner, height: inner }}
        />
      ) : (
        <span
          className="font-mono font-bold text-app-bg-base"
          style={{ fontSize: Math.round(size * 0.42) }}
        >
          {name.charAt(0)}
        </span>
      )}
    </div>
  );
}

function BrandsSection({ brands, dCurrency, locale }: { brands: BrandRow[]; dCurrency: (n: number) => string; locale: string }) {
  const top3 = brands.slice(0, 3);
  const rest = brands.slice(3);
  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-3 sm:items-end">
        {top3[1] && (<div className="order-2 sm:order-1"><PodiumCard brand={top3[1]} theme={PODIUM_THEMES[1]} rank={2} dCurrency={dCurrency} locale={locale} elevation={1} /></div>)}
        {top3[0] && (<div className="order-1 sm:order-2"><PodiumCard brand={top3[0]} theme={PODIUM_THEMES[0]} rank={1} dCurrency={dCurrency} locale={locale} elevation={2} /></div>)}
        {top3[2] && (<div className="order-3"><PodiumCard brand={top3[2]} theme={PODIUM_THEMES[2]} rank={3} dCurrency={dCurrency} locale={locale} elevation={0} /></div>)}
      </div>
      {rest.length > 0 && (
        <div>
          <div className="mb-2 text-[10.5px] uppercase tracking-[0.08em] text-app-text-muted">{locale === "tr" ? "Diğer markalar" : "Other brands"}</div>
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            {rest.map((b, i) => {
              const d = deltaLabel(b.deltaPct, locale);
              return (
                <div key={b.name} className="grid items-center gap-3 rounded-xl border px-3.5 py-2.5" style={{ background: "var(--app-bg-surface)", borderColor: "var(--app-border)", gridTemplateColumns: "22px 28px minmax(0,1fr) auto" }}>
                  <div className="font-mono text-[11px] font-semibold text-app-text-muted">{String(i + 4).padStart(2, "0")}</div>
                  <BrandLogo name={b.name} domain={b.domain} size={28} />
                  <div className="min-w-0">
                    <div className="truncate text-[13.5px] font-semibold text-app-text-primary">{b.name}</div>
                    <div className="truncate text-[11px] uppercase tracking-[0.05em] text-app-text-muted">{b.hint}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono text-[14px] font-semibold text-app-text-primary">{dCurrency(b.amount)}</div>
                    <div className="font-mono text-[10.5px]" style={{ color: deltaColor(d.dir) }}>{d.text}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function PodiumCard({ brand, theme, rank, dCurrency, locale, elevation }: { brand: BrandRow; theme: typeof PODIUM_THEMES[number]; rank: number; dCurrency: (n: number) => string; locale: string; elevation: number }) {
  const d = deltaLabel(brand.deltaPct, locale);
  return (
    <div className="relative overflow-hidden rounded-2xl border p-4 sm:p-5" style={{
      background: "var(--app-bg-surface)",
      borderColor: "var(--app-border)",
      boxShadow: elevation === 2 ? "0 10px 28px rgba(0,0,0,0.35), inset 0 1px 0 " + theme.ring : elevation === 1 ? "0 6px 18px rgba(0,0,0,0.25), inset 0 1px 0 " + theme.ring : "0 4px 12px rgba(0,0,0,0.18), inset 0 1px 0 " + theme.ring,
      ...(elevation === 2 ? { transform: "translateY(-4px)" } : {})
    }}>
      {/* Top metallic stripe (gold/silver/bronze) */}
      <div aria-hidden style={{ position: "absolute", insetInlineStart: 0, insetInlineEnd: 0, top: 0, height: 4, background: theme.ribbon }} />
      <div className="flex items-start justify-between gap-2">
        {/* Brand logo — round white disc, metallic ring + bottom-right rank badge */}
        <div className="relative">
          <BrandLogo name={brand.name} domain={brand.domain} size={48} ringColor={theme.ring} />
          <div
            aria-hidden
            className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full font-mono text-[9px] font-bold"
            style={{
              background: theme.ribbon,
              color: "#1A1505",
              boxShadow: "0 0 0 2px var(--app-bg-surface)",
            }}
          >
            {rank}
          </div>
        </div>
        <div className="font-mono text-[11.5px] font-semibold" style={{ color: deltaColor(d.dir) }}>{d.text}</div>
      </div>
      <div className={"mt-4 " + TXT_CARD_TITLE + " truncate"}>{brand.name}</div>
      <div className={"mt-1 " + TXT_MINI_CAPS + " truncate"}>{brand.hint}</div>
      <div
        className="mt-4 font-mono font-bold leading-none tracking-[-0.02em] text-app-text-primary"
        style={{ fontSize: elevation === 2 ? 24 : 20, ...NUM_FEAT }}
      >
        {dCurrency(brand.amount)}
      </div>
      <div className="mt-3 h-[5px] overflow-hidden rounded-full" style={{ background: "rgba(255,255,255,0.05)" }}>
        <div style={{ height: "100%", width: Math.max(8, brand.ratio * 100) + "%", background: theme.ribbon, borderRadius: 999 }} />
      </div>
    </div>
  );
}

