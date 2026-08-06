/**
 * Profile-background cosmetic — the L40 unlock `profile_bg_early_access`
 * (config/account-unlocks.ts). A curated backdrop painted behind the account
 * identity hero. Same shape as config/name-colors.ts: the stored value is a KEY
 * (never raw CSS), gated by the unlock level; unknown/default/over-level resolve
 * to null → the default surface. Each background is a CSS `background` value with
 * a light/dark variant so the hero's text stays legible on both themes.
 */

import type { LocalizedLabel } from "@/config/season-content";
import { seasonCosmeticsOfKind, type SeasonCosmetic } from "@/config/season-cosmetics";

/** The stored value that means "no background" — the default hero surface. */
export const DEFAULT_PROFILE_BG_KEY = "default";

/** Account level at which the profile background opens (mirrors account-unlocks). */
export const PROFILE_BG_UNLOCK_LEVEL = 40;

export interface ProfileBackground {
  /** Stable key persisted in user_profiles.profile_bg; never localized. */
  key: string;
  label: LocalizedLabel;
  /** CSS background on the dark theme. */
  dark: string;
  /** CSS background on the light theme. */
  light: string;
}

/** Curated backdrops — dark-based gradients that keep the light hero text legible. */
export const PROFILE_BACKGROUNDS: readonly ProfileBackground[] = [
  {
    key: "aurora",
    label: { tr: "Kuzey Işıkları", en: "Aurora" },
    dark: "radial-gradient(120% 120% at 0% 0%, rgba(124,58,237,0.35), transparent 55%), radial-gradient(120% 120% at 100% 0%, rgba(56,189,248,0.28), transparent 55%), linear-gradient(160deg, #131826, #0c0f18)",
    light: "radial-gradient(120% 120% at 0% 0%, rgba(124,58,237,0.18), transparent 55%), radial-gradient(120% 120% at 100% 0%, rgba(2,132,199,0.16), transparent 55%), linear-gradient(160deg, #eef1f8, #e3e8f3)",
  },
  {
    key: "sunset",
    label: { tr: "Gün Batımı", en: "Sunset" },
    dark: "radial-gradient(120% 120% at 100% 0%, rgba(234,88,12,0.34), transparent 55%), radial-gradient(120% 120% at 0% 100%, rgba(225,29,72,0.26), transparent 55%), linear-gradient(160deg, #1a1420, #100b12)",
    light: "radial-gradient(120% 120% at 100% 0%, rgba(234,88,12,0.18), transparent 55%), radial-gradient(120% 120% at 0% 100%, rgba(225,29,72,0.14), transparent 55%), linear-gradient(160deg, #f8efe9, #f2e6e6)",
  },
  {
    key: "ocean",
    label: { tr: "Okyanus", en: "Ocean" },
    dark: "radial-gradient(120% 120% at 0% 0%, rgba(14,165,233,0.32), transparent 55%), radial-gradient(120% 120% at 100% 100%, rgba(13,148,136,0.26), transparent 55%), linear-gradient(160deg, #0f1a22, #0a1116)",
    light: "radial-gradient(120% 120% at 0% 0%, rgba(14,165,233,0.16), transparent 55%), radial-gradient(120% 120% at 100% 100%, rgba(13,148,136,0.14), transparent 55%), linear-gradient(160deg, #e8f2f6, #dfeef0)",
  },
  {
    key: "ember",
    label: { tr: "Kor", en: "Ember" },
    dark: "radial-gradient(120% 120% at 50% 0%, rgba(245,166,35,0.30), transparent 55%), radial-gradient(120% 120% at 100% 100%, rgba(180,83,9,0.30), transparent 55%), linear-gradient(160deg, #1a1610, #0f0c08)",
    light: "radial-gradient(120% 120% at 50% 0%, rgba(245,166,35,0.18), transparent 55%), radial-gradient(120% 120% at 100% 100%, rgba(180,83,9,0.14), transparent 55%), linear-gradient(160deg, #f8f2e6, #f1e8d8)",
  },
  {
    key: "forest",
    label: { tr: "Orman", en: "Forest" },
    dark: "radial-gradient(120% 120% at 0% 100%, rgba(5,150,105,0.30), transparent 55%), radial-gradient(120% 120% at 100% 0%, rgba(52,211,153,0.22), transparent 55%), linear-gradient(160deg, #101a15, #0a110d)",
    light: "radial-gradient(120% 120% at 0% 100%, rgba(5,150,105,0.16), transparent 55%), radial-gradient(120% 120% at 100% 0%, rgba(52,211,153,0.14), transparent 55%), linear-gradient(160deg, #e8f3ec, #dfeee4)",
  },
];

/** A season background cosmetic → a heat-tinted backdrop (owned only via a grant). */
function seasonToBackground(c: SeasonCosmetic): ProfileBackground {
  return {
    key: c.key,
    label: c.label,
    dark: `radial-gradient(120% 120% at 50% 0%, ${c.dark}4d, transparent 55%), radial-gradient(120% 120% at 100% 100%, ${c.dark}33, transparent 55%), linear-gradient(160deg, #17110f, #0d0a08)`,
    light: `radial-gradient(120% 120% at 50% 0%, ${c.light}26, transparent 55%), radial-gradient(120% 120% at 100% 100%, ${c.light}1f, transparent 55%), linear-gradient(160deg, #f6f0e9, #efe6da)`,
  };
}

/** Season-exclusive backgrounds, owned only via a grant. */
export const SEASON_PROFILE_BACKGROUNDS: readonly ProfileBackground[] =
  seasonCosmeticsOfKind("background").map(seasonToBackground);

const SEASON_KEYS = new Set(SEASON_PROFILE_BACKGROUNDS.map((b) => b.key));
const ALL_BACKGROUNDS: readonly ProfileBackground[] = [...PROFILE_BACKGROUNDS, ...SEASON_PROFILE_BACKGROUNDS];
const BG_BY_KEY = new Map(ALL_BACKGROUNDS.map((b) => [b.key, b]));

/** True when the picker should open: the base set by level, or any granted season background. */
/** Backgrounds are season rewards now — account level no longer unlocks them
 *  (karar 2026-07-14). Legacy account-earned backgrounds still render (grandfather). */
export function isProfileBgUnlocked(_accountLevel: number, ownedKeys: readonly string[] = []): boolean {
  return ownedKeys.some((k) => BG_BY_KEY.has(k));
}

/** Backgrounds the user owns — the granted season backdrops (grandfathered legacy
 *  account values still render, but are not re-offered). */
export function availableProfileBackgrounds(
  _accountLevel: number,
  ownedKeys: readonly string[] = [],
): ProfileBackground[] {
  const owned = new Set(ownedKeys);
  return ALL_BACKGROUNDS.filter((b) => owned.has(b.key));
}

/**
 * Normalize a stored/submitted value to a valid key or null. Unknown, empty and
 * "default" collapse to null. With `accountLevel`, ownership is enforced: base
 * backgrounds need the unlock level, season ones need a grant (in `ownedKeys`).
 */
export function normalizeProfileBgKey(
  value: unknown,
  accountLevel?: number,
  ownedKeys: readonly string[] = [],
): string | null {
  if (typeof value !== "string") return null;
  const key = value.trim().toLowerCase();
  if (!key || key === DEFAULT_PROFILE_BG_KEY) return null;
  if (!BG_BY_KEY.has(key)) return null;
  if (accountLevel != null) {
    const owned = SEASON_KEYS.has(key)
      ? ownedKeys.includes(key)
      : accountLevel >= PROFILE_BG_UNLOCK_LEVEL;
    if (!owned) return null;
  }
  return key;
}

/** Resolve a stored key to a CSS background for the theme, or null (default
 *  surface). Ownership was gated at write time — render trusts the stored key. */
export function resolveProfileBgCss(value: unknown, theme: "light" | "dark"): string | null {
  if (typeof value !== "string") return null;
  const key = value.trim().toLowerCase();
  if (!key || key === DEFAULT_PROFILE_BG_KEY) return null;
  const bg = BG_BY_KEY.get(key);
  if (!bg) return null;
  return theme === "light" ? bg.light : bg.dark;
}
