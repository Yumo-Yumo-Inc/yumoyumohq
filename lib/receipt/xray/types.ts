/**
 * Receipt X-Ray behavioral layer types
 *
 * Pure heuristic model — no LLM. Computed from receipt metadata,
 * category, time, hidden-cost ratios, and merchant signals.
 */

export type XRayLayer = "need" | "mood" | "inflation" | "social" | "hiddenCost";

export interface XRaySignal {
  key: string;
  params?: Record<string, string | number>;
}

export interface XRayMessage {
  key: string;
  params?: Record<string, string | number>;
}

export interface XRayLayerResult {
  layer: XRayLayer;
  score: number; // 0-100
  label: string; // i18n key
  descriptionKey: string; // i18n key — panel resolves via t()
  color: string; // tailwind color token e.g. "emerald", "amber", "rose", "indigo", "violet"
  signals: XRaySignal[];
}

export interface ReceiptXRay {
  layers: XRayLayerResult[];
  dominantLayer: XRayLayer;
  narrative: XRayMessage;
  oneLineRead: XRayMessage;
  merchantPersona: string; // e.g. "workspace-hunter", "evening-rewarder"
}
