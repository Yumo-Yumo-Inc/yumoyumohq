/**
 * Narrow, stable projection of POST /api/receipt/analyze responses
 * for golden regression compares. Does not implement pipeline logic.
 */

import { isDeepStrictEqual } from "node:util";

export type AnalyzeRegressionSlice = {
  receiptId: string | null;
  status: string | null;
  merchant: {
    name: string | null;
    category: string | null;
    country: string | null;
  } | null;
  detectedCountry: string | null;
  llmSource: string | null;
  total: number | null;
  currency: string | null;
  symbol: string | null;
  vatAmount: number | null;
  vatRate: number | null;
  reward: {
    raw: number | null;
    final: number | null;
    ryumo: number | null;
    token: string | null;
    verifiedThankYou: boolean | null;
  } | null;
  duplicate: {
    isDuplicate: boolean;
    duplicateReceiptId: string | null;
    duplicateType: string | null;
    duplicateUsername: string | null;
  };
  fraud: {
    fraudScore: number | null;
    riskLevel: string | null;
    isValid: boolean | null;
    warningsCount: number | null;
    checksKeys: string[];
  } | null;
  riskScore: number | null;
  rejected: boolean | null;
  error: string | null;
};

function asRecord(v: unknown): Record<string, unknown> | null {
  if (v && typeof v === "object" && !Array.isArray(v)) return v as Record<string, unknown>;
  return null;
}

function num(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  return null;
}

function str(v: unknown): string | null {
  if (typeof v === "string") return v;
  return null;
}

function bool(v: unknown): boolean | null {
  if (typeof v === "boolean") return v;
  return null;
}

function unwrapStreamDone(body: Record<string, unknown>): Record<string, unknown> {
  if (body.type === "done" && typeof body === "object") {
    const { type: _t, ...rest } = body;
    return rest as Record<string, unknown>;
  }
  return body;
}

export function extractAnalyzeRegressionSlice(raw: unknown): AnalyzeRegressionSlice {
  const root = asRecord(raw);
  if (!root) {
    return emptySlice();
  }
  const o = unwrapStreamDone(root);

  const merchant = asRecord(o.merchant);
  const pricing = asRecord(o.pricing);
  const extraction = asRecord(o.extraction);
  const extTotal = extraction ? asRecord(extraction.total) : null;
  const extVat = extraction ? asRecord(extraction.vat) : null;
  const verification = asRecord(o.verification);
  const reward = asRecord(o.reward);
  const fraud = asRecord(o.fraud);

  const totalPaid = num(pricing?.totalPaid);
  const extTotalVal = num(extTotal?.value);
  const total = totalPaid ?? extTotalVal;

  const vatAmount = num(pricing?.vatAmount) ?? num(extVat?.value);
  const vatRate = num(pricing?.vatRate) ?? num(extVat?.rate);

  const currency = str(pricing?.currency) ?? str(extTotal?.currency);
  const symbol = str(pricing?.symbol);

  const merchantName = str(merchant?.name);
  const merchantCategory = str(merchant?.category);
  const merchantCountry = str(merchant?.country);
  const hasMerchant =
    merchantName != null || merchantCategory != null || merchantCountry != null;

  const dupId =
    str(verification?.duplicateReceiptId) ??
    str(o.existingReceiptId) ??
    str(o.duplicateReceiptId);
  const dupType = str(verification?.duplicateType) ?? str(o.duplicateType);
  const dupUser = str(verification?.duplicateUsername) ?? str(o.existingUsername);
  let isDup = bool(verification?.isDuplicate) === true;
  if (!isDup && dupId) isDup = true;

  const fraudScore = num(fraud?.fraudScore);
  const riskLevel = str(fraud?.riskLevel);
  const fraudValid = bool(fraud?.isValid);
  const warnings = fraud?.warnings;
  const warningsCount = Array.isArray(warnings) ? warnings.length : null;
  const checks = asRecord(fraud?.checks);
  const checksKeys = checks ? Object.keys(checks).sort() : [];

  const hasFraudBlock =
    fraudScore != null || riskLevel != null || fraudValid != null || warningsCount != null || checksKeys.length > 0;

  return {
    receiptId: str(o.receiptId),
    status: str(o.status),
    merchant: hasMerchant
      ? {
          name: merchantName,
          category: merchantCategory,
          country: merchantCountry,
        }
      : null,
    detectedCountry: str(o.detectedCountry) ?? merchantCountry,
    llmSource: str(o.llmSource),
    total,
    currency,
    symbol,
    vatAmount,
    vatRate,
    reward: reward
      ? {
          raw: num(reward.raw),
          final: num(reward.final),
          ryumo: num(reward.ryumo),
          token: str(reward.token),
          verifiedThankYou: bool(reward.verifiedThankYou),
        }
      : null,
    duplicate: {
      isDuplicate: isDup,
      duplicateReceiptId: dupId,
      duplicateType: dupType,
      duplicateUsername: dupUser,
    },
    fraud: hasFraudBlock
      ? {
          fraudScore,
          riskLevel,
          isValid: fraudValid,
          warningsCount,
          checksKeys,
        }
      : null,
    riskScore: num(o.riskScore),
    rejected: bool(o.rejected),
    error: str(o.error),
  };
}

function emptySlice(): AnalyzeRegressionSlice {
  return {
    receiptId: null,
    status: null,
    merchant: null,
    detectedCountry: null,
    llmSource: null,
    total: null,
    currency: null,
    symbol: null,
    vatAmount: null,
    vatRate: null,
    reward: null,
    duplicate: {
      isDuplicate: false,
      duplicateReceiptId: null,
      duplicateType: null,
      duplicateUsername: null,
    },
    fraud: null,
    riskScore: null,
    rejected: null,
    error: null,
  };
}

export function regressionSliceToJson(slice: AnalyzeRegressionSlice): string {
  return `${JSON.stringify(slice, null, 2)}\n`;
}

export function parseGoldenJson(text: string): AnalyzeRegressionSlice {
  const parsed = JSON.parse(text) as unknown;
  const rec = asRecord(parsed);
  if (!rec) throw new Error("Golden file must be a JSON object");
  return rec as unknown as AnalyzeRegressionSlice;
}

export function regressionSliceDiff(
  expected: AnalyzeRegressionSlice,
  actual: AnalyzeRegressionSlice
): string | null {
  if (isDeepStrictEqual(expected, actual)) return null;
  return [
    "Regression slice mismatch.",
    "--- golden",
    regressionSliceToJson(expected).trimEnd(),
    "--- extracted from actual.json",
    regressionSliceToJson(actual).trimEnd(),
  ].join("\n");
}
