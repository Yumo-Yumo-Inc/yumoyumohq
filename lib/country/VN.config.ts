/**
 * Vietnam (VN) country configuration
 * Contains all Vietnam-specific patterns and settings for receipt parsing
 * Notes: VAT: 10% standard (with 8% reduced categories), Language uses đ or VND
 */

import type { CountryConfig } from "./base";

export const VN_CONFIG: CountryConfig = {
  code: "VN",
  detection: {
    countryIndicators: [
      /\bVietnam\b/i,
      /\bViet Nam\b/i,
      // Vietnamese cities (appear on most receipts in address)
      /\bĐà\s*Nẵng\b/i,
      /\bDa\s*Nang\b/i,
      /\bHà\s*Nội\b/i,
      /\bHa\s*Noi\b/i,
      /\bTP\.?\s*HCM\b/i,
      /\bHồ\s*Chí\s*Minh\b/i,
      /\bHo\s*Chi\s*Minh\b/i,
      /\bHải\s*Phòng\b/i,
      /\bHai\s*Phong\b/i,
      /\bCần\s*Thơ\b/i,
      /\bCan\s*Tho\b/i,
      /\bBiên\s*Hòa\b/i,
      /\bBien\s*Hoa\b/i,
      // Vietnamese address units (very common on every receipt)
      /\bPhường\b/i,
      /\bPhuong\b/i,
      /\bQuận\b/i,
      /\bQuan\b\s+\d/i,
      /\bHành\s*Sơn\b/i,
      /\bNguyễn\b/i,
      /\bTrần\b/i,
      /\bLê\s+[A-ZÀ-Ỵ]/,
      // Vietnamese tax ID label
      /\bMST\s*:/i,
      /\bMã\s*số\s*thuế\b/i,
    ],
    currencyIndicators: [
      /đ\b/,
      /\bVND\b/i,
      /\b₫/,
      // Vietnamese price format: "450.000" or "450,000" followed by nothing or đ
      /\d{3}[\.,]\d{3}\s*(?:đ|₫|VND)?/i,
    ],
    taxIdIndicators: [
      /\bMST\b/,
      /\bTax Code\b/i,
      /\bMã\s*số\s*thuế\b/i,
    ]
  },
  currency: {
    code: "VND",
    symbol: "₫",
    keywords: ["₫", "VND", "đ"]
  },
  dateTime: {
    datePatterns: [
      /\b(\d{1,2})\/(\d{1,2})\/(\d{4})\b/,
      /\b(\d{4})-(\d{1,2})-(\d{1,2})\b/
    ],
    timePatterns: [
      /\b(\d{1,2})[:.](\d{2})(?:[:.](\d{2}))?\b/
    ]
  },
  numberFormat: {
    decimalSeparators: [","],
    thousandSeparators: ["."]
  },
  labels: {
    total: ["TỔNG CỘNG", "TOTAL", "AMOUNT DUE"],
    vat: ["VAT", "THUẾ GTGT", "GTGT", "VAT 10%"],
    subtotal: ["TẠM TÍNH", "SUBTOTAL"],
    service: ["PHỤC VỤ", "SERVICE CHARGE"],
    discount: ["GIẢM GIÁ", "DISCOUNT"],
    tenderCash: ["TIỀN MẶT", "CASH"],
    tenderCard: ["THẺ", "CARD", "VISA", "MASTERCARD"],
    change: ["TIỀN THỪA", "CHANGE"],
    merchantId: ["MST"],
    branchId: ["CHI NHÁNH", "BRANCH"]
  },
  vatKeywords: ["VAT", "THUẾ GTGT", "GTGT", "VAT 10%"],
  tax: {
    model: "vat",
    defaultRate: 0.10,
    separateLine: true
  },
  layoutHints: {
    rightAlignedTotals: true,
    allowQrCodes: true
  },
  screenshotIndicators: [
    "MoMo",
    "ZaloPay",
    "VNPay",
    "ShopeePay",
    "GrabPay"
  ]
};

export default VN_CONFIG;
