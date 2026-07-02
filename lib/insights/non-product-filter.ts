/**
 * Decides whether a receipt line item is a real purchased product (so it can
 * appear in the insights "top products" list) or a non-product row.
 *
 * Rules are derived from real geminiLineItems data:
 *  1. Negative price  → discount/refund line ("% 40 İndirim", "30% INDIRIM").
 *  2. "Hizmet & Diğer" category or bag/poşet/çanta name → bags, service fees,
 *     utility-bill line items (ATIK SU BEDELİ, İşçilik), loyalty, etc.
 *  3. Bill/tax keywords → KDV, YUVARLAMA, Toplam Fatura, TÜKETİM BEDELİ, ALACAK…
 *  4. OCR fragment "number x number" → "2 ad X 51.00", "19,44 x 5.350,00" — a
 *     misread quantity×price line, not a product.
 *  5. The signed-in user's own name (exact match).
 *  6. No price at all → header/name/code rows captured without a price.
 *
 * Conservative for multilingual products: a positively-priced row in a real
 * product category with a non-keyword name is kept, even if non-Latin.
 */

export function fold(value: string | null | undefined): string {
  return (value || "")
    .toLowerCase()
    .replace(/ı/g, "i").replace(/İ/g, "i").replace(/i̇/g, "i")
    .replace(/ş/g, "s").replace(/ğ/g, "g").replace(/ü/g, "u")
    .replace(/ö/g, "o").replace(/ç/g, "c")
    .replace(/[^a-z0-9 ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// Bill/tax/payment/discount/bag line items (folded, matches on substring).
const NONPRODUCT_KEYWORDS = [
  "poset", "canta nonwoven", "alisveris canta",
  "indirim", "iskonto", "kampanya",
  "kdv", "toplam", "ara toplam", "genel toplam", "fatura tutar", "fatura toplam",
  "tuketim bedeli", "atik su", "su tuketim", "abonelik", "abonenin alacagi",
  "guvence bedeli", "gecikme bedeli", "acma kapama", "usulsuz kullanim",
  "yuvarlama", "duzeltme katsayisi", "diger bedel",
  "iscilik", "alacak", "nakit", "para ustu", "puan",
];

// Non-product categories (even when priced).
const NONPRODUCT_CATEGORIES = new Set<string>([
  "hizmet diger", // "Hizmet & Diğer" folded
  "diger",        // "Diğer"
]);

// OCR fragment pattern: "2 ad X 51.00", "20 X 10,00", "19,44 x 5.350,00", "AD x 17,50".
const OCR_FRAGMENT = /^\s*\d*[.,]?\d*\s*(ad|adt|adet)?\s*[xX]\s*[\d.,]+/;

export function isNonProductLine(name: string | null | undefined): boolean {
  const f = fold(name);
  if (!f) return true;
  for (const k of NONPRODUCT_KEYWORDS) {
    if (f.includes(k)) return true;
  }
  return false;
}

export function shouldExcludeLineItem(
  name: string | null | undefined,
  totalPrice: number | null,
  category: string | null | undefined,
  userNameFolds: Set<string>
): boolean {
  const raw = (name || "").trim();
  if (!raw) return true;

  // 1) negative price → discount/refund.
  if (totalPrice != null && totalPrice < 0) return true;

  // 4) OCR fragment (number x number).
  if (OCR_FRAGMENT.test(raw)) return true;

  const f = fold(name);
  const cat = fold(category);

  // 2) non-product category (bag, service, bill line item).
  if (cat && NONPRODUCT_CATEGORIES.has(cat)) return true;

  // 3) bill/tax/payment/bag keywords.
  if (f && isNonProductLine(name)) return true;

  // 5) the signed-in user's own name.
  if (f && userNameFolds.size > 0 && userNameFolds.has(f)) return true;

  // 6) unpriced line (totalPrice missing or 0) → header/name/code.
  if (totalPrice == null || totalPrice === 0) return true;

  return false;
}

export function buildUserNameFolds(displayName: string | null | undefined): Set<string> {
  const out = new Set<string>();
  const f = fold(displayName);
  if (!f) return out;
  out.add(f);
  const words = f.split(" ").filter(Boolean);
  if (words.length === 2) out.add(`${words[1]} ${words[0]}`);
  return out;
}


// Single-line items that are just a category name: "Yiyecek", "GIDA", "YEMEK",
// "GİYİM", "İçecek" — the model writes these when a restaurant/clothing receipt
// has no itemized breakdown. Not a product; the UI labels it with the category
// context instead of dropping it.
const CATEGORY_NAME_WORDS = new Set<string>([
  "yiyecek", "yemek", "gida", "icecek", "giyim", "tekstil", "kozmetik",
  "hizmet", "urun", "food", "drink", "beverage", "clothing", "apparel",
]);

export function isCategoryNameItem(name: string | null | undefined): boolean {
  const f = fold(name);
  if (!f) return false;
  // Single word and present in the category-name list.
  return CATEGORY_NAME_WORDS.has(f);
}
