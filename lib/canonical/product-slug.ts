/**
 * Deterministic canonical product slug + normalized dedup key.
 *
 * The LLM proposes display fields (brand, name, size); the slug itself is
 * always built here so spelling/punctuation variance in LLM output can no
 * longer create duplicate canonical_products rows. A unique index on
 * productNormKey (migration 119) is the DB-level backstop.
 */

const TR_FOLD: Record<string, string> = {
  ı: "i",
  ş: "s",
  ğ: "g",
  ü: "u",
  ö: "o",
  ç: "c",
  İ: "i",
  Ş: "s",
  Ğ: "g",
  Ü: "u",
  Ö: "o",
  Ç: "c",
};

function foldTurkish(s: string): string {
  return s.replace(/[ışğüöçİŞĞÜÖÇ]/g, (c) => TR_FOLD[c] ?? c);
}

/** ASCII snake_case: "Tadım Antep Fıstığı" → "tadim_antep_fistigi" */
function slugifyToken(s: string): string {
  return foldTurkish(s)
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

/**
 * Punctuation-insensitive dedup key. "su_0_5l", "su 0.5 l" and "su_05l"
 * all reduce to "su05l". Mirrors the expression index in migration 119 —
 * keep the two in sync.
 */
export function productNormKey(name: string): string {
  return foldTurkish(name).toLowerCase().replace(/[^a-z0-9]/g, "");
}

// Unit/size tokens that carry no product identity on their own.
const SIZE_TOKEN_RE = /^(?:\d+|x|xl|adet|ad|li|lu|lt|l|ml|cl|g|gr|kg|mg|pk|pcs|adt)$|^\d+(?:x\d+)?(?:l|ml|cl|g|gr|kg|mg|lt)?$/;

/**
 * True when a canonical slug names only a size/unit ("1_5_l", "75_g",
 * "2_5_l") — nothing identifies a product, so no canonical row should be
 * created from it. "su_0_5_l" and "pepsi_1_5_l" keep a real token and pass.
 */
export function isSizeOnlyProductSlug(slug: string): boolean {
  const tokens = slug.split("_").filter(Boolean);
  if (tokens.length === 0) return true;
  return tokens.every((t) => SIZE_TOKEN_RE.test(t));
}

export interface CanonicalSlugParts {
  brand?: string | null;
  /** Human product name (display_name_tr preferred, LLM key as fallback) */
  name: string;
  unitSize?: string | null;
  unitType?: string | null;
}

/**
 * Build the canonical_name slug in code: brand + name + size.
 * Size digits are normalized (0.5 → 0_5) but always derived the same way,
 * so two receipts of the same product produce the same slug.
 */
export function buildCanonicalProductSlug(parts: CanonicalSlugParts): string {
  const brand = parts.brand ? slugifyToken(parts.brand) : "";
  let name = slugifyToken(parts.name);
  // Avoid "ulker_ulker_cikolata" when the LLM already put the brand in the name
  if (brand && name.startsWith(`${brand}_`)) name = name.slice(brand.length + 1);

  const size =
    parts.unitSize != null && `${parts.unitSize}`.trim() !== ""
      ? slugifyToken(`${parts.unitSize}${parts.unitType ?? ""}`)
      : "";

  const pieces = [brand, name, size].filter(Boolean);
  // Skip the size piece when the name already embeds it ("gofret_47g" + "47g")
  if (size && name && productNormKey(name).endsWith(productNormKey(size))) {
    pieces.splice(pieces.indexOf(size), 1);
  }
  return pieces.join("_").replace(/_{2,}/g, "_").slice(0, 120) || "unknown_product";
}
