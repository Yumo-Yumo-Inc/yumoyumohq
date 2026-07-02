/**
 * Pre-normalization helpers for canonization.
 *
 * Current scope:
 * - Language detection for tr/en/ms/id/th/ar
 * - Legal suffix stripping
 * - ASCII folding for Latin-script inputs
 * - Tokenization + stop-word filtering
 * - Token set helpers for short-vs-long merchant matching
 *
 * Note:
 * Full Thai/Arabic transliteration is not implemented here yet. For those
 * scripts this helper is still useful for language detection and legal suffix
 * stripping, but tokenization remains Latin-first for now.
 */

// franc-min is ESM-only and its type surface varies by version.
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { franc } from "franc-min";
import { transliterateNonLatin, cleanLatinResidue } from "./transliteration";

export type Lang = "tr" | "en" | "ms" | "id" | "th" | "ar" | "unknown";

const ISO_3_TO_2: Record<string, Lang> = {
  tur: "tr",
  eng: "en",
  msa: "ms",
  ind: "id",
  tha: "th",
  arb: "ar",
};

const LATIN_LEGAL_PATTERNS: Record<"tr" | "en" | "ms" | "id", RegExp[]> = {
  tr: [
    /\b(a\.?\s*s\.?|t\.?\s*a\.?\s*s\.?|anonim\s+sirketi?|ltd\.?\s*s?t?i\.?|limited\s+sirketi?|sti\.?|kollektif|komandit)\b/gi,
    /\b(san\.?(?:\s+ve)?\s*tic\.?|sanayi(?:\s+ve)?\s*ticaret|holding|grup|gida)\b/gi,
    /\b(ticaret|turizm|sanayi|ithalat|ihracat|birlesik|magaza(?:lar)?i?|magazalari?|magazacilik|market(?:ler)?|merkezi?)\b/gi,
    /\b(isletmeleri?|tesisleri?|subesi?|yeni)\b/gi,
  ],
  en: [
    /\b(inc|corp|corporation|ltd|limited|llc|llp|plc|co|company|stores?|holdings?|group|trading|enterprises?|international|intl)\.?\b/gi,
  ],
  ms: [
    /\b(sdn\.?\s*bhd\.?|berhad|bhd|enterprise|sendirian|sdn|kedai|pasaraya)\b/gi,
  ],
  id: [
    /\b(pt|p\.t\.|cv|tbk|persero|perseroan|terbatas|firma|toko|warung)\b/gi,
  ],
};

const NON_LATIN_LEGAL_PATTERNS: Record<"th" | "ar", RegExp[]> = {
  th: [/(บริษัท|จำกัด|มหาชน|ห้าง|ร้าน)/gi],
  ar: [/(ش\.?\s*م\.?\s*ك\.?|شركة|محدودة|مساهمة|تجارة|مجموعة|مؤسسة|متجر|محل)/giu],
};

const STOP_TOKENS_BY_LANG: Record<Lang, string[]> = {
  tr: [
    "ve",
    "ile",
    "icin",
    "nin",
    "in",
    "un",
    "no",
    "sokak",
    "cad",
    "caddesi",
    "sube",
    "subesi",
    "mh",
    "mahalle",
    "mahallesi",
  ],
  en: [
    "the",
    "of",
    "and",
    "for",
    "at",
    "in",
    "on",
    "to",
    "street",
    "st",
    "no",
    "branch",
    "store",
  ],
  ms: ["di", "ke", "dari", "dan", "jalan", "jln", "no", "cawangan"],
  id: ["di", "ke", "dari", "dan", "jalan", "jl", "no", "cabang"],
  th: [],
  ar: [],
  unknown: [],
};

function transliterateToAscii(value: string): string {
  return value
    .toLowerCase()
    .replace(/\u0131/g, "i")
    .replace(/\u011f/g, "g")
    .replace(/\u00fc/g, "u")
    .replace(/\u00f6/g, "o")
    .replace(/\u015f/g, "s")
    .replace(/\u00e7/g, "c")
    .replace(/\u0130/g, "i")
    .replace(/\u011e/g, "g")
    .replace(/\u00dc/g, "u")
    .replace(/\u00d6/g, "o")
    .replace(/\u015e/g, "s")
    .replace(/\u00c7/g, "c")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function normalizeSpaces(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function compactAlphaNumericGaps(value: string): string {
  let out = value;

  // "b i m" -> "bim"
  out = out.replace(/\b(?:[a-z]\s+){2,}[a-z]\b/gi, (match) =>
    match.replace(/\s+/g, "")
  );

  // "a 101" -> "a101"
  out = out.replace(/\b([a-z])\s+(\d{2,})\b/gi, "$1$2");

  return out;
}

function getLatinPatternSweepOrder(lang: Lang): Array<keyof typeof LATIN_LEGAL_PATTERNS> {
  const all: Array<keyof typeof LATIN_LEGAL_PATTERNS> = ["tr", "en", "ms", "id"];
  if (lang === "tr" || lang === "en" || lang === "ms" || lang === "id") {
    return [lang, ...all.filter((item) => item !== lang)];
  }
  return all;
}

function getStopTokenSet(lang: Lang): Set<string> {
  const merged = [
    ...STOP_TOKENS_BY_LANG[lang],
    ...STOP_TOKENS_BY_LANG.tr,
    ...STOP_TOKENS_BY_LANG.en,
  ];

  return new Set(
    merged
      .map((token) => transliterateToAscii(token))
      .map((token) => token.trim())
      .filter(Boolean)
  );
}

export function detectLanguage(text: string, fallback: Lang = "unknown"): Lang {
  if (!text?.trim()) return fallback;
  if (/[\u0600-\u06ff]/.test(text)) return "ar";
  if (/[\u0e00-\u0e7f]/.test(text)) return "th";
  if (text.trim().length < 6) return fallback;

  try {
    const code = franc(text, {
      only: ["tur", "eng", "msa", "ind", "tha", "arb"],
    }) as string;
    return ISO_3_TO_2[code] ?? fallback;
  } catch {
    return fallback;
  }
}

export function stripLegalEntities(text: string, lang: Lang): string {
  if (!text?.trim()) return "";

  let working = text;

  // Step 0: strip non-Latin-script residue (Thai/Arabic legal suffixes),
  // or transliterate all Arabic/Thai glyphs to Latin.
  if (lang === "th" || lang === "ar") {
    for (const pattern of NON_LATIN_LEGAL_PATTERNS[lang]) {
      working = working.replace(pattern, " ");
    }
    // Convert remaining glyphs to Latin (for cross-script embedding match)
    working = transliterateNonLatin(working);
  } else if (lang === "unknown") {
    for (const patterns of Object.values(NON_LATIN_LEGAL_PATTERNS)) {
      for (const pattern of patterns) {
        working = working.replace(pattern, " ");
      }
    }
    // Transliterate in case of mixed script
    if (/[؀-ۿ฀-๿Ѐ-ӿ]/.test(working)) {
      working = transliterateNonLatin(working);
    }
  }

  working = normalizeSpaces(transliterateToAscii(working));
  working = working.replace(/[^a-z0-9\s]+/gi, " ");

  for (const langKey of getLatinPatternSweepOrder(lang)) {
    for (const pattern of LATIN_LEGAL_PATTERNS[langKey]) {
      working = working.replace(pattern, " ");
    }
  }

  // Final cleanup: BIM "A." bug fix — strip leading/trailing single-letter tokens
  // (e.g. "bim birlesik magazalar a" → "bim birlesik magazalar")
  return cleanLatinResidue(
    normalizeSpaces(compactAlphaNumericGaps(working.replace(/[^a-z0-9\s]+/gi, " ")))
  );
}

export function tokenize(text: string): string[] {
  const ascii = transliterateToAscii(text);
  return ascii.split(/[^a-z0-9]+/i).filter((token) => token.length >= 2);
}

export interface NormalizedEntity {
  raw: string;
  language: Lang;
  legalStripped: string;
  asciiNormalized: string;
  tokens: string[];
  contentTokens: string[];
  fingerprint: string;
}

export function normalizeEntity(raw: string, hintedLang?: Lang): NormalizedEntity {
  const safe = (raw ?? "").trim();
  if (!safe) {
    return {
      raw: safe,
      language: hintedLang ?? "unknown",
      legalStripped: "",
      asciiNormalized: "",
      tokens: [],
      contentTokens: [],
      fingerprint: "",
    };
  }

  const language = hintedLang ?? detectLanguage(safe);
  const legalStripped = stripLegalEntities(safe, language);
  const asciiNormalized = normalizeSpaces(transliterateToAscii(legalStripped));
  const tokens = tokenize(asciiNormalized);
  const stopSet = getStopTokenSet(language);
  const contentTokens = tokens.filter((token) => !stopSet.has(token));
  const fingerprint = [...new Set(contentTokens)].sort().join("|");

  return {
    raw: safe,
    language,
    legalStripped: asciiNormalized,
    asciiNormalized,
    tokens,
    contentTokens,
    fingerprint,
  };
}

export function tokenContainment(a: string[], b: string[]): number {
  if (a.length === 0) return 0;
  const setB = new Set(b);
  let intersect = 0;
  for (const token of a) {
    if (setB.has(token)) intersect++;
  }
  return intersect / a.length;
}

export function tokenJaccard(a: string[], b: string[]): number {
  if (a.length === 0 && b.length === 0) return 0;
  const setA = new Set(a);
  const setB = new Set(b);
  let intersect = 0;
  for (const token of setA) {
    if (setB.has(token)) intersect++;
  }
  const union = new Set([...a, ...b]).size;
  return union === 0 ? 0 : intersect / union;
}

export function hasAnchorToken(queryTokens: string[], candidateTokens: string[]): boolean {
  if (queryTokens.length === 0) return false;
  const longestQueryToken = [...queryTokens].sort((a, b) => b.length - a.length)[0];
  return candidateTokens.includes(longestQueryToken);
}
