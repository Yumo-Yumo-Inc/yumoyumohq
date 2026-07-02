/**
 * Mainland China (CN) country configuration
 * Contains all China-specific patterns and settings for receipt parsing
 * Notes: Fapiao-aware config, supports 普通发票 and 专用发票, Alipay/WeChat Pay/UnionPay
 */

import type { CountryConfig } from "./base";

export const CN_CONFIG: CountryConfig = {
  code: "CN",
  detection: {
    countryIndicators: [
      /\b中国\b/,
      /\bChina\b/i,
      /\bCN\b/
    ],
    currencyIndicators: [
      /¥\s?\d+/,
      /\bCNY\b/i,
      /\bRMB\b/i
    ],
    taxIdIndicators: [
      /纳税人识别号/,
      /税号/,
      /统一社会信用代码/
    ]
  },
  currency: {
    code: "CNY",
    symbol: "¥",
    keywords: ["¥", "CNY", "RMB"]
  },
  dateTime: {
    datePatterns: [
      // YYYY-MM-DD
      /\b(\d{4})-(\d{1,2})-(\d{1,2})\b/,
      // YYYY/MM/DD
      /\b(\d{4})\/(\d{1,2})\/(\d{1,2})\b/
    ],
    timePatterns: [
      /\b(\d{1,2}):(\d{2})(?::(\d{2}))?\b/
    ]
  },
  numberFormat: {
    decimalSeparators: ["."],
    thousandSeparators: [",", " "]
  },
  labels: {
    total: ["合计", "合计金额", "价税合计", "TOTAL", "AMOUNT DUE"],
    vat: ["增值税", "税额", "VAT", "TAX"],
    subtotal: ["金额", "小计", "SUBTOTAL"],
    service: ["服务费", "SERVICE CHARGE"],
    discount: ["折扣", "DISCOUNT"],
    tenderCash: ["现金支付", "CASH"],
    tenderCard: ["银行卡", "CARD", "银联"],
    change: ["找零", "CHANGE"],
    merchantId: ["纳税人识别号", "统一社会信用代码"],
    branchId: ["门店号", "STORE", "BRANCH"],
    invoiceCode: ["发票代码", "INVOICE CODE"],
    invoiceNumber: ["发票号码", "INVOICE NO", "NO."]
  },
  vatKeywords: ["增值税", "税额", "VAT", "TAX"],
  tax: {
    model: "vat_required", // CN Fapiao requires VAT line
    defaultRate: 0.13, // typical – varies between 3%, 6%, 9%, 13%
    separateLine: true,
    allowNoVat: false
  },
  layoutHints: {
    rightAlignedTotals: true,
    allowQrCodes: true // CN fapiao uses QR for verification
  },
  digitalReceipts: {
    acceptedVendors: ["Alipay", "WeChat Pay", "UnionPay"],
    allowNonScreenshotEmail: true,
    requireTransactionId: true
  },
  paymentChannels: {
    alipay: [/支付宝/],
    wechat: [/微信支付/],
    unionpay: [/银联/]
  },
  screenshotIndicators: [
    "WeChat Pay",
    "Weixin Pay",
    "Alipay",
    "支付宝",
    "微信支付",
    "UnionPay",
    "银联"
  ],
  invoiceTypes: [
    "普通发票",
    "专用发票",
    "电子发票",
    "增值税电子发票"
  ]
};

export default CN_CONFIG;
