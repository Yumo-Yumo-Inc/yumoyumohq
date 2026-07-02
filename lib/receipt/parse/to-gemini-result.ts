/**
 * Map the parsed machine block output to the downstream GeminiReceiptResult shape.
 *
 * The pipeline's GeminiReceiptResult contract is preserved — this is purely a
 * translation step from the new T1-compliant tagged text into the existing
 * typed structure that the rest of the codebase consumes.
 *
 * Defensive throughout: missing/invalid fields become null, never throw.
 */

import type { GeminiReceiptResult } from "@/app/api/receipt/analyze/services/gemini-vision-service";
import { normalizeBrandName } from "@/lib/receipt/name-normalization";
import type {
  MachineBlockData,
  MachineLineItem,
  ParsedMachineOutput,
} from "./machine-block";

const DEFAULT_INTEGRITY: GeminiReceiptResult["integrity"] = {
  isComplete: true,
  hasHandwriting: false,
  hasTampering: false,
  isPhotoOfScreen: false,
  isCrumpled: false,
  alterationNotes: [],
};

function pickBool(v: boolean | null, fallback: boolean): boolean {
  return v == null ? fallback : v;
}

function clampUnit(
  u: MachineLineItem["unit"]
): GeminiReceiptResult["lineItems"][number]["unitType"] {
  return u ?? null;
}

function lineItemToGeminiItem(
  it: MachineLineItem
): GeminiReceiptResult["lineItems"][number] {
  return {
    name: it.name ?? "",
    // Sanitize: drop a numeric/duplicate brand so a misaligned column never
    // persists as a "brand" (e.g. a quantity "0.56" landing in the brand field).
    brand: normalizeBrandName(it.brand, it.name),
    quantity: it.qty ?? undefined,
    unitType: clampUnit(it.unit),
    unitPrice: it.unit_price ?? undefined,
    totalPrice: it.total ?? undefined,
    vatRate: it.vat_rate ?? undefined,
    category: it.category,
    subcategory: it.subcategory,
  };
}

/**
 * Translate parsed machine output into the legacy GeminiReceiptResult contract.
 * Returns null only if the machine_data block is completely missing AND there
 * are no line items — i.e. nothing usable came back.
 */
export function machineOutputToGeminiResult(
  parsed: ParsedMachineOutput
): GeminiReceiptResult | null {
  const d: MachineBlockData | null = parsed.data;
  const items = parsed.line_items;

  if (!d && items.length === 0) return null;

  const data = d ?? ({} as Partial<MachineBlockData>);

  const integrity: GeminiReceiptResult["integrity"] = {
    isComplete: pickBool(
      (data.integrity_is_complete ?? null) as boolean | null,
      DEFAULT_INTEGRITY.isComplete
    ),
    hasHandwriting: pickBool(
      (data.integrity_has_handwriting ?? null) as boolean | null,
      DEFAULT_INTEGRITY.hasHandwriting
    ),
    hasTampering: pickBool(
      (data.integrity_has_tampering ?? null) as boolean | null,
      DEFAULT_INTEGRITY.hasTampering
    ),
    isPhotoOfScreen: pickBool(
      (data.integrity_is_photo_of_screen ?? null) as boolean | null,
      DEFAULT_INTEGRITY.isPhotoOfScreen
    ),
    isCrumpled: pickBool(
      (data.integrity_is_crumpled ?? null) as boolean | null,
      DEFAULT_INTEGRITY.isCrumpled
    ),
    alterationNotes: data.integrity_alteration_notes ?? [],
  };

  // Attach the raw machine-block data + markdown report so downstream (stage3)
  // can read document_type, reward_eligible_document, rejection_reason, and the
  // verbatim markdown that gets persisted to the DB and rendered in the UI.
  // merchant_category is taken as-is from Gemini. The (old) category field
  // represents the same concept as merchant_category — the new prompt enriched
  // merchant_category (cafe, accommodation, beauty, ...).
  const categoryFromGemini =
    data.merchant_category ?? data.category ?? null;

  const result: GeminiReceiptResult & {
    __machineData?: MachineBlockData;
    __markdownReport?: string;
  } = {
    // merchantName = display name first, legal name as fallback. The user is
    // shown the storefront/signage name; the long legal company name goes to
    // the DB in a separate field (merchantLegalName).
    merchantName:
      data.merchant_display_name ?? data.merchant_legal_name ?? null,
    merchantLegalName: data.merchant_legal_name ?? null,
    merchantDisplayName: data.merchant_display_name ?? null,
    merchantNameConfidence:
      typeof data.confidence === "number" ? data.confidence : 0.85,
    merchantAddress: data.merchant_address ?? null,
    branchInfo: data.branch_info ?? null,
    addressCity: data.address_city ?? null,
    addressDistrict: data.address_district ?? null,
    addressNeighborhood: data.address_neighborhood ?? null,
    addressStreet: data.address_street ?? null,
    taxOffice: data.tax_office ?? null,
    taxNumber: data.tax_number ?? null,
    category: categoryFromGemini,
    utilityType:
      data.utility_type === "water" ||
      data.utility_type === "electricity" ||
      data.utility_type === "gas"
        ? data.utility_type
        : undefined,
    date: data.receipt_date ?? null,
    dateRaw: data.receipt_date_raw ?? null,
    time: data.receipt_time ?? null,
    receiptNo: data.receipt_no ?? null,
    countryCode: data.country_code ?? null,
    total: data.total_paid ?? null,
    totalRaw: data.total_raw ?? null,
    vat: data.total_vat ?? null,
    vatRaw: data.vat_raw ?? null,
    vatRate: data.vat_rate ?? null,
    currency: data.currency ?? null,
    paymentMethod: data.payment_method ?? null,
    paymentProven: data.payment_proven ?? null,
    posProvider: data.pos_provider ?? null,
    cardLast4: data.card_last4 ?? null,
    documentType: data.document_type ?? null,
    rejectionReason: data.rejection_reason ?? null,
    integrity,
    lineItems: items.map(lineItemToGeminiItem),
    confidence: typeof data.confidence === "number" ? data.confidence : 0.5,
    reasoning: data.reasoning ?? "",
    lowConfidenceFields: data.low_confidence_fields ?? [],
  };

  if (d) result.__machineData = d;
  if (parsed.markdown_report) result.__markdownReport = parsed.markdown_report;
  return result;
}
