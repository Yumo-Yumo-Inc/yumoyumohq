/**
 * Weekly Ledger — shared types between the server builder, the API route and
 * the /app/weekly page. A report is a frozen (closed-ledger) snapshot of one
 * Monday→Sunday week; all fields are raw data, localization happens in the UI.
 */

/** Week archetype — the editorial headline picked from the week's rarest qualifying trait. */
export type WeekArchetype =
  | "night_shift"     // ≥2 receipts at night hours
  | "early_bird"      // ≥2 receipts before 09:00
  | "single_fort"     // one merchant carries ≥60% of spend across ≥3 receipts
  | "explorer"        // ≥4 distinct merchants
  | "weekend_run"     // ≥60% of spend on Sat/Sun
  | "category_week"   // one category ≥50% of itemized spend
  | "steady_log";     // fallback

export type WildcardInsight =
  | {
      kind: "price_repeat";
      /** Item bought both this week and before — user's own price track. */
      item: string;
      thisPrice: number;
      prevPrice: number;
      prevDate: string;
    }
  | {
      kind: "night_share";
      /** Share of the week's spend that happened at night (0..1) + receipt count. */
      share: number;
      count: number;
    }
  | {
      kind: "loyalty";
      merchant: string;
      visits: number;
      total: number;
    }
  | {
      kind: "category_pulse";
      categoryKey: string;
      total: number;
      trailingAvg: number;
    };

export interface WeeklyCategorySlice {
  key: string;
  total: number;
}

export interface WeeklyMoment {
  merchant: string;
  total: number;
  /** YYYY-MM-DD */
  date: string;
  /** HH:MM when the receipt carries a time, else null. */
  time: string | null;
  receiptId: string;
}

/** One ledger entry — a receipt of the week, chronological. */
export interface WeeklyEntry {
  date: string;
  time: string | null;
  merchant: string;
  total: number;
  receiptId: string;
}

/** A line item aggregated across the week (repeat purchases folded together). */
export interface WeeklyTopItem {
  name: string;
  /** Summed quantity across the week, null when quantities are unknown. */
  quantity: number | null;
  /** How many receipt lines carried this item. */
  occurrences: number;
  total: number;
}

export interface SingleReceiptDive {
  merchant: string;
  date: string;
  time: string | null;
  total: number;
  hidden: number;
  items: { name: string; quantity: number | null; lineTotal: number }[];
}

export interface WeeklyLedgerReport {
  weekStart: string;
  weekEnd: string;
  currency: string;
  receiptCount: number;
  total: number;
  /** Average weekly spend over the up-to-3 prior weeks that had data, else null. */
  trailingAvg: number | null;
  /** How many of the 3 prior weeks had receipts. */
  trailingWeeks: number;
  hiddenTotal: number;
  /** hiddenTotal / total, 0..1, null when total is 0. */
  hiddenShare: number | null;
  /** Monday→Sunday daily spend. */
  dailyTotals: number[];
  dailyCounts: number[];
  /** Totals of the up-to-3 prior weeks, oldest → newest (0 = no data that week). */
  priorWeekTotals: number[];
  /** VAT summed from the week's receipts. */
  vatTotal: number;
  /** The week's receipts, chronological. */
  entries: WeeklyEntry[];
  /** Top line items of the week, largest spend first. */
  topItems: WeeklyTopItem[];
  topMerchant: { name: string; total: number; visits: number } | null;
  distinctMerchants: number;
  /** Top 3 named categories + "other" bucket (itemized spend). */
  categories: WeeklyCategorySlice[];
  biggestReceipt: WeeklyMoment | null;
  archetype: WeekArchetype;
  /** Set when archetype is category_week. */
  archetypeCategory: string | null;
  wildcard: WildcardInsight | null;
  /** Points (bINT) granted for this week's receipts — the unit the result screen shows. */
  points: number;
  seasonXpGained: number;
  questsCompleted: number;
  seasonLevel: number | null;
  /** Month-end projection computed at freeze time from the ledger month of weekEnd. */
  forecast: { monthProjected: number; monthSoFar: number; month: string } | null;
  /** "single" = 1–2 receipts: the report becomes a deep-dive of one receipt. */
  mode: "full" | "single";
  singleReceipt: SingleReceiptDive | null;
}

export interface WeeklyLedgerResponse {
  locked?: boolean;
  requiredLevel?: number;
  accountLevel?: number;
  empty?: boolean;
  weekStart?: string;
  report?: WeeklyLedgerReport;
  /** Frozen weeks available in the archive, newest first. */
  archive?: string[];
}

/** Monday of the week containing `dateStr` (YYYY-MM-DD, UTC math). */
function mondayOf(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00Z");
  const dow = (d.getUTCDay() + 6) % 7; // Mon=0 … Sun=6
  d.setUTCDate(d.getUTCDate() - dow);
  return d.toISOString().slice(0, 10);
}

export function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** Monday of the most recent fully completed week as of `today`. */
export function latestClosedWeekStart(today: Date = new Date()): string {
  const todayStr = today.toISOString().slice(0, 10);
  return addDays(mondayOf(todayStr), -7);
}

/** True when `weekStart` is a Monday and its week is fully in the past. */
export function isClosedWeekStart(weekStart: string, today: Date = new Date()): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(weekStart)) return false;
  if (mondayOf(weekStart) !== weekStart) return false;
  const todayStr = today.toISOString().slice(0, 10);
  return addDays(weekStart, 7) <= todayStr;
}
