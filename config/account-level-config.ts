/**
 * Account level: XP thresholds and milestone levels (Master v4).
 * account_xp is cumulative; level is derived from first threshold >= account_xp.
 */

export const ACCOUNT_LEVEL_XP_THRESHOLDS: number[] = [
  0, 150, 350, 600, 900, 1300, 1800, 2400, 3100, 3900, 4800, 5800, 6900, 8100, 9400, 10800, 12300, 13900, 15600, 17400,
  19300, 21300, 23400, 25600, 27900, 30300, 32800, 35400, 38100, 40900,
  // L31–50 (karar 2026-07-02): endgame stretch — the per-level gap grows by
  // +200 each level (3000 → 6800) so upper levels fill slower.
  43900, 47100, 50500, 54100, 57900, 61900, 66100, 70500, 75100, 79900,
  84900, 90100, 95500, 101100, 106900, 112900, 119100, 125500, 132100, 138900,
];

export const ACCOUNT_LEVEL_MAX = ACCOUNT_LEVEL_XP_THRESHOLDS.length;

/** Milestone levels (every 5): trigger surprise challenge check. */
export const MILESTONE_LEVELS = [5, 10, 15, 20, 25, 30, 35, 40, 45, 50] as const;

export function getAccountLevelFromXp(accountXp: number): number {
  let level = 1;
  for (let i = 1; i < ACCOUNT_LEVEL_XP_THRESHOLDS.length; i++) {
    if (accountXp >= ACCOUNT_LEVEL_XP_THRESHOLDS[i]) level = i + 1;
    else break;
  }
  return level;
}

export function isMilestoneLevel(level: number): boolean {
  return (MILESTONE_LEVELS as readonly number[]).includes(level);
}
