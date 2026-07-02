// lib/pricing/tr-estimated-tax.ts
// V0 rule: Turkey POS market receipts with NO explicit VAT breakdown
// => show "Vergisel Masraflar (Tahmini)" as State Layer info (NOT included in hidden cost).

export type CountryCode = "TR" | "TH" | "US" | "DE" | "UK" | "AE" | "SG" | "FR" | "JP" | "MY" | string;

export type DocumentType =
  | "POS_TR"
  | "POS_TR_MARKET"
  | "INVOICE_TR"
  | "POS_TH"
  | "INVOICE_TH"
  | "UNKNOWN";

export type MerchantCategory = "GROCERY" | "SUPERMARKET" | "MARKET" | "RESTAURANT" | "CAFE" | "OTHER" | string;

export type VatExtraction = {
  // Monetary VAT amount (e.g., 14.00). 0 if not found.
  value: number;
  // VAT rate if detected (e.g., 0.07). undefined if unknown.
  rate?: number;
  // 0..1
  confidence?: number;
  // Optional evidence/debug
  sourceLine?: number;
};

export type PricingInput = {
  country: CountryCode;
  documentType: DocumentType;
  merchantCategory?: MerchantCategory;
  ocrText: string; // full OCR text (lower/upper doesn't matter)
  totalPaid: number; // authoritative total (money)
  vat?: VatExtraction; // explicit VAT extraction (if any)
};

export type EstimatedTaxLayer = {
  taxMode: "ESTIMATED";
  taxLabel: "Vergisel Masraflar (Tahmini)";
  taxRate: number; // 0.15
  taxAmount: number; // money
  taxReason: "POS_TR_MARKET_NO_VAT_BREAKDOWN";
  taxConfidence: "medium";
  includedInHiddenCost: false;
  uiNote: string;
};

export type ExplicitTaxLayer = {
  taxMode: "EXPLICIT";
  taxLabel: "KDV (Fişte belirtilen)";
  taxRate?: number;
  taxAmount: number;
  taxReason: "EXPLICIT_VAT_FOUND";
  taxConfidence: "high" | "medium";
  includedInHiddenCost: false;
  uiNote: string;
};

export type NoTaxLayer = {
  taxMode: "NONE";
  taxLabel: "Vergisel Masraflar";
  taxRate?: number;
  taxAmount: 0;
  taxReason: "NOT_APPLICABLE";
  includedInHiddenCost: false;
};

export type StateTaxLayer = EstimatedTaxLayer | ExplicitTaxLayer | NoTaxLayer;

const DEFAULT_TR_ESTIMATED_TAX_RATE = 0.15;

// Detect if VAT is explicitly broken out in OCR text (TR receipts/invoices)
export function hasExplicitVatBreakdownTR(ocrText: string): boolean {
  const t = (ocrText || "").toLowerCase();

  // Strong signals that VAT is explicitly shown:
  // - "kdv" with amount / with % / total KDV lines
  // - invoice context shows Matrah + KDV + Ödenecek Toplam
  const strongPatterns: RegExp[] = [
    /\bkdv\b/,
    /\btoplam\s*kdv\b/,
    /\bkdv\s*tutar[ıi]\b/,
    /\bkdv\s*%/,

    // Sometimes "vat" used instead of KDV
    /\bvat\b/,
    /\bvatable\b/,

    // Invoice semantics
    /\bmatrah\b/,
    /\bvergiler\s*dahil\s*toplam\b/,
    /\b[öo]denecek\s*toplam\b/,
  ];

  // If any strong pattern exists, treat as explicit VAT breakdown.
  // NOTE: This intentionally errs on "explicit" to avoid showing estimated layer when VAT is actually present.
  return strongPatterns.some((re) => re.test(t));
}

// Market POS detection (broad). Use your existing classifier if you already have one.
export function isTrMarketPos(input: PricingInput): boolean {
  const isTR = input.country === "TR";
  const docOk = input.documentType === "POS_TR" || input.documentType === "POS_TR_MARKET";
  const cat = (input.merchantCategory || "OTHER").toUpperCase();
  const isMarketCat = cat === "GROCERY" || cat === "SUPERMARKET" || cat === "MARKET";
  return isTR && docOk && isMarketCat;
}

// Main rule: produce State Layer tax info
export function resolveTrStateTaxLayer(input: PricingInput): StateTaxLayer {
  const total = safeMoney(input.totalPaid);

  // Not applicable if not TR market POS or total invalid
  if (!isTrMarketPos(input) || total <= 0) {
    return {
      taxMode: "NONE",
      taxLabel: "Vergisel Masraflar",
      taxAmount: 0,
      taxReason: "NOT_APPLICABLE",
      includedInHiddenCost: false,
    };
  }

  const ocrHasExplicit = hasExplicitVatBreakdownTR(input.ocrText);

  // If VAT extraction already has a monetary value with reasonable confidence, treat as explicit
  const vatValue = safeMoney(input.vat?.value ?? 0);
  const vatConf = input.vat?.confidence ?? 0;
  const vatRate = input.vat?.rate;

  const vatLooksExplicit = vatValue > 0 && vatValue < total && vatConf >= 0.6;

  if (ocrHasExplicit || vatLooksExplicit) {
    return {
      taxMode: "EXPLICIT",
      taxLabel: "KDV (Fişte belirtilen)",
      taxRate: vatRate,
      taxAmount: round2(vatValue),
      taxReason: "EXPLICIT_VAT_FOUND",
      taxConfidence: vatConf >= 0.85 ? "high" : "medium",
      includedInHiddenCost: false,
      uiNote:
        "Bu fişte KDV ayrıştırılmış olarak bulundu. Bu tutar bilgilendiricidir ve ödül hesabına dahil edilmez.",
    };
  }

  // Otherwise: apply estimated tax layer
  const taxRateEst = DEFAULT_TR_ESTIMATED_TAX_RATE;
  const taxAmountEst = round2(total * taxRateEst);

  return {
    taxMode: "ESTIMATED",
    taxLabel: "Vergisel Masraflar (Tahmini)",
    taxRate: taxRateEst,
    taxAmount: taxAmountEst,
    taxReason: "POS_TR_MARKET_NO_VAT_BREAKDOWN",
    taxConfidence: "medium",
    includedInHiddenCost: false,
    uiNote:
      "Bu fişte KDV ayrıştırılmadığı için sektör ortalamalarına göre tahmini hesaplanmıştır. Bu tutar ödül hesabına dahil edilmez.",
  };
}

// -------- helpers --------
function safeMoney(n: number): number {
  if (!isFinite(n)) return 0;
  return n < 0 ? 0 : n;
}
function round2(n: number): number {
  return Math.round(n * 100) / 100;
}




