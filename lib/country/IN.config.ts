/**
 * India (IN) country configuration
 * Contains all India-specific patterns and settings for receipt parsing
 * Includes: Dual GST system (CGST/SGST/IGST), Indian numbering formatter (Lakhs, Crores), PAN/GSTIN formats
 */

import type { CountryConfig } from "./base";

export const IN_CONFIG: CountryConfig = {
  code: "IN",
  detection: {
    countryIndicators: [
      /\bindia\b/i,
      /\bdelhi\b/i,
      /\bmumbai\b/i,
      /\bbengaluru\b/i,
      /\bchennai\b/i,
      /\bhyderabad\b/i
    ],
    currencyIndicators: [
      /₹/,
      /\binr\b/i,
      /\brs\.?\s*\d/i,
      /\d\s*rs\.?\b/i,
      /\b₹\s?\d+/ // numeric prefix
    ],
    taxIdIndicators: [
      /\bGSTIN\b/i,
      /\bPAN\b/i
    ]
  },
  currency: {
    code: "INR",
    symbol: "₹",
    keywords: ["₹", "INR", "Rs", "Rs."]
  },
  dateTime: {
    datePatterns: [
      /\b(\d{4})[\/-](\d{1,2})[\/-](\d{1,2})\b/,
      /\b(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})\b/
    ],
    isoPatterns: [],
    shortPatterns: [],
    timePatterns: [
      /\b(\d{1,2})[:.](\d{2})(?:[:.](\d{2}))?\s?(AM|PM|am|pm)?\b/
    ]
  },
  numberFormat: {
    decimalSeparators: ["."],
    thousandSeparators: [","],
    compactNumbering: {
      enabled: true,
      patterns: [
        /\b(\d+(?:\.\d+)?)\s?Lakh\b/i,
        /\b(\d+(?:\.\d+)?)\s?Cr\b/i
      ],
      convert: (value: number, unit: string) => {
        if (unit.toLowerCase() === "lakh") return value * 100000;
        if (unit.toLowerCase() === "cr") return value * 10000000;
        return value;
      }
    }
  },
  labels: {
    total: ["TOTAL", "TOTAL AMOUNT", "INVOICE TOTAL", "TOTAL VALUE"],
    vat: ["GST", "CGST", "SGST", "IGST"],
    subtotal: ["SUBTOTAL", "NET VALUE", "TAXABLE VALUE"],
    service: ["SERVICE CHARGE", "SERVICE FEE"],
    discount: ["DISCOUNT", "PROMO", "OFFER"],
    tenderCash: ["CASH"],
    tenderCard: ["CARD", "VISA", "MASTERCARD", "DEBIT", "UPI"],
    change: ["CHANGE", "BALANCE"],
    merchantId: ["GSTIN", "PAN"],
    branchId: ["BRANCH"],
    upi: ["UPI ID", "QR UPI"]
  },
  vatKeywords: ["GST", "CGST", "SGST", "IGST"],
  gst: {
    model: "dual",
    components: ["CGST", "SGST", "IGST"],
    extractComponents: true
  },
  layoutHints: {
    rightAlignedTotals: true,
    maxBottomLines: 14,
    allowQrCodes: true
  }
};

export default IN_CONFIG;
