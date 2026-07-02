/**
 * Canonical product category (category_lvl1) taxonomy — single source of truth.
 *
 * Background: receipt_line_items.category_lvl1 historically accumulated THREE
 * overlapping schemas written by different code paths:
 *   - English-short  : "grocery", "groceries_fmcg", "fuel", "apparel"
 *   - Turkish-short  : "gıda", "kozmetik", "elektronik"
 *   - Turkish-heading: "İçecekler", "Şekerleme & Çikolata", "Süt & Yumurta..."
 * The same product family ended up under up to four different labels, which
 * broke aggregation in insights and hidden-cost composition.
 *
 * Decision (2026-06-11): canonical lvl1 is an English-short ENUM. Every
 * write path funnels through normalizeProductCategoryLvl1(). Turkish stays only
 * in the user-facing display layer (display_name_tr), never in category_lvl1.
 *
 * lvl1 = roof category (this file). lvl2 = product group (dairy/produce/snacks),
 * left as-is; v3 category_path already emits English lvl2.
 */

export const CANONICAL_PRODUCT_CATEGORIES = [
  "groceries", // food + FMCG (cleaning, snacks, beverages sold at markets)
  "restaurant", // dine-in, cafe, food delivery
  "fuel",
  "apparel",
  "cosmetics", // personal care + cosmetics
  "electronics",
  "home", // home & living, furniture
  "alcohol",
  "tobacco",
  "pharmacy",
  "services",
  "hospitality", // lodging
  "sports", // sporting goods: bicycles, fitness/outdoor gear, equipment
  "pets",
  "baby",
  "other",
] as const;

export type CanonicalProductCategory =
  (typeof CANONICAL_PRODUCT_CATEGORIES)[number];

const CANONICAL_SET = new Set<string>(CANONICAL_PRODUCT_CATEGORIES);

/**
 * Normalize an arbitrary category_lvl1 label to ASCII-lowercase, collapsing
 * Turkish diacritics and separators so map keys can stay ASCII.
 */
function normKey(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/̇/g, "") // combining dot above (Turkish İ artifact)
    .replace(/ı/g, "i")
    .replace(/ş/g, "s")
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c")
    .replace(/&/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

/**
 * Explicit aliases for every category_lvl1 value observed in production plus the
 * common English/Turkish variants. Keys are normKey()-normalized.
 */
const LVL1_ALIASES: Record<string, CanonicalProductCategory> = {
  // ── groceries (food + FMCG) ──────────────────────────────────────────
  gida: "groceries",
  grocery: "groceries",
  groceries: "groceries",
  groceries_fmcg: "groceries",
  "groceries fmcg": "groceries",
  supermarket: "groceries",
  market: "groceries",
  food: "groceries",
  icecekler: "groceries",
  icecek: "groceries",
  beverage: "groceries",
  beverages: "groceries",
  "sekerleme cikolata": "groceries",
  "atistirmalik cips": "groceries",
  snacks: "groceries",
  "sut yumurta sut urunleri": "groceries",
  "meyve sebze": "groceries",
  "bakliyat tahillar": "groceries",
  "hazir gida konserve": "groceries",
  "et balik tavuk": "groceries",
  "ekmek unlu mamuller": "groceries",
  "yag baharat sos": "groceries",
  "baharat sos": "groceries",
  "makarna pilavlik": "groceries",
  "temizlik deterjan": "groceries",
  dairy: "groceries",
  produce: "groceries",
  bakery: "groceries",
  // ── restaurant (dine-in, cafe, delivery) ─────────────────────────────
  restaurant: "restaurant",
  yemek: "restaurant",
  "restoran yemek": "restaurant",
  restoran: "restaurant",
  cafe: "restaurant",
  kafe: "restaurant",
  food_delivery: "restaurant",
  "food delivery": "restaurant",
  // ── fuel ─────────────────────────────────────────────────────────────
  fuel: "fuel",
  "akaryakit enerji": "fuel",
  akaryakit: "fuel",
  petrol: "fuel",
  // ── apparel ──────────────────────────────────────────────────────────
  giyim: "apparel",
  apparel: "apparel",
  fashion: "apparel",
  clothing: "apparel",
  "giyim tekstil": "apparel",
  // ── cosmetics / personal care ────────────────────────────────────────
  kozmetik: "cosmetics",
  cosmetics: "cosmetics",
  beauty: "cosmetics",
  personal_care: "cosmetics",
  "personal care": "cosmetics",
  "kisisel bakim kozmetik": "cosmetics",
  // ── electronics ──────────────────────────────────────────────────────
  elektronik: "electronics",
  electronics: "electronics",
  electronic: "electronics",
  "elektronik teknoloji": "electronics",
  // ── home & living ────────────────────────────────────────────────────
  ev: "home",
  home: "home",
  home_living: "home",
  "ev yasam": "home",
  furniture: "home",
  // ── alcohol ──────────────────────────────────────────────────────────
  alcohol: "alcohol",
  alkol: "alcohol",
  "alkollu icecekler": "alcohol",
  // ── tobacco ──────────────────────────────────────────────────────────
  tobacco: "tobacco",
  tutun: "tobacco",
  "sigara tutun": "tobacco",
  // ── pharmacy ─────────────────────────────────────────────────────────
  pharmacy: "pharmacy",
  eczane: "pharmacy",
  // ── services ─────────────────────────────────────────────────────────
  services: "services",
  service: "services",
  "hizmet diger": "services",
  digital: "services",
  // ── hospitality ──────────────────────────────────────────────────────
  hospitality_lodging: "hospitality",
  hospitality: "hospitality",
  konaklama: "hospitality",
  hotel: "hospitality",
  // ── sports (equipment, bicycles, fitness/outdoor gear) ───────────────
  sports: "sports",
  spor: "sports",
  "spor malzemeleri": "sports",
  sporting_goods: "sports",
  bisiklet: "sports",
  bicycle: "sports",
  fitness: "sports",
  outdoor: "sports",
  kamp: "sports",
  // ── pets ─────────────────────────────────────────────────────────────
  "evcil hayvan urunleri": "pets",
  pet: "pets",
  pets: "pets",
  // ── baby ─────────────────────────────────────────────────────────────
  "bebek urunleri": "baby",
  "baby kids": "baby",
  baby: "baby",
  // ── other ────────────────────────────────────────────────────────────
  other: "other",
  diger: "other",
};

/**
 * Map any historical/raw category_lvl1 label to a canonical English-short value.
 * Returns null for empty input (callers decide whether to leave NULL or fall
 * back to a roof category). Unknown non-empty labels return "other" so the
 * column never holds an off-taxonomy value again.
 */
export function normalizeProductCategoryLvl1(
  raw: string | null | undefined
): CanonicalProductCategory | null {
  if (raw == null) return null;
  const key = normKey(String(raw));
  if (!key) return null;
  if (CANONICAL_SET.has(key)) return key as CanonicalProductCategory;
  const mapped = LVL1_ALIASES[key];
  if (mapped) return mapped;
  // Token-level fallback: catch compound headings not listed verbatim.
  const tokens = key.split(" ");
  for (const t of tokens) {
    if (CANONICAL_SET.has(t)) return t as CanonicalProductCategory;
    if (LVL1_ALIASES[t]) return LVL1_ALIASES[t];
  }
  return "other";
}

export function isCanonicalProductCategory(
  value: string | null | undefined
): value is CanonicalProductCategory {
  return value != null && CANONICAL_SET.has(value);
}
