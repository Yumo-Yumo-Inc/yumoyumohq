/**
 * South Africa (ZA) country configuration
 * Contains all South Africa-specific patterns and settings for receipt parsing
 * Notes: VAT = 15%, VAT & Non-VAT scenarios supported
 */

import type { CountryConfig } from "./base";

export const ZA_CONFIG: CountryConfig = {
  code: "ZA",
  detection: {
    countryIndicators: [
      /\bSouth Africa\b/i,
      /\bZA\b/
    ],
    currencyIndicators: [
      /\bR\s?\d+/,
      /\bZAR\b/i
    ],
    taxIdIndicators: [
      /\bVAT No\b/i,
      /\bVAT Registration\b/i,
      /\bReg No\b/i
    ]
  },
  currency: {
    code: "ZAR",
    symbol: "R",
    keywords: ["R", "ZAR"]
  },
  dateTime: {
    datePatterns: [
      // South Africa typically uses DD/MM/YYYY
      /\b(\d{1,2})\/(\d{1,2})\/(\d{4})\b/,
      // Allow ISO
      /\b(\d{4})-(\d{1,2})-(\d{1,2})\b/
    ],
    timePatterns: [
      /\b(\d{1,2})[:.](\d{2})(?::(\d{2}))?\b/
    ]
  },
  numberFormat: {
    decimalSeparators: ["."],
    thousandSeparators: [","]
  },
  labels: {
    total: ["TOTAL", "AMOUNT DUE", "GRAND TOTAL"],
    vat: ["VAT", "VAT 15%", "TAX"],
    subtotal: ["SUBTOTAL", "NET AMOUNT"],
    service: ["SERVICE CHARGE", "SERVICE FEE"],
    discount: ["DISCOUNT", "PROMO"],
    tenderCash: ["CASH"],
    tenderCard: ["CARD", "DEBIT", "CREDIT", "VISA", "MASTERCARD"],
    change: ["CHANGE"],
    merchantId: ["VAT NO", "REG NO"],
    branchId: ["STORE", "BRANCH", "OUTLET"]
  },
  vatKeywords: ["VAT", "VAT 15%", "TAX"],
  tax: {
    model: "vat_optional",
    defaultRate: 0.15,
    separateLine: true,
    allowNoVat: true
  },
  layoutHints: {
    rightAlignedTotals: true,
    allowQrCodes: true
  },
  screenshotIndicators: [
    "SnapScan",
    "Zapper",
    "Masterpass"
  ]
};

export default ZA_CONFIG;
