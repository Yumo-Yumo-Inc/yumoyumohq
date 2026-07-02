/**
 * Philippines (PH) country configuration
 * Contains all Philippines-specific patterns and settings for receipt parsing
 * Notes: VAT applies (12%), TIN (Taxpayer Identification Number) common
 */

import type { CountryConfig } from "./base";

export const PH_CONFIG: CountryConfig = {
  code: "PH",
  detection: {
    countryIndicators: [
      /\bPhilippines\b/i,
      /\bPH\b/
    ],
    currencyIndicators: [
      /₱\s?\d+/,
      /\bPHP\b/i
    ],
    taxIdIndicators: [
      /\bTIN\b/i
    ]
  },
  currency: {
    code: "PHP",
    symbol: "₱",
    keywords: ["₱", "PHP"]
  },
  dateTime: {
    datePatterns: [
      /\b(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})\b/,
      /\b(\d{4})-(\d{1,2})-(\d{1,2})\b/
    ],
    timePatterns: [
      /\b(\d{1,2})[:.](\d{2})(?:[:.](\d{2}))?\s?(AM|PM|am|pm)?\b/
    ]
  },
  numberFormat: {
    decimalSeparators: ["."],
    thousandSeparators: [","]
  },
  labels: {
    total: ["TOTAL", "AMOUNT DUE", "AMOUNT DUE:", "TOTAL AMOUNT"],
    vat: ["VAT", "12% VAT", "TAX"],
    subtotal: ["SUBTOTAL", "NET SALES"],
    service: ["SERVICE CHARGE", "SERVICE FEE"],
    discount: ["DISCOUNT", "SC DISCOUNT"],
    tenderCash: ["CASH"],
    tenderCard: ["CARD", "CREDIT", "DEBIT", "VISA", "MASTERCARD"],
    change: ["CHANGE"],
    merchantId: ["TIN"],
    branchId: ["BRANCH", "LOCATION", "STORE"]
  },
  vatKeywords: ["VAT", "12% VAT", "TAX"],
  tax: {
    model: "vat",
    defaultRate: 0.12,
    separateLine: true
  },
  layoutHints: {
    rightAlignedTotals: true,
    allowQrCodes: false
  },
  screenshotIndicators: [
    "GCash",
    "Maya",
    "PayMaya",
    "GrabPay"
  ]
};

export default PH_CONFIG;
