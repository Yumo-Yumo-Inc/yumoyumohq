/**
 * Proof-of-Expense seal cosmetic — a season-exclusive stamp shown on the user's
 * VERIFIED receipts (karar 2026-07-09). Unlike the other cosmetic families this
 * one has NO account-ladder base set: seals exist only as season rewards, owned
 * via a grant row (user_cosmetic_grants), never from account level. It ties the
 * battle pass to Yumo Yumo's core "proof of expense" idea — a mark you earn and
 * stamp on the receipts you proved.
 */

import type { LocalizedLabel } from "@/config/season-content";
import { seasonCosmeticsOfKind, type SeasonCosmetic } from "@/config/season-cosmetics";

/** The stored value that means "no seal". */
export const DEFAULT_SEAL_KEY = "none";

export interface ProofSeal {
  /** Stable key persisted in user_profiles.proof_seal; never localized. */
  key: string;
  label: LocalizedLabel;
  /** Seal colour on the dark theme. */
  dark: string;
  /** Seal colour on the light theme. */
  light: string;
  /** The seal's bespoke SVG glyph (falls back to the generic seal). */
  glyph: string;
}

function seasonToSeal(c: SeasonCosmetic): ProofSeal {
  return { key: c.key, label: c.label, dark: c.dark, light: c.light, glyph: c.glyph ?? "seal" };
}

/** Season-exclusive seals — the only seals there are. */
export const SEASON_PROOF_SEALS: readonly ProofSeal[] = seasonCosmeticsOfKind("seal").map(seasonToSeal);

const SEAL_BY_KEY = new Map(SEASON_PROOF_SEALS.map((s) => [s.key, s]));

/** True when the picker should open — i.e. the user owns any season seal. */
export function isSealUnlocked(_accountLevel: number, ownedKeys: readonly string[] = []): boolean {
  return ownedKeys.length > 0;
}

/** Seals the user owns (granted only). */
export function availableSeals(_accountLevel: number, ownedKeys: readonly string[] = []): ProofSeal[] {
  const owned = new Set(ownedKeys);
  return SEASON_PROOF_SEALS.filter((s) => owned.has(s.key));
}

/**
 * Normalize a stored/submitted value to a valid seal key or null. Unknown, empty
 * and "none" collapse to null; a seal the user does not own (not granted) also
 * collapses to null (server gate).
 */
export function normalizeSealKey(
  value: unknown,
  _accountLevel?: number,
  ownedKeys: readonly string[] = [],
): string | null {
  if (typeof value !== "string") return null;
  const key = value.trim().toLowerCase();
  if (!key || key === DEFAULT_SEAL_KEY) return null;
  if (!SEAL_BY_KEY.has(key)) return null;
  if (_accountLevel != null && !ownedKeys.includes(key)) return null;
  return key;
}

/** Resolve a stored seal key to its spec (colour), or null (no seal). Ownership
 *  was gated at write time — render trusts the stored key. */
export function resolveSeal(value: unknown): ProofSeal | null {
  if (typeof value !== "string") return null;
  const key = value.trim().toLowerCase();
  if (!key || key === DEFAULT_SEAL_KEY) return null;
  return SEAL_BY_KEY.get(key) ?? null;
}
