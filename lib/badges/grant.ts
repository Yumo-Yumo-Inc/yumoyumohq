/**
 * Badge granting — idempotent award of a catalog badge to a user.
 *
 * Badges are looked up by stable `key` (config/seasons.ts and future catalogs).
 * If the catalog row is not seeded yet, grant() no-ops gracefully so the season
 * lifecycle can ship before badge content is finalized ("uydurma yok": we don't
 * fabricate badge titles — they are seeded when approved).
 *
 * Idempotency is enforced by the UNIQUE(username, badge_id) constraint on
 * user_badges (migration 015), so repeated calls (e.g. a season re-close) never
 * double-award.
 */

import { sql } from "@/lib/db/client";

export type GrantResult = {
  /** true only when a NEW row was inserted this call. */
  granted: boolean;
  /** present when nothing was granted: 'db_unavailable' | 'badge_not_found' | 'already_owned'. */
  reason?: string;
};

export async function grantBadge(username: string, badgeKey: string): Promise<GrantResult> {
  if (!sql) return { granted: false, reason: "db_unavailable" };

  const badgeRows = await sql`SELECT id FROM badges WHERE key = ${badgeKey} LIMIT 1`;
  const badgeId = (badgeRows as Array<{ id: number }>)[0]?.id;
  if (!badgeId) {
    // Catalog not seeded yet — caller decides whether this is expected.
    return { granted: false, reason: "badge_not_found" };
  }

  const inserted = await sql`
    INSERT INTO user_badges (username, badge_id)
    VALUES (${username}, ${badgeId})
    ON CONFLICT (username, badge_id) DO NOTHING
    RETURNING id
  `;
  const granted = (inserted as unknown[]).length > 0;

  // TODO(season): on `granted`, enqueue a notification + optional reward hook.
  // Kept out of the skeleton so granting stays side-effect-light and testable.

  return granted ? { granted: true } : { granted: false, reason: "already_owned" };
}
