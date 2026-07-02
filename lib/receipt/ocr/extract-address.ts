import type { OCRLine } from "../types";
import { looksLikeAddress, containsAddressTerm, hasPrimaryAddressTerm } from "../address-whitelist";


/** Address blacklist — Turkish invoice labels like "Belge No" (document no) and "Sıra No" (sequence no) are never counted as part of an address */
const ADDRESS_BLACKLIST_PATTERNS = [
  /^(belge|belge\s*no|sıra|sira)\s*(no|numara)?\s*[:=]?\s*\d*/i,
  /\b(belge|belge\s*no|sıra|sira)\s*(no|numara)?\s*[:=]?\s*\d+/i,
];

/**
 * Extract merchant address from OCR lines
 * Address is usually found after merchant name, contains street names, numbers, postal codes
 * Uses address whitelist (MAH, SOK, cadde, il/ilçe) for Turkish receipts
 * An address is not counted from "no"/"numara"/"apt" alone; at least one of mah, sok, il, ilçe (or similar) is required
 */
export function extractAddress(lines: OCRLine[]): { address: string; confidence: number } {
  // Address patterns for Turkish, English, and Indonesian (primary terms: mah, sok, cad, bulvar, street, etc.)
  const addressPatterns = [
    // Turkish patterns — primary address terms (no/numara/apt is only valid together with one of these)
    /\b(cad(?:desi)?|sok(?:ak)?|bulv(?:ar)?|mah(?:alle)?|mah\.?|plaza|merkez|avm|şube)\b/i,
    // English patterns
    /\b(street|st|avenue|ave|road|rd|boulevard|blvd|drive|dr|lane|ln|way|circle|ct|plaza|mall|center|building|bldg)\b/i,
    // Indonesian patterns
    /\b(jl\.?|jalan|kecamatan|kabupaten|desa|kelurahan|rt\s*\/?\s*rw|gang|gg\.?|perumahan|komplek|blok\s+[a-z]|lantai|lt\.?)\b/i,
  ];

  // Postal code patterns
  const postalCodePatterns = [
    /\b\d{5}\b/, // 5-digit postal codes (Turkey, US)
    /\b\d{4,5}\s*[A-Z]{2}\b/i, // Dutch format (1234 AB)
  ];

  // Skip words that are NOT addresses (includes Turkish ı/i etc. typo variants)
  const skipWords = new Set([
    'receipt', 'invoice', 'bill', 'fiş', 'fis', 'fatura', 'faturı', 'tarih', 'tarıh', 'date',
    'total', 'toplam', 'amount', 'tutar', 'vat', 'kdv', 'tax', 'vergi', 'vergı',
    'cash', 'credit', 'card', 'nakit', 'nakıt', 'kredi', 'kredı', 'kartı', 'karti',
    'tel', 'telefon', 'phone', 'fax', 'e-posta', 'email', 'web', 'www', 'http', '@',
    'saat', 'time', 'queue', 'num', 'number', 'numara',
  ]);

  let bestAddress: { address: string; confidence: number } | null = null;
  const addressLines: string[] = [];

  // Search first 30 lines (address is usually near merchant name at top)
  for (let i = 0; i < Math.min(30, lines.length); i++) {
    const line = lines[i].text.trim();
    
    // Skip if line is too short or too long
    if (line.length < 10 || line.length > 200) continue;
    
    // Skip address blacklist ("Belge No", "Sıra No" etc. invoice labels)
    if (ADDRESS_BLACKLIST_PATTERNS.some(p => p.test(line))) continue;
    
    // Skip if line contains skip words
    const lowerLine = line.toLowerCase();
    const words = lowerLine.split(/\s+/);
    if (words.some(word => skipWords.has(word))) continue;
    
    // Skip if line is mostly numbers (likely totals, dates, etc.)
    if (/^\d+[\s\d,\.\-/]*$/.test(line)) continue;
    
    // Check if line matches primary address patterns (mah, sok, cad, il/ilçe, etc.)
    const hasAddressPattern = addressPatterns.some(pattern => pattern.test(line)) || containsAddressTerm(line);
    const hasPostalCode = postalCodePatterns.some(pattern => pattern.test(line));
    
    // Secondary indicators (no: digits, apt, kat, blok) — not sufficient alone; a primary term is required
    const hasAddressIndicators = /\b(no\s*[:.]?\s*\d+|apt\s*[:.]?\s*\d+|kat\s*[:.]?\s*\d+|blok\s*[:.]?\s*[a-z0-9]+)\b/i.test(line);
    
    // An address is not counted from no/numara/apt alone; at least one of mah, sok, il, ilçe, etc. is required
    const hasPrimary = hasPrimaryAddressTerm(line);
    const acceptByIndicatorsOnly = hasAddressIndicators && !hasAddressPattern && !hasPostalCode;
    const acceptByContainsTermOnly = containsAddressTerm(line) && !addressPatterns.some(p => p.test(line));
    if (acceptByIndicatorsOnly || (acceptByContainsTermOnly && !hasPrimary)) continue;
    
    if (hasAddressPattern || hasPostalCode || (hasAddressIndicators && hasPrimary)) {
      // This looks like an address line
      addressLines.push(line);
      
      // Calculate confidence based on indicators
      let confidence = 0.5;
      if (hasAddressPattern) confidence += 0.2;
      if (hasPostalCode) confidence += 0.2;
      if (hasAddressIndicators) confidence += 0.1;
      
      // Boost confidence if line contains multiple address elements
      const addressElementCount = (line.match(/\b(cad|sok|bulv|mah|street|avenue|road|boulevard|no|apt|kat|blok|jl|jalan)\b/gi) || []).length;
      if (addressElementCount >= 2) confidence += 0.1;
      
      confidence = Math.min(confidence, 0.95);
      
      if (!bestAddress || confidence > bestAddress.confidence) {
        bestAddress = { address: line, confidence };
      }
    }
  }

  // If we found address lines, combine them (addresses can span multiple lines)
  if (addressLines.length > 0) {
    // Combine consecutive address lines
    let combinedAddress = addressLines[0];
    if (addressLines.length > 1) {
      // Try to combine up to 3 lines (typical address format)
      combinedAddress = addressLines.slice(0, Math.min(3, addressLines.length)).join(' ');
    }
    
    return {
      address: combinedAddress.trim(),
      confidence: bestAddress?.confidence || 0.7,
    };
  }

  // No address found
  return {
    address: "",
    confidence: 0,
  };
}
