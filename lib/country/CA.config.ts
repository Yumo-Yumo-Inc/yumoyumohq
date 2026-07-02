/**
 * Canada (CA) country configuration
 * Contains all Canada-specific patterns and settings for receipt parsing
 * Notes: Multiple tax models: GST / PST / HST
 */

import type { CountryConfig } from "./base";

export const CA_CONFIG: CountryConfig = {
  code: "CA",
  detection: {
    countryIndicators: [
      /\bCanada\b/i,
      // Do not use /\bCA\b/ — matches OCR fragments and non-Canadian receipts (e.g. Turkish POS lines).
    ],
    currencyIndicators: [
      /\$\s?\d/,
      /\bCAD\b/i
    ],
    taxIdIndicators: [
      /\bGST\b/i,
      /\bPST\b/i,
      /\bHST\b/i
    ]
  },
  currency: {
    code: "CAD",
    symbol: "$",
    keywords: ["$", "CAD"]
  },
  dateTime: {
    datePatterns: [
      /\b(\d{4})-(\d{1,2})-(\d{1,2})\b/,
      /\b(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})\b/
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
    total: ["TOTAL", "AMOUNT DUE", "GRAND TOTAL"],
    vat: ["GST", "PST", "HST", "TAX"],
    subtotal: ["SUBTOTAL", "NET"],
    service: ["SERVICE CHARGE", "SERVICE FEE", "GRATUITY"],
    discount: ["DISCOUNT", "COUPON", "PROMO"],
    tenderCash: ["CASH"],
    tenderCard: ["CARD", "CREDIT", "DEBIT", "VISA", "MASTERCARD", "AMEX"],
    change: ["CHANGE"],
    merchantId: ["GST REG", "HST REG"],
    branchId: ["STORE", "LOCATION"]
  },
  vatKeywords: ["GST", "PST", "HST", "TAX"],
  tax: {
    model: "multi_component",
    components: ["GST", "PST", "HST"],
    extractComponents: true
  },
  layoutHints: {
    rightAlignedTotals: true,
    allowQrCodes: false
  },
  screenshotIndicators: [
    "Apple Pay",
    "Google Wallet",
    "Square Receipt"
  ]
};

export default CA_CONFIG;
