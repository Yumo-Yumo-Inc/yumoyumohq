/**
 * Weekly quest generator V2: Tier-based rotation engine.
 *
 * 4 slots/week, each from a different tier (system-assigned, not user-chosen):
 *   Slot A — Tier 1 (Receipt)
 *   Slot B — Tier 2 (Discovery)
 *   Slot C — Tier 3 (Savings) → falls back to Tier 1 if the feature is unavailable
 *   Slot D — Tier 4 (Social)
 *
 * Weekly targets are 7-10x daily, and harder.
 * Anti-repeat: last week's quests are excluded from the pool.
 */

import { getSql } from "@/lib/db/client";
import { getUserSegment } from "@/lib/quests/quest-segments";
import { getWeekBounds } from "@/lib/quests/weekly-progress";
import {
  SEGMENT_WEEKLY_POOLS, WEEKLY_TIER_ORDER,
  WEEKLY_QUEST_TARGETS, FALLBACK_TITLES,
  isFeatureEnabled, TIER_FALLBACK,
} from "@/lib/quests/quest-pools";
import type { QuestTier, UserSegment as Segment } from "@/lib/quests/schema";

function toRows(r: unknown): any[] {
  if (Array.isArray(r)) return r;
  if (r && typeof r === "object" && "rows" in r && Array.isArray((r as { rows: unknown }).rows))
    return (r as { rows: any[] }).rows;
  return [];
}

function weekHash(username: string, weekStart: string): number {
  const str = `${username}:week:${weekStart}`;
  let h = 5381;
  for (let i = 0; i < str.length; i++) {
    h = (Math.imul(h, 33) ^ str.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

function seededPick<T>(items: T[], seed: number, offset: number): T {
  return items[(seed + offset * 2137) % items.length];
}

function titleOf(type: string, dbTitle: string | undefined): string {
  if (!dbTitle || dbTitle.length < 3) return FALLBACK_TITLES[type] ?? type;
  return dbTitle;
}

// ── Dynamic target resolver for weekly quests ─────────────

interface WeeklyMetrics {
  benchmarkReceiptCount: number;
  previousBestReceiptCount: number;
  lastWeekHiddenCostTotal: number;
  lastWeekSpendingTotal: number;
}

async function getWeeklyMetrics(username: string, weekStart: string, weekEnd: string): Promise<WeeklyMetrics> {
  const sql = getSql();
  if (!sql) return { benchmarkReceiptCount: 5, previousBestReceiptCount: 0, lastWeekHiddenCostTotal: 100, lastWeekSpendingTotal: 500 };

  const [benchmarkRow, prevBestRow, lastWeekRow] = await Promise.all([
    sql`
      SELECT COALESCE(CEIL(PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY cnt)), 5)::int AS benchmark
      FROM (
        SELECT COUNT(*)::int AS cnt FROM receipts
        WHERE (created_at AT TIME ZONE 'UTC')::date >= ${weekStart}::date
          AND (created_at AT TIME ZONE 'UTC')::date <= ${weekEnd}::date
        GROUP BY username
      ) sub
    `.then(r => toRows(r)[0] ?? null),

    sql`
      SELECT COALESCE(MAX(cnt), 0)::int AS best
      FROM (
        SELECT COUNT(*)::int AS cnt FROM receipts
        WHERE username = ${username} AND (created_at AT TIME ZONE 'UTC')::date < ${weekStart}::date
        GROUP BY ((created_at AT TIME ZONE 'UTC')::date - CAST(EXTRACT(DOW FROM created_at AT TIME ZONE 'UTC') AS int))
      ) sub
    `.then(r => toRows(r)[0] ?? null),

    sql`
      SELECT
        COALESCE(SUM(hidden_cost_core), 0)::float AS hidden_total,
        COALESCE(SUM(pricing_total_paid), 0)::float AS spend_total
      FROM receipts
      WHERE username = ${username}
        AND (created_at AT TIME ZONE 'UTC')::date >= (${weekStart}::date - INTERVAL '7 days')
        AND (created_at AT TIME ZONE 'UTC')::date < ${weekStart}::date
    `.then(r => toRows(r)[0] ?? null),
  ]);

  return {
    benchmarkReceiptCount: Math.max(5, Number((benchmarkRow as any)?.benchmark ?? 5)),
    previousBestReceiptCount: Number((prevBestRow as any)?.best ?? 0),
    lastWeekHiddenCostTotal: Number((lastWeekRow as any)?.hidden_total ?? 100),
    lastWeekSpendingTotal: Number((lastWeekRow as any)?.spend_total ?? 500),
  };
}

function resolveWeeklyTarget(type: string, metrics: WeeklyMetrics): number {
  const config = WEEKLY_QUEST_TARGETS[type];
  if (!config) return 5;
  if (config.fixedTarget !== undefined) return config.fixedTarget;

  switch (config.dynamicFn) {
    case "benchmarkWeekly":
      return Math.max(5, metrics.benchmarkReceiptCount + 1);
    case "previousBest":
      return Math.max(1, metrics.previousBestReceiptCount + 1);
    case "weeklyHiddenCostReduction":
      return Math.max(10, Math.round(metrics.lastWeekHiddenCostTotal * 0.9));
    case "weeklySpendingReduction":
      return Math.max(100, Math.round(metrics.lastWeekSpendingTotal * 0.9));
    default:
      return 5;
  }
}

function isTierAvailable(tier: QuestTier): boolean {
  if (tier === "savings") return isFeatureEnabled("price_comparison");
  return true;
}

// ── Main generator ────────────────────────────────────────

export interface WeeklyQuestSlot {
  type: string;
  title: string;
  target: number;
  progress: number;
  rewardRyumo: number;
  rewardSeasonXp: number;
  rewardAccountXp: number;
  status: "active" | "completed";
  tier: QuestTier;
}

export async function generateWeeklyQuests(
  username: string,
  dateStr: string,
  seasonNumber: number
): Promise<WeeklyQuestSlot[]> {
  const segment = await getUserSegment(username);
  const { start: weekStart, end: weekEnd } = getWeekBounds(dateStr);
  const hash = weekHash(username, weekStart);
  const metrics = await getWeeklyMetrics(username, weekStart, weekEnd);

  const sql = getSql();
  if (!sql) return [];

  // Fetch all weekly templates
  const rawTemplates = await sql`
    SELECT id, type, title, reward_bint, reward_season_xp, reward_account_xp, tier
    FROM quest_templates
    WHERE frequency = 'weekly'
       OR type IN ('W1A','W1B','W1C','W2','W3','W4','W5','W6','W7','W8','W9','W10','W11','W12')
       OR type LIKE 'WD%' OR type LIKE 'WS%' OR type LIKE 'WC%'
    ORDER BY type
  `;
  const templates = toRows(rawTemplates) as {
    id: number; type: string; title: string;
    reward_bint: number; reward_season_xp: number;
    reward_account_xp: number | null; tier: string;
  }[];
  const byType = Object.fromEntries(templates.map(t => [t.type, t]));
  const availableTypes = new Set(templates.map(t => t.type));

  // Last week's quests for anti-repeat
  const prevWeekStart = new Date(weekStart + "Z");
  prevWeekStart.setUTCDate(prevWeekStart.getUTCDate() - 7);
  const prevWeekStartStr = prevWeekStart.toISOString().slice(0, 10);

  const recentRaw = await sql`
    SELECT qt.type FROM user_quests uq
    JOIN quest_templates qt ON uq.quest_template_id = qt.id
    WHERE uq.username = ${username}
      AND uq.expires_at >= ${prevWeekStartStr}::date
      AND uq.expires_at < ${weekStart}::date + INTERVAL '1 day'
  `;
  const recentTypes = new Set(toRows(recentRaw).map((r: any) => r.type));

  const slots: WeeklyQuestSlot[] = [];

  for (let i = 0; i < WEEKLY_TIER_ORDER.length; i++) {
    let tier = WEEKLY_TIER_ORDER[i];

    if (!isTierAvailable(tier)) {
      tier = TIER_FALLBACK[tier] ?? "receipt";
    }

    let pool = SEGMENT_WEEKLY_POOLS[segment][tier] ?? [];
    pool = pool.filter(t => availableTypes.has(t));

    if (pool.length === 0) {
      pool = SEGMENT_WEEKLY_POOLS[segment]["receipt"]?.filter(t => availableTypes.has(t)) ?? [];
    }
    if (pool.length === 0) {
      pool = Array.from(availableTypes);
    }

    let filtered = pool.filter(t => !recentTypes.has(t));
    const alreadySelected = new Set(slots.map(s => s.type));
    filtered = filtered.filter(t => !alreadySelected.has(t));

    if (filtered.length === 0) {
      filtered = pool.filter(t => !alreadySelected.has(t));
    }
    if (filtered.length === 0) {
      filtered = [...pool];
    }

    const selectedType = seededPick(filtered, hash, i);
    const template = byType[selectedType];

    slots.push({
      type: selectedType,
      title: titleOf(selectedType, template?.title),
      target: resolveWeeklyTarget(selectedType, metrics),
      progress: 0,
      rewardRyumo: template?.reward_bint ?? 220,
      rewardSeasonXp: template?.reward_season_xp ?? 500,
      rewardAccountXp: template?.reward_account_xp ?? 0,
      status: "active",
      tier: tier as QuestTier,
    });
  }

  return slots;
}

// ── Ensure + persist ──────────────────────────────────────

export async function ensureWeeklyQuestsForUser(
  username: string,
  dateStr: string,
  seasonNumber: number
): Promise<{ created: boolean; quests: WeeklyQuestSlot[] }> {
  const sql = getSql();
  if (!sql) return { created: false, quests: [] };

  const { start: weekStart, end: weekEnd, endTimestamp } = getWeekBounds(dateStr);

  // Check existing weekly quests for this week
  const existingRaw = await sql`
    SELECT uq.id, uq.progress, uq.target, uq.status,
           qt.type, qt.title, qt.reward_bint, qt.reward_season_xp,
           COALESCE(qt.reward_account_xp, 0) as reward_account_xp,
           COALESCE(qt.tier, 'receipt') as tier
    FROM user_quests uq
    JOIN quest_templates qt ON uq.quest_template_id = qt.id
    WHERE uq.username = ${username}
      AND uq.expires_at >= ${weekStart}::date
      AND uq.expires_at < (${weekEnd}::date + INTERVAL '1 day')
      AND qt.type != 'D_ADMIN_FREE_300XP'
      AND qt.type NOT LIKE 'D%'
  `;
  const existing = toRows(existingRaw);

  if (existing.length >= 4) {
    return {
      created: false,
      quests: existing.map((r: any) => ({
        type: r.type,
        title: titleOf(r.type, r.title),
        target: Number(r.target) ?? 1,
        progress: Number(r.progress) ?? 0,
        rewardRyumo: Number(r.reward_bint) ?? 220,
        rewardSeasonXp: Number(r.reward_season_xp) ?? 500,
        rewardAccountXp: Number(r.reward_account_xp) ?? 0,
        status: (r.status ?? "active") as any,
        tier: (r.tier ?? "receipt") as QuestTier,
      })),
    };
  }

  const slots = await generateWeeklyQuests(username, dateStr, seasonNumber);

  const allTypes = slots.map(s => s.type);
  const templatesRaw = await sql`
    SELECT id, type FROM quest_templates WHERE type = ANY(${allTypes})
  `;
  const tplByType = Object.fromEntries(
    toRows(templatesRaw).map((t: any) => [t.type, t.id])
  );

  for (const s of slots) {
    const templateId = tplByType[s.type];
    if (!templateId) continue;

    const existsRaw = await sql`
      SELECT 1 FROM user_quests uq
      JOIN quest_templates qt ON uq.quest_template_id = qt.id
      WHERE uq.username = ${username} AND qt.type = ${s.type}
        AND uq.expires_at >= ${weekStart}::date
        AND uq.expires_at < (${weekEnd}::date + INTERVAL '1 day')
      LIMIT 1
    `;
    if (toRows(existsRaw).length > 0) continue;

    await sql`
      INSERT INTO user_quests
        (username, quest_template_id, status, progress, target, season_number, expires_at)
      VALUES
        (${username}, ${templateId}, 'active', 0, ${s.target}, ${seasonNumber}, ${endTimestamp}::timestamptz)
    `.catch(() => {});
  }

  return { created: true, quests: slots };
}
