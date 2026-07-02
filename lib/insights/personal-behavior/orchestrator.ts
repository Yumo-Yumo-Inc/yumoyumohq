/**
 * Personal-behavior orchestrator.
 *
 * Runs the four engines in a defined order, normalises their outputs into
 * a single stream of `DetectedInsight` records, and deduplicates by id.
 *
 * Engines are pure. The orchestrator is also pure: given the same inputs
 * and the same `referenceDate` the output is deterministic. This lets the
 * UI preview the same batch server-side during bootstrap or client-side
 * during a manual refresh without divergence.
 *
 * Important: this module must remain isomorphic. No "use client", no
 * server-only imports, no direct database access. The caller (either the
 * `/api/insights/events` orchestration endpoint or a client-side refresh
 * handler) is responsible for persisting the results via `bulkUpsertInsightEvents`
 * or `upsertInsightEventClient`.
 */

import type { CachedReceiptLineItem } from "@/lib/offline/types";
import type { ReceiptSummary } from "@/lib/insights/types";

import { detectCategoryDrift } from "./category-drift";
import { detectImpulseFingerprint } from "./impulse-fingerprint";
import { detectMicroLeak } from "./micro-leak";
import { detectOwnPriceTrack } from "./own-price-track";
import { detectPastSelf } from "./past-self";
import { detectRewardReflex } from "./reward-reflex";
import { detectRitualLoop } from "./ritual-loop";
import { detectStressPulse } from "./stress-pulse";
import type { BehaviorEngineContext, DetectedInsight } from "./types";

export interface PersonalBehaviorInput {
  receipts: ReceiptSummary[];
  lineItems: CachedReceiptLineItem[];
  context: BehaviorEngineContext;
}

export interface PersonalBehaviorBatch {
  detectedAt: string;
  insights: DetectedInsight[];
  perEngine: Record<string, number>;
}

/**
 * Runs all engines, merges, dedupes, and stamps `detectedAt`.
 *
 * Engines whose required data is missing (e.g. no line items at all)
 * simply produce zero insights — no exception bubbles up.
 */
export function runPersonalBehaviorOrchestrator(
  input: PersonalBehaviorInput
): PersonalBehaviorBatch {
  const { receipts, lineItems, context } = input;
  const detectedAtIso = context.referenceDate.toISOString();

  const ownPrice = safeRun("own_price_track", () =>
    detectOwnPriceTrack(lineItems, context)
  );
  const impulse = safeRun("impulse_fingerprint", () =>
    detectImpulseFingerprint(receipts, context)
  );
  const drift = safeRun("category_drift", () =>
    detectCategoryDrift(receipts, context)
  );
  const pastSelf = safeRun("past_self", () => detectPastSelf(receipts, context));

  // New behavioral lenses (Sprint 1)
  const rewardReflex = safeRun("reward_reflex", () =>
    detectRewardReflex(receipts, context)
  );
  const stressPulse = safeRun("stress_pulse", () =>
    detectStressPulse(receipts, context)
  );
  const microLeak = safeRun("micro_leak", () => detectMicroLeak(receipts, context));
  const ritualLoop = safeRun("ritual_loop", () => detectRitualLoop(receipts, context));

  const merged: DetectedInsight[] = [
    ...ownPrice,
    ...impulse,
    ...drift,
    ...pastSelf,
    ...rewardReflex,
    ...stressPulse,
    ...microLeak,
    ...ritualLoop,
  ];

  const seen = new Map<string, DetectedInsight>();
  for (const insight of merged) {
    if (seen.has(insight.id)) continue;
    seen.set(insight.id, { ...insight, detectedAt: detectedAtIso });
  }

  return {
    detectedAt: detectedAtIso,
    insights: Array.from(seen.values()),
    perEngine: {
      own_price_track: ownPrice.length,
      impulse_fingerprint: impulse.length,
      category_drift: drift.length,
      past_self: pastSelf.length,
      reward_reflex: rewardReflex.length,
      stress_pulse: stressPulse.length,
      micro_leak: microLeak.length,
      ritual_loop: ritualLoop.length,
    },
  };
}

/**
 * Returns `[]` on any engine exception, logs to console so dev can trace.
 * Motors are expected to be pure and defensive, but we still shield the
 * batch so one engine bug doesn't wipe out the whole feed.
 */
function safeRun(
  engineName: string,
  fn: () => DetectedInsight[]
): DetectedInsight[] {
  try {
    return fn();
  } catch (error) {
    console.error(`[personal-behavior] engine '${engineName}' threw:`, error);
    return [];
  }
}

/**
 * Convert an orchestrator output into the shape accepted by the
 * `bulkUpsertInsightEvents` server helper / `/api/insights/events` POST.
 *
 * The id stays the same so re-runs update (not duplicate) existing rows.
 * `state` is always `detected` — consumers must not flip this during
 * orchestration; user interactions own the downstream state machine.
 */
export function toInsightEventUpsertInputs(batch: PersonalBehaviorBatch) {
  return batch.insights.map((insight) => ({
    id: insight.id,
    kind: insight.kind,
    state: "detected" as const,
    title: insight.title,
    summary: insight.summary,
    confidence: insight.confidence,
    monetaryImpact: insight.monetaryImpact,
    currency: insight.currency,
    payload: {
      ...insight.payload,
      suggestedCommitment: insight.suggestedCommitment ?? null,
    },
    detectedAt: insight.detectedAt ?? batch.detectedAt,
  }));
}
