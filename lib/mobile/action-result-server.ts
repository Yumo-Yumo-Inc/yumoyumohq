import { getSql, warmUpConnection } from "@/lib/db/client";
import {
  CURRENT_PROFILE_ID,
  CURRENT_PROGRESS_ID,
  CURRENT_WALLET_ID,
  type CachedProgressRecord,
  type CachedQuestRecord,
  type CachedUserProfileRecord,
  type CachedWalletRecord,
} from "@/lib/offline/types";
import type { MobileActionResult, MobileLevelEvent } from "@/lib/mobile/action-result-types";
import { isAdminUser } from "@/lib/auth/admin-users";
import { normalizeCountryCode } from "@/lib/shared/countries";
import { formatDateOnly } from "@/lib/shared/date-only";
import { getLocalDateStringForCountry } from "@/lib/streak/timezone";

function toRows<T>(value: unknown): T[] {
  if (Array.isArray(value)) return value as T[];
  if (value && typeof value === "object" && "rows" in value && Array.isArray((value as { rows?: unknown[] }).rows)) {
    return ((value as { rows: unknown[] }).rows ?? []) as T[];
  }
  return [];
}

function toIso(value: unknown, fallback: string): string {
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "string" && value.trim()) {
    const date = new Date(value);
    if (!Number.isNaN(date.getTime())) return date.toISOString();
  }
  return fallback;
}

function toVersion(updatedAt: string): number {
  const value = Date.parse(updatedAt);
  return Number.isFinite(value) ? value : Date.now();
}

function getWeekBounds(dateStr: string): { start: string; end: string } {
  const date = new Date(`${dateStr}T00:00:00.000Z`);
  const start = new Date(date);
  start.setUTCDate(start.getUTCDate() - start.getUTCDay());
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 6);
  return {
    start: start.toISOString().slice(0, 10),
    end: end.toISOString().slice(0, 10),
  };
}

export interface MobileLevelSnapshot {
  accountLevel: number;
  seasonLevel: number;
}

export async function getMobileLevelSnapshot(username: string): Promise<MobileLevelSnapshot> {
  const sql = getSql();
  if (!sql) {
    return { accountLevel: 1, seasonLevel: 1 };
  }

  await warmUpConnection();
  const result = await sql`
    SELECT COALESCE(account_level, 1)::int AS account_level,
           COALESCE(season_level, 1)::int AS season_level
    FROM user_profiles
    WHERE username = ${username}
    LIMIT 1
  `;
  const row = toRows<Record<string, unknown>>(result)[0] ?? null;
  return {
    accountLevel: Number(row?.account_level ?? 1) || 1,
    seasonLevel: Number(row?.season_level ?? 1) || 1,
  };
}

export function createMobileLevelEvent(
  before: MobileLevelSnapshot,
  after: MobileLevelSnapshot
): MobileLevelEvent | null {
  const account =
    after.accountLevel > before.accountLevel
      ? { from: before.accountLevel, to: after.accountLevel }
      : undefined;
  const season =
    after.seasonLevel > before.seasonLevel
      ? { from: before.seasonLevel, to: after.seasonLevel }
      : undefined;

  if (!account && !season) return null;
  return {
    id: Date.now(),
    account,
    season,
  };
}

async function getProfilePatch(
  username: string,
  serverTime: string
): Promise<{
  profile: CachedUserProfileRecord | null;
  progress: CachedProgressRecord | null;
  wallet: CachedWalletRecord | null;
}> {
  const sql = getSql();
  if (!sql) return { profile: null, progress: null, wallet: null };

  const [profileResult, seasonResult, walletResult] = await Promise.all([
    sql`
      SELECT
        account_level,
        account_xp,
        season_level,
        season_xp,
        ryumo_balance,
        streak,
        display_name,
        avatar_url,
        gender,
        birth_date,
        occupation,
        city,
        country,
        website,
        bio,
        declared_monthly_income_band,
        honor,
        updated_at
      FROM user_profiles
      WHERE username = ${username}
      LIMIT 1
    `,
    sql`
      SELECT id, season_number, name, start_at, end_at
      FROM seasons
      WHERE status = 'active'
      ORDER BY start_at DESC
      LIMIT 1
    `,
    sql`
      SELECT wallet_address, COALESCE(updated_at, created_at) AS updated_at
      FROM receipts
      WHERE username = ${username}
        AND wallet_address IS NOT NULL
        AND trim(wallet_address) != ''
      ORDER BY COALESCE(updated_at, created_at) DESC
      LIMIT 1
    `.catch(() => []),
  ]);

  const profileRow = toRows<Record<string, unknown>>(profileResult)[0] ?? null;
  if (!profileRow) return { profile: null, progress: null, wallet: null };

  const todayStr = getLocalDateStringForCountry(
    normalizeCountryCode(profileRow.country as string | null)
  );
  const checkedInResult = await sql`
    SELECT 1
    FROM check_ins
    WHERE username = ${username}
      AND check_in_date = ${todayStr}::date
    LIMIT 1
  `.catch(() => []);

  const seasonRow = toRows<Record<string, unknown>>(seasonResult)[0] ?? null;
  const checkedInToday = toRows(checkedInResult).length > 0;
  const walletRow = toRows<Record<string, unknown>>(walletResult)[0] ?? null;
  const updatedAt = toIso(profileRow.updated_at, serverTime);

  return {
    profile: {
      id: CURRENT_PROFILE_ID,
      username,
      displayName: (profileRow.display_name as string | null) ?? null,
      avatarUrl: (profileRow.avatar_url as string | null) ?? null,
      gender: (profileRow.gender as string | null) ?? null,
      birthDate: formatDateOnly(profileRow.birth_date),
      occupation: (profileRow.occupation as string | null) ?? null,
      city: (profileRow.city as string | null) ?? null,
      country: (profileRow.country as string | null) ?? null,
      website: (profileRow.website as string | null) ?? null,
      bio: (profileRow.bio as string | null) ?? null,
      declaredMonthlyIncomeBand: (profileRow.declared_monthly_income_band as string | null) ?? null,
      honor: Number(profileRow.honor ?? 50) || 50,
      isAdmin: isAdminUser(username),
      updated_at: updatedAt,
      version: toVersion(updatedAt),
    },
    progress: {
      id: CURRENT_PROGRESS_ID,
      accountLevel: Number(profileRow.account_level ?? 1) || 1,
      accountXp: Number(profileRow.account_xp ?? 0) || 0,
      seasonLevel: Number(profileRow.season_level ?? 1) || 1,
      seasonXp: Number(profileRow.season_xp ?? 0) || 0,
      streak: Number(profileRow.streak ?? 0) || 0,
      checkedInToday,
      currentSeason: seasonRow
        ? {
            id: Number(seasonRow.id ?? 0) || 0,
            seasonNumber: Number(seasonRow.season_number ?? 1) || 1,
            name: String(seasonRow.name ?? ""),
            startAt: toIso(seasonRow.start_at, serverTime),
            endAt: toIso(seasonRow.end_at, serverTime),
          }
        : null,
      updated_at: updatedAt,
      version: toVersion(updatedAt),
    },
    wallet: {
      id: CURRENT_WALLET_ID,
      address: (walletRow?.wallet_address as string | null) ?? null,
      contributionTotal: 0,
      contributionFromReceipts: 0,
      contributionFromQuests: 0,
      contributionReceipts: 0,
      lastContributionAt: null,
      updated_at: toIso(walletRow?.updated_at ?? updatedAt, updatedAt),
      version: toVersion(toIso(walletRow?.updated_at ?? updatedAt, updatedAt)),
    },
  };
}

async function getQuestPatch(username: string, serverTime: string): Promise<CachedQuestRecord[]> {
  const sql = getSql();
  if (!sql) return [];

  const todayStr = serverTime.slice(0, 10);
  const week = getWeekBounds(todayStr);
  const [dailyResult, weeklyResult] = await Promise.all([
    sql`
      SELECT
        uq.id, uq.progress, uq.target, uq.status,
        uq.completed_at, uq.updated_at,
        qt.type, qt.title, qt.reward_ryumo, qt.reward_season_xp
      FROM user_quests uq
      JOIN quest_templates qt ON uq.quest_template_id = qt.id
      WHERE uq.username = ${username}
        AND qt.type NOT LIKE 'W%'
        AND (uq.expires_at AT TIME ZONE 'UTC')::date = ${todayStr}::date
      ORDER BY qt.type, uq.id DESC
    `,
    sql`
      SELECT
        uq.id, uq.progress, uq.target, uq.status,
        uq.completed_at, uq.updated_at,
        qt.type, qt.title, qt.reward_ryumo, qt.reward_season_xp
      FROM user_quests uq
      JOIN quest_templates qt ON uq.quest_template_id = qt.id
      WHERE uq.username = ${username}
        AND qt.type LIKE 'W%'
        AND uq.expires_at >= ${week.start}::date
        AND uq.expires_at < (${week.end}::date + INTERVAL '1 day')
      ORDER BY uq.created_at DESC
    `,
  ]);

  const records: CachedQuestRecord[] = [];
  const dailyByType = new Map<string, CachedQuestRecord>();
  for (const row of toRows<Record<string, unknown>>(dailyResult)) {
    const updatedAt = toIso(row.updated_at ?? row.completed_at, serverTime);
    const record: CachedQuestRecord = {
      id: `daily:${row.id}`,
      questKind: "daily",
      questDate: todayStr,
      weekStart: null,
      weekEnd: null,
      type: String(row.type ?? ""),
      title: String(row.title ?? ""),
      progress: Number(row.progress ?? 0) || 0,
      target: Number(row.target ?? 1) || 1,
      status: String(row.status ?? "active"),
      completedAt: row.completed_at ? toIso(row.completed_at, updatedAt) : null,
      rewardRyumo: Number(row.reward_ryumo ?? 0) || 0,
      rewardSeasonXp: Number(row.reward_season_xp ?? 0) || 0,
      updated_at: updatedAt,
      version: toVersion(updatedAt),
    };
    const existing = dailyByType.get(record.type);
    if (!existing || record.version > existing.version) {
      dailyByType.set(record.type, record);
    }
  }

  records.push(...dailyByType.values());
  for (const row of toRows<Record<string, unknown>>(weeklyResult)) {
    const updatedAt = toIso(row.updated_at ?? row.completed_at, serverTime);
    records.push({
      id: `weekly:${row.id}`,
      questKind: "weekly",
      questDate: null,
      weekStart: week.start,
      weekEnd: week.end,
      type: String(row.type ?? ""),
      title: String(row.title ?? ""),
      progress: Number(row.progress ?? 0) || 0,
      target: Number(row.target ?? 1) || 1,
      status: String(row.status ?? "active"),
      completedAt: row.completed_at ? toIso(row.completed_at, updatedAt) : null,
      rewardRyumo: Number(row.reward_ryumo ?? 0) || 0,
      rewardSeasonXp: Number(row.reward_season_xp ?? 0) || 0,
      updated_at: updatedAt,
      version: toVersion(updatedAt),
    });
  }
  return records;
}

export async function buildMobileActionResultForUser(
  username: string,
  options?: { levelEvent?: MobileLevelEvent | null }
): Promise<MobileActionResult> {
  const sql = getSql();
  if (!sql) {
    return {
      levelEvent: options?.levelEvent ?? null,
      backgroundSync: true,
    };
  }

  await warmUpConnection();
  const serverTime = new Date().toISOString();
  const [profilePatch, quests] = await Promise.all([
    getProfilePatch(username, serverTime),
    getQuestPatch(username, serverTime),
  ]);

  return {
    localPatch: {
      profile: profilePatch.profile,
      progress: profilePatch.progress,
      wallet: profilePatch.wallet,
      quests,
    },
    levelEvent: options?.levelEvent ?? null,
    backgroundSync: true,
  };
}
