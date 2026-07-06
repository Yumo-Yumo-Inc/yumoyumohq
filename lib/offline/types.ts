import type { LeaderboardEntry } from "@/lib/mock/types";

export interface LocalRecordBase {
  id: string;
  updated_at: string;
  version: number;
}

export interface CachedReceiptRecord extends LocalRecordBase {
  receiptId: string;
  status: string;
  createdAt: string | null;
  merchantName: string | null;
  merchantCountry: string | null;
  merchantCategory: string | null;
  merchantPlaceId: string | null;
  totalPaid: number;
  vatAmount: number;
  paidExTax: number;
  currency: string;
  hiddenCostCore: number;
  hiddenTotal: number;
  /** Contribution points (cPoints) earned for this receipt — from contribution_point_events. */
  contributionPoints: number;
  extractionDate: string | null;
  extractionTime: string | null;
  walletAddress: string | null;
  username?: string | null;
  displayName?: string | null;
  /** Machine-readable reason when no reward was granted (e.g. out_of_current_month). */
  noRewardReasonCode?: string | null;
}

export interface CachedUserProfileRecord extends LocalRecordBase {
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  gender: string | null;
  birthDate: string | null;
  occupation: string | null;
  city: string | null;
  country: string | null;
  website: string | null;
  bio: string | null;
  declaredMonthlyIncomeBand: string | null;
  honor: number;
  isAdmin: boolean;
}

export interface CachedProgressRecord extends LocalRecordBase {
  accountLevel: number;
  accountXp: number;
  seasonLevel: number;
  seasonXp: number;
  streak: number;
  checkedInToday: boolean;
  currentSeason: {
    id: number;
    seasonNumber: number;
    name: string;
    startAt: string;
    endAt: string;
  } | null;
}

export interface CachedWalletRecord extends LocalRecordBase {
  address: string | null;
  contributionTotal: number;
  contributionFromReceipts: number;
  contributionFromQuests: number;
  contributionReceipts: number;
  lastContributionAt: string | null;
}

export type CachedQuestKind = "daily" | "weekly" | "weekly_option";

export interface CachedQuestRecord extends LocalRecordBase {
  questKind: CachedQuestKind;
  questDate: string | null;
  weekStart: string | null;
  weekEnd: string | null;
  type: string;
  title: string;
  progress: number;
  target: number;
  status: string;
  completedAt: string | null;
  rewardRyumo: number;
  rewardSeasonXp: number;
}

export interface CachedDashboardSummaryRecord extends LocalRecordBase {
  period: "monthly";
  totalReceiptCount: number;
  receiptCount: number;
  totalSpent: number;
  hiddenCostTotal: number;
  currency: string;
}

export interface MonthlyInsightSummary {
  totalSpent: number;
  receiptCount: number;
  topCategories: string[];
  hiddenCostTotal: number;
  xpEarned: number;
}

export interface CategoryInsightSummary {
  totalSpent: number;
  count: number;
  pct: number;
}

export interface MerchantInsightSummary {
  name: string;
  count: number;
  totalSpent: number;
}

export interface CachedInsightsRecord extends LocalRecordBase {
  currency: string;
  totalSpend: number;
  totalHiddenCost: number;
  totalReceiptCount: number;
  monthly: Record<string, MonthlyInsightSummary>;
  categoryBreakdown: Record<string, CategoryInsightSummary>;
  spendingTrend: number[];
  topMerchants: MerchantInsightSummary[];
}

export type BudgetPeriod = "monthly" | "weekly";

export interface CachedBudgetRecord extends LocalRecordBase {
  category: string;
  period: BudgetPeriod;
  amount: number;
  currency: string;
  note: string | null;
  source: "manual" | "suggested";
  active: boolean;
}

export type SubscriptionCadence = "weekly" | "monthly" | "yearly" | "unknown";
export type SubscriptionStatus = "active" | "paused" | "cancelled";

export interface CachedSubscriptionRecord extends LocalRecordBase {
  merchantName: string;
  category: string | null;
  amount: number;
  currency: string;
  cadence: SubscriptionCadence;
  nextChargeAt: string | null;
  source: "manual" | "auto_detected";
  confidence: number;
  status: SubscriptionStatus;
  lastSeenAt: string | null;
}

export type FinancialGoalStatus = "active" | "paused" | "achieved" | "cancelled";

export interface CachedFinancialGoalRecord extends LocalRecordBase {
  title: string;
  targetAmount: number;
  currency: string;
  deadline: string | null;
  progressAmount: number;
  status: FinancialGoalStatus;
  note: string | null;
}

/**
 * Commitment — the user's active response to an insight.
 *
 * The Personal Finance OS centres on the loop Insight → Commitment → Proof.
 * Every commitment is spawned from either (a) an `insight_event` (the engine
 * detected something and the user accepted it) or (b) a management action
 * (the user manually creates a cap, rule, or swap). All legacy budgets and
 * goals ultimately collapse into this single table — that unification is
 * deferred to Step 10 but the schema is forward-compatible today.
 *
 * `kind` selects the lifecycle + progress semantics:
 *   • price_watch       — monitor a specific product's unit price
 *   • time_rule         — e.g. "no spending after 22:00 on weekdays"
 *   • category_cap      — hard cap for a category in a period
 *   • merchant_diet     — reduce visit frequency / amount at a merchant
 *   • restock_reminder  — surface when it's time to rebuy a staple
 *   • streak_goal       — N-day streak target (e.g. 7 days no impulse)
 *   • ritual_swap       — swap routine A for routine B
 *
 * `params` is deliberately typed as an unstructured map. Each kind consumes
 * its own subset of fields; keeping the shape open lets us add kinds without
 * a schema migration. The motors and UI layers own the validation.
 */
export type CommitmentKind =
  | "price_watch"
  | "time_rule"
  | "category_cap"
  | "merchant_diet"
  | "restock_reminder"
  | "streak_goal"
  | "ritual_swap"
  | "frequency_cap";

export type CommitmentStatus = "active" | "paused" | "completed" | "dismissed";

export interface CachedCommitmentRecord extends LocalRecordBase {
  commitmentId: string;
  kind: CommitmentKind;
  status: CommitmentStatus;
  /** If spawned from an insight event, the originating event id. */
  sourceEventId: string | null;
  title: string;
  description: string | null;
  /** Kind-specific configuration — see the behavior engines for shape. */
  params: Record<string, unknown>;
  progress: number;
  target: number | null;
  currency: string | null;
  startsAt: string | null;
  endsAt: string | null;
  lastEvaluatedAt: string | null;
}

/**
 * InsightEvent — a single detection emitted by the behavior engines.
 *
 * Events are immutable detections with a mutable `state`. The lifecycle is:
 *
 *   detected  (just emitted by a motor; unseen)
 *     → viewed      (user opened the card in the Signal Stream)
 *     → committed   (user accepted → spawns a Commitment row)
 *     | dismissed   (user rejected — kept for noise tuning)
 *     | snoozed     (hidden for a period; will resurface)
 *
 * `payload` carries engine-specific evidence (product id, time bucket,
 * deltas, sample receipt ids, etc.) so the UI can render a rich card
 * without re-running the motor on every render.
 */
export type InsightEventKind =
  | "own_price_track"
  | "impulse_fingerprint"
  | "category_drift"
  | "past_self"
  // Sprint 1 — new behavioral lenses
  | "reward_reflex"
  | "stress_pulse"
  | "micro_leak"
  | "ritual_loop";

export type InsightEventState =
  | "detected"
  | "viewed"
  | "committed"
  | "dismissed"
  | "snoozed";

export interface CachedInsightEventRecord extends LocalRecordBase {
  insightEventId: string;
  kind: InsightEventKind;
  state: InsightEventState;
  title: string;
  summary: string | null;
  confidence: number;
  monetaryImpact: number | null;
  currency: string | null;
  payload: Record<string, unknown>;
  detectedAt: string;
  viewedAt: string | null;
  resolvedAt: string | null;
  spawnedCommitmentId: string | null;
}

/**
 * Line item snapshot cached for the Personal Finance OS insight engines.
 *
 * The server-side `receipt_line_items` table carries a much larger schema
 * (VAT breakdown, raw OCR text, confidence per field, canonical resolution
 * state, etc.). For on-device insights we only persist the fields that the
 * personal-behavior engines actually consume:
 *
 *   • `canonicalName` + `brand`            → own-price tracking, brand swaps
 *   • `categoryLvl1` / `categoryLvl2`      → category drift
 *   • `packSize` + `unitType` + `quantity` → shrinkflation, normalized unit price
 *   • `unitPriceGross` + `lineTotalGross`  → per-unit series, basket attribution
 *   • `discountAmount`                     → lost-discount detection
 *   • `purchasedAt`                        → time series without a receipts join
 *
 * Keeping the cache slim matters: ~200 receipts × ~8 items per receipt is
 * already ~1.6k rows. We intentionally do not mirror OCR raw text or VAT
 * metadata here.
 */
export interface CachedReceiptLineItem extends LocalRecordBase {
  /** Primary key from the server-side `receipt_line_items.id`. */
  receiptLineItemId: string;
  /** Parent receipt id — foreign key into `receipts`. */
  receiptId: string;
  /** Index within the receipt (0-based), used for stable ordering. */
  lineIndex: number;
  /** Purchase timestamp, inherited from the parent receipt. ISO-8601. */
  purchasedAt: string | null;
  rawName: string | null;
  canonicalName: string | null;
  brand: string | null;
  categoryLvl1: string | null;
  categoryLvl2: string | null;
  packSize: number | null;
  unitType: string | null;
  quantity: number;
  unitPriceGross: number | null;
  lineTotalGross: number | null;
  discountAmount: number;
  currency: string;
}

export interface CachedAppConfigRecord extends LocalRecordBase {
  server_time: string;
  supportedInsightWindowMonths: number;
  offlineFirstEnabled: boolean;
}

export interface CachedNotificationRecord extends LocalRecordBase {
  notificationId: number;
  type: string;
  title: string | null;
  body: string | null;
  payload: Record<string, unknown>;
  receiptId: string | null;
  readAt: string | null;
  createdAt: string;
}

export type CachedLeaderboardType = "season" | "global" | "weekly" | "daily";

export interface CachedLeaderboardRecord extends LocalRecordBase {
  leaderboardType: CachedLeaderboardType;
  entries: LeaderboardEntry[];
}

export interface DeletionRecord {
  store: LocalStoreName;
  id: string;
}

export interface BootstrapPayload {
  server_time: string;
  profile: CachedUserProfileRecord | null;
  wallet: CachedWalletRecord | null;
  progress: CachedProgressRecord | null;
  dashboard_summary: CachedDashboardSummaryRecord | null;
  receipts: CachedReceiptRecord[];
  quests: CachedQuestRecord[];
  app_config: CachedAppConfigRecord | null;
  insights: CachedInsightsRecord | null;
  notifications: CachedNotificationRecord[];
  leaderboards: CachedLeaderboardRecord[];
  budgets?: CachedBudgetRecord[];
  subscriptions?: CachedSubscriptionRecord[];
  financial_goals?: CachedFinancialGoalRecord[];
  /** Line-item delta for on-device insight engines (last ~6 months only). */
  receipt_line_items?: CachedReceiptLineItem[];
  commitments?: CachedCommitmentRecord[];
  insight_events?: CachedInsightEventRecord[];
}

export interface SyncPayload {
  server_time: string;
  profile: CachedUserProfileRecord | null;
  wallet: CachedWalletRecord | null;
  progress: CachedProgressRecord | null;
  dashboard_summary: CachedDashboardSummaryRecord | null;
  receipts: CachedReceiptRecord[];
  quests: CachedQuestRecord[];
  app_config: CachedAppConfigRecord | null;
  insights: CachedInsightsRecord | null;
  notifications: CachedNotificationRecord[];
  leaderboards: CachedLeaderboardRecord[];
  deletions: DeletionRecord[];
  budgets?: CachedBudgetRecord[];
  subscriptions?: CachedSubscriptionRecord[];
  financial_goals?: CachedFinancialGoalRecord[];
  receipt_line_items?: CachedReceiptLineItem[];
  commitments?: CachedCommitmentRecord[];
  insight_events?: CachedInsightEventRecord[];
}

export interface BootstrapSnapshot extends BootstrapPayload {
  last_sync_at: string | null;
}

export interface LocalMetaRecord extends LocalRecordBase {
  value: string | null;
}

/**
 * Locally cached original receipt photo (device-first hybrid display).
 * Written right after a successful upload on this device; the detail view
 * reads it before falling back to the server image endpoint.
 */
export interface CachedReceiptImageRecord extends LocalRecordBase {
  blob: Blob;
  contentType: string;
  sizeBytes: number;
}

export type LocalStoreSchema = {
  receipts: CachedReceiptRecord;
  receipt_images: CachedReceiptImageRecord;
  user_profile: CachedUserProfileRecord;
  quests: CachedQuestRecord;
  progress: CachedProgressRecord;
  wallet: CachedWalletRecord;
  dashboard_summary: CachedDashboardSummaryRecord;
  insights: CachedInsightsRecord;
  app_config: CachedAppConfigRecord;
  notifications: CachedNotificationRecord;
  leaderboard: CachedLeaderboardRecord;
  meta: LocalMetaRecord;
  budgets: CachedBudgetRecord;
  subscriptions: CachedSubscriptionRecord;
  financial_goals: CachedFinancialGoalRecord;
  receipt_line_items: CachedReceiptLineItem;
  commitments: CachedCommitmentRecord;
  insight_events: CachedInsightEventRecord;
};

export type LocalStoreName = keyof LocalStoreSchema;

export const LAST_SYNC_META_ID = "last_sync_at";
export const RECEIPTS_HISTORY_HYDRATED_AT_META_ID = "receipts_history_hydrated_at";
export const RECEIPTS_HISTORY_NEXT_PAGE_META_ID = "receipts_history_next_page";
export const RECEIPTS_HISTORY_COMPLETE_META_ID = "receipts_history_complete";
export const CURRENT_PROFILE_ID = "current";
export const CURRENT_PROGRESS_ID = "current";
export const CURRENT_WALLET_ID = "primary";
export const CURRENT_INSIGHTS_ID = "main";
export const CURRENT_APP_CONFIG_ID = "current";
export const MONTHLY_DASHBOARD_ID = "monthly";
