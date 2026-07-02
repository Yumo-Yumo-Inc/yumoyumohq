import type { ReceiptContext } from "@/app/api/receipt/analyze/types";
import type { DateExtraction, TimeExtraction } from "@/lib/receipt/types";
import { extractDate } from "@/lib/receipt/ocr/extract-date";
import { extractTime } from "@/lib/receipt/ocr/extract-time";
import { US_CONFIG } from "../US.config";

const MONTH_MAP: Record<string, number> = {
  jan: 1,
  feb: 2,
  mar: 3,
  apr: 4,
  may: 5,
  jun: 6,
  jul: 7,
  aug: 8,
  sep: 9,
  sept: 9,
  oct: 10,
  nov: 11,
  dec: 12,
};

function pad2(value: number): string {
  return String(value).padStart(2, "0");
}

function inferTwoDigitYear(year: number): number {
  return year <= 30 ? 2000 + year : 1900 + year;
}

function buildIsoDate(year: number, month: number, day: number): string {
  return `${year}-${pad2(month)}-${pad2(day)}`;
}

function normalizeYear(yearText: string): number {
  const year = parseInt(yearText, 10);
  return yearText.length === 2 ? inferTwoDigitYear(year) : year;
}

function parseUsSpecialDate(text: string): string | null {
  const compactNumeric = text.match(
    /\b(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})(?=\s*\d{1,2}:\d{2})/i
  );
  if (compactNumeric) {
    return buildIsoDate(
      normalizeYear(compactNumeric[3]),
      parseInt(compactNumeric[1], 10),
      parseInt(compactNumeric[2], 10)
    );
  }

  const textualDayFirst = text.match(/\b(\d{1,2})[-\s](jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*[-\s,]*(\d{2,4})\b/i);
  if (textualDayFirst) {
    const month = MONTH_MAP[textualDayFirst[2].toLowerCase()];
    if (!month) return null;
    return buildIsoDate(
      normalizeYear(textualDayFirst[3]),
      month,
      parseInt(textualDayFirst[1], 10)
    );
  }

  const compactTextualMonthFirst = text.match(
    /(?:^|[^0-9a-z])(jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*[.\s-]*(\d{1,2})[',\s-]*(\d{2,4})\b/i
  );
  if (compactTextualMonthFirst) {
    const month = MONTH_MAP[compactTextualMonthFirst[1].toLowerCase()];
    if (!month) return null;
    return buildIsoDate(
      normalizeYear(compactTextualMonthFirst[3]),
      month,
      parseInt(compactTextualMonthFirst[2], 10)
    );
  }

  return null;
}

function parseUsTime(text: string): string | null {
  const meridiemMatch = text.match(/\b(\d{1,2})[:.](\d{2})(?:[:.](\d{2}))?\s*([AP]M|[AP])\b/i);
  if (meridiemMatch) {
    let hour = parseInt(meridiemMatch[1], 10);
    const minute = parseInt(meridiemMatch[2], 10);
    const period = meridiemMatch[4].toUpperCase();
    if (period.startsWith("P") && hour !== 12) hour += 12;
    if (period.startsWith("A") && hour === 12) hour = 0;
    return `${pad2(hour)}:${pad2(minute)}`;
  }

  return null;
}

export function extractUsDate(context: ReceiptContext): DateExtraction {
  for (let i = 0; i < Math.min(40, context.ocrLines.length); i++) {
    const text = context.ocrLines[i].text;
    const parsed = parseUsSpecialDate(text);
    if (parsed) {
      return {
        value: parsed,
        confidence: 0.88,
        sourceLine: context.ocrLines[i].lineNo,
      };
    }
  }

  return extractDate(context.ocrLines, US_CONFIG);
}

export function extractUsTime(
  context: ReceiptContext,
  dateExtraction: DateExtraction
): TimeExtraction {
  const dateLineIndex =
    dateExtraction.sourceLine != null
      ? context.ocrLines.findIndex((line) => line.lineNo === dateExtraction.sourceLine)
      : undefined;

  const searchIndices = [
    ...(typeof dateLineIndex === "number" && dateLineIndex >= 0 ? [dateLineIndex] : []),
    ...Array.from({ length: Math.min(10, context.ocrLines.length) }, (_, i) => i),
  ];

  for (const index of Array.from(new Set(searchIndices))) {
    const line = context.ocrLines[index];
    if (!line) continue;
    const parsed = parseUsTime(line.text);
    if (parsed) {
      return {
        value: parsed,
        confidence: index === dateLineIndex ? 0.95 : 0.9,
        sourceLine: line.lineNo,
      };
    }
  }

  return extractTime(
    context.ocrLines,
    US_CONFIG,
    typeof dateLineIndex === "number" && dateLineIndex >= 0 ? dateLineIndex : undefined,
    dateExtraction.confidence > 0.3 ? dateExtraction.value : undefined
  );
}
