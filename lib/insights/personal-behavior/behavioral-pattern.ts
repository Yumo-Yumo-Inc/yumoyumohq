/**
 * BehavioralPattern — new behavioral atlas data model.
 *
 * Builds on top of the existing PatternNarrative. The old 4 lenses map onto
 * this model; new lenses produce BehavioralPattern directly.
 *
 * Sprint 1: engines start returning this type.
 * Sprint 2: the UI consumes this type.
 */

import type { InsightEventKind } from "@/lib/offline/types";

/** Behavioral lenses — extensible string union. */
export type BehavioralLens =
  // Existing 4 lenses (backward compatible)
  | "impulse_fingerprint"
  | "own_price_track"
  | "category_drift"
  | "past_self"
  // New psychological lenses
  | "reward_reflex"
  | "stress_pulse"
  | "friction_escape"
  | "self_care_vs_repair"
  // New sociological lenses
  | "social_gravity"
  | "city_pressure"
  | "lifestyle_drift"
  // New financial lenses
  | "inflation_blindspot"
  | "micro_leak"
  | "substitution_intelligence"
  | "budget_compression"
  // New identity / ritual lenses
  | "identity_spend"
  | "ritual_loop"
  | "past_self_dialogue";

export type FinancialImpactType =
  | "leak"
  | "pressure"
  | "saving"
  | "inflation"
  | "substitution";

export type PatternVisualType =
  | "cashflow_river"
  | "habit_constellation"
  | "weather_map"
  | "autopilot_loop"
  | "receipt_xray"
  | "standard"; // fallback — classic card

/** A single evidence point. */
export interface BehavioralEvidence {
  label: string;
  value: string;
  /** 0..1, strength of the evidence. */
  strength: number;
}

/** Suggested micro-experiment for the user. */
export interface SuggestedExperiment {
  title: string;
  durationDays: number;
  action: string;
  successMetric: string;
}

export interface EmotionalFrame {
  label: string;
  /** 0..1, intensity. */
  intensity: number;
  explanation: string;
}

export interface FinancialFrame {
  impactAmount: number;
  impactType: FinancialImpactType;
  explanation: string;
}

export interface SociologicalFrame {
  label: string;
  explanation: string;
}

/** Behavioral intelligence pattern — rich, evidenced, multi-layered. */
export interface BehavioralPattern {
  id: string;
  lens: BehavioralLens;

  /** Human-sounding title. */
  title: string;
  /** One-sentence behavioral read. */
  oneLineRead: string;

  emotionalFrame: EmotionalFrame;
  financialFrame: FinancialFrame;
  sociologicalFrame: SociologicalFrame;

  evidence: BehavioralEvidence[];
  counterEvidence: string[];

  /** 0..1, overall confidence. */
  confidence: number;
  riskOfMisread: "low" | "medium" | "high";

  visualType: PatternVisualType;

  userCorrectionOptions: string[];

  suggestedExperiment: SuggestedExperiment;

  // --- Backward-compatibility fields (for the old 4 lenses) ---

  /** Maps to the old InsightEventKind. Same as itself for new lenses. */
  legacyKind?: InsightEventKind;

  /** Fields carried over from the old PatternNarrative (transition period). */
  legacyNarrative?: {
    eyebrow: string;
    headline: string;
    read: string;
    humanLayer: string;
    socialLayer: string;
    support: string;
    primaryAction: string;
    secondaryAction: string;
    proof: Array<{ label: string; value: string; tone?: "good" | "warn" | "muted" }>;
    confidenceLabel: string;
  };
}

/**
 * Converts the old CachedInsightEventRecord to BehavioralPattern.
 * Sprint 1 maps the old 4 lenses onto the new model via this function.
 */
export function eventToBehavioralPattern(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  _event: any
): BehavioralPattern {
  // TODO: implement in Sprint 1.
  // Placeholder for now — minimal return to satisfy compilation.
  return {
    id: "placeholder",
    lens: "impulse_fingerprint",
    title: "Henüz dönüştürülmedi",
    oneLineRead: "Sprint 1'de eski event'ler yeni modele map edilecek.",
    emotionalFrame: { label: "nötr", intensity: 0, explanation: "" },
    financialFrame: { impactAmount: 0, impactType: "leak", explanation: "" },
    sociologicalFrame: { label: "nötr", explanation: "" },
    evidence: [],
    counterEvidence: [],
    confidence: 0.5,
    riskOfMisread: "high",
    visualType: "standard",
    userCorrectionOptions: ["Bana uymuyor", "Eksik okuma", "Bu bana değil"],
    suggestedExperiment: {
      title: "İzlemeye devam et",
      durationDays: 7,
      action: "Normal harcama düzenini koru",
      successMetric: "Daha fazla fiş",
    },
  };
}
