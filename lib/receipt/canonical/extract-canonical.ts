/**
 * Canonical extractor: structured LLM line items (Gemini / GPT-4o fallback) → CanonicalPayload.
 * Vision OCR regex fallback removed; lines must come from persisted geminiLineItems.
 */

import type { CanonicalPayload, CanonicalMerchant, CanonicalObservation } from "../canonical-types";
import {
  normalizeBrandName,
  normalizeCategoryText,
  normalizeItemDisplayName,
  normalizeMerchantDisplayName,
} from "../name-normalization";
import { normalizeProductCategoryLvl1 } from "../category-taxonomy";

const NOW_ISO = () => new Date().toISOString();

/** Unit — matches Gemini output and `receipt_data.geminiLineItems`. */
export type GeminiStructuredLineUnitType = "adet" | "kg" | "g" | "l" | "ml";

/** One line from Gemini receipt JSON (same shape as gemini-vision-service lineItems). */
export type GeminiStructuredLineItem = {
  name: string;
  brand?: string | null;              // Brand name — as parsed by Gemini (e.g. "Ülker", "Pınar")
  quantity?: number;
  unitType?: GeminiStructuredLineUnitType;
  unitPrice?: number;
  totalPrice?: number;
  vatRate?: number;
  /** Primary product category (Turkish). E.g.: "Süt & Süt Ürünleri", "Meyve & Sebze" */
  category?: string | null;
  /** Subcategory. E.g.: "Peynir", "Taze Meyve" */
  subcategory?: string | null;
};

export interface ExtractCanonicalContext {
  receiptId?: string;
  merchantName?: string;
  totalPaid?: number;
  paidExTax?: number;
  date?: string;
  currency?: string;
  /** Receipt-level category from analyze (e.g. groceries_fmcg) for fallback */
  category?: string;
  /** From analyze pipeline (Gemini or GPT-4o OCR fallback); persisted in receipt_data for Faz-2 */
  geminiLineItems?: GeminiStructuredLineItem[];
}

/** Vision API response: responses[0] with fullTextAnnotation or textAnnotations */
export interface VisionResponseLike {
  fullTextAnnotation?: {
    text?: string;
    pages?: Array<{
      blocks?: Array<{
        lines?: Array<{ text?: string }>;
      }>;
    }>;
  };
  textAnnotations?: Array<{ description?: string }>;
}

/**
 * Read geminiLineItems saved inside receipts.receipt_data JSON.
 */
export function parseGeminiLineItemsFromReceiptData(receiptData: unknown): GeminiStructuredLineItem[] | undefined {
  if (receiptData == null) return undefined;
  let data: Record<string, unknown>;
  try {
    data = typeof receiptData === "string" ? (JSON.parse(receiptData) as Record<string, unknown>) : (receiptData as Record<string, unknown>);
  } catch {
    return undefined;
  }
  const items = data.geminiLineItems;
  if (!Array.isArray(items) || items.length === 0) return undefined;
  const out: GeminiStructuredLineItem[] = [];
  for (const it of items) {
    if (!it || typeof it !== "object") continue;
    const o = it as Record<string, unknown>;
    const name = normalizeItemDisplayName(typeof o.name === "string" ? o.name : "") ?? "";
    if (!name) continue;
    const q = o.quantity;
    const up = o.unitPrice;
    const tp = o.totalPrice;
    const vr = o.vatRate;
    const unitType = parseStoredGeminiUnitType(o.unitType);
    const brand = normalizeBrandName(typeof o.brand === "string" ? o.brand : null, name);
    const category = normalizeCategoryText(typeof o.category === "string" ? o.category : null);
    const subcategory = normalizeCategoryText(typeof o.subcategory === "string" ? o.subcategory : null);
    out.push({
      name,
      brand,
      quantity: typeof q === "number" && q > 0 ? q : undefined,
      unitType,
      unitPrice: typeof up === "number" && Number.isFinite(up) ? up : undefined,
      totalPrice: typeof tp === "number" && Number.isFinite(tp) ? tp : undefined,
      vatRate: typeof vr === "number" && Number.isFinite(vr) ? vr : undefined,
      category,
      subcategory,
    });
  }
  return out.length > 0 ? out : undefined;
}

/** GPT-4o full-receipt fallback: previously stayed only in context and was never added to the API response, leaving DB records incomplete. */
function parseGptFullLineItemsFromReceiptData(receiptData: unknown): GeminiStructuredLineItem[] | undefined {
  let data: Record<string, unknown>;
  try {
    data =
      typeof receiptData === "string"
        ? (JSON.parse(receiptData) as Record<string, unknown>)
        : ((receiptData as Record<string, unknown>) ?? {});
  } catch {
    return undefined;
  }
  const gpt = data.gptFullReceiptResult;
  if (!gpt || typeof gpt !== "object") return undefined;
  const lineItems = (gpt as Record<string, unknown>).lineItems;
  if (!Array.isArray(lineItems) || lineItems.length === 0) return undefined;
  const out: GeminiStructuredLineItem[] = [];
  for (const li of lineItems) {
    if (!li || typeof li !== "object") continue;
    const o = li as Record<string, unknown>;
    const name = normalizeItemDisplayName(typeof o.name === "string" ? o.name : "") ?? "";
    if (!name) continue;
    const ut = o.unitType;
    const unitType =
      ut === "adet" || ut === "kg" || ut === "g" || ut === "l" || ut === "ml" ? ut : undefined;
    const q = o.quantity;
    const up = o.unitPrice;
    const tp = o.totalPrice;
    let vr = o.vatRate;
    if (typeof vr === "number" && Number.isFinite(vr) && vr > 1 && vr <= 100) vr = vr / 100;
    const brand = normalizeBrandName(typeof o.brand === "string" ? o.brand : null, name);
    const cat = normalizeCategoryText(typeof o.category === "string" ? o.category : null);
    const subcat = normalizeCategoryText(typeof o.subcategory === "string" ? o.subcategory : null);
    out.push({
      name,
      brand,
      quantity: typeof q === "number" && q > 0 ? q : undefined,
      unitType,
      unitPrice: typeof up === "number" && Number.isFinite(up) ? up : undefined,
      totalPrice: typeof tp === "number" && Number.isFinite(tp) ? tp : undefined,
      vatRate: typeof vr === "number" && Number.isFinite(vr) && vr >= 0 && vr <= 1 ? vr : undefined,
      category: cat,
      subcategory: subcat,
    });
  }
  return out.length > 0 ? out : undefined;
}

/**
 * Phase-2 input: receipt_data.geminiLineItems first, falling back to gptFullReceiptResult.lineItems.
 */
export function parseStructuredLineItemsFromReceiptData(
  receiptData: unknown
): GeminiStructuredLineItem[] | undefined {
  const fromGemini = parseGeminiLineItemsFromReceiptData(receiptData);
  if (fromGemini && fromGemini.length > 0) return fromGemini;
  return parseGptFullLineItemsFromReceiptData(receiptData);
}

/**
 * Some LLM outputs contain only the product name; geminiLineToObservation requires a price.
 * When paidExTax > 0, the remaining amount is split across lines by quantity weight (for display + hidden cost).
 */
export function allocateLinePricesWhenMissing(
  items: GeminiStructuredLineItem[],
  paidExTax: number
): GeminiStructuredLineItem[] {
  if (!items.length || paidExTax <= 0) return items;
  const anyMissing = items.some(
    (i) =>
      !(
        (i.unitPrice != null && i.unitPrice > 0) ||
        (i.totalPrice != null && i.totalPrice > 0)
      )
  );
  if (!anyMissing) return items;
  const weights = items.map((i) =>
    Math.max(1e-6, i.quantity != null && i.quantity > 0 ? i.quantity : 1)
  );
  const totalW = weights.reduce((a, b) => a + b, 0);
  return items.map((item, idx) => {
    const hasU = item.unitPrice != null && item.unitPrice > 0;
    const hasT = item.totalPrice != null && item.totalPrice > 0;
    if (hasU || hasT) return item;
    const share = (weights[idx] / totalW) * paidExTax;
    const q = item.quantity != null && item.quantity > 0 ? item.quantity : 1;
    return { ...item, totalPrice: share, unitPrice: share / q };
  });
}

/** Converts a free-form value from receipt_data / the API into an allowed unit; invalid → undefined (defaults to "adet" in the observation). */
function parseStoredGeminiUnitType(raw: unknown): GeminiStructuredLineUnitType | undefined {
  if (raw == null || raw === "") return undefined;
  const s = String(raw).trim().toLowerCase();
  if (s === "adet" || s === "kg" || s === "g" || s === "l" || s === "ml") return s;
  if (s === "lt") return "l";
  return undefined;
}

function geminiLineToObservation(
  item: GeminiStructuredLineItem,
  context: ExtractCanonicalContext
): CanonicalObservation | null {
  const name = normalizeItemDisplayName(item.name) ?? "";
  if (!name) return null;

  const qty =
    item.quantity != null && Number.isFinite(item.quantity) && item.quantity > 0 ? item.quantity : 1;

  let unitP = item.unitPrice;
  let totalP = item.totalPrice;
  const uOk = unitP != null && Number.isFinite(unitP) && unitP > 0;
  const tOk = totalP != null && Number.isFinite(totalP) && totalP > 0;

  if (uOk && tOk) {
    /* keep both */
  } else if (uOk && !tOk) {
    totalP = unitP! * qty;
  } else if (!uOk && tOk) {
    unitP = totalP! / qty;
  } else {
    return null;
  }

  return {
    raw_name: name,
    canonical_name: name,
    brand: normalizeBrandName(item.brand, name),
    pack_size: null,
    // The product category from GPT is used first; falls back to the merchant category.
    // Collapse into the single canonical lvl1 taxonomy (gıda/grocery/Turkish-long → groceries, etc.).
    category_lvl1:
      normalizeProductCategoryLvl1(
        normalizeCategoryText(item.category) ?? context.category
      ) ?? null,
    category_lvl2: normalizeCategoryText(item.subcategory),
    unit_type: item.unitType ?? "adet",
    quantity: qty,
    unit_price_gross: unitP!,
    line_total_gross: totalP!,
    discount_amount: 0,
    vat_rate: item.vatRate != null && Number.isFinite(item.vatRate) ? item.vatRate : null,
    last_price_update: NOW_ISO(),
    confidence_score: 0.9,
    // v3 fields (populated later by resolve-canonical-product-v3)
    display_name_tr: name,
    category_path: null,
    attributes: {},
    lifestyle_tags: [],
    consumption_occasions: [],
    allergens: [],
    price_tier: null,
    canonical_id: null,
  };
}

/**
 * Build CanonicalPayload from structured LLM line items only (no OCR line regex).
 */
export function extractCanonicalFromVision(
  visionJson: VisionResponseLike | null | undefined,
  context: ExtractCanonicalContext
): CanonicalPayload {
  const vision = visionJson ?? {};

  const observations: CanonicalObservation[] = [];
  if (context.geminiLineItems && context.geminiLineItems.length > 0) {
    for (const item of context.geminiLineItems) {
      const obs = geminiLineToObservation(item, context);
      if (obs) observations.push(obs);
    }
  }

  if (observations.length === 0) {
    const hasVisionText =
      Boolean(vision.fullTextAnnotation?.text?.trim()) ||
      Boolean(vision.textAnnotations && vision.textAnnotations.length > 0);
    if (hasVisionText) {
      console.warn(
        "[extractCanonicalFromVision] No structured line items; OCR regex fallback disabled — observations empty."
      );
    } else {
      console.warn("[extractCanonicalFromVision] No structured line items and no Vision text; observations empty.");
    }
  }

  const dateStr = context.date ?? new Date().toISOString().slice(0, 10);
  const currency = (context.currency ?? "TRY") as "TRY" | string;
  const merchant: CanonicalMerchant = {
    canonical_name: normalizeMerchantDisplayName(context.merchantName) ?? "Unknown",
    raw_name: normalizeMerchantDisplayName(context.merchantName) ?? undefined,
    category_lvl1: context.category ?? undefined,
    last_update: NOW_ISO(),
  };

  const totalGross =
    context.totalPaid ??
    context.paidExTax ??
    (observations.length > 0 ? observations.reduce((s, o) => s + o.line_total_gross, 0) : undefined);

  return {
    receipt_file: context.receiptId ?? "",
    date: dateStr,
    currency,
    total_gross: totalGross,
    merchant,
    observations,
  };
}
