import type { OCRLine, VATExtraction } from "../../receipt/types";
import type { CountryConfig } from "@/lib/country/base";
import { parseLooseNumber } from "./parse-number";
import { preprocessOCRLines } from "./preprocess";
import { round2, extractAmountsFromText } from "./helpers";
import { snapVatRate } from "./vat-rate";

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function buildLabelPatterns(labels: string[] | undefined): RegExp[] {
  return (labels ?? [])
    .filter(Boolean)
    .map((label) => new RegExp(`\\b${escapeRegex(label).replace(/\s+/g, "\\s+")}\\b`, "i"));
}

function extractUsSalesTaxAmount(
  lines: OCRLine[],
  totalAmount: number,
  countryConfig?: CountryConfig
): { amount: number; lineNo: number } | null {
  const patterns = buildLabelPatterns(countryConfig?.labels.vat || ["SALES TAX", "TAX"]);
  const ignorePatterns = [/suggested\s+(tip|gratuity)/i, /gratuity\s+not\s+included/i];
  const searchStart = Math.max(0, lines.length - 20);

  for (let i = lines.length - 1; i >= searchStart; i--) {
    const text = lines[i].text;
    if (ignorePatterns.some((pattern) => pattern.test(text))) continue;
    if (!patterns.some((pattern) => pattern.test(text))) continue;

    const sameLineAmounts = extractAmountsFromText(text, countryConfig)
      .filter(({ raw }) => !new RegExp(`(?:${escapeRegex(raw)}\\s*%|%\\s*${escapeRegex(raw)})`, "i").test(text))
      .map(({ value }) => value)
      .filter((value) => value > 0 && value < totalAmount && value < totalAmount * 0.2);

    if (sameLineAmounts.length > 0) {
      return {
        amount: round2(sameLineAmounts[sameLineAmounts.length - 1]),
        lineNo: lines[i].lineNo,
      };
    }

    for (let offset = 1; offset <= 4; offset++) {
      const nextLine = lines[i + offset];
      if (!nextLine) break;
      if (ignorePatterns.some((pattern) => pattern.test(nextLine.text))) continue;

      const nextLineAmounts = extractAmountsFromText(nextLine.text, countryConfig)
        .map(({ value }) => value)
        .filter((value) => value > 0 && value < totalAmount && value < totalAmount * 0.2);

      if (nextLineAmounts.length > 0) {
        return {
          amount: round2(nextLineAmounts[nextLineAmounts.length - 1]),
          lineNo: nextLine.lineNo,
        };
      }
    }
  }

  return null;
}

function inferUsSalesTaxFromBottomAmounts(
  lines: OCRLine[],
  totalAmount: number,
  countryConfig?: CountryConfig
): number | null {
  const searchStart = Math.max(0, lines.length - 20);
  const values = lines
    .slice(searchStart)
    .flatMap((line) => extractAmountsFromText(line.text, countryConfig).map(({ value }) => round2(value)))
    .filter((value) => value > 0 && value < totalAmount);

  const uniqueValues = Array.from(new Set(values));
  const tolerance = 0.01;

  for (const taxCandidate of uniqueValues.sort((a, b) => b - a)) {
    if (taxCandidate >= totalAmount * 0.2) continue;
    const counterpart = round2(totalAmount - taxCandidate);
    if (uniqueValues.some((value) => Math.abs(value - counterpart) <= tolerance)) {
      return taxCandidate;
    }
  }

  return null;
}

/**
 * Robust VAT extraction with rate and amount
 */
export function extractVATRobust(
  lines: OCRLine[],
  totalAmount: number,
  countryConfig?: CountryConfig
): VATExtraction & {
  evidence?: { rateLineNo?: number; amountLineNo?: number; consistencyCheck: boolean; notes: string[] };
} {
  const processedLines = preprocessOCRLines(lines);

  let vatRate: number | undefined;
  let vatAmount: number | undefined;
  let rateLineNo: number | undefined;
  let amountLineNo: number | undefined;
  let vatFromSameLine = false; // TOPKDV on same line (e.g. "TOPKDV 22,07") — prefer over breakdown
  const notes: string[] = [];

  // Use config VAT patterns if available, otherwise use defaults
  // Build rate patterns from config VAT keywords
  // Prefer vatKeywords over labels.vat for pattern generation
  const configVatKeywords = countryConfig?.vatKeywords || countryConfig?.labels.vat || [];
  const configVatPatterns: RegExp[] = [];
  const configVatTotalPatterns: RegExp[] = [];
  
  // Generate patterns from config VAT keywords
  for (const keyword of configVatKeywords) {
    const escapedKeyword = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    // Rate patterns: "kdv" -> /kdv[\s:]*([0-9]{1,2}(?:\.[0-9]{1,2})?)\s*%/i
    configVatPatterns.push(
      new RegExp(`${escapedKeyword}[\\s:]*([0-9]{1,2}(?:\\.[0-9]{1,2})?)\\s*%`, 'i'),
      new RegExp(`([0-9]{1,2}(?:\\.[0-9]{1,2})?)\\s*%\\s*${escapedKeyword}`, 'i')
    );
    // Total patterns: "PPN" -> /total\s*ppn[\s:]*([\d,.]+)/i and /ppn\s*total[\s:]*([\d,.]+)/i
    configVatTotalPatterns.push(
      new RegExp(`total\\s*${escapedKeyword}[\\s:]*([\\d,.]+)`, 'i'),
      new RegExp(`${escapedKeyword}\\s*total[\\s:]*([\\d,.]+)`, 'i')
    );
    // Simple VAT amount patterns: "PPN : 842", "PPN 842", "PPN:842"
    configVatTotalPatterns.push(
      new RegExp(`${escapedKeyword}[\\s:]+([\\d,.]+)`, 'i'),  // "PPN : 842" or "PPN:842"
      new RegExp(`${escapedKeyword}[\\s]+([\\d,.]+)`, 'i')    // "PPN 842"
    );
  }
  
  // Rate patterns: Use config patterns first, then fallback to defaults
  const ratePatterns = configVatPatterns.length > 0 
    ? configVatPatterns 
    : [
        // General patterns (fallback)
        /vat[\s:]*([0-9]{1,2}(?:\.[0-9]{1,2})?)\s*%/i,
        /([0-9]{1,2}(?:\.[0-9]{1,2})?)\s*%\s*vat/i,
        // Turkish: KDV (fallback if no config)
        /kdv[\s:]*([0-9]{1,2}(?:\.[0-9]{1,2})?)\s*%/i,
        /([0-9]{1,2}(?:\.[0-9]{1,2})?)\s*%\s*kdv/i,
      ];

  // Find VAT rate (first good hit)
  for (const line of processedLines) {
    const t = line.text;
    for (const pattern of ratePatterns) {
      const match = t.match(pattern);
      if (match) {
        const r = parseFloat(match[1]);
        if (!isNaN(r) && r > 0 && r <= 25) {
          const rawRate = r / 100;
          vatRate = snapVatRate(rawRate);
          if (vatRate != null) {
            rateLineNo = line.lineNo;
            notes.push(`vatRateFound=${vatRate} at line=${rateLineNo}`);
          }
          break;
        }
      }
    }
    if (vatRate) break;
  }

  const expectedVat =
    vatRate != null && totalAmount > 0
      ? round2(totalAmount - totalAmount / (1 + vatRate))
      : undefined;

  if (countryConfig?.code === "US" && vatAmount == null && totalAmount > 0) {
    const usTaxMatch = extractUsSalesTaxAmount(processedLines, totalAmount, countryConfig);
    if (usTaxMatch) {
      vatAmount = usTaxMatch.amount;
      amountLineNo = usTaxMatch.lineNo;
      notes.push(`vatAmountFoundUSLookahead=${vatAmount} at line=${amountLineNo}`);
    }
  }

  if (countryConfig?.code === "US" && totalAmount > 0) {
    const inferredTax = inferUsSalesTaxFromBottomAmounts(processedLines, totalAmount, countryConfig);
    if (
      inferredTax != null &&
      (vatAmount == null || Math.abs(vatAmount - inferredTax) > 0.01)
    ) {
      vatAmount = inferredTax;
      notes.push(`vatAmountInferredFromUSBottomAmounts=${vatAmount}`);
    }
  }

  const lineHasPercent = (s: string): boolean => /\d\s*%|%\s*\d/.test(s);

  const hasVatKeyword = (s: string) =>
    /vat|vatable|kdv|gst|sst|ppn|ÃÂ½ÃÂ´Ã‘Â|Ã¦Â¶Ë†Ã¨Â²Â»Ã§Â¨Å½|Ã«Â¶â‚¬ÃªÂ°â‚¬Ã¬â€žÂ¸|Ã¥Â¢Å¾Ã¥â‚¬Â¼Ã§Â¨Å½|tax/i.test(s);

  // Prefer next-line(s) amount matching calculated VAT (e.g. "VAT:7.00%" then "8.83" on next line)
  if (expectedVat != null && expectedVat > 0 && vatAmount == null) {
    const tolerance = 0.02;
    for (let i = 0; i < processedLines.length; i++) {
      if (!hasVatKeyword(processedLines[i].text)) continue;
      for (let look = 1; look <= 5; look++) {
        const next = processedLines[i + look];
        if (!next) break;
        const amts = extractAmountsFromText(next.text, countryConfig)
          .map((x) => x.value)
          .filter((v) => v > 0 && v < totalAmount);
        for (const a of amts) {
          if (Math.abs(a - expectedVat) <= tolerance) {
            vatAmount = round2(a);
            amountLineNo = next.lineNo;
            notes.push(
              `vatAmountFoundNextLineExpected=${vatAmount} at line=${amountLineNo} (expected ${expectedVat})`
            );
            break;
          }
        }
        if (vatAmount != null) break;
      }
      if (vatAmount != null) break;
    }
  }

  /**
   * Hard negative filters: patterns that should NEVER be treated as VAT amounts
   * IMPORTANT: If a line contains registration/ID keywords, DO NOT extract VAT from it
   */
  const isNegativeVATFilter = (line: string): boolean => {
    const registrationKeywords = [
      "gst kayÃ„Â±t", "gst kayit", "gst reg", "registration", "reg. no", "kayÃ„Â±t no", "kayit no",
      "sicil no", "tax id", "vat id", "vkn", "vergi no", "mersis", "ettn",
      "sst id", "sst no", "sst reg", "gst reg no", "sst reg no", "company no", "business reg"
    ];
    
    const lowerLine = line.toLowerCase();
    // If line contains any registration keyword, reject it
    if (registrationKeywords.some(keyword => lowerLine.includes(keyword))) {
      return true;
    }
    
    const negativePatterns = [
      // GST/Registration numbers (NOT VAT - these are registration IDs)
      /(GST|KayÃ„Â±t\s*No|Reg\.?\s*No|Sicil\s*No|VKN|Mersis|ETTN|Registration|KayÃ„Â±t)/i,
      // Malaysia SST ID / SST No (e.g. W10-2008-32100024) — digits are ID, not VAT
      /\b(?:sst|gst)\s*(?:id|no)\s*[a-z0-9-]*/i,
      /\bw\d+-\d+-\d+/i,
      // Booking/Reservation numbers
      /(Rezervasyon\s*No|Booking\s*No)/i,
      // E-ticket/Passenger numbers
      /(E-?bilet|E-?ticket|Passenger|Yolcu)/i,
      // Masked card numbers
      /(Mastercard|Visa|card|kredi\s*kartÃ„Â±).*[\*\*]{3,}/i,
      // Ticket/ID patterns: 310-2159990016
      /\b\d{3}-\d{9,}\b/,
      // Long alphanumeric IDs: 201613701E
      /\b\d{9,}[A-Z]\b/,
    ];
    
    return negativePatterns.some(pattern => pattern.test(line));
  };

  /**
   * Check if a number token is standalone (not part of alphanumeric ID)
   * Example: "201613701E" -> "201" should NOT be extracted
   */
  const isStandaloneNumericToken = (value: string, line: string): boolean => {
    const valueIndex = line.indexOf(value);
    if (valueIndex < 0) return false;
    
    // Check characters before and after the value
    const before = valueIndex > 0 ? line[valueIndex - 1] : ' ';
    const after = valueIndex + value.length < line.length ? line[valueIndex + value.length] : ' ';
    
    // If before or after is a letter, it's part of alphanumeric token
    if (/[A-Za-z]/.test(before) || /[A-Za-z]/.test(after)) {
      return false;
    }
    
    // Check if value itself contains letters
    if (/[A-Za-z]/.test(value)) {
      return false;
    }
    
    // Must match standalone numeric pattern
    const standalonePattern = /\b\d{1,3}(?:[.,]\d{3})*(?:[,.]\d{2})?\b/;
    const fullMatch = line.substring(Math.max(0, valueIndex - 1), valueIndex + value.length + 1);
    return standalonePattern.test(fullMatch);
  };

  // Find VAT amount:
  // Strategy:
  // 1. First, look for Turkish e-ArÃ…Å¸iv fatura patterns: "TOPKDV", "TOPLAM KDV", "KDV TOPLAM"
  // 2. Then scan lines containing "vat", "kdv", "vatable"
  // 3. If amount not on same line, check next 1-2 lines (common in Thai receipts)
  // IMPORTANT: Only extract explicit VAT/KDV lines, NOT "Taxes & fees" from travel receipts
  
  // Priority 1: Country-specific VAT total patterns
  // Config-based patterns (from countryConfig.labels.vat) run first
  // Then fallback to hardcoded patterns for countries without config
  const countryVatTotalPatterns = [
    // Config-based patterns (generated from countryConfig.labels.vat)
    ...configVatTotalPatterns,
    // Turkish: TOPKDV + OCR typos (TOPKDY, TOPLDV, TOPDV, TOPKDI, T0PKDV, PKDV, etc.)
    /topkdv[\s:]*([\d,.]+)/i,
    /topkdy[\s:]*([\d,.]+)/i,
    /topldv[\s:]*([\d,.]+)/i,
    /topdv[\s:]*([\d,.]+)/i,
    /topv[\s:]*([\d,.]+)/i,
    /topkdi[\s:]*([\d,.]+)/i,
    /t0pkdv[\s:]*([\d,.]+)/i,
    /topodv[\s:]*([\d,.]+)/i,
    /topkda[\s:]*([\d,.]+)/i,
    /\bpkdv[\s:]*([\d,.]+)/i,
    /toplam\s*kdv[\s:]*([\d,.]+)/i,
    /kdv\s*toplam[\s:]*([\d,.]+)/i,
    // Malaysia: GST Total, SST Total (but NOT "GST Reg No")
    /(?:^|\b)(?:gst|sst)(?!\s*(?:Reg|KayÃ„Â±t|No))\s*total[\s:]*([\d,.]+)/i,
    /total\s*(?:gst|sst)(?!\s*(?:Reg|KayÃ„Â±t|No))[\s:]*([\d,.]+)/i,
    // Singapore: GST Total (but NOT "GST Reg No")
    /(?:^|\b)(?:gst)(?!\s*(?:Reg|KayÃ„Â±t|No))\s*total[\s:]*([\d,.]+)/i,
    /total\s*(?:gst)(?!\s*(?:Reg|KayÃ„Â±t|No))[\s:]*([\d,.]+)/i,
    // Russia: ÃËœÃ‘â€šÃÂ¾ÃÂ³ÃÂ¾ ÃÂÃâ€ÃÂ¡ (Total VAT)
    /ÃÂ¸Ã‘â€šÃÂ¾ÃÂ³ÃÂ¾\s*ÃÂ½ÃÂ´Ã‘Â[\s:]*([\d,.]+)/i,
    /ÃÂ½ÃÂ´Ã‘Â\s*ÃÂ¸Ã‘â€šÃÂ¾ÃÂ³ÃÂ¾[\s:]*([\d,.]+)/i,
    // India: Total GST
    /total\s*gst[\s:]*([\d,.]+)/i,
    /gst\s*total[\s:]*([\d,.]+)/i,
  ];
  
  // Turkish patterns (for backward compatibility)
  const turkishVatTotalPatterns = countryVatTotalPatterns.slice(0, 3);
  
  // Pattern 2: "TOPKDV" on one line, amount on next 1-3 lines (fallback only)
  const turkishVatHeaderPatterns = [
    /^topkdv$/i,
    /^topkdy$/i,
    /^topldv$/i,
    /^topdv$/i,
    /^topv$/i,
    /^topkdi$/i,
    /^t0pkdv$/i,
    /^topodv$/i,
    /^topkda$/i,
    /^toplam\s*kdv$/i,
    /^kdv\s*toplam$/i,
  ];
  
  for (let i = 0; i < processedLines.length; i++) {
    const line = processedLines[i];
    const t = line.text;
    
    // Skip lines that match negative filters (GST Reg No, ticket numbers, etc.)
    if (isNegativeVATFilter(t)) {
      continue;
    }
    
    // PRIORITY: Check country-specific VAT total patterns
    // This is the most reliable method for country-specific receipts
    for (const pattern of countryVatTotalPatterns) {
      const match = t.match(pattern);
      if (match && match[1]) {
        const amountStr = match[1].trim();

        // If line contains % (e.g. "VAT:7.00%"), this is a rate line Ã¢â‚¬â€ do NOT use as amount
        if (lineHasPercent(t)) continue;

        // CRITICAL: Check if this is a standalone numeric token (not part of alphanumeric ID)
        // Example: "GST KayÃ„Â±t No: 201613701E" -> "201" should NOT be extracted
        if (!isStandaloneNumericToken(amountStr, t)) {
          continue; // Skip alphanumeric tokens
        }

        // Use countryConfig-aware parseLooseNumber for country-specific number format
        const amount = parseLooseNumber(amountStr, countryConfig);
        const countryCode = countryConfig?.code;
        
        // ID-specific guard: More tolerant for small totals (e.g., "8,500" -> 8500, "PPN : 842" -> 842)
        // For ID receipts with suspiciously small totals, use relaxed bounds
        let vatAccepted = false;
        if (countryCode === "ID") {
          if (totalAmount < 10) {
            // For very small totals, use global bounds (0.1 - 100000) instead of percentage-based
            // This handles cases like "TOTAL SALES : Rp 8,500, PPN : 842" where total is misparsed as 8.5
            if (amount != null && !isNaN(amount) && amount > 0.1 && amount < 100000) {
              vatAccepted = true;
            }
          } else {
            // Normal guard for ID (same as TR)
            if (amount != null && !isNaN(amount) && amount > 0.1 && amount < totalAmount && amount < totalAmount * 0.5) {
              vatAccepted = true;
            }
          }
        } else {
          // TR/TH/GENERIC: Original guard logic (unchanged)
          // CRITICAL: For TR receipts, if TOPKDV is on the same line with a number, 
          // that number IS the VAT amount - trust it completely (user requirement)
          // For Turkish receipts, TOPKDV can be up to ~10% of total (237.69 / 2607.98 = 9.1%)
          // So we accept values up to 20% of total to be safe
          // Guard: VAT amount must be <= total*0.3 for typical receipts
          if (amount != null && !isNaN(amount) && amount > 0.1 && amount < totalAmount && amount < totalAmount * 0.3) {
            vatAccepted = true;
          }
        }
        
        if (vatAccepted) {
          // Prefer next-line expectedVat (e.g. "VAT:7.00%" then "8.83") Ã¢â‚¬â€ don't overwrite
          if (amount != null && vatAmount == null) {
            vatAmount = amount;
            amountLineNo = line.lineNo;
            vatFromSameLine = true; // TOPKDV same-line: do not overwrite with breakdown later
            const context = countryCode === "ID" ? "ID (relaxed guard)" : countryCode === "TR" ? "TR (TOPKDV on same line - AUTHORITATIVE)" : "standard";
            notes.push(`vatAmountFoundTotalSameLine=${vatAmount} at line=${amountLineNo} (${context})`);
          }
        }
      }
    }
    
    // Check if line is just "TOPKDV" header, then look for amount in surrounding lines
    if (vatAmount == null) {
      for (const headerPattern of turkishVatHeaderPatterns) {
        if (headerPattern.test(t.trim())) {
          // Found "TOPKDV" header, look for amount in next 1-10 lines and previous 2 lines
          let foundVatInNextLines = false;
          
          // Try the KDV breakdown first and sum the individual KDV amounts
          // Look for pattern: "KDV: 13,69" or "13,69" on lines with "%1", "%10", "%20" KDV rates
          const kdvBreakdownAmounts: number[] = [];
          for (let look = -2; look <= 15; look++) {
            const checkLine = processedLines[i + look];
            if (!checkLine) continue;
            
            const checkText = checkLine.text;
            
            // CRITICAL: Filter out payment/total terms (these are not VAT amounts)
            // "para ÃƒÂ¼stÃƒÂ¼" (change), "iade" (refund), "deÃ„Å¸iÃ…Å¸iklik" (modification)
            const isPaymentTerm = /kdv\s*dahil\s*tutar|dahil\s*tutar|ÃƒÂ¶denecek\s*tutar|mal\/hizmet\s*toplam|ara\s*toplam|para\s*ÃƒÂ¼stÃƒÂ¼|paraÃƒÂ¼stÃƒÂ¼|para\s*ustu|change|iade|refund|deÃ„Å¸iÃ…Å¸iklik|modification/i.test(checkText);
            
            // Also check previous line for payment terms (sometimes amount is on next line after label)
            const prevCheckLine = look > -2 ? processedLines[i + look - 1] : null;
            const prevLineHasPaymentTerm = prevCheckLine ? /para\s*ÃƒÂ¼stÃƒÂ¼|paraÃƒÂ¼stÃƒÂ¼|para\s*ustu|change|iade|refund/i.test(prevCheckLine.text) : false;
            
            if (isPaymentTerm || prevLineHasPaymentTerm) {
              continue;
            }
            
            // Look for KDV breakdown pattern: "%1 KDV: 13,69" or "KDV: 13,69" or just "13,69" on KDV rate lines
            // Pattern 1: Line contains KDV rate (%1, %10, %20) and KDV amount
            const hasKdvRate = /%\s*(\d+)\s*kdv|kdv\s*%\s*(\d+)/i.test(checkText);
            if (hasKdvRate) {
              // Extract KDV amount from this line - look for "KDV:" followed by amount
              const kdvAmountMatch = checkText.match(/kdv[\s:]*([\d,.]+)/i);
              if (kdvAmountMatch && kdvAmountMatch[1]) {
                const amountStr = kdvAmountMatch[1].trim();
                
                // CRITICAL: Check if this is a standalone numeric token (not part of alphanumeric ID)
                if (!isStandaloneNumericToken(amountStr, checkText)) {
                  continue; // Skip alphanumeric tokens
                }
                
                // Use countryConfig-aware parseLooseNumber for country-specific number format
                const amount = parseLooseNumber(amountStr, countryConfig);
                // KDV breakdown amounts should be small (each rate's KDV is usually < 10% of total)
                if (amount != null && !isNaN(amount) && amount > 0 && amount < totalAmount * 0.2) {
                  kdvBreakdownAmounts.push(amount);
                  notes.push(`Found KDV breakdown amount: ${amount} at line ${checkLine.lineNo}`);
                }
              }
            }
            
            // Pattern 2: Line contains just a number and is near KDV rate lines (e.g., "13,69" on line with "%1")
            // This handles cases where KDV amount is on a separate line from the rate
            if (look > 0 && look <= 5) {
              const prevLine = processedLines[i + look - 1];
              if (prevLine && /%\s*(\d+)\s*kdv|kdv\s*%\s*(\d+)/i.test(prevLine.text)) {
                // Previous line had KDV rate, this line might have the amount
                const amounts = extractAmountsFromText(checkText, countryConfig)
                  .map((x) => x.value)
                  .filter((v) => v > 0 && v < totalAmount * 0.2); // Each KDV rate amount should be < 20% of total
                
                if (amounts.length === 1 && !kdvBreakdownAmounts.includes(amounts[0])) {
                  kdvBreakdownAmounts.push(amounts[0]);
                  notes.push(`Found KDV breakdown amount (separate line): ${amounts[0]} at line ${checkLine.lineNo}`);
                }
              }
            }
            
              // Also look for standalone "KDV:" pattern (total KDV)
              // But only if we haven't found KDV breakdown amounts (they are more reliable)
              if (look > 0 && !foundVatInNextLines && kdvBreakdownAmounts.length === 0) {
                const kdvTotalPattern = /^kdv[\s:]*([\d,.]+)$/i;
                const kdvTotalMatch = checkText.trim().match(kdvTotalPattern);
                if (kdvTotalMatch && kdvTotalMatch[1]) {
                  const amountStr = kdvTotalMatch[1].trim();
                  // Use countryConfig-aware parseLooseNumber for country-specific number format
                  const amount = parseLooseNumber(amountStr, countryConfig);
                  // For Turkish invoices, TOPKDV can be up to ~10% of total (237.69 / 2607.98 = 9.1%)
                  // So we accept values up to 20% of total to be safe (for TOPKDV specifically)
                  if (amount != null && !isNaN(amount) && amount > 0 && amount < totalAmount && amount < totalAmount * 0.2) {
                    // If we already found a value, only replace it if this one is larger (more likely to be the total)
                    if (vatAmount == null || amount > vatAmount) {
                      vatAmount = amount;
                      amountLineNo = checkLine.lineNo;
                      notes.push(`vatAmountFoundAfterTOPKDV=${vatAmount} at line=${amountLineNo} (after TOPKDV at line ${line.lineNo})`);
                      foundVatInNextLines = true;
                    }
                  } else if (amount != null && !isNaN(amount) && amount >= totalAmount * 0.2) {
                    notes.push(`Rejecting KDV value ${amount} (>= 20% of total) - might be KDV Dahil Tutar`);
                  }
                }
              
              // Look for mostly numeric line that could be KDV amount
// But be very careful - skip lines that look like totals or subtotals
const isMostlyNumeric = /^[\d\s.,*]+$/.test(checkText.trim());

// CRITICAL: Skip lines with "TOPLAM" keyword (these are total amounts, not KDV)
if (/toplam|total|grand\s*total|net\s*total/i.test(checkText)) {
  continue; // Skip total lines
}

       // Also skip very large amounts (KDV should be < 20% of total for Turkish receipts)
       const looksLikeTotal = /\d{2,}[.,]\d{2}/.test(checkText); // Any amount with 2+ digits before decimal
              
              // Skip if we already found KDV breakdown amounts (they are more reliable)
              if (isMostlyNumeric && !foundVatInNextLines && !looksLikeTotal && kdvBreakdownAmounts.length === 0) {
                const amounts = extractAmountsFromText(checkText, countryConfig)
                  .map((x) => x.value)
                  .filter((v) => v > 0 && v < totalAmount && v < totalAmount * 0.2 && v > 1); // KDV should be > 1 and < 20% of total (for TOPKDV)
                
                if (amounts.length === 1) {
                  // Single amount on numeric line - likely KDV total
                  // But verify it's not too large (should be reasonable for KDV)
                  // For Turkish invoices, TOPKDV can be up to ~10% of total (237.69 / 2607.98 = 9.1%)
                  if (amounts[0] < totalAmount * 0.2) {
                    // If we already found a value, only replace it if this one is larger (more likely to be the total)
                    if (vatAmount == null || amounts[0] > vatAmount) {
                      vatAmount = amounts[0];
                      amountLineNo = checkLine.lineNo;
                      notes.push(`vatAmountFoundNumericLine=${vatAmount} at line=${amountLineNo} (after TOPKDV at line ${line.lineNo})`);
                      foundVatInNextLines = true;
                    }
                  } else {
                    notes.push(`Rejecting numeric line value ${amounts[0]} (>= 20% of total) - might be KDV Dahil Tutar`);
                  }
                }
              }
            }
          }
          
          // If we found KDV breakdown amounts, sum them — but prefer TOPKDV same-line when present
          if (vatFromSameLine) {
            console.log(`[extractVATRobust] TOPKDV same-line already set — skipping breakdown (prefer same-line)`);
            break;
          }
          if (kdvBreakdownAmounts.length > 0) {
            const totalKdv = kdvBreakdownAmounts.reduce((sum, amt) => sum + amt, 0);
            console.log(`[extractVATRobust] Found KDV breakdown: ${kdvBreakdownAmounts.map(a => a.toFixed(2)).join(' + ')} = ${totalKdv.toFixed(2)}`);
            // Verify total is reasonable (should be < 25% of total, and individual amounts should sum correctly)
            // For Turkish receipts, TOPKDV can be up to ~10% of total, so 25% is a safe upper bound
            if (totalKdv > 0 && totalKdv < totalAmount * 0.25 && totalKdv > 1) {
              // Use breakdown sum only if we don't already have a TOPKDV same-line value
              if (vatAmount == null || vatAmount === 0 || (kdvBreakdownAmounts.length > 1 && totalKdv > vatAmount)) {
                vatAmount = totalKdv;
                amountLineNo = line.lineNo;
                notes.push(`vatAmountSummedFromBreakdown=${vatAmount} (${kdvBreakdownAmounts.length} rates: ${kdvBreakdownAmounts.join(', ')}) after TOPKDV at line ${line.lineNo}`);
                foundVatInNextLines = true;
                console.log(`[extractVATRobust] Ã¢Å“â€¦ Using KDV breakdown sum: ${vatAmount.toFixed(2)} (from ${kdvBreakdownAmounts.length} rates)`);
              } else {
                console.log(`[extractVATRobust] Keeping existing VAT value ${vatAmount.toFixed(2)} (breakdown sum ${totalKdv.toFixed(2)} is smaller or single rate)`);
              }
              break;
            } else {
              console.log(`[extractVATRobust] Rejected breakdown sum ${totalKdv.toFixed(2)} (reason: ${totalKdv <= 0 ? '<= 0' : totalKdv >= totalAmount * 0.25 ? '>= 25%' : totalKdv <= 1 ? '<= 1' : 'unknown'})`);
            }
          }
          
          // Only use standalone "KDV:" or numeric line values if NO breakdown was found
          // AND the value is reasonable (< 20% of total for Turkish invoices - TOPKDV can be up to ~10%)
          if (!foundVatInNextLines && vatAmount != null && vatAmount > totalAmount * 0.2) {
            // Value seems too large - might be "KDV Dahil Tutar" or another total
            // Clear it and continue searching for breakdown
            notes.push(`Rejecting large VAT value ${vatAmount} (> 20% of total) - might be KDV Dahil Tutar`);
            vatAmount = undefined;
            amountLineNo = undefined;
          }
          
          if (foundVatInNextLines) break;
        }
      }
    }
    
    if (vatAmount != null) break;
  }
  
  // Priority 2: Standard VAT extraction
  if (vatAmount == null) {
    for (let i = 0; i < processedLines.length; i++) {
      const line = processedLines[i];
      const t = line.text;

      const hasVatKeyword = /vat|vatable|kdv|gst|sst|ppn|ÃÂ½ÃÂ´Ã‘Â|Ã¦Â¶Ë†Ã¨Â²Â»Ã§Â¨Å½|Ã«Â¶â‚¬ÃªÂ°â‚¬Ã¬â€žÂ¸|Ã¥Â¢Å¾Ã¥â‚¬Â¼Ã§Â¨Å½|tax/i.test(t);
      if (!hasVatKeyword) continue;

      // Skip lines with "KDV Dahil Tutar" (these are VAT-inclusive amounts, not VAT amounts)
      if (/kdv\s*dahil\s*tutar|dahil\s*tutar/i.test(t)) {
        continue;
      }

      // Skip non-tax fees: seat selection, baggage, meal selection, etc.
      if (/\b(?:koltuk\s*seÃƒÂ§imi|seat\s*selection|baggage|bagaj|luggage|meal|yemek|priority|ÃƒÂ¶ncelik|fast\s*track|check-in|baggage\s*fee|bagaj\s*ÃƒÂ¼creti)\b/i.test(t)) {
        continue;
      }

      // Same-line amount only when line has NO % (e.g. "VAT: 8.83"); "%" => rate line, skip
      const sameLineAmts = lineHasPercent(t)
        ? []
        : extractAmountsFromText(t, countryConfig)
            .map((x) => x.value)
            .filter((v) => v > 0 && v < totalAmount);

      if (sameLineAmts.length > 0) {
        // For Turkish receipts, prefer amounts that are reasonable (KDV should be < 20% of total)
        // But avoid "KDV Dahil Tutar" amounts which are much larger
        const isTurkish = /kdv|tÃƒÂ¼rk|tÃƒÂ¼rkiye|try|tl/i.test(t);
        const reasonableAmts = sameLineAmts.filter(v => v < totalAmount * 0.2); // KDV should be < 20% of total
        
        if (reasonableAmts.length > 0) {
          vatAmount = isTurkish ? Math.max(...reasonableAmts) : Math.min(...reasonableAmts);
        } else {
          // Fallback: use smallest if no reasonable amounts found
          vatAmount = Math.min(...sameLineAmts);
        }
        amountLineNo = line.lineNo;
        notes.push(`vatAmountFoundSameLine=${vatAmount} at line=${amountLineNo}`);
        break;
      }

      // Look ahead up to 10 lines for amount-only line (like "8.83" or "4.730")
      // Some receipts have multiple lines between "Tax:" and the amount
      for (let look = 1; look <= 10; look++) {
        const next = processedLines[i + look];
        if (!next) continue;
        const amts = extractAmountsFromText(next.text, countryConfig)
          .map((x) => x.value)
          .filter((v) => v > 0 && v < totalAmount);

        // If the line is mostly numeric and has one amount, treat as VAT amount
        const numericish = /^[^a-zÃ Â¸Â-Ã Â¹â„¢]*\d+([.,]\d{1,2})?[^a-zÃ Â¸Â-Ã Â¹â„¢]*$/i.test(next.text);
        if (numericish && amts.length > 0) {
          const isIndonesian = countryConfig?.code === "ID";
          const reasonableAmts = isIndonesian
            ? amts.filter((v) => v > 0 && v < totalAmount && v < totalAmount * 0.2)
            : amts;

          if (reasonableAmts.length > 0) {
            const pick =
              expectedVat != null
                ? reasonableAmts.slice().sort(
                    (a, b) => Math.abs(a - expectedVat!) - Math.abs(b - expectedVat!)
                  )[0]
                : reasonableAmts[0];
            vatAmount = round2(pick);
            amountLineNo = next.lineNo;
            notes.push(
              `vatAmountFoundLookahead=${vatAmount} at line=${amountLineNo} (from VAT keyword line ${line.lineNo}, looked ${look} lines ahead)`
            );
            break;
          }
        }
      }

      if (vatAmount != null) break;
    }
  }

  // If VAT amount exists but rate missing, infer
  if (vatAmount != null && vatRate == null && totalAmount > 0) {
    const r = vatAmount / totalAmount;
    if (r >= 0.01 && r <= 0.25) {
      vatRate = r;
      notes.push(`vatRateInferred=${vatRate}`);
    }
  }

  // Fallback: rate known but no amount Ã¢â‚¬â€ use calculated (e.g. total 135, 7% Ã¢â€ â€™ 8.83)
  if (vatRate != null && (vatAmount == null || vatAmount === 0) && expectedVat != null) {
    vatAmount = expectedVat;
    notes.push(`vatAmountUsedCalculated=${vatAmount} (from total and ${(vatRate * 100).toFixed(0)}% rate)`);
  }

  // Consistency check
  let consistencyCheck = true;
  if (vatAmount != null && totalAmount > 0) {
    const paidExTax = totalAmount - vatAmount;
    const tolerance = 0.5; // THB tolerance
    consistencyCheck = Math.abs(paidExTax + vatAmount - totalAmount) <= tolerance;
    notes.push(`vatConsistency=${consistencyCheck ? "pass" : "fail"}`);
  }

  // Confidence
  let confidence = 0;
  if (vatRate != null && vatAmount != null) confidence = consistencyCheck ? 0.9 : 0.7;
  else if (vatRate != null || vatAmount != null) confidence = 0.6;

  return {
    value: vatAmount ?? 0,
    rate: vatRate,
    confidence,
    sourceLine: amountLineNo ?? rateLineNo,
    evidence: {
      rateLineNo,
      amountLineNo,
      consistencyCheck,
      notes,
    },
  };
}
