/**
 * Name-color cosmetic — the account-level-4 unlock (`name_color`, see
 * config/account-unlocks.ts). Lets a user tint their display name with one of a
 * curated palette. The stored value is a palette KEY (not a raw hex) so the set
 * stays validated, theme-aware and tunable in one place — an unknown/legacy key
 * resolves to the default (no fabricated color), matching the "uydurma yok" rule.
 *
 * Each swatch carries a separate light/dark hex so the name stays legible on
 * both themes. `null` (or the "default" key) means "no override" — the name
 * keeps its existing tier/text color.
 */

import type { LocalizedLabel } from "@/config/season-content";
import { seasonCosmeticsOfKind, type SeasonCosmetic } from "@/config/season-cosmetics";

/** Account level at which the name-color picker opens (mirrors account-unlocks). */
export const NAME_COLOR_UNLOCK_LEVEL = 4;

/** The stored value that means "no override" — the name uses its default color. */
export const DEFAULT_NAME_COLOR_KEY = "default";

export interface NameColorSwatch {
  /** Stable key persisted in user_profiles.name_color; never localized. */
  key: string;
  label: LocalizedLabel;
  /** Hex used on the dark theme. */
  dark: string;
  /** Hex used on the light theme. */
  light: string;
}

/** Curated palette — legible on both themes, aligned to the app accent language. */
export const NAME_COLORS: readonly NameColorSwatch[] = [
  { key: "amber",   label: { tr: "Kehribar", en: "Amber" },   dark: "#F5A623", light: "#B45309" },
  { key: "orange",  label: { tr: "Turuncu",  en: "Orange" },  dark: "#FB923C", light: "#EA580C" },
  { key: "rose",    label: { tr: "Gül",      en: "Rose" },    dark: "#FB7185", light: "#E11D48" },
  { key: "fuchsia", label: { tr: "Fuşya",    en: "Fuchsia" }, dark: "#E879F9", light: "#C026D3" },
  { key: "violet",  label: { tr: "Mor",      en: "Violet" },  dark: "#A78BFA", light: "#7C3AED" },
  { key: "sky",     label: { tr: "Gök",      en: "Sky" },     dark: "#38BDF8", light: "#0284C7" },
  { key: "cyan",    label: { tr: "Camgöbeği", en: "Cyan" },   dark: "#22D3EE", light: "#0891B2" },
  { key: "emerald", label: { tr: "Zümrüt",   en: "Emerald" }, dark: "#34D399", light: "#059669" },
];

/** A season name-color cosmetic → a swatch (owned only via a grant). */
function seasonToNameColor(c: SeasonCosmetic): NameColorSwatch {
  return { key: c.key, label: c.label, dark: c.dark, light: c.light };
}

/** Season-exclusive name colors, owned only via a grant. */
export const SEASON_NAME_COLORS: readonly NameColorSwatch[] =
  seasonCosmeticsOfKind("name_color").map(seasonToNameColor);

const SEASON_KEYS = new Set(SEASON_NAME_COLORS.map((c) => c.key));
const ALL_NAME_COLORS: readonly NameColorSwatch[] = [...NAME_COLORS, ...SEASON_NAME_COLORS];
const SWATCH_BY_KEY = new Map(ALL_NAME_COLORS.map((c) => [c.key, c]));

/** True when the picker should open: the user owns at least one season color.
 *  Name colors are season rewards now — account level no longer unlocks them
 *  (karar 2026-07-14). Legacy account-earned colors still render (grandfather),
 *  but new ones come only from the season pass. */
export function isNameColorUnlocked(_accountLevel: number, ownedKeys: readonly string[] = []): boolean {
  return ownedKeys.some((k) => SWATCH_BY_KEY.has(k));
}

/** Name colors the user owns — the granted season colors (grandfathered legacy
 *  account values still render via resolveNameColorHex, but are not re-offered). */
export function availableNameColors(
  _accountLevel: number,
  ownedKeys: readonly string[] = [],
): NameColorSwatch[] {
  const owned = new Set(ownedKeys);
  return ALL_NAME_COLORS.filter((c) => owned.has(c.key));
}

/**
 * Normalize an arbitrary stored/submitted value to a valid palette key or null.
 * Unknown keys, empty strings and the explicit "default" collapse to null. When
 * `accountLevel` is provided the ownership is enforced: base swatches need the
 * unlock level, season swatches need a grant (in `ownedKeys`).
 */
export function normalizeNameColorKey(
  value: unknown,
  accountLevel?: number,
  ownedKeys: readonly string[] = [],
): string | null {
  if (typeof value !== "string") return null;
  const key = value.trim().toLowerCase();
  if (!key || key === DEFAULT_NAME_COLOR_KEY) return null;
  if (!SWATCH_BY_KEY.has(key)) return null;
  if (accountLevel != null) {
    const owned = SEASON_KEYS.has(key)
      ? ownedKeys.includes(key)
      : accountLevel >= NAME_COLOR_UNLOCK_LEVEL;
    if (!owned) return null;
  }
  return key;
}

/**
 * Resolve a stored name-color key to a concrete hex for the given theme, or null
 * when there is no valid override. Ownership was gated at write time — render
 * trusts the stored key.
 */
export function resolveNameColorHex(
  value: unknown,
  theme: "light" | "dark",
): string | null {
  if (typeof value !== "string") return null;
  const key = value.trim().toLowerCase();
  if (!key || key === DEFAULT_NAME_COLOR_KEY) return null;
  const swatch = SWATCH_BY_KEY.get(key);
  if (!swatch) return null;
  return theme === "light" ? swatch.light : swatch.dark;
}
