/**
 * Shared types for the personal-behavior insight engines.
 *
 * Each engine is a pure function that takes the user's own cached data and
 * returns a list of `DetectedInsight` records. The orchestrator normalises,
 * deduplicates, and finally either emits `insight_events` rows (server) or
 * renders cards directly (client, during preview).
 *
 * Important principles (reminders for future engine authors):
 *
 *   1. No cross-user comparisons. Ever. Insights must be purely self-relative
 *      (this user vs. their own past) — we don't have the cohort size to
 *      generalise and the user pushed back hard against any such framing.
 *
 *   2. No hallucinated savings. Every `monetaryImpact` must be derived from
 *      observed data, not speculated. If we can't compute a confident delta
 *      we leave it null; the UI hides "X TL saved" chips in that case.
 *
 *   3. Deterministic confidence. Two runs on the same input must yield the
 *      same `confidence`. Engines read confidence from sample-size +
 *      variance + recency, never randomised.
 *
 *   4. Minimum sample guards. A "never-again" category call with 2 receipts
 *      is noise, not insight. Each engine declares its own thresholds.
 */

import type { CommitmentKind, InsightEventKind } from "@/lib/offline/types";

/**
 * Normalised output from any behavior engine. The orchestrator accumulates
 * these and translates them into `insight_events` rows + optional UI
 * `CommitmentTemplate` suggestions.
 */
export interface DetectedInsight {
  /**
   * Stable identifier so re-runs don't duplicate cards. The orchestrator uses
   * `<kind>:<canonicalKey>` (e.g. `own_price_track:canonical_name=sut_1l`).
   */
  id: string;
  kind: InsightEventKind;
  title: string;
  /** One-sentence body; shown as the card subtitle. */
  summary: string;
  /** 0..1, see principle #3. */
  confidence: number;
  /**
   * Signed monetary impact in the user's local currency when determinable.
   * Positive = money the user is losing / likely to lose if they don't act;
   * negative = a detected windfall. `null` when we can't compute it.
   */
  monetaryImpact: number | null;
  currency: string | null;
  /**
   * Engine-specific evidence. UI components consume this via a discriminated
   * union on `kind`. Keep it JSON-serialisable.
   */
  payload: Record<string, unknown>;
  /**
   * Timestamp the orchestrator stamps when it detects the insight. Engines
   * should not set this; the orchestrator provides a pinned reference date.
   */
  detectedAt?: string;
  /**
   * Optional commitment template that the UI offers as the primary action.
   * When the user accepts, this becomes a commitment row.
   */
  suggestedCommitment?: CommitmentTemplate | null;
}

/**
 * A proposed commitment shape that the user can accept directly from an
 * insight card. All fields map 1:1 onto `CommitmentUpsertClientInput`.
 */
export interface CommitmentTemplate {
  kind: CommitmentKind;
  title: string;
  description?: string | null;
  params?: Record<string, unknown>;
  target?: number | null;
  currency?: string | null;
  startsAt?: string | null;
  endsAt?: string | null;
}

/**
 * Shared context passed to every engine by the orchestrator.
 */
export interface BehaviorEngineContext {
  /** Pinned reference date — see the Numbers Stabilization pattern. */
  referenceDate: Date;
  /** Preferred currency for monetary impact formatting. */
  currency: string;
  /** User's locale for any surfaced copy (engines should still produce
   *  language-agnostic payloads where possible; final copy lives in the UI). */
  locale?: "tr" | "en";
}
