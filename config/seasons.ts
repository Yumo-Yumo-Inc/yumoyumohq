/**
 * Season catalog — gamification seasons (off-chain motivation layer).
 *
 * This is the SINGLE source of truth for a season's tier ladder, tier→reward
 * mapping, and the badge/title keys a season grants. It is intentionally
 * value-bearing config (code, not DB) so a season's shape ships with a deploy
 * and is reviewable in one place.
 *
 * IMPORTANT — gamification season ≠ reward epoch. Pre-TGE there is no token, so
 * tier rewards are denominated in cPoints (the contribution score, single
 * user-facing currency). The reward is a `season_tier_bonus` row in the
 * contribution ledger (contribution_point_events). After TGE, the existing epoch
 * engine (lib/rewards/engine) sweeps that same ledger into claimable bINT/INT —
 * so the cPoints credited here become the future bINT basis. No parallel source.
 *
 * cPoints tier rewards reflect a product decision (2026-06-29): 1k/2.5k/5k/12k —
 * meaningful, "worth competing for", not receipt-sized. XP thresholds are grounded
 * in the live 28-day season-XP distribution (p25≈823, median≈3.249, p75≈7.221,
 * max≈10.015) and adjustable before launch.
 */

export type TierRequirement = { type: "participation" } | { type: "tier"; minTierIndex: number };

export type SeasonTier = {
  /** 1-based rank, ascending. */
  index: number;
  /** Stable catalog key (used for badge/UI lookups), never localized. */
  key: string;
  /** Minimum cumulative season XP to reach this tier. DRAFT. */
  minSeasonXp: number;
  /** cPoints credited at season close for reaching (only) this tier.
   *  Pre-TGE this is the reward; post-TGE the same ledger row becomes bINT/INT. */
  cpointsReward: number;
  /** Badge catalog key granted at close. Seeded later; grant no-ops until then. */
  badgeKey: string;
};

export type SeasonTitle = {
  /** Stable catalog key; localized label lives in messages/*.json (content, later). */
  key: string;
  /** What unlocks this title for a user. */
  requires: TierRequirement;
};

export type SeasonConfig = {
  seasonNumber: number;
  /** Stable key, never localized. */
  key: string;
  /** Display name; canonical EN. UI may localize via messages/*.json later. */
  name: string;
  /** Season length in days; manual start, cron closes at start+durationDays. */
  durationDays: number;
  /** Ascending tier ladder. */
  tiers: SeasonTier[];
  /** Badge granted to every participant (season_xp > 0) — season-exclusive. */
  participationBadgeKey: string;
  /** Selectable titles unlocked by this season. User picks ONE (user_profiles.active_title). */
  titles: SeasonTitle[];
};

/**
 * Genesis — the founding pre-season. Manual start by the founder, 4 weeks,
 * tier-based cPoints at close, repeats every 4 weeks (next start is also manual).
 * Catalog kept lean: 4 tiers · ~5 season badges · 4 titles (3 tier + 1 founder).
 */
export const GENESIS_SEASON: SeasonConfig = {
  seasonNumber: 2, // season 1 = stale "Trial"; Genesis is the first real season
  key: "genesis",
  name: "Genesis",
  durationDays: 28,
  tiers: [
    { index: 1, key: "spark", minSeasonXp: 800, cpointsReward: 1000, badgeKey: "genesis_tier_spark" },
    { index: 2, key: "ember", minSeasonXp: 3000, cpointsReward: 2500, badgeKey: "genesis_tier_ember" },
    { index: 3, key: "flame", minSeasonXp: 7000, cpointsReward: 5000, badgeKey: "genesis_tier_flame" },
    { index: 4, key: "forge", minSeasonXp: 12000, cpointsReward: 12000, badgeKey: "genesis_tier_forge" },
  ],
  participationBadgeKey: "genesis_participant",
  titles: [
    { key: "genesis_founder", requires: { type: "participation" } },
    { key: "title_ember", requires: { type: "tier", minTierIndex: 2 } },
    { key: "title_flame", requires: { type: "tier", minTierIndex: 3 } },
    { key: "title_forge", requires: { type: "tier", minTierIndex: 4 } },
  ],
};

/** All known seasons, keyed by season_number. */
const SEASONS: Record<number, SeasonConfig> = {
  [GENESIS_SEASON.seasonNumber]: GENESIS_SEASON,
};

export function getSeasonConfig(seasonNumber: number): SeasonConfig | null {
  return SEASONS[seasonNumber] ?? null;
}

/** Highest tier whose threshold is met by `seasonXp`, or null if below tier 1. */
export function getTierForXp(config: SeasonConfig, seasonXp: number): SeasonTier | null {
  let reached: SeasonTier | null = null;
  for (const tier of config.tiers) {
    if (seasonXp >= tier.minSeasonXp) reached = tier;
    else break;
  }
  return reached;
}

/** Next tier above the one currently reached (for "next reward" progress UI), or null at top. */
export function getNextTier(config: SeasonConfig, seasonXp: number): SeasonTier | null {
  for (const tier of config.tiers) {
    if (seasonXp < tier.minSeasonXp) return tier;
  }
  return null;
}

/**
 * Title keys a user has unlocked for a season, given the highest tier they
 * reached (`tierIndex`, null if below tier 1) and whether they participated.
 */
export function getEarnedTitleKeys(
  config: SeasonConfig,
  tierIndex: number | null,
  participated: boolean,
): string[] {
  return config.titles
    .filter((t) => {
      if (t.requires.type === "participation") return participated;
      return tierIndex != null && tierIndex >= t.requires.minTierIndex;
    })
    .map((t) => t.key);
}
