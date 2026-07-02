import type { OCRLine, VATExtraction } from "../types";
import { parseTurkishNumber } from "./extract-total-simple";

/**
 * Hard negative filters: patterns that should NEVER be treated as VAT amounts
 */
function isNegativeVATFilter(line: string): boolean {
  const negativePatterns = [
    // GST/Registration numbers (NOT VAT - these are registration IDs)
    // Expanded to include all registration/ID keywords
    /(GST|Kayıt\s*No|Reg\.?\s*No|Sicil\s*No|VKN|Mersis|ETTN|Registration|Kayıt)/i,
    // Booking/Reservation numbers
    /(Rezervasyon\s*No|Booking\s*No)/i,
    // E-ticket/Passenger numbers
    /(E-?bilet|E-?ticket|Passenger|Yolcu)/i,
    // Masked card numbers
    /(Mastercard|Visa|card|kredi\s*kartı).*[\*\*]{3,}/i,
    // Ticket/ID patterns: 310-2159990016
    /\b\d{3}-\d{9,}\b/,
    // Long alphanumeric IDs: 201613701E, 201613701E, etc.
    /\b\d{9,}[A-Z]\b/,
    // Any line containing registration/ID keywords (even if VAT keyword exists)
    /\b(Reg|Kayıt|Sicil|VKN|Mersis|ETTN|Registration)\b/i,
  ];
  
  return negativePatterns.some(pattern => pattern.test(line));
}

/**
 * Check if a number token is standalone (not part of alphanumeric ID)
 * Example: "201613701E" -> "201" should NOT be extracted
 * Only standalone numeric tokens like "201.00", "1,234.56" should be extracted
 */
function isStandaloneNumericToken(value: string, line: string): boolean {
  // Must be a standalone numeric token (word boundary on both sides)
  // Pattern: standalone number with optional thousands/decimal separators
  // Examples: "201.00", "1,234.56", "201" (but NOT "201613701E")
  
  // Check if value is part of alphanumeric token (digit followed by letter or letter followed by digit)
  const valueIndex = line.indexOf(value);
  if (valueIndex < 0) return false;
  
  // Check characters before and after the value
  const before = valueIndex > 0 ? line[valueIndex - 1] : ' ';
  const after = valueIndex + value.length < line.length ? line[valueIndex + value.length] : ' ';
  
  // If before or after is a letter, it's part of alphanumeric token (e.g., "201613701E")
  if (/[A-Za-z]/.test(before) || /[A-Za-z]/.test(after)) {
    return false;
  }
  
  // Check if value itself contains letters (shouldn't happen but double-check)
  if (/[A-Za-z]/.test(value)) {
    return false;
  }
  
  // Must match standalone numeric pattern: word boundary + number + word boundary
  const standalonePattern = /\b\d{1,3}(?:[.,]\d{3})*(?:[,.]\d{2})?\b/;
  const fullMatch = line.substring(Math.max(0, valueIndex - 1), valueIndex + value.length + 1);
  return standalonePattern.test(fullMatch);
}

/**
 * Extract VAT from OCR lines
 * IMPORTANT: Only extracts explicit VAT/KDV lines, NOT "Taxes & fees" from travel receipts
 */
export function extractVAT(lines: OCRLine[]): VATExtraction {
  // Enhanced VAT patterns - handle country-specific VAT terms
  // IMPORTANT: Must contain explicit VAT keywords (KDV, VAT, etc.) - NOT "Taxes & fees"
  const vatPatterns = [
    // General: VAT, tax, vergi (but NOT "taxes & fees" - that's different)
    /(?:^|\b)(?:vat|tax|vergi)(?!\s*(?:and|&)\s*fees?)[\s:]*\*?\s*[bB]?\s*([\d,.]+)/i,
    /\*?\s*[bB]?\s*([\d,.]+)\s*(?:vat|tax|vergi)(?!\s*(?:and|&)\s*fees?)/i,
    // Turkish: KDV
    /(?:kdv)[\s:]*\*?\s*[bB]?\s*([\d,.]+)/i,
    /\*?\s*[bB]?\s*([\d,.]+)\s*(?:kdv)/i,
    // Malaysia: GST, SST (but NOT "GST Reg No" - that's registration)
    /(?:^|\b)(?:gst|sst)(?!\s*(?:Reg|Kayıt|No))[\s:]*\*?\s*[bB]?\s*([\d,.]+)/i,
    /\*?\s*[bB]?\s*([\d,.]+)\s*(?:gst|sst)(?!\s*(?:Reg|Kayıt|No))/i,
    // Singapore: GST (but NOT "GST Reg No")
    /(?:^|\b)(?:gst)(?!\s*(?:Reg|Kayıt|No))[\s:]*\*?\s*[bB]?\s*([\d,.]+)/i,
    /\*?\s*[bB]?\s*([\d,.]+)\s*(?:gst)(?!\s*(?:Reg|Kayıt|No))/i,
    // Indonesia: PPN
    /(?:ppn)[\s:]*\*?\s*[bB]?\s*([\d,.]+)/i,
    /\*?\s*[bB]?\s*([\d,.]+)\s*(?:ppn)/i,
    // Russia: НДС
    /(?:ндс)[\s:]*\*?\s*[bB]?\s*([\d,.]+)/i,
    /\*?\s*[bB]?\s*([\d,.]+)\s*(?:ндс)/i,
    // VAT percentage patterns
    /(?:vat|kdv|tax|vergi|gst|sst|ppn|ндс)[\s:]*\*?\s*(\d+(?:\.\d+)?)\s*%/i,
    /%\s*(\d+(?:\.\d+)?)\s*(?:vat|kdv|tax|vergi|gst|sst|ppn|ндс)/i,
    // Thai format: VAT Included (7%): B16.81
    /vat\s+included\s*\(?\s*\d+\s*%?\s*\)?\s*:?\s*[bB]?\s*([\d,.]+)/i,
  ];

  // Check last 15 lines (VAT usually near total)
  for (let i = lines.length - 1; i >= Math.max(0, lines.length - 15); i--) {
    const line = lines[i].text;
    
    // Skip lines that match negative filters (GST Reg No, ticket numbers, etc.)
    if (isNegativeVATFilter(line)) {
      continue;
    }
    
    for (const pattern of vatPatterns) {
      const match = line.match(pattern);
      if (match && match[1]) {
        const value = match[1].trim();
        
        // Check if it's a percentage
        if (value.includes("%") || line.includes("%")) {
          const rate = parseFloat(value.replace(/%/g, "")) / 100;
          if (!isNaN(rate) && rate > 0 && rate <= 0.25) {
            return {
              value: 0, // VAT amount not found, only rate
              confidence: 0.7,
              rate,
              sourceLine: lines[i].lineNo,
            };
          }
        } else {
          // VAT amount - handle Turkish number format and Thai Baht "B" prefix
          // CRITICAL: Only extract standalone numeric tokens, NOT alphanumeric IDs
          // Example: "GST Kayıt No: 201613701E" -> "201" should NOT be extracted
          const cleanValue = value.replace(/^\*+/, "").replace(/^[bB]\s*/, "").trim();
          
          // Check if this is a standalone numeric token (not part of alphanumeric ID)
          if (!isStandaloneNumericToken(cleanValue, line)) {
            continue; // Skip alphanumeric tokens like "201613701E"
          }
          
          const amount = parseTurkishNumber(cleanValue);
          if (amount !== null && amount > 0) {
            return {
              value: amount,
              confidence: 0.85,
              sourceLine: lines[i].lineNo,
            };
          }
        }
      }
    }
  }

  // No VAT found
  return {
    value: 0,
    confidence: 0,
  };
}
