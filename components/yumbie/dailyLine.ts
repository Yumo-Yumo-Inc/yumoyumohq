/**
 * composeDailyLine (Phase 3) — converts grounded daily figures into ONE short,
 * plain sentence. Priority: monthly fresh start (with cap win) > gentle lapse
 * framing > streak milestone > concrete "yesterday" summary > streak > top
 * category > greeting. A number that isn't available is never spoken; falls
 * back to a neutral greeting when there's no data.
 */
import type { YumbieSource } from "./useYumbieSource";

interface I18n {
  t: (key: string, params?: Record<string, string | number>) => string;
}

export function composeDailyLine(src: YumbieSource, { t }: I18n): string {
  // Monthly fresh start (highest priority — fresh-start effect)
  if (src.newMonth) {
    if (src.lastMonthCapWin) return t("yumbie.daily.newMonthCapWin", { label: src.lastMonthCapWin });
    return src.lastMonthTopLabel
      ? t("yumbie.daily.newMonth", { label: src.lastMonthTopLabel })
      : t("yumbie.daily.newMonthNoCat");
  }

  // Lapse — gentle "your progress is on hold" framing (NEVER shame)
  if (src.streakLapsed) {
    return t("yumbie.daily.streakLapsed");
  }

  // Streak milestone (celebration)
  if (src.streakMilestone && src.streakMilestone > 0) {
    return t("yumbie.daily.streakMilestone", { days: src.streakMilestone });
  }

  // Concrete "yesterday" summary
  if (src.yesterdayReceipts && src.yesterdayReceipts > 0) {
    if (src.yesterdayPoints && src.yesterdayPoints > 0) {
      return t("yumbie.daily.yesterdayReceiptsPoints", {
        receipts: src.yesterdayReceipts,
        points: src.yesterdayPoints,
      });
    }
    return t("yumbie.daily.yesterdayReceipts", { receipts: src.yesterdayReceipts });
  }

  if (src.streak && src.streak >= 2) {
    return t("yumbie.daily.streak", { days: src.streak });
  }
  if (src.categories && src.categories.length > 0) {
    return t("yumbie.daily.topCategory", { label: src.categories[0].label });
  }
  return t("yumbie.chat.greeting");
}
