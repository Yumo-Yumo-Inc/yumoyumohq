/**
 * Clean-layer classification for the price ledger.
 *
 * Turns a raw eligible receipt line into a `price_ledger_clean` disposition
 * WITHOUT mutating receipt_line_items (Uğur 2026-07-16: separate clean layer).
 * Pure functions — deterministic, no LLM, no JSON (proje T1). Only rows with
 * disposition='clean' reach the ledger; excluded/review/hold keep their reason.
 *
 * Pipeline order (each stage can veto):
 *   1. remove  — tax/fee lines, placeholder merchants, garbage prices
 *   2. unit    — normalise price to a comparable per-unit value (line_total/qty;
 *                fuel per-litre; weighed per-kg)
 *   3. validate—
 *        multi-observation product (n>=2): the product's own robust median.
 *          Asymmetric: far ABOVE own median = error (OCR/basket); moderately
 *          BELOW = allowed (discounts); far below = review.
 *        single-observation product (n==1): the external sourced reference
 *          (price_reference_external). No reference → hold (cannot validate).
 *
 * Inflation note: TR is high-inflation, so a product's price legitimately drifts
 * up across the data span. The internal band is generous ([0.33, 2.5] of median)
 * so normal drift is not flagged; a CPI-deflated median is a later refinement.
 */

import { OBS_DATE_FLOOR } from "@/config/price-ledger";
import {
  isUnsizedEggCarton,
  pricePerPiece,
  resolvePiecePackCount,
} from "@/lib/receipt/pack-size";

// Tax / fee / non-product lines mis-labeled as products.
export const TAX_RE =
  /\bKDV\b|\bÖTV\b|\bOTV\b|VERG[İI]|KONAKLAMA\s*V|SERV[İI]S\s*[ÜU]|SERVICE\s*CHARGE|GARSON[İI]YE|\bKUVER\b|COUVERT|BAH[ŞS][İI][ŞS]|YUVARLAMA|\bV\.\s*$/;

/**
 * Receipt SECTION headers the extractor read as product lines.
 *
 * "TEMEL GIDA" is the 1%-VAT group heading on a Turkish receipt, not something
 * anyone bought: it appears at 30 different merchants with a 0.01–2820 spread,
 * because it is whatever that group happened to total. A heading has no price,
 * so it can never be validated — it is removed rather than held.
 */
export const SECTION_RE =
  /^(TEMEL\s*G[İI]DA|D[İI][ĞG]ER|ARA\s*TOPLAM|GENEL\s*TOPLAM|TOPLAM|[İI]ND[İI]R[İI]M|NAK[İI]T|KRED[İI]\s*KART|YEMEK\s*BEDEL[İI])$/;

/**
 * Merchant strings that are not a merchant.
 *
 * Three kinds, all found in the epoch-2 preview:
 *  - an ADDRESS ("ADNAN MENDERES MH.KIRALAN DINK MEVKII", "ÇIĞLI KIPA NO:40 İÇ
 *    KAP:209"). Publishing one breaks our own rule rather than bending it: a branch
 *    or street pins down where somebody shops, which is why merchant resolution
 *    stops at brand + city (§9, PUBLIC_MERCHANT_GRANULARITY).
 *  - a DOCUMENT TYPE the extractor read off the header ("BİLGİ FİŞİ" = info slip,
 *    "E-ARŞİV", "ETTN NO:").
 *  - a PHONE NUMBER printed where the name should be.
 *
 * A price with no merchant cannot be compared to anything, so these rows leave
 * rather than publish under a label that misleads.
 */
const PLACEHOLDER_RE =
  /^\[|\]$|İŞLETME\s*AD|İŞLETME\s*B[İI]LG|B[İI]L[İI]NMEYEN|UNKNOWN|^SATICI\s|MA[ĞG]AZA\s*AD|^-+$/;

/** Address fragments — a street or branch, never a brand. */
const MERCHANT_ADDRESS_RE =
  /\bMH\.|\bMAH\.|\bMAHALLES|\bSOK\.|\bSOKAK|\bCAD\.|\bCADDE|\bBLV\.|\bBULVAR|\bMEVK[İI]{2}|\bAPT\.|\bKAT:|\bİÇ\s*KAP|\bIC\s*KAP|\bOSB\b|SANAY[İI]\s*S[İI]T/i;

/** Receipt header words the extractor mistook for a name. */
const MERCHANT_DOCTYPE_RE =
  /^(B[İI]LG[İI]\s*F[İI][ŞS][İI]|E-?AR[ŞS][İI]V|E-?FATURA|FATURA|F[İI][ŞS]|A\.?V\.?V\.?|ETTN\s*NO:?|\.+)$/i;

/** A phone number where the name should be. */
const MERCHANT_PHONE_RE = /^[0-9\s()+-]{7,}$/;

export function isUnusableMerchant(m: string): boolean {
  const s = (m ?? "").trim();
  return (
    isPlaceholderMerchant(s) ||
    MERCHANT_ADDRESS_RE.test(s) ||
    MERCHANT_DOCTYPE_RE.test(s) ||
    MERCHANT_PHONE_RE.test(s)
  );
}

// Fuel — sold per litre; a receipt often mislabels the unit as 'adet'.
const FUEL_RE = /OTOGAZ|\bLPG\b|MOTOR[İI]N|BENZ[İI]N|D[İI]ZEL|GAZYA[ĞG]I|AKARYAK|MAZOT|K[UÜ]RS[UÜ]NS[UÜ]Z/;

const INTERNAL_HI_HARD = 2.5;  // > 2.5x own median → excluded
const INTERNAL_HI_SOFT = 1.7;  // 1.7–2.5x → review
const INTERNAL_LO_SOFT = 0.6;  // 0.33–0.6x → review (deep discount / error)
const INTERNAL_LO_HARD = 0.33; // < 0.33x → excluded

/**
 * Currency aliases. The median groups by canonical_id|currency, so "TL" and "TRY"
 * form two groups for one currency: the "TL" rows sit alone, never reach n>=2, and
 * fall to hold on a technicality.
 */
const CURRENCY_ALIAS: Record<string, string> = { TL: "TRY", "₺": "TRY", TRL: "TRY" };

export function normalizeCurrency(c: unknown): string {
  const raw = (c ?? "").toString().trim().toUpperCase();
  return CURRENCY_ALIAS[raw] ?? raw;
}

/**
 * Pack size printed in the product name — "Portakal 350g", "Yoğurt 1.2KG".
 *
 * Only reads what the receipt already said; a name carrying no pack yields none,
 * because the paper is the ceiling. Fills the published pack_size column for rows
 * where the extractor kept the size in the name and left the field empty.
 */
const PACK_IN_NAME_RE = /(\d+(?:[.,]\d+)?)\s*(ml|cl|lt|l|kg|gr|g|adet|li|lı|lu|lü)\b/i;

export function packFromName(name: unknown): string {
  const m = PACK_IN_NAME_RE.exec((name ?? "").toString());
  if (!m) return "";
  return `${m[1].replace(",", ".")}${m[2].toLowerCase()}`;
}

/**
 * One city, one spelling.
 *
 * The same place arrives as IZMIR / Izmir / İZMİR / İzmir, and each spelling
 * published a separate observation: 201 spellings for 153 cities, touching 87% of
 * the rows that have one. Someone asking the ledger for milk in İzmir silently
 * missed three quarters of it.
 *
 * Folded to ASCII uppercase rather than to the prettiest form, because prettiness
 * needs a registry we do not have and would not have for Ceilândia either. Two
 * properties matter more here: it is decided by rule instead of by a vote among
 * spellings (a vote's winner flips as data arrives, and a permanent ledger cannot
 * have İzmir become IZMIR between epochs), and it is reversible by any reader —
 * fold your query the same way and it matches.
 *
 * Turkish dotted/dotless i is the reason a plain toUpperCase() is wrong: it turns
 * "İzmir" into "İZMİR" and leaves "Izmir" as "IZMIR", so the two never meet.
 */
const CITY_FOLD: Record<string, string> = {
  İ: "I", I: "I", ı: "I", Ş: "S", ş: "S", Ğ: "G", ğ: "G",
  Ü: "U", ü: "U", Ö: "O", ö: "O", Ç: "C", ç: "C",
  Â: "A", â: "A", Î: "I", î: "I", Û: "U", û: "U",
  á: "A", à: "A", ã: "A", ä: "A", é: "E", ê: "E", í: "I", ó: "O", ô: "O", õ: "O", ú: "U", ñ: "N",
};

export function normalizeCity(value: unknown): string {
  const raw = (value ?? "").toString().trim();
  if (!raw) return "";
  return [...raw]
    .map((ch) => CITY_FOLD[ch] ?? ch)
    .join("")
    .toUpperCase()
    .replace(/\s+/g, " ")
    .trim();
}

const upper = (s: unknown) => (s ?? "").toString().toLocaleUpperCase("tr-TR").trim();
const num = (v: unknown): number | null => {
  if (v === null || v === undefined) return null;
  const n = typeof v === "number" ? v : parseFloat(String(v));
  return Number.isFinite(n) ? n : null;
};

export type RawLine = {
  id: number;
  canonicalId: string;
  rawName: string;
  merchant: string;
  category: string;
  unitPrice: number;
  quantity: number | null;
  lineTotal: number | null;
  unitType: string;
  currency: string;
  /** YYYY-MM-DD — gated against the ledger's covered period. */
  obsDate: string;
  /** Optional pack_size from receipt_line_items ("30adet", "15", …). */
  packSize?: string | number | null;
};

/** Descriptive fields the published leaf needs; carried through unchanged (K1). */
type LeafFields = {
  productName: string;
  brand: string;
  packSize: string;
  obsDate: string; // YYYY-MM-DD, never a time (K2)
};

function isPlaceholderMerchant(m: string): boolean {
  const s = (m ?? "").trim();
  return s === "" || s.length < 2 || PLACEHOLDER_RE.test(upper(m));
}

/** Comparable per-unit price + normalised unit label. */
export function normalizeUnit(r: RawLine): {
  price: number;
  unitType: string;
  totalNotUnit?: boolean;
  unsizedCarton?: boolean;
} {
  const up = r.unitPrice;
  const qty = num(r.quantity);
  let lt = num(r.lineTotal);

  /**
   * A sub-1 line_total against a unit price of 1 or more is arithmetically
   * impossible WHEN AT LEAST ONE WHOLE UNIT WAS BOUGHT: one unit at 100 costs at
   * least 100. What sits there instead is a TAX RATE the extractor filed in the
   * wrong column — the values name their country: 0.05 (AE), 0.15 (SA), 0.22 (UY),
   * 0.12 (PH), 0.0825 (US sales tax), 0.20/0.08/0.01 (TR). Trusting it turned a
   * 43,248 TRY fridge into 0.20 and published it.
   *
   * `qty >= 1` carries the whole argument, so it is a condition rather than a
   * footnote. Buy 209g of bananas and the line legitimately costs 0.93 while the
   * kilo price reads 4500 — a decimal comma misread as a thousands separator. That
   * row needs line_total / quantity precisely because the unit price is the broken
   * one, and firing here would republish a 4.45 BRL banana as 4500.
   *
   * The bound is the invariant, not a tuned number, so a genuinely cheap line
   * (0.50 item at 0.50) keeps its line_total.
   */
  const rateInTotal = lt !== null && lt > 0 && lt < 1 && up >= 1 && (qty === null || qty >= 1);
  if (rateInTotal) lt = null;

  // line_total / quantity is the most reliable per-unit price (fixes fuel pump
  // totals, weighed items, quantity swaps — a receipt that prints 64,490 for
  // diesel still yields 64.47 through the total). Fall back to unit_price.
  let price = qty && qty > 0 && lt && lt > 0 ? lt / qty : up;

  let unitType = (r.unitType || "").trim().toLowerCase();
  const isFuel = FUEL_RE.test(upper(r.rawName)) || FUEL_RE.test(upper(r.category));
  if (isFuel) unitType = "litre";
  else if (qty && qty > 0 && Math.abs(qty - Math.round(qty)) > 0.01 && (unitType === "adet" || unitType === "" || unitType === "piece"))
    unitType = "kg"; // fractional quantity of "pieces" → weighed
  else if (
    qty && qty >= 1 &&
    (unitType === "ml" || unitType === "cl" || unitType === "g" || unitType === "l")
  )
    unitType = "adet"; // a per-item price labeled with the pack's unit (G7,
    // Uğur 2026-08-07): "Muzlu Süt 180ml" cost 20 per bottle, not 20 per ml,
    // and "Su 1,5L" 20 per bottle, not 20 per litre. The published price is
    // already line_total/qty = per item; only the label was wrong, and
    // "20 TRY/ml" is arithmetically absurd on a permanent record. l joins ml/g
    // so two receipts of the same 1.5L bottle — one labelled adet, one l — hash
    // to the same leaf instead of splitting the product across two units.

  const qEff = qty && qty > 0 ? qty : 1;
  const pack = resolvePiecePackCount({ name: r.rawName, packSize: r.packSize ?? null });
  if (
    !isFuel &&
    isUnsizedEggCarton({
      name: r.rawName,
      pack,
      qty: qEff,
      perPack: price,
      unitType,
    })
  ) {
    return { price: 0, unitType, unsizedCarton: true };
  }
  if (!isFuel && pack != null && pack > 1 && Number.isFinite(price) && price > 0) {
    const perPiece = pricePerPiece(price, qEff, pack);
    if (perPiece != null) price = perPiece;
  }

  /**
   * A pump prints what you paid, not what a litre costs. The per-litre price is
   * only recoverable through line_total / litres — so once line_total turns out to
   * be a tax rate and no litre count is given, unit_price is the pump total for an
   * unknown volume. Publishing 3,078 as a litre of diesel is worse than publishing
   * nothing, and it slips past the median because a whole station's receipts share
   * one layout, bending the group's median the same way.
   */
  /**
   * A fuel line only yields a per-litre price when the receipt says how many litres
   * were bought. Two ways it fails to, both leaving the pump TOTAL where a litre
   * price should be:
   *   - line_total held a tax rate (rateInTotal), so unit_price is the total; or
   *   - unit_price equals line_total with no real litre count (qty ≤ 1), so the
   *     receipt printed only the amount paid — "3078.94" is a tankful, not a litre.
   * Either way the litre price is unknowable, so the line is withheld rather than
   * published as if 3,078 TRY bought one litre of diesel. A genuine fill (qty = the
   * litres, unit_price ≠ total) is untouched.
   */
  const lineIsTotal = up > 0 && lt !== null && Math.abs(up - lt) < 0.01 && !(qty && qty > 1);
  const totalNotUnit = isFuel && (rateInTotal || lineIsTotal) && !(qty && qty > 1);
  return { price, unitType, totalNotUnit };
}

export type ExternalRef = {
  marketPrice: number | null;
  verdict: string; // tutarli | yanlis_yuksek | cok_dusuk | dogrulanamaz
};

/** Is this observation inside the period the ledger covers? */
export function isDateInRange(obsDate: string, today: string): boolean {
  if (!obsDate) return false;
  return obsDate >= OBS_DATE_FLOOR && obsDate <= today;
}

export type CleanVerdict = {
  disposition: "clean" | "excluded" | "review" | "hold";
  reason: string;
  validationBasis: "internal_median" | "external_ref" | "none";
  refPrice: number | null;
  farkPct: number | null;
  normalizedPrice: number;
  unitType: string;
};

/**
 * Classify one line. `median` is the product's robust median normalised price
 * (null when unknown), `n` its observation count, `ext` the external reference
 * for singletons (null when none).
 */
export function classifyLine(
  r: RawLine,
  median: number | null,
  n: number,
  ext: ExternalRef | null,
  today: string
): CleanVerdict {
  const { price, unitType, totalNotUnit, unsizedCarton } = normalizeUnit(r);
  const base = (d: CleanVerdict["disposition"], reason: string, vb: CleanVerdict["validationBasis"], ref: number | null): CleanVerdict => {
    const fark = ref && ref > 0 ? Math.round((price / ref - 1) * 100) : null;
    return { disposition: d, reason, validationBasis: vb, refPrice: ref, farkPct: fark, normalizedPrice: price, unitType };
  };

  // 1) removal — vetoes everything.
  if (!isDateInRange(r.obsDate, today)) return base("excluded", "DATE_OUT_OF_RANGE", "none", null);
  if (unsizedCarton) return base("excluded", "PACK_CARTON_UNSIZED", "none", null);
  if (TAX_RE.test(upper(r.rawName))) return base("excluded", "TAX_LINE", "none", null);
  if (SECTION_RE.test(upper(r.rawName))) return base("excluded", "SECTION_LINE", "none", null);
  if (isUnusableMerchant(r.merchant)) return base("excluded", "PLACEHOLDER_MERCHANT", "none", null);
  if (r.unitPrice <= 0.05) return base("excluded", "GARBAGE_PRICE", "none", null);
  if (totalNotUnit) return base("excluded", "FUEL_TOTAL_NOT_UNIT", "none", null);

  // 2/3) validate
  if (n >= 2 && median && median > 0) {
    const ratio = price / median;
    if (ratio > INTERNAL_HI_HARD) return base("excluded", "OVER_MEDIAN", "internal_median", median);
    if (ratio < INTERNAL_LO_HARD) return base("excluded", "UNDER_MEDIAN", "internal_median", median);
    if (ratio > INTERNAL_HI_SOFT || ratio < INTERNAL_LO_SOFT) return base("review", "MEDIAN_SOFT", "internal_median", median);
    return base("clean", "", "internal_median", median);
  }

  // singleton → external reference. Only an explicit 'tutarli' reaches the ledger:
  // anything inconclusive goes to the review queue, never to the chain.
  if (ext) {
    if (ext.verdict === "tutarli") return base("clean", "", "external_ref", ext.marketPrice);
    if (ext.verdict === "yanlis_yuksek") return base("excluded", "EXT_OVER_MARKET", "external_ref", ext.marketPrice);
    if (ext.verdict === "cok_dusuk") return base("review", "EXT_DEEP_LOW", "external_ref", ext.marketPrice);
    if (ext.verdict === "review") return base("review", "EXT_REVIEW", "external_ref", ext.marketPrice);
    if (ext.verdict === "dogrulanamaz") return base("hold", "EXT_UNVERIFIABLE", "external_ref", ext.marketPrice);
    return base("review", "EXT_UNKNOWN_VERDICT", "external_ref", ext.marketPrice);
  }

  // singleton with no reference yet → hold until researched.
  return base("hold", "NO_VALIDATION", "none", null);
}
