/**
 * buildWeeklyTourBeats — builds the weekly tour's beat sequence from REAL weekly
 * data. Only adds a beat when data exists (no fabrication). Yumbie visits home,
 * then the chart board (top category + %), then the wallet (weekly earnings),
 * then the streak, in order. All text is localized via i18n keys (yumbie.review.*).
 */
import type { YumbieSource } from "./useYumbieSource";
import type { TourBeat } from "./useYumbieTour";

interface I18n {
  t: (key: string, params?: Record<string, string | number>) => string;
}

export function buildWeeklyTourBeats(src: YumbieSource, { t }: I18n): TourBeat[] {
  const beats: TourBeat[] = [];

  beats.push({ scene: "today", line: t("yumbie.review.intro"), holdMs: 2800 });

  const top = src.categories?.[0];
  if (top) {
    beats.push({
      scene: "patterns",
      line: t("yumbie.review.topCategory", {
        label: top.label,
        pct: Math.round(top.ratio * 100),
      }),
      holdMs: 4200,
    });
  }

  if (src.weekPointsEarned && src.weekPointsEarned > 0) {
    beats.push({
      scene: "wallet",
      line: t("yumbie.review.weekPoints", { points: src.weekPointsEarned }),
      holdMs: 3800,
    });
  }

  if (src.streak && src.streak >= 2) {
    beats.push({
      scene: "today",
      line: t("yumbie.review.streak", { days: src.streak }),
      holdMs: 3400,
    });
  }

  beats.push({ scene: "today", line: t("yumbie.review.closing"), holdMs: 3000 });
  return beats;
}
