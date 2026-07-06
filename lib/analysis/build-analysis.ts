/**
 * build-analysis — assembles the AnalysisPayload for /api/analysis.
 *
 * Data sources (verified against the live schema):
 *   - receipt_line_items (populated; canonical_name/brand/pack_size/unit_type/
 *     quantity/unit_price_gross/line_total_gross/observed_at/category_lvl1).
 *     Falls back to receipt_data->'geminiLineItems' only when the user has no
 *     rows in receipt_line_items.
 *   - receipts (extraction_date_value / extraction_time_value / totals /
 *     hidden_cost_core / pricing_currency / expense_type).
 *   - users.country + user_profiles.city.
 *   - economic_indices via getEconomicIndexFromDB (CPI GENEL + COICOP).
 *
 * Every section degrades to null / [] when data is insufficient. No fabricated
 * values. Defensive parsing throughout: a malformed row is skipped, never thrown.
 */

import { sql } from "@/lib/db/client";
import { getEconomicIndexFromDB } from "@/lib/db/economicIndex";
import type { CountryCode } from "@/lib/mining/types";
import {
  normalizeProductCategoryLvl1,
  type CanonicalProductCategory,
} from "@/lib/receipt/category-taxonomy";
import { fold, isNonProductLine } from "@/lib/insights/non-product-filter";
import type {
  AnalysisPayload,
  AnalysisOverview,
  PriceTrack,
  MerchantComparison,
  MerchantPriceRow,
  UnitTrap,
  TimeHeatmap,
  LoyaltyItem,
  PersonalInflation,
  ShrinkflationHit,
  PurchasingPower,
  CategoryInflationRow,
  CommunityComparison,
} from "./types";

// ── Thresholds (kept in code by design; never documented publicly) ──────────
const WINDOW_DAYS = 365;
const TRACK_MIN_OBSERVATIONS = 3;
const TRACK_MIN_SPAN_DAYS = 14;
const TRACK_MIN_DISTINCT_WEEKS = 2;
const PRICE_TRACK_LIMIT = 5;
const MERCHANT_MIN_SHARED_ITEMS = 3;
const MERCHANT_MIN_PURCHASES = 3;
const MERCHANT_ROW_LIMIT = 12;
const UNIT_TRAP_MIN_MARKUP = 0.1;
const UNIT_TRAP_LIMIT = 5;
const LOYALTY_MIN_PURCHASES = 6;
const LOYALTY_LIMIT = 5;
const INFLATION_MIN_WINDOW_DAYS = 90;
const INFLATION_MIN_PRODUCTS = 3;
const SHRINKFLATION_LIMIT = 5;
const COMMUNITY_MIN_CONTRIBUTORS = 3;
const PURCHASING_POWER_BASE = 1000;

const DAY_MS = 86_400_000;

// ── Internal row shapes ─────────────────────────────────────────────────────

interface ReceiptRow {
  receiptId: string;
  date: string; // YYYY-MM-DD
  time: string | null; // HH:MM when usable
  total: number | null;
  hiddenCost: number | null;
  currency: string | null;
  merchant: string | null;
}

interface ItemRow {
  receiptId: string;
  date: string; // YYYY-MM-DD
  merchant: string | null;
  currency: string | null;
  name: string; // canonical_name preferred, raw_name fallback
  brand: string | null;
  packSize: number | null;
  unitType: string | null;
  quantity: number;
  unitPriceGross: number | null;
  lineTotalGross: number | null;
  categoryLvl1: string | null;
  categoryLvl2: string | null;
  documentType: string | null;
}

interface Observation {
  date: Date;
  dateStr: string;
  unitPrice: number; // normalised per pack unit
  perPackPrice: number | null; // line total / quantity
  spend: number;
  quantity: number;
}

interface ProductSeries {
  key: string;
  name: string;
  brand: string | null;
  packSize: number | null;
  unitType: string | null;
  category: CanonicalProductCategory | null;
  observations: Observation[]; // sorted ascending by date
}

// ── Small helpers ───────────────────────────────────────────────────────────

function toNum(v: unknown): number | null {
  if (v == null || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function toStr(v: unknown): string | null {
  return typeof v === "string" && v.trim() !== "" ? v.trim() : null;
}

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

function round(n: number, digits = 4): number {
  const f = 10 ** digits;
  return Math.round(n * f) / f;
}

function normaliseText(input: string): string {
  return input
    .toLocaleLowerCase("tr-TR")
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/gi, "_")
    .replace(/^_|_$/g, "");
}

function parseDateStr(dateStr: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}/.test(dateStr)) return null;
  const d = new Date(`${dateStr.slice(0, 10)}T00:00:00Z`);
  return Number.isNaN(d.getTime()) ? null : d;
}

function weekKey(date: Date): string {
  const year = date.getUTCFullYear();
  const jan1 = new Date(Date.UTC(year, 0, 1));
  const offset = Math.floor((date.getTime() - jan1.getTime()) / DAY_MS);
  return `${year}-${Math.floor((offset + jan1.getUTCDay()) / 7)}`;
}

/**
 * Normalised unit price per pack unit — mirrors the client-side
 * own-price-track logic without depending on the offline cache types.
 */
function normalisedUnitPrice(item: ItemRow): number | null {
  const qty = item.quantity || 1;
  if (item.lineTotalGross && item.packSize && item.packSize > 0) {
    const perUnit = item.lineTotalGross / qty / item.packSize;
    if (Number.isFinite(perUnit) && perUnit > 0) return perUnit;
  }
  if (item.unitPriceGross && item.unitPriceGross > 0) {
    return item.packSize && item.packSize > 0
      ? item.unitPriceGross / item.packSize
      : item.unitPriceGross;
  }
  if (item.lineTotalGross && item.lineTotalGross > 0 && qty > 0) {
    return item.lineTotalGross / qty;
  }
  return null;
}

function productKey(item: ItemRow): string | null {
  const name = item.name?.trim();
  if (!name) return null;
  const parts = [normaliseText(name)];
  if (item.packSize != null) parts.push(`p${item.packSize}`);
  if (item.unitType) parts.push(item.unitType.slice(0, 4));
  return parts.join(":");
}

// ── Data loading ────────────────────────────────────────────────────────────

async function loadReceipts(username: string, start: Date): Promise<ReceiptRow[]> {
  const startStr = start.toISOString().slice(0, 10);
  const rows = (await sql`
    SELECT
      r.receipt_id,
      COALESCE(NULLIF(r.extraction_date_value, ''), to_char(r.created_at, 'YYYY-MM-DD')) AS dt,
      NULLIF(r.extraction_time_value, '') AS tm,
      COALESCE(r.pricing_total_paid, r.extraction_total_value) AS total,
      r.hidden_cost_core AS hidden_cost,
      r.pricing_currency AS currency,
      r.merchant_name AS merchant
    FROM receipts r
    WHERE r.username = ${username}
      AND COALESCE(r.expense_type, 'personal') = 'personal'
      AND COALESCE(NULLIF(r.extraction_date_value, ''), to_char(r.created_at, 'YYYY-MM-DD')) >= ${startStr}
  `) as Record<string, unknown>[];

  const out: ReceiptRow[] = [];
  for (const row of Array.isArray(rows) ? rows : []) {
    const date = typeof row.dt === "string" ? row.dt.slice(0, 10) : null;
    if (!date || !parseDateStr(date)) continue;
    out.push({
      receiptId: String(row.receipt_id ?? ""),
      date,
      time: toStr(row.tm),
      total: toNum(row.total),
      hiddenCost: toNum(row.hidden_cost),
      currency: toStr(row.currency),
      merchant: toStr(row.merchant),
    });
  }
  return out;
}

/** Primary path: the structured receipt_line_items table. */
async function loadLineItemsFromTable(username: string, start: Date): Promise<ItemRow[]> {
  const startStr = start.toISOString().slice(0, 10);
  const rows = (await sql`
    SELECT
      i.receipt_id,
      COALESCE(
        to_char(i.observed_at, 'YYYY-MM-DD'),
        NULLIF(r.extraction_date_value, ''),
        to_char(r.created_at, 'YYYY-MM-DD')
      ) AS dt,
      r.merchant_name AS merchant,
      r.pricing_currency AS currency,
      COALESCE(NULLIF(i.canonical_name, ''), i.raw_name) AS name,
      NULLIF(i.brand, '') AS brand,
      i.pack_size,
      NULLIF(i.unit_type, '') AS unit_type,
      i.quantity,
      COALESCE(i.unit_price_gross, i.unit_price) AS unit_price_gross,
      COALESCE(i.line_total_gross, i.line_total) AS line_total_gross,
      i.category_lvl1,
      i.category_lvl2,
      r.document_type
    FROM receipt_line_items i
    JOIN receipts r ON r.receipt_id = i.receipt_id
    WHERE r.username = ${username}
      AND COALESCE(r.expense_type, 'personal') = 'personal'
      AND COALESCE(NULLIF(r.extraction_date_value, ''), to_char(r.created_at, 'YYYY-MM-DD')) >= ${startStr}
  `) as Record<string, unknown>[];
  return mapItemRows(rows);
}

/** Fallback path: receipt_data->'geminiLineItems' JSONB for older data. */
async function loadLineItemsFromJson(username: string, start: Date): Promise<ItemRow[]> {
  const startStr = start.toISOString().slice(0, 10);
  const rows = (await sql`
    SELECT
      r.receipt_id,
      COALESCE(NULLIF(r.extraction_date_value, ''), to_char(r.created_at, 'YYYY-MM-DD')) AS dt,
      r.merchant_name AS merchant,
      r.pricing_currency AS currency,
      it->>'name' AS name,
      NULLIF(it->>'brand', '') AS brand,
      NULL::numeric AS pack_size,
      NULL::text AS unit_type,
      it->>'quantity' AS quantity,
      it->>'unitPrice' AS unit_price_gross,
      it->>'totalPrice' AS line_total_gross,
      it->>'category' AS category_lvl1,
      NULL::text AS category_lvl2,
      r.document_type
    FROM receipts r
    CROSS JOIN LATERAL jsonb_array_elements(
      CASE WHEN jsonb_typeof(r.receipt_data->'geminiLineItems') = 'array'
           THEN r.receipt_data->'geminiLineItems' ELSE '[]'::jsonb END
    ) AS it
    WHERE r.username = ${username}
      AND COALESCE(r.expense_type, 'personal') = 'personal'
      AND COALESCE(NULLIF(r.extraction_date_value, ''), to_char(r.created_at, 'YYYY-MM-DD')) >= ${startStr}
  `) as Record<string, unknown>[];
  return mapItemRows(rows);
}

function mapItemRows(rows: Record<string, unknown>[]): ItemRow[] {
  const out: ItemRow[] = [];
  for (const row of Array.isArray(rows) ? rows : []) {
    try {
      const name = toStr(row.name);
      const date = typeof row.dt === "string" ? row.dt.slice(0, 10) : null;
      if (!name || !date || !parseDateStr(date)) continue;
      out.push({
        receiptId: String(row.receipt_id ?? ""),
        date,
        merchant: toStr(row.merchant),
        currency: toStr(row.currency),
        name,
        brand: toStr(row.brand),
        packSize: toNum(row.pack_size),
        unitType: toStr(row.unit_type),
        quantity: toNum(row.quantity) ?? 1,
        unitPriceGross: toNum(row.unit_price_gross),
        lineTotalGross: toNum(row.line_total_gross),
        categoryLvl1: toStr(row.category_lvl1),
        categoryLvl2: toStr(row.category_lvl2),
        documentType: toStr(row.document_type),
      });
    } catch {
      // malformed row → skip
    }
  }
  return out;
}

async function loadUserProfile(
  username: string
): Promise<{ country: string | null; city: string | null }> {
  try {
    const rows = (await sql`
      SELECT u.country, NULLIF(p.city, '') AS city
      FROM users u
      LEFT JOIN user_profiles p ON p.username = u.username
      WHERE u.username = ${username}
      LIMIT 1
    `) as Record<string, unknown>[];
    return { country: toStr(rows[0]?.country), city: toStr(rows[0]?.city) };
  } catch (err) {
    console.error("[analysis] loadUserProfile failed:", err);
    return { country: null, city: null };
  }
}

async function loadReceiptCount(username: string): Promise<number> {
  try {
    const rows = (await sql`
      SELECT count(*)::int AS c FROM receipts
      WHERE username = ${username} AND COALESCE(expense_type, 'personal') = 'personal'
    `) as Record<string, unknown>[];
    return toNum(rows[0]?.c) ?? 0;
  } catch (err) {
    console.error("[analysis] loadReceiptCount failed:", err);
    return 0;
  }
}

// ── Series construction ─────────────────────────────────────────────────────

function buildSeries(items: ItemRow[]): Map<string, ProductSeries> {
  const byKey = new Map<string, ProductSeries>();
  for (const item of items) {
    const key = productKey(item);
    if (!key) continue;
    const unitPrice = normalisedUnitPrice(item);
    if (unitPrice === null) continue;
    const date = parseDateStr(item.date);
    if (!date) continue;

    let series = byKey.get(key);
    if (!series) {
      series = {
        key,
        name: item.name,
        brand: item.brand,
        packSize: item.packSize,
        unitType: item.unitType,
        category: normalizeProductCategoryLvl1(item.categoryLvl1),
        observations: [],
      };
      byKey.set(key, series);
    }
    const qty = item.quantity || 1;
    const spend =
      item.lineTotalGross ??
      (item.unitPriceGross != null ? item.unitPriceGross * qty : unitPrice * qty);
    series.observations.push({
      date,
      dateStr: item.date,
      unitPrice,
      perPackPrice:
        item.lineTotalGross != null && qty > 0
          ? item.lineTotalGross / qty
          : item.unitPriceGross,
      spend: spend > 0 ? spend : 0,
      quantity: qty,
    });
  }
  for (const series of byKey.values()) {
    series.observations.sort((a, b) => a.date.getTime() - b.date.getTime());
  }
  return byKey;
}

interface SeriesDrift {
  deltaRatio: number;
  baseline: number;
  latest: number;
  spanDays: number;
  sampleSize: number;
}

/** Latest observation vs prior-median drift; null when the series is too thin. */
function seriesDrift(series: ProductSeries): SeriesDrift | null {
  const obs = series.observations;
  if (obs.length < TRACK_MIN_OBSERVATIONS) return null;
  const distinctWeeks = new Set(obs.map((o) => weekKey(o.date)));
  if (distinctWeeks.size < TRACK_MIN_DISTINCT_WEEKS) return null;
  const spanDays = (obs[obs.length - 1].date.getTime() - obs[0].date.getTime()) / DAY_MS;
  if (spanDays < TRACK_MIN_SPAN_DAYS) return null;
  const latest = obs[obs.length - 1];
  const baseline = median(obs.slice(0, -1).map((o) => o.unitPrice));
  if (baseline <= 0) return null;
  return {
    deltaRatio: (latest.unitPrice - baseline) / baseline,
    baseline,
    latest: latest.unitPrice,
    spanDays,
    sampleSize: obs.length,
  };
}

// ── Section builders ────────────────────────────────────────────────────────

function buildOverview(receipts: ReceiptRow[], receiptCount: number, now: Date): AnalysisOverview {
  const curMonth = now.toISOString().slice(0, 7);
  const prevDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1));
  const prevMonth = prevDate.toISOString().slice(0, 7);

  let monthTotal = 0;
  let prevMonthTotal = 0;
  let prevMonthHasReceipts = false;
  let hiddenCostMonth = 0;
  let hiddenCostSeen = false;

  for (const r of receipts) {
    const ym = r.date.slice(0, 7);
    if (ym === curMonth) {
      if (r.total != null) monthTotal += r.total;
      if (r.hiddenCost != null) {
        hiddenCostMonth += r.hiddenCost;
        hiddenCostSeen = true;
      }
    } else if (ym === prevMonth) {
      prevMonthHasReceipts = true;
      if (r.total != null) prevMonthTotal += r.total;
    }
  }

  return {
    monthTotal: round(monthTotal, 2),
    prevMonthTotal: prevMonthHasReceipts ? round(prevMonthTotal, 2) : null,
    hiddenCostMonth: hiddenCostSeen ? round(hiddenCostMonth, 2) : null,
    receiptCount,
  };
}

function buildPriceTracks(seriesByKey: Map<string, ProductSeries>): PriceTrack[] {
  const tracks: PriceTrack[] = [];
  for (const series of seriesByKey.values()) {
    const drift = seriesDrift(series);
    if (!drift || drift.deltaRatio === 0) continue;
    tracks.push({
      name: series.name,
      brand: series.brand,
      packSize: series.packSize,
      unitType: series.unitType,
      series: series.observations.map((o) => ({
        date: o.dateStr,
        unitPrice: round(o.unitPrice),
      })),
      deltaRatio: round(drift.deltaRatio),
      baselineUnitPrice: round(drift.baseline),
      latestUnitPrice: round(drift.latest),
      sampleSize: drift.sampleSize,
      spanDays: Math.round(drift.spanDays),
    });
  }
  return tracks
    .sort((a, b) => Math.abs(b.deltaRatio) - Math.abs(a.deltaRatio))
    .slice(0, PRICE_TRACK_LIMIT);
}

/** Bill-style documents record payments, not shoppable products. */
const BILL_DOCUMENT_TYPES = new Set([
  "e_invoice",
  "payment_receipt",
  "bank_statement",
  "order_list",
]);

/** Utility/bill line items — payments, not comparable basket products. */
function isBillLikeItem(item: ItemRow): boolean {
  if (item.documentType && BILL_DOCUMENT_TYPES.has(item.documentType)) return true;
  const lvl1 = normalizeProductCategoryLvl1(item.categoryLvl1);
  if (lvl1 === "services") return true;
  const lvl2 = item.categoryLvl2 ? fold(item.categoryLvl2) : "";
  if (/(utility|fatura|bedel|abonelik|atik|belediye|hizmet)/.test(lvl2)) return true;
  // Bill/tax/rounding/payment names (KDV, yuvarlama, atık su bedeli, …).
  if (isNonProductLine(item.name)) return true;
  const name = fold(item.name);
  return /(bedel|fatura|tuketim|abonelik|tahsilat|taksit|donem tutar)/.test(name);
}

/**
 * Merchant comparison built on a product-relative index so that each
 * merchant's differing product mix cannot skew the number:
 *
 *   1. Comparison basis = canonical items the user bought at 2+ merchants,
 *      excluding bill-like documents/items.
 *   2. Per shared item, each merchant's median unit price is expressed as a
 *      ratio to the item's all-merchant median.
 *   3. A merchant enters only when it covers >= MERCHANT_MIN_SHARED_ITEMS of
 *      the shared items with >= MERCHANT_MIN_PURCHASES purchases; its value =
 *      median(ratios) x median cost of the shared basket — a money-readable
 *      figure written into `avgUnitPrice` (contract unchanged).
 */
function buildMerchantComparison(items: ItemRow[]): MerchantComparison | null {
  // canonical item key (name only, unit-aware) → merchant → unit prices
  const byItem = new Map<string, Map<string, number[]>>();
  for (const item of items) {
    if (!item.merchant) continue;
    if (isBillLikeItem(item)) continue;
    const name = normaliseText(item.name);
    if (!name) continue;
    const unitPrice = normalisedUnitPrice(item);
    if (unitPrice === null) continue;
    const itemKey = item.unitType ? `${name}:${item.unitType.slice(0, 4)}` : name;
    let merchants = byItem.get(itemKey);
    if (!merchants) {
      merchants = new Map();
      byItem.set(itemKey, merchants);
    }
    const prices = merchants.get(item.merchant) ?? [];
    prices.push(unitPrice);
    merchants.set(item.merchant, prices);
  }

  // Keep only items bought at 2+ merchants.
  const comparable = [...byItem.entries()].filter(([, m]) => m.size >= 2);
  if (comparable.length === 0) return null;

  // Per-item all-merchant median, and the median cost of the shared basket.
  const itemMedians = new Map<string, number>();
  for (const [itemKey, merchants] of comparable) {
    const allPrices = [...merchants.values()].flat();
    const m = median(allPrices);
    if (m > 0) itemMedians.set(itemKey, m);
  }
  if (itemMedians.size === 0) return null;
  const basketMedianCost = median([...itemMedians.values()]);
  if (basketMedianCost <= 0) return null;

  // Per merchant: ratios of its per-item median to the item's overall median.
  const byMerchant = new Map<string, { ratios: number[]; purchases: number }>();
  for (const [itemKey, merchants] of comparable) {
    const itemMedian = itemMedians.get(itemKey);
    if (!itemMedian) continue;
    for (const [merchant, prices] of merchants) {
      let agg = byMerchant.get(merchant);
      if (!agg) {
        agg = { ratios: [], purchases: 0 };
        byMerchant.set(merchant, agg);
      }
      agg.ratios.push(median(prices) / itemMedian);
      agg.purchases += prices.length;
    }
  }

  const rows: MerchantPriceRow[] = [];
  for (const [merchant, agg] of byMerchant) {
    if (agg.ratios.length < MERCHANT_MIN_SHARED_ITEMS) continue;
    if (agg.purchases < MERCHANT_MIN_PURCHASES) continue;
    rows.push({
      merchant,
      avgUnitPrice: round(median(agg.ratios) * basketMedianCost, 2),
      purchaseCount: agg.purchases,
    });
  }
  if (rows.length < 2) return null;
  rows.sort((a, b) => a.avgUnitPrice - b.avgUnitPrice);
  return { itemCount: comparable.length, rows: rows.slice(0, MERCHANT_ROW_LIMIT) };
}

function buildUnitTraps(items: ItemRow[]): UnitTrap[] {
  // canonical name + unit type → pack size → per-unit prices.
  // No crowd view exists in the live schema (mv_receipt_price_reference is
  // absent), so traps come from the user's own observations only.
  const byProduct = new Map<
    string,
    { name: string; unitType: string; packs: Map<number, number[]> }
  >();
  for (const item of items) {
    if (!item.unitType || !item.packSize || item.packSize <= 0) continue;
    const unitPrice = normalisedUnitPrice(item);
    if (unitPrice === null) continue;
    const key = `${normaliseText(item.name)}:${item.unitType.slice(0, 4)}`;
    let entry = byProduct.get(key);
    if (!entry) {
      entry = { name: item.name, unitType: item.unitType, packs: new Map() };
      byProduct.set(key, entry);
    }
    const prices = entry.packs.get(item.packSize) ?? [];
    prices.push(unitPrice);
    entry.packs.set(item.packSize, prices);
  }

  const traps: UnitTrap[] = [];
  for (const entry of byProduct.values()) {
    if (entry.packs.size < 2) continue;
    const packs = [...entry.packs.entries()]
      .map(([size, prices]) => ({ size, perUnit: median(prices) }))
      .sort((a, b) => a.size - b.size);
    const small = packs[0];
    const largerCheapest = packs
      .slice(1)
      .reduce((best, p) => (p.perUnit < best.perUnit ? p : best), packs[1]);
    if (small.perUnit <= 0 || largerCheapest.perUnit <= 0) continue;
    const savingsRatio = (small.perUnit - largerCheapest.perUnit) / small.perUnit;
    if (savingsRatio < UNIT_TRAP_MIN_MARKUP) continue;
    traps.push({
      name: entry.name,
      packSize: small.size,
      unitType: entry.unitType,
      perUnitPaid: round(small.perUnit),
      perUnitAlt: round(largerCheapest.perUnit),
      altPackSize: largerCheapest.size,
      savingsRatio: round(savingsRatio),
    });
  }
  return traps.sort((a, b) => b.savingsRatio - a.savingsRatio).slice(0, UNIT_TRAP_LIMIT);
}

function buildTimeHeatmap(receipts: ReceiptRow[]): TimeHeatmap | null {
  // rows: 0=morning 06-11, 1=noon 11-17, 2=evening 17-21, 3=night 21-06
  const grid: number[][] = Array.from({ length: 4 }, () => Array(7).fill(0));
  let sampleSize = 0;
  let nightCount = 0;

  for (const r of receipts) {
    if (!r.time) continue;
    const match = /^(\d{1,2})[:.](\d{2})/.exec(r.time);
    if (!match) continue;
    const hour = Number(match[1]);
    if (!Number.isInteger(hour) || hour < 0 || hour > 23) continue;
    const date = parseDateStr(r.date);
    if (!date) continue;
    const dow = (date.getUTCDay() + 6) % 7; // 0=Mon..6=Sun
    const slot = hour >= 6 && hour < 11 ? 0 : hour >= 11 && hour < 17 ? 1 : hour >= 17 && hour < 21 ? 2 : 3;
    grid[slot][dow] += 1;
    sampleSize += 1;
    if (hour >= 21 || hour < 6) nightCount += 1;
  }

  if (sampleSize === 0) return null;
  return {
    grid,
    nightShare: round(nightCount / sampleSize),
    sampleSize,
  };
}

function buildLoyalty(seriesByKey: Map<string, ProductSeries>, windowDays: number): LoyaltyItem[] {
  const items: Array<LoyaltyItem & { purchases: number }> = [];
  for (const series of seriesByKey.values()) {
    const obs = series.observations;
    if (obs.length < LOYALTY_MIN_PURCHASES) continue;
    const spend = obs.reduce((acc, o) => acc + o.spend, 0);
    const drift = seriesDrift(series);
    items.push({
      name: series.name,
      purchasesPerMonth: round(obs.length / (windowDays / 30.44), 2),
      annualizedSpend: round(spend * (365 / windowDays), 2),
      deltaRatio: drift ? round(drift.deltaRatio) : null,
      purchases: obs.length,
    });
  }
  return items
    .sort((a, b) => b.purchases - a.purchases)
    .slice(0, LOYALTY_LIMIT)
    .map(({ purchases: _purchases, ...item }) => item);
}

/**
 * Spend-weighted, annualised personal price drift across repeat-purchase
 * series. Each qualifying series contributes its latest-vs-baseline drift
 * scaled to a 365-day rate, weighted by observed spend on that series.
 */
function buildPersonalInflationCore(
  seriesByKey: Map<string, ProductSeries>
): { personalPct: number; windowDays: number; productCount: number } | null {
  let weightedSum = 0;
  let weightTotal = 0;
  let productCount = 0;
  let earliest: number | null = null;
  let latest: number | null = null;

  for (const series of seriesByKey.values()) {
    const drift = seriesDrift(series);
    if (!drift) continue;
    const spend = series.observations.reduce((acc, o) => acc + o.spend, 0);
    if (spend <= 0) continue;
    // Annualise on a >=90-day denominator: shorter spans would multiply
    // single-purchase noise by up to 26x and fabricate extreme rates.
    const annualised = drift.deltaRatio * (365 / Math.max(drift.spanDays, INFLATION_MIN_WINDOW_DAYS));
    weightedSum += annualised * spend;
    weightTotal += spend;
    productCount += 1;
    const first = series.observations[0].date.getTime();
    const last = series.observations[series.observations.length - 1].date.getTime();
    earliest = earliest === null ? first : Math.min(earliest, first);
    latest = latest === null ? last : Math.max(latest, last);
  }

  if (productCount < INFLATION_MIN_PRODUCTS || weightTotal <= 0) return null;
  const windowDays = earliest !== null && latest !== null ? (latest - earliest) / DAY_MS : 0;
  if (windowDays < INFLATION_MIN_WINDOW_DAYS) return null;

  return {
    personalPct: round(weightedSum / weightTotal),
    windowDays: Math.round(windowDays),
    productCount,
  };
}

function buildShrinkflation(items: ItemRow[]): ShrinkflationHit[] {
  // canonical + brand + unit_type → chronological pack-size observations.
  const byProduct = new Map<
    string,
    {
      name: string;
      brand: string | null;
      unitType: string;
      obs: Array<{ date: Date; dateStr: string; packSize: number; perPack: number }>;
    }
  >();
  for (const item of items) {
    if (!item.unitType || !item.packSize || item.packSize <= 0) continue;
    const qty = item.quantity || 1;
    const perPack =
      item.lineTotalGross != null && qty > 0 ? item.lineTotalGross / qty : item.unitPriceGross;
    if (perPack == null || perPack <= 0) continue;
    const date = parseDateStr(item.date);
    if (!date) continue;
    const key = `${normaliseText(item.name)}:${normaliseText(item.brand ?? "")}:${item.unitType.slice(0, 4)}`;
    let entry = byProduct.get(key);
    if (!entry) {
      entry = { name: item.name, brand: item.brand, unitType: item.unitType, obs: [] };
      byProduct.set(key, entry);
    }
    entry.obs.push({ date, dateStr: item.date, packSize: item.packSize, perPack });
  }

  const hits: ShrinkflationHit[] = [];
  for (const entry of byProduct.values()) {
    if (entry.obs.length < 2) continue;
    entry.obs.sort((a, b) => a.date.getTime() - b.date.getTime());
    // Find the first transition to a smaller pack whose per-pack price held or rose.
    for (let i = 1; i < entry.obs.length; i++) {
      const prev = entry.obs[i - 1];
      const cur = entry.obs[i];
      if (cur.packSize < prev.packSize && cur.perPack >= prev.perPack * 0.98) {
        hits.push({
          name: entry.name,
          brand: entry.brand,
          unitType: entry.unitType,
          oldPackSize: prev.packSize,
          newPackSize: cur.packSize,
          observedAt: cur.dateStr,
          impliedPct: round(prev.packSize / cur.packSize - 1),
        });
        break;
      }
    }
  }
  return hits.sort((a, b) => b.impliedPct - a.impliedPct).slice(0, SHRINKFLATION_LIMIT);
}

async function buildPurchasingPower(country: string | null): Promise<PurchasingPower | null> {
  if (!country) return null;
  try {
    const now = new Date();
    const ym = (monthsAgo: number) =>
      new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - monthsAgo, 1))
        .toISOString()
        .slice(0, 7);
    const [idxNow, idx6, idx12] = await Promise.all([
      getEconomicIndexFromDB(country as CountryCode, "CPI", ym(0), "GENEL"),
      getEconomicIndexFromDB(country as CountryCode, "CPI", ym(6), "GENEL"),
      getEconomicIndexFromDB(country as CountryCode, "CPI", ym(12), "GENEL"),
    ]);
    if (!idxNow || idxNow <= 0) return null;
    const steps = [];
    if (idx6 && idx6 > 0) {
      steps.push({ monthsAgo: 6, equivalentValue: round((PURCHASING_POWER_BASE * idx6) / idxNow, 2) });
    }
    if (idx12 && idx12 > 0) {
      steps.push({ monthsAgo: 12, equivalentValue: round((PURCHASING_POWER_BASE * idx12) / idxNow, 2) });
    }
    if (steps.length === 0) return null;
    return { baseAmount: PURCHASING_POWER_BASE, steps, source: `economic_indices CPI GENEL (${country})` };
  } catch (err) {
    console.error("[analysis] buildPurchasingPower failed:", err);
    return null;
  }
}

/** Official CPI YoY for a series ('GENEL' or a COICOP division). */
async function cpiYoY(country: string | null, series: string): Promise<number | null> {
  if (!country) return null;
  try {
    const now = new Date();
    const ymNow = now.toISOString().slice(0, 7);
    const ymPrev = new Date(Date.UTC(now.getUTCFullYear() - 1, now.getUTCMonth(), 1))
      .toISOString()
      .slice(0, 7);
    const [cur, prev] = await Promise.all([
      getEconomicIndexFromDB(country as CountryCode, "CPI", ymNow, series),
      getEconomicIndexFromDB(country as CountryCode, "CPI", ymPrev, series),
    ]);
    if (!cur || !prev || prev <= 0) return null;
    return round(cur / prev - 1);
  } catch (err) {
    console.error(`[analysis] cpiYoY(${country}, ${series}) failed:`, err);
    return null;
  }
}

/** Canonical lvl1 category → COICOP division carried by economic_indices. */
const CATEGORY_TO_COICOP: Partial<Record<CanonicalProductCategory, string>> = {
  groceries: "01",
  alcohol: "02",
  tobacco: "02",
  apparel: "03",
  home: "05",
  pharmacy: "06",
  fuel: "07",
  services: "08",
  electronics: "09",
  sports: "09",
  pets: "09",
  restaurant: "11",
  hospitality: "11",
  cosmetics: "12",
  baby: "12",
};

async function buildCategoryLeague(
  seriesByKey: Map<string, ProductSeries>,
  country: string | null
): Promise<CategoryInflationRow[]> {
  // Personal drift per canonical category: spend-weighted annualised drift of
  // qualifying series, same method as the overall personal inflation figure.
  const byCategory = new Map<
    CanonicalProductCategory,
    { weightedSum: number; weightTotal: number; count: number }
  >();
  for (const series of seriesByKey.values()) {
    if (!series.category || series.category === "other") continue;
    const drift = seriesDrift(series);
    if (!drift) continue;
    const spend = series.observations.reduce((acc, o) => acc + o.spend, 0);
    if (spend <= 0) continue;
    // Same >=90-day annualisation floor as the overall personal figure.
    const annualised = drift.deltaRatio * (365 / Math.max(drift.spanDays, INFLATION_MIN_WINDOW_DAYS));
    let agg = byCategory.get(series.category);
    if (!agg) {
      agg = { weightedSum: 0, weightTotal: 0, count: 0 };
      byCategory.set(series.category, agg);
    }
    agg.weightedSum += annualised * spend;
    agg.weightTotal += spend;
    agg.count += 1;
  }

  // Categories present in the user's data (even without enough drift series).
  const presentCategories = new Set<CanonicalProductCategory>();
  for (const series of seriesByKey.values()) {
    if (series.category && series.category !== "other") presentCategories.add(series.category);
  }

  const rows: CategoryInflationRow[] = [];
  for (const category of presentCategories) {
    const agg = byCategory.get(category);
    const personalPct =
      agg && agg.weightTotal > 0 ? round(agg.weightedSum / agg.weightTotal) : null;
    const coicop = CATEGORY_TO_COICOP[category];
    const officialPct = coicop ? await cpiYoY(country, coicop) : null;
    if (personalPct === null && officialPct === null) continue;
    rows.push({ category, personalPct, officialPct });
  }
  return rows.sort((a, b) => (b.personalPct ?? b.officialPct ?? 0) - (a.personalPct ?? a.officialPct ?? 0));
}

async function buildCommunity(
  userCity: string | null,
  userReceipts: ReceiptRow[],
  currency: string,
  start: Date
): Promise<CommunityComparison | null> {
  try {
    const startStr = start.toISOString().slice(0, 10);
    // City names arrive with mixed casing ("Bursa" / "bursa") — group on a
    // case-folded key and display the most common spelling.
    const rows = (await sql`
      SELECT
        min(p.city) AS city,
        avg(COALESCE(r.pricing_total_paid, r.extraction_total_value)) AS avg_basket,
        count(*)::int AS receipt_count,
        count(DISTINCT r.username)::int AS contributors
      FROM receipts r
      JOIN user_profiles p ON p.username = r.username
      WHERE NULLIF(p.city, '') IS NOT NULL
        AND COALESCE(r.expense_type, 'personal') = 'personal'
        AND r.pricing_currency = ${currency}
        AND COALESCE(NULLIF(r.extraction_date_value, ''), to_char(r.created_at, 'YYYY-MM-DD')) >= ${startStr}
        AND COALESCE(r.pricing_total_paid, r.extraction_total_value) IS NOT NULL
      GROUP BY lower(p.city)
      HAVING count(DISTINCT r.username) >= ${COMMUNITY_MIN_CONTRIBUTORS}
      ORDER BY count(*) DESC
      LIMIT 10
    `) as Record<string, unknown>[];

    const cities = (Array.isArray(rows) ? rows : [])
      .map((row) => {
        const city = toStr(row.city);
        const avgBasket = toNum(row.avg_basket);
        const receiptCount = toNum(row.receipt_count);
        if (!city || avgBasket == null || receiptCount == null) return null;
        return { city, avgBasket: round(avgBasket, 2), receiptCount };
      })
      .filter((c): c is { city: string; avgBasket: number; receiptCount: number } => c !== null);

    const totals = userReceipts
      .filter((r) => r.currency === currency && r.total != null)
      .map((r) => r.total as number);
    const userAvgBasket =
      totals.length > 0
        ? round(totals.reduce((a, b) => a + b, 0) / totals.length, 2)
        : null;

    if (!userCity && cities.length === 0 && userAvgBasket === null) return null;
    return { city: userCity, cities, userAvgBasket };
  } catch (err) {
    console.error("[analysis] buildCommunity failed:", err);
    return { city: userCity, cities: [], userAvgBasket: null };
  }
}

// ── Entry point ─────────────────────────────────────────────────────────────

export async function buildAnalysis(username: string): Promise<AnalysisPayload> {
  const now = new Date();
  const start = new Date(now.getTime() - WINDOW_DAYS * DAY_MS);

  const [receiptsRaw, profile, receiptCount] = await Promise.all([
    loadReceipts(username, start).catch((err) => {
      console.error("[analysis] loadReceipts failed:", err);
      return [] as ReceiptRow[];
    }),
    loadUserProfile(username),
    loadReceiptCount(username),
  ]);

  let itemsRaw: ItemRow[] = [];
  try {
    itemsRaw = await loadLineItemsFromTable(username, start);
    if (itemsRaw.length === 0) {
      itemsRaw = await loadLineItemsFromJson(username, start);
    }
  } catch (err) {
    console.error("[analysis] line item load failed:", err);
    itemsRaw = [];
  }

  // Dominant currency: mode across receipts; all monetary sections filter to it.
  const currencyCounts = new Map<string, number>();
  for (const r of receiptsRaw) {
    if (r.currency) currencyCounts.set(r.currency, (currencyCounts.get(r.currency) ?? 0) + 1);
  }
  let currency = "TRY";
  let best = 0;
  for (const [cur, count] of currencyCounts) {
    if (count > best) {
      currency = cur;
      best = count;
    }
  }

  const receipts = receiptsRaw.filter((r) => r.currency === currency || r.currency === null);
  const items = itemsRaw.filter((i) => i.currency === currency || i.currency === null);
  const seriesByKey = buildSeries(items);

  // Actual observed window for annualisation (clamped to a sane floor).
  const dates = receipts.map((r) => parseDateStr(r.date)).filter((d): d is Date => d !== null);
  const observedWindowDays = dates.length
    ? Math.max(
        30,
        Math.min(
          WINDOW_DAYS,
          (now.getTime() - Math.min(...dates.map((d) => d.getTime()))) / DAY_MS
        )
      )
    : WINDOW_DAYS;

  const inflationCore = buildPersonalInflationCore(seriesByKey);
  const [officialPct, purchasingPower, categoryLeague, community] = await Promise.all([
    cpiYoY(profile.country, "GENEL"),
    buildPurchasingPower(profile.country),
    buildCategoryLeague(seriesByKey, profile.country),
    buildCommunity(profile.city, receipts, currency, start),
  ]);

  const personalInflation: PersonalInflation | null = inflationCore
    ? {
        personalPct: inflationCore.personalPct,
        windowDays: inflationCore.windowDays,
        officialPct,
        officialSource: officialPct !== null ? `economic_indices CPI GENEL (${profile.country})` : null,
        productCount: inflationCore.productCount,
      }
    : null;

  return {
    currency,
    generatedAt: now.toISOString(),
    overview: buildOverview(receipts, receiptCount, now),
    priceTracks: buildPriceTracks(seriesByKey),
    merchantComparison: buildMerchantComparison(items),
    unitTraps: buildUnitTraps(items),
    timeHeatmap: buildTimeHeatmap(receipts),
    loyalty: buildLoyalty(seriesByKey, observedWindowDays),
    personalInflation,
    shrinkflation: buildShrinkflation(items),
    purchasingPower,
    categoryLeague,
    community,
  };
}
