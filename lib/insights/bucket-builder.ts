/**
 * Builds the insights "Bucket" shape (the structure /app/insights renders) from
 * real receipt data. Replaces the hardcoded BUCKETS mock in page.tsx.
 *
 * SERVER-ONLY: do not import in client components.
 *
 * Inputs:
 *  - ReceiptSummary[] for the selected range and the preceding range (for deltas),
 *    from getReceiptsByDateRangeForInsights (denormalized, fast).
 *  - Line items (geminiLineItems) for products/brands, from getLineItemsForRange.
 *  - Logo URLs from getLogoUrlsForMerchants (merchant_logos registry).
 *
 * No fabricated values: when a field has no data it is returned empty/zero, and
 * the UI shows its empty state. Deltas are null when there is no comparable
 * previous window.
 */

import type { ReceiptSummary } from "@/lib/insights/types";
import { shouldExcludeLineItem, buildUserNameFolds, isCategoryNameItem } from "./non-product-filter";
import { isJunkMerchantName, merchantGroupKey } from "./merchant-name-filter";

/** Maximum number of products shown in the Insights "top products" list. */
export const TOP_PRODUCTS_LIMIT = 10;
/** Maximum number of slices shown in the category distribution. */
export const CATEGORY_LIMIT = 10;
/** Maximum number of merchants shown in the "places you visit most" list. */
export const MERCHANT_LIMIT = 10;
/** Maximum number of brands shown in the "favorite brands" list. */
export const BRAND_LIMIT = 10;

export type Range = "7d" | "30d" | "90d" | "all";

export interface Totals {
  currency: string;
  totalSpend: number;
  receiptCount: number;
  merchantCount: number;
  avgBasket: number;
  deltaSpendPct: number;
  deltaReceipts: number;
  deltaBasketAbs: number;
}

export interface CategorySlice {
  key: string;
  label: string;
  amount: number;
  pct: number;
  deltaPct: number;
  color: string;
}

export interface ProductRow {
  name: string;
  brand: string;
  receiptCount: number;
  quantity: number;
  avgPrice: number;
  /** If the item name is actually a category name (e.g. "Yiyecek"/"Food"), the
   *  category key; the UI labels it like "<category> (general)". Undefined for
   *  a normal product. */
  categoryKey?: string;
}

export interface MerchantTile {
  name: string;
  category: string;
  visits: number;
  total: number;
  avgBasket: number;
  accent: string;
  initial: string;
  domain?: string;
  logoUrl?: string;
  timeline?: number[];
}

export interface BrandRow {
  name: string;
  hint: string;
  amount: number;
  deltaPct: number;
  ratio: number;
}

export interface Bucket {
  totals: Totals;
  categories: CategorySlice[];
  products: ProductRow[];
  merchants: MerchantTile[];
  brands: BrandRow[];
  heatmap: number[][];
  sparkline: number[];
}

export interface LineItemRow {
  name: string;
  brand: string | null;
  quantity: number | null;
  unitPrice: number | null;
  totalPrice: number | null;
  category: string | null;
  receiptId: string;
  date: string;
}

// A fixed, clearly distinct color per category. The category list shows at
// most 10 slices; the palette covers every canonical category that can appear
// in the list, so no two slices land on the same color.
const PAL: Record<string, string> = {
  grocery: "#E0B33C",       // gold
  restaurant: "#E54667",    // terracotta-pink
  cafe: "#EF6E3D",          // orange
  fuel: "#7B8AAB",          // slate
  marketplace: "#7C5CFF",   // purple-blue
  pharmacy: "#1FBF8F",      // teal
  electronics: "#3B82F6",   // blue
  apparel: "#C84BD4",       // magenta
  fashion: "#C84BD4",       // (same family as apparel)
  beauty: "#F472B6",        // pink
  personal_care: "#F472B6",
  home: "#A3795B",          // brown
  alcohol: "#8B5CF6",       // dark purple
  tobacco: "#6B7280",       // gray-brown
  utilities: "#0EA5A4",     // dark teal
  travel: "#22C55E",        // green
  hospitality_lodging: "#14B8A6",
  healthcare: "#EF4444",    // red
  services: "#64748B",      // dark slate
  convenience: "#94A3B8",   // neutral slate
  other: "#9CA3AF",         // neutral gray
};

// Slices must have distinct colors: if a color is already used, assign the next
// one from a fallback pool outside the palette. Color assignment happens inside
// buildCategories since catColor doesn't need a closure.
const FALLBACK_HUES = ["#F59E0B", "#10B981", "#6366F1", "#EC4899", "#06B6D4", "#84CC16", "#F97316", "#A855F7"];

const MERCHANT_ACCENTS = ["#F87171", "#34D399", "#E8C97A", "#C4B5FD", "#FDE68A", "#93C5FD", "#7DD3FC", "#FCA5A5"];

function catColor(key: string): string {
  return PAL[key] ?? PAL.other;
}

function pctDelta(cur: number, prev: number): number {
  if (prev <= 0) return 0;
  return Math.round(((cur - prev) / prev) * 100);
}

export function rangeDays(range: Range): number {
  if (range === "7d") return 7;
  if (range === "30d") return 30;
  if (range === "90d") return 90;
  return 100000;
}

function buildTotals(cur: ReceiptSummary[], prev: ReceiptSummary[], isAll: boolean): Totals {
  const currency = cur[0]?.currency ?? prev[0]?.currency ?? "TRY";
  const totalSpend = Math.round(cur.reduce((s, r) => s + (r.totalPaid || 0), 0));
  const receiptCount = cur.length;
  const merchantCount = new Set(cur.map((r) => r.merchantName)).size;
  const avgBasket = receiptCount > 0 ? Math.round(totalSpend / receiptCount) : 0;

  if (isAll || prev.length === 0) {
    return { currency, totalSpend, receiptCount, merchantCount, avgBasket, deltaSpendPct: 0, deltaReceipts: 0, deltaBasketAbs: 0 };
  }
  const prevSpend = Math.round(prev.reduce((s, r) => s + (r.totalPaid || 0), 0));
  const prevAvg = prev.length > 0 ? Math.round(prevSpend / prev.length) : 0;
  return {
    currency,
    totalSpend,
    receiptCount,
    merchantCount,
    avgBasket,
    deltaSpendPct: pctDelta(totalSpend, prevSpend),
    deltaReceipts: receiptCount - prev.length,
    deltaBasketAbs: avgBasket - prevAvg,
  };
}

function buildCategories(cur: ReceiptSummary[], prev: ReceiptSummary[]): CategorySlice[] {
  const curByCat = new Map<string, number>();
  for (const r of cur) {
    const k = r.category || "other";
    curByCat.set(k, (curByCat.get(k) ?? 0) + (r.totalPaid || 0));
  }
  const prevByCat = new Map<string, number>();
  for (const r of prev) {
    const k = r.category || "other";
    prevByCat.set(k, (prevByCat.get(k) ?? 0) + (r.totalPaid || 0));
  }
  const total = Array.from(curByCat.values()).reduce((s, v) => s + v, 0);
  const out: CategorySlice[] = [];
  for (const [key, amount] of curByCat) {
    out.push({
      key,
      // Label is returned as a key; the client translates it per locale (i18n).
      label: key,
      amount: Math.round(amount),
      pct: total > 0 ? Math.round((amount / total) * 100) : 0,
      deltaPct: pctDelta(amount, prevByCat.get(key) ?? 0),
      color: catColor(key),
    });
  }
  // Top 10 categories by spend; at most 10 slices.
  const top = out.sort((a, b) => b.amount - a.amount).slice(0, CATEGORY_LIMIT);
  // Each slice gets a distinct color: if two land on the same color, assign a unique one from the fallback pool.
  const used = new Set<string>();
  let fb = 0;
  for (const c of top) {
    if (used.has(c.color)) {
      while (fb < FALLBACK_HUES.length && used.has(FALLBACK_HUES[fb])) fb++;
      if (fb < FALLBACK_HUES.length) c.color = FALLBACK_HUES[fb++];
    }
    used.add(c.color);
  }
  return top;
}

function buildMerchants(cur: ReceiptSummary[], days: number, logoByName: Map<string, string>): MerchantTile[] {
  // Different spellings of the same merchant (legal suffix / TR-EN variants) are
  // grouped together. Since merchant_id is mostly null in this data, we group by
  // name normalization (merchantGroupKey). Display name: the spelling with the
  // most receipts in the group (longest on a tie, since the legal name is more
  // informative).
  interface Acc {
    visits: number;
    total: number;
    category: string;
    dates: string[];
    nameCounts: Map<string, number>;
  }
  const byGroup = new Map<string, Acc>();
  for (const r of cur) {
    const name = r.merchantName || "";
    if (isJunkMerchantName(name)) continue;
    const key = merchantGroupKey(name) || name.toLowerCase();
    const a: Acc = byGroup.get(key) ?? { visits: 0, total: 0, category: r.category || "other", dates: [], nameCounts: new Map<string, number>() };
    a.visits += 1;
    a.total += r.totalPaid || 0;
    a.dates.push(r.date);
    a.nameCounts.set(name, (a.nameCounts.get(name) ?? 0) + 1);
    byGroup.set(key, a);
  }

  // Prefix merging: if a short group key ("sevil") is a prefix of a longer key
  // ("sevil parfumeri"), merge it into that key. Two distinct long keys
  // ("sevil parfumeri" vs "sevil kozmetik") never merge into each other.
  const keys = Array.from(byGroup.keys()).sort((a, b) => a.length - b.length);
  for (const shortKey of keys) {
    const shortAcc = byGroup.get(shortKey);
    if (!shortAcc) continue; // already merged
    // Best long target: the key starting with shortKey + " " that has the most visits.
    let target: string | null = null;
    let targetVisits = -1;
    for (const otherKey of byGroup.keys()) {
      if (otherKey === shortKey) continue;
      if (otherKey.startsWith(shortKey + " ")) {
        const ov = byGroup.get(otherKey)!.visits;
        if (ov > targetVisits) { target = otherKey; targetVisits = ov; }
      }
    }
    if (target) {
      const t = byGroup.get(target)!;
      t.visits += shortAcc.visits;
      t.total += shortAcc.total;
      t.dates.push(...shortAcc.dates);
      for (const [n, c] of shortAcc.nameCounts) t.nameCounts.set(n, (t.nameCounts.get(n) ?? 0) + c);
      byGroup.delete(shortKey);
    }
  }

  function pickName(counts: Map<string, number>): string {
    let best = "";
    let bestCount = -1;
    for (const [n, c] of counts) {
      if (c > bestCount || (c === bestCount && n.length > best.length)) {
        best = n;
        bestCount = c;
      }
    }
    return best;
  }

  const tiles: MerchantTile[] = [];
  let idx = 0;
  const timelineLen = 30;
  const now = Date.now();
  for (const [, a] of byGroup) {
    const name = pickName(a.nameCounts);
    const timeline = new Array(timelineLen).fill(0);
    for (const d of a.dates) {
      const t = new Date(d).getTime();
      if (Number.isNaN(t)) continue;
      const dayAgo = Math.floor((now - t) / 86400000);
      if (dayAgo >= 0 && dayAgo < timelineLen) timeline[timelineLen - 1 - dayAgo] = 1;
    }
    tiles.push({
      name,
      // Category is returned as a key; the client translates it per locale (i18n).
      category: a.category,
      visits: a.visits,
      total: Math.round(a.total),
      avgBasket: a.visits > 0 ? Math.round(a.total / a.visits) : 0,
      accent: MERCHANT_ACCENTS[idx % MERCHANT_ACCENTS.length],
      initial: name.charAt(0).toUpperCase(),
      logoUrl: logoByName.get(name),
      timeline,
    });
    idx++;
  }
  // Top 10 merchants by spend.
  return tiles.sort((x, y) => y.total - x.total).slice(0, MERCHANT_LIMIT);
}

function buildProducts(items: LineItemRow[], userNameFolds: Set<string>): ProductRow[] {
  interface Acc { brand: string; receipts: Set<string>; qty: number; priceSum: number; priceN: number; isCat: boolean; catKey: string | null; }
  const byName = new Map<string, Acc>();
  for (const it of items) {
    const name = (it.name || "").trim();
    if (!name) continue;
    // Filter out non-product lines: discounts, totals, VAT, bags, invoice line items, OCR fragments, person names.
    if (shouldExcludeLineItem(name, it.totalPrice, it.category, userNameFolds)) continue;
    const price = it.unitPrice ?? it.totalPrice;
    const a = byName.get(name) ?? { brand: "", receipts: new Set(), qty: 0, priceSum: 0, priceN: 0, isCat: isCategoryNameItem(name), catKey: null };
    if (!a.brand && it.brand) a.brand = it.brand;
    // For a category-name item, keep the line's own category as context.
    if (a.isCat && !a.catKey && it.category) a.catKey = it.category;
    a.receipts.add(it.receiptId);
    a.qty += it.quantity ?? 1;
    if (price != null && Number.isFinite(price)) { a.priceSum += price; a.priceN += 1; }
    byName.set(name, a);
  }
  const out: ProductRow[] = [];
  for (const [name, a] of byName) {
    out.push({
      name,
      brand: a.brand,
      receiptCount: a.receipts.size,
      quantity: Math.round(a.qty),
      avgPrice: a.priceN > 0 ? Math.round(a.priceSum / a.priceN) : 0,
      categoryKey: a.isCat ? (a.catKey ?? undefined) : undefined,
    });
  }
  return out
    .sort((x, y) => y.receiptCount - x.receiptCount || y.quantity - x.quantity)
    .slice(0, TOP_PRODUCTS_LIMIT);
}

function buildBrands(items: LineItemRow[], userNameFolds: Set<string>): BrandRow[] {
  // Favorite brands are ranked by FREQUENCY: how many separate purchases
  // (line items) a brand appears in. Amount is shown for information only.
  const byBrand = new Map<string, { count: number; amount: number; hints: Set<string> }>();
  for (const it of items) {
    const brand = (it.brand || "").trim();
    if (!brand) continue;
    // Old column-shift records may have a number/quantity in the brand field
    // ("0.56", "1.0"). A brand is a name: skip any value with no letters.
    if (!/\p{L}/u.test(brand)) continue;
    // Don't count the brand of non-product lines (bag/invoice/discount/name).
    if (shouldExcludeLineItem(it.name, it.totalPrice, it.category, userNameFolds)) continue;
    const amt = it.totalPrice ?? (it.unitPrice != null && it.quantity != null ? it.unitPrice * it.quantity : it.unitPrice);
    const e = byBrand.get(brand) ?? { count: 0, amount: 0, hints: new Set<string>() };
    e.count += 1;
    if (amt != null && Number.isFinite(amt)) e.amount += amt;
    if (it.name) e.hints.add(it.name.split(" ")[0].toLowerCase());
    byBrand.set(brand, e);
  }
  const arr = Array.from(byBrand.entries()).map(([name, e]) => ({
    name,
    count: e.count,
    amount: Math.round(e.amount),
    hint: Array.from(e.hints).slice(0, 3).join(" · "),
  }));
  // Sort by frequency; amount breaks ties. Top 10 brands.
  arr.sort((a, b) => b.count - a.count || b.amount - a.amount);
  const top = arr.slice(0, BRAND_LIMIT);
  const maxCount = top[0]?.count ?? 0;
  // ratio: bar width reflects frequency (the most frequent brand = 1.0).
  return top.map((b) => ({
    name: b.name,
    hint: b.hint,
    amount: b.amount,
    deltaPct: 0,
    ratio: maxCount > 0 ? Number((b.count / maxCount).toFixed(2)) : 0,
  }));
}

function buildHeatmap(cur: ReceiptSummary[]): number[][] {
  const m: number[][] = Array.from({ length: 7 }, () => new Array(24).fill(0));
  for (const r of cur) {
    const d = new Date(r.date);
    if (Number.isNaN(d.getTime())) continue;
    const dow = (d.getDay() + 6) % 7;
    let hour = 12;
    if (r.time && /^\d{1,2}:/.test(r.time)) hour = Math.min(23, Math.max(0, parseInt(r.time.split(":")[0], 10)));
    m[dow][hour] += 1;
  }
  return m;
}

function buildSparkline(cur: ReceiptSummary[], days: number): number[] {
  const span = Math.min(days, 30);
  const buckets = new Array(span).fill(0);
  const now = Date.now();
  for (const r of cur) {
    const t = new Date(r.date).getTime();
    if (Number.isNaN(t)) continue;
    const dayAgo = Math.floor((now - t) / 86400000);
    if (dayAgo >= 0 && dayAgo < span) buckets[span - 1 - dayAgo] += r.totalPaid || 0;
  }
  return buckets.map((v) => Math.round(v));
}

export function buildBucket(args: {
  range: Range;
  current: ReceiptSummary[];
  previous: ReceiptSummary[];
  items: LineItemRow[];
  logoByMerchant: Map<string, string>;
  /** Signed-in user's display name — its line-item rows are excluded from products. */
  userDisplayName?: string | null;
}): Bucket {
  const { range, current, previous, items, logoByMerchant, userDisplayName } = args;
  const days = rangeDays(range);
  const isAll = range === "all";
  const userNameFolds = buildUserNameFolds(userDisplayName);
  return {
    totals: buildTotals(current, previous, isAll),
    categories: buildCategories(current, previous),
    products: buildProducts(items, userNameFolds),
    merchants: buildMerchants(current, days, logoByMerchant),
    brands: buildBrands(items, userNameFolds),
    heatmap: buildHeatmap(current),
    sparkline: buildSparkline(current, days),
  };
}
