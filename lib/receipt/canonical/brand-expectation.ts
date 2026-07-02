/**
 * Brand expectation by category — decides whether a line item *should* carry a
 * brand, so a missing brand can be classified correctly:
 *
 *   - branded category + brand found      → 'resolved'
 *   - branded category + brand missing    → 'needs_user'  (ask the user, never fabricate)
 *   - unbranded category (commodity/service) → 'unbranded' (no brand, no prompt)
 *
 * The taxonomy is the v3 category_path set used by normalize-product-llm.ts
 * (groceries.*, food_service.*, transport.*, health.*, ...).
 *
 * Default: when a category is unknown or unlisted we DO NOT force a brand prompt
 * (treat as not-expected) to avoid prompting the user on every uncategorized
 * line. Packaged goods that matter (snacks, beverages, dairy, cleaning, ...) are
 * covered by the explicit branded set below.
 */

import { foldForComparison } from "../name-normalization";

export type BrandStatus =
  | "resolved"
  | "unbranded"
  | "needs_user"
  | "user_provided";

/**
 * Generic department / aisle / umbrella line labels that are NOT a product, so
 * asking the user for a brand is pointless — these classify as 'unbranded', not
 * 'needs_user'. Matched on the folded full label (exact), so a real product that
 * merely contains the word ("ÇAY BARDAĞI", "SU BÖREĞİ") is unaffected.
 * Folded form: lowercase, Turkish-folded, alnum, single-spaced.
 */
const GENERIC_PRODUCT_TERMS = new Set<string>([
  // Department / aisle / umbrella terms
  "yiyecek", "gida", "t gida", "tgida", "gida urunleri", "icecek", "mesrubat",
  "mesrub", "alkol", "icki", "giyim", "ayakkabi", "tekstil", "boya", "hirdavat",
  "zuccaciye", "kozmetik", "temizlik", "kirtasiye", "oyuncak", "sigara", "tutun",
  "ilac", "su", "market", "kasa", "manav", "muhtelif", "diger", "urun",
  // Product-type generics with no brand on the label (user-approved)
  "dondurma", "ayran", "ketcap", "kecap", "mayonez",
]);

/** True when a raw line label is a generic category/department word, not a product. */
export function isGenericProductTerm(rawName: string | null | undefined): boolean {
  if (!rawName) return false;
  const folded = foldForComparison(rawName)
    .replace(/[^a-z0-9 ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return GENERIC_PRODUCT_TERMS.has(folded);
}

/**
 * Category prefixes whose products are genuine commodities or services where a
 * consumer brand is not expected. The merchant — not a product brand — is the
 * identity here (a fuel station, a café, a clinic). Matched as path prefixes.
 */
const UNBRANDED_PREFIXES: readonly string[] = [
  // Fresh / by-weight commodities
  "groceries.produce", // fresh_veg, fresh_fruit
  "groceries.meat_fish.red_meat",
  "groceries.meat_fish.poultry",
  "groceries.meat_fish.fish_seafood",
  "groceries.bakery.bread", // open/loose bread (packaged bread is rare on TR receipts)
  // Services — the merchant is the brand, not the line item
  "food_service",
  "transport",
  "tourism",
  "services",
  "health.doctor_visit",
  "health.dentist",
  "health.lab_test",
  "health.optician",
  "education.course",
  "education.online_edu",
  "finance",
];

/**
 * Category prefixes whose products are packaged consumer goods that almost
 * always carry a brand. A missing brand here is a gap to fill, not a commodity.
 */
const BRANDED_PREFIXES: readonly string[] = [
  "groceries.beverages",
  "groceries.dairy_eggs",
  "groceries.dry_goods",
  "groceries.snacks_nuts",
  "groceries.cleaning",
  "groceries.personal_care",
  "groceries.baby_child",
  "groceries.alcohol",
  "groceries.tobacco",
  "groceries.meat_fish.deli_sausage", // sucuk, salam, sosis — branded
  "health.medicine_otc",
  "health.medicine_rx",
  "health.supplements",
  "fashion",
  "electronics",
  "home_living",
  "entertainment.streaming",
];

function matchesAnyPrefix(path: string, prefixes: readonly string[]): boolean {
  return prefixes.some((p) => path === p || path.startsWith(p + "."));
}

/**
 * Whether a brand is expected for the given category_path. Unknown/unlisted
 * categories return false (do not prompt). Explicit unbranded prefixes win over
 * branded ones when both could match (none currently overlap, but the order is
 * intentional and defensive).
 */
export function brandExpectedForCategory(
  categoryPath: string | null | undefined
): boolean {
  if (!categoryPath) return false;
  const path = categoryPath.trim().toLowerCase();
  if (!path) return false;
  if (matchesAnyPrefix(path, UNBRANDED_PREFIXES)) return false;
  if (matchesAnyPrefix(path, BRANDED_PREFIXES)) return true;
  return false;
}

/**
 * Classify a line item's brand outcome into a brand_status.
 *
 * The LLM verdict is the primary signal because category_path is not always
 * populated (legacy v1 resolve path). The category map is a fallback for items
 * the LLM never saw (fuzzy-matched lines) or returned no verdict for.
 *
 * @param brand        the resolved brand (registry/LLM), or null
 * @param categoryPath v3 category_path for the item (may be null)
 * @param llmVerdict   optional 3-state hint from the LLM extractor
 * @param rawName      raw line label — generic department words skip the prompt
 */
export function classifyBrandStatus(
  brand: string | null | undefined,
  categoryPath: string | null | undefined,
  llmVerdict?: "BRAND" | "UNBRANDED" | "UNKNOWN" | null,
  rawName?: string | null
): BrandStatus {
  if (brand && brand.trim()) return "resolved";
  // Generic department/aisle label (not a product) — never prompt.
  if (isGenericProductTerm(rawName)) return "unbranded";
  // Genuine commodity per the LLM — no brand, no prompt.
  if (llmVerdict === "UNBRANDED") return "unbranded";
  // LLM is confident a brand exists but could not name it → ask the user.
  if (llmVerdict === "BRAND") return "needs_user";
  // No verdict (or UNKNOWN): fall back to category expectation.
  if (brandExpectedForCategory(categoryPath)) return "needs_user";
  return "unbranded";
}
