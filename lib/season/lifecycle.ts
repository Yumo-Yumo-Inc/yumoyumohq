/**
 * Season lifecycle — open / close / rollover for the gamification season layer.
 *
 * Design decisions (per the product decision, 2026-06-29):
 *  - Manual start: the founder opens a season; cron only CLOSES (no auto-open).
 *  - 4-week cadence; the next season is started manually after close.
 *  - Tier reward = cPoints (pre-TGE there is no token), credited at season close
 *    as a single row in the EXISTING contribution ledger
 *    (contribution_point_events, source_type='season_tier_bonus'). After TGE the
 *    reward-epoch engine sweeps that ledger into claimable bINT/INT. No parallel source.
 *  - Idempotent throughout: re-running close never double-credits.
 *
 * ⚠️ Tier cPoints amounts are DRAFT (config/seasons.ts). Finalize before the first
 * real production close.
 *
 * SEASON NUMBER ALIGNMENT (operational): the receipt/quest XP writers still read
 * the season number from env CURRENT_SEASON_NUMBER (lib/oracle/account-season-level.ts).
 * When opening Genesis (season 2), set CURRENT_SEASON_NUMBER=2 on Vercel so XP
 * events are tagged with the active season. getActiveSeasonNumber() below is the
 * DB-driven canonical reader the new code uses; aligning the legacy writers onto
 * it is a tracked follow-up.
 */

import { sql } from "@/lib/db/client";
import { getSeasonConfig, getTierForXp, type SeasonConfig } from "@/config/seasons";
import { grantBadge } from "@/lib/badges/grant";

export type SeasonRow = {
  id: number;
  season_number: number;
  name: string;
  start_at: string;
  end_at: string;
  status: string;
  closed_at: string | null;
};

/** The currently active season (status='active'), or null. */
export async function getActiveSeason(): Promise<SeasonRow | null> {
  if (!sql) return null;
  const rows = await sql`
    SELECT id, season_number, name, start_at, end_at, status, closed_at
    FROM seasons
    WHERE status = 'active'
    ORDER BY season_number DESC
    LIMIT 1
  `;
  return (rows as SeasonRow[])[0] ?? null;
}

/** Canonical active season number (DB-driven). Null when no season is running. */
export async function getActiveSeasonNumber(): Promise<number | null> {
  const season = await getActiveSeason();
  return season ? Number(season.season_number) : null;
}

/**
 * Eligibility gate for a season tier reward. Anti-Sybil parameters (trust floor,
 * distinct-day / distinct-merchant minimums) are deliberately not encoded here:
 * this mechanism exists, but specific parameters are calibrated in production
 * and not published (per the product decision). Skeleton returns true; wire
 * the real gate before launch.
 */
async function isEligibleForSeasonReward(_username: string): Promise<boolean> {
  // TODO(anti-sybil): trust-score production floor + min distinct-day/merchant.
  return true;
}

/**
 * Open a new season. Refuses if one is already active (close it first). Resets
 * everyone's season XP/level to a clean slate and stamps current_season_number.
 */
export async function openSeason(opts: {
  seasonNumber: number;
  name: string;
  startAt?: Date;
  durationDays?: number;
}): Promise<{ ok: boolean; error?: string; season?: SeasonRow }> {
  if (!sql) return { ok: false, error: "db_unavailable" };

  const active = await getActiveSeason();
  if (active) {
    return { ok: false, error: `season ${active.season_number} still active — close it first` };
  }

  const start = opts.startAt ?? new Date();
  const durationDays = opts.durationDays ?? 28;
  const end = new Date(start.getTime() + durationDays * 24 * 60 * 60 * 1000);

  const inserted = await sql`
    INSERT INTO seasons (season_number, name, start_at, end_at, status, created_at)
    VALUES (${opts.seasonNumber}, ${opts.name}, ${start.toISOString()}, ${end.toISOString()}, 'active', now())
    ON CONFLICT (season_number) DO UPDATE SET
      name = EXCLUDED.name,
      start_at = EXCLUDED.start_at,
      end_at = EXCLUDED.end_at,
      status = 'active',
      closed_at = NULL
    RETURNING id, season_number, name, start_at, end_at, status, closed_at
  `;
  const season = (inserted as SeasonRow[])[0];

  // Fresh slate for the new season.
  await sql`
    UPDATE user_profiles
    SET season_xp = 0, season_level = 1, current_season_number = ${opts.seasonNumber}, updated_at = now()
    WHERE COALESCE(season_xp, 0) <> 0 OR COALESCE(current_season_number, 0) <> ${opts.seasonNumber}
  `;

  return { ok: true, season };
}

/**
 * Close a season: snapshot the leaderboard, award tiers (cPoints credit + tier
 * record + badges), then reset season XP. Idempotent — safe to re-run.
 * No auto-open of the next season (manual start).
 */
export async function closeSeason(
  seasonNumber: number,
): Promise<{ ok: boolean; awarded: number; error?: string }> {
  if (!sql) return { ok: false, awarded: 0, error: "db_unavailable" };

  const seasonRows = await sql`
    SELECT id, season_number, name, start_at, end_at, status, closed_at
    FROM seasons WHERE season_number = ${seasonNumber} LIMIT 1
  `;
  const season = (seasonRows as SeasonRow[])[0];
  if (!season) return { ok: false, awarded: 0, error: "season_not_found" };
  if (season.status === "closed") return { ok: true, awarded: 0 }; // idempotent no-op

  const config: SeasonConfig | null = getSeasonConfig(seasonNumber);

  // All participants (any season XP this season).
  const participants = (await sql`
    SELECT username, COALESCE(season_xp, 0)::int AS season_xp
    FROM user_profiles
    WHERE COALESCE(season_xp, 0) > 0
  `) as Array<{ username: string; season_xp: number }>;

  // 1) Leaderboard snapshot (rank by season XP desc). Always taken, even for a
  //    config-less season (e.g. legacy Trial) so the history is preserved.
  const ranked = [...participants].sort((a, b) => b.season_xp - a.season_xp);
  for (let i = 0; i < ranked.length; i++) {
    const p = ranked[i];
    await sql`
      INSERT INTO season_leaderboard (season_id, username, quest_xp, total_score, rank, created_at)
      VALUES (${season.id}, ${p.username}, ${p.season_xp}, ${p.season_xp}, ${i + 1}, now())
      ON CONFLICT (season_id, username) DO UPDATE SET
        quest_xp = EXCLUDED.quest_xp,
        total_score = EXCLUDED.total_score,
        rank = EXCLUDED.rank
    `;
  }

  // 2) Tier awards (only when this season has a tier config).
  let awarded = 0;
  if (config) {
    const reference = String(seasonNumber); // one credit per user per season
    for (const p of participants) {
      const tier = getTierForXp(config, p.season_xp);
      if (!tier) continue;
      if (!(await isEligibleForSeasonReward(p.username))) continue;

      // cPoints credit into the single ledger — post-TGE the epoch engine sweeps it to bINT/INT.
      await sql`
        INSERT INTO contribution_point_events (
          username, points_delta, source_type, reference_id, season_number, metadata, contribution_version
        )
        VALUES (
          ${p.username}, ${tier.cpointsReward}, 'season_tier_bonus', ${reference}, ${seasonNumber},
          ${JSON.stringify({ tier: tier.key, tierIndex: tier.index, seasonXp: p.season_xp })}::jsonb, 1
        )
        ON CONFLICT (username, source_type, reference_id) DO NOTHING
      `;

      // Gamification record of the tier reached.
      await sql`
        INSERT INTO season_tier_awards (
          season_number, username, tier_index, tier_key, season_xp_final, cpoints_amount, credit_reference
        )
        VALUES (${seasonNumber}, ${p.username}, ${tier.index}, ${tier.key}, ${p.season_xp}, ${tier.cpointsReward}, ${reference})
        ON CONFLICT (season_number, username) DO NOTHING
      `;

      // Tier badge + participation badge (no-op until catalog is seeded).
      await grantBadge(p.username, tier.badgeKey);
      await grantBadge(p.username, config.participationBadgeKey);
      awarded++;
    }
  }

  // 3) Close + reset season XP for the next cycle.
  await sql`UPDATE seasons SET status = 'closed', closed_at = now() WHERE season_number = ${seasonNumber}`;
  await sql`
    UPDATE user_profiles
    SET season_xp = 0, season_level = 1, updated_at = now()
    WHERE COALESCE(season_xp, 0) <> 0
  `;

  return { ok: true, awarded };
}

/**
 * Cron entrypoint: close any active season whose end_at has passed. Does NOT
 * open the next season — that is a manual founder action.
 */
export async function rolloverIfDue(): Promise<{ closed: number[]; note: string }> {
  if (!sql) return { closed: [], note: "db_unavailable" };

  const due = (await sql`
    SELECT season_number FROM seasons WHERE status = 'active' AND end_at <= now()
  `) as Array<{ season_number: number }>;

  const closed: number[] = [];
  for (const row of due) {
    const result = await closeSeason(Number(row.season_number));
    if (result.ok) closed.push(Number(row.season_number));
  }

  return {
    closed,
    note: closed.length
      ? `closed ${closed.join(", ")}; awaiting manual start of next season`
      : "nothing due",
  };
}
