/**
 * Mexico (MX) country configuration
 * Contains all Mexico-specific patterns and settings for receipt parsing
 * Notes: VAT: IVA (16% default), Spanish labels common, Invoice codes: RFC, CFDI
 */

import type { CountryConfig } from "./base";

export const MX_CONFIG: CountryConfig = {
  code: "MX",
  detection: {
    countryIndicators: [
      /\bMexico\b/i,
      /\bMX\b/
    ],
    currencyIndicators: [
      /\$\s?\d/,
      /\bMXN\b/i
    ],
    taxIdIndicators: [
      /\bRFC\b/i,
      /\bCFDI\b/i
    ]
  },
  currency: {
    code: "MXN",
    symbol: "$",
    keywords: ["$", "MXN"]
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
    total: ["TOTAL", "TOTAL A PAGAR", "IMPORTE TOTAL"],
    vat: ["IVA", "IMPUESTO", "TAX"],
    subtotal: ["SUBTOTAL"],
    service: ["SERVICIO", "SERVICE CHARGE", "PROPINA"],
    discount: ["DESCUENTO", "DISCOUNT"],
    tenderCash: ["EFECTIVO", "CASH"],
    tenderCard: ["TARJETA", "CREDIT", "DEBIT", "VISA", "MASTERCARD"],
    change: ["CAMBIO", "CHANGE"],
    merchantId: ["RFC", "CFDI"],
    branchId: ["SUCURSAL", "BRANCH"]
  },
  vatKeywords: ["IVA", "IMPUESTO", "TAX"],
  tax: {
    model: "vat",
    defaultRate: 0.16,
    separateLine: true
  },
  layoutHints: {
    rightAlignedTotals: true,
    allowQrCodes: true
  },
  screenshotIndicators: [
    "Apple Pay",
    "Google Wallet",
    "Mercado Pago",
    "Clip"
  ]
};

export default MX_CONFIG;
