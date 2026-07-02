export type GuardedProductCategory = "alcohol" | "tobacco" | "fuel";

function normalizeProductText(value: string): string {
  return value
    .toLowerCase()
    .replace(/\u0131/g, "i")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\u015f/g, "s")
    .replace(/\u011f/g, "g")
    .replace(/\u00fc/g, "u")
    .replace(/\u00f6/g, "o")
    .replace(/\u00e7/g, "c");
}

function hasAnyPattern(text: string, patterns: RegExp[]): boolean {
  return patterns.some((pattern) => pattern.test(text));
}

const NON_ALCOHOLIC_PATTERNS = [
  /\broot\s+beer\b/,
  /\bginger\s+beer\b/,
  /\balkolsuz\b/,
  /\bnon\s*alcoholic\b/,
];

const ALCOHOL_PATTERNS = [
  /\balkol\b/,
  /\bbira\b/,
  /\bsarap\b/,
  /\braki\b/,
  /\bvotka\b/,
  /\bvodka\b/,
  /\bviski\b/,
  /\bwhisk(?:e)?y\b/,
  /\bwine\b/,
  /\bbeer\b/,
  /\bliquor\b/,
  /\blikor\b/,
  /\btekila\b/,
  /\btequila\b/,
  /\btuborg\b/,
  /\befes\b/,
  /\bbomonti\b/,
  /\bheineken\b/,
  /\bcarlsberg\b/,
  /\bcorona\b/,
  /\bsmirnoff\b/,
  /\babsolut\b/,
  /\bjack\s*daniels\b/,
  /\bbaileys\b/,
];

const TOBACCO_PATTERNS = [
  /\bsigara\b/,
  /\btutun\b/,
  /\btobacco\b/,
  /\bcigarette\b/,
  /\bmarlboro\b/,
  /\bcamel\b/,
  /\bparliament\b/,
  /\bchesterfield\b/,
  /\bwinston\b/,
  /\biqos\b/,
  /\bheets\b/,
];

const FUEL_PATTERNS = [
  /\bbenzin\b/,
  /\bmotorin\b/,
  /\bdizel\b/,
  /\bdiesel\b/,
  /\bgasoline\b/,
  /\blpg\b/,
  /\boto\s*gaz\b/,
  /\bakaryakit\b/,
  /\bkursunsuz\b/,
  /\beuro\s*diesel\b/,
  /\bsvp\b/,
];

export function detectGuardedProductCategory(
  value: string | null | undefined
): GuardedProductCategory | null {
  if (!value?.trim()) return null;
  const text = normalizeProductText(value);

  if (hasAnyPattern(text, TOBACCO_PATTERNS)) return "tobacco";
  if (hasAnyPattern(text, FUEL_PATTERNS)) return "fuel";
  if (
    hasAnyPattern(text, ALCOHOL_PATTERNS) &&
    !hasAnyPattern(text, NON_ALCOHOLIC_PATTERNS)
  ) {
    return "alcohol";
  }

  return null;
}
