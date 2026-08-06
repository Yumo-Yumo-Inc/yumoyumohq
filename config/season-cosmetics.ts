/**
 * Season-exclusive cosmetics — the reward payload of the season pass
 * ("Sezon Geçişi", karar 2026-07-09). These are NOT on the account ladder: they
 * are earned only by reaching a season level and owned via a grant row
 * (user_cosmetic_grants), never derived from account level.
 *
 * The battle pass credits NO cPoints — every cosmetic here carries identity, not
 * economic weight (Uğur direktifi: "token değil kozmetik ağırlıklı").
 *
 * Content design (araştırma 2026-07-09, gamemakers/Deconstructor of Fun): a good
 * pass avoids the "every reward is a recolor" trap. Genesis is a HAND-AUTHORED,
 * NAMED collection with an escalating rarity ladder — common frost-sparks at the
 * start, a legendary Genesis Crown at the end — so each of the 26 rewards is a
 * distinct, desirable item, not a palette swap. The saga runs cold spark → ember
 * → flame → molten forge → living gold.
 *
 * Grant keys stay `<season>_<zone>_<kind>_l<level>` so existing grants keep
 * mapping when the collection's names/colours/rarity change.
 */

import type { LocalizedLabel } from "@/config/season-content";
import { SEASON_LEVEL_XP_THRESHOLDS, getSeasonLevelFromXp } from "@/config/season-level-config";
import { ALL_SEASONS, type SeasonConfig } from "@/config/seasons";

export type CosmeticKind =
  | "frame"
  | "accent"
  | "sticker"
  | "background"
  | "name_color"
  | "theme"
  | "crown"
  | "seal"
  | "capability";

export type Rarity = "common" | "rare" | "epic" | "legendary";

/** Display metadata per rarity — the label + the colour that signals "worth it". */
export const RARITY_META: Record<Rarity, { label: LocalizedLabel; color: string }> = {
  common: { label: { tr: "Sıradan", en: "Common" }, color: "#9AA4B2" },
  rare: { label: { tr: "Nadir", en: "Rare" }, color: "#4FB4FF" },
  epic: { label: { tr: "Destansı", en: "Epic" }, color: "#C084FC" },
  legendary: { label: { tr: "Efsanevi", en: "Legendary" }, color: "#FFB43B" },
};

export interface SeasonCosmetic {
  /** Stable key persisted in user_cosmetic_grants.cosmetic_key; never localized. */
  key: string;
  kind: CosmeticKind;
  /** Season level that grants this cosmetic. */
  level: number;
  /** Heat zone (tier) this level sits in. */
  tierKey: string;
  /** Distinct, evocative name (never a generated "Ember Frame"). */
  label: LocalizedLabel;
  rarity: Rarity;
  /** Representative hue (dark-theme value) for previews and the pass icon. */
  hex: string;
  /** Accent hex on the dark theme. */
  dark: string;
  /** Accent hex on the light theme (deeper so text/name stays legible). */
  light: string;
  /** Emoji for sticker cosmetics on the tiny equipped avatar badge (empty otherwise). */
  emoji: string;
  /** Premium SVG glyph for sticker/crown cosmetics on the reward showcase. */
  glyph: string | null;
  /** Frames only: rotating conic ring (the higher-rarity treatment). */
  animated: boolean;
}

/** Heat hue per tier zone — fallback for a future season without a hand set. */
const HEAT: Record<string, string> = {
  spark: "#4FB4FF",
  ember: "#FF9D47",
  flame: "#FF5D3B",
  forge: "#FFD66B",
};
const HEAT_LIGHT: Record<string, string> = {
  spark: "#0284C7",
  ember: "#C2410C",
  flame: "#DC2626",
  forge: "#B45309",
};

/** Season level → cosmetic kind (tier levels 5/10/16/21 are cPoints nodes, not cosmetics). */
const LEVEL_KIND: Record<number, CosmeticKind> = {
  1: "sticker", 2: "capability", 3: "frame", 4: "name_color",
  6: "sticker", 7: "seal", 8: "frame", 9: "capability",
  11: "capability", 12: "sticker", 13: "seal", 14: "frame", 15: "accent",
  17: "capability", 18: "sticker", 19: "frame", 20: "seal",
  22: "capability", 23: "name_color", 24: "theme", 25: "sticker",
  26: "seal", 27: "frame", 28: "accent", 29: "capability", 30: "crown",
};

type CollectionItem = {
  kind: CosmeticKind;
  label: LocalizedLabel;
  rarity: Rarity;
  dark: string;
  light: string;
  emoji?: string;
  glyph?: string;
  animated?: boolean;
};

/**
 * Genesis — the founding collection. A forge saga: frost sparks (common) heat
 * through ember and flame to a molten-gold, animated finale (legendary), with a
 * full theme (L24) and the Genesis Crown (L30) as the chase rewards.
 */
const GENESIS_COLLECTION: Record<number, CollectionItem> = {
  1: { kind: "sticker", label: { tr: "İlk Kıvılcım", en: "First Spark" }, rarity: "common", dark: "#5CC8FF", light: "#BAE6FD", emoji: "✨", glyph: "spark" },
  2: { kind: "capability", label: { tr: "Kategori Renkleri", en: "Category Colors" }, rarity: "rare", dark: "#A78BFA", light: "#7C3AED", glyph: "swatches" },
  3: { kind: "frame", label: { tr: "Kıvılcım Halkası", en: "Spark Ring" }, rarity: "common", dark: "#4FB4FF", light: "#0EA5E9", glyph: "ringSpark" },
  4: { kind: "name_color", label: { tr: "Ayaz Işığı", en: "Frostlight" }, rarity: "common", dark: "#93D7FF", light: "#0369A1" },
  6: { kind: "sticker", label: { tr: "Kor Tohumu", en: "Ember Seed" }, rarity: "rare", dark: "#FF9D47", light: "#FFD9A8", emoji: "🔥", glyph: "emberSeed" },
  7: { kind: "seal", label: { tr: "Kıvılcım Mührü", en: "Spark Seal" }, rarity: "rare", dark: "#5CC8FF", light: "#BAE6FD", glyph: "sealSpark" },
  8: { kind: "frame", label: { tr: "Tutuşan Halka", en: "Kindled Ring" }, rarity: "rare", dark: "#7FC8FF", light: "#0EA5E9", glyph: "ringKindled" },
  9: { kind: "capability", label: { tr: "Sezon Röntgeni", en: "Season X-Ray" }, rarity: "epic", dark: "#A78BFA", light: "#7C3AED", glyph: "lens" },
  11: { kind: "capability", label: { tr: "Ekstra Rozet Vitrini", en: "Extra Badge Slot" }, rarity: "rare", dark: "#A78BFA", light: "#7C3AED", glyph: "slotplus" },
  12: { kind: "sticker", label: { tr: "Cüruf", en: "Cinder" }, rarity: "rare", dark: "#FF8A3D", light: "#FFC98A", emoji: "💥", glyph: "cinder" },
  13: { kind: "seal", label: { tr: "Kor Mührü", en: "Ember Seal" }, rarity: "rare", dark: "#FF9D47", light: "#FFD9A8", glyph: "sealEmber" },
  14: { kind: "frame", label: { tr: "Kor Halkası", en: "Ember Ring" }, rarity: "epic", dark: "#FF9D47", light: "#EA580C", glyph: "ringEmber" },
  15: { kind: "accent", label: { tr: "Erimiş Turuncu", en: "Molten Orange" }, rarity: "epic", dark: "#FF8A3D", light: "#EA580C" },
  17: { kind: "capability", label: { tr: "Yumbie Kor Personası", en: "Yumbie Ember Persona" }, rarity: "epic", dark: "#A78BFA", light: "#7C3AED", glyph: "yumbie" },
  18: { kind: "sticker", label: { tr: "Yangın", en: "Wildfire" }, rarity: "epic", dark: "#FF5D3B", light: "#FFA98F", emoji: "🌋", glyph: "wildfire" },
  19: { kind: "frame", label: { tr: "Alev Halkası", en: "Flame Ring" }, rarity: "epic", dark: "#FF5D3B", light: "#DC2626", animated: true, glyph: "ringFlame" },
  20: { kind: "seal", label: { tr: "Alev Mührü", en: "Flame Seal" }, rarity: "epic", dark: "#FF5D3B", light: "#FFA98F", glyph: "sealFlame" },
  22: { kind: "capability", label: { tr: "Derin Fiyat Karşılaştırma", en: "Deep Price Compare" }, rarity: "legendary", dark: "#A78BFA", light: "#7C3AED", glyph: "tag" },
  23: { kind: "name_color", label: { tr: "Ocak Altını", en: "Forgegold" }, rarity: "legendary", dark: "#FFD66B", light: "#B45309", glyph: "dropSpark" },
  24: { kind: "theme", label: { tr: "Genesis Isısı", en: "Genesis Heat" }, rarity: "legendary", dark: "#FFD66B", light: "#B45309" },
  25: { kind: "sticker", label: { tr: "Örs", en: "Anvil" }, rarity: "legendary", dark: "#FFD66B", light: "#FFF0C4", emoji: "⚒️", glyph: "anvil" },
  26: { kind: "seal", label: { tr: "Genesis Mührü", en: "Genesis Seal" }, rarity: "legendary", dark: "#FFD66B", light: "#FFF0C4", glyph: "sealGenesis" },
  27: { kind: "frame", label: { tr: "Erimiş Taç Halkası", en: "Molten Crown Ring" }, rarity: "legendary", dark: "#FFD66B", light: "#B45309", animated: true, glyph: "ringCrown" },
  28: { kind: "accent", label: { tr: "Yaşayan Altın", en: "Living Gold" }, rarity: "legendary", dark: "#FFE08A", light: "#A16207", glyph: "chipGem" },
  29: { kind: "capability", label: { tr: "Genesis Kurucu İşareti", en: "Genesis Founder Mark" }, rarity: "legendary", dark: "#A78BFA", light: "#7C3AED", glyph: "shield" },
  30: { kind: "crown", label: { tr: "Genesis Tacı", en: "Genesis Crown" }, rarity: "legendary", dark: "#FFD66B", light: "#FFF0C4", emoji: "👑", glyph: "crown" },
};

/** Season level a tier band starts at, for zone assignment. */
function zoneForLevel(config: SeasonConfig, level: number): string {
  let key = config.tiers[0]?.key ?? "spark";
  for (const t of config.tiers) {
    if (level >= getSeasonLevelFromXp(t.minSeasonXp)) key = t.key;
  }
  return key;
}

/**
 * Build the season's cosmetic catalog. Genesis uses the hand-authored named
 * collection; a future season with no hand set falls back to a heat-tinted
 * generated set so the pipeline never breaks.
 */
export function buildSeasonCosmetics(config: SeasonConfig): SeasonCosmetic[] {
  const out: SeasonCosmetic[] = [];
  const maxLevel = SEASON_LEVEL_XP_THRESHOLDS.length;
  const isGenesis = config.key === "genesis";
  for (let level = 1; level <= maxLevel; level++) {
    const kind = LEVEL_KIND[level];
    if (!kind) continue; // tier level — no cosmetic here
    const tierKey = zoneForLevel(config, level);
    const item = isGenesis ? GENESIS_COLLECTION[level] : undefined;

    if (item) {
      out.push({
        key: `${config.key}_${tierKey}_${item.kind}_l${level}`,
        kind: item.kind,
        level,
        tierKey,
        label: item.label,
        rarity: item.rarity,
        hex: item.dark,
        dark: item.dark,
        light: item.light,
        emoji: item.emoji ?? "",
        glyph: item.glyph ?? null,
        animated: item.animated ?? false,
      });
    } else {
      // Generated fallback for a season without a hand-authored collection.
      const zone = tierKey.charAt(0).toUpperCase() + tierKey.slice(1);
      out.push({
        key: `${config.key}_${tierKey}_${kind}_l${level}`,
        kind,
        level,
        tierKey,
        label: { tr: `${zone} ödülü`, en: `${zone} reward` },
        rarity: "common",
        hex: HEAT[tierKey] ?? HEAT.ember,
        dark: HEAT[tierKey] ?? HEAT.ember,
        light: HEAT_LIGHT[tierKey] ?? HEAT_LIGHT.ember,
        emoji: "",
        glyph: null,
        animated: false,
      });
    }
  }
  return out;
}

/** Cosmetics granted for reaching `seasonLevel` (all cosmetic nodes at or below it). */
export function earnedSeasonCosmetics(config: SeasonConfig, seasonLevel: number): SeasonCosmetic[] {
  return buildSeasonCosmetics(config).filter((c) => c.level <= seasonLevel);
}

/**
 * Every season-exclusive cosmetic across all known seasons. Family configs merge
 * these into their catalog so a granted season cosmetic resolves + equips like a
 * native swatch (ownership comes from user_cosmetic_grants, never account level).
 */
export const ALL_SEASON_COSMETICS: readonly SeasonCosmetic[] =
  ALL_SEASONS.flatMap((season) => buildSeasonCosmetics(season));

/** All season cosmetics of one kind (for a family config to absorb). */
export function seasonCosmeticsOfKind(kind: CosmeticKind): SeasonCosmetic[] {
  return ALL_SEASON_COSMETICS.filter((c) => c.kind === kind);
}

/** Lookup a season cosmetic by its stable key. */
export function getSeasonCosmetic(key: string): SeasonCosmetic | null {
  return ALL_SEASON_COSMETICS.find((c) => c.key === key) ?? null;
}
