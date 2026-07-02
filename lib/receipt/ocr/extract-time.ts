import type { OCRLine, TimeExtraction } from "../types";
import type { CountryConfig } from "@/lib/country/base";

function inferTwoDigitGregorianYear(year: number, now = new Date()): number {
  const currentYear = now.getFullYear();
  const currentCentury = Math.floor(currentYear / 100) * 100;
  const currentYearLastTwo = currentYear % 100;

  if (year >= 0 && year <= currentYearLastTwo + 1) {
    return currentCentury + year;
  }

  return currentCentury - 100 + year;
}

function parseDatePartToIso(dateTimeStr: string, numericMonthFirst = false): string | null {
  const datePart = dateTimeStr.trim().split(/\s+/)[0];
  const match = datePart?.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{2,4})$/);
  if (!match) return null;

  const first = parseInt(match[1], 10);
  const second = parseInt(match[2], 10);
  const rawYear = parseInt(match[3], 10);
  const year = match[3].length === 2 ? inferTwoDigitGregorianYear(rawYear) : rawYear;
  const month = String(numericMonthFirst ? first : second).padStart(2, "0");
  const day = String(numericMonthFirst ? second : first).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function extractTime(
  lines: OCRLine[],
  countryConfig?: CountryConfig,
  dateLineIndex?: number,
  receiptDateIso?: string
): TimeExtraction {
  console.log(`[extractTime] Starting time extraction:`, {
    totalLines: lines.length,
    dateLineIndex,
    receiptDateIso,
    firstFewLines: lines.slice(0, 5).map((l) => l.text),
  });

  const configTimePatterns = countryConfig?.dateTime.timePatterns || [];

  const defaultTimePatterns = [
    {
      pattern: /(?::|^|\s|Date\s*:)?\s*\d{1,2}[-/.]\d{1,2}[-/.]\d{2,4}\s+([01]?\d|2[0-3])[:.]([0-5]\d)(?:[:.]([0-5]\d))?/,
      score: 1.0,
      name: "date-time-combined",
      format: (match: RegExpMatchArray) => {
        const hour = match[1].padStart(2, "0");
        const minute = match[2].padStart(2, "0");
        return `${hour}:${minute}`;
      },
    },
    {
      pattern: /\b([01]?\d|2[0-3])[:.]([0-5]\d)(?:[:.]([0-5]\d))?\b/,
      score: 0.95,
      name: "24h-colon",
      format: (match: RegExpMatchArray) => {
        const hour = match[1].padStart(2, "0");
        const minute = match[2].padStart(2, "0");
        return `${hour}:${minute}`;
      },
    },
    {
      pattern: /\b(0?\d|1[0-2])[:.]([0-5]\d)\s*(AM|PM|am|pm|ÖÖ|ÖS|öö|ös)\b/i,
      score: 0.9,
      name: "12h-am-pm",
      format: (match: RegExpMatchArray) => {
        let hour = parseInt(match[1], 10);
        const minute = match[2].padStart(2, "0");
        const period = match[3].toUpperCase();

        if ((period === "PM" || period === "ÖS") && hour !== 12) hour += 12;
        if ((period === "AM" || period === "ÖÖ") && hour === 12) hour = 0;

        return `${hour.toString().padStart(2, "0")}:${minute}`;
      },
    },
    {
      pattern: /\b(0?\d|1[0-2])[:.]([0-5]\d)[:.]([0-5]\d)\s*(AM|PM|am|pm)\b/i,
      score: 0.96,
      name: "12h-am-pm-with-seconds",
      format: (match: RegExpMatchArray) => {
        let hour = parseInt(match[1], 10);
        const minute = match[2].padStart(2, "0");
        const period = match[4].toUpperCase();

        if (period === "PM" && hour !== 12) hour += 12;
        if (period === "AM" && hour === 12) hour = 0;

        return `${hour.toString().padStart(2, "0")}:${minute}`;
      },
    },
    {
      pattern: /\b(0?\d|1[0-2])[:.]([0-5]\d)(AM|PM|am|pm)\b/i,
      score: 0.95,
      name: "12h-am-pm-nospace",
      format: (match: RegExpMatchArray) => {
        let hour = parseInt(match[1], 10);
        const minute = match[2].padStart(2, "0");
        const period = match[3].toUpperCase();

        if (period === "PM" && hour !== 12) hour += 12;
        if (period === "AM" && hour === 12) hour = 0;

        return `${hour.toString().padStart(2, "0")}:${minute}`;
      },
    },
    {
      pattern: /\b(0?\d|1[0-2])[:.]([0-5]\d)\s*([AaPp])\b/,
      score: 0.94,
      name: "12h-am-pm-single-letter",
      format: (match: RegExpMatchArray) => {
        let hour = parseInt(match[1], 10);
        const minute = match[2].padStart(2, "0");
        const period = match[3].toUpperCase();

        if (period === "P" && hour !== 12) hour += 12;
        if (period === "A" && hour === 12) hour = 0;

        return `${hour.toString().padStart(2, "0")}:${minute}`;
      },
    },
    {
      pattern: /(?:saat|time|zaman)[\s:]*([01]?\d|2[0-3])[:.]([0-5]\d)/i,
      score: 0.92,
      name: "time-with-label",
      format: (match: RegExpMatchArray) => {
        const hour = match[1].padStart(2, "0");
        const minute = match[2].padStart(2, "0");
        return `${hour}:${minute}`;
      },
    },
    {
      pattern: /\b([01]?\d|2[0-3])\s+([0-5]\d)\b/,
      score: 0.75,
      name: "24h-space",
      format: (match: RegExpMatchArray) => {
        const hour = match[1].padStart(2, "0");
        const minute = match[2].padStart(2, "0");
        return `${hour}:${minute}`;
      },
    },
  ];

  if (configTimePatterns.length > 0) {
    for (const configPattern of configTimePatterns) {
      defaultTimePatterns.push({
        pattern: configPattern,
        score: 0.9,
        name: "config-pattern",
        format: (match: RegExpMatchArray) => {
          const hour = match[1]?.padStart(2, "0") || "00";
          const minute = match[2]?.padStart(2, "0") || "00";
          return `${hour}:${minute}`;
        },
      });
    }
  }

  const searchIndices: number[] = [];

  if (dateLineIndex !== undefined) {
    if (dateLineIndex >= 0 && dateLineIndex < lines.length) {
      searchIndices.push(dateLineIndex);
    }
    for (let offset = -2; offset <= 2; offset++) {
      if (offset === 0) continue;
      const idx = dateLineIndex + offset;
      if (idx >= 0 && idx < lines.length) searchIndices.push(idx);
    }
  }

  for (let i = 0; i < Math.min(10, lines.length); i++) {
    if (!searchIndices.includes(i)) searchIndices.push(i);
  }

  for (let i = Math.max(0, lines.length - 5); i < lines.length; i++) {
    if (!searchIndices.includes(i)) searchIndices.push(i);
  }

  for (let i = 0; i < lines.length; i++) {
    if (!searchIndices.includes(i)) searchIndices.push(i);
  }

  let bestMatch: { value: string; confidence: number; sourceLine: number; idx: number } | null = null;
  const numericMonthFirst = countryConfig?.dateTime.numericMonthFirst === true;

  for (const idx of searchIndices) {
    if (idx < 0 || idx >= lines.length) continue;
    const line = lines[idx].text;
    const isDateLine = dateLineIndex !== undefined && idx === dateLineIndex;

    for (const timePattern of defaultTimePatterns) {
      const match = line.match(timePattern.pattern);
      if (!match) continue;

      if (isDateLine) {
        const matchStart = match.index || 0;
        const matchEnd = matchStart + match[0].length;
        const beforeMatch = line.substring(Math.max(0, matchStart - 15), matchStart);
        const afterMatch = line.substring(matchEnd, Math.min(line.length, matchEnd + 15));
        const context = beforeMatch + match[0] + afterMatch;
        const datePatternInContext = /\b(\d{1,2})[./-](\d{1,2})[./-](\d{2,4})\b/.test(context);

        if (datePatternInContext) {
          const timeAfterDateWithColon =
            /\b\d{1,2}[./-]\d{1,2}[./-]\d{2,4}\s+([01]?\d|2[0-3])[:.]([0-5]\d)\b/.test(context);

          if (!timeAfterDateWithColon && !match[0].includes(":")) {
            const parts = match[0].trim().split(/\s+/);
            if (parts.length === 2) {
              const h = parseInt(parts[0], 10);
              const m = parseInt(parts[1], 10);
              if (isNaN(h) || isNaN(m) || h < 0 || h > 23 || m < 0 || m > 59) {
                continue;
              }
            } else {
              continue;
            }
          }
        }
      }

      try {
        const timeValue = timePattern.format(match);
        const rawMatch = match[0] || "";

        if (
          rawMatch.includes(".") &&
          !rawMatch.includes(":") &&
          (/^\$?\d+\.\d{2}$/.test(line.trim()) ||
            /\$\s*\d+\.\d{2}/.test(line) ||
            /\b(?:subtotal|sub total|total|tax|vat|sales tax|tip|gratuity|amount|cash|card|change|balance due)\b/i.test(line))
        ) {
          continue;
        }

        const [hour, minute] = timeValue.split(":").map(Number);
        if (hour < 0 || hour > 23 || minute < 0 || minute > 59) continue;

        let confidence = timePattern.score;

        if (dateLineIndex !== undefined) {
          const distance = Math.abs(idx - dateLineIndex);
          if (distance === 0) confidence += 0.25;
          else if (distance === 1) confidence += 0.15;
          else if (distance === 2) confidence += 0.08;
        }

        if (idx < 5) confidence += 0.02;

        const lineHasMeridiem = /\b(?:AM|PM|am|pm)\b/.test(line) || /\b\d{1,2}[:.]\d{2}\s*[AaPp]\b/.test(line);
        if (lineHasMeridiem && timePattern.name === "date-time-combined") {
          confidence -= 0.35;
        } else if (lineHasMeridiem && (timePattern.name === "24h-colon" || timePattern.name === "config-pattern")) {
          confidence -= 0.25;
        }

        if (timePattern.name === "date-time-combined" && receiptDateIso) {
          const parsedDate = parseDatePartToIso(match[0], numericMonthFirst);
          if (parsedDate) {
            if (parsedDate === receiptDateIso) {
              confidence += 0.15;
            } else if (idx >= lines.length - 5) {
              confidence -= 0.5;
              console.log(
                `[extractTime] Footer date-time mismatch: line ${idx} date ${parsedDate} vs receipt ${receiptDateIso}`
              );
            }
          }
        }

        const workingHoursPattern = /\(.*?(\d{1,2})[:.](\d{2})\s*-\s*(\d{1,2})[:.](\d{2})\).*?\)/i;
        if (workingHoursPattern.test(line)) {
          confidence -= 0.5;
        }

        const dayNamesPattern =
          /(senin|selasa|rabu|kamis|jumat|sabtu|minggu|monday|tuesday|wednesday|thursday|friday|saturday|sunday)/i;
        if (dayNamesPattern.test(line) && /(\d{1,2})[:.](\d{2})\s*-\s*(\d{1,2})[:.](\d{2})/.test(line)) {
          confidence -= 0.6;
        }

        confidence = Math.min(1, Math.max(0, confidence));

        const isBetter =
          !bestMatch ||
          confidence > bestMatch.confidence ||
          (confidence === bestMatch.confidence && idx < bestMatch.idx);

        if (isBetter) {
          bestMatch = {
            value: timeValue,
            confidence,
            sourceLine: lines[idx].lineNo,
            idx,
          };
        }
      } catch {
        continue;
      }
    }
  }

  if (bestMatch && bestMatch.confidence >= 0.5) {
    console.log(`[extractTime] Best match found:`, bestMatch);
    return {
      value: bestMatch.value,
      confidence: bestMatch.confidence,
      sourceLine: bestMatch.sourceLine,
    };
  }

  console.log(`[extractTime] No time found. Best match:`, bestMatch);
  return {
    value: "",
    confidence: 0,
  };
}
