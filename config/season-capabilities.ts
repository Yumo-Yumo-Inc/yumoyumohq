/**
 * Season capabilities — a NON-cosmetic battle-pass reward type (karar 2026-07-09).
 *
 * A 30-level pass filled only with cosmetics repeats by construction (there are
 * only so many cosmetic families). The fix (research: fintech gamification works
 * when rewards tie to real product events — StriveCloud/Plotline 2025) is to
 * unlock real Yumo capabilities at some levels, interleaved with cosmetics so no
 * two levels feel the same. A capability is owned via a season-pass grant and
 * gates a genuine feature/view while held.
 *
 * Each capability maps to a stable `feature` key that the gated surface checks
 * with `hasCapability(grants, feature)`.
 */

import type { LocalizedLabel } from "@/config/season-content";

export type CapabilityFeature =
  | "season_xray" // a season-scoped spending / hidden-cost X-ray view
  | "showcase_slot" // +1 badge showcase slot
  | "category_colors" // customize category colors in charts
  | "yumbie_persona" // a season Yumbie companion persona
  | "deep_price" // deep price-comparison view
  | "founder_mark"; // a verified "Genesis founder" mark by the name

export type SeasonCapability = {
  /** Stable capability key (also the grant cosmetic_key), never localized. */
  key: string;
  feature: CapabilityFeature;
  label: LocalizedLabel;
  description: LocalizedLabel;
  /** true once the gated surface is actually wired; false = granted but effect pending. */
  live: boolean;
};

/**
 * Genesis capability catalog, keyed by the same `<season>_<zone>_capability_l<level>`
 * scheme as cosmetics so grants map uniformly. Levels are assigned in config/season-cosmetics.
 */
export const GENESIS_CAPABILITIES: Record<CapabilityFeature, Omit<SeasonCapability, "key">> = {
  category_colors: {
    feature: "category_colors",
    label: { tr: "Kategori Renkleri", en: "Category Colors" },
    description: { tr: "Harcama grafiklerinde kategori renklerini kendine göre ayarla.", en: "Recolour spending-chart categories to your taste." },
    live: false,
  },
  season_xray: {
    feature: "season_xray",
    label: { tr: "Sezon Röntgeni", en: "Season X-Ray" },
    description: { tr: "Bu sezon harcamanı ve gizli maliyetini kategori kategori açan özel görünüm.", en: "A view that breaks your season's spend and hidden cost down by category." },
    live: false,
  },
  showcase_slot: {
    feature: "showcase_slot",
    label: { tr: "Ekstra Rozet Vitrini", en: "Extra Badge Slot" },
    description: { tr: "Profilinde bir rozet daha sergile.", en: "Pin one more badge on your profile." },
    live: true,
  },
  yumbie_persona: {
    feature: "yumbie_persona",
    label: { tr: "Yumbie Kor Personası", en: "Yumbie Ember Persona" },
    description: { tr: "Yumbie'ye sezonluk kor temalı bir kişilik.", en: "A season ember-themed persona for Yumbie." },
    live: false,
  },
  deep_price: {
    feature: "deep_price",
    label: { tr: "Derin Fiyat Karşılaştırma", en: "Deep Price Compare" },
    description: { tr: "Ürünlerinde daha derin fiyat karşılaştırma görünümü.", en: "A deeper price-comparison view on your items." },
    live: false,
  },
  founder_mark: {
    feature: "founder_mark",
    label: { tr: "Genesis Kurucu İşareti", en: "Genesis Founder Mark" },
    description: { tr: "Adının yanında doğrulanmış Genesis kurucu işareti.", en: "A verified Genesis-founder mark by your name." },
    live: false,
  },
};

/** True when the user's season-pass grants include a capability for `feature`. */
export function hasCapability(grants: readonly string[], feature: CapabilityFeature): boolean {
  const cap = GENESIS_CAPABILITIES[feature];
  if (!cap) return false;
  // A capability grant key ends with `_capability_l<level>`; match by feature via
  // the catalog's presence in the granted set is done by the caller passing keys.
  // Simpler: any granted key that resolves to this feature. The season-cosmetics
  // catalog owns the key→feature map, so callers pass the resolved feature set.
  return grants.some((k) => k.includes("_capability_") && featureOfKey(k) === feature);
}

/** Derive the capability feature from a grant key's trailing level, via the level map. */
const LEVEL_FEATURE: Record<number, CapabilityFeature> = {
  2: "category_colors",
  9: "season_xray",
  11: "showcase_slot",
  17: "yumbie_persona",
  22: "deep_price",
  29: "founder_mark",
};

export function featureOfKey(key: string): CapabilityFeature | null {
  const m = key.match(/_capability_l(\d+)$/);
  if (!m) return null;
  return LEVEL_FEATURE[Number(m[1])] ?? null;
}

/** Capability levels + their feature (consumed by config/season-cosmetics). */
export const CAPABILITY_LEVELS = LEVEL_FEATURE;
