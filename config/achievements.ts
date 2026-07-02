/**
 * Achievement catalog — tiered progress tracks (off-chain motivation layer).
 *
 * SINGLE source of truth for Wave 1 achievements. An achievement TRACK is one
 * metric (e.g. distinct merchants) with an ascending ladder of named TIERS; each
 * tier is a badge granted once its threshold is met. This is the "tiered ladder"
 * model (one metric, many named levels), not one-off trivial badges.
 *
 * Design notes, per the product decision (2026-06-30):
 *  - Voice = "Şehir/Sokak" (urban/street).
 *  - 7 tracks, 31 tiers. Every metric is backed by real data (no fabricated counters).
 *  - Separate layer from season tiers (config/seasons.ts) — shares badges/grantBadge.
 *
 * Public tier thresholds here are cosmetic grind targets. They are deliberately
 * NOT the season reward-eligibility (anti-sybil) thresholds, which stay
 * unpublished. An achievement threshold must never equal an eligibility floor.
 *
 * Display names live inline (tr/en) so the catalog stays reviewable/tunable in one
 * place — matching the in-repo UserFacingText precedent (components/app/bottom-nav).
 * ru/th/es/zh fall back to en until translated (no fabricated translations).
 */

export type AchievementMetric =
  | "distinct_merchants"
  | "distinct_categories"
  | "best_streak"
  | "account_level"
  | "verified_receipts"
  | "hidden_cost_surfaced"
  | "successful_referrals";

/** A localized name; only the locales we have authored. Pick with en fallback. */
export type AchName = { tr: string; en: string };

export type AchievementTier = {
  /** 1-based rank within its track. */
  index: number;
  /** Globally unique badge catalog key (badges.key); never localized. */
  key: string;
  /** Metric value at which this tier is earned. */
  threshold: number;
  /** Display name for this tier. */
  name: AchName;
};

export type AchievementTrack = {
  /** Stable track key; never localized. */
  key: string;
  /** Which real metric drives this track. */
  metric: AchievementMetric;
  /** Track display name (the ladder's umbrella name). */
  name: AchName;
  /** Ascending tiers. */
  tiers: AchievementTier[];
};

export const ACHIEVEMENT_TRACKS: AchievementTrack[] = [
  {
    key: "merchant_atlas",
    metric: "distinct_merchants",
    name: { tr: "İşletme Atlası", en: "Merchant Atlas" },
    tiers: [
      { index: 1, key: "ach_merchant_atlas_1", threshold: 5, name: { tr: "Sokak Çocuğu", en: "Street Kid" } },
      { index: 2, key: "ach_merchant_atlas_2", threshold: 10, name: { tr: "Mahalle Bilgesi", en: "Block Regular" } },
      { index: 3, key: "ach_merchant_atlas_3", threshold: 20, name: { tr: "Şehir Kurdu", en: "City Slicker" } },
      { index: 4, key: "ach_merchant_atlas_4", threshold: 35, name: { tr: "Metropol Gezgini", en: "Metro Rover" } },
      { index: 5, key: "ach_merchant_atlas_5", threshold: 60, name: { tr: "Megakent", en: "Megacity" } },
      { index: 6, key: "ach_merchant_atlas_6", threshold: 100, name: { tr: "Dünya Vatandaşı", en: "Citizen of the World" } },
    ],
  },
  {
    key: "aisle_explorer",
    metric: "distinct_categories",
    name: { tr: "Çarşı Kâşifi", en: "Aisle Explorer" },
    tiers: [
      { index: 1, key: "ach_aisle_explorer_1", threshold: 5, name: { tr: "Reyon Gezgini", en: "Aisle Wanderer" } },
      { index: 2, key: "ach_aisle_explorer_2", threshold: 10, name: { tr: "Pazar Kurdu", en: "Market Hound" } },
      { index: 3, key: "ach_aisle_explorer_3", threshold: 18, name: { tr: "Çarşı Bilgesi", en: "Bazaar Sage" } },
      { index: 4, key: "ach_aisle_explorer_4", threshold: 30, name: { tr: "Çarşı Efendisi", en: "Bazaar Boss" } },
    ],
  },
  {
    key: "the_regular",
    metric: "best_streak",
    name: { tr: "Süreklilik", en: "The Regular" },
    tiers: [
      { index: 1, key: "ach_the_regular_1", threshold: 7, name: { tr: "Müdavim", en: "Regular" } },
      { index: 2, key: "ach_the_regular_2", threshold: 30, name: { tr: "Demirbaş", en: "The Fixture" } },
      { index: 3, key: "ach_the_regular_3", threshold: 100, name: { tr: "Sokak Efsanesi", en: "Street Legend" } },
      { index: 4, key: "ach_the_regular_4", threshold: 365, name: { tr: "Köşe Taşı", en: "Cornerstone" } },
    ],
  },
  {
    key: "coming_up",
    metric: "account_level",
    name: { tr: "Yükseliş", en: "Coming Up" },
    tiers: [
      { index: 1, key: "ach_coming_up_1", threshold: 5, name: { tr: "Çaylak", en: "Rookie" } },
      { index: 2, key: "ach_coming_up_2", threshold: 10, name: { tr: "Usta", en: "Master" } },
      { index: 3, key: "ach_coming_up_3", threshold: 20, name: { tr: "Reis", en: "The Chief" } },
      { index: 4, key: "ach_coming_up_4", threshold: 30, name: { tr: "Şehrin Patronu", en: "City Boss" } },
    ],
  },
  {
    key: "receipt_stack",
    metric: "verified_receipts",
    name: { tr: "Fiş Destesi", en: "Receipt Stack" },
    tiers: [
      { index: 1, key: "ach_receipt_stack_1", threshold: 25, name: { tr: "Fiş Avcısı", en: "Receipt Hunter" } },
      { index: 2, key: "ach_receipt_stack_2", threshold: 100, name: { tr: "Cüzdan Kabarık", en: "Fat Wallet" } },
      { index: 3, key: "ach_receipt_stack_3", threshold: 250, name: { tr: "Arşivci", en: "Archivist" } },
      { index: 4, key: "ach_receipt_stack_4", threshold: 500, name: { tr: "Fiş Müptelası", en: "Receipt Junkie" } },
      { index: 5, key: "ach_receipt_stack_5", threshold: 1000, name: { tr: "Fiş İmparatoru", en: "Receipt Emperor" } },
    ],
  },
  {
    key: "sharp_eye",
    metric: "hidden_cost_surfaced",
    name: { tr: "Keskin Göz", en: "Sharp Eye" },
    tiers: [
      { index: 1, key: "ach_sharp_eye_1", threshold: 100, name: { tr: "Gözü Açık", en: "Wide Awake" } },
      { index: 2, key: "ach_sharp_eye_2", threshold: 500, name: { tr: "Açıkgöz", en: "Street-Smart" } },
      { index: 3, key: "ach_sharp_eye_3", threshold: 2000, name: { tr: "Faturayı Gören", en: "Bill Reader" } },
      { index: 4, key: "ach_sharp_eye_4", threshold: 10000, name: { tr: "Kandırılmaz", en: "Unfoolable" } },
      { index: 5, key: "ach_sharp_eye_5", threshold: 50000, name: { tr: "Şehrin Gözü", en: "Eye of the City" } },
    ],
  },
  {
    key: "the_crew",
    metric: "successful_referrals",
    name: { tr: "Tayfa", en: "The Crew" },
    tiers: [
      { index: 1, key: "ach_the_crew_1", threshold: 1, name: { tr: "Davetçi", en: "Inviter" } },
      { index: 2, key: "ach_the_crew_2", threshold: 3, name: { tr: "Tayfa Başı", en: "Crew Boss" } },
      { index: 3, key: "ach_the_crew_3", threshold: 10, name: { tr: "Mahalle Lideri", en: "Block Leader" } },
    ],
  },
];

/** Metric label used to derive consistent badge descriptions (no per-tier authoring). */
const METRIC_LABEL: Record<AchievementMetric, (t: number) => AchName> = {
  distinct_merchants: (t) => ({ tr: `${t} farklı işletmeden fiş`, en: `Receipts from ${t} different merchants` }),
  distinct_categories: (t) => ({ tr: `${t} farklı kategoride harcama`, en: `Spending across ${t} different categories` }),
  best_streak: (t) => ({ tr: `${t} günlük aktif seri`, en: `${t}-day active streak` }),
  account_level: (t) => ({ tr: `Seviye ${t}'e ulaş`, en: `Reach level ${t}` }),
  verified_receipts: (t) => ({ tr: `${t} doğrulanmış fiş`, en: `${t} verified receipts` }),
  hidden_cost_surfaced: (t) => ({ tr: `${t}₺ gizli pay açığa çıkar`, en: `Surface ₺${t} of hidden cost` }),
  successful_referrals: (t) => ({ tr: `${t} başarılı davet`, en: `${t} successful referrals` }),
};

/** Pick a localized string with en fallback (ru/th/es/zh not yet authored). */
export function pickAchName(name: AchName, locale: string): string {
  return locale === "tr" ? name.tr : name.en;
}

/** Derived description for a tier (consistent, generated from metric + threshold). */
export function tierDescription(track: AchievementTrack, tier: AchievementTier): AchName {
  return METRIC_LABEL[track.metric](tier.threshold);
}

/** Every badge key in the catalog — used by the seed/upsert. */
export function allAchievementBadgeKeys(): string[] {
  return ACHIEVEMENT_TRACKS.flatMap((t) => t.tiers.map((tier) => tier.key));
}

/** Tiers in a track whose threshold is met by `value` (i.e. currently earned). */
export function earnedTiers(track: AchievementTrack, value: number): AchievementTier[] {
  return track.tiers.filter((tier) => value >= tier.threshold);
}

/** Highest tier reached in a track for `value`, or null if below tier 1. */
export function currentTier(track: AchievementTrack, value: number): AchievementTier | null {
  const reached = earnedTiers(track, value);
  return reached.length ? reached[reached.length - 1] : null;
}

/** Next tier above `value` (for a progress bar), or null at the top. */
export function nextTier(track: AchievementTrack, value: number): AchievementTier | null {
  return track.tiers.find((tier) => value < tier.threshold) ?? null;
}
