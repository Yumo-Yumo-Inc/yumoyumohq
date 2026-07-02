/**
 * Singapore (SG) country configuration
 * Contains all Singapore-specific patterns and settings for receipt parsing
 * Notes: No VAT; instead GST (8%), Common Service Charge (10%) + GST (8%) pattern in restaurants
 */

import type { CountryConfig } from "./base";

export const SG_CONFIG: CountryConfig = {
  code: "SG",
  detection: {
    countryIndicators: [
      /\bSingapore\b/i,
      /\bSG\b/
    ],
    currencyIndicators: [
      /\$\s?\d+/,
      /\bSGD\b/i
    ],
    taxIdIndicators: [
      /\bGST Reg\b/i,
      /\bGST Registration\b/i,
      /\bGST Reg No\b/i,
      /\bUEN\b/i
    ]
  },
  currency: {
    code: "SGD",
    symbol: "$",
    keywords: ["$", "SGD"]
  },
  dateTime: {
    datePatterns: [
      // DD/MM/YYYY || YYYY-MM-DD
      /\b(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})\b/,
      /\b(\d{4})-(\d{1,2})-(\d{1,2})\b/
    ],
    timePatterns: [
      // 12h + 24h
      /\b(\d{1,2})[:.](\d{2})(?::(\d{2}))?\s?(AM|PM|am|pm)?\b/
    ]
  },
  numberFormat: {
    decimalSeparators: ["."],
    thousandSeparators: [","]
  },
  labels: {
    total: ["TOTAL", "AMOUNT DUE", "AMOUNT PAYABLE", "GRAND TOTAL"],
    vat: ["GST", "GST 8%", "TAX"],
    subtotal: ["SUBTOTAL", "NET AMOUNT"],
    service: ["SERVICE CHARGE", "SERVICE FEE"],
    discount: ["DISCOUNT", "PROMO"],
    tenderCash: ["CASH"],
    tenderCard: ["CARD", "CREDIT", "DEBIT", "NETS", "VISA", "MASTERCARD"],
    change: ["CHANGE"],
    merchantId: ["GST REG NO", "UEN"],
    branchId: ["BRANCH", "LOCATION", "STORE"]
  },
  vatKeywords: ["GST", "GST 8%", "TAX"],
  tax: {
    model: "gst",
    defaultRate: 0.08,
    separateLine: true
  },
  layoutHints: {
    rightAlignedTotals: true,
    allowQrCodes: true
  },
  screenshotIndicators: [
    "PayNow",
    "GrabPay",
    "DBS PayLah",
    "OCBC PayAnyone"
  ]
};

export default SG_CONFIG;
