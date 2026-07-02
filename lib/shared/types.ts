// lib/shared/types.ts
// Shared types - can be imported by both client and server

import type {
  CountryCode,
  CurrencyCode,
  Category,
  SectorClass,
  BrandTier,
} from "@/lib/yumo/unified-pricing";

/**
 * Keep legacy enums/types for backwards compatibility
 */
export type ProductCategory =
  | "ELECTRONICS"
  | "GROCERY"
  | "RESTAURANT"
  | "FUEL"
  | "ALCOHOL"
  | "TOBACCO"
  | "PHARMACY"
  | "FASHION"
  | "OTHER";

export interface ExtractedLineItem {
  name: string;
  price: number;
  quantity?: number;
}

export interface TotalVerification {
  extracted: number;
  verified: boolean;
  difference?: number;
}

export interface ReceiptBreakdown {
  total: number;
  items: ExtractedLineItem[];
  taxes?: number;
  subtotal?: number;
}

export interface DeterministicParseResult {
  breakdown: ReceiptBreakdown;
  verification: TotalVerification;
  category?: ProductCategory;
  storeName?: string;
}

/**
 * OCR/Extraction raw data (legacy shape; avoid adding new fields here if possible).
 * Prefer ReconstructedReceipt and MiningDebug below for new pipeline.
 */
export interface ExtractedReceiptData {
  date: string | null; // legacy: unknown format
  total: number | null;
  currency?: string | null;
  currencyConfidence?: number;
  vendor?: string | null;
  vendorConfidence?: number;
  isOnline?: boolean;
  isCardSlip?: boolean;
}

/**
 * Canonical supported countries for mining v0.
 * (Keep in sync with country library / unified-pricing if you use that later.)
 */
export type Country = "TH" | "MY" | "TR" | "TW" | "US" | "DE" | "UK" | "AE" | "SG" | "FR" | "JP";

export type CountryScore = { country: Country; score: number; signals: string[] };

/**
 * Google Places hint (from server enrichment).
 */
export type PlaceHint = {
  countryCode?: string | null;
  currencyCode?: string | null;
  placeId?: string | null;
  name?: string | null;
};

/**
 * Receipt reconstruction model (layout + role-based).
 * This is what you can render as a digital vector receipt in UI.
 */
export type ReconstructedHeader = {
  merchantName?: string | null;
  addressLines?: string[];
  taxId?: string | null;
  phone?: string | null;
  invoiceId?: string | null;
  orderId?: string | null;
  posId?: string | null;
  orderType?: string | null;
  dateRaw?: string | null;
  dateISO?: string | null; // YYYY-MM-DD if normalized
};

export type ReconstructedItem = {
  qty?: number | null;
  name: string;
  amount?: number | null;
  meta?: string[];
};

export type ReconstructedTotals = {
  subtotal?: number | null;
  discount?: number | null;
  serviceCharge?: number | null;
  tax?: number | null; // VAT / GST (informational)
  net?: number | null;
  total?: number | null; // payable total (ex: EATIN TOTAL)
};

export type ReconstructedPayment = {
  cash?: number | null;
  change?: number | null;
  card?: number | null;
  other?: number | null;
};

export type ReconstructedReceipt = {
  header: ReconstructedHeader;
  items: ReconstructedItem[];
  totals: ReconstructedTotals;
  payment?: ReconstructedPayment;
  noiseRemoved?: string[]; // optional list of removed lines/snippets
  sections?: {
    headerLines?: string[];
    itemLines?: string[];
    totalLines?: string[];
    footerLines?: string[];
  };
};

/**
 * Evidence graph / total selection debug
 */
export type TotalCandidate = {
  value: number;
  line?: string;
  lineIndex?: number;
  score: number; // 0..100
  reasons: string[]; // why it got this score
  tags?: string[]; // e.g. ["label:TOTAL_STRONG", "pos:bottom", "tender:reconciled"]
};

export type MiningDecision =
  | "tender_reconcile"
  | "label_strong"
  | "math_check"
  | "position_fallback"
  | "unknown";

/**
 * Hidden cost breakdown (final model)
 * State layer is shown separately (not included in HiddenCostCore).
 */
export type HiddenCostBreakdown = {
  paidPrice: number; // total (incl tax if receipt total is tax-included)
  paidPriceExTax?: number | null;
  referencePrice: number; // factoryCostProxy (ex-tax)
  hiddenCostCore: number; // paidPriceExTax - referencePrice
  layers: {
    importSystem: number;
    retailHidden: number;
  };
  stateLayer?: {
    vat?: number | null;
    customs?: number | null;
    excise?: number | null;
    other?: number | null;
  };
  rates?: {
    importSystemRate: number;
    retailHiddenRate: number;
    vatRate?: number | null;
  };
};

/**
 * Core parse result (minimal contract used by UI + mining gate).
 * Extended with optional debug + reconstruction without breaking existing code.
 */
export type CoreParseResult = {
  country: string | null; // ISO-2
  currency: string | null; // ISO-4217
  date: string | null; // YYYY-MM-DD (target)
  total: number | null;

  flags: {
    needsLLM: boolean;
    reasons: string[];
  };

  // Optional extensions (new pipeline)
  reconstructed?: ReconstructedReceipt;
  decision?: MiningDecision;
  candidates?: {
    total?: TotalCandidate[];
  };
  hiddenCost?: HiddenCostBreakdown;

  // Optional confidence scores (0..1). If absent, treat as unknown.
  confidence?: {
    country?: number;
    currency?: number;
    date?: number;
    total?: number;
  };
};

// Re-export from unified-pricing for convenience
export type { CountryCode, CurrencyCode, Category, SectorClass, BrandTier };
