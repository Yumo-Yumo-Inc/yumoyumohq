/**
 * Receipt data model types
 */

export type ReceiptStatus =
  | "draft"
  | "verified"
  | "saved"
  | "rejected"
  | "pending"
  | "analyzed"
  | "scanned"
  | "rewarded_other"
  | "pending_bill_review";

export type MerchantTier = "verified" | "candidate" | "unverified";

export interface Merchant {
  name: string;
  placeId?: string;
  category?: string;
  /** When category is "utilities": water | electricity | gas */
  utilityType?: "water" | "electricity" | "gas";
  country?: string;
  channel?: string; // Merchant channel classification (marketplace, supermarket_grocery, etc.)
  /** Canonical merchant UUID when matched via merchant-matching */
  merchantId?: string | null;
  /** Tier from canonical merchant (affects reward multiplier) */
  tier?: MerchantTier | null;
}

export interface ExtractionField {
  value: string | number;
  confidence: number;
  sourceLine?: number;
}

export interface DateExtraction extends ExtractionField {
  value: string; // ISO date string
}

export interface TimeExtraction extends ExtractionField {
  value: string; // HH:MM format (24-hour)
}

export interface TotalExtraction extends ExtractionField {
  value: number;
  currency?: string;
}

export interface VATExtraction extends ExtractionField {
  value: number;
  rate?: number; // VAT rate as decimal (e.g., 0.20 for 20%)
}

export interface Extraction {
  date: DateExtraction;
  time?: TimeExtraction; // Optional time extraction
  total: TotalExtraction;
  vat: VATExtraction;
}

/**
 * Client-safe receipt line item, sourced from the receipt_line_items table.
 * Contains only data printed on the receipt — no hidden-cost decomposition.
 */
export interface ReceiptLineItem {
  id?: number | null;
  rawName: string;
  canonicalName?: string | null;
  brand?: string | null;
  brandStatus?: "resolved" | "unbranded" | "needs_user" | "user_provided" | null;
  quantity?: number | null;
  unitType?: string | null;
  unitPrice?: number | null;
  lineTotal?: number | null;
}

export interface Pricing {
  // Server-authoritative values (DO NOT recompute in UI)
  totalPaid: number; // Total amount paid (net + VAT)
  vatAmount: number; // VAT amount in money (NOT rate)
  paidExTax: number; // Paid amount excluding tax
  vatRate?: number; // VAT rate as decimal (e.g., 0.07 for 7%) - optional, for reference only
  
  // Legacy fields (kept for backward compatibility, but deprecated)
  paidPriceExTax: number; // Same as paidExTax
  stateLayerTax: number; // Same as vatAmount
  
  // Rates for hidden cost calculation
  importSystemRate: number;
  retailHiddenRate: number;
  currency?: string; // ISO code: "TRY", "THB", "USD", etc.
  symbol?: string; // Symbol: "₺", "฿", "$", etc.
  
  // Flight-specific fields (optional, only present for flight receipts)
  baseTransportValue?: number; // Base transport value for flight receipts (from flightHiddenCost)
}

export interface HiddenCostBreakdownItem {
  label: string;
  amount: number;
  description?: string;
  bucket?: "store" | "supply" | "retail" | "government" | "excise" | "other";
  estimated?: boolean;
}

export interface HiddenCostBreakdown {
  importSystemCost: number;
  retailHiddenCost: number;
  /**
   * Embedded excise tax (TR: ÖTV) baked into the shelf price of tobacco /
   * alcohol / fuel. Part of the hidden cost the buyer pays but never sees on the
   * receipt. 0 when the receipt has no excised goods.
   */
  exciseTaxCost?: number;
  items: HiddenCostBreakdownItem[]; // Multiple sub-items for detailed breakdown
}

/**
 * How the hidden-cost TOTAL was derived (the item-level distribution is always a
 * deterministic sector split). Drives the mandatory transparency notice:
 *  - item_derived: priced from the receipt's matched line items.
 *  - category_derived: priced from the category cost-composition model (no items).
 *  - sector_average: generic items / LLM rate / fallback — a sector estimate that
 *    MUST be disclosed to the user (per the product decision, 2026-06-24).
 *  - inflation_premium: inflation_only countries — estimated from the general
 *    inflation (CPI) index; disclosed as an inflation-based estimate.
 */
export type HiddenCostProvenance =
  | "item_derived"
  | "category_derived"
  | "sector_average"
  | "inflation_premium";

export interface HiddenCost {
  referencePrice: number;
  hiddenCostCore: number;
  breakdown: HiddenCostBreakdown;
  // For flights: total hidden cost (hiddenCore + stateLayer)
  hiddenTotal?: number;
  /** How the total was computed — drives the user-facing transparency notice. */
  provenance?: HiddenCostProvenance;
  /** Share (0-1) of paid amount priced from matched line items. */
  completeShare?: number;
}

export interface Reward {
  conversionRate: number;
  raw: number;
  final: number;
  /** bINT bonus = bINT × CPI × Level_Catalyzer × Category_Catalyzer (analyze/post-process). Wire key kept as `ryumo` for the client. */
  ryumo?: number;
  token: string; // "bINT"
  capsApplied: string[];
  /** True when user got the one-time 1.2x bonus for being the first uploader of a now-verified merchant. */
  verifiedThankYou?: boolean;
  /** Set when final reward is 0 — machine-readable reason for UI i18n. */
  noRewardReasonCode?: string;
  /** Short user-facing explanation when no reward was granted. */
  noRewardExplanation?: string;
  /** 1 = full; 0.5 = POS slip partial until itemized receipt matched. */
  rewardFraction?: number;
  /** Full reward before partial fraction (POS slip). */
  fullRewardEstimate?: number;
  /** True when user should upload itemized store receipt to unlock rest. */
  pendingItemizedReceipt?: boolean;
  /** Slip receipt id to pass when uploading the itemized follow-up. */
  pendingSlipReceiptId?: string;
}

/**
 * Reward and hidden cost summary from the receipt_rewards table.
 * Returned as the `rewards` field in the GET /api/receipts/[id] response.
 * May be undefined when post-processing has not completed.
 *
 * Reward formula: bINT = HiddenCost / USD_rate; bINT bonus = bINT × CPI × Level_Catalyzer × Category_Catalyzer.
 * Wire keys kept as `ayumo_amount` / `ryumo_bonus_amount` for the client; DB columns are bint_amount / bint_bonus_amount.
 */
export interface ReceiptRewards {
  /** Base bINT (category hidden cost / USD_rate) */
  base_reward_amount: number;
  /** Additional bINT (canonical delta / USD_rate; 0 if no canonical increase) */
  extra_reward_amount: number;
  /** Total bINT = base + extra (set via DB trigger). Wire key kept as `ayumo_amount`. */
  ayumo_amount: number;
  /** bINT bonus = bINT × CPI × Level_Catalyzer × Category_Catalyzer (reward_version >= 2). Wire key kept as `ryumo_bonus_amount`. */
  ryumo_bonus_amount: number | null;
  /** Category-based hidden cost (base value before post-process) */
  base_hidden_cost: number | null;
  /** Final hidden cost after the canonical pipeline (higher, if present) */
  final_hidden_cost: number | null;
  /** Reward calculation version (2 = USD_rate + CPI + catalyzer) */
  reward_version: number;
  created_at: string | null;
  updated_at: string | null;
}

export interface ReceiptFlags {
  needsLLM: boolean; // Deprecated: use needsAI instead
  reasons: string[];
  rejected?: boolean; // Gate rejection flag
  rejectionReasons?: string[]; // Gate rejection reasons
  gateConfidence?: number; // Gate confidence score (0-100)
  docType?: "receipt" | "invoice" | "delivery_note" | "unknown"; // Detected document type
  revised?: boolean;
  revisionSource?: string;
}

export interface OCRLine {
  lineNo: number;
  text: string;
  confidence?: number; // Optional OCR confidence score (0-1)
}

export interface OCR {
  lines: OCRLine[];
  rawText: string;
}

export interface ReceiptVerification {
  hash: string; // SHA-256 hash of receipt image for duplicate detection
  isDuplicate: boolean;
  duplicateReceiptId?: string;
  duplicateType?: "file" | "visual" | "content";
  duplicateUsername?: string;
  confidenceScore: number; // Overall confidence (0-1)
  merchantVerified: boolean;
  passedGating: boolean; // Whether confidence thresholds are met
}

export type ProofType = "digital_receipt" | "physical_receipt" | "screenshot" | "manual";
export type RewardTier = "A" | "B" | "C" | "none";

export interface ReceiptEvidence {
  hasExif?: boolean;
  exifTimestamp?: string; // ISO timestamp from EXIF data
  photoHash?: string; // Hash of the photo for verification
  hasLocation?: boolean;
  locationMatch?: boolean; // Whether location matches merchant location
}

export interface ReceiptSource {
  app?: string; // Source app (e.g., "yumo", "booking.com", "uber")
  bookingId?: string; // External booking/reference ID
  captureType?: string; // How the receipt was captured (e.g., "camera", "upload", "api")
}

/** Deterministic validation of LLM extraction (Zod + line-total cross-check). */
export interface ExtractionValidationResult {
  status: "accepted" | "rejected" | "needs_review";
  reason?: string;
  zodErrors?: string[];
  details?: {
    linesSum: number;
    totalAmount: number;
    delta: number;
    tolerance: number;
    linesWithQtyUnitPrice: number;
  };
}

export type ReceiptExpenseType = "personal" | "other";

export interface ReceiptAnalysis {
  receiptId: string;
  status: ReceiptStatus;
  /**
   * User-declared receipt category from ReceiptScanner step 1.
   * - "personal": user's own spending (full reward, used in personal insights)
   * - "other":    bulk/business/on-behalf receipts (10% reward, excluded from
   *               personal price-comparison baselines)
   * Defaults to "personal" for legacy records that pre-date this field.
   */
  expenseType?: ReceiptExpenseType;
  merchant: Merchant;
  /**
   * Full legal trade name (e.g. "KADIKÖY GLOBAL TUR. TİC. A.Ş."). Extracted by
   * Gemini from the receipt. The UI shows merchant.name (display); this field
   * is used in admin/legal reports. Written to the DB receipts.merchant_legal_name column.
   */
  merchantLegalName?: string | null;
  /** Phase 7: last 4 digits of the POS slip card. DB receipts.card_last4. */
  cardLast4?: string | null;
  /** Phase 7: POS provider bank (Isbank Visa, Garanti BBVA, QNB, ...). DB receipts.pos_provider. */
  posProvider?: string | null;
  /** Phase 7: tax office name (e.g. "B.MÜKELLEFLER V.D."). DB receipts.tax_office. */
  taxOffice?: string | null;
  /** Phase 7: tax number / VKN (10-11 digits). DB receipts.tax_number. */
  taxNumber?: string | null;
  /** Phase 7: payment method (visa, mastercard, troy, cash, bank transfer, ...). DB receipts.payment_method. */
  paymentMethod?: string | null;
  /** Phase 7: whether payment proof was verified (POS slip, bank transfer, etc.). DB receipts.payment_proven. */
  paymentProven?: boolean | null;
  /** Phase 7: receipt number (e.g. "00081"). DB receipts.receipt_no. */
  receiptNo?: string | null;
  extraction: Extraction;
  pricing: Pricing;
  hiddenCost: HiddenCost;
  reward: Reward;
  flags: ReceiptFlags;
  ocr: OCR;
  verification?: ReceiptVerification;
  fraud?: import("@/lib/fraud/fraud-detection").FraudDetectionResult; // Optional fraud detection result
  createdAt?: string;
  walletAddress?: string;
  username?: string; // User who uploaded this receipt
  
  // New metadata fields (optional for backward compatibility)
  proofType?: ProofType;
  isRewarded?: boolean; // Default true for existing non-manual records
  rewardTier?: RewardTier; // Default "A" for existing records
  riskScore?: number | null; // Fraud/risk score (0-100)
  evidence?: ReceiptEvidence; // Evidence JSON with EXIF, location, etc.
  source?: ReceiptSource; // Source JSON with app, bookingId, captureType
  receiptHash?: string; // SHA-256 hash of receipt file for duplicate detection
  imagePhash?: string; // Perceptual hash for visual similarity detection
  contentHash?: string; // Content hash (merchant + total + date + tax) for content-based duplicate detection
  pipelineLog?: string; // Pipeline/terminal logs for admin evidence (no extra API cost)
  /** Google Vision raw JSON (responses[0]) for post-process; stored in receipt_vision_raw. */
  visionRawJson?: unknown;
  visionMarkdown?: string | null;
  documentType?: string | null;
  isPaymentProof?: boolean | null;
  proofStatus?: string | null;
  completeSlipReceiptId?: string | null;
  geminiLineItems?: Array<{
    name: string;
    quantity?: number;
    unitType?: "adet" | "kg" | "g" | "l" | "ml" | null;
    unitPrice?: number;
    totalPrice?: number;
    vatRate?: number;
  }>;
  /**
   * Client-safe line items (from the receipt_line_items table).
   * Populated via GET /api/receipts/[id]; not returned in list queries.
   * Does NOT include per-line hidden cost — only raw data as printed on the
   * receipt (name, quantity, unit, unit price, total). Unlike geminiLineItems,
   * NOT stripped during sanitize; shown to the user.
   */
  lineItems?: ReceiptLineItem[];
  /** Honor/quality result when USE_HONOR_FOR_VALIDATION is enabled */
  qualityHonor?: {
    level: string;
    honorDelta: number;
    rewardPct: number;
    honorBonusApplied: boolean;
    reasons: string[];
    securityReasons?: string[];
    qualityScore?: number;
  };
  /**
   * Reward summary from the receipt_rewards table.
   * Undefined when post-processing has not completed.
   * Populated via GET /api/receipts/[id]; not returned in list queries.
   */
  rewards?: ReceiptRewards;
  /**
   * Admin-only: list of conditions that would cause rejection for a normal user.
   * Retained even when the pipeline continues successfully via the admin bypass.
   */
  rejectionInfo?: Array<{
    rejected: boolean;
    reason: string;
    reasons?: string[];
    gateConfidence?: number;
    stage?: string;
    substage?: string;
    timestamp?: number;
  }>;
  /** Admin-only: blob file name (used for log download). */
  blobFilename?: string | null;
  /** Admin-only: Blob storage URL. */
  blobUrl?: string | null;
  /** Zod + math gate result when structured LLM line items exist. */
  extractionValidation?: ExtractionValidationResult;
  /**
   * When set, written to receipts.post_process_state instead of default "pending".
   * E.g. needs_review after line-total mismatch; validation_rejected after Zod failure.
   */
  postProcessState?: string;
  /**
   * Merchant address fields extracted by Gemini Vision or GPT-4o fallback.
   * Stored at top level so receipt_data JSONB fallback in admin queries work correctly.
   */
  merchantAddress?: string | null;
  branchInfo?: string | null;
  addressCity?: string | null;
  addressDistrict?: string | null;
  addressNeighborhood?: string | null;
  addressStreet?: string | null;
}

export interface ReceiptStorage {
  receipts: ReceiptAnalysis[];
}

