"use client";

/**
 * yumbieRhythm — small localStorage-backed "fire once per period" helpers for the
 * proactive Yumbie moments: the weekly recap (once per ISO week), the monthly
 * fresh-start (once per calendar month), and streak milestones (once per crossed
 * threshold). All checks degrade to "not due" if storage is unavailable, so
 * nothing is fabricated and nothing fires twice.
 */

const KEY = (k: string) => `yumbie:${k}`;

function read(k: string): string | null {
  try {
    return window.localStorage.getItem(KEY(k));
  } catch {
    return null;
  }
}
function write(k: string, v: string): void {
  try {
    window.localStorage.setItem(KEY(k), v);
  } catch {
    /* ignore */
  }
}

/** ISO-8601 week key, e.g. "2026-W26" (UTC). */
export function isoWeekKey(d: Date = new Date()): string {
  const date = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const dayNum = (date.getUTCDay() + 6) % 7; // Mon=0..Sun=6
  date.setUTCDate(date.getUTCDate() - dayNum + 3); // Thursday of this week
  const firstThursday = new Date(Date.UTC(date.getUTCFullYear(), 0, 4));
  const week =
    1 +
    Math.round(
      ((date.getTime() - firstThursday.getTime()) / 86_400_000 - 3 + ((firstThursday.getUTCDay() + 6) % 7)) / 7
    );
  return `${date.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

export function monthKey(d: Date = new Date()): string {
  return d.toISOString().slice(0, 7); // YYYY-MM
}

// ── Weekly recap ──────────────────────────────────────────────────────
export function isReviewDue(): boolean {
  return read("reviewWeek") !== isoWeekKey();
}
export function markReviewed(): void {
  write("reviewWeek", isoWeekKey());
}

// ── Daily "spoke once" gate — Yumbie says everything on the first dashboard
//    entry of the day, then stays silent for the rest of that day (user rule).
//    Local calendar day so the boundary matches what the user experiences.
export function localDayKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}
/** True if Yumbie already gave its once-a-day presentation today. */
export function hasSpokenToday(): boolean {
  return read("spokeDay") === localDayKey();
}
/** Record that Yumbie spoke today → silent for the rest of the day. */
export function markSpokenToday(): void {
  write("spokeDay", localDayKey());
}

// ── Monthly fresh-start ───────────────────────────────────────────────
export function isNewMonth(): boolean {
  return read("monthSeen") !== monthKey();
}
export function markMonthSeen(): void {
  write("monthSeen", monthKey());
}

// ── Streak milestones ─────────────────────────────────────────────────
const STREAK_MILESTONES = [7, 14, 30, 60, 100, 180, 365];
/** Returns the milestone value if the streak just hit one (not yet celebrated). */
export function dueStreakMilestone(streak: number | null): number | null {
  if (!streak || !STREAK_MILESTONES.includes(streak)) return null;
  if (read("streakMilestone") === String(streak)) return null;
  return streak;
}
export function markStreakMilestone(m: number): void {
  write("streakMilestone", String(m));
}

// ── Streak lapse (Phase 3) ────────────────────────────────────────────
/** True if the streak dropped since we last saw it (a gentle lapse). */
export function streakLapsedSince(current: number | null): boolean {
  const prev = Number(read("lastStreak") ?? "");
  return Number.isFinite(prev) && prev >= 2 && (current ?? 0) < prev;
}
export function rememberStreak(current: number | null): void {
  if (typeof current === "number") write("lastStreak", String(current));
}

// ── Soft caps (Phase 3) — user-set, device-local (server sync is a later step) ──
export function loadCaps(): Record<string, number> {
  try {
    const raw = read("softCaps");
    const o = raw ? (JSON.parse(raw) as Record<string, number>) : {};
    return o && typeof o === "object" ? o : {};
  } catch {
    return {};
  }
}
export function saveCap(categoryKey: string, amount: number): void {
  const caps = loadCaps();
  caps[categoryKey] = amount;
  write("softCaps", JSON.stringify(caps));
}
/** Mirror the server's caps into localStorage (offline source of truth). */
export function saveAllCaps(caps: Record<string, number>): void {
  write("softCaps", JSON.stringify(caps));
}

// ── Awareness "seen" (Phase 3) — so the insight pill doesn't re-pop ───────
export function isInsightSeen(id: string): boolean {
  try {
    const raw = read("insightSeen");
    const set = raw ? (JSON.parse(raw) as string[]) : [];
    return Array.isArray(set) && set.includes(id);
  } catch {
    return false;
  }
}
export function markInsightSeenId(id: string): void {
  try {
    const raw = read("insightSeen");
    const set = raw ? (JSON.parse(raw) as string[]) : [];
    if (!set.includes(id)) set.push(id);
    write("insightSeen", JSON.stringify(set.slice(-20)));
  } catch {
    /* ignore */
  }
}
