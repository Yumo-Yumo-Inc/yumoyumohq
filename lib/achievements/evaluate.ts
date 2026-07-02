/**
 * Achievement evaluation — compute a user's metrics and grant any newly-earned
 * tier badges. Idempotent (grantBadge is ON CONFLICT DO NOTHING), so calling this
 * after any meaningful event (receipt verified, level-up, referral) is safe and
 * recomputes every track — no per-event bookkeeping needed.
 *
 * Defensive by design: never throws. The receipt pipeline calls this as a
 * side-effect; a failure here must not fail receipt processing.
 */

import { ACHIEVEMENT_TRACKS, earnedTiers } from "@/config/achievements";
import { computeAchievementMetrics } from "@/lib/achievements/metrics";
import { grantBadge } from "@/lib/badges/grant";

export type AchievementEvalResult = {
  /** Badge keys newly granted this call (empty if nothing new or on failure). */
  newlyGranted: string[];
};

export async function evaluateAchievements(username: string): Promise<AchievementEvalResult> {
  const newlyGranted: string[] = [];
  if (!username) return { newlyGranted };

  try {
    const metrics = await computeAchievementMetrics(username);

    for (const track of ACHIEVEMENT_TRACKS) {
      const value = metrics[track.metric] ?? 0;
      for (const tier of earnedTiers(track, value)) {
        try {
          const res = await grantBadge(username, tier.key);
          if (res.granted) newlyGranted.push(tier.key);
        } catch (err) {
          console.error(`[achievements] grant ${tier.key} failed for ${username}:`, err);
        }
      }
    }
  } catch (err) {
    console.error(`[achievements] evaluate failed for ${username}:`, err);
  }

  return { newlyGranted };
}
