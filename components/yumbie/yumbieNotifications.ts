/**
 * yumbieNotifications — Yumbie-voiced notification COMPOSITION (delivery belongs
 * to the app's push infrastructure). Pure function: grounded context → single
 * best notification or null. Rules:
 *   • At most 1 meaningful notification per day (frequency cap).
 *   • Respects quiet hours + the user's active window (rhythm match).
 *   • VALUE-FIRST; NEVER guilt/urgency. No loss framing like "you'll lose your
 *     streak" (avoids Duolingo's anxiety trap).
 *   • On lapse, uses an ownership frame ("your progress is on hold"), not shame.
 * Copy is localized via the caller-supplied `t` (can also be called from the server).
 */
export type NotifyKind =
  | "monthFresh"
  | "streakLapse"
  | "insight"
  | "weeklyReview"
  | "dailyRecap"
  | "gentleReturn";

/**
 * Where a Yumbie notification should land when tapped. The `?yumbie=` intent is
 * consumed by <YumbieDeeplink/> on app open (opens the insight sheet / starts the
 * weekly tour). Used as the push payload's `data.url` (the service worker opens
 * it) and by any in-app delivery.
 */
export function notifyDeeplink(kind: NotifyKind): string {
  switch (kind) {
    case "insight":
      return "/app/dashboard?yumbie=insight";
    case "weeklyReview":
      return "/app/dashboard?yumbie=tour";
    case "gentleReturn":
      return "/app/patterns";
    default:
      return "/app/dashboard";
  }
}

export interface NotifyContext {
  now?: Date;
  activeWindow?: "morning" | "evening" | null;
  /** Timestamp of the last notification (ms) — for the frequency cap. */
  lastNotifiedAt?: number | null;
  newMonth?: boolean;
  streakLapsed?: boolean;
  awarenessReady?: boolean;
  weeklyReviewReady?: boolean;
  notCheckedInToday?: boolean;
  yesterdayReceipts?: number | null;
  topCategoryLabel?: string | null;
  lastMonthCapWin?: string | null;
}

export interface NotifyPayload {
  title: string;
  body: string;
  kind: NotifyKind;
}

interface I18n {
  t: (key: string, params?: Record<string, string | number>) => string;
}

function sameCalendarDay(a: number, b: number): boolean {
  const da = new Date(a);
  const db = new Date(b);
  return (
    da.getFullYear() === db.getFullYear() &&
    da.getMonth() === db.getMonth() &&
    da.getDate() === db.getDate()
  );
}

function inQuietHours(now: Date, window?: "morning" | "evening" | null): boolean {
  const h = now.getHours();
  if (h < 8 || h >= 22) return true; // quiet at night
  if (window === "morning" && h >= 12) return true;
  if (window === "evening" && h < 16) return true;
  return false;
}

export function pickNotification(ctx: NotifyContext, { t }: I18n): NotifyPayload | null {
  const now = ctx.now ?? new Date();

  // Frequency cap: at most 1 meaningful notification per day.
  if (ctx.lastNotifiedAt && sameCalendarDay(ctx.lastNotifiedAt, now.getTime())) return null;
  // Quiet hours / rhythm.
  if (inQuietHours(now, ctx.activeWindow ?? null)) return null;

  const title = t("yumbie.notify.title");
  const mk = (kind: NotifyKind, body: string): NotifyPayload => ({ title, body, kind });

  // Priority: value-first, never shame.
  if (ctx.newMonth) {
    return mk(
      "monthFresh",
      ctx.lastMonthCapWin
        ? t("yumbie.notify.monthFreshCapWin", { label: ctx.lastMonthCapWin })
        : t("yumbie.notify.monthFresh")
    );
  }
  if (ctx.streakLapsed) {
    return mk("streakLapse", t("yumbie.notify.streakLapse")); // ownership framing, not shame
  }
  if (ctx.awarenessReady) {
    return mk("insight", t("yumbie.notify.insight"));
  }
  if (ctx.weeklyReviewReady) {
    return mk("weeklyReview", t("yumbie.notify.weeklyReview"));
  }
  if (ctx.notCheckedInToday && ctx.yesterdayReceipts && ctx.yesterdayReceipts > 0) {
    return mk("dailyRecap", t("yumbie.notify.dailyRecap", { receipts: ctx.yesterdayReceipts }));
  }
  if (ctx.notCheckedInToday && ctx.topCategoryLabel) {
    // Value-first return invite — no LOSS framing.
    return mk("gentleReturn", t("yumbie.notify.gentleReturn", { label: ctx.topCategoryLabel }));
  }
  return null;
}
