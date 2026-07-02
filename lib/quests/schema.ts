/**
 * Quest schema V2: Tier-based rotation engine.
 * 82+ quest types, 5 tiers, 4 slots/day, 4 slots/week.
 */

// ── Tier Definitions ──────────────────────────────────────
export type QuestTier = "receipt" | "discovery" | "savings" | "social" | "streak";
export type QuestFrequency = "daily" | "weekly" | "monthly" | "streak" | "event";
export type UserSegment = "dormant" | "casual" | "power";

// ── Quest Type Unions ─────────────────────────────────────
// Tier 1: Receipt
export type DailyReceiptType = "D1" | "D3" | "D4" | "D5" | "D6" | "D7" | "D8" | "D9"
  | "D10" | "D11" | "D12" | "D13" | "D14" | "D16";
export type WeeklyReceiptType = "W1A" | "W1B" | "W1C" | "W2" | "W3" | "W4" | "W5" | "W6"
  | "W7" | "W8" | "W9" | "W10" | "W11" | "W12";

// Tier 2: Discovery
export type DailyDiscoveryType = "DD1" | "DD2" | "DD3" | "DD4" | "DD5" | "DD6" | "DD7" | "DD8" | "DD9" | "DD10";
export type WeeklyDiscoveryType = "WD1" | "WD2" | "WD3" | "WD4" | "WD5" | "WD6" | "WD7" | "WD8";

// Tier 3: Savings
export type DailySavingsType = "DS1" | "DS2" | "DS3" | "DS4" | "DS5" | "DS6" | "DS7" | "DS8";
export type WeeklySavingsType = "WS1" | "WS2" | "WS3" | "WS4" | "WS5" | "WS6";

// Tier 4: Social
export type DailySocialType = "DC1" | "DC2" | "DC3" | "DC4" | "DC5" | "DC6";
export type WeeklySocialType = "WC1" | "WC2" | "WC3" | "WC4" | "WC5" | "WC6" | "WC7" | "WC8";

// Combined
export type DailyQuestType = DailyReceiptType | DailyDiscoveryType | DailySavingsType | DailySocialType;
export type WeeklyQuestType = WeeklyReceiptType | WeeklyDiscoveryType | WeeklySavingsType | WeeklySocialType;
export type AnyQuestType = DailyQuestType | WeeklyQuestType;

// ── Legacy exports (backward compat) ─────────────────────
export const DAILY_QUEST_TYPES: DailyReceiptType[] = ["D1", "D3", "D4", "D5", "D6", "D7", "D8", "D9"];
export const WEEKLY_QUEST_TYPES: WeeklyReceiptType[] = ["W1A", "W1B", "W1C", "W2", "W3", "W4", "W5", "W6"];

// ── All type arrays by tier ───────────────────────────────
export const ALL_DAILY_RECEIPT: DailyReceiptType[] = [
  "D1", "D3", "D4", "D5", "D6", "D7", "D8", "D9",
  "D10", "D11", "D12", "D13", "D14", "D16",
];
export const ALL_WEEKLY_RECEIPT: WeeklyReceiptType[] = [
  "W1A", "W1B", "W1C", "W2", "W3", "W4", "W5", "W6",
  "W7", "W8", "W9", "W10", "W11", "W12",
];
export const ALL_DAILY_DISCOVERY: DailyDiscoveryType[] = [
  "DD1", "DD2", "DD3", "DD4", "DD5", "DD6", "DD7", "DD8", "DD9", "DD10",
];
export const ALL_WEEKLY_DISCOVERY: WeeklyDiscoveryType[] = [
  "WD1", "WD2", "WD3", "WD4", "WD5", "WD6", "WD7", "WD8",
];
export const ALL_DAILY_SAVINGS: DailySavingsType[] = [
  "DS1", "DS2", "DS3", "DS4", "DS5", "DS6", "DS7", "DS8",
];
export const ALL_WEEKLY_SAVINGS: WeeklySavingsType[] = [
  "WS1", "WS2", "WS3", "WS4", "WS5", "WS6",
];
export const ALL_DAILY_SOCIAL: DailySocialType[] = [
  "DC1", "DC2", "DC3", "DC4", "DC5", "DC6",
];
export const ALL_WEEKLY_SOCIAL: WeeklySocialType[] = [
  "WC1", "WC2", "WC3", "WC4", "WC5", "WC6", "WC7", "WC8",
];

// ── Combined arrays ───────────────────────────────────────
export const ALL_DAILY_TYPES: DailyQuestType[] = [
  ...ALL_DAILY_RECEIPT, ...ALL_DAILY_DISCOVERY,
  ...ALL_DAILY_SAVINGS, ...ALL_DAILY_SOCIAL,
];
export const ALL_WEEKLY_TYPES: WeeklyQuestType[] = [
  ...ALL_WEEKLY_RECEIPT, ...ALL_WEEKLY_DISCOVERY,
  ...ALL_WEEKLY_SAVINGS, ...ALL_WEEKLY_SOCIAL,
];

// ── Interfaces ────────────────────────────────────────────
export interface UserQuest {
  id: number;
  username: string;
  questTemplateId: number;
  questType: string;
  status: "active" | "completed";
  progress: number;
  target: number;
  seasonNumber: number;
  expiresAt: string | null;
  completedAt: string | null;
  rewardRyumo: number;
  rewardSeasonXp: number;
  rewardAccountXp?: number;
  title: string;
  tier?: QuestTier;
}

export interface UserState {
  user7dAvgHiddenCost: number;
  userRecentMerchants: Set<string>;
  userRecentCategories: Set<string>;
  dayOfWeek: number; // 0=Sunday, 1=Monday, ...
}
