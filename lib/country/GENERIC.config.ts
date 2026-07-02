/**
 * Generic country configuration
 * Contains generic patterns for receipts from countries not specifically supported (TR/TH)
 * This serves as a safe fallback for international receipts
 */

import type { CountryConfig } from "./base";

export const GENERIC_CONFIG: CountryConfig = {
  code: "GENERIC",

  detection: {
    countryIndicators: [], // No specific country indicators - this is a fallback
    currencyIndicators: [
      // Generic currency symbols
      /\$\s*\d/,
      /\bUSD\b/i,
      /\bEUR\b/i,
      /\bGBP\b/i,
      /\bJPY\b/i,
      /\bCNY\b/i,
      /\bAUD\b/i,
      /\bCAD\b/i,
      /\bCHF\b/i,
      /\bSGD\b/i,
      /\bHKD\b/i,
      /\bNZD\b/i,
      /\bKRW\b/i,
      /\bINR\b/i,
      /\bBRL\b/i,
      /\bMXN\b/i,
      /\bZAR\b/i,
      /\bRUB\b/i,
      /\bAED\b/i,
      /\bSAR\b/i,
      /\bIDR\b/i,
      /\bPHP\b/i,
      /\bMYR\b/i,
      /\bVND\b/i,
    ],
  },

  currency: {
    code: "USD", // Default fallback currency
    symbol: "$",
    keywords: ["USD", "$", "US Dollar", "Dollar"],
  },

  dateTime: {
    // Generic date patterns: DD/MM/YYYY, DD-MM-YYYY, DD.MM.YYYY, YYYY-MM-DD, etc.
    datePatterns: [
      /\b(\d{1,2})[./-](\d{1,2})[./-](\d{4})\b/, // DD/MM/YYYY, DD-MM-YYYY, DD.MM.YYYY
    ],
    // International date patterns: YYYY-MM-DD, YYYY/MM/DD
    isoPatterns: [
      /\b(\d{4})[./-](\d{1,2})[./-](\d{1,2})\b/, // YYYY-MM-DD, YYYY/MM/DD
    ],
    // Short date patterns: DD/MM/YY, DD-MM-YY
    shortPatterns: [
      /\b(\d{1,2})[./-](\d{1,2})[./-](\d{2})\b/, // DD/MM/YY, DD-MM-YY
    ],
    // Time patterns: HH:MM, HH.MM, HH-MM
    timePatterns: [
      /\b([01]?\d|2[0-3])[:.]([0-5]\d)(?:[:.]([0-5]\d))?\b/, // HH:MM, HH:MM:SS
      /\b(0?\d|1[0-2])[:.]([0-5]\d)\s*(AM|PM|am|pm)\b/i, // 12-hour format
    ],
  },

  numberFormat: {
    // Support both decimal separators (common in international receipts)
    decimalSeparators: [".", ","],
    thousandSeparators: [".", ","],
    parseFunction: (text: string) => {
      // Try to auto-detect format
      // "1,234.56" -> 1234.56 (comma thousands, dot decimal)
      // "1.234,56" -> 1234.56 (dot thousands, comma decimal)
      // "1234.56" -> 1234.56 (dot decimal)
      // "1234,56" -> 1234.56 (comma decimal)
      
      let cleaned = text.replace(/\s+/g, "");
      
      // If both comma and dot exist, decide thousand vs decimal
      const hasComma = cleaned.includes(",");
      const hasDot = cleaned.includes(".");
      
      if (hasComma && hasDot) {
        const lastComma = cleaned.lastIndexOf(",");
        const lastDot = cleaned.lastIndexOf(".");
        if (lastDot > lastComma) {
          // Dot is decimal separator, commas are thousand separators
          cleaned = cleaned.replace(/,/g, "");
        } else {
          // Comma is decimal separator, dots are thousand separators
          cleaned = cleaned.replace(/\./g, "");
          cleaned = cleaned.replace(/,/g, ".");
        }
      } else if (hasComma && !hasDot) {
        // Could be decimal (200,00) or thousands (1,234)
        const parts = cleaned.split(",");
        if (parts.length === 2 && parts[1].length === 2) {
          // Likely decimal separator
          cleaned = cleaned.replace(/,/g, ".");
        } else {
          // Likely thousand separator
          cleaned = cleaned.replace(/,/g, "");
        }
      }
      // If only dot or no separators, keep as-is
      
      return parseFloat(cleaned);
    },
  },

  labels: {
    total: [
      "total",
      "grand total",
      "total amount",
      "amount due",
      "total due",
      "balance due",
      "amount",
      "sum",
      "subtotal",
    ],
    vat: [
      "vat",
      "tax",
      "gst",
      "sales tax",
    ],
    subtotal: [
      "subtotal",
      "sub total",
      "net",
    ],
    service: [
      "service",
      "service charge",
      "service fee",
    ],
    discount: [
      "discount",
      "saved",
      "coupon",
      "promotion",
    ],
    tenderCash: [
      "cash",
    ],
    tenderCard: [
      "card",
      "credit card",
      "debit card",
    ],
    change: [
      "change",
    ],
    merchantId: [
      "merchant id",
      "store id",
      "registration",
    ],
    branchId: [
      "branch",
      "store",
      "location",
    ],
  },

  vatKeywords: ["VAT", "TAX", "GST", "SALES TAX"],

  layoutHints: {
    rightAlignedTotals: true,
    maxBottomLines: 10,
  },
};
