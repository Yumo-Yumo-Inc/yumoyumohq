/**
 * Pure reminder scheduling math for service-provider bills. Kept free of any DB
 * or server-timezone dependency so it can be unit-tested and reasoned about: all
 * calendar values are computed against a caller-supplied timezone (default
 * Europe/Istanbul, the priority audience) instead of the Vercel runtime's UTC.
 *
 * A reminder fires when the current hour matches the provider's `reminderHour`
 * AND the whole-day distance to the next due date is one of `reminderDaysBefore`
 * (for upcoming reminders) or it is the due day and `reminderSameDay` is set.
 * Offsets of 0 in `reminderDaysBefore` are ignored — same-day is governed solely
 * by the `reminderSameDay` flag, matching the bills UI.
 */

export interface ReminderProvider {
  id: number;
  username: string;
  name: string;
  paymentDay: number;
  reminderDaysBefore: number[];
  reminderSameDay: boolean;
  reminderHour: number;
  expectedAmount: number | null;
}

export interface NowParts {
  year: number;
  /** 0-based, like Date#getMonth. */
  month: number;
  day: number;
  hour: number;
}

export interface DueReminder {
  provider: ReminderProvider;
  daysUntil: number;
  /** Next due date as YYYYMMDD — used to build a stable per-period scenario id. */
  dueYmd: string;
  sameDay: boolean;
}

export const DEFAULT_TZ = "Europe/Istanbul";

/** True when `tz` is a runtime-recognized IANA timezone (e.g. "Europe/Berlin"). */
export function isValidTimeZone(tz: unknown): tz is string {
  if (typeof tz !== "string" || tz.length === 0 || tz.length > 64) return false;
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

/** Resolve the wall-clock calendar parts of `date` in a given IANA timezone. */
export function nowPartsInTimezone(date: Date, timeZone: string = DEFAULT_TZ): NowParts {
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    hour12: false,
  });
  const parts = Object.fromEntries(fmt.formatToParts(date).map((p) => [p.type, p.value]));
  let hour = Number(parts.hour);
  if (hour === 24) hour = 0; // some runtimes emit "24" at midnight
  return {
    year: Number(parts.year),
    month: Number(parts.month) - 1,
    day: Number(parts.day),
    hour,
  };
}

function lastDayOfMonth(year: number, month: number): number {
  // Day 0 of month+1 is the last day of `month`. UTC keeps it timezone-neutral.
  return new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
}

/** Next occurrence of `paymentDay` on or after the given calendar day. */
export function nextDue(
  year: number,
  month: number,
  day: number,
  paymentDay: number,
): { year: number; month: number; day: number } {
  const lastThis = lastDayOfMonth(year, month);
  const dayThis = Math.min(paymentDay, lastThis);
  if (dayThis >= day) return { year, month, day: dayThis };
  const ny = month === 11 ? year + 1 : year;
  const nm = (month + 1) % 12;
  const lastNext = lastDayOfMonth(ny, nm);
  return { year: ny, month: nm, day: Math.min(paymentDay, lastNext) };
}

function daysBetween(
  a: { year: number; month: number; day: number },
  b: { year: number; month: number; day: number },
): number {
  return Math.round(
    (Date.UTC(b.year, b.month, b.day) - Date.UTC(a.year, a.month, a.day)) / 86_400_000,
  );
}

/** Returns the reminder to send for this provider right now, or null. */
export function reminderForProvider(provider: ReminderProvider, now: NowParts): DueReminder | null {
  if (now.hour !== provider.reminderHour) return null;

  const due = nextDue(now.year, now.month, now.day, provider.paymentDay);
  const daysUntil = daysBetween(now, due);

  const matchesOffset = daysUntil > 0 && provider.reminderDaysBefore.includes(daysUntil);
  const matchesSameDay = daysUntil === 0 && provider.reminderSameDay;
  if (!matchesOffset && !matchesSameDay) return null;

  const dueYmd = `${due.year}${String(due.month + 1).padStart(2, "0")}${String(due.day).padStart(2, "0")}`;
  return { provider, daysUntil, dueYmd, sameDay: matchesSameDay };
}

/** Stable id so the same reminder is never delivered twice for one due date. */
export function reminderScenarioId(reminder: DueReminder): string {
  return `bill-reminder-${reminder.provider.id}-${reminder.dueYmd}-d${reminder.daysUntil}`;
}
