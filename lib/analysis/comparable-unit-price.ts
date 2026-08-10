/**
 * Comparable unit price for personal analysis series.
 * Prefer line_total / quantity; divide multipack totals by piece count from
 * pack_size column or product name. Unsized egg cartons and umbrella names
 * return null rather than inventing a unit.
 */

import {
  isUmbrellaProductSlug,
  isUnsizedEggCarton,
  pricePerPiece,
  resolvePiecePackCount,
} from "@/lib/receipt/pack-size";

export { inferPiecePackCountFromName as inferPackCountFromName } from "@/lib/receipt/pack-size";
export { parsePackCount, resolvePiecePackCount } from "@/lib/receipt/pack-size";

function normaliseSlug(input: string): string {
  return input
    .toLocaleLowerCase("tr-TR")
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/gi, "_")
    .replace(/^_|_$/g, "");
}

export function comparableUnitPrice(input: {
  name?: string | null;
  quantity: number | null | undefined;
  unitPrice: number | null | undefined;
  lineTotal: number | null | undefined;
  packSize?: string | number | null | undefined;
  unitType?: string | null;
}): number | null {
  const qty = input.quantity && input.quantity > 0 ? input.quantity : 1;
  const name = (input.name ?? "").trim();
  const pack = resolvePiecePackCount({ name, packSize: input.packSize });

  if (name && isUmbrellaProductSlug(normaliseSlug(name))) {
    return null;
  }

  let lineTotal =
    input.lineTotal != null && Number.isFinite(input.lineTotal) && input.lineTotal > 0
      ? input.lineTotal
      : null;
  const unitPrice =
    input.unitPrice != null && Number.isFinite(input.unitPrice) && input.unitPrice > 0
      ? input.unitPrice
      : null;

  if (lineTotal != null && lineTotal > 0 && lineTotal < 1 && (unitPrice ?? 0) >= 1 && qty >= 1) {
    lineTotal = null;
  }
  if (lineTotal != null && lineTotal > 0 && lineTotal < 1 && (unitPrice == null || unitPrice < 1)) {
    return null;
  }

  let perPack: number | null = null;
  if (lineTotal != null && qty > 0) {
    perPack = lineTotal / qty;
  } else if (unitPrice != null) {
    perPack = unitPrice;
  }

  if (perPack == null || !(perPack > 0)) return null;

  if (
    isUnsizedEggCarton({
      name,
      pack,
      qty,
      perPack,
      unitType: input.unitType,
    })
  ) {
    return null;
  }

  if (pack != null && pack > 1) {
    return pricePerPiece(perPack, qty, pack);
  }

  return perPack;
}
