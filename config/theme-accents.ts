/**
 * Theme-accent cosmetic — the accent unlocks on the account ladder
 * (config/account-unlocks.ts): L9 `theme_accent_2` (a second accent beyond the
 * brand default) and L35 `season_multiplier_elite_rare_theme` (rare accents).
 *
 * The app accent (`tier.accent`) is a single highlight color read across the UI.
 * This catalog lets a user override it with a chosen swatch. Same shape as
 * config/name-colors.ts: the stored value is a KEY (never a raw color),
 * theme-aware (light/dark hex), gated by the account level at which the swatch
 * opens. Unknown/default/over-level all resolve to null → the brand accent.
 */

import type { LocalizedLabel } from "@/config/season-content";
import { seasonCosmeticsOfKind, type SeasonCosmetic } from "@/config/season-cosmetics";

/** The stored value that means "no override" — the app keeps its brand accent. */
export const DEFAULT_THEME_ACCENT_KEY = "default";

/** Season cosmetics are never opened by account level — only by a grant row. */
const SEASON_UNLOCK_LEVEL = Number.MAX_SAFE_INTEGER;

/** Account level at which the accent picker opens (mirrors account-unlocks L9). */
export const THEME_ACCENT_UNLOCK_LEVEL = 9;

/**
 * "Full theme set" (account-unlocks L15 `weekly_report_theme_set`): at this level
 * every accent — including the rare (L35) and prestige (L42) swatches — opens
 * early, so the whole palette is available at once.
 */
export const FULL_THEME_SET_LEVEL = 15;

/** True when `accountLevel` has opened `swatch` (per-swatch level OR full set). */
function accentOpenedAt(swatchUnlockLevel: number, accountLevel: number): boolean {
  if (accountLevel >= FULL_THEME_SET_LEVEL) return true;
  return accountLevel >= swatchUnlockLevel;
}

export interface ThemeAccentSwatch {
  /** Stable key persisted in user_profiles.theme_accent; never localized. */
  key: string;
  label: LocalizedLabel;
  /** Account level at which this swatch opens (9 = standard, 35 = rare). */
  unlockLevel: number;
  dark: string;
  light: string;
}

/** Curated accent palette. Standard set opens at L9; rare set at L35. */
export const THEME_ACCENTS: readonly ThemeAccentSwatch[] = [
  // Standard set — opens at L9.
  { key: "sky",     label: { tr: "Gök",     en: "Sky" },     unlockLevel: 9,  dark: "#38BDF8", light: "#0284C7" },
  { key: "violet",  label: { tr: "Mor",     en: "Violet" },  unlockLevel: 9,  dark: "#A78BFA", light: "#7C3AED" },
  { key: "emerald", label: { tr: "Zümrüt",  en: "Emerald" }, unlockLevel: 9,  dark: "#34D399", light: "#059669" },
  { key: "rose",    label: { tr: "Gül",     en: "Rose" },    unlockLevel: 9,  dark: "#FB7185", light: "#E11D48" },
  { key: "orange",  label: { tr: "Turuncu", en: "Orange" },  unlockLevel: 9,  dark: "#FB923C", light: "#EA580C" },
  // Rare set — opens at L35.
  { key: "crimson", label: { tr: "Kızıl",   en: "Crimson" }, unlockLevel: 35, dark: "#F43F5E", light: "#BE123C" },
  { key: "aqua",    label: { tr: "Turkuaz", en: "Aqua" },    unlockLevel: 35, dark: "#2DD4BF", light: "#0D9488" },
  { key: "magenta", label: { tr: "Fuşya",   en: "Magenta" }, unlockLevel: 35, dark: "#E879F9", light: "#C026D3" },
  // Prestige accent — opens at L42 (config/account-unlocks `prestige_accent`).
  { key: "prestige", label: { tr: "Prestij", en: "Prestige" }, unlockLevel: 42, dark: "#FDE68A", light: "#A16207" },
];

/** A season accent/theme cosmetic → an accent swatch (owned only via a grant). */
function seasonToAccent(c: SeasonCosmetic): ThemeAccentSwatch {
  return {
    key: c.key,
    label: c.label,
    unlockLevel: SEASON_UNLOCK_LEVEL,
    dark: c.dark,
    light: c.light,
  };
}

/** Season-exclusive accents (accent + full-theme cosmetics), owned only via a grant. */
export const SEASON_THEME_ACCENTS: readonly ThemeAccentSwatch[] = [
  ...seasonCosmeticsOfKind("accent").map(seasonToAccent),
  ...seasonCosmeticsOfKind("theme").map(seasonToAccent),
];

const ALL_ACCENTS: readonly ThemeAccentSwatch[] = [...THEME_ACCENTS, ...SEASON_THEME_ACCENTS];
const ACCENT_BY_KEY = new Map(ALL_ACCENTS.map((a) => [a.key, a]));

/** True when an accent `key` is owned: opened by account level OR present in `ownedKeys`. */
function accentOwned(key: string, accountLevel: number, ownedKeys: readonly string[]): boolean {
  const swatch = ACCENT_BY_KEY.get(key);
  if (!swatch) return false;
  return accentOpenedAt(swatch.unlockLevel, accountLevel) || ownedKeys.includes(key);
}

/** True when the picker should open: the L9 set by level, or any granted season accent. */
/** Theme accents are season rewards now — account level no longer unlocks them
 *  (karar 2026-07-14). Legacy account-earned accents still render (grandfather). */
export function isThemeAccentUnlocked(_accountLevel: number, ownedKeys: readonly string[] = []): boolean {
  return ownedKeys.some((k) => ACCENT_BY_KEY.has(k));
}

/** Accent swatches the user owns — the granted season accents (grandfathered
 *  legacy account values still render, but are not re-offered), ascending. */
export function availableThemeAccents(
  _accountLevel: number,
  ownedKeys: readonly string[] = [],
): ThemeAccentSwatch[] {
  const owned = new Set(ownedKeys);
  return ALL_ACCENTS.filter((a) => owned.has(a.key));
}

/**
 * Normalize a stored/submitted value to a valid accent key or null. Unknown,
 * empty and "default" collapse to null; an accent the user does not own — above
 * their level and not granted — also collapses to null (server gate).
 */
export function normalizeThemeAccentKey(
  value: unknown,
  accountLevel?: number,
  ownedKeys: readonly string[] = [],
): string | null {
  if (typeof value !== "string") return null;
  const key = value.trim().toLowerCase();
  if (!key || key === DEFAULT_THEME_ACCENT_KEY) return null;
  if (!ACCENT_BY_KEY.has(key)) return null;
  if (accountLevel != null && !accentOwned(key, accountLevel, ownedKeys)) return null;
  return key;
}

/** Resolve a stored accent key to a hex for the theme, or null (brand accent).
 *  Ownership was gated at write time, so render trusts the stored key. */
export function resolveThemeAccentHex(value: unknown, theme: "light" | "dark"): string | null {
  if (typeof value !== "string") return null;
  const key = value.trim().toLowerCase();
  if (!key || key === DEFAULT_THEME_ACCENT_KEY) return null;
  const swatch = ACCENT_BY_KEY.get(key);
  if (!swatch) return null;
  return theme === "light" ? swatch.light : swatch.dark;
}
