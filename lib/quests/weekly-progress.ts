import { getSql } from "@/lib/db/client";
import type { WeeklyQuestType, WeeklyReceiptType } from "@/lib/quests/schema";
import { ALL_WEEKLY_TYPES } from "@/lib/quests/schema";
import { dispatchQuestReward } from "@/lib/quests/reward-dispatcher";

// Legacy exports (backward compat)
export const WEEKLY_TYPES: WeeklyReceiptType[] = ["W1A", "W1B", "W1C", "W2", "W3", "W4", "W5", "W6"];
// V2: bonus account XP types (social weekly quests + W2/W5)
export const WEEKLY_ACCOUNT_XP_TYPES = new Set<string>(["W2", "W5", "WC1", "WC2", "WC3", "WC4", "WC5", "WC6", "WC7", "WC8"]);

type WeeklyQuestMetrics = {
  receiptCount: number;
  hiddenReceiptCount: number;
  distinctMerchantCount: number;
  maxSingleCategoryCount: number;
  benchmarkReceiptCount: number;
  previousBestReceiptCount: number;
  // V2 additions
  distinctCategoryCount: number;
  activeDaysCount: number;
  totalSpending: number;
  newMerchantCount: number;
};

type WeeklyQuestRow = {
  id: number;
  type: WeeklyQuestType;
  target: number;
  season_number: number;
  reward_ryumo: number;
  reward_season_xp: number;
};

type WeeklySummaryRow = {
  receipt_count: number;
  hidden_receipt_count: number;
  distinct_merchant_count: number;
};

type WeeklyCategoryRow = {
  max_single_category_count: number;
};

type WeeklyBenchmarkRow = {
  benchmark: number;
};

type WeeklyPreviousBestRow = {
  best_receipt_count: number;
};

function toRows<T>(r: unknown): T[] {
  if (Array.isArray(r)) return r as T[];
  if (r && typeof r === "object" && "rows" in r && Array.isArray((r as { rows?: unknown[] }).rows)) {
    return ((r as { rows: unknown[] }).rows ?? []) as T[];
  }
  return [];
}

// The weekly benchmark (median weekly receipt count across ALL users) is the
// same value for every user in a given week, but used to be recomputed on every
// sync via a full-table PERCENTILE_CONT scan over `receipts`. Cache it per week
// so that scan runs a few times per week instead of once per sync. The cache is
// per warm server instance (in-memory); cold instances recompute once.
const WEEKLY_BENCHMARK_CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6 hours
const weeklyBenchmarkCache = new Map<string, { row: WeeklyBenchmarkRow | null; expiresAt: number }>();

async function getCachedWeeklyBenchmark(
  sql: NonNullable<ReturnType<typeof getSql>>,
  weekStart: string,
  weekEnd: string
): Promise<WeeklyBenchmarkRow | null> {
  const key = `${weekStart}|${weekEnd}`;
  const now = Date.now();
  const cached = weeklyBenchmarkCache.get(key);
  if (cached && cached.expiresAt > now) return cached.row;

  const row = await sql`
    SELECT COALESCE(CEIL(PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY weekly_receipt_count)), 0)::int AS benchmark
    FROM (
      SELECT COUNT(*)::int AS weekly_receipt_count
      FROM receipts
      WHERE (created_at AT TIME ZONE 'UTC')::date >= ${weekStart}::date
        AND (created_at AT TIME ZONE 'UTC')::date <= ${weekEnd}::date
      GROUP BY username
    ) AS weekly_receipt_benchmark
  `.then((r) => toRows<WeeklyBenchmarkRow>(r)[0] ?? null);

  weeklyBenchmarkCache.set(key, { row, expiresAt: now + WEEKLY_BENCHMARK_CACHE_TTL_MS });
  return row;
}

export function getWeekBounds(dateStr: string): {
  start: string;
  end: string;
  endTimestamp: string;
} {
  const d = new Date(dateStr + "Z");
  const day = d.getUTCDay();
  const start = new Date(d);
  start.setUTCDate(start.getUTCDate() - day);
  start.setUTCHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 6);
  end.setUTCHours(23, 59, 59, 999);
  return {
    start: start.toISOString().slice(0, 10),
    end: end.toISOString().slice(0, 10),
    endTimestamp: end.toISOString().slice(0, 19).replace("T", " ") + ".999Z",
  };
}

async function getWeeklyQuestMetrics(
  username: string,
  weekStart: string,
  weekEnd: string
): Promise<WeeklyQuestMetrics> {
  const sql = getSql();
  if (!sql) {
    return {
      receiptCount: 0,
      hiddenReceiptCount: 0,
      distinctMerchantCount: 0,
      maxSingleCategoryCount: 0,
      benchmarkReceiptCount: 5,
      previousBestReceiptCount: 0,
      distinctCategoryCount: 0,
      activeDaysCount: 0,
      totalSpending: 0,
      newMerchantCount: 0,
    };
  }

  const [summaryRow, maxCategoryRow, benchmarkRow, previousBestRow] = await Promise.all([
    sql`
      SELECT
        COUNT(*)::int AS receipt_count,
        COUNT(*) FILTER (WHERE COALESCE(hidden_cost_core, 0) > 0)::int AS hidden_receipt_count,
        COUNT(
          DISTINCT CASE
            WHEN TRIM(COALESCE(merchant_name, '')) != '' THEN LOWER(TRIM(merchant_name))
            ELSE NULL
          END
        )::int AS distinct_merchant_count
      FROM receipts
      WHERE username = ${username}
        AND (created_at AT TIME ZONE 'UTC')::date >= ${weekStart}::date
        AND (created_at AT TIME ZONE 'UTC')::date <= ${weekEnd}::date
    `.then((r) => toRows<WeeklySummaryRow>(r)[0] ?? null),

    sql`
      SELECT COALESCE(MAX(category_count), 0)::int AS max_single_category_count
      FROM (
        SELECT COUNT(*)::int AS category_count
        FROM receipts
        WHERE username = ${username}
          AND (created_at AT TIME ZONE 'UTC')::date >= ${weekStart}::date
          AND (created_at AT TIME ZONE 'UTC')::date <= ${weekEnd}::date
          AND TRIM(COALESCE(merchant_category, '')) != ''
        GROUP BY LOWER(TRIM(merchant_category))
      ) AS grouped_categories
    `.then((r) => toRows<WeeklyCategoryRow>(r)[0] ?? null),

    getCachedWeeklyBenchmark(sql, weekStart, weekEnd),

    sql`
      SELECT COALESCE(MAX(weekly_receipt_count), 0)::int AS best_receipt_count
      FROM (
        SELECT COUNT(*)::int AS weekly_receipt_count
        FROM receipts
        WHERE username = ${username}
          AND (created_at AT TIME ZONE 'UTC')::date < ${weekStart}::date
        GROUP BY ((created_at AT TIME ZONE 'UTC')::date - CAST(EXTRACT(DOW FROM created_at AT TIME ZONE 'UTC') AS int))
      ) AS previous_weeks
    `.then((r) => toRows<WeeklyPreviousBestRow>(r)[0] ?? null),
  ]);

  // V2: additional metrics
  const [catCountRow, activeDaysRow, spendingRow, newMerchRow] = await Promise.all([
    sql`SELECT COUNT(DISTINCT LOWER(TRIM(merchant_category)))::int AS cnt FROM receipts
        WHERE username=${username} AND (created_at AT TIME ZONE 'UTC')::date>=${weekStart}::date
        AND (created_at AT TIME ZONE 'UTC')::date<=${weekEnd}::date
        AND TRIM(COALESCE(merchant_category,''))!=''`.then(r => toRows<{cnt:number}>(r)[0] ?? null),
    sql`SELECT COUNT(DISTINCT (created_at AT TIME ZONE 'UTC')::date)::int AS cnt FROM receipts
        WHERE username=${username} AND (created_at AT TIME ZONE 'UTC')::date>=${weekStart}::date
        AND (created_at AT TIME ZONE 'UTC')::date<=${weekEnd}::date`.then(r => toRows<{cnt:number}>(r)[0] ?? null),
    sql`SELECT COALESCE(SUM(pricing_total_paid),0)::float AS total FROM receipts
        WHERE username=${username} AND (created_at AT TIME ZONE 'UTC')::date>=${weekStart}::date
        AND (created_at AT TIME ZONE 'UTC')::date<=${weekEnd}::date`.then(r => toRows<{total:number}>(r)[0] ?? null),
    sql`SELECT COUNT(DISTINCT LOWER(TRIM(merchant_name)))::int AS cnt FROM receipts
        WHERE username=${username} AND (created_at AT TIME ZONE 'UTC')::date>=${weekStart}::date
        AND (created_at AT TIME ZONE 'UTC')::date<=${weekEnd}::date
        AND LOWER(TRIM(merchant_name)) NOT IN (
          SELECT DISTINCT LOWER(TRIM(merchant_name)) FROM receipts
          WHERE username=${username} AND (created_at AT TIME ZONE 'UTC')::date<${weekStart}::date
          AND TRIM(COALESCE(merchant_name,''))!=''
        )`.then(r => toRows<{cnt:number}>(r)[0] ?? null).catch(() => null),
  ]);

  return {
    receiptCount: Number(summaryRow?.receipt_count ?? 0) || 0,
    hiddenReceiptCount: Number(summaryRow?.hidden_receipt_count ?? 0) || 0,
    distinctMerchantCount: Number(summaryRow?.distinct_merchant_count ?? 0) || 0,
    maxSingleCategoryCount: Number(maxCategoryRow?.max_single_category_count ?? 0) || 0,
    benchmarkReceiptCount: Math.max(5, Number(benchmarkRow?.benchmark ?? 0) || 0),
    previousBestReceiptCount: Number(previousBestRow?.best_receipt_count ?? 0) || 0,
    distinctCategoryCount: Number(catCountRow?.cnt ?? 0) || 0,
    activeDaysCount: Number(activeDaysRow?.cnt ?? 0) || 0,
    totalSpending: Number(spendingRow?.total ?? 0) || 0,
    newMerchantCount: Number(newMerchRow?.cnt ?? 0) || 0,
  };
}

export function getWeeklyQuestTargetForType(
  type: string,
  metrics: WeeklyQuestMetrics
): number {
  switch (type) {
    // Tier 1 Receipt
    case "W1A": return 5;
    case "W1C": return 10;
    case "W1B": return 20;
    case "W2":  return Math.max(5, metrics.benchmarkReceiptCount + 1);
    case "W3":  return Math.max(1, metrics.previousBestReceiptCount + 1);
    case "W4":  return 5;
    case "W5":  return 8;
    case "W6":  return 10;
    case "W7":  return Math.max(10, Math.round(metrics.hiddenReceiptCount * 0.9)); // reduce hidden cost
    case "W8":  return 5; // 5 distinct categories
    case "W9":  return 7; // 7/7 active days
    case "W10": return 2000; // cumulative spending
    case "W11": return 3; // 3 new merchants
    case "W12": return 3; // 3 active days
    // Tier 2 Discovery
    case "WD1": return 5;
    case "WD2": return 6;
    case "WD3": return 3;
    case "WD4": return 3;
    case "WD5": return 4;
    case "WD6": return 2;
    case "WD7": return 3;
    case "WD8": return 3;
    // Tier 3 Savings
    case "WS1": return Math.max(10, Math.round(metrics.hiddenReceiptCount * 0.9));
    case "WS2": return 5;
    case "WS3": return Math.max(100, Math.round(metrics.totalSpending * 0.9));
    case "WS4": return 1;
    case "WS5": return 5;
    case "WS6": return 1;
    // Tier 4 Social
    case "WC1": return 1;
    case "WC2": return 3;
    case "WC3": return 1;
    case "WC4": return 1;
    case "WC5": return 1;
    case "WC6": return 10;
    case "WC7": return 5;
    case "WC8": return 3;
    default: return 1;
  }
}

export function getWeeklyQuestProgressForType(
  type: string,
  metrics: WeeklyQuestMetrics
): number {
  switch (type) {
    // Tier 1 Receipt
    case "W1A": case "W1B": case "W1C": case "W2": case "W3":
      return metrics.receiptCount;
    case "W4":
      return metrics.maxSingleCategoryCount;
    case "W5":
      return metrics.hiddenReceiptCount;
    case "W6":
      return metrics.distinctMerchantCount;
    case "W7": // hidden cost reduction (progress = inverse — handled by target comparison)
      return metrics.hiddenReceiptCount; // simplified
    case "W8": // 5 distinct categories
      return metrics.distinctCategoryCount;
    case "W9": // 7/7 active days
      return metrics.activeDaysCount;
    case "W10": // cumulative spending > 2000 TL
      return Math.round(metrics.totalSpending);
    case "W11": // 3 new merchants
      return metrics.newMerchantCount;
    case "W12": // minimum 3 active days
      return metrics.activeDaysCount;

    // Tier 2 Discovery weekly
    case "WD1": // 5 distinct merchants
      return metrics.distinctMerchantCount;
    case "WD2": // 6 distinct categories
      return metrics.distinctCategoryCount;
    case "WD3": // price comparisons (not trackable yet)
      return 0;
    case "WD4": // 3 local merchants (simplified: new merchants)
      return metrics.newMerchantCount;
    case "WD5": // 4 active days
      return metrics.activeDaysCount;
    case "WD6": // 2 new categories (simplified: distinct categories)
      return metrics.distinctCategoryCount;
    case "WD7": // 3 comparisons (not trackable yet)
      return 0;
    case "WD8": // shop outside top 3 (simplified: new merchants)
      return metrics.newMerchantCount;

    // Tier 3 Savings weekly
    case "WS1": // hidden cost reduction
      return metrics.hiddenReceiptCount; // simplified
    case "WS2": // 5 price comparisons
      return 0; // not trackable yet
    case "WS3": // spending reduction
      return Math.round(metrics.totalSpending); // compared to dynamic target
    case "WS4": // 20%+ savings deal
      return 0; // requires price comparison
    case "WS5": // 5 promo products
      return metrics.receiptCount; // simplified
    case "WS6": // basket comparison shopping
      return 0; // requires price comparison

    // Tier 4 Social weekly
    case "WC1": // top 10% (simplified: receipt count)
      return metrics.receiptCount;
    case "WC2": // invite 3 friends
      return 0; // requires referral tracking
    case "WC3": // city champion
      return metrics.receiptCount; // simplified
    case "WC4": // category leader
      return metrics.maxSingleCategoryCount;
    case "WC5": // discover new merchants for community
      return metrics.newMerchantCount;
    case "WC6": // team player: referrals upload 10
      return 0; // requires referral tracking
    case "WC7": // invite 5 people
      return 0; // requires referral tracking
    case "WC8": // mentor: 3 invited users active
      return 0; // requires referral tracking

    default:
      return 0;
  }
}

export function getWeeklyQuestRewardAccountXp(type: string): number | undefined {
  return WEEKLY_ACCOUNT_XP_TYPES.has(type) ? 80 : undefined;
}

export async function syncWeeklyQuestProgress(
  username: string,
  dateStr: string = new Date().toISOString().slice(0, 10)
): Promise<number> {
  const sql = getSql();
  if (!sql) return 0;

  const { start, end } = getWeekBounds(dateStr);
  const metrics = await getWeeklyQuestMetrics(username, start, end);

  // V2: sync ALL weekly quest types (not just W1A-W6)
  const questRows = toRows(
    await sql`
      SELECT
        uq.id,
        uq.target,
        qt.type
      FROM user_quests uq
      JOIN quest_templates qt ON uq.quest_template_id = qt.id
      WHERE uq.username = ${username}
        AND (qt.frequency = 'weekly' OR qt.type IN ('W1A','W1B','W1C','W2','W3','W4','W5','W6'))
        AND qt.type NOT LIKE 'D%'
        AND uq.expires_at >= ${start}::date
        AND uq.expires_at < (${end}::date + INTERVAL '1 day')
        AND uq.status = 'active'
    `
  ) as Array<{ id: number; target: number; type: string }>;

  for (const quest of questRows) {
    const target = Number(quest.target) || 1;
    const rawProgress = getWeeklyQuestProgressForType(quest.type, metrics);
    const progress = Math.min(rawProgress, target);
    await sql`
      UPDATE user_quests
      SET progress = ${progress}, updated_at = now()
      WHERE id = ${quest.id}
    `;
  }

  return autoCompleteEligibleWeeklyQuests(username, dateStr);
}

export async function autoCompleteEligibleWeeklyQuests(
  username: string,
  dateStr: string = new Date().toISOString().slice(0, 10)
): Promise<number> {
  const sql = getSql();
  if (!sql) return 0;

  const { start, end } = getWeekBounds(dateStr);
  // V2: auto-complete ALL weekly types
  const eligibleRows = toRows(
    await sql`
      SELECT
        uq.id,
        uq.target,
        uq.progress,
        uq.season_number,
        qt.type,
        qt.reward_ryumo,
        qt.reward_season_xp
      FROM user_quests uq
      JOIN quest_templates qt ON uq.quest_template_id = qt.id
      WHERE uq.username = ${username}
        AND (qt.frequency = 'weekly' OR qt.type IN ('W1A','W1B','W1C','W2','W3','W4','W5','W6'))
        AND qt.type NOT LIKE 'D%'
        AND uq.expires_at >= ${start}::date
        AND uq.expires_at < (${end}::date + INTERVAL '1 day')
        AND uq.status = 'active'
        AND COALESCE(uq.progress, 0) >= COALESCE(uq.target, 1)
      ORDER BY uq.updated_at ASC, uq.id ASC
    `
  ) as WeeklyQuestRow[];

  let completedCount = 0;

  for (const quest of eligibleRows) {
    const result = await dispatchQuestReward(
      username,
      Number(quest.id),
      quest.type,
      Number(quest.reward_ryumo) || 0,
      Number(quest.reward_season_xp) || 0,
      Number(quest.season_number) || 1,
      getWeeklyQuestRewardAccountXp(quest.type)
    );

    if (result.ok) {
      if (!result.alreadyProcessed) {
        completedCount += 1;
      }
      continue;
    }

    console.warn("[quests] weekly auto-complete failed:", {
      username,
      questId: quest.id,
      questType: quest.type,
      error: result.error,
    });
  }

  return completedCount;
}

export async function getWeeklyQuestSelectionState(
  username: string,
  dateStr: string = new Date().toISOString().slice(0, 10)
): Promise<{
  weekStart: string;
  weekEnd: string;
  targetsByType: Record<WeeklyQuestType, number>;
  progressByType: Record<WeeklyQuestType, number>;
}> {
  const { start, end } = getWeekBounds(dateStr);
  const metrics = await getWeeklyQuestMetrics(username, start, end);

  const targetsByType = Object.fromEntries(
    WEEKLY_TYPES.map((type) => [type, getWeeklyQuestTargetForType(type, metrics)])
  ) as Record<WeeklyQuestType, number>;
  const progressByType = Object.fromEntries(
    WEEKLY_TYPES.map((type) => [type, getWeeklyQuestProgressForType(type, metrics)])
  ) as Record<WeeklyQuestType, number>;

  return {
    weekStart: start,
    weekEnd: end,
    targetsByType,
    progressByType,
  };
}
