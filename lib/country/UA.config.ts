/**
 * Ukraine (UA) country configuration
 * Contains all Ukraine-specific patterns and settings for receipt parsing
 * Notes: Cyrillic-based like RU but has its own patterns, VAT = ПДВ (20% standard)
 */

import type { CountryConfig } from "./base";

export const UA_CONFIG: CountryConfig = {
  code: "UA",
  detection: {
    countryIndicators: [
      /\bУкраїна\b/i,
      /\bUkraine\b/i,
      /\bUA\b/
    ],
    currencyIndicators: [
      /₴\s?\d+/,
      /\bUAH\b/i
    ],
    taxIdIndicators: [
      /\bЄДРПОУ\b/i, // Company registration ID
      /\bІПН\b/i      // Taxpayer ID
    ]
  },
  currency: {
    code: "UAH",
    symbol: "₴",
    keywords: ["₴", "UAH"]
  },
  dateTime: {
    datePatterns: [
      /\b(\d{1,2})\.(\d{1,2})\.(\d{4})\b/,
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
    total: ["РАЗОМ", "ВСЬОГО", "TOTAL", "AMOUNT DUE"],
    vat: ["ПДВ", "VAT", "TAX"],
    subtotal: ["ПРОМІЖНИЙ ПІДСУМОК", "SUBTOTAL"],
    service: ["СЕРВІСНИЙ ЗБІР", "SERVICE CHARGE"],
    discount: ["ЗНИЖКА", "DISCOUNT"],
    tenderCash: ["ГОТІВКОЮ", "CASH"],
    tenderCard: ["КАРТКОЮ", "CARD", "VISA", "MASTERCARD"],
    change: ["РЕШТА", "CHANGE"],
    merchantId: ["ЄДРПОУ", "ІПН"],
    branchId: ["ФІЛІЯ", "BRANCH", "STORE"]
  },
  vatKeywords: ["ПДВ", "VAT", "TAX"],
  tax: {
    model: "vat_optional",
    defaultRate: 0.20,
    separateLine: true,
    allowNoVat: true
  },
  layoutHints: {
    rightAlignedTotals: true,
    allowQrCodes: true
  },
  screenshotIndicators: [
    "MonoPay",
    "Privat24"
  ]
};

export default UA_CONFIG;
