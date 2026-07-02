import type { OCRLine, TotalExtraction } from "../types";
import { TOTAL_KEY_RE, TAX_KEY_RE } from "@/lib/shared/constants";

/**
 * Parse number with Turkish format support (39.589,00 = 39589.00)
 * Also handles Thai Baht "B" prefix (e.g., "B257.00" -> 257.00)
 */
export function parseTurkishNumber(str: string): number | null {
  if (!str) return null;
  
  // Remove spaces
  let s = str.trim().replace(/\s+/g, "");
  
  // Remove Thai Baht "B" prefix (common OCR error: "B" read as "8")
  // Pattern: "B" followed by digits (e.g., "B257.00", "B16.81")
  s = s.replace(/^[bB]\s*([\d,.]+)$/, "$1"); // "B257.00" -> "257.00"
  
  // Also check if number starts with "8" followed by reasonable digits (could be "B" misread)
  // Only fix if it looks like a currency amount (has decimal or reasonable size)
  const eightPrefixMatch = s.match(/^8(\d{1,3}(?:[.,]\d{2})?)$/);
  if (eightPrefixMatch) {
    // Check if removing "8" gives a reasonable amount
    const withoutEight = eightPrefixMatch[1];
    const testValue = parseFloat(withoutEight.replace(/,/g, "."));
    // If the value without "8" is reasonable (< 10000 and > 0.01), assume "8" was "B"
    if (testValue > 0.01 && testValue < 10000) {
      s = withoutEight;
    }
  }
  
  // Turkish format: dot is thousands separator, comma is decimal
  // "39.589,00" -> "39589.00"
  const hasComma = s.includes(",");
  const hasDot = s.includes(".");
  
  if (hasComma && hasDot) {
    const lastComma = s.lastIndexOf(",");
    const lastDot = s.lastIndexOf(".");
    if (lastDot < lastComma) {
      // Turkish format: dot thousands, comma decimal
      s = s.replace(/\./g, ""); // Remove dots (thousands)
      s = s.replace(/,/g, "."); // Replace comma with dot (decimal)
    } else {
      // US format: comma thousands, dot decimal
      s = s.replace(/,/g, "");
    }
  } else if (hasComma && !hasDot) {
    // Could be Turkish decimal (200,00) or thousands (1,234)
    const parts = s.split(",");
    if (parts.length === 2 && parts[1].length === 2) {
      // Likely Turkish decimal format
      s = s.replace(/,/g, ".");
    } else {
      // Likely thousands separator
      s = s.replace(/,/g, "");
    }
  } else if (hasDot && !hasComma) {
    // Could be decimal or thousands - check context
    const parts = s.split(".");
    if (parts.length === 2 && parts[1].length === 2) {
      // Likely decimal
    } else {
      // Could be thousands, but keep as-is for now
    }
  }
  
  const v = parseFloat(s);
  if (!isFinite(v) || v <= 0) return null;
  return v;
}

/**
 * Extract total amount from OCR lines
 */
export function extractTotal(lines: OCRLine[]): TotalExtraction {
  // Use shared constants for total patterns
  const totalPatterns = [
    new RegExp(`(?:${TOTAL_KEY_RE.source.replace(/^\/|\/[gi]*$/g, '')})[\\s:]*([\\d,.\\s]+)`, 'i'),
    new RegExp(`([\\d,.\\s]+)\\s*(?:${TOTAL_KEY_RE.source.replace(/^\/|\/[gi]*$/g, '')})`, 'i'),
  ];

  // Also look for currency symbols (including Thai Baht "B" prefix)
  const currencyPattern = /[bB]?\s*([\d,.]+)\s*(?:€|USD|TRY|TL|\$|฿)/i;

  // Check last 15 lines first (totals usually at the end, e-fatura may have more footer)
  for (let i = lines.length - 1; i >= Math.max(0, lines.length - 15); i--) {
    const line = lines[i].text;
    
    // Try total patterns
    for (const pattern of totalPatterns) {
      const match = line.match(pattern);
      if (match && match[1]) {
        const amount = parseTurkishNumber(match[1]);
        if (amount !== null && amount > 0) {
          return {
            value: amount,
            confidence: 0.9,
            sourceLine: lines[i].lineNo,
          };
        }
      }
    }
    
    // Try currency pattern
    const currencyMatch = line.match(currencyPattern);
    if (currencyMatch && currencyMatch[1]) {
      const amount = parseTurkishNumber(currencyMatch[1]);
      if (amount !== null && amount > 0) {
        return {
          value: amount,
          confidence: 0.85,
          currency: currencyMatch[2] || "USD",
          sourceLine: lines[i].lineNo,
        };
      }
    }
  }

  // Fallback: find largest number in last 10 lines
  let maxAmount = 0;
  let maxLine = -1;
  
  for (let i = Math.max(0, lines.length - 10); i < lines.length; i++) {
    const numbers = lines[i].text.match(/[\d,.]+/g);
    if (numbers) {
      for (const numStr of numbers) {
        const amount = parseTurkishNumber(numStr);
        if (amount !== null && amount > maxAmount && amount < 1000000) {
          maxAmount = amount;
          maxLine = lines[i].lineNo;
        }
      }
    }
  }

  if (maxAmount > 0) {
    return {
      value: maxAmount,
      confidence: 0.6,
      sourceLine: maxLine,
    };
  }

  // No total found
  return {
    value: 0,
    confidence: 0,
  };
}
