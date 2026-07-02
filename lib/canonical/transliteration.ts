/**
 * Multi-script → Latin transliteration helper.
 *
 * Use cases:
 *   - "ستاربكس" (Arabic) → "starbks"  → embedding multilingual match
 *   - "สตาร์บัคส์" (Thai) → "sttabaks" → semantic search
 *   - "Привет" (Cyrillic) → "privet"
 *
 * BIM "A." bug fix:
 *   "BIM BIRLESIK MAGAZALAR A." → legal stripped: "BIM BIRLESIK MAGAZALAR A."
 *   Fix: trailing single-letter standalone tokens removed in cleanLatinResidue().
 *
 * Server-side helper. Uses the transliteration npm package — ESM only.
 */

// `transliteration` package: handles Latin/Cyrillic/Greek/Arabic/Thai/CJK
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore — types
import { transliterate as _transliterate } from "transliteration";

/**
 * Convert non-Latin scripts to Latin.
 *   Arabic, Thai, Cyrillic, Greek, CJK, Devanagari → ASCII Latin.
 *   Latin script (Turkish, European) is already preserved as-is in the input.
 *
 * @example
 *   transliterateNonLatin("ستاربكس") → "starbks"
 *   transliterateNonLatin("สตาร์บัคส์") → "sttabaks"
 *   transliterateNonLatin("Starbucks") → "Starbucks"
 *   transliterateNonLatin("Tadım Antep Fıstığı") → "Tadim Antep Fistigi"
 */
export function transliterateNonLatin(text: string): string {
  if (!text) return "";
  try {
    const out = _transliterate(text);
    return typeof out === "string" ? out : String(out);
  } catch {
    return text;
  }
}

/**
 * Script detection — does the text contain Arabic/Thai/Cyrillic characters?
 */
export function detectScript(text: string): "latin" | "arabic" | "thai" | "cyrillic" | "mixed" | "unknown" {
  if (!text) return "unknown";
  const hasArabic = /[؀-ۿݐ-ݿ]/.test(text);
  const hasThai = /[฀-๿]/.test(text);
  const hasCyrillic = /[Ѐ-ӿ]/.test(text);
  const hasLatin = /[a-zA-Z]/.test(text);

  const nonLatinCount = [hasArabic, hasThai, hasCyrillic].filter(Boolean).length;
  // Mixed: more than one non-Latin script, OR Latin + non-Latin
  if (nonLatinCount > 1) return "mixed";
  if (nonLatinCount === 1 && hasLatin) return "mixed";
  if (hasArabic) return "arabic";
  if (hasThai) return "thai";
  if (hasCyrillic) return "cyrillic";
  if (hasLatin) return "latin";
  return "unknown";
}

/**
 * Clean up legal-stripping residue in Latin strings.
 *
 * BIM "A." bug:
 *   Input: "bim birlesik magazalar a"  (leftover after legal stripping)
 *   Cause: the trailing period in "A." meant the single-letter "a" wasn't stripped.
 *   Output: "bim birlesik magazalar"   (trailing single-letter token removed)
 *
 * Rules:
 *   1. Strip trailing single-letter alphabetic tokens ("a", "b" — ASCII)
 *   2. Strip leading single-letter alphabetic tokens ("a")
 *   3. PRESERVE single-letter tokens in the middle (e.g. if "a101" is
 *      alphanumeric, or if there's meaningful content on both sides — "x bim x", not "x x bim")
 *   4. Preserve numeric residue ("a101", "1l", "100ml", etc.)
 */
export function cleanLatinResidue(text: string): string {
  if (!text) return "";
  // Tokenize, convert non-alphanumeric characters to spaces
  const tokens = text
    .split(/[^a-zA-Z0-9]+/u)
    .filter((t) => t.length > 0);
  if (tokens.length === 0) return "";

  // Trim single-letter ALPHABETIC tokens (no digits) from the start and end.
  // Interior tokens are preserved — a single-letter token like "x" surrounded
  // by meaningful content is rarely safe to strip.
  const isPureAlphaSingleChar = (t: string) => t.length === 1 && /^[a-z]$/i.test(t);

  // Trim leading
  let start = 0;
  while (start < tokens.length && isPureAlphaSingleChar(tokens[start])) {
    start++;
  }
  // Trim trailing
  let end = tokens.length;
  while (end > start && isPureAlphaSingleChar(tokens[end - 1])) {
    end--;
  }

  return tokens.slice(start, end).join(" ");
}

/**
 * Full multi-script normalization:
 *   1. transliterateNonLatin (Arabic/Thai/Cyrillic → Latin)
 *   2. lowercase
 *   3. Turkish ı/ş/ğ/ü/ö/ç → ASCII (consistent with preprocess.ts)
 *   4. cleanLatinResidue (BIM bug fix)
 */
export function fullyNormalize(text: string): string {
  if (!text) return "";
  let out = transliterateNonLatin(text);
  out = out.toLowerCase();
  out = out
    .replace(/ı/g, "i")
    .replace(/ş/g, "s")
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
  out = cleanLatinResidue(out);
  return out;
}
