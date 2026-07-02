import type { OCRLine } from "../../receipt/types";

export interface AmountCandidate {
  value: number;
  lineNo: number;
  rawText: string;
  matchedText: string;
  hasAsteriskPrefix?: boolean;
  contextWindow: { prev: string; current: string; next: string };
  score: number;
  scoreBreakdown: string[];
  isOnlyDotCommaCandidate?: boolean;
}

export interface BranchIdMatch {
  branchId: number;
  lineNo: number;
  pattern: string;
}

/**
 * Preprocess OCR lines: normalize and clean
 */
export function preprocessOCRLines(lines: OCRLine[]): OCRLine[] {
  const noisePatterns = [
    /wifi.*password/i,
    /password\s*:/i,
    /qr.*code/i,
    /promo.*code/i,
    /discount.*code/i,
    /website.*http/i,
    /https?:\/\//i,
    /www\./i,
  ];

  return lines
    .map((line) => {
      // Normalize: lowercase, trim, collapse spaces
      const normalized = (line.text ?? "")
        .toLowerCase()
        .trim()
        .replace(/\u00a0/g, " ")
        .replace(/\s+/g, " ");

      if (!normalized) return null;

      // Remove obvious noise lines but keep numbers
      // (If a line is purely noise-like, drop it)
      for (const pattern of noisePatterns) {
        if (pattern.test(normalized)) return null;
      }

      return {
        ...line,
        text: normalized,
      };
    })
    .filter((line): line is OCRLine => line !== null);
}

/**
 * Extract branch/store IDs from OCR lines
 */
export function extractBranchIds(lines: OCRLine[]): BranchIdMatch[] {
  const branchPatterns = [
    /(Ã Â¸ÂªÃ Â¸Â²Ã Â¸â€šÃ Â¸Â²|branch)\s*[:#\-]?\s*(\d{3,6})/i,
    /(store|shop|location)\s*[:#\-]?\s*(\d{3,6})/i,
    /(branch|Ã Â¸ÂªÃ Â¸Â²Ã Â¸â€šÃ Â¸Â²)\s+(\d{3,6})/i,
  ];

  const branchIds: BranchIdMatch[] = [];

  for (const line of lines) {
    for (const pattern of branchPatterns) {
      const match = line.text.match(pattern);
      if (match) {
        const branchId = parseInt(match[2], 10);
        if (!isNaN(branchId)) {
          branchIds.push({
            branchId,
            lineNo: line.lineNo,
            pattern: match[0],
          });
        }
      }
    }
  }

  return branchIds;
}
