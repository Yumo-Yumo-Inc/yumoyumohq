/**
 * Shared contribution point (cPoints) configuration.
 *
 * Quests grant cPoints derived from their season XP reward. This rate is the
 * single source of truth shared by:
 *   • lib/quests/reward-dispatcher.ts        (real-time award on quest complete)
 *   • scripts/backfill-contribution-points.ts (historical backfill)
 *   • the quest UI                            (displayed cPoints reward)
 *
 * Keeping it here (no server-only imports) lets both client and server use it.
 */
export const QUEST_XP_TO_POINT_RATE = 0.2;

/** cPoints a quest grants for a given season XP reward, rounded to 2 decimals. */
export function questXpToCPoints(rewardSeasonXp: number): number {
  const value = (Number(rewardSeasonXp) || 0) * QUEST_XP_TO_POINT_RATE;
  return Math.round(value * 100) / 100;
}
