export type ReceiptStatus =
  | "PENDING"
  | "VERIFIED"
  | "REJECTED"
  | "analyzed"
  | "scanned"
  | "rewarded_other";

export type ReceiptExpenseType = "personal" | "other";

export interface HiddenCost {
  importSystem: number;
  retailBrand: number;
  state: number;
  /**
   * Embedded excise tax (TR: ÖTV) on tobacco / alcohol / fuel — baked into the
   * shelf price, paid by the buyer but never itemised on the receipt. 0 / absent
   * for receipts without excised goods.
   */
  exciseTax?: number;
  productValue: number;
  totalHidden: number;
  systemSubsidy?: number; // Subsidy amount when productValue is negative (normalized to 0)
  breakdownItems?: Array<{
    label: string;
    amount: number;
    description?: string;
    bucket?: "store" | "supply" | "retail" | "government" | "excise" | "other";
    estimated?: boolean;
  }>;
  /**
   * How the hidden-cost TOTAL was derived. "sector_average" / "category_derived"
   * MUST trigger a user-facing notice that the figure is an estimate, not computed
   * from the receipt's own line items (product decision, 2026-06-24).
   */
  provenance?: "item_derived" | "category_derived" | "sector_average" | "inflation_premium";
  /** Share (0-1) of paid amount priced from matched line items. */
  completeShare?: number;
}

export interface Reward {
  amount: number;
  symbol: string;
  claimable: boolean;
  /** rYUMO (CPI × level × category catalyzer applied); from receipt_rewards or analyze response */
  ryumo?: number;
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
}

export interface OCRLine {
  lineNo: number;
  text: string;
}

/** Client-safe printed line item (no hidden-cost decomposition). */
export interface ReceiptLineItem {
  /** receipt_line_items.id — needed to save a user-provided brand. */
  id?: number | null;
  rawName: string;
  canonicalName?: string | null;
  /** Human-readable display name (display_name_tr). canonicalName is a machine
   *  slug (ASCII snake_case) used for matching only — never shown to the user. */
  displayName?: string | null;
  brand?: string | null;
  /** Brand resolution state; 'needs_user' triggers the result-screen prompt. */
  brandStatus?: "resolved" | "unbranded" | "needs_user" | "user_provided" | null;
  quantity?: number | null;
  unitType?: string | null;
  unitPrice?: number | null;
  lineTotal?: number | null;
}

export interface TotalCandidate {
  value: number;
  score: number;
  fromLine: number;
  reasons: string[];
}

export interface DuplicateCheck {
  isDuplicate: boolean;
  matchedReceiptId?: string;
  duplicateType?: "file" | "visual" | "content";
  duplicateUsername?: string;
}

export interface FraudInfo {
  fraudScore: number;
  riskLevel: "low" | "medium" | "high" | "critical";
  isValid: boolean;
  rejectionReasons: string[];
  warnings: string[];
  checks?: {
    hasExif?: boolean;
    hasDate?: boolean;
    hasTime?: boolean;
    merchantVerified?: boolean;
    hasInfrastructure?: boolean;
    hasHandwritingSignals?: boolean;
    isScreenshot?: boolean;
    ocrConfidence?: number;
  };
}

export interface Receipt {
  id: string;
  merchantName: string;
  merchantPlaceId?: string;
  country: string;
  currency: string;
  date: string;
  time?: string; // Time string (HH:MM format, optional)
  total: number;
  vat: number;
  paidExTax: number;
  status: ReceiptStatus;
  /** User-declared spend context: personal shopping vs bulk/other on behalf of someone else */
  expenseType?: ReceiptExpenseType;
  confidence: number;
  hiddenCost: HiddenCost;
  reward: Reward;
  reasons: string[];
  ocrLines: OCRLine[];
  /** Printed line items from receipt_line_items; populated by GET /api/receipts/[id]. */
  lineItems?: ReceiptLineItem[];
  pickedTotalCandidate: TotalCandidate;
  duplicateCheck: DuplicateCheck;
  createdAt: string;
  imageUrl?: string;
  category?: string; // Merchant category (grocery, restaurant, etc.)
  /** When category is "utilities": water | electricity | gas */
  utilityType?: "water" | "electricity" | "gas";
  totalPaid?: number; // Alias for total
  ocrRawText?: string; // Raw OCR text (for admin viewing)
  username?: string; // Username who uploaded this receipt (for admin viewing)
  displayName?: string; // Display name (user_profiles.display_name)
  merchantChannel?: string; // Merchant channel classification (marketplace, supermarket_grocery, etc.)
  fraudInfo?: FraudInfo; // Fraud detection information (for admin display)
  riskScore?: number | null; // Fraud/risk score (0-100)
  marginViolation?: {
    hasViolation: boolean;
    violationCount: number;
    reason?: string;
    violations?: string[]; // Detailed violation list (e.g., ["top=0px < 80px", "right=1px < 60px"])
    margins?: { top?: number; bottom?: number; left?: number; right?: number }; // Actual margin values
    minRequired?: { top?: number; bottom?: number; left?: number; right?: number }; // Minimum required margins
    adminBypass?: string; // Admin bypass message - why a normal user would have been rejected
  }; // Margin violation info (for friendly reminder to all users)
  rejectionInfo?: Array<{
    rejected: boolean;
    reason: string;
    reasons: string[];
    gateConfidence?: number;
    stage: string;
    substage?: string;
    timestamp?: number;
  }>; // Rejection info (for admin display - shows all rejection reasons that were bypassed)
  pipelineLog?: string; // Pipeline/terminal logs for admin evidence (admin only)
  blobFilename?: string; // Blob storage filename (e.g. m-migros-2026-01-23-773.35-TRY-iQxxMwTiubV1yNGN6EDnuyXRMGLCPQ.jpg) for log download naming
  /** Honor/quality result for this receipt (honorDelta, reward%, 1.2x bonus); shown to all including admin (admin's profile honor is not updated) */
  qualityHonor?: {
    level: string;
    honorDelta: number;
    rewardPct: number;
    honorBonusApplied: boolean;
    reasons?: string[];
    /** Quality score 0–90+ (admin breakdown) */
    qualityScore?: number;
    /** Security red reasons when SECURITY level (admin breakdown) */
    securityReasons?: string[];
  };
}

export interface UserStats {
  spentMonth: number;
  hiddenMonth: number;
  productValueMonth: number;
  minedToday: number;
  streakDays: number;
  nextTierInReceipts: number;
  multiplier: number;
  claimableRewards: number;
}

export type QuestType = "DAILY" | "WEEKLY" | "SEASONAL";

export interface Quest {
  id: string;
  title: string;
  description: string;
  progress: number;
  target: number;
  rewardText: string;
  type: QuestType;
  completed: boolean;
}

export type TaskType = "SOCIAL_MEDIA" | "CHALLENGE" | "CONTENT_CREATION" | "COMMUNITY";

export interface Task {
  id: string;
  title: string;
  description: string;
  type: TaskType;
  platform?: string; // Twitter, TikTok, Instagram, etc.
  progress: number;
  target: number;
  rewardText: string;
  rewardAmount: number;
  completed: boolean;
  deadline?: string;
  instructions: string[];
  tags: string[];
}

export interface LeaderboardEntry {
  rank: number;
  /** Username for "Sen" highlight on leaderboard (from API) */
  username?: string;
  address: string;
  displayName: string;
  avatarUrl?: string | null;
  receiptsVerified: number;
  hiddenCostUncovered: number;
  streakDays: number;
  badges: string[];
  /** Honor score (0–100); only users with honor > 0 are shown when Honor system is enabled */
  honor?: number;
  /** Airdrop contribution points — primary metric for airdrop tab */
  contributionPoints?: number;
  /** Receipt-sourced contribution points */
  receiptContributionPoints?: number;
  /** Quest-sourced contribution points */
  questContributionPoints?: number;
  /** All-time total aYUMO (admin-only, from API when viewer is admin) */
  totalAyumo?: number;
  /** All-time total rYUMO (admin-only, from API when viewer is admin) */
  totalRyumo?: number;
}

export interface ReceiptFilters {
  dateFrom?: string;
  dateTo?: string;
  country?: string;
  status?: ReceiptStatus;
  expenseType?: ReceiptExpenseType | "all";
  verifiedOnly?: boolean;
  search?: string;
}

export interface InsightData {
  monthlySpend: { month: string; spend: number; hidden: number }[];
  categoryBreakdown: { category: string; amount: number }[];
  topMerchants: { name: string; receipts: number; total: number }[];
  inflationIndex: number;
}

export type ActivityType = "RECEIPT_VERIFIED" | "TASK_COMPLETED" | "ADJUSTMENT" | "CLAIM";

export interface ActivityLog {
  id: string;
  type: ActivityType;
  date: string;
  description: string;
  amount: number;
  currency: string; // "aYUMO" or "rYUMO"
  status: "COMPLETED" | "PENDING";
  referenceId?: string; // Receipt ID, Task ID, etc.
}