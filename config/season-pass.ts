/**
 * Season pass — the per-level reward track ("Sezon Geçişi", battle-pass style).
 *
 * This derives a 30-node reward track from a season's tier config
 * (config/seasons.ts) and the season-level XP thresholds
 * (config/season-level-config.ts). It is the SINGLE source of truth for what a
 * given season level shows on the pass track.
 *
 * Reward-crediting scope (karar 2026-07-09):
 *  - TIER nodes carry the season's real cPoints reward + badge. These are still
 *    credited at season CLOSE by lib/season/lifecycle.ts — the track only
 *    VISUALIZES them at their level position. No new emission here.
 *  - Cosmetic nodes are `comingSoon: true`: the per-level cPoints + season-exclusive
 *    cosmetic ownership + instant claim are an economic layer that is designed
 *    separately (tokenomics pass) before going live. Until then they render as
 *    "yakında", mirroring the phase-2 pattern on the account journey. No values
 *    are fabricated (CLAUDE.md T1/T3, odul-asla-kisilmaz).
 */

import { SEASON_LEVEL_XP_THRESHOLDS, getSeasonLevelFromXp } from "@/config/season-level-config";
import type { SeasonConfig, SeasonTier } from "@/config/seasons";
import { buildSeasonCosmetics, type SeasonCosmetic } from "@/config/season-cosmetics";

/** The number of levels on the pass (bounded by the season-level threshold table). */
export const SEASON_PASS_MAX_LEVEL = SEASON_LEVEL_XP_THRESHOLDS.length;

export type SeasonPassRewardKind =
  | "cpoints"
  | "frame"
  | "accent"
  | "sticker"
  | "background"
  | "name_color"
  | "theme"
  | "badge"
  | "crown";

export type SeasonPassNode = {
  /** 1-based season level this node unlocks at. */
  level: number;
  /** Cumulative season XP required to reach this level. */
  xpRequired: number;
  /** Visual reward type (drives the icon + label). */
  kind: SeasonPassRewardKind;
  /** Tier zone (heat band) this level falls in. */
  tierKey: string;
  /** A milestone node that maps to a real season tier reward, or null. */
  tier: { key: string; index: number; cpoints: number; badgeKey: string } | null;
  /** The season-exclusive cosmetic granted at this level, or null for tier nodes. */
  cosmeticKey: string | null;
};

/** Heat zone for the legend: a tier plus the season level it starts at. */
export type SeasonPassZone = {
  key: string;
  index: number;
  startLevel: number;
  cpoints: number;
};

/** Season level at which a tier's XP threshold is first reached. */
function tierStartLevel(tier: SeasonTier): number {
  return getSeasonLevelFromXp(tier.minSeasonXp);
}

/** The tier zones (heat bands) for a season, ascending by start level. */
export function getSeasonPassZones(config: SeasonConfig): SeasonPassZone[] {
  return config.tiers.map((t) => ({
    key: t.key,
    index: t.index,
    startLevel: tierStartLevel(t),
    cpoints: t.cpointsReward,
  }));
}

/** The tier zone a given season level belongs to (highest tier whose band it enters). */
function zoneKeyForLevel(level: number, zones: SeasonPassZone[]): string {
  let key = zones[0]?.key ?? "";
  for (const z of zones) {
    if (level >= z.startLevel) key = z.key;
  }
  return key;
}

/**
 * Build the full 1..MAX season-level reward track for a season. Tier milestone
 * levels carry the real tier reward; every other level is a cosmetic slot marked
 * comingSoon until the reward economics land.
 */
export function buildSeasonPassNodes(config: SeasonConfig): SeasonPassNode[] {
  const zones = getSeasonPassZones(config);
  const tierByLevel = new Map<number, SeasonTier>();
  for (const t of config.tiers) {
    tierByLevel.set(tierStartLevel(t), t);
  }
  const cosmeticByLevel = new Map<number, SeasonCosmetic>();
  for (const c of buildSeasonCosmetics(config)) {
    cosmeticByLevel.set(c.level, c);
  }

  const nodes: SeasonPassNode[] = [];
  for (let level = 1; level <= SEASON_PASS_MAX_LEVEL; level++) {
    const xpRequired = SEASON_LEVEL_XP_THRESHOLDS[level - 1] ?? 0;
    const tierKey = zoneKeyForLevel(level, zones);
    const tier = tierByLevel.get(level) ?? null;

    if (tier) {
      nodes.push({
        level,
        xpRequired,
        kind: "cpoints",
        tierKey,
        tier: { key: tier.key, index: tier.index, cpoints: tier.cpointsReward, badgeKey: tier.badgeKey },
        cosmeticKey: null,
      });
    } else {
      // Cosmetic node — auto-granted when the season level reaches it.
      const cosmetic = cosmeticByLevel.get(level);
      nodes.push({
        level,
        xpRequired,
        kind: (cosmetic?.kind as SeasonPassRewardKind) ?? "accent",
        tierKey,
        tier: null,
        cosmeticKey: cosmetic?.key ?? null,
      });
    }
  }
  return nodes;
}
