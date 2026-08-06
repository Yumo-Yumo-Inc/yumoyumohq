/**
 * Avatar-sticker cosmetic — a small illustration pinned to the corner of the
 * user's avatar. Stickers are **season-exclusive**: they are earned by reaching a
 * season level in the season pass and owned via a grant row (user_cosmetic_grants),
 * never derived from account level (karar 2026-07-14 — sticker sistemi tamamen
 * sezon-seviyesi; eski hesap-seviyesi baz emoji seti kaldırıldı).
 *
 * The stored value is a KEY (never a raw emoji). Unknown/default/not-granted
 * resolve to null → no sticker. Old account-ladder base keys ("star", "fire",
 * "crown", …) are no longer valid keys, so any legacy stored value collapses to
 * null on read — the sticker simply disappears until a season sticker is equipped.
 */

import type { LocalizedLabel } from "@/config/season-content";
import { seasonCosmeticsOfKind, type SeasonCosmetic } from "@/config/season-cosmetics";

/** The stored value that means "no sticker". */
export const DEFAULT_AVATAR_STICKER_KEY = "none";

export interface AvatarSticker {
  /** Stable key persisted in user_profiles.avatar_sticker; never localized. */
  key: string;
  /** The emoji rendered on the avatar corner. */
  emoji: string;
  label: LocalizedLabel;
}

/** A season sticker cosmetic → an AvatarSticker (owned only via a grant). */
function seasonToSticker(c: SeasonCosmetic): AvatarSticker {
  return { key: c.key, emoji: c.emoji, label: c.label };
}

/** Season-exclusive stickers, owned only via a grant. */
export const SEASON_AVATAR_STICKERS: readonly AvatarSticker[] =
  seasonCosmeticsOfKind("sticker").map(seasonToSticker);

const STICKER_BY_KEY = new Map(SEASON_AVATAR_STICKERS.map((s) => [s.key, s]));

/** True when the picker should open: the user owns at least one season sticker. */
export function isAvatarStickerUnlocked(ownedKeys: readonly string[] = []): boolean {
  return ownedKeys.some((k) => STICKER_BY_KEY.has(k));
}

/** Stickers the user owns — the granted season stickers. */
export function availableAvatarStickers(ownedKeys: readonly string[] = []): AvatarSticker[] {
  const owned = new Set(ownedKeys);
  return SEASON_AVATAR_STICKERS.filter((s) => owned.has(s.key));
}

/**
 * Normalize a stored/submitted value to a valid key or null. Unknown, empty and
 * "none" collapse to null. The signature mirrors the other cosmetic normalizers
 * `(value, accountLevel?, ownedKeys?)` so the equip route can dispatch them
 * uniformly — but stickers are grant-only, so `accountLevel` is ignored. When the
 * caller passes the ownership context (write path, `accountLevel != null`), the
 * season sticker must be granted; the read path calls with just the value and
 * trusts the stored key (ownership was gated at write).
 */
export function normalizeAvatarStickerKey(
  value: unknown,
  accountLevel?: number,
  ownedKeys: readonly string[] = [],
): string | null {
  if (typeof value !== "string") return null;
  const key = value.trim().toLowerCase();
  if (!key || key === DEFAULT_AVATAR_STICKER_KEY) return null;
  if (!STICKER_BY_KEY.has(key)) return null;
  // Ownership is enforced only when the caller supplies the grant context.
  if (accountLevel != null && !ownedKeys.includes(key)) return null;
  return key;
}

/** Resolve a stored key to its emoji, or null (no sticker). Ownership was gated
 *  at write time — render trusts the stored key. */
export function resolveAvatarStickerEmoji(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const key = value.trim().toLowerCase();
  if (!key || key === DEFAULT_AVATAR_STICKER_KEY) return null;
  return STICKER_BY_KEY.get(key)?.emoji ?? null;
}
