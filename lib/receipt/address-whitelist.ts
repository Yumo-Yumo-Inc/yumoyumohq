/**
 * Address whitelist for Turkey
 * Used to validate address patterns and reject address-like text as merchant names.
 * 81 provinces and 973 districts: mehmetkiran/turkiye-ilceler.json
 */

import turkeyData from "./data/turkey-il-ilce.json";

// Known brand names that should be prioritized / used for address heuristics (MY).
// Kept as a module export so other utilities can reuse safely.
export const knownBrands = [
  'shell', 'bp', 'petrol ofisi', 'tüpraş', 'opet', 'total', 'migros', 'carrefour',
  'a101', 'bim', 'şok', 'metro', 'real', 'koçtaş', 'ikea', 'media markt',
  'teknosa', 'vatan', 'mcdonalds', 'burger king', 'kfc', 'starbucks', 'gloria jeans',
  'zara', 'mango', 'h&m', 'lc waikiki', 'defacto', 'koton', 'mavi', 'watsons',
  'zus',
  // Common merchant type keywords (boost confidence)
  'cafe', 'restaurant', 'restoran', 'coffee', 'shop', 'store', 'market', 'supermarket',
  'lounge', 'game', 'bar', 'pub'
];

/** Normalizes text to lowercase, ASCII-like form (for comparison). */
function normalizeForMatch(text: string): string {
  return text
    .toLowerCase()
    .replace(/ı/g, "i")
    .replace(/İ/g, "i")
    .replace(/ğ/g, "g")
    .replace(/Ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/Ü/g, "u")
    .replace(/ş/g, "s")
    .replace(/Ş/g, "s")
    .replace(/ö/g, "o")
    .replace(/Ö/g, "o")
    .replace(/ç/g, "c")
    .replace(/Ç/g, "c");
}

/** Turkish address terms — street, neighborhood, avenue, etc. */
export const ADDRESS_TERMS = new Set([
  "mah", "mah.", "mahalle", "mahallesi", "mh", "mh.",
  "sok", "sok.", "sokak", "sokağı", "sokagi", "sk", "sk.",
  "cad", "cad.", "cadde", "caddesi", "cd", "cd.",
  "bulvar", "bulvarı", "bulvari", "blv", "blv.", "bulv",
  "yol", "yolu", "yy", "yy.",
  "no", "no.", "numara", "num", "apt", "apartman", "kat", "daire", "d",
  "blok", "bina", "site",
  "iş", "is", "merkezi",
  "vergi dairesi", "vd", "vd.", "mersis", "sicil no",
  "ilçe", "ilce", "il", "semt", "bölge", "bolge", "belde", "köy", "koy",
]);

/** Malaysia address terms — not valid as merchant name alone (Jalan, No, Lot, etc.) */
export const MY_ADDRESS_TERMS = new Set([
  "jalan", "jl", "jl.", "lorong", "lg", "lot", "taman", "persiaran", "no", "no.",
  "bangunan", "blok", "tingkat", "floor", "kompleks", "pusat", "wisma",
]);

/** Turkey's 81 provinces + 973 districts (normalized) */
const _citySet = new Set<string>();
const _districtSet = new Set<string>();
const data = turkeyData as Record<string, string[]>;
for (const city of Object.keys(data)) {
  _citySet.add(normalizeForMatch(city));
  for (const district of data[city] || []) {
    _districtSet.add(normalizeForMatch(district));
  }
}
export const TURKEY_CITIES = _citySet;
export const TURKEY_DISTRICTS = _districtSet;

/** Primary address terms — mah, sok, cad, il/ilçe, etc. Without at least one of these, "no"/"numara"/"apt" alone does not count as an address. */
export const PRIMARY_ADDRESS_TERMS = new Set([
  "mah", "mah.", "mahalle", "mahallesi", "mh", "mh.",
  "sok", "sok.", "sokak", "sokağı", "sokagi", "sk", "sk.",
  "cad", "cad.", "cadde", "caddesi", "cd", "cd.",
  "bulvar", "bulvari", "blv", "blv.", "bulv",
  "yol", "yolu", "ilce", "ilçe", "il", "semt", "bolge", "bölge", "belde", "koy", "köy",
  "street", "st", "avenue", "ave", "road", "rd", "boulevard", "blvd", "drive", "dr", "lane", "ln",
  "jl", "jalan", "kecamatan", "kabupaten", "desa", "kelurahan", "gang", "gg", "perumahan", "komplek",
]);

/** Secondary address terms — these alone do not count as an address; a primary term (mah/sok/il/ilçe, etc.) is also required. */
export const SECONDARY_ADDRESS_TERMS = new Set([
  "no", "no.", "numara", "num", "apt", "apartman", "kat", "daire", "d",
  "blok", "bina", "site", "merkez", "avm", "plaza", "konak",
]);

/**
 * Checks whether the text contains an address term.
 * Splits into words and compares against ADDRESS_TERMS, TURKEY_CITIES, TURKEY_DISTRICTS.
 */
export function containsAddressTerm(text: string): boolean {
  if (!text || typeof text !== "string") return false;
  const normalized = normalizeForMatch(text);
  const words = normalized.split(/\s+/).map((w) => w.replace(/[.,;:!?/]+$/, ""));
  for (const word of words) {
    if (word.length < 2) continue;
    if (ADDRESS_TERMS.has(word))
      return true;
  }
  return false;
}

/**
 * Does the text contain a primary address term (mah, sok, il, ilçe, etc.)?
 * Used to prevent "no"/"numara"/"apt" alone from counting as an address.
 */
export function hasPrimaryAddressTerm(text: string): boolean {
  if (!text || typeof text !== "string") return false;
  const normalized = normalizeForMatch(text);
  const words = normalized.split(/\s+/).map((w) => w.replace(/[.,;:!?/]+$/, ""));
  for (const word of words) {
    if (word.length < 2) continue;
    if (PRIMARY_ADDRESS_TERMS.has(word) || TURKEY_CITIES.has(word) || TURKEY_DISTRICTS.has(word))
      return true;
  }
  return false;
}

/**
 * Checks whether a merchant name candidate looks like an address.
 * Returns true if it contains an address term (should not be used as the merchant name, or should be trimmed).
 * Exception: a 2-word "BRAND + DISTRICT" (e.g. AKRA KEMER) — if the first word is not an address term, accept it as a merchant name.
 */
export function looksLikeAddress(text: string): boolean {
  if (!text || text.trim().length < 5) return false;

  const normalized = text.toLowerCase().replace(/[^a-z0-9çğıöşü\s]/g, "");
  const hasKnownBrand = knownBrands.some(brand => normalized.includes(brand));
  if (hasKnownBrand) {
    return false; // Known brand present — do not count as an address (e.g. Kemer Migros)
  }

  if (!containsAddressTerm(text)) return false;
  // Exception: exactly 2 words; if the first word is not an address/province/district term → "BRAND + DISTRICT" (e.g. AKRA KEMER)
  const words = text.trim().split(/\s+/).map((w) => w.replace(/[.,;:!?/]+$/, "").toLowerCase());
  if (words.length === 2) {
    const first = normalizeForMatch(words[0]);
    if (first.length >= 3 && !ADDRESS_TERMS.has(first) && !TURKEY_CITIES.has(first) && !TURKEY_DISTRICTS.has(first))
      return false;
  }
  return true;
}

/**
 * Malaysia: merchant name candidate looks like address (Jalan, No, Lot, etc.).
 * Use when detectedCountry === "MY" to avoid accepting address-only text as merchant.
 */
export function looksLikeAddressMY(text: string): boolean {
  if (!text || text.trim().length < 5) return false;
  const normalized = text.toLowerCase().replace(/[^a-z0-9\s]/g, "");

  // Check if the text contains a known brand first
  const hasKnownBrand = knownBrands.some(brand => normalized.includes(brand));
  if (hasKnownBrand) {
    return false; // If it's a known brand, it's not an address
  }

  const words = normalized.split(/\s+/).map((w) => w.replace(/[.,;:!?/]+$/, ""));
  for (const word of words) {
    if (word.length < 2) continue;
    if (MY_ADDRESS_TERMS.has(word)) return true;
  }
  return false;
}
