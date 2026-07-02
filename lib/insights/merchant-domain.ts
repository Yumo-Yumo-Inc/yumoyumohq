/**
 * Merchant display name → brand key / domain resolver for the insights logo
 * feature. The matching table is derived from MASTER_MERCHANTS (single source
 * of truth) so there is no duplicated chain list.
 *
 * Two resolvers:
 *  - resolveMerchantBrandKey(name): folded brand key (e.g. "migros") or undefined.
 *    Used to join an incoming merchant name to a merchant_logos row.
 *  - resolveMerchantDomain(name): the brand website domain or undefined.
 *    Kept as a fallback for environments where the DB logo asset is absent.
 *
 * Unknown merchants return undefined — the card shows its icon fallback. We
 * never fabricate a domain or brand for an unmatched merchant.
 *
 * Matching is done on a folded key: lowercased, Turkish characters folded
 * (c, g, i, o, s, u), punctuation and legal suffixes stripped.
 */

import { MASTER_MERCHANTS } from "./merchant-logo-master";

export function foldMerchantKey(value: string | null | undefined): string {
  if (!value) return "";
  let s = value.toLowerCase();
  s = s
    .replace(/ı/g, "i")
    .replace(/İ/g, "i")
    .replace(/i̇/g, "i")
    .replace(/ş/g, "s")
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c");
  s = s.replace(
    /\b(a\.?\s?s\.?|ltd\.?|sti\.?|san\.?|tic\.?|ticaret|anonim|sirketi|limited|inc\.?|gmbh)\b/g,
    " "
  );
  s = s.replace(/[^a-z0-9]+/g, " ").trim().replace(/\s+/g, " ");
  return s;
}

const ALIAS_TO_BRAND: Record<string, string> = {};
const DOMAIN_BY_BRAND: Record<string, string> = {};

for (const m of MASTER_MERCHANTS) {
  if (m.domain) DOMAIN_BY_BRAND[m.brandKey] = m.domain;
  ALIAS_TO_BRAND[m.brandKey] = m.brandKey;
  for (const a of m.aliases) {
    const k = foldMerchantKey(a);
    if (k) ALIAS_TO_BRAND[k] = m.brandKey;
  }
}

/**
 * Resolve a merchant display name to a canonical brand key, or undefined.
 */
export function resolveMerchantBrandKey(
  merchantName: string | null | undefined
): string | undefined {
  const key = foldMerchantKey(merchantName);
  if (!key) return undefined;

  if (ALIAS_TO_BRAND[key]) return ALIAS_TO_BRAND[key];

  for (const alias of Object.keys(ALIAS_TO_BRAND)) {
    if (key === alias || key.startsWith(alias + " ")) {
      return ALIAS_TO_BRAND[alias];
    }
  }

  const firstToken = key.split(" ")[0];
  if (ALIAS_TO_BRAND[firstToken]) return ALIAS_TO_BRAND[firstToken];

  return undefined;
}

/**
 * Resolve a merchant display name to a logo domain, or undefined.
 * Never fabricates a domain.
 */
export function resolveMerchantDomain(
  merchantName: string | null | undefined
): string | undefined {
  const brand = resolveMerchantBrandKey(merchantName);
  if (!brand) return undefined;
  return DOMAIN_BY_BRAND[brand];
}
