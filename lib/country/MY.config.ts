/**
 * Malaysia (MY) country configuration
 * Contains all Malaysia-specific patterns and settings for receipt parsing
 * Notes: Tax changed over time (GST → SST), Current system: SST (Service Tax & Sales Tax)
 */

import type { CountryConfig } from "./base";

export const MY_CONFIG: CountryConfig = {
  code: "MY",
  detection: {
    countryIndicators: [
      /\bMalaysia\b/i,
      /\bMY\b/,
      /\bMYR\b/i,
      /\bSELANGOR\b/i,
      /\bKuala\s+Lumpur\b/i,
      /\bSST\b/i,
      /\bsst\s*\d/i,      // sst 6%, sst 8% (OCR often "sst6%" where \b fails)
      /\bsst\d/i,         // sst6%, sst8%
      /\bService\s+Tax\b/i,
      /\bService\s+Charge\b/i,
      /\bGrand\s+Total\b/i,
      /\bAmount\s+Due\b/i,
      /\bTerminal\s*ID\b/i,
      /\bReceipt\s*No\b/i,
      /\bSSM\b/i,
      /\bCompany\s+No\b/i,
      /\.my\b/i,          // Website domain .my (e.g. tacobell.com.my)
      /\brm\s*\d/i,       // RM currency with number
    ],
    currencyIndicators: [
      /\bRM\s?\d+/,
      /\bMYR\b/i
    ],
    taxIdIndicators: [
      /\bSST Reg\b/i,
      /\bGST Reg\b/i,
      /\bBusiness Reg\b/i,
      /\bSSM\b/i,
      /\bCompany\s+No\b/i
    ]
  },
  currency: {
    code: "MYR",
    symbol: "RM",
    keywords: ["RM", "MYR"]
  },
  dateTime: {
    datePatterns: [
      // DD/MM/YYYY, YYYY-MM-DD (numeric only; textual formats below)
      /\b(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})\b/,
      /\b(\d{4})-(\d{1,2})-(\d{1,2})\b/,
    ],
    // Feb 1 2026, Feb 1, 2026, 1 Feb 2026 (parsed in ocr-extraction via textualDate / textualMonthFirstPatterns)
    textualMonthFirstPatterns: [
      /\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+(\d{1,2}),?\s+(\d{4})\b/i,
      /\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+(\d{1,2})\s+(\d{4})\b/i,
    ],
    timePatterns: [
      /\b(\d{1,2})[:.](\d{2})(?::(\d{2}))?\s?(AM|PM|am|pm)?\b/
    ]
  },
  numberFormat: {
    decimalSeparators: ["."],
    thousandSeparators: [","]
  },
  labels: {
    total: ["TOTAL", "AMOUNT DUE", "GRAND TOTAL", "PAYMENT", "AMOUNT", "PAID", "TOTAL AMOUNT", "FINAL AMOUNT"],
    vat: ["SST", "SERVICE TAX", "SALES TAX", "GST", "TAX"],
    subtotal: ["SUBTOTAL", "NET AMOUNT"],
    service: ["SERVICE CHARGE", "SERVICE FEE"],
    discount: ["DISCOUNT", "REBATE", "PROMO"],
    tenderCash: ["CASH", "TUNAI"],
    tenderCard: ["CARD", "CREDIT", "DEBIT", "VISA", "MASTERCARD"],
    change: ["CHANGE", "BALANCE"],
    merchantId: ["SST REG", "GST REG", "BRN"],
    branchId: ["BRANCH", "LOCATION", "OUTLET"]
  },
  vatKeywords: ["SST", "SERVICE TAX", "SALES TAX", "GST", "TAX"],
  tax: {
    model: "sst",
    separateLine: true,
    extractComponents: true
  },
  layoutHints: {
    rightAlignedTotals: true,
    allowQrCodes: true
  },
  screenshotIndicators: [
    "Touch 'n Go",
    "Boost",
    "GrabPay",
    "Maybank QR",
    "DuitNow"
  ]
};

export default MY_CONFIG;
