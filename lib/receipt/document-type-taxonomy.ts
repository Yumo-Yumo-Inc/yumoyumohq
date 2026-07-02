/**
 * Document Type Taxonomy
 *
 * Single source of truth for all document types the receipt pipeline handles.
 * Every type carries an `isPaymentProof` flag that drives the $300 threshold rule:
 *
 *   isPaymentProof=true  → always accepted, full reward
 *   isPaymentProof=false → accepted only if totalUSD < PAYMENT_PROOF_THRESHOLD_USD
 *                          with 50% reward; above threshold → paymentProofRequired
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export const DOCUMENT_TYPES = [
  "receipt",             // Physical POS receipt — cash/card payment confirmed
  "pos_slip",            // Card terminal slip (bank POS voucher)
  "invoice_paid",        // Paid e-invoice / e-Archive with completed payment evidence
  "invoice_unpaid",      // Unpaid invoice / proforma — amount due, payment NOT confirmed
  "order_slip",          // Order summary — details present but no payment confirmation
  "screenshot_of_receipt", // Screenshot (fraud risk but still accepted as payment proof)
  "delivery_note",       // Delivery note — rejected
  "statement",           // Bank / credit card statement — rejected
  "other",               // Unknown / unclassifiable — rejected
] as const;

export type DocumentType = typeof DOCUMENT_TYPES[number];

export interface DocumentTypeMeta {
  type: DocumentType;
  /** True if this document proves payment has been completed */
  isPaymentProof: boolean;
  /** False = pipeline rejects immediately, regardless of amount */
  accepted: boolean;
  /** Human-readable label (Turkish) */
  labelTR: string;
  /** Human-readable label (English) */
  labelEN: string;
}

// ---------------------------------------------------------------------------
// Registry
// ---------------------------------------------------------------------------

export const DOCUMENT_TYPE_REGISTRY: Record<DocumentType, DocumentTypeMeta> = {
  receipt: {
    type: "receipt",
    isPaymentProof: true,
    accepted: true,
    labelTR: "Yazar kasa fişi",
    labelEN: "Receipt",
  },
  pos_slip: {
    type: "pos_slip",
    isPaymentProof: true,
    accepted: true,
    labelTR: "POS/banka dekontu",
    labelEN: "POS slip",
  },
  invoice_paid: {
    type: "invoice_paid",
    isPaymentProof: true,
    accepted: true,
    labelTR: "Ödenmiş fatura / e-Arşiv",
    labelEN: "Paid invoice",
  },
  invoice_unpaid: {
    type: "invoice_unpaid",
    isPaymentProof: false,
    accepted: true, // accepted below threshold
    labelTR: "Ödenmemiş fatura",
    labelEN: "Unpaid invoice",
  },
  order_slip: {
    type: "order_slip",
    isPaymentProof: false,
    accepted: true, // accepted below threshold
    labelTR: "Sipariş fişi / özeti",
    labelEN: "Order slip / summary",
  },
  screenshot_of_receipt: {
    type: "screenshot_of_receipt",
    isPaymentProof: true, // counted as proof (fraud signals handled separately)
    accepted: true,
    labelTR: "Fiş ekran görüntüsü",
    labelEN: "Screenshot of receipt",
  },
  delivery_note: {
    type: "delivery_note",
    isPaymentProof: false,
    accepted: false, // always rejected
    labelTR: "Sevk irsaliyesi",
    labelEN: "Delivery note",
  },
  statement: {
    type: "statement",
    isPaymentProof: false,
    accepted: false, // always rejected
    labelTR: "Banka/kredi kartı ekstresi",
    labelEN: "Bank/card statement",
  },
  other: {
    type: "other",
    isPaymentProof: false,
    accepted: false, // always rejected
    labelTR: "Tanımsız belge",
    labelEN: "Unknown document",
  },
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Returns metadata for a document type. Falls back to "other" for unknown strings. */
export function getDocumentTypeMeta(type: string | null | undefined): DocumentTypeMeta {
  if (!type) return DOCUMENT_TYPE_REGISTRY.other;
  return DOCUMENT_TYPE_REGISTRY[type as DocumentType] ?? DOCUMENT_TYPE_REGISTRY.other;
}

/**
 * Maps VisionLLM Stage 1 documentType strings (which may differ from our taxonomy)
 * to the canonical DocumentType.
 */
export function resolveDocumentType(
  visionDocType: string | null | undefined,
  isPaymentProof: boolean
): DocumentType {
  if (!visionDocType || visionDocType === "unknown") {
    return isPaymentProof ? "receipt" : "other";
  }

  const map: Record<string, DocumentType> = {
    receipt:               "receipt",
    pos_slip:              "pos_slip",
    invoice:               "invoice_unpaid",  // default: treat invoice as unpaid unless confirmed
    invoice_paid:          "invoice_paid",
    invoice_unpaid:        "invoice_unpaid",
    order_slip:            "order_slip",
    order_summary:         "order_slip",
    screenshot_of_receipt: "screenshot_of_receipt",
    delivery_note:         "delivery_note",
    statement:             "statement",
    other:                 "other",
  };

  const resolved = map[visionDocType] ?? "other";

  // If VisionLLM confirmed payment proof but we mapped to a non-proof type,
  // trust isPaymentProof=true and elevate
  if (isPaymentProof && !DOCUMENT_TYPE_REGISTRY[resolved].isPaymentProof) {
    return "receipt"; // most conservative safe promotion
  }

  return resolved;
}
