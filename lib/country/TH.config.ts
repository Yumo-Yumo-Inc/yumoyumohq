/**
 * Thailand (TH) country configuration
 * Contains all Thailand-specific patterns and settings for receipt parsing
 */

import type { CountryConfig } from "./base";

export const TH_CONFIG: CountryConfig = {
  code: "TH",

  detection: {
    countryIndicators: [
      /\bthailand\b/i,
      /\bthai\b/i,
      /\bpattaya\b/i,
      /\bbangkok\b/i,
      /\bphuket\b/i,
      /\bchiang\s*mai\b/i,
      /\bterminal\s*21\b/i,
      /\basoke\b/i,
      /\bjones['']?\s*salad\b/i,
      /\bstarbucks\s*(?:thailand|th)\b/i,
      /\bwww\.starbucks\.co\.th\b/i,
      /\bstarbucks\s*th\s*app\b/i,
      /\b(?:ikano|ikea|7-eleven|big\s+c|tesco|central|family\s+mart|starbucks)\s*(?:\(.*thailand.*\)|thailand)/i,
      /\btax\s+id\s*:?\s*\d{13}/i,
      /[ก-๙]/, // Thai script
    ],
    currencyIndicators: [
      /\b฿\b/,
      /\bbaht\b/i,
      /\bthb\b/i,
      /\bvat\s*7%/i,
      /\bvat\s*:?\s*7%/i,
      /\b7%\s*vat\b/i,
      /[\u0E00-\u0E7F]/, // Thai script presence
      /\bthailand\b/i,
      /\bthai\b/i,
      /\bpattaya\b/i,
      /\bbangkok\b/i,
      /\bphuket\b/i,
      /\bchiang\s*mai\b/i,
      /\bstarbucks\s*(?:thailand|th)\b/i,
      /\btax\s+id\s*:?\s*\d{13}/i,
      /\b(?:ikano|ikea|7-eleven|big\s+c|tesco|central|family\s+mart|starbucks)\s*(?:\(.*thailand.*\)|thailand)/i,
      /\bwww\.starbucks\.co\.th\b/i,
      /\bstarbucks\s*th\s*app\b/i,
    ],
  },

  currency: {
    code: "THB",
    symbol: "฿",
    keywords: ["THB", "฿", "Baht"],
  },

  dateTime: {
    // Thai date patterns: DD/MM/YYYY, DD-MM-YYYY, DD.MM.YYYY
    datePatterns: [
      /\b(\d{1,2})[./-](\d{1,2})[./-](\d{4})\b/,
    ],
    // International date patterns: YYYY-MM-DD, YYYY/MM/DD
    isoPatterns: [
      /\b(\d{4})[./-](\d{1,2})[./-](\d{1,2})\b/,
    ],
    // Short date patterns: DD/MM/YY, DD-MM-YY
    shortPatterns: [
      /\b(\d{1,2})[./-](\d{1,2})[./-](\d{2})\b/,
    ],
    // Time patterns: HH:MM, HH.MM, HH-MM
    timePatterns: [
      /\b([01]?\d|2[0-3])[:.]([0-5]\d)(?:[:.]([0-5]\d))?\b/,
      /\b(0?\d|1[0-2])[:.]([0-5]\d)\s*(AM|PM|am|pm)\b/i,
    ],
    // Buddhist calendar support
    useBuddhistCalendar: true,
    buddhistOffset: 543,
    buddhistThreshold: 2400,
  },

  numberFormat: {
    decimalSeparators: ["."],
    thousandSeparators: [","],
    parseFunction: (text: string) => {
      // Standard number format: "3,125.00" -> 3125.00
      return parseFloat(text.replace(/,/g, ''));
    },
  },

  labels: {
    total: [
      "total",
      "grand total",
      "total amount",
      "amount due",
      "total due",
      "balance due",
      "ยอดรวม",
      "รวมทั้งสิ้น",
      "ยอดสุทธิ",
    ],
    vat: [
      "vat",
      "tax",
      "ภาษี",
      "vat 7%",
    ],
    subtotal: [
      "subtotal",
      "sub total",
      "ยอดรวมก่อนภาษี",
    ],
    service: [
      "service",
      "service charge",
      "ค่าบริการ",
    ],
    discount: [
      "discount",
      "saved",
      "ส่วนลด",
      "คูปอง",
      "coupon",
    ],
    tenderCash: [
      "cash",
      "เงินสด",
    ],
    tenderCard: [
      "card",
      "credit card",
    ],
    change: [
      "change",
      "เงินทอน",
    ],
    merchantId: [
      "tax id",
      "registration",
    ],
    branchId: [
      "branch",
      "สาขา",
    ],
  },

  vatKeywords: ["VAT", "TAX", "ภาษี"],

  layoutHints: {
    rightAlignedTotals: true,
    maxBottomLines: 10,
  },
};
