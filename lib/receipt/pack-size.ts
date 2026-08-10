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

/**
 * Size / pack already printed on the receipt name (100g, 1.5L, 15'li, 6x200ml).
 * When true, we do not ask the crowd and do not hold for MISSING_PACK.
 */
export function nameEncodesPackOrSize(name: string | null | undefined): boolean {
  if (!name?.trim()) return false;
  const s = name.trim();
  if (PACK_IN_NAME_RE.test(s)) return true;
  if (inferPiecePackCountFromName(s) != null) return true;
  if (/\b\d+\s*[x×]\s*\d+/i.test(s)) return true;
  return false;
}

/** Normalize a user pack answer into a compact token: 100g, 1.5l, 15adet. */
export function parseUserPackAnswer(raw: string | null | undefined): {
  packSize: string;
  unitType: string | null;
} | null {
  if (!raw?.trim()) return null;
  let s = raw.trim().toLocaleLowerCase("tr-TR").replace(/\s+/g, " ");
  s = s.replace(/,/g, ".");

  const piece =
    s.match(/^(\d+(?:\.\d+)?)\s*(?:[''`´]?\s*)?(?:li|lı|lu|lü|adet|ad|pcs|pk)\b/i) ||
    s.match(/^(\d+(?:\.\d+)?)\s*adet\b/i);
  if (piece) {
    const n = Number(piece[1]);
    if (Number.isFinite(n) && n >= 2 && n <= 200) {
      return { packSize: `${Math.round(n)}adet`, unitType: "adet" };
    }
  }

  const massVol = s.match(/^(\d+(?:\.\d+)?)\s*(kg|g|gr|gram|ml|cl|lt|l)\b/i);
  if (massVol) {
    const n = Number(massVol[1]);
    if (!(Number.isFinite(n) && n > 0 && n < 100000)) return null;
    let unit = massVol[2].toLowerCase();
    if (unit === "gr" || unit === "gram") unit = "g";
    if (unit === "lt") unit = "l";
    return { packSize: `${n}${unit}`, unitType: unit === "g" || unit === "kg" ? unit : unit };
  }

  // Bare integer 2–200 → piece pack (common chip tap "15")
  const bare = Number(s);
  if (Number.isFinite(bare) && bare >= 2 && bare <= 200 && !/[a-zçğıöşü]/i.test(s)) {
    return { packSize: `${Math.round(bare)}adet`, unitType: "adet" };
  }

  return null;
}

/** Common pack chips shown on product_pack_size tasks. */
export const PACK_SIZE_CANDIDATE_CHIPS: ReadonlyArray<{ label: string; packSize: string }> = [
  { label: "100 g", packSize: "100g" },
  { label: "200 g", packSize: "200g" },
  { label: "250 g", packSize: "250g" },
  { label: "500 g", packSize: "500g" },
  { label: "1 kg", packSize: "1kg" },
  { label: "200 ml", packSize: "200ml" },
  { label: "500 ml", packSize: "500ml" },
  { label: "1 L", packSize: "1l" },
  { label: "1.5 L", packSize: "1.5l" },
  { label: "6'lı", packSize: "6adet" },
  { label: "10'lu", packSize: "10adet" },
  { label: "12'li", packSize: "12adet" },
  { label: "15'li", packSize: "15adet" },
  { label: "30'lu", packSize: "30adet" },
];

/**
 * Packaged shelf goods without a usable pack — hold out of the sealed ledger and
 * route to the Contribution Center. Weighed produce (kg) and fuel are out of scope.
 */
export function needsCrowdPackHint(input: {
  name: string;
  packSize?: string | number | null;
  unitType?: string | null;
  quantity?: number | null;
}): boolean {
  const unit = (input.unitType ?? "").toLowerCase();
  // Explicit mass/volume unit is already a comparable unit — no pack ask.
  if (unit === "kg" || unit === "g" || unit === "lt" || unit === "l" || unit === "ml") {
    return false;
  }
  if (FUEL_NAME_RE.test(input.name)) return false;
  if (isUmbrellaProductSlug(foldSlug(input.name))) return false;
  if (resolvePiecePackCount({ name: input.name, packSize: input.packSize }) != null) {
    return false;
  }
  if (nameEncodesPackOrSize(input.name)) return false;
  // Loose pack_size text that is not a piece count still counts as known size.
  if (input.packSize != null && String(input.packSize).trim() !== "") {
    if (parseUserPackAnswer(String(input.packSize)) != null) return false;
    if (PACK_IN_NAME_RE.test(String(input.packSize))) return false;
  }
  return true;
}

const PACK_IN_NAME_RE = /(\d+(?:[.,]\d+)?)\s*(ml|cl|lt|l|kg|gr|g|adet|li|lı|lu|lü)\b/i;
const FUEL_NAME_RE =
  /OTOGAZ|\bLPG\b|MOTOR[İI]N|BENZ[İI]N|D[İI]ZEL|GAZYA[ĞG]I|AKARYAK|MAZOT|K[UÜ]RS[UÜ]NS[UÜ]Z/i;

function foldSlug(name: string): string {
  return name
    .toLocaleLowerCase("tr-TR")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");
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
