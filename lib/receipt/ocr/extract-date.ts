import type { OCRLine, DateExtraction } from "../types";
import type { CountryConfig } from "@/lib/country/base";
import { regexPatterns, monthMap } from "@/lib/shared/constants";

function convertBuddhistYear(year: number, isShort: boolean): number {
  if (isShort) {
    if (year >= 50 && year <= 99) return year + 2500 - 543;
    if (year >= 0 && year <= 49) return year + 2500 - 543;
    return year;
  }

  if (year >= 2500 && year <= 2600) return year - 543;
  return year;
}

function inferTwoDigitGregorianYear(year: number, now = new Date()): number {
  const currentYear = now.getFullYear();
  const currentCentury = Math.floor(currentYear / 100) * 100;
  const currentYearLastTwo = currentYear % 100;

  if (year >= 0 && year <= currentYearLastTwo + 1) {
    return currentCentury + year;
  }

  return currentCentury - 100 + year;
}

function normalizeYear(
  rawYear: number,
  useBuddhistCalendar: boolean,
  buddhistOffset: number,
  buddhistThreshold: number,
  now: Date
): number {
  if (useBuddhistCalendar) {
    if (rawYear < 100) return convertBuddhistYear(rawYear, true);
    if (rawYear >= buddhistThreshold) return rawYear - buddhistOffset;
    return rawYear;
  }

  if (rawYear < 100) {
    return inferTwoDigitGregorianYear(rawYear, now);
  }

  return rawYear;
}

function maybeCorrectFutureYear(year: number, month: number, day: number, now: Date): number {
  if (year < now.getFullYear()) return year;

  const parsed = new Date(year, month - 1, day);
  const oneYearAhead = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);
  if (parsed <= oneYearAhead) return year;

  const correctedYear = year - 4;
  if (correctedYear < 2000) return year;

  const correctedDate = new Date(correctedYear, month - 1, day);
  return correctedDate <= oneYearAhead ? correctedYear : year;
}

function formatIsoDateParts(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function isValidReceiptDate(date: Date, now: Date): boolean {
  const minYear = 2000;
  const maxYear = now.getFullYear() + 1;
  return (
    !isNaN(date.getTime()) &&
    date.getFullYear() >= minYear &&
    date.getFullYear() <= maxYear &&
    date <= new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000)
  );
}

function buildValidatedIsoDate(year: number, month: number, day: number, now: Date): string | null {
  const candidate = new Date(year, month - 1, day);
  if (!isValidReceiptDate(candidate, now)) return null;
  return formatIsoDateParts(year, month, day);
}

/**
 * Parse a SINGLE raw date token (e.g. "03/06/2026", "3 Jun 2026", "2026-03-08")
 * into a validated YYYY-MM-DD string using the country's date-format rules.
 *
 * This is the deterministic counterpart to letting the LLM normalize the date
 * itself. The model emits the date verbatim (receipt_date_raw); the day/month
 * ORDER and Buddhist-year handling are decided here from country config, not by
 * the model's guess — so a TH receipt "03/06/2026" always resolves to 3 June,
 * never 8 March / 3 August.
 *
 * Returns null when the token cannot be parsed or the resulting date fails the
 * validity window (caller then keeps the model's own interpretation).
 */
export function parseReceiptDateToken(
  token: string,
  countryConfig?: CountryConfig,
  now: Date = new Date()
): string | null {
  if (!token) return null;
  const text = String(token)
    .replace(/[–—−]/g, "-")
    .replace(/[٫﹒·]/g, ".")
    .replace(/\s+/g, " ")
    .trim();
  if (!text) return null;

  const datePatterns = countryConfig?.dateTime.datePatterns || [
    /\b(\d{1,2})[./-](\d{1,2})[./-](\d{4})\b/,
  ];
  const isoPatterns = countryConfig?.dateTime.isoPatterns || [
    /\b(\d{4})[./-](\d{1,2})[./-](\d{1,2})\b/,
  ];
  const shortPatterns = countryConfig?.dateTime.shortPatterns || [
    /\b(\d{1,2})[./-](\d{1,2})[./-](\d{2})\b/,
  ];
  const numericMonthFirst = countryConfig?.dateTime.numericMonthFirst === true;
  const useBuddhistCalendar = countryConfig?.dateTime.useBuddhistCalendar || false;
  const buddhistOffset = countryConfig?.dateTime.buddhistOffset || 543;
  const buddhistThreshold = countryConfig?.dateTime.buddhistThreshold || 2400;

  // ISO (YYYY-MM-DD) first — unambiguous, no order guessing needed.
  for (const pattern of isoPatterns) {
    const match = text.match(pattern);
    if (!match) continue;
    let year = parseInt(match[1], 10);
    if (useBuddhistCalendar && year >= buddhistThreshold) year = year - buddhistOffset;
    const month = parseInt(match[2], 10);
    const day = parseInt(match[3], 10);
    const iso = buildValidatedIsoDate(year, month, day, now);
    if (iso) return iso;
  }

  for (const pattern of datePatterns) {
    const match = text.match(pattern);
    if (!match) continue;
    const first = parseInt(match[1], 10);
    const second = parseInt(match[2], 10);
    const rawYear = parseInt(match[3], 10);
    const month = numericMonthFirst ? first : second;
    const day = numericMonthFirst ? second : first;
    let year = normalizeYear(rawYear, useBuddhistCalendar, buddhistOffset, buddhistThreshold, now);
    year = maybeCorrectFutureYear(year, month, day, now);
    const iso = buildValidatedIsoDate(year, month, day, now);
    if (iso) return iso;
  }

  for (const pattern of shortPatterns) {
    const match = text.match(pattern);
    if (!match) continue;
    const first = parseInt(match[1], 10);
    const second = parseInt(match[2], 10);
    const rawYear = parseInt(match[3], 10);
    const month = numericMonthFirst ? first : second;
    const day = numericMonthFirst ? second : first;
    const year = normalizeYear(rawYear, useBuddhistCalendar, buddhistOffset, buddhistThreshold, now);
    const iso = buildValidatedIsoDate(year, month, day, now);
    if (iso) return iso;
  }

  // Textual month form: "3 Jun 2026", "3 Haz 2026".
  const textualMatch = text.match(regexPatterns.textualDate);
  if (textualMatch?.[1] && textualMatch[2] && textualMatch[3]) {
    const day = parseInt(textualMatch[1], 10);
    const monthName = textualMatch[2].toLowerCase();
    const month = monthMap[monthName] ?? monthMap[monthName.substring(0, 3)];
    if (month !== undefined && month !== -1) {
      const rawYear = parseInt(textualMatch[3], 10);
      const year = normalizeYear(rawYear, useBuddhistCalendar, buddhistOffset, buddhistThreshold, now);
      const iso = buildValidatedIsoDate(year, month + 1, day, now);
      if (iso) return iso;
    }
  }

  return null;
}

export function extractDate(lines: OCRLine[], countryConfig?: CountryConfig): DateExtraction {
  const datePatterns = countryConfig?.dateTime.datePatterns || [
    /\b(\d{1,2})[./-](\d{1,2})[./-](\d{4})\b/,
  ];
  const isoPatterns = countryConfig?.dateTime.isoPatterns || [
    /\b(\d{4})[./-](\d{1,2})[./-](\d{1,2})\b/,
  ];
  const shortPatterns = countryConfig?.dateTime.shortPatterns || [
    /\b(\d{1,2})[./-](\d{1,2})[./-](\d{2})\b/,
  ];
  const numericMonthFirst = countryConfig?.dateTime.numericMonthFirst === true;
  const useBuddhistCalendar = countryConfig?.dateTime.useBuddhistCalendar || false;
  const buddhistOffset = countryConfig?.dateTime.buddhistOffset || 543;
  const buddhistThreshold = countryConfig?.dateTime.buddhistThreshold || 2400;

  const searchIndices = [
    ...Array.from({ length: Math.min(15, lines.length) }, (_, i) => i),
    ...Array.from({ length: Math.min(10, lines.length) }, (_, i) => lines.length - 1 - i),
  ];
  const uniqueIndices = Array.from(new Set(searchIndices));
  const now = new Date();

  for (const i of uniqueIndices) {
    if (i < 0 || i >= lines.length) continue;
    const line = lines[i].text;

    for (const pattern of datePatterns) {
      const match = line.match(pattern);
      if (!match) continue;

      const first = parseInt(match[1], 10);
      const second = parseInt(match[2], 10);
      const rawYear = parseInt(match[3], 10);
      const month = numericMonthFirst ? first : second;
      const day = numericMonthFirst ? second : first;
      let year = normalizeYear(rawYear, useBuddhistCalendar, buddhistOffset, buddhistThreshold, now);
      year = maybeCorrectFutureYear(year, month, day, now);

      const iso = buildValidatedIsoDate(year, month, day, now);
      if (iso) {
        return {
          value: iso,
          confidence: 0.85,
          sourceLine: lines[i].lineNo,
        };
      }
    }

    for (const pattern of shortPatterns) {
      const match = line.match(pattern);
      if (!match) continue;

      const first = parseInt(match[1], 10);
      const second = parseInt(match[2], 10);
      const rawYear = parseInt(match[3], 10);
      const month = numericMonthFirst ? first : second;
      const day = numericMonthFirst ? second : first;
      const year = normalizeYear(rawYear, useBuddhistCalendar, buddhistOffset, buddhistThreshold, now);

      const iso = buildValidatedIsoDate(year, month, day, now);
      if (iso) {
        return {
          value: iso,
          confidence: 0.8,
          sourceLine: lines[i].lineNo,
        };
      }
    }

    for (const pattern of isoPatterns) {
      const match = line.match(pattern);
      if (!match) continue;

      let year = parseInt(match[1], 10);
      if (useBuddhistCalendar && year >= buddhistThreshold) {
        year = year - buddhistOffset;
      }

      const month = parseInt(match[2], 10);
      const day = parseInt(match[3], 10);
      const iso = buildValidatedIsoDate(year, month, day, now);
      if (iso) {
        return {
          value: iso,
          confidence: 0.8,
          sourceLine: lines[i].lineNo,
        };
      }
    }

    const textualMatch = line.match(regexPatterns.textualDate);
    if (textualMatch?.[1] && textualMatch[2] && textualMatch[3]) {
      const day = parseInt(textualMatch[1], 10);
      const monthName = textualMatch[2].toLowerCase();
      const month = monthMap[monthName] ?? monthMap[monthName.substring(0, 3)];
      if (month !== undefined && month !== -1) {
        const rawYear = parseInt(textualMatch[3], 10);
        const year = normalizeYear(rawYear, useBuddhistCalendar, buddhistOffset, buddhistThreshold, now);
        const iso = buildValidatedIsoDate(year, month + 1, day, now);
        if (iso) {
          return {
            value: iso,
            confidence: 0.8,
            sourceLine: lines[i].lineNo,
          };
        }
      }
    }

    const monthFirstPatterns = countryConfig?.dateTime?.textualMonthFirstPatterns;
    if (monthFirstPatterns) {
      for (const pattern of monthFirstPatterns) {
        const match = line.match(pattern);
        if (!match?.[1] || !match[2] || !match[3]) continue;

        const monthKey = match[1].toLowerCase().substring(0, 3);
        const month = monthMap[monthKey] ?? -1;
        if (month === -1) continue;

        const day = parseInt(match[2], 10);
        const rawYear = parseInt(match[3], 10);
        const year = normalizeYear(rawYear, useBuddhistCalendar, buddhistOffset, buddhistThreshold, now);
        const iso = buildValidatedIsoDate(year, month + 1, day, now);
        if (iso) {
          return {
            value: iso,
            confidence: 0.85,
            sourceLine: lines[i].lineNo,
          };
        }
      }
    }
  }

  return {
    value: new Date().toISOString().split("T")[0],
    confidence: 0.3,
  };
}
