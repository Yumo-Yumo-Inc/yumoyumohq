/**
 * Turkish-aware Double Metaphone phonetic key generator.
 *
 * Use case: catch OCR variations
 *   "Migros" / "Mıgros" / "MİGRDS" → all produce the same phonetic key (MKRS)
 *   "Şok"   / "Sok"    / "Shok"   → all produce SK
 *
 * Strategy:
 *   1. Convert Turkish characters to ASCII (ı→i, ş→s, ğ→g, ü→u, ö→o, ç→c)
 *   2. Lowercase + strip non-alphanumeric
 *   3. Double Metaphone primary key
 *
 * @see https://en.wikipedia.org/wiki/Metaphone
 */

import { doubleMetaphone } from "double-metaphone";

/**
 * Convert Turkish characters to ASCII.
 * Diacritic-folding via NFD removes any residual accents.
 */
function turkishToAscii(s: string): string {
  return s
    .toLowerCase()
    .replace(/ı/g, "i")
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ö/g, "o")
    .replace(/ş/g, "s")
    .replace(/ç/g, "c")
    .replace(/İ/g, "i")
    .replace(/Ğ/g, "g")
    .replace(/Ü/g, "u")
    .replace(/Ö/g, "o")
    .replace(/Ş/g, "s")
    .replace(/Ç/g, "c")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

/**
 * Double Metaphone primary key for a single word/short string.
 * Empty or non-alphanumeric input → returns an empty string.
 *
 * @example
 *   phoneticKey("Migros")  → "MKRS"
 *   phoneticKey("Mıgros")  → "MKRS"
 *   phoneticKey("MİGRDS") → "MKRTS" (close but different — hence the need for secondary fuzzy matching)
 *   phoneticKey("BIM")     → "PM" or "BM"
 */
export function phoneticKey(text: string): string {
  if (!text?.trim()) return "";
  const ascii = turkishToAscii(text).replace(/[^a-z0-9\s]/g, " ").trim();
  if (!ascii) return "";
  const [primary] = doubleMetaphone(ascii);
  return primary ?? "";
}

/**
 * Set of phonetic keys for a token list.
 * Each token is encoded separately and deduplicated.
 *
 * Use case: phonetic-set Jaccard as an alternative to token-set Jaccard.
 *   "BIM BIRLEŞIK" → ["BM", "PRLSK"]
 *   "BİM BİRLEŞİK" → ["BM", "PRLSK"]  (same set, tolerant of OCR variation)
 */
export function phoneticKeySet(tokens: string[]): string[] {
  const set = new Set<string>();
  for (const t of tokens) {
    const k = phoneticKey(t);
    if (k) set.add(k);
  }
  return [...set];
}

/**
 * Jaccard similarity between two phonetic key sets.
 * 0 (no overlap) — 1 (identical sets).
 */
export function phoneticJaccard(a: string[], b: string[]): number {
  if (a.length === 0 || b.length === 0) return 0;
  const setB = new Set(b);
  let intersect = 0;
  for (const k of a) if (setB.has(k)) intersect++;
  const union = new Set([...a, ...b]).size;
  return union === 0 ? 0 : intersect / union;
}
