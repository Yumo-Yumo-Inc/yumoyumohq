/**
 * walletTier — converts a real cPoints balance into a milestone tier and the
 * progress within that tier as [0,1]. The wallet doesn't count absolute coins
 * (doesn't scale past 20K); it honestly shows progress toward the next goal.
 * LADDER is a product decision — adjust as needed.
 */
const LADDER = [0, 100, 250, 500, 1000, 2500, 5000, 10000, 25000, 50000, 100000];

export interface TierInfo {
  lo: number;
  hi: number;
  progress: number; // [0,1] progress within the tier
  remaining: number; // cPoints remaining to the next goal
}

export function tierInfo(cPoints: number): TierInfo {
  let lo = 0;
  let hi = LADDER[LADDER.length - 1];

  if (cPoints >= LADDER[LADDER.length - 1]) {
    lo = LADDER[LADDER.length - 1];
    hi = lo * 2; // above the ceiling: keep going by doubling the tier
  } else {
    for (let i = 0; i < LADDER.length - 1; i++) {
      if (cPoints >= LADDER[i] && cPoints < LADDER[i + 1]) {
        lo = LADDER[i];
        hi = LADDER[i + 1];
        break;
      }
    }
  }

  const span = hi - lo;
  const progress = span > 0 ? Math.max(0, Math.min(1, (cPoints - lo) / span)) : 1;
  return { lo, hi, progress, remaining: Math.max(0, Math.round(hi - cPoints)) };
}
