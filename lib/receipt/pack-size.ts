/**
 * Piece-pack counts from receipt names / pack_size fields.
 * Used by Analysis comparable prices and the price-ledger clean layer.
 * Never invents a pack when the paper does not encode one.
 */

/** Parse "30", "30adet", "15pcs", "6lu" → piece count. */
export function parsePackCount(raw: string | number | null | undefined): number | null {
  if (raw == null || raw === "") return null;
  if (typeof raw === "number") {
    return Number.isFinite(raw) && raw >= 2 && raw <= 200 ? raw : null;
  }
  const s = String(raw).trim();
  if (!s) return null;

  const pure = Number(s.replace(",", "."));
  if (Number.isFinite(pure) && pure >= 2 && pure <= 200 && !/[a-zA-ZçğıöşüÇĞİÖŞÜ]/.test(s)) {
    return pure;
  }

  const m =
    s.match(/^(\d+(?:[.,]\d+)?)\s*(adet|ad|pcs|pk|li|lı|lu|lü)\b/i) ||
    s.match(/(\d+)\s*(adet|ad|pcs|pk)\b/i);
  if (!m) return null;
  const n = Number(m[1].replace(",", "."));
  return Number.isFinite(n) && n >= 2 && n <= 200 ? n : null;
}

/**
 * Infer multipack piece count from a product name.
 * Prefers Nx… (6x200ml → 6) over trailing 'li / AD suffixes.
 */
export function inferPiecePackCountFromName(name: string | null | undefined): number | null {
  if (!name) return null;
  const s = name.trim();
  if (!s) return null;

  const multi = s.match(/(\d+)\s*[x×]\s*\d+(?:[.,]\d+)?\s*(ml|cl|l|lt|g|gr|kg)?\b/i);
  if (multi) {
    const n = Number(multi[1]);
    if (Number.isFinite(n) && n >= 2 && n <= 200) return n;
  }

  const patterns: RegExp[] = [
    /(\d+)\s*[''`´]?\s*(?:li|lı|lu|lü)\b/i,
    /(\d+)\s*(?:ad(?:et)?)\b/i,
    /\b(\d+)\s*l[iıuü]\b/i,
  ];
  for (const re of patterns) {
    const m = s.match(re);
    if (!m) continue;
    const n = Number(m[1]);
    if (Number.isFinite(n) && n >= 2 && n <= 200) return n;
  }
  return null;
}

/** Column pack_size first, then name. */
export function resolvePiecePackCount(input: {
  name?: string | null;
  packSize?: string | number | null;
}): number | null {
  return parsePackCount(input.packSize) ?? inferPiecePackCountFromName(input.name ?? null);
}

/**
 * Divide a carton/ multipack total into a per-piece price when qty is the
 * number of cartons (usually 1). When qty already counts pieces, return as-is.
 */
export function pricePerPiece(perPack: number, qty: number, pack: number): number | null {
  if (!(perPack > 0) || !(pack > 1)) return null;
  if (Math.abs(qty - pack) < 0.01) return perPack;
  if (qty > pack && Math.abs(qty % pack) < 0.01) return perPack;
  const perUnit = perPack / pack;
  return Number.isFinite(perUnit) && perUnit > 0 ? perUnit : null;
}

/** Bare grocery labels that mix unrelated SKUs — not comparable as one series. */
const UMBRELLA_SLUGS = new Set([
  "ekmek",
  "su",
  "cay",
  "alkol",
  "konaklama",
  "ilac",
  "servis_ucreti",
  "servis_ucret",
  "bilinmeyen_urun",
  "cihaz",
  "cihaz_1",
]);

export function isUmbrellaProductSlug(normalisedName: string): boolean {
  return UMBRELLA_SLUGS.has(normalisedName);
}

export function isEggProductName(name: string): boolean {
  const n = name.toLocaleLowerCase("tr-TR");
  if (!n.includes("yumurta")) return false;
  if (
    /(joy|sürpriz|surpriz|oyuncak|çikol|cikol|sandvi|sandwic|erişte|eriste|makarna|tipas[ıi]|kahvalt)/i.test(
      n,
    )
  ) {
    return false;
  }
  return true;
}

/** Unsized egg carton total filed as a single adet — not a per-egg price. */
export function isUnsizedEggCarton(input: {
  name: string;
  pack: number | null;
  qty: number;
  perPack: number;
  unitType?: string | null;
}): boolean {
  const unit = (input.unitType ?? "").toLowerCase();
  if (unit === "kg" || unit === "g") return false;
  if (input.pack != null) return false;
  if (!isEggProductName(input.name)) return false;
  if (input.qty > 1.01) return false;
  return input.perPack >= 40;
}
