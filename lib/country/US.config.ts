/**
 * United States (US) country configuration
 * Contains all US-specific patterns and settings for receipt parsing
 * Notes: No VAT, only Sales Tax. Sales tax varies by state.
 */

import type { CountryConfig } from "./base";

export const US_CONFIG: CountryConfig = {
  code: "US",
  detection: {
    countryIndicators: [
      /\bUSA\b/i,
      /\bUnited States\b/i,
      /\b(?:AL|AK|AZ|AR|CA|CO|CT|DC|DE|FL|GA|HI|IA|ID|IL|IN|KS|KY|LA|MA|MD|ME|MI|MN|MO|MS|MT|NC|ND|NE|NH|NJ|NM|NV|NY|OH|OK|OR|PA|RI|SC|SD|TN|TX|UT|VA|VT|WA|WI|WV|WY)\s+\d{5}(?:-\d{4})?\b/i,
      /\(\d{3}\)\s*\d{3}-\d{4}/,
      /\bSales\s+Tax\b/i,
      /\bCash\s+Tendered\b/i,
      /\bDrive\s*Thru\b/i
    ],
    currencyIndicators: [
      /\$\s?\d/,
      /\bUSD\b/i
    ],
    taxIdIndicators: [
      /\bEIN\b/i
    ]
  },
  currency: {
    code: "USD",
    symbol: "$",
    keywords: ["$", "USD"]
  },
  dateTime: {
    datePatterns: [
      // MM/DD/YYYY or MM-DD-YYYY
      /\b(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})\b/,
      // YYYY-MM-DD
      /\b(\d{4})-(\d{1,2})-(\d{1,2})\b/
    ],
    shortPatterns: [
      /\b(\d{1,2})[\/-](\d{1,2})[\/-](\d{2})\b/
    ],
    textualMonthFirstPatterns: [
      /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\s*(\d{1,2})[,]?\s*(\d{2,4})\b/i
    ],
    numericMonthFirst: true,
    timePatterns: [
      // 12h + 24h
      /\b(\d{1,2})[:.](\d{2})(?:[:.](\d{2}))?\s?(AM|PM|am|pm)?\b/
    ]
  },
  numberFormat: {
    decimalSeparators: ["."],
    thousandSeparators: [","]
  },
  labels: {
    total: ["TOTAL", "AMOUNT DUE", "AMOUNT", "GRAND TOTAL", "BALANCE DUE"],
    vat: ["SALES TAX", "TAX"], // no VAT, just generic
    subtotal: ["SUBTOTAL", "SUB TOTAL", "SUB TOTAL:"],
    service: ["SERVICE CHARGE", "SERVICE FEE", "GRATUITY", "SUGGESTED GRATUITY", "TIP"],
    discount: ["DISCOUNT", "COUPON", "PROMO"],
    tenderCash: ["CASH", "CASH TENDERED"],
    tenderCard: ["CARD", "CREDIT", "DEBIT", "VISA", "MASTERCARD", "AMEX"],
    change: ["CHANGE", "CG"],
    merchantId: ["EIN"],
    branchId: ["STORE", "LOCATION", "ORDER", "CHECK", "TICKET"]
  },
  vatKeywords: ["SALES TAX", "TAX"],
  tax: {
    model: "sales_tax",
    separateLine: true
  },
  layoutHints: {
    rightAlignedTotals: true,
    allowQrCodes: false
  },
  screenshotIndicators: [
    "Apple Pay",
    "Google Wallet",
    "Square Receipt",
    "ToastTab"
  ]
};

export default US_CONFIG;
