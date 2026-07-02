import type { ReceiptAnalysis, ReceiptFlags } from "@/lib/receipt/types";

export const PUBLIC_RECEIPT_REJECTION_MESSAGE =
  "This document doesn't appear to be a valid receipt.";
export const PUBLIC_ANALYZE_FAILURE_MESSAGE = "Failed to analyze receipt";
/**
 * Canonical message thrown when every vision provider (Gemini + Qwen) fails
 * transiently (timeout / connection error). It is a SAFE public message so it
 * reaches the user verbatim, where translateApiError maps it to errors.api.serviceBusy.
 */
export const VISION_PROVIDERS_BUSY_MESSAGE =
  "The service is busy right now. Please try again in a minute or two.";

const SAFE_PUBLIC_MESSAGES = new Set<string>([
  "Unauthorized",
  "Receipt not found",
  "Please select your country first",
  "Total amount could not be reliably extracted",
  "Receipt country does not match your account country",
  PUBLIC_RECEIPT_REJECTION_MESSAGE,
  PUBLIC_ANALYZE_FAILURE_MESSAGE,
  VISION_PROVIDERS_BUSY_MESSAGE,
]);

const RECEIPT_REJECTION_PATTERNS = [
  /screenshot/i,
  /exif/i,
  /background/i,
  /handwritten/i,
  /merchant not found/i,
  /timestamp/i,
  /tamper/i,
  /edited/i,
  /address/i,
  /document identifier/i,
  /terminal/i,
  /infrastructure/i,
  /insufficient receipt structure/i,
  /no text detected/i,
  /bank\/credit card statement/i,
  /not a valid receipt/i,
  /does not appear to be a receipt/i,
  /doesn't appear to be a valid receipt/i,
];

const SERVER_ONLY_RECEIPT_FIELDS = [
  "fraud",
  "riskScore",
  "pipelineLog",
  "visionRawJson",
  "blobFilename",
  "blobUrl",
  "rejectionInfo",
  "gptFullReceiptResult",
  "geminiLineItems",
] as const;

function sanitizeFlags(flags: ReceiptFlags | undefined): ReceiptFlags | undefined {
  if (!flags) return flags;

  const next: ReceiptFlags = { ...flags };
  if (Array.isArray(flags.rejectionReasons) && flags.rejectionReasons.length > 0) {
    next.rejectionReasons = [PUBLIC_RECEIPT_REJECTION_MESSAGE];
  }
  delete next.gateConfidence;
  delete next.docType;
  return next;
}

export function toPublicAnalyzeMessage(
  message: string | undefined | null,
  options?: { fallback?: string; treatAsRejection?: boolean }
): string {
  const fallback = options?.fallback ?? PUBLIC_ANALYZE_FAILURE_MESSAGE;
  const trimmed = typeof message === "string" ? message.trim() : "";
  if (!trimmed) return fallback;

  if (SAFE_PUBLIC_MESSAGES.has(trimmed)) {
    return trimmed;
  }

  if (/total amount could not be reliably extracted/i.test(trimmed)) {
    return "Total amount could not be reliably extracted";
  }

  if (
    options?.treatAsRejection ||
    RECEIPT_REJECTION_PATTERNS.some((pattern) => pattern.test(trimmed))
  ) {
    return PUBLIC_RECEIPT_REJECTION_MESSAGE;
  }

  return fallback;
}

export function sanitizeReceiptForClient<T extends Partial<ReceiptAnalysis>>(
  receipt: T,
  options?: { isAdmin?: boolean }
): T {
  if (!receipt || options?.isAdmin) {
    return receipt;
  }

  const next = { ...(receipt as Record<string, unknown>) };
  for (const key of SERVER_ONLY_RECEIPT_FIELDS) {
    delete next[key];
  }

  if (receipt.flags) {
    next.flags = sanitizeFlags(receipt.flags);
  }

  if (receipt.qualityHonor) {
    next.qualityHonor = {
      level: receipt.qualityHonor.level,
      honorDelta: receipt.qualityHonor.honorDelta,
      rewardPct: receipt.qualityHonor.rewardPct,
      honorBonusApplied: receipt.qualityHonor.honorBonusApplied,
      reasons: [],
      securityReasons: [],
    };
  }

  return next as T;
}

export function sanitizeReceiptsForClient<T extends Partial<ReceiptAnalysis>>(
  receipts: T[],
  options?: { isAdmin?: boolean }
): T[] {
  if (options?.isAdmin) {
    return receipts;
  }

  return receipts.map((receipt) => sanitizeReceiptForClient(receipt, options));
}

export function mergeProtectedReceiptFields(
  incoming: ReceiptAnalysis,
  existing?: ReceiptAnalysis | null
): ReceiptAnalysis {
  if (!existing) {
    return incoming;
  }

  const merged: ReceiptAnalysis = {
    ...existing,
    ...incoming,
    flags: {
      ...(existing.flags ?? incoming.flags ?? { needsLLM: false, reasons: [] }),
      ...(incoming.flags ?? {}),
    },
  };

  for (const key of SERVER_ONLY_RECEIPT_FIELDS) {
    const existingValue = (existing as unknown as Record<string, unknown>)[key];
    if (existingValue !== undefined) {
      (merged as unknown as Record<string, unknown>)[key] = existingValue;
    }
  }

  if (existing.qualityHonor !== undefined) {
    merged.qualityHonor = existing.qualityHonor;
  }

  if (existing.flags?.rejectionReasons !== undefined) {
    merged.flags.rejectionReasons = existing.flags.rejectionReasons;
  }
  if (existing.flags?.gateConfidence !== undefined) {
    merged.flags.gateConfidence = existing.flags.gateConfidence;
  }
  if (existing.flags?.docType !== undefined) {
    merged.flags.docType = existing.flags.docType;
  }

  return merged;
}
