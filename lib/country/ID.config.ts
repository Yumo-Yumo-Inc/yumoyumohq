/**
 * Indonesia (ID) country configuration
 * Contains all Indonesia-specific patterns and settings for receipt parsing
 */

import type { CountryConfig } from "./base";

export const ID_CONFIG: CountryConfig = {
  code: "ID",

  detection: {
    countryIndicators: [
      /\bindonesia\b/i,
      /\bbali\b/i,
      /\bubud\b/i,
      /\bnpwp\b/i,               // Indonesian tax ID
      /\bstruk\b/i,              // "struk" = receipt
      /\bkembali(an)?\b/i,       // "kembali" / "kembalian" = change
      /\bjakarta\b/i,
      /\bgianyar\b/i,
      /\bpt\.\s*[a-z]+\s+indonesia/i,  // "PT. CIRCLEKA INDONESIA UTAMA"
      /\blotte\b/i,              // Lotte is major Indonesian retailer/mall chain
      /\bppn\b/i,                // PPN = Indonesian VAT (11%)
    ],
    currencyIndicators: [
      /\brp\b/i,
      /\bidr\b/i,
    ],
  },

  currency: {
    code: "IDR",
    symbol: "Rp",
    keywords: ["Rp", "IDR"],
  },

  dateTime: {
    // Indonesian date patterns: DD/MM/YYYY, DD-MM-YYYY
    datePatterns: [
      /\b(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})\b/,
    ],
    // International date patterns: YYYY-MM-DD, YYYY/MM/DD
    isoPatterns: [
      /\b(\d{4})[./-](\d{1,2})[./-](\d{1,2})\b/,
    ],
    // Short date patterns: DD/MM/YY, DD-MM-YY
    shortPatterns: [
      /\b(\d{1,2})[\/-](\d{1,2})[\/-](\d{2})\b/,
    ],
    // Time patterns: HH:MM, HH:MM:SS
    timePatterns: [
      /\b([01]?\d|2[0-3])[:.](\d{2})(?:[:.](\d{2}))?\b/,
    ],
  },

  numberFormat: {
    // Indonesian format: dot is ALWAYS thousand separator, comma is decimal (rarely used)
    // Examples: "144.375" = 144375, "8.500" = 8500, "13.125" = 13125
    // ID receipts NEVER have amounts < 1000, so dot is always thousands
    decimalSeparators: [","],
    thousandSeparators: [",", "."],
    parseFunction: (raw: string): number | null => {
      let s = (raw ?? "").trim().replace(/\s+/g, "");
      if (!s) return null;

      // Special case: comma with 1-2 digits after = decimal (rare in ID, but possible)
      // "12,50" -> 12.50 (decimal)
      if (/^\d+,\d{1,2}$/.test(s)) {
        s = s.replace(",", ".");
        const v = parseFloat(s);
        return Number.isFinite(v) ? v : null;
      }

      // For ID receipts: dot is ALWAYS thousand separator (never decimal)
      // Handle cases like "6.25" (OCR might miss trailing 0, should be "6.250" = 6250) or "144.375" = 144375
      // Also handle "52.030" = 52030 (Indonesian format: dot = thousand separator)
      // Strategy: If dot exists, split and combine parts (treating dot as thousand separator)
      if (s.includes(".")) {
        const parts = s.split(".");
        if (parts.length === 2) {
          const left = parts[0];
          const right = parts[1];
          
          // ID format: "6.250" = 6250 (6 thousand 250)
          // Special case: trailing zeros like "85.00" = 8500 (not 85000!)
          // Also: "41.000" = 41000, "52.030" = 52030
          // If right part is all zeros, don't pad
          if (/^0+$/.test(right)) {
            // "85.00" -> "85" + "00" = "8500" (trailing zeros, no padding)
            // "41.000" -> "41" + "000" = "41000" (Indonesian format)
            s = left + right;
          } else if (right.length === 2) {
            // Check if it's likely a 2-digit thousand part (like "25" in "6.25" = 6250)
            // vs a partial 3-digit part (like "37" in "144.37" = 144375, not 144370!)
            // Rule: If left part ends with a digit and right is 2 digits, pad only if right < 100
            // "6.25" -> "6" + "250" = "6250" (pad because "25" < 100, likely "250")
            // "144.37" -> "144" + "37" = "14437" (don't pad, "37" is likely part of "375")
            // Actually, we can't know for sure. Let's be conservative: only pad if right < 50
            // (most thousand parts in ID are >= 50, like 250, 375, 500, etc.)
            if (parseInt(right, 10) < 50) {
              // "6.25" -> "6" + "250" = "6250" (likely "250" with trailing 0 missing)
              s = left + right + "0";
            } else {
              // "144.37" -> "144" + "37" = "14437" (likely "375" with trailing 5 missing, but don't pad)
              // Actually, this is ambiguous. Let's not pad for now.
              s = left + right;
            }
          } else if (right.length === 1) {
            // "6.2" -> "6" + "200" = "6200" (OCR missed trailing 00, pad to 3 digits)
            s = left + right + "00";
          } else if (right.length === 3) {
            // "6.250" -> "6" + "250" = "6250" (correct format, no padding needed)
            // "52.030" -> "52" + "030" = "52030" (Indonesian format: dot = thousand separator)
            s = left + right;
          } else if (right.length >= 4) {
            // "52.0300" or longer -> just combine (treat as thousand separator)
            // "41.000" -> "41" + "000" = "41000" (Indonesian format)
            s = left + right;
          } else {
            // Fallback: just combine
            s = left + right;
          }
        } else {
          // Multiple dots: "1.234.567" -> remove all dots
          s = s.replace(/\./g, "");
        }
      }
      
      // Remove commas (they might be thousands or we already handled decimal case above)
      s = s.replace(/,/g, "");

      const v = parseFloat(s);
      return Number.isFinite(v) ? v : null;
    },
  },

  labels: {
    total: [
      "TOTAL",
      "TOTAL SALES",
      "TOTAL BAYAR",
      "TOTAL BELANJA",
      "TOTAL INCL. PPN",
      "TOTAL INCL PPN",
      "TOTAL INCLUDING PPN",
      "GRANDTOTAL",
      "GRAND TOTAL",
    ],
    vat: [
      "PPN",
      "PAJAK",
      "TAX",
      "VAT",
    ],
    subtotal: [
      "SUBTOTAL",
      "SUB TOTAL",
    ],
    service: [
      "SERVICE",
      "SERVICE CHARGE",
      "SERVICE FEE",
    ],
    discount: [
      "DISKON",
      "DISCOUNT",
    ],
    tenderCash: [
      "CASH",
      "TUNAI",
    ],
    tenderCard: [
      "CREDIT CARD",
      "DEBIT CARD",
      "KARTU KREDIT",
      "KARTU DEBIT",
    ],
    change: [
      "CHANGE",
      "KEMBALI",
      "KEMBALIAN",
    ],
    merchantId: [
      "NPWP",
    ],
    branchId: [
      "CABANG",
    ],
  },

  vatKeywords: ["PPN", "PPN TOTAL", "TOTAL PPN"],

  layoutHints: {
    rightAlignedTotals: true,
    maxBottomLines: 12,
  },
};
