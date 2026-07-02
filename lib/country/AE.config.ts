/**
 * United Arab Emirates (AE) country configuration
 * Contains all UAE-specific patterns and settings for receipt parsing
 * Includes: VAT 5%, TRN detection, Optional Hijri date parsing, Service Fee behaviors
 */

import type { CountryConfig } from "./base";

export const AE_CONFIG: CountryConfig = {
  code: "AE",
  detection: {
    countryIndicators: [
      /\buae\b/i,
      /\bdubai\b/i,
      /\babu dhabi\b/i,
      /\bsharjah\b/i,
      /\bajman\b/i
    ],
    currencyIndicators: [
      /\baed\b/i,
      /د\.إ/
    ],
    taxIdIndicators: [
      /\bTRN\b/i, // Tax Registration Number (VAT)
      /\btax registration number\b/i
    ]
  },
  currency: {
    code: "AED",
    symbol: "AED",
    keywords: ["AED", "د.إ"]
  },
  dateTime: {
    datePatterns: [
      // Gregorian formats
      /\b(\d{4})[\/.-](\d{1,2})[\/.-](\d{1,2})\b/,
      /\b(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{4})\b/
    ],
    hijriPatterns: [
      // Basic Hijri recognition (year AH)
      /\b(\d{1,2})[\/.-](\d{1,2})[\/.-](14\d{2})\b/,
      /\b(14\d{2})[\/.-](\d{1,2})[\/.-](\d{1,2})\b/
    ],
    hijriConversion: {
      enabled: true,
      // placeholder conversion, real mapping handled server-side
      approxConvertToGregorian: (hy: number) => hy + 579
    },
    isoPatterns: [],
    shortPatterns: [],
    timePatterns: [
      /\b(\d{1,2})[:.](\d{2})(?:[:.](\d{2}))?\s?(AM|PM|am|pm)?\b/
    ]
  },
  numberFormat: {
    decimalSeparators: ["."],
    thousandSeparators: [","]
  },
  labels: {
    total: ["TOTAL", "AMOUNT DUE", "AMOUNT PAYABLE"],
    vat: ["VAT", "VAT AMOUNT", "VAT 5%", "TAX"],
    subtotal: ["SUBTOTAL", "NET AMOUNT"],
    service: ["SERVICE CHARGE", "SERVICE FEE"],
    discount: ["DISCOUNT", "PROMO"],
    tenderCash: ["CASH"],
    tenderCard: ["CARD", "VISA", "MASTERCARD", "DEBIT"],
    change: ["CHANGE"],
    merchantId: ["TRN"],
    branchId: ["BRANCH", "LOCATION"]
  },
  vatKeywords: ["VAT", "VAT AMOUNT", "VAT 5%", "TAX"],
  vat: {
    defaultRate: 0.05,
    separateLine: true
  },
  layoutHints: {
    rightAlignedTotals: true,
    maxBottomLines: 12,
    allowQrCodes: true
  }
};

export default AE_CONFIG;
