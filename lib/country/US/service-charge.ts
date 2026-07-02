import type { ReceiptContext } from "@/app/api/receipt/analyze/types";
import type { CountryServiceChargeResult } from "../base";
import { US_CONFIG } from "../US.config";
import { extractUsSummaryBlock } from "./summary-block";
import { preprocessOCRLines } from "@/lib/extractors/robust/preprocess";
import { extractAmountsFromText, round2 } from "@/lib/extractors/robust/helpers";

const US_SERVICE_LABEL_PATTERN = /\bservice\s*charge|service\s*fee|gratuity\b/i;
const US_SERVICE_IGNORE_PATTERN =
  /suggested\s*(?:tip|gratuity)|tip\s*guide|gratuity\s+not\s+included|suggestedtip|ggested\s*tip/i;

function isPlausibleServiceCharge(amount: number, total: number): boolean {
  if (amount <= 0) return false;
  if (total <= 0) return amount < 100;
  return amount < total && amount <= total * 0.3;
}

function extractExplicitServiceCharge(
  lines: ReceiptContext["ocrLines"],
  total: number
): CountryServiceChargeResult {
  const searchStart = Math.max(0, lines.length - 20);

  for (let i = lines.length - 1; i >= searchStart; i--) {
    const text = lines[i].text.trim();
    if (US_SERVICE_IGNORE_PATTERN.test(text)) continue;
    if (!US_SERVICE_LABEL_PATTERN.test(text)) continue;

    const sameLineAmounts = extractAmountsFromText(text, US_CONFIG)
      .map(({ value }) => round2(value))
      .filter((amount) => isPlausibleServiceCharge(amount, total));
    if (sameLineAmounts.length > 0) {
      return {
        value: sameLineAmounts[sameLineAmounts.length - 1],
        confidence: 0.9,
        sourceLine: lines[i].lineNo,
      };
    }

    for (let offset = 1; offset <= 4; offset++) {
      const nextLine = lines[i + offset];
      if (!nextLine) break;
      if (US_SERVICE_IGNORE_PATTERN.test(nextLine.text)) continue;
      if (US_SERVICE_LABEL_PATTERN.test(nextLine.text)) break;

      const nextAmounts = extractAmountsFromText(nextLine.text, US_CONFIG)
        .map(({ value }) => round2(value))
        .filter((amount) => isPlausibleServiceCharge(amount, total));
      if (nextAmounts.length > 0) {
        return {
          value: nextAmounts[nextAmounts.length - 1],
          confidence: 0.85,
          sourceLine: nextLine.lineNo,
        };
      }
    }
  }

  return { value: 0, confidence: 0 };
}

export function extractUsServiceCharge(
  context: ReceiptContext
): CountryServiceChargeResult {
  const total = context.totalPaid || 0;
  const processedLines = preprocessOCRLines(context.ocrLines);

  const summaryBlock =
    extractUsSummaryBlock(context.ocrLines, US_CONFIG) ??
    extractUsSummaryBlock(processedLines, US_CONFIG);
  const summaryService = summaryBlock?.service;

  if (summaryService != null && isPlausibleServiceCharge(summaryService, total)) {
    return {
      value: summaryService,
      confidence: 0.92,
    };
  }

  const rawMatch = extractExplicitServiceCharge(context.ocrLines, total);
  if (rawMatch.value > 0) {
    return rawMatch;
  }

  return extractExplicitServiceCharge(processedLines, total);
}
