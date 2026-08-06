/**
 * Deep Insights (account-level-10 unlock `deep_insights`) — a deeper analysis
 * layer computed entirely from the user's OWN cached receipts + line items. Two
 * views not in the free Deep tab:
 *
 *  - Spend forecast: projects the current calendar month's final total from the
 *    run-rate so far, compared to the prior full month.
 *  - Category momentum: each named category's current-month spend vs its own
 *    trailing 3-month average — which habits are rising or falling.
 *
 * Every number is real. Insufficient data → null / empty (no fabrication),
 * matching the rest of the insights layer. Client-only: reads the on-device
 * cache, no new endpoint.
 */

import { loadBootstrapSnapshot } from "@/lib/bootstrap";
import { readCachedReceipts, readCachedReceiptLineItems } from "@/lib/offline/cache";
import type { UserFacingText } from "@/lib/product-architecture/dashboard-contract";
import { resolveCategoryLvl1 } from "@/lib/receipt/category-taxonomy";

// ── Month helpers (local calendar) ──────────────────────────────────────────
function monthKeyOf(dateStr: string): string {
  return dateStr.slice(0, 7); // YYYY-MM
}
/** YYYY-MM for `monthsBack` months before `ref` (0 = ref's month). */
function monthKeyBack(ref: Date, monthsBack: number): string {
  const d = new Date(ref.getFullYear(), ref.getMonth() - monthsBack, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function dominantKey(map: Map<string, number>): string | null {
  let best: string | null = null;
  let max = 0;
  for (const [k, v] of map) {
    if (v > max) { max = v; best = k; }
  }
  return best;
}

/**
 * The single currency all figures are expressed in: the one the user transacts
 * in most across their receipts. Amounts in other currencies are excluded rather
 * than summed together (mixing currencies would produce a meaningless total).
 * Returns null when there is no currency signal at all.
 */
function pickPrimaryCurrency(counts: Iterable<string | null | undefined>): string | null {
  const tally = new Map<string, number>();
  for (const cur of counts) {
    const c = (cur || "").trim().toUpperCase();
    if (!c) continue;
    tally.set(c, (tally.get(c) ?? 0) + 1);
  }
  return dominantKey(tally);
}

// ── Spend forecast ───────────────────────────────────────────────────────────
export interface SpendForecast {
  currency: string;
  /** Spend recorded in the current calendar month so far. */
  currentSoFar: number;
  /** Projected month-end total from the run-rate (currentSoFar / daysElapsed × daysInMonth). */
  projectedTotal: number;
  /** Full prior calendar month total, or null if none on record. */
  priorMonthTotal: number | null;
  /** (projected − prior) / prior × 100, null when no prior month. */
  deltaPct: number | null;
  daysElapsed: number;
  daysInMonth: number;
  /** True when the projection rests on thin data (early in month / few days with receipts). */
  lowConfidence: boolean;
}

const sameCur = (a: unknown, b: unknown) =>
  String(a ?? "").trim().toUpperCase() === String(b ?? "").trim().toUpperCase() && !!b;

export async function fetchSpendForecast(preferredCurrency?: string | null): Promise<SpendForecast | null> {
  await loadBootstrapSnapshot().catch(() => {});
  const receipts = await readCachedReceipts();
  if (!receipts || receipts.length === 0) return null;

  const now = new Date();
  const thisMonth = monthKeyBack(now, 0);
  const priorMonth = monthKeyBack(now, 1);
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const daysElapsed = Math.min(now.getDate(), daysInMonth);

  // Currency is picked from THIS window (current + prior month), not all-time,
  // so a user whose recent activity is in a different currency than their older
  // history is reflected correctly. Other currencies in the window are ignored
  // (summing across currencies would be meaningless).
  const windowRows = receipts
    .map((r) => {
      const dateStr = (r.extractionDate ?? r.createdAt ?? "").slice(0, 10);
      return { mk: dateStr ? monthKeyOf(dateStr) : "", dateStr, amount: Number(r.totalPaid) || 0, currency: r.currency };
    })
    .filter((r) => (r.mk === thisMonth || r.mk === priorMonth) && r.amount > 0);
  // Prefer the account country's currency (passed in) when it has data in the
  // window, so it matches the rest of the analysis; else anchor on the currency
  // spent THIS month; else the wider window.
  const primaryCurrency =
    (preferredCurrency && windowRows.some((r) => sameCur(r.currency, preferredCurrency))
      ? preferredCurrency.trim().toUpperCase()
      : null) ??
    pickPrimaryCurrency(windowRows.filter((r) => r.mk === thisMonth).map((r) => r.currency)) ??
    pickPrimaryCurrency(windowRows.map((r) => r.currency));
  if (!primaryCurrency) return null;

  let currentSoFar = 0;
  let priorTotal = 0;
  let priorSeen = false;
  const activeDays = new Set<string>();

  for (const r of windowRows) {
    if ((r.currency || "").trim().toUpperCase() !== primaryCurrency) continue;
    if (r.mk === thisMonth) {
      currentSoFar += r.amount;
      activeDays.add(r.dateStr);
    } else {
      priorTotal += r.amount;
      priorSeen = true;
    }
  }

  if (currentSoFar <= 0 && !priorSeen) return null;

  const runRate = daysElapsed > 0 ? currentSoFar / daysElapsed : 0;
  const projectedTotal = Math.round(runRate * daysInMonth);
  const priorMonthTotal = priorSeen ? Math.round(priorTotal) : null;
  const deltaPct =
    priorMonthTotal && priorMonthTotal > 0
      ? Math.round(((projectedTotal - priorMonthTotal) / priorMonthTotal) * 100)
      : null;

  return {
    currency: primaryCurrency,
    currentSoFar: Math.round(currentSoFar),
    projectedTotal,
    priorMonthTotal,
    deltaPct,
    daysElapsed,
    daysInMonth,
    lowConfidence: daysElapsed < 7 || activeDays.size < 3,
  };
}

// ── Category momentum ────────────────────────────────────────────────────────
const CATEGORY_LABELS: Record<string, UserFacingText> = {
  groceries:   { tr: "Market & Gıda", en: "Grocery",       ru: "Продукты",      th: "ของชำ",              es: "Comestibles",      zh: "食杂" },
  restaurant:  { tr: "Yeme & İçme",   en: "Food & Drink",  ru: "Еда",           th: "อาหาร",              es: "Comida",           zh: "餐饮" },
  alcohol:     { tr: "İçki",          en: "Alcohol",       ru: "Алкоголь",      th: "แอลกอฮอล์",          es: "Alcohol",          zh: "酒类" },
  fuel:        { tr: "Ulaşım & Yakıt",en: "Fuel",          ru: "Топливо",       th: "เชื้อเพลิง",         es: "Combustible",      zh: "燃油" },
  apparel:     { tr: "Giyim & Moda",  en: "Fashion",       ru: "Одежда",        th: "แฟชั่น",             es: "Moda",             zh: "服饰" },
  cosmetics:   { tr: "Kişisel Bakım", en: "Personal Care", ru: "Уход",          th: "ดูแลตัวเอง",         es: "Cuidado personal", zh: "个人护理" },
  electronics: { tr: "Elektronik",    en: "Electronics",   ru: "Электроника",   th: "อิเล็กทรอนิกส์",     es: "Electrónica",      zh: "电子产品" },
  home:        { tr: "Ev & Yaşam",    en: "Home & Living", ru: "Дом",           th: "บ้าน",               es: "Hogar",            zh: "家居" },
  tobacco:     { tr: "Tütün",         en: "Tobacco",       ru: "Табак",         th: "ยาสูบ",              es: "Tabaco",           zh: "烟草" },
  pharmacy:    { tr: "Sağlık",        en: "Health",        ru: "Здоровье",      th: "สุขภาพ",             es: "Salud",            zh: "健康" },
  services:    { tr: "Hizmetler",     en: "Services",      ru: "Услуги",        th: "บริการ",             es: "Servicios",        zh: "服务" },
  hospitality: { tr: "Konaklama",     en: "Accommodation", ru: "Проживание",    th: "ที่พัก",             es: "Alojamiento",      zh: "住宿" },
  sports:      { tr: "Spor",          en: "Sports",        ru: "Спорт",         th: "กีฬา",               es: "Deportes",         zh: "运动" },
  pets:        { tr: "Evcil Hayvan",  en: "Pets",          ru: "Питомцы",       th: "สัตว์เลี้ยง",         es: "Mascotas",         zh: "宠物" },
  baby:        { tr: "Bebek & Çocuk", en: "Baby & Kids",   ru: "Дети",          th: "ลูกน้อย",            es: "Bebés",            zh: "母婴" },
};

export interface CategoryMomentum {
  key: string;
  label: UserFacingText;
  /** Current calendar month spend in this category. */
  current: number;
  /** Trailing average of the up-to-3 prior full months (only months with data). */
  baseline: number;
  /** (current − baseline) / baseline × 100. */
  changePct: number;
  direction: "up" | "down" | "flat";
  currency: string;
}

/**
 * Per-category spend momentum: current month vs trailing 3-month average.
 * Returns the biggest movers first (by absolute % change), categories with a
 * meaningful baseline only. Empty when there isn't enough history.
 */
export async function fetchCategoryMomentum(preferredCurrency?: string | null): Promise<CategoryMomentum[]> {
  await loadBootstrapSnapshot().catch(() => {});
  const items = await readCachedReceiptLineItems(2000);
  if (!items || items.length === 0) return [];

  const now = new Date();
  const thisMonth = monthKeyBack(now, 0);
  const priorMonths = [monthKeyBack(now, 1), monthKeyBack(now, 2), monthKeyBack(now, 3)];
  const priorSet = new Set(priorMonths);
  const inWindow = (mk: string) => mk === thisMonth || priorSet.has(mk);

  // Prefer the account country's currency when it has data in the window; else
  // the currency spent THIS month; else the wider window. No cross-currency mix.
  const monthOf = (i: (typeof items)[number]) => monthKeyOf(i.purchasedAt?.slice(0, 10) ?? "");
  const windowItems = items.filter((i) => inWindow(monthOf(i)));
  const currency =
    (preferredCurrency && windowItems.some((i) => sameCur(i.currency, preferredCurrency))
      ? preferredCurrency.trim().toUpperCase()
      : null) ??
    pickPrimaryCurrency(items.filter((i) => monthOf(i) === thisMonth).map((i) => i.currency)) ??
    pickPrimaryCurrency(windowItems.map((i) => i.currency));
  if (!currency) return [];

  // category -> month -> total
  const byCat = new Map<string, Map<string, number>>();

  for (const item of items) {
    if ((item.currency || "").trim().toUpperCase() !== currency) continue;
    const dateStr = item.purchasedAt?.slice(0, 10) ?? "";
    if (!dateStr) continue;
    const mk = monthKeyOf(dateStr);
    if (!inWindow(mk)) continue;
    const amount = Number(item.lineTotalGross) || 0;
    if (amount <= 0) continue;
    const canon = resolveCategoryLvl1(item.categoryLvl1, item.categoryLvl2);
    if (!canon || canon === "other") continue;
    if (!CATEGORY_LABELS[canon]) continue;

    let months = byCat.get(canon);
    if (!months) { months = new Map(); byCat.set(canon, months); }
    months.set(mk, (months.get(mk) ?? 0) + amount);
  }
  const out: CategoryMomentum[] = [];

  for (const [key, months] of byCat) {
    const current = months.get(thisMonth) ?? 0;
    const priorVals = priorMonths.map((m) => months.get(m)).filter((v): v is number => v != null && v > 0);
    if (priorVals.length === 0) continue; // need a baseline to compare against
    const baseline = priorVals.reduce((s, v) => s + v, 0) / priorVals.length;
    if (baseline <= 0) continue;
    const changePct = Math.round(((current - baseline) / baseline) * 100);
    const direction: CategoryMomentum["direction"] =
      Math.abs(changePct) < 8 ? "flat" : changePct > 0 ? "up" : "down";
    out.push({
      key,
      label: CATEGORY_LABELS[key],
      current: Math.round(current),
      baseline: Math.round(baseline),
      changePct,
      direction,
      currency,
    });
  }

  // Biggest movers first; flat ones sink to the bottom.
  out.sort((a, b) => Math.abs(b.changePct) - Math.abs(a.changePct));
  return out.slice(0, 6);
}
