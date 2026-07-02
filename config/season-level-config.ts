/**
 * Season level: XP thresholds and Level Catalyzer (rYUMO multiplier).
 * season_xp resets each season; level determines reward multiplier.
 *
 * Level Catalyzer: her 3 levelde +0.01 (1 puan).
 *   multiplier = 1.0 + floor(level / 3) * 0.01
 *   Lv 1-2: 1.00, Lv 3-5: 1.01, Lv 6-8: 1.02, ... Lv 30: 1.10, Lv 60: 1.20
 */

export const SEASON_LEVEL_XP_THRESHOLDS: number[] = [
  0, 100, 250, 450, 700, 1000, 1350, 1750, 2200, 2700, 3250, 3850, 4500, 5200, 5950, 6750, 7600, 8500, 9450, 10450, 11500, 12600, 13750, 14950, 16200, 17500, 18850, 20250, 21700, 23200,
];

/** Level Catalyzer by season level (rYUMO formula). Her 3 levelde +0.01. */
export function getSeasonLevelMultiplier(seasonLevel: number): number {
  if (seasonLevel <= 0) return 1.0;
  return 1.0 + Math.floor(seasonLevel / 3) * 0.01;
}

export function getSeasonLevelFromXp(seasonXp: number): number {
  let level = 1;
  for (let i = 1; i < SEASON_LEVEL_XP_THRESHOLDS.length; i++) {
    if (seasonXp >= SEASON_LEVEL_XP_THRESHOLDS[i]) level = i + 1;
    else break;
  }
  return level;
}
