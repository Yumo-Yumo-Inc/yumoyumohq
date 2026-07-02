/** Previous calendar day as YYYY-MM-DD (UTC date arithmetic on date-only strings). */
export function previousDateString(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() - 1);
  return dt.toISOString().slice(0, 10);
}

/**
 * Consecutive check-in days ending today or yesterday (if today not yet checked in).
 * A gap of one calendar day resets the visible streak on the next check-in.
 */
export function calculateConsecutiveStreak(
  dates: Set<string>,
  todayStr: string
): number {
  if (dates.has(todayStr)) {
    let streak = 0;
    let cursor = todayStr;
    while (dates.has(cursor)) {
      streak += 1;
      cursor = previousDateString(cursor);
    }
    return streak;
  }

  const yesterdayStr = previousDateString(todayStr);
  if (!dates.has(yesterdayStr)) return 0;

  let streak = 0;
  let cursor = yesterdayStr;
  while (dates.has(cursor)) {
    streak += 1;
    cursor = previousDateString(cursor);
  }
  return streak;
}

/** Filled segments in the 7-slot streak bar (1–7 scale, day 8+ shows one filled slot). */
export function getStreakBarFilledCount(streak: number): number {
  if (streak <= 0) return 0;
  if (streak >= 8) return 1;
  return streak;
}
