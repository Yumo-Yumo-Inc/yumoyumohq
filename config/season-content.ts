/**
 * Display copy for season tiers and titles.
 *
 * Product decision, 2026-07-01. Colocated with the gamification catalog (same
 * pattern as config/achievements.ts inline names) so a season's copy ships with
 * a deploy. Keys mirror config/seasons.ts (tier.key, title.key). Non-tr/en
 * locales fall back to en (no fabricated translations).
 *
 * Fire ladder: Spark → Ember → Flame → Forge. Titles unlock at tier ≥ 2/3/4;
 * `genesis_founder` is the participation title (Genesis-exclusive).
 */

export type LocalizedLabel = { tr: string; en: string };

export const SEASON_TIER_LABELS: Record<string, LocalizedLabel> = {
  spark: { tr: "Kıvılcım", en: "Spark" },
  ember: { tr: "Kor", en: "Ember" },
  flame: { tr: "Alev", en: "Flame" },
  forge: { tr: "Ocak", en: "Forge" },
};

export const SEASON_TITLE_LABELS: Record<string, LocalizedLabel> = {
  genesis_founder: { tr: "Genesis Kurucusu", en: "Genesis Founder" },
  title_ember: { tr: "Kor Doğan", en: "Emberborn" },
  title_flame: { tr: "Alev Taşıyıcı", en: "Flamebearer" },
  title_forge: { tr: "Ocak Ustası", en: "Forgemaster" },
};

/** Pick a localized label with a safe fallback (never fabricates — returns the raw key). */
export function pickLabel(
  table: Record<string, LocalizedLabel>,
  key: string,
  locale: string,
): string {
  const entry = table[key];
  if (!entry) return key;
  return locale === "tr" ? entry.tr : entry.en;
}
