/**
 * Season level: XP thresholds and Level Catalyzer (cPoints multiplier).
 * season_xp resets each season; level feeds the reward multiplier.
 *
 * Level Catalyzer: +0.01 every 3 season levels, capped at +0.10 (karar 2026-07-02).
 *   multiplier = 1.0 + min(0.10, floor(level / 3) * 0.01)
 *   Lv 1-2: 1.00, Lv 3-5: 1.01, … Lv 30+: 1.10 (season cap)
 *
 * Combined ceiling with the account ladder is 1.30 — see
 * getCombinedRewardMultiplier below.
 */

export const SEASON_LEVEL_XP_THRESHOLDS: number[] = [
  0, 100, 250, 450, 700, 1000, 1350, 1750, 2200, 2700, 3250, 3850, 4500, 5200, 5950, 6750, 7600, 8500, 9450, 10450, 11500, 12600, 13750, 14950, 16200, 17500, 18850, 20250, 21700, 23200,
];

/** Season part of the Level Catalyzer: +0.01 per 3 levels, capped at +0.10. */
export function getSeasonLevelMultiplier(seasonLevel: number): number {
  if (seasonLevel <= 0) return 1.0;
  return 1.0 + Math.min(0.10, Math.floor(seasonLevel / 3) * 0.01);
}

/**
 * Account-ladder bonus steps (karar 2026-07-02 §3.5):
 * Lv10 +0.05 · Lv20 +0.05 · Lv35 +0.10. Season part caps at +0.10, so the
 * combined multiplier ceiling is 1.30.
 */
export function getAccountLevelMultiplierBonus(accountLevel: number): number {
  let bonus = 0;
  if (accountLevel >= 10) bonus += 0.05;
  if (accountLevel >= 20) bonus += 0.05;
  if (accountLevel >= 35) bonus += 0.10;
  return bonus;
}

/**
 * Combined reward multiplier applied to cPoints (real emission effect,
 * karar 2026-07-02 §4.4). Ceiling 1.30.
 */
export function getCombinedRewardMultiplier(accountLevel: number, seasonLevel: number): number {
  const combined =
    getSeasonLevelMultiplier(seasonLevel) + getAccountLevelMultiplierBonus(accountLevel);
  return Math.round(Math.min(1.30, combined) * 100) / 100;
}

export function getSeasonLevelFromXp(seasonXp: number): number {
  let level = 1;
  for (let i = 1; i < SEASON_LEVEL_XP_THRESHOLDS.length; i++) {
    if (seasonXp >= SEASON_LEVEL_XP_THRESHOLDS[i]) level = i + 1;
    else break;
  }
  return level;
}
