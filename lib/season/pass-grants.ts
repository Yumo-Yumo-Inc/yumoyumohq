/**
 * Season pass cosmetic grants (karar 2026-07-09).
 *
 * Cosmetics are auto-granted (no claim gate) because they carry no economic
 * weight — the pass credits zero cPoints. `syncSeasonPassGrants` is an
 * idempotent catch-up: given a user's current season level it inserts a grant
 * row for every cosmetic node at or below that level, ON CONFLICT DO NOTHING. It
 * is safe to call from any path that raises the season level (receipt XP now;
 * quest XP later) — whichever observes the higher level reconciles the rest.
 */

import { sql } from "@/lib/db/client";
import { getSeasonConfig } from "@/config/seasons";
import { earnedSeasonCosmetics } from "@/config/season-cosmetics";

/**
 * Ensure the user owns every season-pass cosmetic their season level has earned.
 * Defensive: never throws, returns the count of NEW grants (0 when caught up).
 */
export async function syncSeasonPassGrants(
  username: string,
  seasonNumber: number,
  seasonLevel: number,
): Promise<number> {
  if (!sql) return 0;
  const config = getSeasonConfig(seasonNumber);
  if (!config) return 0;

  const earned = earnedSeasonCosmetics(config, seasonLevel);
  if (earned.length === 0) return 0;

  let granted = 0;
  for (const cosmetic of earned) {
    try {
      const inserted = await sql`
        INSERT INTO user_cosmetic_grants (username, cosmetic_key, kind, source, season_number)
        VALUES (${username}, ${cosmetic.key}, ${cosmetic.kind}, 'season_pass', ${seasonNumber})
        ON CONFLICT (username, cosmetic_key) DO NOTHING
        RETURNING id
      `;
      if ((inserted as unknown[]).length > 0) granted++;
    } catch {
      // A single failed grant must not break XP writing — skip and continue.
    }
  }
  return granted;
}

/**
 * Every season-pass cosmetic key a user owns — across ALL seasons, not just the
 * active one (karar 2026-07-14: "sezonda kazanılan ödüller sezon bitince
 * sıfırlanmaz, hep kalır"). Ownership is permanent: once a cosmetic is granted it
 * stays equippable in every future season. Cosmetic keys are season-prefixed
 * (`genesis_spark_sticker_l6`) so they never collide across seasons; the
 * `(username, cosmetic_key)` unique grant row is the sole ownership record.
 */
export async function getSeasonPassGrants(username: string): Promise<string[]> {
  if (!sql) return [];
  try {
    const rows = await sql`
      SELECT cosmetic_key FROM user_cosmetic_grants
      WHERE username = ${username} AND source = 'season_pass'
    `;
    return (rows as Array<{ cosmetic_key: string }>).map((r) => r.cosmetic_key);
  } catch {
    return [];
  }
}
