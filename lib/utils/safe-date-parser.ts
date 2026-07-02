/**
 * Safe date parsing without timezone issues
 * Handles DD/MM/YYYY format common in receipts
 */

export interface DateParseResult {
  value: string;  // YYYY-MM-DD format
  confidence: number;
  sourceLine?: number;
}

const MONTH_NAMES_TO_NUM: Record<string, number> = {
  jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6,
  jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12,
};

/**
 * Parse Turkish/European date format: DD/MM/YYYY or DD.MM.YYYY
 * Also D/Mon/YYYY (e.g. 5/Feb/2026) and D Mon YYYY (e.g. 5 Feb 2026).
 * Returns YYYY-MM-DD string directly (NO Date object to avoid timezone bugs)
 */
export function parseDateString(dateStr: string): string | null {
  // OCR often emits Unicode dash variants (– — −) and odd separators.
  // Normalize them so date regexes can match consistently.
  const normalized = dateStr
    .replace(/[–—−]/g, "-")
    .replace(/[٫﹒·]/g, ".")
    .replace(/\s+/g, " ")
    .trim();

  // D/Mon/YYYY or D-Mon-YYYY or D Mon YYYY (slash, dash, dot, or space between day and month name)
  const monthNamePattern = /(\d{1,2})[\/\.\-\s]\s*(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*[\/\.\-]?\s*(\d{2,4})/i;
  const matchMonthName = normalized.match(monthNamePattern);
  if (matchMonthName) {
    const day = matchMonthName[1].padStart(2, '0');
    const monthKey = matchMonthName[2].toLowerCase().slice(0, 3);
    const monthNum = MONTH_NAMES_TO_NUM[monthKey];
    const year = matchMonthName[3].length === 2 ? `20${matchMonthName[3]}` : matchMonthName[3];
    if (monthNum && monthNum >= 1 && monthNum <= 12) {
      const month = String(monthNum).padStart(2, '0');
      const dayNum = parseInt(day, 10);
      if (dayNum >= 1 && dayNum <= 31) {
        const result = `${year}-${month}-${day}`;
        console.log('[parseDateString]', { input: normalized, parsed: { day, month, year }, output: result });
        return result;
      }
    }
  }

  // Patterns for Turkish receipts (numeric month)
  const patterns = [
    /(\d{1,2})[\/\.\-](\d{1,2})[\/\.\-](\d{4})/,  // DD/MM/YYYY, DD.MM.YYYY, DD-MM-YYYY
    /(\d{4})[\/\.\-](\d{1,2})[\/\.\-](\d{1,2})/, // YYYY-MM-DD or YYYY.MM.DD
    /(\d{1,2})[\/\.\-](\d{1,2})[\/\.\-](\d{2})(?!\d)/, // DD/MM/YY (e.g. 21/02/26)
  ];

  for (const pattern of patterns) {
    const match = normalized.match(pattern);
    if (match) {
      let day: string;
      let month: string;
      let year: string;

      // Determine if it's DD/MM/YYYY or YYYY-MM-DD
      if (parseInt(match[1]) > 31) {
        // Format: YYYY-MM-DD
        year = match[1];
        month = match[2].padStart(2, '0');
        day = match[3].padStart(2, '0');
      } else {
        // Format: DD/MM/YYYY or DD/MM/YY
        day = match[1].padStart(2, '0');
        month = match[2].padStart(2, '0');
        // Expand 2-digit year: assume 2000s (e.g. "26" → "2026")
        year = match[3].length === 2 ? `20${match[3]}` : match[3];
      }

      // Validate month and day ranges
      const monthNum = parseInt(month);
      const dayNum = parseInt(day);
      
      if (monthNum < 1 || monthNum > 12) return null;
      if (dayNum < 1 || dayNum > 31) return null;

      // Direct string construction - NO Date object!
      const result = `${year}-${month}-${day}`;
      
      console.log('[parseDateString]', { 
        input: normalized, 
        parsed: { day, month, year },
        output: result 
      });
      
      return result;
    }
  }

  return null;
}

/**
 * Extract date from OCR lines (for Turkish receipts)
 * Searches for TARIH/TARİH/DATE keywords
 */
export function extractDateFromLines(
  lines: string[]
): DateParseResult {
  const dateKeywords = [
    /TARIH[:\s]*/i,
    /TARİH[:\s]*/i, 
    /DATE[:\s]*/i,
    /FECHA[:\s]*/i,
    /DATA[:\s]*/i,
  ];

  // Search for date keywords in lines
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Check if line contains date keyword
    const hasKeyword = dateKeywords.some(keyword => keyword.test(line));
    
    if (hasKeyword) {
      console.log('[extractDateFromLines] 🎯 Found date line:', {
        lineIndex: i,
        line: line
      });

      const parsed = parseDateString(line);
      
      if (parsed) {
        return {
          value: parsed,
          confidence: 0.95,
          sourceLine: i
        };
      }
    }
  }

  // Fallback: Search for any date pattern (even without keywords)
  for (let i = 0; i < Math.min(lines.length, 40); i++) {
    const line = lines[i];
    const parsed = parseDateString(line);
    
    if (parsed) {
      console.log('[extractDateFromLines] 📅 Found date without keyword:', {
        lineIndex: i,
        line: line,
        parsed: parsed
      });

      return {
        value: parsed,
        confidence: 0.75, // Lower confidence without keyword
        sourceLine: i
      };
    }
  }

  // No date found
  console.log('[extractDateFromLines] ⚠️ No date found in receipt');
  
  return {
    value: new Date().toISOString().split('T')[0],
    confidence: 0.0,
  };
}

/**
 * Validate date is within reasonable range
 */
export function isValidReceiptDate(dateStr: string): boolean {
  const date = new Date(dateStr);
  const now = new Date();
  const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
  const oneMonthFuture = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());

  return date >= oneYearAgo && date <= oneMonthFuture;
}
