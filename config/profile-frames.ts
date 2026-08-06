/**
 * Profile-frame cosmetic — the avatar-ring unlocks on the account ladder
 * (config/account-unlocks.ts): L2 `profile_frame_basic`, L20 prestige intro,
 * L22 `animated_profile_frame`, L25 full prestige, L45 legendary.
 *
 * Same shape as config/name-colors.ts: the stored value is a palette KEY (never
 * a raw style), validated and gated by the account level at which the frame
 * opens. An unknown/legacy key or a frame above the user's level resolves to the
 * default (no ring) — no fabricated cosmetic. Each frame is a decorative ring
 * drawn around the avatar; `ring` is a CSS background (gradient or color) and
 * `animated` marks the rotating conic frames.
 */

import type { LocalizedLabel } from "@/config/season-content";
import { seasonCosmeticsOfKind, type SeasonCosmetic } from "@/config/season-cosmetics";

/** The stored value that means "no frame" — the avatar renders bare. */
export const DEFAULT_PROFILE_FRAME_KEY = "none";

/** Season cosmetics are never opened by account level — only by a grant row. */
const SEASON_UNLOCK_LEVEL = Number.MAX_SAFE_INTEGER;

export interface ProfileFrameSpec {
  /** Stable key persisted in user_profiles.profile_frame; never localized. */
  key: string;
  label: LocalizedLabel;
  /** Account level at which this frame opens (matches account-unlocks). */
  unlockLevel: number;
  /** CSS background painted as the ring (solid color or gradient). */
  ring: string;
  /** Ring thickness in px. */
  width: number;
  /** Optional outer glow (CSS box-shadow value); empty = none. */
  glow: string;
  /** Rotating conic ring when true (the animated/legendary tiers). */
  animated: boolean;
}

/** Ascending by unlock level. `none` is implicit (absence of a frame). */
export const PROFILE_FRAMES: readonly ProfileFrameSpec[] = [
  {
    key: "basic",
    label: { tr: "Çerçeve", en: "Frame" },
    unlockLevel: 2,
    ring: "linear-gradient(135deg, rgba(255,255,255,0.55), rgba(255,255,255,0.15))",
    width: 2,
    glow: "",
    animated: false,
  },
  {
    key: "prestige",
    label: { tr: "Prestij", en: "Prestige" },
    unlockLevel: 20,
    ring: "linear-gradient(135deg, #FFD37A, #F5A623 55%, #B45309)",
    width: 3,
    glow: "0 0 14px rgba(245,166,35,0.45)",
    animated: false,
  },
  {
    key: "animated",
    label: { tr: "Hareketli", en: "Animated" },
    unlockLevel: 22,
    ring: "conic-gradient(from 0deg, #F5A623, #FFE3A3, #F5A623, #B45309, #F5A623)",
    width: 3,
    glow: "0 0 14px rgba(245,166,35,0.4)",
    animated: true,
  },
  {
    key: "prestige_full",
    label: { tr: "Tam Prestij", en: "Full Prestige" },
    unlockLevel: 25,
    ring: "linear-gradient(135deg, #FFE3A3, #F5A623 40%, #B45309 80%, #7C2D12)",
    width: 4,
    glow: "0 0 20px rgba(245,166,35,0.55)",
    animated: false,
  },
  {
    key: "legendary",
    label: { tr: "Efsanevi", en: "Legendary" },
    unlockLevel: 45,
    ring: "conic-gradient(from 0deg, #A78BFA, #38BDF8, #34D399, #F5A623, #FB7185, #A78BFA)",
    width: 4,
    glow: "0 0 22px rgba(167,139,250,0.5)",
    animated: true,
  },
];

/** A season frame/crown cosmetic → a ProfileFrameSpec. Rarity drives the
 *  treatment: common = thin ring, rare = glow, epic/legendary = animated conic;
 *  the crown is the legendary gold hero frame. */
function seasonToFrame(c: SeasonCosmetic): ProfileFrameSpec {
  if (c.kind === "crown") {
    return {
      key: c.key,
      label: c.label,
      unlockLevel: SEASON_UNLOCK_LEVEL,
      ring: "conic-gradient(from 0deg, #FFF0C4, #FFD66B, #F5A623, #B45309, #FFD66B, #FFF0C4)",
      width: 4,
      glow: "0 0 26px rgba(245,166,35,0.65)",
      animated: true,
    };
  }
  const animated = c.animated;
  const width = c.rarity === "legendary" ? 4 : c.rarity === "epic" ? 3 : c.rarity === "rare" ? 3 : 2;
  const glowAlpha = c.rarity === "legendary" ? "aa" : c.rarity === "epic" ? "88" : c.rarity === "rare" ? "55" : "00";
  const glow = glowAlpha === "00" ? "" : `0 0 ${c.rarity === "legendary" ? 20 : 14}px ${c.dark}${glowAlpha}`;
  const ring = animated
    ? `conic-gradient(from 0deg, ${c.light}, ${c.dark}, ${c.light}, ${c.dark})`
    : `linear-gradient(135deg, ${c.light}, ${c.dark} 55%, ${c.dark})`;
  return { key: c.key, label: c.label, unlockLevel: SEASON_UNLOCK_LEVEL, ring, width, glow, animated };
}

/** Season-exclusive frames (frame + crown cosmetics), owned only via a grant. */
export const SEASON_PROFILE_FRAMES: readonly ProfileFrameSpec[] = [
  ...seasonCosmeticsOfKind("frame").map(seasonToFrame),
  ...seasonCosmeticsOfKind("crown").map(seasonToFrame),
];

const ALL_FRAMES: readonly ProfileFrameSpec[] = [...PROFILE_FRAMES, ...SEASON_PROFILE_FRAMES];
const FRAME_BY_KEY = new Map(ALL_FRAMES.map((f) => [f.key, f]));

/** True when a frame `key` is owned: opened by account level OR present in `ownedKeys`. */
function frameOwned(key: string, accountLevel: number, ownedKeys: readonly string[]): boolean {
  const frame = FRAME_BY_KEY.get(key);
  if (!frame) return false;
  return accountLevel >= frame.unlockLevel || ownedKeys.includes(key);
}

/** Frames are season rewards now — account level no longer unlocks them (karar
 *  2026-07-14). Legacy account-earned frames still render (grandfather). */
export function isProfileFrameUnlocked(_accountLevel: number, ownedKeys: readonly string[] = []): boolean {
  return ownedKeys.some((k) => FRAME_BY_KEY.has(k));
}

/** Frames the user owns — the granted season frames (grandfathered legacy account
 *  values still render via resolveProfileFrame, but are not re-offered), ascending. */
export function availableProfileFrames(
  _accountLevel: number,
  ownedKeys: readonly string[] = [],
): ProfileFrameSpec[] {
  const owned = new Set(ownedKeys);
  return ALL_FRAMES.filter((f) => owned.has(f.key));
}

/**
 * Normalize an arbitrary stored/submitted value to a valid frame key or null.
 * Unknown keys, empty strings and the explicit "none" all collapse to null. A
 * frame the user does not own — above their level and not granted — also
 * collapses to null (server-side gate).
 */
export function normalizeProfileFrameKey(
  value: unknown,
  accountLevel?: number,
  ownedKeys: readonly string[] = [],
): string | null {
  if (typeof value !== "string") return null;
  const key = value.trim().toLowerCase();
  if (!key || key === DEFAULT_PROFILE_FRAME_KEY) return null;
  if (!FRAME_BY_KEY.has(key)) return null;
  if (accountLevel != null && !frameOwned(key, accountLevel, ownedKeys)) return null;
  return key;
}

/** Resolve a stored frame key to its spec, or null (no frame). Ownership was
 *  gated at write time, so render trusts the stored key (no level re-gate). */
export function resolveProfileFrame(value: unknown): ProfileFrameSpec | null {
  if (typeof value !== "string") return null;
  const key = value.trim().toLowerCase();
  if (!key || key === DEFAULT_PROFILE_FRAME_KEY) return null;
  return FRAME_BY_KEY.get(key) ?? null;
}
