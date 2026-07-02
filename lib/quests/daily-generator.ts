/**
 * Daily quest generator V2: Tier-based rotation engine.
 *
 * 4 slots/day, each from a different tier:
 *   Slot 1 — Tier 1 (Receipt)
 *   Slot 2 — Tier 2 (Discovery)
 *   Slot 3 — Tier 3 (Savings) → falls back to Tier 1 if the feature is unavailable
 *   Slot 4 — Tier 4 (Social)  → event quest when an event is active
 *
 * Anti-repeat: quests from the last 3 days are excluded from the pool.
 * Segment-adaptive: difficulty filter based on dormant/casual/power segment.
 */

import { getSql } from "@/lib/db/client";
import { getUserState, type UserStateResult } from "./user-state";
import { getUserSegment } from "@/lib/quests/quest-segments";
import {
  SEGMENT_DAILY_POOLS, DAILY_TIER_ORDER,
  DAILY_QUEST_TARGETS, FALLBACK_TITLES,
  isFeatureEnabled, TIER_FALLBACK,
} from "@/lib/quests/quest-pools";
import type { QuestTier, UserSegment as Segment, DailyQuestType } from "@/lib/quests/schema";

function toRows(r: unknown): any[] {
  if (Array.isArray(r)) return r;
  if (r && typeof r === "object" && "rows" in r && Array.isArray((r as { rows: unknown }).rows))
    return (r as { rows: any[] }).rows;
  return [];
}

// ── Deterministic hash ────────────────────────────────────
const FACTORS = [0.8, 1.0, 1.1, 1.2, 1.3, 1.4, 1.5]; // Sun–Sat
const STATIC_FLOOR = 10;

function dayHash(username: string, dateStr: string): number {
  const str = `${username}:${dateStr}`;
  let h = 5381;
  for (let i = 0; i < str.length; i++) {
    h = (Math.imul(h, 33) ^ str.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

function seededPick<T>(items: T[], seed: number, slotOffset: number): T {
  return items[(seed + slotOffset * 1337) % items.length];
}

// ── Title resolver ────────────────────────────────────────

function titleOf(type: string, dbTitle: string | undefined): string {
  if (!dbTitle || dbTitle.length < 3) return FALLBACK_TITLES[type] ?? type;
  return dbTitle;
}

// ── Target resolver ───────────────────────────────────────

function resolveTarget(
  type: string,
  userState: UserStateResult,
  dayOfWeek: number
): number {
  const config = DAILY_QUEST_TARGETS[type];
  if (!config) return 1;
  if (config.fixedTarget !== undefined) return config.fixedTarget;

  switch (config.dynamicFn) {
    case "hiddenCostThreshold": {
      const factor = FACTORS[dayOfWeek] ?? 1.0;
      return Math.max(STATIC_FLOOR, Math.round(userState.user7dAvgHiddenCost * factor));
    }
    case "savingsThreshold": {
      // 80% of 7d avg hidden cost
      return Math.max(5, Math.round(userState.user7dAvgHiddenCost * 0.8));
    }
    case "budgetThreshold": {
      // Dynamic: user's average daily spend (simplified: use hidden cost as proxy)
      return Math.max(10, Math.round(userState.user7dAvgHiddenCost * 0.9));
    }
    case "benchmarkDaily":
      return 2; // simplified: beat daily average (2 receipts)
    default:
      return 1;
  }
}

// ── Savings tier requires price_comparison feature ────────

function isTierAvailable(tier: QuestTier): boolean {
  if (tier === "savings") return isFeatureEnabled("price_comparison");
  // Social quests always available (referral-based ones degrade gracefully)
  return true;
}

// ── Core type ─────────────────────────────────────────────

export interface DailyQuestSlot {
  type: string;
  title: string;
  target: number;
  progress: number;
  rewardRyumo: number;
  rewardSeasonXp: number;
  status: "active" | "completed";
  tier: QuestTier;
}

// ── Main generator ────────────────────────────────────────

export async function generateDailyQuests(
  username: string,
  dateStr: string,
  seasonNumber: number,
  userState?: UserStateResult
): Promise<DailyQuestSlot[]> {
  const state = userState ?? (await getUserState(username));
  const segment = await getUserSegment(username);
  const dayOfWeek = new Date(dateStr + "Z").getUTCDay();
  const hash = dayHash(username, dateStr);

  const sql = getSql();
  if (!sql) return [];

  console.log(`[daily-generator] generateDailyQuests: segment=${segment}, hash=${hash}, dayOfWeek=${dayOfWeek}`);

  // Fetch all daily templates from DB
  // Uses type-based filtering (always works) + frequency column (if migration ran)
  let rawTemplates;
  try {
    rawTemplates = await sql`
      SELECT id, type, title, reward_bint, reward_season_xp, COALESCE(tier, 'receipt') as tier
      FROM quest_templates
      WHERE frequency = 'daily'
         OR type IN ('D1','D3','D4','D5','D6','D7','D8','D9','D10','D11','D12','D13','D14','D16')
         OR type LIKE 'DD%' OR type LIKE 'DS%' OR type LIKE 'DC%'
      ORDER BY type
    `;
  } catch (freqErr) {
    console.warn("[daily-generator] frequency/tier query failed, using fallback:", freqErr);
    // frequency/tier columns may not exist yet — fallback to type-only query
    rawTemplates = await sql`
      SELECT id, type, title, reward_bint, reward_season_xp, 'receipt' as tier
      FROM quest_templates
      WHERE type IN ('D1','D3','D4','D5','D6','D7','D8','D9')
      ORDER BY type
    `;
  }
  const templates = toRows(rawTemplates) as {
    id: number; type: string; title: string;
    reward_bint: number; reward_season_xp: number; tier: string;
  }[];
  const byType = Object.fromEntries(templates.map(t => [t.type, t]));
  console.log(`[daily-generator] found ${templates.length} daily templates in DB:`, templates.map(t => t.type));

  // Recent quests (last 3 days) for anti-repeat
  const recentRaw = await sql`
    SELECT qt.type
    FROM user_quests uq
    JOIN quest_templates qt ON uq.quest_template_id = qt.id
    WHERE uq.username = ${username}
      AND uq.expires_at >= (${dateStr}::date - INTERVAL '3 days')
      AND uq.expires_at < ${dateStr}::date + INTERVAL '1 day'
  `;
  const recentTypes = new Set(toRows(recentRaw).map((r: any) => r.type as string));

  // Set of types that actually exist in DB
  const availableTypes = new Set(templates.map(t => t.type));

  const slots: DailyQuestSlot[] = [];

  for (let i = 0; i < DAILY_TIER_ORDER.length; i++) {
    let tier = DAILY_TIER_ORDER[i];

    // Tier availability check + fallback
    if (!isTierAvailable(tier)) {
      tier = TIER_FALLBACK[tier] ?? "receipt";
    }

    // Get segment-appropriate pool for this tier
    let pool = SEGMENT_DAILY_POOLS[segment][tier] ?? [];

    // Filter to only types that exist in DB (migration may not have run)
    pool = pool.filter(t => availableTypes.has(t));

    // If no types from this tier exist in DB, fallback to receipt tier
    if (pool.length === 0) {
      pool = SEGMENT_DAILY_POOLS[segment]["receipt"]?.filter(t => availableTypes.has(t)) ?? [];
    }
    // Ultimate fallback: any available type
    if (pool.length === 0) {
      pool = Array.from(availableTypes);
    }

    // Filter out recent quests (anti-repeat)
    const alreadySelected = new Set(slots.map(s => s.type));
    let filtered = pool.filter(t => !recentTypes.has(t) && !alreadySelected.has(t));

    // Fallback: remove only already-selected constraint
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
      target: resolveTarget(selectedType, state, dayOfWeek),
      progress: 0,
      rewardRyumo: template?.reward_bint ?? 12,
      rewardSeasonXp: template?.reward_season_xp ?? 60,
      status: "active",
      tier: tier as QuestTier,
    });
  }

  return slots;
}

// ── Ensure + persist ──────────────────────────────────────

export async function ensureDailyQuestsForUser(
  username: string,
  dateStr: string,
  seasonNumber: number
): Promise<{ created: boolean; quests: DailyQuestSlot[] }> {
  const sql = getSql();
  if (!sql) {
    console.warn("[daily-generator] ensureDailyQuestsForUser: sql is null");
    return { created: false, quests: [] };
  }

  // Check if today's quests already exist
  let existingRaw;
  try {
    existingRaw = await sql`
      SELECT uq.id, uq.progress, uq.target, uq.status,
             qt.type, qt.title, qt.reward_bint, qt.reward_season_xp,
             COALESCE(qt.tier, 'receipt') as tier
      FROM user_quests uq
      JOIN quest_templates qt ON uq.quest_template_id = qt.id
      WHERE uq.username = ${username}
        AND (uq.expires_at AT TIME ZONE 'UTC')::date = ${dateStr}::date
        AND qt.type != 'D_ADMIN_FREE_300XP'
    `;
  } catch (e1) {
    console.warn("[daily-generator] tier query failed, trying fallback:", e1);
    // tier column may not exist — fallback query without it
    existingRaw = await sql`
      SELECT uq.id, uq.progress, uq.target, uq.status,
             qt.type, qt.title, qt.reward_bint, qt.reward_season_xp,
             'receipt' as tier
      FROM user_quests uq
      JOIN quest_templates qt ON uq.quest_template_id = qt.id
      WHERE uq.username = ${username}
        AND (uq.expires_at AT TIME ZONE 'UTC')::date = ${dateStr}::date
        AND qt.type != 'D_ADMIN_FREE_300XP'
    `;
  }
  const existing = toRows(existingRaw);
  console.log(`[daily-generator] existing quests for ${username} on ${dateStr}: ${existing.length}`, existing.map((r: any) => r.type));

  if (existing.length >= 4) {
    return {
      created: false,
      quests: existing.map((r: any) => ({
        type: r.type,
        title: titleOf(r.type, r.title),
        target: Number(r.target) ?? 1,
        progress: Number(r.progress) ?? 0,
        rewardRyumo: Number(r.reward_bint) ?? 12,
        rewardSeasonXp: Number(r.reward_season_xp) ?? 60,
        status: Number(r.progress) >= Number(r.target) ? "completed" as const : (r.status ?? "active") as any,
        tier: (r.tier ?? "receipt") as QuestTier,
      })),
    };
  }

  console.log(`[daily-generator] generating new daily quests for ${username}, season ${seasonNumber}`);
  const slots = await generateDailyQuests(username, dateStr, seasonNumber);
  console.log(`[daily-generator] generated ${slots.length} slots:`, slots.map(s => `${s.type}(tier=${s.tier},target=${s.target})`));

  // Fetch template IDs
  const allTypes = slots.map(s => s.type);
  const templatesRaw = await sql`
    SELECT id, type FROM quest_templates WHERE type = ANY(${allTypes})
  `;
  const tplRows = toRows(templatesRaw);
  const tplByType = Object.fromEntries(
    tplRows.map((t: any) => [t.type, t.id])
  );
  console.log(`[daily-generator] template lookup for types [${allTypes.join(",")}]:`, tplByType);

  const missingTemplates = allTypes.filter(t => !tplByType[t]);
  if (missingTemplates.length > 0) {
    console.error(`[daily-generator] MISSING TEMPLATES for types: ${missingTemplates.join(", ")}. Run migration 044.`);
  }

  const endOfDay = new Date(dateStr + "T23:59:59.999Z");

  let insertedCount = 0;
  for (const s of slots) {
    const templateId = tplByType[s.type];
    if (!templateId) {
      console.warn(`[daily-generator] skipping ${s.type}: no template in DB`);
      continue;
    }

    // Skip if already exists
    const existsRaw = await sql`
      SELECT 1 FROM user_quests uq
      JOIN quest_templates qt ON uq.quest_template_id = qt.id
      WHERE uq.username = ${username} AND qt.type = ${s.type}
        AND (uq.expires_at AT TIME ZONE 'UTC')::date = ${dateStr}::date
      LIMIT 1
    `;
    if (toRows(existsRaw).length > 0) {
      console.log(`[daily-generator] ${s.type} already exists, skipping insert`);
      continue;
    }

    try {
      await sql`
        INSERT INTO user_quests
          (username, quest_template_id, status, progress, target, season_number, expires_at)
        VALUES
          (${username}, ${templateId}, 'active', 0, ${s.target}, ${seasonNumber}, ${endOfDay.toISOString()})
      `;
      insertedCount++;
      console.log(`[daily-generator] inserted ${s.type} (template=${templateId}, target=${s.target})`);
    } catch (insertErr) {
      console.error(`[daily-generator] FAILED to insert ${s.type}:`, insertErr);
    }
  }

  console.log(`[daily-generator] done. inserted=${insertedCount}, totalSlots=${slots.length}`);
  return { created: true, quests: slots };
}
