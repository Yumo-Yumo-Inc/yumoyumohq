/**
 * Nigeria (NG) country configuration
 * Contains all Nigeria-specific patterns and settings for receipt parsing
 * Notes: POS receipts first, Flutterwave/Paystack receipts accepted if real & non-screenshot
 */

import type { CountryConfig } from "./base";

export const NG_CONFIG: CountryConfig = {
  code: "NG",
  detection: {
    countryIndicators: [
      /\bNigeria\b/i,
      /\bNG\b/
    ],
    currencyIndicators: [
      /₦\s?\d+/,
      /\bNGN\b/i
    ],
    taxIdIndicators: [
      /\bTIN\b/i,
      /\bRC NO\b/i,
      /\bCAC NO\b/i
    ]
  },
  currency: {
    code: "NGN",
    symbol: "₦",
    keywords: ["₦", "NGN"]
  },
  dateTime: {
    datePatterns: [
      // DD/MM/YYYY | YYYY-MM-DD
      /\b(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})\b/,
      /\b(\d{4})-(\d{1,2})-(\d{1,2})\b/
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
    total: ["TOTAL", "AMOUNT DUE", "GRAND TOTAL"],
    vat: ["VAT", "TAX", "WITHHOLDING", "WHT"], // NG uses VAT 7.5% + WHT
    subtotal: ["SUBTOTAL", "NET AMOUNT"],
    service: ["SERVICE CHARGE", "SERVICE FEE"],
    discount: ["DISCOUNT", "REBATE"],
    tenderCash: ["CASH"],
    tenderCard: ["CARD", "POS", "DEBIT", "CREDIT"],
    change: ["CHANGE", "BALANCE"],
    merchantId: ["TIN", "RC NO", "CAC NO"],
    branchId: ["BRANCH", "STORE", "LOCATION"]
  },
  vatKeywords: ["VAT", "TAX", "WITHHOLDING", "WHT"],
  tax: {
    model: "vat_optional", // VAT may or may not be present
    defaultRate: 0.075,
    separateLine: true,
    allowNoVat: true
  },
  layoutHints: {
    rightAlignedTotals: true,
    allowQrCodes: false
  },
  digitalReceipts: {
    acceptedVendors: ["Flutterwave", "Paystack"],
    allowNonScreenshotEmail: true,
    requireTransactionId: true
  },
  screenshotIndicators: [
    "Flutterwave",
    "Paystack",
    "Paystack Reference",
    "Transaction Reference",
    "Narration",
    "Settlement"
  ]
};

export default NG_CONFIG;
