/**
 * Russia (RU) country configuration
 * Contains all Russia-specific patterns and settings for receipt parsing
 * Notes: Cyrillic + English mix, Tax = НДС (VAT) but not always present, Fiscal receipt codes
 */

import type { CountryConfig } from "./base";

export const RU_CONFIG: CountryConfig = {
  code: "RU",
  detection: {
    countryIndicators: [
      /\bРоссия\b/i,
      /\bRussia\b/i,
      /\bRU\b/
    ],
    currencyIndicators: [
      /₽\s?\d+/,
      /\bRUB\b/i
    ],
    taxIdIndicators: [
      /\bИНН\b/i,
      /\bОГРН\b/i // Business registration
    ]
  },
  currency: {
    code: "RUB",
    symbol: "₽",
    keywords: ["₽", "RUB"]
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
    total: ["ИТОГО", "ИТОГО К ОПЛАТЕ", "TOTAL", "AMOUNT DUE"],
    vat: ["НДС", "VAT", "TAX"],
    subtotal: ["СУММА", "SUBTOTAL"],
    service: ["СЕРВИС", "SERVICE CHARGE"],
    discount: ["СКИДКА", "DISCOUNT"],
    tenderCash: ["НАЛИЧНЫМИ", "CASH"],
    tenderCard: ["КАРТОЙ", "CARD", "VISA", "MASTERCARD"],
    change: ["СДАЧА", "CHANGE"],
    merchantId: ["ИНН", "ОГРН"],
    branchId: ["ФИЛИАЛ", "BRANCH", "STORE"]
  },
  vatKeywords: ["НДС", "VAT", "TAX"],
  tax: {
    model: "vat_optional",
    separateLine: true,
    allowNoVat: true
  },
  layoutHints: {
    rightAlignedTotals: true,
    allowQrCodes: true // fiscal receipts include QR
  },
  screenshotIndicators: [
    "ЮMoney",
    "SberPay",
    "Tinkoff Pay"
  ]
};

export default RU_CONFIG;
