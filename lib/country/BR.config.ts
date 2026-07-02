/**
 * Brazil (BR) country configuration
 * Contains all Brazil-specific patterns and settings for receipt parsing
 * Notes: Complex tax system with ICMS, ISS, PIS/COFINS
 */

import type { CountryConfig } from "./base";

export const BR_CONFIG: CountryConfig = {
  code: "BR",
  detection: {
    countryIndicators: [
      /\bBrasil\b/i,
      /\bBrazil\b/i,
      /\bBR\b/
    ],
    currencyIndicators: [
      /R\$\s?\d+/,
      /\bBRL\b/i
    ],
    taxIdIndicators: [
      /\bCNPJ\b/i,
      /\bCPF\b/i
    ]
  },
  currency: {
    code: "BRL",
    symbol: "R$",
    keywords: ["R$", "BRL"]
  },
  dateTime: {
    datePatterns: [
      // DD/MM/YYYY dominant
      /\b(\d{1,2})\/(\d{1,2})\/(\d{4})\b/,
      // ISO backup
      /\b(\d{4})-(\d{1,2})-(\d{1,2})\b/
    ],
    timePatterns: [
      /\b(\d{1,2})[:.](\d{2})(?::(\d{2}))?\b/
    ]
  },
  numberFormat: {
    decimalSeparators: [","],
    thousandSeparators: ["."]
  },
  labels: {
    total: ["TOTAL", "VALOR TOTAL", "TOTAL A PAGAR", "TOTAL PAGO"],
    vat: ["ICMS", "ISS", "IMPOSTO", "TAXA"],
    subtotal: ["SUBTOTAL", "VALOR", "VALOR PARCIAL"],
    service: ["TAXA DE SERVIÇO", "SERVIÇO", "SERVICE CHARGE"],
    discount: ["DESCONTO", "DESC", "DISCOUNT"],
    tenderCash: ["DINHEIRO", "CASH"],
    tenderCard: ["CARTÃO", "CREDITO", "DEBITO", "VISA", "MASTERCARD"],
    change: ["TROCO", "CHANGE"],
    merchantId: ["CNPJ", "CPF"],
    branchId: ["FILIAL", "LOJA", "UNIDADE"]
  },
  vatKeywords: ["ICMS", "ISS", "IMPOSTO", "TAXA"],
  tax: {
    model: "multi_component",
    components: ["ICMS", "ISS", "PIS", "COFINS"],
    extractComponents: true
  },
  layoutHints: {
    rightAlignedTotals: true,
    allowQrCodes: true
  },
  screenshotIndicators: [
    "Mercado Pago",
    "PicPay",
    "Cielo",
    "Rede",
    "Stone"
  ]
};

export default BR_CONFIG;
