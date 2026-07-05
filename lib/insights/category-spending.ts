/**
 * Shared spending-category breakdown — the single source of truth for the
 * dashboard's "Spending Category" card AND Yumbie's patterns room, so both show
 * the SAME numbers. Reads the cached receipt line-items (last 30 days), groups
 * by normalized category, and returns the top-3 named categories + an "other"
 * bucket, each with a localized multilingual label and a chart color.
 */
import { loadBootstrapSnapshot } from "@/lib/bootstrap";
import { readCachedReceiptLineItems } from "@/lib/offline/cache";
import type { UserFacingText } from "@/lib/product-architecture/dashboard-contract";
import {
  resolveCategoryLvl1,
  type CanonicalProductCategory,
} from "@/lib/receipt/category-taxonomy";

export type ChartColor = {
  dot: string;
  dotBg: string;
  barStart: string;
  barEnd: string;
};

export type CategoryBucket = {
  key: string;
  label: UserFacingText;
  chartColor: ChartColor;
  total: number;
  currency: string;
};

// Display buckets keyed by the value returned from the canonical taxonomy
// (via CANON_TO_DISPLAY). Several canonical categories intentionally collapse
// into one consumer-facing row — e.g. `restaurant` and `alcohol` both read as
// "Food & Drink". Every label carries all six locales because the dashboard
// renders `label[locale]` directly with no fallback.
const DISPLAY: Record<string, UserFacingText> = {
  grocery:       { tr: "Market & Gıda",  en: "Grocery",         ru: "Продукты",       th: "ของชำ",              es: "Comestibles",      zh: "食杂"    },
  food_drink:    { tr: "Yeme & İçme",    en: "Food & Drink",    ru: "Еда и напитки",  th: "อาหารและเครื่องดื่ม", es: "Comida y bebida",  zh: "餐饮"    },
  home:          { tr: "Ev & Yaşam",     en: "Home & Living",   ru: "Дом и быт",      th: "บ้านและไลฟ์สไตล์",  es: "Hogar y vida",     zh: "家居生活" },
  personal_care: { tr: "Kişisel Bakım",  en: "Personal Care",   ru: "Уход за собой",  th: "ดูแลตัวเอง",         es: "Cuidado personal", zh: "个人护理" },
  health:        { tr: "Sağlık & Eczane",en: "Health",          ru: "Здоровье",       th: "สุขภาพ",             es: "Salud",            zh: "健康"    },
  electronics:   { tr: "Elektronik",     en: "Electronics",     ru: "Электроника",    th: "อิเล็กทรอนิกส์",     es: "Electrónica",      zh: "电子产品" },
  fuel:          { tr: "Ulaşım & Yakıt", en: "Fuel & Transport",ru: "Топливо",        th: "เชื้อเพลิง",         es: "Combustible",      zh: "燃油"    },
  fashion:       { tr: "Giyim & Moda",   en: "Fashion",         ru: "Одежда",         th: "แฟชั่น",             es: "Moda",             zh: "服饰"    },
  tobacco:       { tr: "Tütün",          en: "Tobacco",         ru: "Табак",          th: "ยาสูบ",              es: "Tabaco",           zh: "烟草"    },
  services:      { tr: "Hizmetler",      en: "Services",        ru: "Услуги",         th: "บริการ",             es: "Servicios",        zh: "服务"    },
  hospitality:   { tr: "Konaklama",      en: "Accommodation",   ru: "Проживание",     th: "ที่พัก",             es: "Alojamiento",      zh: "住宿"    },
  sports:        { tr: "Spor",           en: "Sports",          ru: "Спорт",          th: "กีฬา",               es: "Deportes",         zh: "运动"    },
  pets:          { tr: "Evcil Hayvan",   en: "Pets",            ru: "Питомцы",        th: "สัตว์เลี้ยง",         es: "Mascotas",         zh: "宠物"    },
  baby:          { tr: "Bebek & Çocuk",  en: "Baby & Kids",     ru: "Дети",           th: "ลูกน้อย",            es: "Bebés y niños",    zh: "母婴"    },
};

// Canonical lvl1 enum (source of truth) → consumer-facing display bucket key.
const CANON_TO_DISPLAY: Record<CanonicalProductCategory, string> = {
  groceries:   "grocery",
  restaurant:  "food_drink",
  alcohol:     "food_drink",
  fuel:        "fuel",
  apparel:     "fashion",
  cosmetics:   "personal_care",
  electronics: "electronics",
  home:        "home",
  tobacco:     "tobacco",
  pharmacy:    "health",
  services:    "services",
  hospitality: "hospitality",
  sports:      "sports",
  pets:        "pets",
  baby:        "baby",
  other:       "other",
};

const OTHER_LABEL: UserFacingText = { tr: "Diğer", en: "Other", ru: "Другое", th: "อื่น ๆ", es: "Otros", zh: "其他" };

function displayLabel(key: string): UserFacingText {
  return DISPLAY[key] ?? OTHER_LABEL;
}

// 4 max-contrast colors, assigned by chart position (index 0-2 = top-3, index 3 = other).
// Each row in the chart having a distinct color takes priority over the same
// category always getting the same color (product decision, 2026-06-20).
const CHART_PALETTE: ChartColor[] = [
  { dot: "#fb923c", dotBg: "rgba(249,115,22,0.15)",           barStart: "#ea580c", barEnd: "#fb923c" },  // orange
  { dot: "#38bdf8", dotBg: "rgba(14,165,233,0.15)",           barStart: "#0284c7", barEnd: "#38bdf8" },  // sky blue
  { dot: "#a78bfa", dotBg: "rgba(124,58,237,0.15)",           barStart: "#7c3aed", barEnd: "#a78bfa" },  // purple
  { dot: "var(--chart-other-dot)", dotBg: "var(--chart-other-dot-bg)", barStart: "var(--chart-other-bar-start)", barEnd: "var(--chart-other-bar-end)" },  // gray (other) — flips with theme
];

// Resolve a line item to a display bucket key. lvl1→lvl2 recovery lives in the
// canonical taxonomy (shared with the write-time pipeline); here we only map the
// canonical category onto its consumer-facing display bucket.
function resolveDisplayKey(lvl1: string | null, lvl2: string | null): string {
  const canon = resolveCategoryLvl1(lvl1, lvl2);
  if (canon == null) return "other";
  return CANON_TO_DISPLAY[canon] ?? "other";
}

export async function fetchCategorySpending(range?: {
  /** Inclusive lower bound YYYY-MM-DD; defaults to today − 30 days. */
  sinceStr?: string;
  /** Inclusive upper bound YYYY-MM-DD; omit for "up to now". */
  untilStr?: string;
}): Promise<CategoryBucket[]> {
  await loadBootstrapSnapshot().catch(() => {});
  const items = await readCachedReceiptLineItems(800);

  let cutoffStr = range?.sinceStr;
  if (!cutoffStr) {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 30);
    cutoffStr = cutoff.toISOString().slice(0, 10);
  }
  const untilStr = range?.untilStr;

  // Keep named categories separate from "other" from the start so
  // "other" can never appear in the top-3 slots.
  const namedTotals = new Map<string, number>();
  let otherTotal = 0;
  let dominantCurrency = "TRY";
  const currencyCount = new Map<string, number>();

  for (const item of items) {
    const dateStr = item.purchasedAt?.slice(0, 10) ?? "";
    if (!dateStr || dateStr < cutoffStr) continue;
    if (untilStr && dateStr > untilStr) continue;
    if (!item.lineTotalGross || item.lineTotalGross <= 0) continue;

    const cat = resolveDisplayKey(item.categoryLvl1, item.categoryLvl2);
    if (cat === "other") {
      otherTotal += item.lineTotalGross;
    } else {
      namedTotals.set(cat, (namedTotals.get(cat) ?? 0) + item.lineTotalGross);
    }

    const cur = item.currency || "TRY";
    currencyCount.set(cur, (currencyCount.get(cur) ?? 0) + 1);
  }

  let maxCount = 0;
  for (const [cur, count] of currencyCount) {
    if (count > maxCount) { maxCount = count; dominantCurrency = cur; }
  }

  if (namedTotals.size === 0 && otherTotal === 0) return [];

  const sortedNamed = [...namedTotals.entries()].sort((a, b) => b[1] - a[1]);
  const top3 = sortedNamed.slice(0, 3);
  // Anything beyond the top-3 named categories also flows into "other".
  const spillover = sortedNamed.slice(3).reduce((sum, [, v]) => sum + v, 0);
  const digerTotal = otherTotal + spillover;

  const buckets: CategoryBucket[] = top3.map(([key, total], index) => ({
    key,
    label:      displayLabel(key),
    chartColor: CHART_PALETTE[index],
    total,
    currency:   dominantCurrency,
  }));

  // Always append the "other" row as the 4th entry, even if digerTotal is 0.
  buckets.push({
    key:        "other",
    label:      OTHER_LABEL,
    chartColor: CHART_PALETTE[3],
    total:      digerTotal,
    currency:   dominantCurrency,
  });

  return buckets;
}

export interface WeeklySpend {
  /** One entry per week of the current calendar month (W1..Wn). */
  weeks: { key: string; label: string; total: number }[];
  /** Index of the week containing today, into `weeks`. */
  currentWeekIndex: number;
  currentWeekTotal: number;
  prevWeekTotal: number;
  /** (current − previous) / previous × 100; null when there is no prior week to compare. */
  deltaPct: number | null;
  currency: string;
}

/**
 * Spend bucketed by week-of-month for the CURRENT calendar month, computed from
 * the same cached line-items the category card reads. Drives the Ledger weekly
 * bar chart. All values are real; weeks with no receipts stay at 0.
 */
export async function fetchWeeklySpend(): Promise<WeeklySpend> {
  await loadBootstrapSnapshot().catch(() => {});
  const items = await readCachedReceiptLineItems(800);

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth(); // 0-based
  const monthStr = `${year}-${String(month + 1).padStart(2, "0")}`;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const weekCount = Math.ceil(daysInMonth / 7); // 5 for most months

  const totals = new Array<number>(weekCount).fill(0);
  const currencyCount = new Map<string, number>();

  for (const item of items) {
    const dateStr = item.purchasedAt?.slice(0, 10) ?? "";
    if (!dateStr.startsWith(monthStr)) continue;
    if (!item.lineTotalGross || item.lineTotalGross <= 0) continue;
    const day = parseInt(dateStr.slice(8, 10), 10);
    if (!Number.isFinite(day)) continue;
    const weekIdx = Math.min(weekCount - 1, Math.floor((day - 1) / 7));
    totals[weekIdx] += item.lineTotalGross;
    const cur = item.currency || "TRY";
    currencyCount.set(cur, (currencyCount.get(cur) ?? 0) + 1);
  }

  let currency = "TRY";
  let maxCount = 0;
  for (const [cur, count] of currencyCount) {
    if (count > maxCount) { maxCount = count; currency = cur; }
  }

  const currentWeekIndex = Math.min(weekCount - 1, Math.floor((now.getDate() - 1) / 7));
  const currentWeekTotal = totals[currentWeekIndex] ?? 0;
  const prevWeekTotal = currentWeekIndex > 0 ? totals[currentWeekIndex - 1] : 0;
  const deltaPct =
    prevWeekTotal > 0 ? Math.round(((currentWeekTotal - prevWeekTotal) / prevWeekTotal) * 100) : null;

  const weeks = totals.map((total, i) => ({ key: `w${i + 1}`, label: `W${i + 1}`, total }));

  return { weeks, currentWeekIndex, currentWeekTotal, prevWeekTotal, deltaPct, currency };
}

export interface NamedTotal {
  key: string;
  label: UserFacingText;
  total: number;
  currency: string;
}

/**
 * ALL named category totals for a date range (no top-3 collapse, no "other").
 * Used by Yumbie's weekly awareness to compare a category against its own
 * recent trend.
 */
export async function fetchNamedCategoryTotals(range?: {
  sinceStr?: string;
  untilStr?: string;
}): Promise<NamedTotal[]> {
  await loadBootstrapSnapshot().catch(() => {});
  const items = await readCachedReceiptLineItems(800);

  let cutoffStr = range?.sinceStr;
  if (!cutoffStr) {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 30);
    cutoffStr = cutoff.toISOString().slice(0, 10);
  }
  const untilStr = range?.untilStr;

  const totals = new Map<string, number>();
  const currencyCount = new Map<string, number>();
  for (const item of items) {
    const dateStr = item.purchasedAt?.slice(0, 10) ?? "";
    if (!dateStr || dateStr < cutoffStr) continue;
    if (untilStr && dateStr > untilStr) continue;
    if (!item.lineTotalGross || item.lineTotalGross <= 0) continue;
    const cat = resolveDisplayKey(item.categoryLvl1, item.categoryLvl2);
    if (cat === "other") continue;
    totals.set(cat, (totals.get(cat) ?? 0) + item.lineTotalGross);
    const cur = item.currency || "TRY";
    currencyCount.set(cur, (currencyCount.get(cur) ?? 0) + 1);
  }
  let dominantCurrency = "TRY";
  let maxCount = 0;
  for (const [cur, count] of currencyCount) {
    if (count > maxCount) { maxCount = count; dominantCurrency = cur; }
  }
  return [...totals.entries()].map(([key, total]) => ({
    key,
    label: displayLabel(key),
    total,
    currency: dominantCurrency,
  }));
}
