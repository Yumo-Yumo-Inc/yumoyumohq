export function foldForComparison(value: string): string {
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

export function normalizeNameText(
  value: string | null | undefined,
  options?: { maxLength?: number }
): string | null {
  if (typeof value !== "string") return null;
  const maxLength = options?.maxLength ?? 160;
  const normalized = value
    .normalize("NFKC")
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .replace(/\s+/g, " ")
    .replace(/\s+([,.;:!?%])/g, "$1")
    .replace(/([([{])\s+/g, "$1")
    .replace(/\s+([)\]}])/g, "$1")
    .trim();

  if (!normalized) return null;
  return normalized.length > maxLength ? normalized.slice(0, maxLength).trim() : normalized;
}

export function normalizeMerchantDisplayName(value: string | null | undefined): string | null {
  const normalized = normalizeNameText(value, { maxLength: 120 });
  if (!normalized) return null;
  if (foldForComparison(normalized) === "unknown merchant") return "Unknown Merchant";
  return normalized;
}

export function normalizeItemDisplayName(value: string | null | undefined): string | null {
  const normalized = normalizeNameText(value, { maxLength: 220 });
  if (!normalized) return null;
  return normalized
    .replace(/^\s*[-*\u2022]+\s*/, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function normalizeBrandName(
  value: string | null | undefined,
  itemName?: string | null
): string | null {
  const normalized = normalizeNameText(value, { maxLength: 80 });
  if (!normalized) return null;

  // A brand is a name, not a number. Reject values with no letter at all
  // (e.g. "0.56", "1.0", "2,5") — these come from column-misaligned line-item
  // parses where a quantity/price landed in the brand field.
  if (!/\p{L}/u.test(normalized)) return null;

  const brandKey = foldForComparison(normalized).replace(/[^a-z0-9]+/g, "");
  const itemKey = foldForComparison(itemName ?? "").replace(/[^a-z0-9]+/g, "");
  if (!brandKey || brandKey.length < 2) return null;
  if (itemKey && brandKey === itemKey) return null;
  return normalized;
}

export function normalizeCanonicalProductKey(value: string | null | undefined): string | null {
  const normalized = normalizeNameText(value, { maxLength: 220 });
  if (!normalized) return null;
  const folded = foldForComparison(normalized)
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "");
  return folded || null;
}

export function normalizeCategoryText(value: string | null | undefined): string | null {
  return normalizeNameText(value, { maxLength: 80 });
}
