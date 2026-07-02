import type { OCRLine } from "../../receipt/types";
import type { CountryConfig } from "@/lib/country/base";
import { parseLooseNumber } from "./parse-number";
import { preprocessOCRLines } from "./preprocess";
import { round2, extractAmountsFromText } from "./helpers";

const SERVICE_IGNORE_PATTERNS = [
  /suggested\s+(tip|gratuity)/i,
  /gratuity\s+not\s+included/i,
];

export function extractServiceCharge(
  lines: OCRLine[],
  totalAmount: number,
  countryConfig?: CountryConfig
): { value: number; confidence: number; sourceLine?: number } {
  const processedLines = preprocessOCRLines(lines);
  const serviceKeywords = countryConfig?.labels.service || ["SERVICE", "SERVICE CHARGE", "SERVICE FEE"];
  const servicePatterns: RegExp[] = [];

  for (const keyword of serviceKeywords) {
    const escapedKeyword = keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    servicePatterns.push(
      new RegExp(`${escapedKeyword}[\\s:]+([\\d,.]+)`, "i"),
      new RegExp(`${escapedKeyword}[\\s]+([\\d,.]+)`, "i"),
      new RegExp(`${escapedKeyword}[\\s(]*[\\d.]+%[\\s)]*[\\s:]*([\\d,.]+)`, "i")
    );
  }

  const searchStart = Math.max(0, processedLines.length - 15);
  for (let i = processedLines.length - 1; i >= searchStart; i--) {
    const line = processedLines[i];
    const text = line.text;

    if (SERVICE_IGNORE_PATTERNS.some((pattern) => pattern.test(text))) {
      continue;
    }

    const hasServiceKeyword = serviceKeywords.some((keyword) => new RegExp(keyword, "i").test(text));
    for (const pattern of servicePatterns) {
      const match = text.match(pattern);
      if (!match?.[1]) continue;

      const amount = parseLooseNumber(match[1].trim(), countryConfig);
      if (
        amount != null &&
        !isNaN(amount) &&
        amount > 0 &&
        amount < totalAmount &&
        amount < totalAmount * 0.2
      ) {
        return {
          value: round2(amount),
          confidence: 0.85,
          sourceLine: line.lineNo,
        };
      }
    }

    if (!hasServiceKeyword || i >= processedLines.length - 1) continue;

    const nextLine = processedLines[i + 1];
    if (!nextLine || SERVICE_IGNORE_PATTERNS.some((pattern) => pattern.test(nextLine.text))) {
      continue;
    }

    const amounts = extractAmountsFromText(nextLine.text, countryConfig);
    for (const amount of amounts) {
      if (amount.value > 0 && amount.value < totalAmount && amount.value < totalAmount * 0.2) {
        return {
          value: round2(amount.value),
          confidence: 0.8,
          sourceLine: nextLine.lineNo,
        };
      }
    }
  }

  return { value: 0, confidence: 0 };
}
