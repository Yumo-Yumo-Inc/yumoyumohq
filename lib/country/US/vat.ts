import type { ReceiptContext } from "@/app/api/receipt/analyze/types";
import type { CountryVatResult } from "../base";
import { US_CONFIG } from "../US.config";
import { extractUsSummaryBlock } from "./summary-block";
import { extractVATRobust } from "@/lib/extractors/robust/extract-vat-robust";
import { preprocessOCRLines } from "@/lib/extractors/robust/preprocess";
import { extractAmountsFromText, round2 } from "@/lib/extractors/robust/helpers";
import { parseLooseNumber } from "@/lib/extractors/robust/parse-number";

const US_TAX_LABEL_PATTERN =
  /\b(?:sales\s*tax|tax\s*\d*|tax\(\d+(?:\.\d+)?%\)|tax)\b/i;
const US_TAX_IGNORE_PATTERN =
  /\btaxable\b|\btax\s+id\b|\bein\b|suggested\s*(?:tip|gratuity)|tip\s*guide|gratuity\s+not\s+included/i;
const US_TAX_ABBREVIATION_PATTERN = /\btxtl\b|\btax\s*total\b/i;

function parseUsAmountTokens(text: string): number[] {
  const values = extractAmountsFromText(text, US_CONFIG)
    .map(({ value }) => round2(value))
    .filter((value) => value >= 0);

  for (const match of text.matchAll(/(^|[^\d])(\.\d{2})(?!\d)/g)) {
    const parsed = parseLooseNumber(match[2], US_CONFIG);
    if (parsed != null && parsed >= 0) {
      values.push(round2(parsed));
    }
  }

  return values;
}

function extractTaxRate(text: string): number | undefined {
  const match = text.match(/(\d{1,2}(?:\.\d+)?)\s*%/);
  if (!match) return undefined;

  const rate = parseFloat(match[1]) / 100;
  return rate > 0 && rate < 0.25 ? rate : undefined;
}

function isPlausibleUsTaxAmount(amount: number, total: number): boolean {
  if (amount <= 0) return false;
  if (total <= 0) return amount < 100;
  return amount < total && amount <= total * 0.25;
}

function extractUsTaxAmountFromLines(
  lines: ReceiptContext["ocrLines"],
  total: number
): { amount: number; rate?: number; sourceLine?: number } | null {
  const searchStart = Math.max(0, lines.length - 25);

  for (let i = searchStart; i < lines.length; i++) {
    const text = lines[i].text.trim();
    if (US_TAX_IGNORE_PATTERN.test(text)) continue;
    if (!US_TAX_LABEL_PATTERN.test(text)) continue;

    const prevLine = lines[i - 1];
    const nextLine = lines[i + 1];
    if (
      prevLine &&
      /^[\s$.\d,-]+$/.test(prevLine.text.trim()) &&
      nextLine &&
      /\btotal\b/i.test(nextLine.text)
    ) {
      const prevAmounts = parseUsAmountTokens(prevLine.text).filter((amount) =>
        isPlausibleUsTaxAmount(amount, total)
      );
      if (prevAmounts.length > 0) {
        return {
          amount: prevAmounts[prevAmounts.length - 1],
          sourceLine: prevLine.lineNo,
        };
      }
    }
  }

  for (let i = lines.length - 1; i >= searchStart; i--) {
    const text = lines[i].text.trim();
    if (US_TAX_IGNORE_PATTERN.test(text)) continue;
    if (!US_TAX_LABEL_PATTERN.test(text)) continue;

    const rate = extractTaxRate(text);
    const isBareTaxOrdinalLabel =
      /^tax\s*\d*\s*:?\s*$/i.test(text) || /^sales\s*tax\s*\d*\s*:?\s*$/i.test(text);
    const sameLineAmounts = parseUsAmountTokens(text).filter((amount) => {
      if (isBareTaxOrdinalLabel) return false;
      if (!isPlausibleUsTaxAmount(amount, total)) return false;
      if (Math.abs(amount - total) <= 0.01) return false;
      if (/\d+(?:\.\d+)?\s*%/.test(text) && Math.abs(amount - (rate ?? 0) * 100) <= 0.01) {
        return false;
      }
      return true;
    });

    if (sameLineAmounts.length > 0) {
      return {
        amount: sameLineAmounts[sameLineAmounts.length - 1],
        rate,
        sourceLine: lines[i].lineNo,
      };
    }

    for (let offset = 1; offset <= 4; offset++) {
      const nextLine = lines[i + offset];
      if (!nextLine) break;
      if (US_TAX_IGNORE_PATTERN.test(nextLine.text)) continue;
      if (US_TAX_LABEL_PATTERN.test(nextLine.text)) break;

      const nextAmounts = parseUsAmountTokens(nextLine.text).filter((amount) =>
        isPlausibleUsTaxAmount(amount, total)
      );
      if (nextAmounts.length > 0) {
        return {
          amount: nextAmounts[nextAmounts.length - 1],
          rate,
          sourceLine: nextLine.lineNo,
        };
      }
    }

    for (let offset = 1; offset <= 2; offset++) {
      const prevLine = lines[i - offset];
      if (!prevLine) break;
      if (US_TAX_IGNORE_PATTERN.test(prevLine.text)) continue;

      const prevAmounts = parseUsAmountTokens(prevLine.text).filter((amount) =>
        isPlausibleUsTaxAmount(amount, total)
      );
      if (prevAmounts.length > 0 && /^[^\da-zA-Z$]*[$.]?\d/.test(prevLine.text.trim())) {
        return {
          amount: prevAmounts[prevAmounts.length - 1],
          rate,
          sourceLine: prevLine.lineNo,
        };
      }
    }
  }

  return null;
}

function inferTaxFromVisibleLineItems(
  lines: ReceiptContext["ocrLines"],
  total: number
): number | null {
  const summaryIndex = lines.findIndex((line) =>
    /\b(?:txtl|totl|total|cash|change|chng)\b/i.test(line.text)
  );
  if (summaryIndex <= 0) return null;

  const itemSum = lines
    .slice(0, summaryIndex)
    .flatMap((line) => {
      if (!/^[\s$.\d,-]+$/.test(line.text.trim())) return [];
      return parseUsAmountTokens(line.text);
    })
    .filter((amount) => amount > 0 && amount < total)
    .reduce((sum, amount) => round2(sum + amount), 0);

  const tax = round2(total - itemSum);
  if (tax > 0 && tax <= total * 0.2) {
    return tax;
  }

  return null;
}

function inferRateFromAmount(amount: number, total: number): number | undefined {
  if (amount <= 0 || total <= amount) return undefined;

  const pretax = total - amount;
  if (pretax <= 0) return undefined;

  const rate = amount / pretax;
  return rate > 0 && rate < 0.25 ? rate : undefined;
}

export function extractUsVAT(context: ReceiptContext): CountryVatResult {
  const total = context.totalPaid || 0;
  const processedLines = preprocessOCRLines(context.ocrLines);

  const directMatch =
    extractUsTaxAmountFromLines(context.ocrLines, total) ??
    extractUsTaxAmountFromLines(processedLines, total);
  if (directMatch) {
    return {
      amount: directMatch.amount,
      rate: directMatch.rate ?? inferRateFromAmount(directMatch.amount, total),
    };
  }

  const summaryBlock =
    extractUsSummaryBlock(context.ocrLines, US_CONFIG) ??
    extractUsSummaryBlock(processedLines, US_CONFIG);
  if (
    summaryBlock?.subtotal != null &&
    total > summaryBlock.subtotal &&
    total - summaryBlock.subtotal <= total * 0.25
  ) {
    const arithmeticTax = round2(total - summaryBlock.subtotal);
    return {
      amount: arithmeticTax,
      rate: inferRateFromAmount(arithmeticTax, total),
    };
  }
  const summaryTax = summaryBlock?.tax;

  if (
    summaryTax != null &&
    isPlausibleUsTaxAmount(summaryTax, total) &&
    (!summaryBlock?.subtotal || Math.abs(round2(summaryBlock.subtotal + summaryTax) - total) <= 0.02)
  ) {
    return {
      amount: summaryTax,
      rate: inferRateFromAmount(summaryTax, total),
    };
  }

  const hasTaxishLabel = [...context.ocrLines, ...processedLines].some((line) =>
    US_TAX_LABEL_PATTERN.test(line.text) || US_TAX_ABBREVIATION_PATTERN.test(line.text)
  );
  if (hasTaxishLabel) {
    const inferredTax = inferTaxFromVisibleLineItems(context.ocrLines, total);
    if (inferredTax != null) {
      return {
        amount: inferredTax,
        rate: inferRateFromAmount(inferredTax, total),
      };
    }
  }

  const fallback = extractVATRobust(context.ocrLines, total, US_CONFIG);
  return {
    amount: fallback.value || 0,
    rate: fallback.rate,
  };
}
