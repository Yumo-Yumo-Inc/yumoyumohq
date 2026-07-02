import type {
  CountryTotalStrategyCandidate,
  CountryTotalStrategyInput,
} from "../base";
import { extractAmountsFromText, round2 } from "@/lib/extractors/robust/helpers";
import { extractUsSummaryBlock } from "./summary-block";

const US_SERVICE_IGNORE_PATTERNS = [
  /suggested\s*(tip|gratuity)/i,
  /gratuity\s+not\s+included/i,
  /tip\s*guide/i,
];

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function buildLabelPatterns(labels: string[] | undefined): RegExp[] {
  return (labels ?? [])
    .filter(Boolean)
    .map((label) => new RegExp(`\\b${escapeRegex(label).replace(/\s+/g, "\\s+")}\\b`, "i"));
}

function extractNonPercentAmounts(text: string, countryConfig: CountryTotalStrategyInput["countryConfig"]): number[] {
  return extractAmountsFromText(text, countryConfig)
    .filter(({ raw }) => {
      const escapedRaw = escapeRegex(raw);
      return !new RegExp(`(?:${escapedRaw}\\s*%|%\\s*${escapedRaw})`, "i").test(text);
    })
    .map(({ value }) => value);
}

function extractLabeledAmount(
  lines: CountryTotalStrategyInput["processedLines"],
  patterns: RegExp[],
  input: CountryTotalStrategyInput,
  opts?: {
    lookahead?: number;
    maxBottomLines?: number;
    maxAmount?: number;
    ignorePatterns?: RegExp[];
  }
): number | null {
  if (patterns.length === 0) return null;

  const lookahead = opts?.lookahead ?? 2;
  const searchStart = Math.max(0, lines.length - (opts?.maxBottomLines ?? lines.length));
  const maxAmount = opts?.maxAmount ?? Number.POSITIVE_INFINITY;

  for (let i = lines.length - 1; i >= searchStart; i--) {
    const text = lines[i].text;
    if (opts?.ignorePatterns?.some((pattern) => pattern.test(text))) continue;
    if (!patterns.some((pattern) => pattern.test(text))) continue;

    const sameLineAmounts = extractAmountsFromText(text, input.countryConfig)
      .filter(({ raw, value }) => {
        if (value <= 0 || value >= maxAmount) return false;
        const escapedRaw = escapeRegex(raw);
        if (new RegExp(`(?:${escapedRaw}\\s*%|%\\s*${escapedRaw})`, "i").test(text)) return false;
        if (/:\s*$/.test(text) && !/[.,]/.test(raw) && !/[$€£]/.test(text)) return false;
        return true;
      })
      .map(({ value }) => value);
    if (sameLineAmounts.length > 0) {
      return sameLineAmounts[sameLineAmounts.length - 1];
    }

    for (let offset = 1; offset <= lookahead; offset++) {
      const nextLine = lines[i + offset];
      if (!nextLine) break;
      if (opts?.ignorePatterns?.some((pattern) => pattern.test(nextLine.text))) continue;

      const nextLineAmounts = extractNonPercentAmounts(nextLine.text, input.countryConfig).filter(
        (value) => value > 0 && value < maxAmount
      );
      if (nextLineAmounts.length > 0) {
        return nextLineAmounts[nextLineAmounts.length - 1];
      }
    }
  }

  return null;
}

function isPlausibleAmountLine(text: string): boolean {
  const trimmed = text.trim();
  return (
    /^[\$€£]?\s*-?\d+(?:[.,]\d{2})?\s*$/.test(trimmed) ||
    /^[\$€£]?\s*-?\d{1,3}(?:[,\s]\d{3})+(?:[.,]\d{2})?\s*$/.test(trimmed) ||
    /[$€£]/.test(trimmed) ||
    /[.,]\d{2}\b/.test(trimmed)
  );
}

function extractUsTrailingTotalAmount(input: CountryTotalStrategyInput, totalPatterns: RegExp[]): number | null {
  if (totalPatterns.length === 0) return null;

  const stopPattern = /\b(tender|cash|card|change|balance due|signature|required|purchase)\b/i;
  const searchStart = Math.max(0, input.processedLines.length - 25);

  for (let i = input.processedLines.length - 1; i >= searchStart; i--) {
    const text = input.processedLines[i].text;
    if (/\bsub\s*total\b/i.test(text)) continue;
    if (!totalPatterns.some((pattern) => pattern.test(text))) continue;

    const sameLineAmounts = isPlausibleAmountLine(text)
      ? extractNonPercentAmounts(text, input.countryConfig).filter((value) => value > 0)
      : [];
    if (sameLineAmounts.length > 0) {
      return sameLineAmounts[sameLineAmounts.length - 1];
    }

    const trailingAmounts: Array<{ value: number; hasDecimal: boolean }> = [];
    for (let offset = 1; offset <= 15; offset++) {
      const nextLine = input.processedLines[i + offset];
      if (!nextLine) break;
      if (stopPattern.test(nextLine.text)) break;
      if (
        trailingAmounts.length > 0 &&
        /[a-z]/i.test(nextLine.text) &&
        !totalPatterns.some((pattern) => pattern.test(nextLine.text))
      ) {
        break;
      }

      if (!isPlausibleAmountLine(nextLine.text)) continue;
      const nextAmounts = extractNonPercentAmounts(nextLine.text, input.countryConfig).filter(
        (value) => value > 0
      );
      if (nextAmounts.length > 0) {
        trailingAmounts.push(
          ...nextAmounts.map((value) => ({
            value,
            hasDecimal: /[.,]\d{2}\b/.test(nextLine.text) || /[$â‚¬Â£]/.test(nextLine.text),
          }))
        );
      }
    }

    if (trailingAmounts.length > 0) {
      const preferred =
        [...trailingAmounts].reverse().find((amount) => amount.hasDecimal) ??
        trailingAmounts[trailingAmounts.length - 1];
      return preferred.value;
    }
  }

  return null;
}

function extractUsNearbyDecimalTotalAmount(
  input: CountryTotalStrategyInput,
  totalPatterns: RegExp[]
): number | null {
  for (let i = 0; i < Math.min(input.processedLines.length, 25); i++) {
    const text = input.processedLines[i].text;
    if (/\bsub\s*total\b/i.test(text)) continue;
    if (!totalPatterns.some((pattern) => pattern.test(text))) continue;

    const collected: number[] = [];
    for (let offset = 1; offset <= 5; offset++) {
      const nextLine = input.processedLines[i + offset];
      if (!nextLine) break;
      if (/\b(signature|required|purchase)\b/i.test(nextLine.text)) break;
      if (/\bsub\s*total\b/i.test(nextLine.text)) continue;

      const amounts = extractAmountsFromText(nextLine.text, input.countryConfig)
        .filter(({ raw, value }) => value > 0 && /[.,]\d{2}\b/.test(raw))
        .map(({ value }) => value);
      if (amounts.length > 0) {
        collected.push(...amounts);
      }
    }

    if (collected.length > 0) {
      return collected[collected.length - 1];
    }
  }

  return null;
}

function lineHasKeyword(line: string, keyword: string): boolean {
  return new RegExp(`\\b${escapeRegex(keyword).replace(/\s+/g, "\\s+")}\\b`, "i").test(line);
}

function pickArithmeticTotalCandidate(
  scoredCandidates: CountryTotalStrategyCandidate[],
  expectedTotals: number[],
  totalKeywords: string[]
): CountryTotalStrategyCandidate | null {
  if (expectedTotals.length === 0) return null;

  const tolerance = 0.02;
  const normalizedKeywords = totalKeywords.map((keyword) => keyword.toLowerCase());
  const matches = scoredCandidates.filter((candidate) =>
    expectedTotals.some((expectedTotal) => Math.abs(candidate.value - expectedTotal) <= tolerance)
  );

  if (matches.length === 0) return null;

  matches.sort((a, b) => {
    const aHasStrong = normalizedKeywords.some((keyword) => lineHasKeyword(a.contextWindow.current, keyword)) ? 1 : 0;
    const bHasStrong = normalizedKeywords.some((keyword) => lineHasKeyword(b.contextWindow.current, keyword)) ? 1 : 0;
    if (bHasStrong !== aHasStrong) return bHasStrong - aHasStrong;
    if (b.score !== a.score) return b.score - a.score;
    return b.lineNo - a.lineNo;
  });

  return matches[0];
}

export function selectUsTotalCandidate(
  input: CountryTotalStrategyInput
): CountryTotalStrategyCandidate | null {
  if (input.scoredCandidates.length === 0) {
    return input.best ?? null;
  }

  let best = input.best ?? input.scoredCandidates[0];
  const summaryBlock =
    extractUsSummaryBlock(input.lines, input.countryConfig) ??
    extractUsSummaryBlock(input.processedLines, input.countryConfig);
  if (summaryBlock?.total != null) {
    const summaryMatch = pickArithmeticTotalCandidate(
      input.scoredCandidates,
      [summaryBlock.total],
      input.totalKeywords
    );
    if (summaryMatch) {
      best = summaryMatch;
    }
  }

  const usTotalPatterns = [
    ...buildLabelPatterns(input.countryConfig.labels.total),
    /\btota(?:l)?\b/i,
    /\btotl\b/i,
  ];
  const explicitTotal =
    extractUsNearbyDecimalTotalAmount(input, [/\btota\b/i]) ??
    extractUsTrailingTotalAmount(input, usTotalPatterns);
  let hasExplicitTotal = false;

  if (explicitTotal != null) {
    const explicitMatch = pickArithmeticTotalCandidate(
      input.scoredCandidates,
      [explicitTotal],
      input.totalKeywords
    );
    if (explicitMatch) {
      best = explicitMatch;
      hasExplicitTotal = true;
    }
  }

  const subtotal =
    summaryBlock?.subtotal ??
    extractLabeledAmount(input.processedLines, buildLabelPatterns(input.countryConfig.labels.subtotal), input, {
      lookahead: 6,
      maxBottomLines: 20,
    });
  const tax =
    summaryBlock?.tax ??
    extractLabeledAmount(input.processedLines, buildLabelPatterns(input.countryConfig.labels.vat), input, {
      lookahead: 4,
      maxBottomLines: 20,
    });
  const service =
    summaryBlock?.service ??
    extractLabeledAmount(input.processedLines, buildLabelPatterns(input.countryConfig.labels.service), input, {
      lookahead: 3,
      maxBottomLines: 20,
      maxAmount: best?.value ?? Number.POSITIVE_INFINITY,
      ignorePatterns: US_SERVICE_IGNORE_PATTERNS,
    });

  const expectedTotals: number[] = [];
  if (subtotal != null && tax != null) {
    expectedTotals.push(round2(subtotal + tax));
    if (service != null) {
      expectedTotals.push(round2(subtotal + tax + service));
    }
  }

  const arithmeticMatch = hasExplicitTotal
    ? null
    : pickArithmeticTotalCandidate(input.scoredCandidates, expectedTotals, input.totalKeywords);

  if (
    arithmeticMatch &&
    (!best ||
      (!expectedTotals.some((expectedTotal) => Math.abs(best.value - expectedTotal) <= 0.02) &&
        arithmeticMatch.score >= best.score - 20))
  ) {
    best = arithmeticMatch;
  }

  return best;
}
