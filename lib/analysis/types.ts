/**
 * Shared contract between /api/analysis and /app/analysis.
 *
 * Every section is nullable / empty-able: when the underlying data is missing
 * or insufficient the section is null (or an empty array) and the page renders
 * an empty state. No fabricated values, ever.
 */

export interface AnalysisOverview {
  /** Sum of personal expenses in the current calendar month, in `currency`. */
  monthTotal: number;
  /** Same sum for the previous calendar month; null when no receipts exist there. */
  prevMonthTotal: number | null;
  /** Hidden-cost sum for the current calendar month; null when not computed. */
  hiddenCostMonth: number | null;
  /** Total receipts counted for this user (all time). */
  receiptCount: number;
}

export interface PricePoint {
  /** ISO date (YYYY-MM-DD). */
  date: string;
  /** Normalised unit price (per pack unit) in `currency`. */
  unitPrice: number;
}

export interface PriceTrack {
  name: string;
  brand: string | null;
  packSize: number | null;
  unitType: string | null;
  series: PricePoint[];
  /** latest vs prior-median ratio, e.g. 0.47 = +47%. */
  deltaRatio: number;
  baselineUnitPrice: number;
  latestUnitPrice: number;
  sampleSize: number;
  spanDays: number;
}

export interface MerchantPriceRow {
  merchant: string;
  /** Average paid unit price across the shared comparable items. */
  avgUnitPrice: number;
  /** How many comparable purchases back this row. */
  purchaseCount: number;
}

export interface MerchantComparison {
  /** Canonical items the user bought at 2+ merchants — the comparison basis. */
  itemCount: number;
  rows: MerchantPriceRow[];
}

export interface UnitTrap {
  name: string;
  packSize: number;
  unitType: string;
  /** Price per base unit (e.g. per kg / per L) the user paid. */
  perUnitPaid: number;
  /** Cheapest per-unit price observed for the same canonical at a larger pack. */
  perUnitAlt: number;
  altPackSize: number;
  /** (paid - alt) / paid, e.g. 0.31 = 31% cheaper at the larger pack. */
  savingsRatio: number;
}

export interface TimeHeatmap {
  /** rows: 0=morning,1=noon,2=evening,3=night; cols: 0=Mon..6=Sun; values = receipt counts. */
  grid: number[][];
  /** Share of receipts after 21:00, 0..1. Null when timestamps are unusable. */
  nightShare: number | null;
  /** Receipts that had a usable time-of-day. */
  sampleSize: number;
}

export interface LoyaltyItem {
  name: string;
  purchasesPerMonth: number;
  /** Observed spend over the window, annualised. */
  annualizedSpend: number;
  /** Own price drift for this item; null when not enough observations. */
  deltaRatio: number | null;
}

export interface PersonalInflation {
  /** Weighted personal price drift over the window, e.g. 0.614 = +61.4%. */
  personalPct: number;
  /** Days the personal window actually spans. */
  windowDays: number;
  /** Official CPI YoY for the user's country, e.g. 0.442; null when index missing. */
  officialPct: number | null;
  officialSource: string | null;
  /** Number of product series contributing. */
  productCount: number;
}

export interface ShrinkflationHit {
  name: string;
  brand: string | null;
  unitType: string;
  oldPackSize: number;
  newPackSize: number;
  /** ISO date the smaller pack was first observed. */
  observedAt: string;
  /** Implied hidden increase: old/new - 1 when the unit price held or rose. */
  impliedPct: number;
}

export interface PurchasingPowerStep {
  monthsAgo: number;
  /** What today's 1000 units bought then, per official CPI. */
  equivalentValue: number;
}

export interface PurchasingPower {
  baseAmount: number;
  steps: PurchasingPowerStep[];
  source: string;
}

export interface CategoryInflationRow {
  /** Canonical lvl1 category key (used for the localised label on the client). */
  category: string;
  /** User's own drift in this category; null when insufficient data. */
  personalPct: number | null;
  /** Official COICOP YoY for the same category; null when unmapped/missing. */
  officialPct: number | null;
}

export interface CommunityComparison {
  /** User's city (from profile); null when unset. */
  city: string | null;
  /** Cities with enough contributors, avg basket (receipt total) each. */
  cities: Array<{ city: string; avgBasket: number; receiptCount: number }>;
  /** User's own average basket over the same window. */
  userAvgBasket: number | null;
}

export interface AnalysisPayload {
  currency: string;
  generatedAt: string;
  overview: AnalysisOverview;
  priceTracks: PriceTrack[];
  merchantComparison: MerchantComparison | null;
  unitTraps: UnitTrap[];
  timeHeatmap: TimeHeatmap | null;
  loyalty: LoyaltyItem[];
  personalInflation: PersonalInflation | null;
  shrinkflation: ShrinkflationHit[];
  purchasingPower: PurchasingPower | null;
  categoryLeague: CategoryInflationRow[];
  community: CommunityComparison | null;
}
