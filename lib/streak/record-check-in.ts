import { isAdminUser } from "@/lib/auth/admin-users";
import { getSql } from "@/lib/db/client";
import { autoCompleteEligibleDailyQuests } from "@/lib/quests/auto-complete-daily";
import { ensureDailyQuestsForUser } from "@/lib/quests/daily-generator";
import { normalizeCountryCode } from "@/lib/shared/countries";
import { getUserCountry } from "@/lib/storage/user-country-storage";
import { calculateConsecutiveStreak } from "@/lib/streak/streak-math";
import { getLocalDateStringForCountry } from "@/lib/streak/timezone";

function toRows<T>(value: unknown): T[] {
  if (Array.isArray(value)) return value as T[];
  if (
    value &&
    typeof value === "object" &&
    "rows" in value &&
    Array.isArray((value as { rows?: unknown[] }).rows)
  ) {
    return ((value as { rows: unknown[] }).rows ?? []) as T[];
  }
  return [];
}

export type RecordCheckInResult = {
  streak: number;
  wasNew: boolean;
  todayStr: string;
  alreadyCheckedIn: boolean;
};

export async function resolveUserCountryCode(
  username: string,
  sql: NonNullable<ReturnType<typeof getSql>>,
  profileCountry?: string | null
): Promise<string | null> {
  const fromProfile = normalizeCountryCode(profileCountry);
  if (fromProfile) return fromProfile;
  const row = toRows<{ country: string | null }>(
    await sql`
      SELECT country FROM user_profiles WHERE username = ${username} LIMIT 1
    `
  )[0];
  const fromDb = normalizeCountryCode(row?.country);
  if (fromDb) return fromDb;
  return normalizeCountryCode(await getUserCountry(username));
}

export async function getUserLocalTodayStr(
  username: string,
  profileCountry?: string | null
): Promise<string> {
  const sql = getSql();
  if (!sql) {
    return new Date().toISOString().slice(0, 10);
  }
  const country = await resolveUserCountryCode(username, sql, profileCountry);
  return getLocalDateStringForCountry(country);
}

/**
 * Records a daily check-in when the user uploads a receipt (local calendar day).
 */
export async function recordUserCheckIn(
  username: string,
  options?: { profileCountry?: string | null; runQuestSideEffects?: boolean }
): Promise<RecordCheckInResult | null> {
  const sql = getSql();
  if (!sql) return null;

  const todayStr = await getUserLocalTodayStr(username, options?.profileCountry);
  const isAdmin = isAdminUser(username);
  const runQuestSideEffects = options?.runQuestSideEffects !== false;

  if (isAdmin) {
    await sql`
      DELETE FROM check_ins
      WHERE username = ${username} AND check_in_date = ${todayStr}::date
    `;
  }

  const insertResult = await sql`
    INSERT INTO check_ins (username, check_in_date)
    VALUES (${username}, ${todayStr}::date)
    ON CONFLICT (username, check_in_date) DO NOTHING
    RETURNING id
  `;
  const wasNew = toRows(insertResult).length > 0;

  const datesResult = await sql`
    SELECT DISTINCT check_in_date::text AS d
    FROM check_ins
    WHERE username = ${username}
    ORDER BY d DESC
    LIMIT 100
  `;
  const dates = new Set(
    toRows<{ d: string }>(datesResult).map((row) => row.d)
  );
  const streak = calculateConsecutiveStreak(dates, todayStr);

  try {
    await sql`
      UPDATE user_profiles
      SET streak = ${streak}, updated_at = now()
      WHERE username = ${username}
    `;
  } catch (err) {
    console.warn("[streak/record-check-in] user_profiles streak update failed:", err);
  }

  if (wasNew && runQuestSideEffects) {
    try {
      const seasonRow = await sql`
        SELECT season_number FROM seasons WHERE status = 'active' ORDER BY start_at DESC LIMIT 1
      `;
      const seasonNumber =
        (toRows<{ season_number?: number }>(seasonRow)[0] as { season_number?: number } | undefined)
          ?.season_number ?? 1;
      await ensureDailyQuestsForUser(username, todayStr, seasonNumber);
      await sql`
        UPDATE user_quests uq
        SET progress = 1, updated_at = now()
        FROM quest_templates qt
        WHERE uq.quest_template_id = qt.id
          AND uq.username = ${username}
          AND qt.type = 'D1'
          AND (uq.expires_at AT TIME ZONE 'UTC')::date = ${todayStr}::date
          AND uq.status = 'active'
      `;
      await autoCompleteEligibleDailyQuests(username, todayStr);
    } catch (d1Err) {
      console.warn("[streak/record-check-in] D1 progress update failed:", d1Err);
    }
  }

  return {
    streak,
    wasNew,
    todayStr,
    alreadyCheckedIn: !wasNew,
  };
}
