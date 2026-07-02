/**
 * Travel Price Summary Extractor v4
 * 
 * Extracts fare, taxes & fees, seat selection, and total from travel receipts
 * (especially Trip.com-style flight tickets) that have a "Price Summary / Fiyat Özeti" table.
 * 
 * IMPORTANT: "Taxes & fees / Vergiler ve ücretler" is NOT VAT - it's state-like charges
 * (airport fees, fuel surcharges, etc.). VAT should be null/undefined unless explicitly found.
 * 
 * v4 Changes:
 * - Supports both OCR lines and plain text (for PDF text layer)
 * - Enhanced TR/EN label matching
 * - Better amount parsing for TR format (1.386,67) and EN format (TRY 1,386.67)
 * - Filters out card numbers, e-ticket numbers, etc.
 */

import { OCRLine } from "./types";

export interface Money {
  value: number;
  currency?: string;
  confidence: number;
}

export interface TravelPriceSummary {
  fare?: Money;
  taxesAndFees?: Money; // NOT VAT - this is state-like charges
  seatSelection?: Money;
  baggage?: Money;
  serviceFee?: Money;
  total: Money;
  confidence: number;
  reasons: string[];
  evidence?: {
    anchorFound: boolean;
    labelIndices: Array<{ label: string; lineNo: number }>;
    amountsFound: Array<{ value: number; lineNo: number }>;
    totalLineIndex?: number;
    mapping: Array<{ label: string; amount: number; method: string }>;
  };
}

/**
 * Hard negative filters: patterns that should NEVER be treated as money amounts
 * IMPORTANT: Lines containing "Toplam" or "Total" are NOT blocked even if they contain masked card numbers
 */
function isNegativeFilterMatch(line: string, isTotalLine: boolean = false): boolean {
  // If this is a total line, skip blocking patterns related to card numbers
  // Total lines like "Toplam (Mastercard (kredi kartı) 540062***98)" should be allowed
  if (isTotalLine && /\b(?:toplam|total)\b/i.test(line)) {
    // Only block non-card-number patterns for total lines
    const nonCardNegativePatterns = [
      // GST/Registration numbers
      /(GST|Kayıt\s*No|Reg\.?\s*No|Sicil\s*No|VKN|Mersis|ETTN|Registration)/i,
      // Booking/Reservation numbers
      /(Rezervasyon\s*No|Booking\s*No)/i,
      // E-ticket/Passenger numbers
      /(E-?bilet|E-?ticket|Passenger|Yolcu)/i,
      // Ticket/ID patterns: 310-2159990016 (but NOT 540062***98 which is a card number)
      /\b\d{3}-\d{9,}\b/,
      // Long alphanumeric IDs: 201613701E
      /\b\d{9,}[A-Z]\b/,
    ];
    return nonCardNegativePatterns.some(pattern => pattern.test(line));
  }
  
  // For non-total lines, apply all negative filters
  const negativePatterns = [
    // GST/Registration numbers
    /(GST|Kayıt\s*No|Reg\.?\s*No|Sicil\s*No|VKN|Mersis|ETTN|Registration)/i,
    // Booking/Reservation numbers
    /(Rezervasyon\s*No|Booking\s*No)/i,
    // E-ticket/Passenger numbers
    /(E-?bilet|E-?ticket|Passenger|Yolcu)/i,
    // Masked card numbers
    /(Mastercard|Visa|card|kredi\s*kartı).*[\*\*]{3,}/i,
    // Ticket/ID patterns: 310-2159990016, 540062***98
    /\b\d{3}-\d{9,}\b/,
    /\b\d{6}\*{2,}\d{2}\b/,
    // Long alphanumeric IDs: 201613701E
    /\b\d{9,}[A-Z]\b/,
  ];
  
  return negativePatterns.some(pattern => pattern.test(line));
}

/**
 * Check if a number token is standalone (not part of alphanumeric ID)
 */
function isStandaloneNumericToken(value: string, line: string): boolean {
  const valueIndex = line.indexOf(value);
  if (valueIndex < 0) return false;
  
  const before = valueIndex > 0 ? line[valueIndex - 1] : ' ';
  const after = valueIndex + value.length < line.length ? line[valueIndex + value.length] : ' ';
  
  // If before or after is a letter, it's part of alphanumeric token
  if (/[A-Za-z]/.test(before) || /[A-Za-z]/.test(after)) {
    return false;
  }
  
  if (/[A-Za-z]/.test(value)) {
    return false;
  }
  
  return true;
}

/**
 * Strip diacritics from string (e.g., "özeti" -> "ozeti")
 */
function stripDiacritics(s: string): string {
  return s.normalize("NFD").replace(/\p{Diacritic}/gu, "");
}

/**
 * Normalize line: strip diacritics, normalize whitespace
 */
function normalizeLine(s: string): string {
  return stripDiacritics(s)
    .replace(/\u00A0/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Parse Turkish number format: 4.126,82 -> 4126.82
 * Also handles EN format: 4,126.82 -> 4126.82
 * Handles formats like "4.126,82", "TRY 4,126.82", "4 126,82", "4126.82"
 */
function parseMoneyValue(raw: string): number | null {
  if (!raw) return null;
  
  const s0 = raw
    .replace(/[₺]/g, "")
    .replace(/\b(TRY|TL)\b/gi, "")
    .replace(/\s+/g, "")
    .trim();

  const m = s0.match(/(\d[\d.,]*)/);
  if (!m) return null;
  const s = m[1];

  const hasDot = s.includes(".");
  const hasComma = s.includes(",");

  let decSep: "." | "," | null = null;

  if (hasDot && hasComma) {
    decSep = s.lastIndexOf(",") > s.lastIndexOf(".") ? "," : ".";
  } else if (hasComma) {
    decSep = /,\d{2}$/.test(s) ? "," : null;
  } else if (hasDot) {
    decSep = /\.(\d{2})$/.test(s) ? "." : null;
  }

  let norm = s;
  if (decSep === ",") {
    norm = norm.replace(/\./g, "").replace(",", ".");
  } else if (decSep === ".") {
    norm = norm.replace(/,/g, "");
  } else {
    norm = norm.replace(/[.,]/g, "");
  }

  const v = Number(norm);
  return Number.isFinite(v) && v > 0 ? v : null;
}

/**
 * Extract first money amount from a line
 * Supports TR format: 4.126,82 TL, TRY 4,126.82, etc.
 */
function extractFirstMoneyFromLine(line: string): number | null {
  // Allow currency before/after
  const moneyish = line.match(/(?:TRY|TL|₺)?\s*\d[\d.,\s]*\d(?:\s*(?:TRY|TL|₺))?/i);
  if (!moneyish) return null;
  return parseMoneyValue(moneyish[0]);
}

/**
 * Extract money amount from a line
 * Supports TR format: 4.126,82 TL
 * Supports EN format: TRY 4,126.82 or 4,126.82 TRY
 */
function extractMoneyFromLine(line: string, isTotalLine: boolean = false): Money | null {
  // Skip negative filter lines (IDs, etc.)
  // For total lines, allow card numbers in the line
  if (isNegativeFilterMatch(line, isTotalLine)) {
    return null;
  }
  
  const value = extractFirstMoneyFromLine(line);
  if (!value || value <= 0 || value >= 1000000) {
    return null;
  }
  
  // Currency tokens
  const currencyPattern = /(?:TRY|TL|THB|฿|USD|\$|EUR|€|GBP|£)/i;
  const hasCurrencyToken = currencyPattern.test(line);
  const currencyMatch = line.match(currencyPattern);
  
  return {
    value,
    currency: currencyMatch ? currencyMatch[0].toUpperCase() : "TRY",
    confidence: hasCurrencyToken ? 0.9 : 0.7,
  };
}

/**
 * Check if should call travel extractor
 */
export function shouldCallTravelExtractor(
  fullText: string,
  merchantName?: string,
  category?: string
): boolean {
  const lowerText = fullText.toLowerCase();
  const lowerMerchant = (merchantName || "").toLowerCase();
  
  // Check for "Price Summary" or "Fiyat Özeti"
  if (/(?:price\s*summary|fiyat\s*özeti)/i.test(fullText)) {
    return true;
  }
  
  // Check for label sets: [Fare/Ücret] AND [Taxes & fees/Vergiler ve ücretler] AND [Total/Toplam]
  const hasFare = /\b(?:fare|ücret)\b/i.test(fullText);
  const hasTaxesAndFees = /\b(?:taxes?\s*(?:and|&)?\s*fees?|vergi(?:ler)?\s*(?:ve|and)?\s*ücretler?)\b/i.test(fullText);
  const hasTotal = /\b(?:total|toplam)\b/i.test(fullText);
  
  if (hasFare && hasTaxesAndFees && hasTotal) {
    return true;
  }
  
  // Flight-specific detection signals (Trip.com and BudgetAir/Travix styles)
  const looksLikeFlight =
    /Flight number:/i.test(fullText) ||
    /Adult ticket\(s\)/i.test(fullText) ||
    /International Airport/i.test(fullText) ||
    /Flight tickets are exempt from tax/i.test(fullText) ||
    (/Price Details/i.test(fullText) && /Flight tickets are exempt from tax/i.test(fullText));
  
  if (looksLikeFlight) {
    return true;
  }
  
  // Check merchant name or category
  if (/\b(?:trip\.com|agoda|booking\.com|expedia)\b/i.test(lowerMerchant)) {
    return true;
  }
  
  if (category && /(?:travel|flight|airline)/i.test(category)) {
    return true;
  }
  
  return false;
}

/**
 * Calculate travel likelihood score (for PDF text override activation)
 * Returns number of signals (>=2 means high likelihood)
 */
export function calculateTravelLikelihood(
  text: string,
  merchantName?: string,
  category?: string
): number {
  let signals = 0;
  const lowerText = text.toLowerCase();
  const lowerMerchant = (merchantName || "").toLowerCase();
  
  // Merchant keywords
  if (/\b(?:trip\.com|agoda|booking\.com|expedia|airbnb)\b/i.test(lowerMerchant)) {
    signals++;
  }
  
  // Travel keywords
  if (/(?:price\s*summary|fiyat\s*özeti|fare|ücret|taxes?\s*(?:and|&)?\s*fees?|vergi(?:ler)?\s*(?:ve|and)?\s*ücretler?|seat\s*selection|koltuk\s*seçimi)/i.test(text)) {
    signals++;
  }
  
  // Flight-specific signals (Trip.com and BudgetAir/Travix styles)
  if (/(?:Flight number:|Adult ticket\(s\)|International Airport|Flight tickets are exempt from tax|Price Details)/i.test(text)) {
    signals++;
  }
  
  // Category
  if (category && /(?:travel|flight|airline)/i.test(category)) {
    signals++;
  }
  
  return signals;
}

/**
 * Extract travel price summary from text (supports both OCR lines and plain text)
 */
export function extractTravelPriceSummary(
  linesOrText: OCRLine[] | string,
  fullText?: string
): TravelPriceSummary | null {
  // Convert input to lines format
  let lineTexts: string[];
  let lines: OCRLine[];
  
  if (typeof linesOrText === "string") {
    // Plain text input (from PDF text layer)
    const text = linesOrText;
    lineTexts = text.split(/\n/).map(line => normalizeLine(line)).filter(line => line.length > 0);
    lines = lineTexts.map((text, index) => ({ text, confidence: 1, lineNo: index }));
    fullText = text;
  } else {
    // OCR lines input
    lines = linesOrText;
    lineTexts = lines.map(l => normalizeLine(l.text));
    if (!fullText) {
      fullText = lineTexts.join("\n");
    }
  }
  
  // Stop pattern: stop searching after these patterns
  const STOP_RE = /(bu makbuz|this receipt|otomatik olarak oluşturulmuştur)/i;
  
  // Find "Price Summary" or "Fiyat Özeti" header (normalized, so "fiyat ozeti" works)
  let headerIndex = lineTexts.findIndex(line =>
    /\b(?:price\s*summary|fiyat\s*ozeti)\b/i.test(line)
  );
  
  // Fallback: Look for "Fiyat" and "Özeti" on separate lines or nearby
  if (headerIndex < 0) {
    for (let i = 0; i < lineTexts.length - 1; i++) {
      const line1 = lineTexts[i].toLowerCase();
      const line2 = lineTexts[i + 1]?.toLowerCase() || "";
      if ((line1.includes("fiyat") && line2.includes("ozeti")) ||
          (line1.includes("fiyat") && line1.includes("ozeti")) ||
          (line1.includes("price") && line2.includes("summary")) ||
          (line1.includes("price") && line1.includes("summary"))) {
        headerIndex = i;
        console.log(`[travel-extractor] Found anchor in fallback mode at line ${i}: "${lineTexts[i]}" + "${lineTexts[i + 1]}"`);
        break;
      }
    }
  }
  
  if (headerIndex >= 0) {
    console.log(`[travel-extractor] Anchor found at line ${headerIndex}: "${lineTexts[headerIndex]}"`);
  } else {
    console.log(`[travel-extractor] ⚠️ Anchor not found. Searched ${lineTexts.length} lines.`);
  }
  
  // Search window: from header to header+20 lines, or entire document if no header
  const searchStart = headerIndex >= 0 ? headerIndex : 0;
  let searchEnd = headerIndex >= 0 ? Math.min(lines.length, headerIndex + 20) : lines.length;
  
  // Find "Toplam/Total" to end window early, or stop pattern
  if (headerIndex >= 0) {
    for (let i = headerIndex; i < Math.min(lines.length, headerIndex + 20); i++) {
      if (STOP_RE.test(lineTexts[i])) {
        searchEnd = i;
        break;
      }
      if (/\b(?:toplam|total)\b/i.test(lineTexts[i]) && i > headerIndex + 2) {
        searchEnd = i + 3;
        break;
      }
    }
  }
  
  console.log(`[travel-extractor] Search window: start=${searchStart}, end=${searchEnd}, totalLines=${lines.length}, anchorFound=${headerIndex >= 0}`);
  
  // Label patterns (both TR and EN) - more flexible matching
  // Note: lines are normalized (diacritics stripped), so "ücret" becomes "ucret", "özeti" becomes "ozeti"
  const labelPatterns = {
    fare: { 
      tr: /\b(?:ucret|ücret)\b/i, 
      en: /\b(?:fare)\b/i 
    },
    taxesAndFees: { 
      tr: /(?:vergi(?:ler)?\s*(?:ve|and)?\s*(?:ucretler?|ücretler?))/i, 
      en: /(?:taxes?\s*(?:and|&)?\s*fees?)/i 
    },
    seatSelection: { 
      tr: /(?:koltuk\s*(?:secimi|seçimi))/i, 
      en: /(?:seat\s*selection)/i 
    },
    baggage: { 
      tr: /(?:bagaj|baggage)/i, 
      en: /(?:baggage|luggage)/i 
    },
    serviceFee: { 
      tr: /(?:hizmet\s*bedeli|hizmet\s*(?:ucreti|ücreti))/i, 
      en: /(?:service\s*fee)/i 
    },
    total: { 
      tr: /\b(?:toplam)\b/i, 
      en: /\b(?:total)\b/i 
    },
  };
  
  // Step 1: Collect label lines in order
  const labelLines: Array<{ label: string; lineNo: number; type: string }> = [];
  for (let i = searchStart; i < searchEnd; i++) {
    const line = lineTexts[i];
    
    for (const [type, patterns] of Object.entries(labelPatterns)) {
      if ((patterns.tr && patterns.tr.test(line)) || (patterns.en && patterns.en.test(line))) {
        if (!labelLines.find(l => l.type === type)) {
          labelLines.push({ label: line.trim(), lineNo: i, type });
          console.log(`[travel-extractor] Found label: ${type} at line ${i}: "${line.trim()}"`);
        }
      }
    }
  }
  
  console.log(`[travel-extractor] Found ${labelLines.length} labels:`, labelLines.map(l => `${l.type}@${l.lineNo}`));
  
  // Initialize result
  const result: Partial<TravelPriceSummary> = {
    confidence: 0,
    reasons: [],
    evidence: {
      anchorFound: headerIndex >= 0,
      labelIndices: labelLines.map(l => ({ label: l.label, lineNo: l.lineNo })),
      amountsFound: [],
      mapping: [],
    },
  };
  
  // Step 2: Extract amounts from label lines (same line or next 1-3 lines)
  // Check document currency for TR money format validation
  const documentCurrency = /(?:TRY|TL)/i.test(fullText) ? "TRY" : undefined;
  
  for (const label of labelLines) {
    const line = lineTexts[label.lineNo];
    const isTotalLabel = label.type === "total";
    
    // Debug: log total label line
    if (isTotalLabel) {
      console.log(`[travel-extractor] totalLabelLine: "${line.trim()}" (line ${label.lineNo + 1})`);
    }
    
    // Check same line first
    // For total lines, allow card numbers in the line
    const sameLineMoney = extractMoneyFromLine(line, isTotalLabel);
    if (sameLineMoney && sameLineMoney.value > 0) {
      if (label.type === "fare" && !result.fare) {
        result.fare = sameLineMoney;
        result.reasons?.push(`Found ${label.type} on same line: ${sameLineMoney.value.toFixed(2)}`);
        console.log(`[travel-extractor] Found ${label.type} amount on same line: ${sameLineMoney.value.toFixed(2)}`);
      } else if (label.type === "taxesAndFees" && !result.taxesAndFees) {
        result.taxesAndFees = sameLineMoney;
        result.reasons?.push(`Found ${label.type} on same line: ${sameLineMoney.value.toFixed(2)}`);
        console.log(`[travel-extractor] Found ${label.type} amount on same line: ${sameLineMoney.value.toFixed(2)}`);
      } else if (label.type === "seatSelection" && !result.seatSelection) {
        result.seatSelection = sameLineMoney;
        result.reasons?.push(`Found ${label.type} on same line: ${sameLineMoney.value.toFixed(2)}`);
        console.log(`[travel-extractor] Found ${label.type} amount on same line: ${sameLineMoney.value.toFixed(2)}`);
      } else if (isTotalLabel && !result.total) {
        result.total = sameLineMoney;
        if (result.evidence) {
          result.evidence.totalLineIndex = label.lineNo;
        }
        result.reasons?.push(`Found ${label.type} on same line: ${sameLineMoney.value.toFixed(2)}`);
        console.log(`[travel-extractor] Found ${label.type} amount on same line: ${sameLineMoney.value.toFixed(2)}`);
        console.log(`[travel-extractor] totalAmountLine: "${line.trim()}" (line ${label.lineNo + 1})`);
        console.log(`[travel-extractor] parsedTotal: ${sameLineMoney.value.toFixed(2)} ${sameLineMoney.currency || ""}`);
      }
    }
    
    // Check next 1-3 lines if not found on same line
    if ((label.type === "fare" && !result.fare) ||
        (label.type === "taxesAndFees" && !result.taxesAndFees) ||
        (label.type === "seatSelection" && !result.seatSelection) ||
        (isTotalLabel && !result.total)) {
      for (let i = label.lineNo + 1; i <= Math.min(lines.length - 1, label.lineNo + 3); i++) {
        // For total, also check if it's a total line (might have card numbers)
        const nextLineIsTotal = isTotalLabel && /\b(?:toplam|total)\b/i.test(lineTexts[i]);
        const nextLineMoney = extractMoneyFromLine(lineTexts[i], nextLineIsTotal);
        if (nextLineMoney && nextLineMoney.value > 0) {
          // For TR money formats without explicit currency, require TL/TRY nearby OR document currency is TRY
          if (!nextLineMoney.currency || nextLineMoney.currency === "TRY") {
            const lineHasCurrency = /(?:TRY|TL)/i.test(lineTexts[i]);
            if (!lineHasCurrency && documentCurrency !== "TRY") {
              // Skip if no currency token and document currency is not TRY
              continue;
            }
          }
          
          if (label.type === "fare" && !result.fare) {
            result.fare = nextLineMoney;
            result.reasons?.push(`Found ${label.type} in next line: ${nextLineMoney.value.toFixed(2)} (line ${i + 1})`);
            console.log(`[travel-extractor] Found ${label.type} amount in next line ${i + 1}: ${nextLineMoney.value.toFixed(2)} - "${lineTexts[i].trim()}"`);
            break;
          } else if (label.type === "taxesAndFees" && !result.taxesAndFees) {
            result.taxesAndFees = nextLineMoney;
            result.reasons?.push(`Found ${label.type} in next line: ${nextLineMoney.value.toFixed(2)} (line ${i + 1})`);
            console.log(`[travel-extractor] Found ${label.type} amount in next line ${i + 1}: ${nextLineMoney.value.toFixed(2)} - "${lineTexts[i].trim()}"`);
            console.log(`[travel-extractor] parsedTaxesFees: ${nextLineMoney.value.toFixed(2)} ${nextLineMoney.currency || ""}`);
            break;
          } else if (label.type === "seatSelection" && !result.seatSelection) {
            result.seatSelection = nextLineMoney;
            result.reasons?.push(`Found ${label.type} in next line: ${nextLineMoney.value.toFixed(2)} (line ${i + 1})`);
            console.log(`[travel-extractor] Found ${label.type} amount in next line ${i + 1}: ${nextLineMoney.value.toFixed(2)} - "${lineTexts[i].trim()}"`);
            console.log(`[travel-extractor] parsedSeat: ${nextLineMoney.value.toFixed(2)} ${nextLineMoney.currency || ""}`);
            break;
          } else if (isTotalLabel && !result.total) {
            result.total = nextLineMoney;
            if (result.evidence) {
              result.evidence.totalLineIndex = i;
            }
            result.reasons?.push(`Found ${label.type} in next line: ${nextLineMoney.value.toFixed(2)} (line ${i + 1})`);
            console.log(`[travel-extractor] Found ${label.type} amount in next line ${i + 1}: ${nextLineMoney.value.toFixed(2)} - "${lineTexts[i].trim()}"`);
            console.log(`[travel-extractor] totalAmountLine: "${lineTexts[i].trim()}" (line ${i + 1})`);
            console.log(`[travel-extractor] parsedTotal: ${nextLineMoney.value.toFixed(2)} ${nextLineMoney.currency || ""}`);
            break;
          }
        }
      }
    }
  }
  
  // Fallback: Search entire document if anchor not found or missing values
  if (headerIndex < 0 || (!result.fare && !result.taxesAndFees)) {
    console.log(`[travel-extractor] Fallback mode: searching entire document.`);
    
    const allLabelLines: Array<{ label: string; lineNo: number; type: string }> = [];
    for (let i = 0; i < lineTexts.length; i++) {
      const line = lineTexts[i];
      for (const [type, patterns] of Object.entries(labelPatterns)) {
        if ((patterns.tr && patterns.tr.test(line)) || (patterns.en && patterns.en.test(line))) {
          if (!allLabelLines.find(l => l.type === type)) {
            allLabelLines.push({ label: line.trim(), lineNo: i, type });
          }
        }
      }
    }
    
    console.log(`[travel-extractor] Found ${allLabelLines.length} labels in fallback mode:`, allLabelLines.map(l => `${l.type}@${l.lineNo}`));
    
    // For each label, find amount in next 1-4 lines
    for (const label of allLabelLines) {
      if ((label.type === "fare" && result.fare) ||
          (label.type === "taxesAndFees" && result.taxesAndFees) ||
          (label.type === "seatSelection" && result.seatSelection) ||
          (label.type === "total" && result.total)) {
        continue; // Already found
      }
      
      const isTotalLabel = label.type === "total";
      // Debug: log total label line in fallback
      if (isTotalLabel) {
        console.log(`[travel-extractor] totalLabelLine (fallback): "${lineTexts[label.lineNo].trim()}" (line ${label.lineNo + 1})`);
      }
      
      for (let i = label.lineNo; i <= Math.min(lines.length - 1, label.lineNo + 4); i++) {
        // For total, also check if it's a total line (might have card numbers)
        const nextLineIsTotal = isTotalLabel && /\b(?:toplam|total)\b/i.test(lineTexts[i]);
        const money = extractMoneyFromLine(lineTexts[i], nextLineIsTotal);
        if (money && money.value > 0) {
          // For TR money formats without explicit currency, require TL/TRY nearby OR document currency is TRY
          if (!money.currency || money.currency === "TRY") {
            const lineHasCurrency = /(?:TRY|TL)/i.test(lineTexts[i]);
            if (!lineHasCurrency && documentCurrency !== "TRY") {
              // Skip if no currency token and document currency is not TRY
              continue;
            }
          }
          
          if (label.type === "fare" && !result.fare) {
            result.fare = money;
            result.reasons?.push(`Fallback: Found ${label.type}: ${money.value.toFixed(2)} (line ${i + 1})`);
            console.log(`[travel-extractor] Fallback: Found ${label.type} amount: ${money.value.toFixed(2)}`);
            break;
          } else if (label.type === "taxesAndFees" && !result.taxesAndFees) {
            result.taxesAndFees = money;
            result.reasons?.push(`Fallback: Found ${label.type}: ${money.value.toFixed(2)} (line ${i + 1})`);
            console.log(`[travel-extractor] Fallback: Found ${label.type} amount: ${money.value.toFixed(2)}`);
            console.log(`[travel-extractor] parsedTaxesFees: ${money.value.toFixed(2)} ${money.currency || ""}`);
            break;
          } else if (label.type === "seatSelection" && !result.seatSelection) {
            result.seatSelection = money;
            result.reasons?.push(`Fallback: Found ${label.type}: ${money.value.toFixed(2)} (line ${i + 1})`);
            console.log(`[travel-extractor] Fallback: Found ${label.type} amount: ${money.value.toFixed(2)}`);
            console.log(`[travel-extractor] parsedSeat: ${money.value.toFixed(2)} ${money.currency || ""}`);
            break;
          } else if (isTotalLabel && !result.total) {
            result.total = money;
            if (result.evidence) {
              result.evidence.totalLineIndex = i;
            }
            result.reasons?.push(`Fallback: Found ${label.type}: ${money.value.toFixed(2)} (line ${i + 1})`);
            console.log(`[travel-extractor] Fallback: Found ${label.type} amount: ${money.value.toFixed(2)}`);
            console.log(`[travel-extractor] totalAmountLine (fallback): "${lineTexts[i].trim()}" (line ${i + 1})`);
            console.log(`[travel-extractor] parsedTotal: ${money.value.toFixed(2)} ${money.currency || ""}`);
            break;
          }
        }
      }
    }
  }
  
  // Must have total
  if (!result.total) {
    console.log(`[travel-extractor] Extraction failed: no total found`);
    return null;
  }
  
  // Update evidence with found amounts
  const foundAmounts: Array<{ value: number; lineNo: number }> = [];
  if (result.fare) foundAmounts.push({ value: result.fare.value, lineNo: -1 });
  if (result.taxesAndFees) foundAmounts.push({ value: result.taxesAndFees.value, lineNo: -1 });
  if (result.seatSelection) foundAmounts.push({ value: result.seatSelection.value, lineNo: -1 });
  if (result.total) foundAmounts.push({ value: result.total.value, lineNo: result.evidence?.totalLineIndex || -1 });
  
  if (result.evidence) {
    result.evidence.amountsFound = foundAmounts;
  }
  
  // Reconciliation: fare + taxesAndFees + seatSelection ≈ total (tolerance 0.5)
  if (result.fare && result.taxesAndFees) {
    const calculatedSum = (result.fare.value || 0) + 
                         (result.taxesAndFees.value || 0) + 
                         (result.seatSelection?.value || 0) +
                         (result.baggage?.value || 0) +
                         (result.serviceFee?.value || 0);
    const difference = Math.abs(calculatedSum - result.total.value);
    
    if (difference <= 0.5) {
      result.confidence = 0.95;
      result.reasons?.push(`Reconciliation passed: sum (${calculatedSum.toFixed(2)}) ≈ total (${result.total.value.toFixed(2)}), diff=${difference.toFixed(2)}`);
    } else {
      result.confidence = 0.7;
      result.reasons?.push(`Reconciliation warning: sum (${calculatedSum.toFixed(2)}) ≠ total (${result.total.value.toFixed(2)}), diff=${difference.toFixed(2)}`);
    }
  } else {
    result.confidence = 0.6;
    result.reasons?.push("Partial extraction (missing fare or taxes & fees)");
  }
  
  return result as TravelPriceSummary;
}
