/**
 * Account-level titles — the status unlocks on the account ladder
 * (config/account-unlocks.ts): L7 `title_first`, L18 `title_set_2`, L38
 * `title_master`. These live ALONGSIDE the season titles (config/seasons.ts):
 * both are chosen into the single `user_profiles.active_title` slot and rendered
 * through the same selector, so their label maps are merged for lookup.
 *
 * Earned purely from account level (no season standing). The stored value is the
 * title key; an account title above the user's level is not offered and is
 * rejected on write.
 *
 * NOTE — display copy: L38 is fixed by the unlock catalog ("Usta"/"Master").
 * L7/L18 names below follow the existing street voice (config/achievements.ts)
 * and are safe to rename; changing a `label` needs no migration, changing a
 * `key` would (it is the stored value).
 */

import { SEASON_TITLE_LABELS, type LocalizedLabel } from "@/config/season-content";

export interface AccountTitle {
  /** Stable key persisted in user_profiles.active_title; never localized. */
  key: string;
  /** Account level at which this title opens (matches account-unlocks). */
  unlockLevel: number;
  label: LocalizedLabel;
}

export const ACCOUNT_TITLES: readonly AccountTitle[] = [
  { key: "title_local", unlockLevel: 7, label: { tr: "Mahalleli", en: "Local" } },
  { key: "title_veteran", unlockLevel: 18, label: { tr: "Kıdemli", en: "Veteran" } },
  { key: "title_master", unlockLevel: 38, label: { tr: "Usta", en: "Master" } },
];

/** Account-title label map, keyed like SEASON_TITLE_LABELS. */
export const ACCOUNT_TITLE_LABELS: Record<string, LocalizedLabel> = Object.fromEntries(
  ACCOUNT_TITLES.map((t) => [t.key, t.label]),
);

/** Merged label map for the single active_title slot (season + account titles). */
export const ALL_TITLE_LABELS: Record<string, LocalizedLabel> = {
  ...SEASON_TITLE_LABELS,
  ...ACCOUNT_TITLE_LABELS,
};

/** Account-title keys the account level has opened. */
export function earnedAccountTitleKeys(accountLevel: number): string[] {
  return ACCOUNT_TITLES.filter((t) => accountLevel >= t.unlockLevel).map((t) => t.key);
}

/** True when `key` is an account title the level has earned. */
export function isAccountTitleEarned(key: string, accountLevel: number): boolean {
  return earnedAccountTitleKeys(accountLevel).includes(key);
}
