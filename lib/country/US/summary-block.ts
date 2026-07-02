import type { OCRLine } from "@/lib/receipt/types";
import type { CountryConfig } from "../base";
import { extractAmountsFromText, round2 } from "@/lib/extractors/robust/helpers";

export interface UsSummaryBlockValues {
  subtotal?: number;
  service?: number;
  tax?: number;
  salesTotal?: number;
  total?: number;
  cash?: number;
  change?: number;
}

const SUMMARY_LABEL_DEFS: Array<{ key: keyof UsSummaryBlockValues; pattern: RegExp }> = [
  { key: "subtotal", pattern: /\bsub\s*total|subtotal\b/i },
  { key: "service", pattern: /\bservice\s*charge|service\s*fee\b/i },
  { key: "tax", pattern: /\b(?:sales\s*)?tax\b/i },
  { key: "salesTotal", pattern: /\bsales\s*total\b/i },
  { key: "total", pattern: /^\s*total\b/i },
  { key: "cash", pattern: /^\s*cash\b/i },
  { key: "change", pattern: /^\s*change\b/i },
];

function isAmountLikeLine(text: string): boolean {
  const trimmed = text.trim();
  return (
    /^[\$€£]?\s*-?\d+(?:[.,]\d{2})?\s*$/.test(trimmed) ||
    /^[\$€£]?\s*-?\d{1,3}(?:[,\s]\d{3})+(?:[.,]\d{2})?\s*$/.test(trimmed) ||
    /[$€£]/.test(trimmed) ||
    /[.,]\d{2}\b/.test(trimmed)
  );
}

function getAmountFromLine(text: string, countryConfig: CountryConfig): number | null {
  const amounts = extractAmountsFromText(text, countryConfig)
    .map(({ value }) => round2(value))
    .filter((value) => value >= 0);
  return amounts.length > 0 ? amounts[amounts.length - 1] : null;
}

export function extractUsSummaryBlock(
  lines: OCRLine[],
  countryConfig: CountryConfig
): UsSummaryBlockValues | null {
  const searchStart = Math.max(0, lines.length - 25);
  const labels: Array<{ key: keyof UsSummaryBlockValues; index: number }> = [];

  for (let i = searchStart; i < lines.length; i++) {
    const text = lines[i].text.trim();
    const matched = SUMMARY_LABEL_DEFS.find(({ pattern }) => pattern.test(text));
    if (!matched) continue;

    const previous = labels[labels.length - 1];
    if (previous && i - previous.index > 2) {
      labels.length = 0;
    }

    labels.push({ key: matched.key, index: i });
  }

  if (labels.length < 3) return null;

  const lastLabelIndex = labels[labels.length - 1].index;
  const amountLines = lines
    .slice(lastLabelIndex + 1)
    .map((line) => ({ lineNo: line.lineNo, text: line.text.trim(), amount: getAmountFromLine(line.text, countryConfig) }))
    .filter((line) => line.amount != null && isAmountLikeLine(line.text));

  if (amountLines.length < 2) return null;

  const mapped: UsSummaryBlockValues = {};
  const labelTail = labels.slice(-Math.min(labels.length, amountLines.length));
  const amountTail = amountLines.slice(-labelTail.length);

  for (let i = 0; i < labelTail.length; i++) {
    const label = labelTail[labelTail.length - 1 - i];
    const amountLine = amountTail[amountTail.length - 1 - i];
    mapped[label.key] = amountLine.amount ?? undefined;
  }

  return Object.keys(mapped).length > 0 ? mapped : null;
}
