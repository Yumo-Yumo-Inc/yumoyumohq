"use client";

/**
 * Spending sections — the proven receipt-spending views (overview, category
 * breakdown, top products, top places, brands). Moved out of /app/insights
 * so /app/analysis can host them as its default "Spending" tab while
 * /app/insights becomes the Wallet (balances) page.
 *
 * All data comes from /api/insights/bucket; empty buckets render empty
 * states — no fabricated values.
 */

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import {
  Receipt,
  Store,
  ShoppingBag,
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
import { useAppLocale } from "@/lib/i18n/app-context";
import { CategoryGrid } from "@/components/insights/CategoryGrid";
import { CategoryDetail } from "@/components/insights/CategoryDetail";
import { MerchantCard } from "@/components/insights/MerchantCard";
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

export type Range = "7d" | "30d" | "90d" | "all";
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
  // Receipt ids in this merchant group — resolves the tile's rows in Bucket.receipts.
  receiptIds?: string[];
}

export interface InsightReceiptRow {
  id: string;
  date: string; // ISO YYYY-MM-DD
  merchant: string;
  category: string;
  total: number;
  itemCount: number;
}

interface BrandRow {
  name: string;
  hint: string;
  amount: number;
  deltaPct: number;
  ratio: number;
  domain?: string; // Logo.dev lookup
}

export interface Bucket {
  totals: Totals;
  categories: CategorySlice[];
  products: ProductRow[];
  merchants: MerchantTile[];
  brands: BrandRow[];
  // For the hero: total spend trend over the last n days
  sparkline: number[];
  // The range's real receipts (newest first, capped) — source for detail lists.
  receipts?: InsightReceiptRow[];
}

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
    receipts: [],
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
// Panel — the whole spending stack, self-contained (fetch + sections)
// ────────────────────────────────────────────────────────────────────────────

export function SpendingPanel() {
  const { locale } = useAppLocale();

  // Real data: all four ranges are fetched from the API. EMPTY_BUCKETS while loading/empty.
  const { buckets } = useBuckets();

  // Each section has its own range — deliberate; the user compares per section.
  const [rOverview, setROverview] = useState<Range>("30d");
  const [rCategories, setRCategories] = useState<Range>("30d");
  const [rProducts, setRProducts] = useState<Range>("30d");
  const [rMerchants, setRMerchants] = useState<Range>("30d");

  const overview = buckets[rOverview];
  const dCurrency = (n: number) => fmt(n, overview.totals.currency, locale);

  return (
    <div className="space-y-4">
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
        <MerchantsSection merchants={buckets[rMerchants].merchants} receipts={buckets[rMerchants].receipts ?? []} dCurrency={(n) => fmt(n, buckets[rMerchants].totals.currency, locale)} locale={locale} />
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
  const { locale } = useAppLocale();
  const tr = locale === "tr";
  const tabs: { key: Range; label: string }[] = [
    { key: "7d", label: tr ? "7G" : "7D" },
    { key: "30d", label: tr ? "30G" : "30D" },
    { key: "90d", label: tr ? "90G" : "90D" },
    { key: "all", label: tr ? "TÜM" : "ALL" },
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

// ────────────────────────────────────────────────────────────────────────────
// Categories — bubble grid + click-through detail panel
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
          receipts={(bucket.receipts ?? []).filter((r) => r.category === selected.key).slice(0, 8)}
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

/** The merchant tile's own receipts, newest first, capped for the inline list. */
function receiptsForMerchant(m: MerchantTile, receipts: InsightReceiptRow[]): InsightReceiptRow[] {
  const ids = new Set(m.receiptIds ?? []);
  return receipts.filter((r) => ids.has(r.id)).slice(0, 8);
}

function MerchantsSection({ merchants, receipts, dCurrency, locale }: { merchants: MerchantTile[]; receipts: InsightReceiptRow[]; dCurrency: (n: number) => string; locale: string }) {
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
          receipts={receiptsForMerchant(m, receipts)}
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
