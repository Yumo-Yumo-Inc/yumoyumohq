// lib/shared/constants.ts
// Shared constants - can be imported by both client and server
//
// Goal of this file:
// - Provide stable regex/keyword dictionaries for receipt parsing.
// - Keep exports backwards-compatible (same names) to avoid breaking imports.
// - Add "role-based" helpers (strong/weak total keys, noise keys) for reconstruction.

//
// ----------------------------
// Date patterns
// ----------------------------

export const regexPatterns = {
  // 15/12/2568, 15.12.2025, 02-12-25, etc. — all numeric date variations
  numericDate: /\b(\d{1,2})[./-](\d{1,2})[./-](\d{2,4})\b/g,

  // 15 Dec 2025, 2 Dec 2568, 15 Aralık 2025, etc. — textual date variations
  textualDate:
    /\b(\d{1,2})\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec|Oca|Şub|Mar|Nis|May|Haz|Tem|Ağu|Eyl|Eki|Kas|Ara)[a-z]*\s+(\d{2,4})\b/gi,

  // Amount candidate extraction (do NOT treat as "money" without context)
  // - allows integers and decimals
  // - supports 1,234.56 / 1.234,56 / 1234.56 / 1234
  amount:
    /\b(\d{1,3}(?:[.,\s]\d{3})*(?:[.,]\d{2})|\d+(?:[.,]\d{2})|\d+)\b/g,
};

export const monthMap: { [key: string]: number } = {
  jan: 0,
  oca: 0,
  feb: 1,
  şub: 1,
  mar: 2,
  apr: 3,
  nis: 3,
  may: 4,
  jun: 5,
  haz: 5,
  jul: 6,
  tem: 6,
  aug: 7,
  ağu: 7,
  sep: 8,
  eyl: 8,
  oct: 9,
  eki: 9,
  nov: 10,
  kas: 10,
  dec: 11,
  ara: 11,
};

//
// ----------------------------
// Currency detection
// ----------------------------

export const CURRENCY_SYMBOLS: Record<string, string> = {
  "฿": "THB",
  "₺": "TRY",
  "$": "USD",
  "€": "EUR",
  "£": "GBP",
  "¥": "JPY",
};

export const CURRENCY_CODES = [
  "THB",
  "TWD",
  "TRY",
  "USD",
  "EUR",
  "GBP",
  "MYR",
  "SGD",
  "AED",
  "JPY",
  "KRW",
  "VND",
];

export const CURRENCY_HINTS: Array<{ re: RegExp; currency: string; country?: string }> = [
  { re: /฿/g, currency: "THB", country: "TH" },
  { re: /\bTHB\b/gi, currency: "THB", country: "TH" },
  { re: /\bNT\$\b/gi, currency: "TWD", country: "TW" },
  { re: /\bTWD\b/gi, currency: "TWD", country: "TW" },
  { re: /€/, currency: "EUR" },
  { re: /£/, currency: "GBP", country: "GB" },
  { re: /\bUSD\b|\$/g, currency: "USD", country: "US" },
];

//
// ----------------------------
// Vendor / meta stopwords
// ----------------------------

export const VENDOR_STOPWORDS = new Set([
  "welcome",
  "thank",
  "tax invoice",
  "receipt",
  "invoice",
  "customer",
  "date",
  "tarih",
  "fiş",
  "fatura",
  "merhaba",
  "teşekkür",

  // common footer noise
  "thanks",
  "thank you",
  "enjoy",
  "follow",
  "facebook",
  "instagram",
  "line",
  "tiktok",
  "www",
  "http",
]);

//
// ----------------------------
// Hints: online invoice / card slip
// ----------------------------

export const ONLINE_HINTS = [
  "e-tax",
  "e-receipt",
  "invoice",
  "tax invoice",
  "electronic",
  "online",
  "download",
  "www.",
  "http",
  "qr",
  "email",
  "receipt copy",
  "order id",
];

export const CARD_SLIP_HINTS = [
  "visa",
  "mastercard",
  "amex",
  "approval code",
  "terminal",
  "merchant id",
  "pos#",
  "batch",
  "rrn",
];

//
// ----------------------------
// Script / language helpers
// ----------------------------

export const THAI_SCRIPT_RE = /[ก-๙]/;

//
// ----------------------------
// Receipt key regexes (backwards compatible)
// ----------------------------
//
// IMPORTANT:
// - TOTAL_KEY_RE previously matched "amount" and "net baht" very broadly.
// - That caused wrong totals in messy receipts (e.g., "NET 195.33" beating "EATIN TOTAL 209").
// - Now TOTAL_KEY_RE is tightened to "strong" total expressions.
// - If you need weak matching, use TOTAL_WEAK_KEY_RE below.
//

// Strong keys that should meaningfully indicate the payable total.
export const TOTAL_STRONG_KEY_RE =
  /(grand\s*total|total\s*amount|amount\s*due|total\s*due|balance\s*due|ยอดรวม|รวมทั้งสิ้น|ยอดสุทธิ|total\b|toplam|fiş\s*tutarı|gtoplam|tutar|ödenecek\s+tutar|ödenecek\s+toplam|ödenen\s+tutar|vergiler\s+dahil\s+toplam)/i;

// Weak keys: useful as a scoring feature, NOT as a final decision by itself.
export const TOTAL_WEAK_KEY_RE =
  /\b(net|amount|baht|สุทธิ|รวม)\b/i;

// Backwards compatible name used by older code paths
export const TOTAL_KEY_RE = TOTAL_STRONG_KEY_RE;

export const SUBTOTAL_KEY_RE = /(subtotal|sub\s*total|ยอดรวมก่อนภาษี|ara\s*toplam)/i;
export const TAX_KEY_RE = /\b(vat|vatable|tax|gst|kdv|ภาษี)\b/i;

export const CASH_RE = /\b(cash|เงินสด)\b/i;
export const CHANGE_RE = /\b(change|เงินทอน)\b/i;

export const NUMERIC_DATE_RE = regexPatterns.numericDate;
export const TEXTUAL_DATE_RE = regexPatterns.textualDate;

// Backwards compatible amount regex (older code imports AMOUNT_RE).
// NOTE: still broad; use it only after you decide a line is an amount-candidate line.
export const AMOUNT_RE = regexPatterns.amount;

//
// ----------------------------
// Noise removal (for reconstruction)
// ----------------------------
// These are not used unless your pipeline calls them,
// but they allow you to quickly add a noise filter without inventing strings again.
//

export const NOISE_HINTS = [
  // wifi / password
  "wifi",
  "wi-fi",
  "password",
  "pass:",
  "pwd",
  "ssid",

  // restroom / toilet
  "toilet",
  "restroom",
  "wc",
  "bathroom",
  "ห้องน้ำ",
  "รหัส",

  // survey / feedback
  "survey",
  "feedback",
  "rate us",
  "review",
  "tell us",
  "comment",

  // delivery platforms / tracking noise (can be header, but often not useful)
  "order no",
  "order #",
  "queue",
  "q.",
  "tracking",
  "ref",
  "reference",

  // social / promo
  "follow us",
  "facebook",
  "instagram",
  "line id",
  "tiktok",
  "promo",
  "promotion",

  // legal/footer
  "terms",
  "conditions",
  "receipt copy",
];

export const NOISE_LINE_RE =
  /\b(wifi|wi-fi|password|ssid|toilet|restroom|bathroom|survey|feedback|rate\s*us|review|follow\s*us|promo|promotion)\b/i;

//
// ----------------------------
// Keyword lists (optional scoring helpers)
// ----------------------------

export const TOTAL_STRONG_KEYS = [
  "grand total",
  "total amount",
  "amount due",
  "total due",
  "balance due",
  "eatin total",
  "eat in total",
  "eat-in total",
  "ยอดรวม",
  "รวมทั้งสิ้น",
  "ยอดสุทธิ",
  // Turkish - CRITICAL: All variations
  "toplam",           // ← lowercase
  "TOPLAM",           // ← uppercase (e-Archive invoices)
  "Toplam",           // ← Capital case
  "fiş tutarı",
  "gtoplam",
  "genel toplam",     // ← added
  "ödenecek tutar",
  "ödenecek toplam",
  "ödenen tutar",
  "vergiler dahil toplam",
  "vergiler dahil toplam tutar",
  "kdv dahil tutar",  // ← added
  "total",
  // Turkish A101 e-invoice format (OCR often outputs TOP_AM for TOPLAM)
  "top_am",
  "top am",
  "topam",
];

export const TOTAL_WEAK_KEYS = ["net", "amount", "baht", "สุทธิ", "รวม"];

export const SUBTOTAL_KEYS = ["subtotal", "sub total", "ara toplam", "ยอดรวมก่อนภาษี"];
export const TAX_KEYS = ["vat", "tax", "gst", "kdv", "ภาษี", "topkdv","TOPKDV","toplam kdv", "kdv toplamı","kdv tutarı",];
export const DISCOUNT_KEYS = ["discount", "saved", "ส่วนลด", "คูปอง", "coupon"];
export const SERVICE_KEYS = ["service", "svc", "service charge", "ค่าบริการ"];
export const TIP_KEYS = ["tip", "gratuity"];

//
// End of file
//
