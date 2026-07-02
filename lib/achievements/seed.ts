/**
 * Achievement badge seeding — upsert catalog badges into the `badges` table.
 *
 * grantBadge (lib/badges/grant.ts) looks badges up by stable `key`; until a key
 * has a row, grants no-op. This upserts one row per catalog tier from
 * config/achievements.ts so the config stays the single source (no duplicated SQL
 * list to drift). Idempotent: ON CONFLICT (key) refreshes title/description.
 *
 * badges.title/description are the English canonical text (the table is English
 * per the i18n rule); localized display comes from the catalog (pickAchName).
 * Run once via POST /api/admin/achievements (admin-guarded), or re-run after a
 * catalog change to refresh text.
 */

import { sql } from "@/lib/db/client";
import { ACHIEVEMENT_TRACKS, tierDescription } from "@/config/achievements";

export async function ensureAchievementBadges(): Promise<{ upserted: number }> {
  if (!sql) return { upserted: 0 };

  let upserted = 0;
  for (const track of ACHIEVEMENT_TRACKS) {
    for (const tier of track.tiers) {
      const title = `${track.name.en} — ${tier.name.en}`;
      const description = tierDescription(track, tier).en;
      await sql`
        INSERT INTO badges (key, title, description, icon_url)
        VALUES (${tier.key}, ${title}, ${description}, NULL)
        ON CONFLICT (key) DO UPDATE SET
          title = EXCLUDED.title,
          description = EXCLUDED.description
      `;
      upserted++;
    }
  }
  return { upserted };
}
