/**
 * Kazakhstan (KZ) country configuration
 * Contains all Kazakhstan-specific patterns and settings for receipt parsing
 * Notes: Cyrillic + Latin, BIN (Business ID Number), Fiscal QR often present
 */

import type { CountryConfig } from "./base";

export const KZ_CONFIG: CountryConfig = {
  code: "KZ",
  detection: {
    countryIndicators: [
      /\bКазахстан\b/i,
      /\bKazakhstan\b/i,
      /\bKZ\b/
    ],
    currencyIndicators: [
      /₸\s?\d+/,
      /\bKZT\b/i
    ],
    taxIdIndicators: [
      /\bБИН\b/i, // Business Identification Number
      /\bBIN\b/i
    ]
  },
  currency: {
    code: "KZT",
    symbol: "₸",
    keywords: ["₸", "KZT"]
  },
  dateTime: {
    datePatterns: [
      // DD.MM.YYYY
      /\b(\d{1,2})\.(\d{1,2})\.(\d{4})\b/,
      // YYYY-MM-DD
      /\b(\d{4})-(\d{1,2})-(\d{1,2})\b/
    ],
    timePatterns: [
      /\b(\d{1,2}):(\d{2})(?::(\d{2}))?\b/
    ]
  },
  numberFormat: {
    decimalSeparators: [",", "."],
    thousandSeparators: [" ", ","]
  },
  labels: {
    total: ["ИТОГО", "TOTAL", "TO PAY", "AMOUNT DUE", "ИТОГО К ОПЛАТЕ"],
    vat: ["НДС", "VAT", "TAX"],
    subtotal: ["СУММА", "SUBTOTAL"],
    service: ["СЕРВИСНЫЙ СБОР", "SERVICE CHARGE"],
    discount: ["СКИДКА", "DISCOUNT"],
    tenderCash: ["НАЛИЧНЫМИ", "CASH"],
    tenderCard: ["КАРТОЙ", "CARD", "VISA", "MASTERCARD"],
    change: ["СДАЧА", "CHANGE"],
    merchantId: ["БИН", "BIN"],
    branchId: ["ФИЛИАЛ", "BRANCH", "STORE"]
  },
  vatKeywords: ["НДС", "VAT", "TAX"],
  tax: {
    model: "vat_optional",
    defaultRate: 0.12,
    separateLine: true,
    allowNoVat: true
  },
  layoutHints: {
    rightAlignedTotals: true,
    allowQrCodes: true
  },
  digitalReceipts: {
    acceptedVendors: ["Kaspi", "Halyk", "Chocofamily"],
    allowNonScreenshotEmail: true,
    requireTransactionId: true
  },
  screenshotIndicators: [
    "Kaspi",
    "Kaspi.kz",
    "Halyk",
    "Chocofood",
    "Chocotravel"
  ]
};

export default KZ_CONFIG;
