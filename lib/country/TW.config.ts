/**
 * Taiwan (TW) country configuration
 * Contains all Taiwan-specific patterns and settings for receipt parsing
 * Includes: ROC calendar parsing (民國年), Traditional + English labels, invoice codes (統一發票), QR detection patterns
 */

import type { CountryConfig } from "./base";

export const TW_CONFIG: CountryConfig = {
  code: "TW",
  detection: {
    countryIndicators: [
      /\btaiwan\b/i,
      /台灣/,
      /臺灣/,
      /台北/,
      /高雄/,
      /新北/
    ],
    currencyIndicators: [
      /\bnt\$?\b/i,
      /\btwd\b/i,
      /NT\$/i
    ],
    taxIdIndicators: [
      /統一編號/,
      /統一發票/,
      /\bGUI\b/i
    ]
  },
  currency: {
    code: "TWD",
    symbol: "NT$",
    keywords: ["NT$", "TWD"]
  },
  dateTime: {
    datePatterns: [
      // Standard Gregorian YYYY/MM/DD or DD/MM/YYYY
      /\b(\d{4})[\/.-](\d{1,2})[\/.-](\d{1,2})\b/,
      /\b(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{4})\b/,
      // ROC calendar: YYY/MM/DD (e.g. 112/07/21)
      /\b(\d{2,3})[\/.-](\d{1,2})[\/.-](\d{1,2})\b/ 
    ],
    isoPatterns: [],
    shortPatterns: [],
    rocCalendar: {
      enabled: true,
      // ROC year = GregorianYear - 1911
      convert: (y: number) => y + 1911
    },
    timePatterns: [
      /\b(\d{1,2})[:.](\d{2})(?:[:.](\d{2}))?\b/,
      /\b(\d{1,2})時(\d{1,2})分\b/
    ]
  },
  numberFormat: {
    decimalSeparators: ["."],
    thousandSeparators: [",", " "],
    // No special compact format needed
  },
  labels: {
    total: ["TOTAL", "總計", "合計", "金額合計"],
    vat: ["VAT", "稅額", "營業稅", "交易稅"],
    subtotal: ["小計", "SUBTOTAL"],
    service: ["服務費", "SERVICE CHARGE", "SERVICE FEE"],
    discount: ["折扣", "DISCOUNT"],
    tenderCash: ["現金", "CASH"],
    tenderCard: ["刷卡", "CARD", "VISA", "MASTER", "JCB"],
    change: ["找零", "CHANGE"],
    merchantId: ["統一編號", "GUI NUMBER"],
    branchId: ["門市", "分店"],
    invoiceCode: ["統一發票", "電子發票"]
  },
  vatKeywords: ["VAT", "稅額", "營業稅", "交易稅"],
  layoutHints: {
    rightAlignedTotals: true,
    maxBottomLines: 14,
    allowQrCodes: true, // Taiwan e-invoices embed QR
    qrInvoiceDetection: true
  }
};

export default TW_CONFIG;
