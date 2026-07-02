/**
 * User Honor update for receipt quality system
 * SERVER-ONLY: Do not import in client components
 */

import { sql, warmUpConnection } from "@/lib/db/client";
import { isDatabaseAvailable } from "./connection";

const HONOR_MIN = 0;
const HONOR_MAX = 100;
const HONOR_DEFAULT = 50;

/**
 * Update user's Honor by delta (atomic, clamped to 0-100).
 * No-op if DB unavailable or username empty. Inserts a profile row with default honor if missing (so first receipt upload counts).
 */
export async function updateUserHonor(username: string, delta: number): Promise<void> {
  if (!username?.trim()) return;
  if (!isDatabaseAvailable() || !sql) {
    console.log("[user-honor] Database not available, skipping Honor update");
    return;
  }
  // honor column is INTEGER; round delta to avoid invalid input syntax for type integer
  const deltaInt = Math.round(delta);
  try {
    await warmUpConnection();
    // Ensure row exists (insert with default honor if new user), then atomic update with clamp.
    await sql`
      INSERT INTO user_profiles (username, honor, updated_at)
      VALUES (${username.trim()}, ${HONOR_DEFAULT}, CURRENT_TIMESTAMP)
      ON CONFLICT (username) DO UPDATE SET
        honor = GREATEST(${HONOR_MIN}, LEAST(${HONOR_MAX}, COALESCE(user_profiles.honor, ${HONOR_DEFAULT}) + ${deltaInt})),
        updated_at = CURRENT_TIMESTAMP
    `;
  } catch (error: any) {
    console.error("[user-honor] updateUserHonor failed:", error?.message);
    throw error;
  }
}

/**
 * Get current Honor for a user. Returns default 50 if no profile or column missing.
 */
export async function getUserHonor(username: string): Promise<number> {
  if (!username?.trim()) return HONOR_DEFAULT;
  if (!isDatabaseAvailable() || !sql) return HONOR_DEFAULT;
  try {
    await warmUpConnection();
    const rows = await sql`
      SELECT COALESCE(honor, ${HONOR_DEFAULT}) as honor
      FROM user_profiles
      WHERE username = ${username.trim()}
    `;
    if (rows.length === 0) return HONOR_DEFAULT;
    const honor = Number((rows[0] as any).honor);
    return Number.isFinite(honor) ? Math.max(HONOR_MIN, Math.min(HONOR_MAX, honor)) : HONOR_DEFAULT;
  } catch {
    return HONOR_DEFAULT;
  }
}
