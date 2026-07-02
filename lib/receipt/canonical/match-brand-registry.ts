/**
 * Deterministic brand matcher backed by brand_registry.
 *
 * Layer 1 of brand resolution: recognise a known brand inside a raw product
 * name without any LLM call (no hallucination, instant, grows as the registry
 * grows). "FANTA PORTAKAL 330 M" → Fanta.
 *
 * `brandNameVariants` is the shared contract between registry *population*
 * (scripts/backfill-brand-registry-variants.ts) and registry *matching* (the
 * lookup here): both must fold names the same way. DB loading lives in
 * resolve-brand.ts; this module is pure (no DB).
 */

import { foldForComparison } from "../name-normalization";

/** One brand_registry row, as needed for matching. */
export interface BrandRegistryEntry {
  slug: string;
  name: string;
  name_variants: string[] | null;
}

/** Minimum length for a usable variant — drops 1–2 char noise ("dr", "on"). */
const MIN_VARIANT_LEN = 3;

/**
 * Fold a brand display name into its match variants:
 *   "Kahve Dünyası" → ["kahve dunyasi", "kahvedunyasi"]
 * Returns a deduped list of lowercase, Turkish-folded forms (spaced + collapsed),
 * each at least MIN_VARIANT_LEN chars. Empty when the name yields nothing usable.
 */
export function brandNameVariants(name: string | null | undefined): string[] {
  if (!name) return [];
  const spaced = foldForComparison(name)
    .replace(/[^a-z0-9 ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!spaced) return [];
  const collapsed = spaced.replace(/ /g, "");
  return [...new Set([spaced, collapsed])].filter((v) => v.length >= MIN_VARIANT_LEN);
}

/** Fold a raw product name into its alnum token list (Turkish-folded). */
function nameTokens(name: string): string[] {
  return foldForComparison(name)
    .replace(/[^a-z0-9 ]+/g, " ")
    .split(/\s+/)
    .filter(Boolean);
}

/** True when `seq` (variant tokens) appears as a consecutive run inside `tokens`. */
function containsSequence(tokens: string[], seq: string[]): boolean {
  if (seq.length === 0 || seq.length > tokens.length) return false;
  for (let i = 0; i + seq.length <= tokens.length; i++) {
    let ok = true;
    for (let j = 0; j < seq.length; j++) {
      if (tokens[i + j] !== seq[j]) {
        ok = false;
        break;
      }
    }
    if (ok) return true;
  }
  return false;
}

/**
 * Recognise a known brand inside a raw product name. Matches on whole-token
 * boundaries (a spaced variant must appear as a consecutive token run; a
 * collapsed variant must equal a whole token), so "cola" never matches inside
 * "chocolate". When several brands match, the longest variant wins (most
 * specific). Returns the brand's proper display name + slug, or null.
 */
export function matchBrandInName(
  rawName: string | null | undefined,
  entries: readonly BrandRegistryEntry[]
): { name: string; slug: string } | null {
  if (!rawName) return null;
  const tokens = nameTokens(rawName);
  if (tokens.length === 0) return null;
  const tokenSet = new Set(tokens);

  let best: { name: string; slug: string } | null = null;
  let bestLen = 0;

  for (const entry of entries) {
    const variants = entry.name_variants?.length
      ? entry.name_variants
      : brandNameVariants(entry.name);
    for (const variant of variants) {
      if (variant.length < MIN_VARIANT_LEN) continue;
      const matched = variant.includes(" ")
        ? containsSequence(tokens, variant.split(" "))
        : tokenSet.has(variant);
      if (matched && variant.length > bestLen) {
        bestLen = variant.length;
        best = { name: entry.name, slug: entry.slug };
      }
    }
  }
  return best;
}
