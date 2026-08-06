/**
 * Write-path line classification. Every structured receipt line gets a
 * line_kind before persistence:
 *
 *   product    — a purchasable item; the only kind that enters canonical
 *                product matching and brand resolution.
 *   discount   — "% 40 İNDİRİM", "İSKONTO", negative-priced rows.
 *   tax        — KDV/TOPKDV/ÖTV/CTV/BSMV/matrah rows.
 *   payment    — NAKİT, KREDİ KARTI, HAVALE, PARA ÜSTÜ tender rows.
 *   bag        — carrier-bag fee rows (ALIŞVERİŞ POŞETİ …).
 *   fee        — service/bill charges (TÜKETİM BEDELİ, İŞÇİLİK, YUVARLAMA …).
 *   department — register department/aisle labels sold as a lump amount
 *                (TEKEL, MANAV, GIDA, HIRDAVAT). Real spend, but carries no
 *                product identity to canonicalize.
 *   fuel       — vehicle fuel dispensed by volume (OTOGAZ, MOTORİN, LPG,
 *                BENZİN). Real spend, but a litre fill has no unit-price
 *                identity to compare across stations the way a packaged
 *                product does.
 *   other      — register noise: totals, "SATIŞ", "TAXABLE T1", OCR fragments,
 *                letterless codes.
 *
 * Non-product rows are still written to receipt_line_items (receipt totals and
 * the weekly ledger need them) but never reach canonical_products or
 * brand_registry. The read-path filter in lib/insights/non-product-filter.ts
 * keeps covering rows written before this column existed.
 */

import {
  fold,
  isCategoryNameItem,
  isDepartmentNameItem,
} from "@/lib/insights/non-product-filter";

export type LineKind =
  | "product"
  | "discount"
  | "tax"
  | "payment"
  | "bag"
  | "fee"
  | "department"
  | "fuel"
  | "other";

const NON_PRODUCT_LINE_KINDS: ReadonlySet<LineKind> = new Set([
  "discount",
  "tax",
  "payment",
  "bag",
  "fee",
  "department",
  "fuel",
  "other",
]);

// OCR fragment: "2 ad X 51.00", "19,44 x 5.350,00" — a misread quantity×price
// line, not a product. Anchored to the WHOLE string: multipack product names
// ("3X180 G LABNE", "6X330 ŞEFTALİ") carry trailing text and must stay product.
const OCR_FRAGMENT_RE = /^\s*\d*[.,]?\d*\s*(ad|adt|adet)?\s*x\s*[\d.,]+\s*$/i;

const DISCOUNT_RE = /\b(indirim\w*|iskonto\w*|discount\w*)\b/;
const DISCOUNT_EXACT = new Set(["kampanya", "kampanya indirimleri", "urun ind"]);

const TAX_RE = /\b(kdv\w*|topkdv|matrah\w*|otv|bsmv|ctv|vat|vergi\w*|damga)\b/;

// Bare "kredi" is gated by a negative lookbehind: "TARIM KREDİ …" is a real
// grocery-cooperative brand (süt, bulgur, peynir …), not a tender line — the
// word only means "credit/loan" here, not "kredi kartı" payment.
//
// Bank-statement transaction lines ("DK İLE HESABA PARA YATIRMA", "GİDEN FAST
// İŞLEMİ", "BİREYSEL ÖDEME") are tender/movement rows, not products. They reach the
// unresolved-product pool because a statement gets parsed line by line; catch them
// here so they never become "identify this deposit" tasks.
const PAYMENT_RE =
  /\b(nakit|havale|eft|para transferi|para ustu|kredi odeme|k karti|kredi karti|banka karti|kart odeme|visa|mastercard|alisveris karti|para yatirma|hesaba para|para cekme|bireysel odeme|fast islem\w*|giden fast|gelen fast|virman|otomatik odeme|fatura odeme)\b|(?<!tarim )\bkredi\b/;

// Carrier-bag FEE lines only. "poşet" alone is not enough — poşet çay (tea
// bags), poşetli piliç and sachet products are real products; a bag fee names
// the bag context (alışveriş/market/kasa/plastik/kağıt/boy…) or is nothing but
// "poşet (adedi)".
const BAG_TOKEN_RE = /\bposet\w*/;
// "alisver\w*" covers OCR typos (alisverus, alisveris).
// "atlet" = vest/t-shirt carrier bag ("HEMEN POŞET (ATLET)"). Safe to list here
// because this pattern is only consulted once BAG_TOKEN_RE has already matched —
// an "ATLET" undershirt is a real product and never carries "poşet" in its name.
// Note "çöp" stays out on purpose: çöp poşeti is a product you buy, not a fee.
const BAG_CONTEXT_RE = /\b(alisver\w*|market|kasa|plastik|barkod\w*|kagit|musteri|tasima|hizli|boy|file|atlet\w*)\b/;
// Size descriptors on a bag line, allowed to be glued ("POŞET(BÜYÜKBOY)" →
// "poset(buyukboy)"): the "boy" boundary in BAG_CONTEXT_RE cannot see a fused word.
// Only consulted after BAG_TOKEN_RE matches, so matching "buyuk"/"kucuk" as a
// substring here cannot mislabel a non-bag product.
const BAG_SIZE_RE = /(buyuk|kucuk|orta)\s*boy|buyukboy|kucukboy|ortaboy/;
const BAG_BARE_RE = /^poset\w*(\s+adet\w*)?$/;
const BAG_CANTA_RE = /\b(alisveris canta\w*|canta nonwoven)\b/;

// Utility-bill / register fee noise. Generic "ücret" words stay product:
// "MUAYENE ÜCRETİ", "OTOPARK ÜCRETİ" are real purchased services.
const FEE_RE =
  /\b(tuketim bedeli|atik su|su tuketim|abonelik|abonenin alacagi|guvence bedeli|gecikme bedeli|acma kapama|usulsuz kullanim|yuvarlama|duzeltme katsayisi|diger bedel|iscilik|masraf tutari|hizmet bedeli)\b/;

// Register/summary labels that are neither purchases nor charges.
const OTHER_EXACT = new Set([
  "satis",
  "tutar",
  "toplam",
  "ara toplam",
  "genel toplam",
  "adet",
  "ad",
  "unknown item",
  "taxable item",
]);
// Register/statement labels: department subtotals ("DEPARTMAN%0", "DEPARTMAN%18"),
// running totals and statement lines ("İŞLEM TUTARI", "DÖNEM TUTARI", "SATIŞ TUTARI",
// "EMU SATIŞ TUTARI"). None name a product; they reach the pool from receipts and
// statements parsed line by line.
const OTHER_RE =
  /\b(toplam|fatura tutar\w*|fatura toplam\w*|departman|islem tutar\w*|donem tutar\w*|satis tutar\w*|emu satis|ara tutar)\b|^taxable\b/;

// Vehicle fuel dispensed by volume — no packaged-unit price to compare.
// "beyaz benzin" (white spirit, a cleaning solvent) is a rare false-positive
// risk but has not appeared in the catalog; revisit if it does.
const FUEL_RE = /\b(benzin\w*|motorin\w*|dizel\w*|akaryakit\w*|otogaz\w*|lpg)\b/;

/**
 * Classify one structured receipt line. `totalPrice` is the raw line total as
 * parsed (sign preserved) — a negative total is a discount/refund row even
 * when the name looks like a product ("Sarelle ... İndirimi").
 */
export function classifyLineKind(
  name: string | null | undefined,
  totalPrice: number | null | undefined
): LineKind {
  const raw = (name ?? "").trim();
  if (!raw) return "other";

  if (totalPrice != null && Number.isFinite(totalPrice) && totalPrice < 0) {
    return "discount";
  }
  if (OCR_FRAGMENT_RE.test(raw)) return "other";

  const f = fold(raw);
  if (!f || !/[a-z]/.test(f)) return "other"; // "12x25", "170", "***"

  if (TAX_RE.test(f)) return "tax";
  if (DISCOUNT_RE.test(f) || DISCOUNT_EXACT.has(f)) return "discount";
  if (PAYMENT_RE.test(f)) return "payment";
  if (
    BAG_CANTA_RE.test(f) ||
    (BAG_TOKEN_RE.test(f) &&
      (BAG_CONTEXT_RE.test(f) || BAG_BARE_RE.test(f) || BAG_SIZE_RE.test(f)))
  ) {
    return "bag";
  }
  if (FEE_RE.test(f)) return "fee";
  if (OTHER_EXACT.has(f) || OTHER_RE.test(f)) return "other";
  // Department labels often carry the amount in the name ("TEKEL 275",
  // "PEYNİR 1000") — strip trailing digits before the whole-name match.
  const noTrailingNums = raw.replace(/[\s\d.,]+$/, "").trim() || raw;
  if (isDepartmentNameItem(noTrailingNums) || isCategoryNameItem(noTrailingNums)) {
    return "department";
  }
  if (FUEL_RE.test(f)) return "fuel";

  return "product";
}

/** Only `product` rows may enter canonical matching / brand resolution. */
export function isCanonicalizableLineKind(kind: LineKind | null | undefined): boolean {
  return (kind ?? "product") === "product";
}
