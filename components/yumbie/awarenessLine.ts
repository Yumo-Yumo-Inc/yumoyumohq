/**
 * awarenessLine — converts the grounded awareness model into SOFT, directional,
 * non-judgmental text ("went up a bit", "calmer" — never "exceeded limit / 23.4%").
 * The soft-cap suggestion adds a 10% headroom margin to the recent average and
 * rounds it friendly; deliberately not exact/strict, to avoid budget-backlash effects.
 */
import type { YumbieAwareness } from "./useYumbieInsight";

interface I18n {
  t: (key: string, params?: Record<string, string | number>) => string;
}

export function composeAwarenessLine(a: YumbieAwareness, { t }: I18n): string {
  if (a.direction === "up") return t(`yumbie.insight.up.${a.magnitude}`, { label: a.label });
  if (a.direction === "down") return t("yumbie.insight.down", { label: a.label });
  return t("yumbie.insight.flat", { label: a.label });
}

export function roundFriendly(v: number): number {
  if (v <= 0) return 0;
  const mag = Math.pow(10, Math.floor(Math.log10(v)));
  const step = mag >= 1000 ? 500 : mag >= 100 ? 100 : 50;
  return Math.ceil(v / step) * step;
}

/** Generous, not strict: recent average + 10% headroom margin, rounded friendly. */
export function suggestSoftCap(avg: number): number {
  return roundFriendly(avg * 1.1);
}

/** Coarse (generous) step for the stepper — no cent-level precision. */
export function capStep(value: number): number {
  if (value >= 5000) return 500;
  if (value >= 1000) return 250;
  return 100;
}
