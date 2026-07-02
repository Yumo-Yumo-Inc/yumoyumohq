/**
 * Currency resolver module
 * Deterministic currency detection from OCR, country, and document type
 */

import type { OCRLine } from "../receipt/types";
import type { CountryConfig } from "@/lib/country/base";

export interface CurrencyResolution {
  currency: string; // ISO code: "TRY", "THB", "USD", "EUR", etc.
  symbol: string; // Symbol: "₺", "฿", "$", "€", etc.
  confidence: number; // 0..1
  reasons: string[];
}

interface CountryCurrencyMap {
  [countryCode: string]: { currency: string; symbol: string };
}

/**
 * Country code to currency mapping
 */
const COUNTRY_CURRENCY_MAP: CountryCurrencyMap = {
  // Turkey
  TR: { currency: "TRY", symbol: "₺" },
  // Thailand
  TH: { currency: "THB", symbol: "฿" },
  // Taiwan
  TW: { currency: "TWD", symbol: "NT$" },
  // United States
  US: { currency: "USD", symbol: "$" },
  // United Kingdom
  GB: { currency: "GBP", symbol: "£" },
  // Eurozone
  EU: { currency: "EUR", symbol: "€" },
  DE: { currency: "EUR", symbol: "€" },
  FR: { currency: "EUR", symbol: "€" },
  IT: { currency: "EUR", symbol: "€" },
  ES: { currency: "EUR", symbol: "€" },
  NL: { currency: "EUR", symbol: "€" },
  BE: { currency: "EUR", symbol: "€" },
  AT: { currency: "EUR", symbol: "€" },
  PT: { currency: "EUR", symbol: "€" },
  GR: { currency: "EUR", symbol: "€" },
  IE: { currency: "EUR", symbol: "€" },
  FI: { currency: "EUR", symbol: "€" },
  // Malaysia
  MY: { currency: "MYR", symbol: "RM" },
  // Russia
  RU: { currency: "RUB", symbol: "₽" },
  // Singapore
  SG: { currency: "SGD", symbol: "S$" },
  // United Arab Emirates
  AE: { currency: "AED", symbol: "د.إ" },
  // Japan
  JP: { currency: "JPY", symbol: "¥" },
  // South Korea
  KR: { currency: "KRW", symbol: "₩" },
  // Vietnam
  VN: { currency: "VND", symbol: "₫" },
  // China
  CN: { currency: "CNY", symbol: "¥" },
  // India
  IN: { currency: "INR", symbol: "₹" },
  // Saudi Arabia
  SA: { currency: "SAR", symbol: "﷼" },
  // Indonesia
  ID: { currency: "IDR", symbol: "Rp" },
  // Philippines
  PH: { currency: "PHP", symbol: "₱" },
  // Australia
  AU: { currency: "AUD", symbol: "A$" },
  // Canada
  CA: { currency: "CAD", symbol: "C$" },
  // New Zealand
  NZ: { currency: "NZD", symbol: "NZ$" },
  // Switzerland
  CH: { currency: "CHF", symbol: "CHF" },
  // Norway
  NO: { currency: "NOK", symbol: "kr" },
  // Sweden
  SE: { currency: "SEK", symbol: "kr" },
  // Denmark
  DK: { currency: "DKK", symbol: "kr" },
  // Poland
  PL: { currency: "PLN", symbol: "zł" },
  // Czech Republic
  CZ: { currency: "CZK", symbol: "Kč" },
  // Hungary
  HU: { currency: "HUF", symbol: "Ft" },
  // Romania
  RO: { currency: "RON", symbol: "lei" },
  // Brazil
  BR: { currency: "BRL", symbol: "R$" },
  // Mexico
  MX: { currency: "MXN", symbol: "$" },
  // Argentina
  AR: { currency: "ARS", symbol: "$" },
  // Chile
  CL: { currency: "CLP", symbol: "$" },
  // South Africa
  ZA: { currency: "ZAR", symbol: "R" },
  // Egypt
  EG: { currency: "EGP", symbol: "£" },
  // Israel
  IL: { currency: "ILS", symbol: "₪" },
};

/**
 * Detect currency from OCR text and symbols
 */
function detectCurrencyFromOCR(
  ocrText: string,
  ocrLines: OCRLine[],
  countryConfig?: CountryConfig
): { currency?: string; symbol?: string; confidence: number; reasons: string[] } {
  const reasons: string[] = [];
  const lowerText = ocrText.toLowerCase();
  const allLines = ocrLines.map((l) => l.text.toLowerCase()).join(" ");

  // Use config currency indicators if available
  if (countryConfig) {
    for (const pattern of countryConfig.detection.currencyIndicators) {
      if (pattern.test(lowerText) || pattern.test(allLines)) {
        reasons.push(`${countryConfig.currency.code} detected from ${countryConfig.code} config`);
        return {
          currency: countryConfig.currency.code,
          symbol: countryConfig.currency.symbol,
          confidence: 0.7,
          reasons,
        };
      }
    }
  }

  // TRY detection - Enhanced with more Turkish receipt patterns (fallback)
  const tryPatterns = [
    /\b₺\b/,
    /\btl\b/i,  // "TL" (case insensitive)
    /\btry\b/i,  // "TRY" (case insensitive)
    /\btürk\s+lirası\b/i,
    /\bkdv\b/i,
    /\btopkdv\b/i,  // TOPKDV + OCR typos (topdv, topkdi, etc.)
    /\btopdv\b/i,
    /\btopkdi\b/i,
    /\be-arşiv\b/i,
    /\bödenecek\s+toplam\b/i,
    /\bara\s+toplam\b/i,
    /\bmatrah\b/i,
    /\bmersis\s+no\b/i,  // MERSİS NO is Turkish company identifier
    /\btic\s+sic\s+no\b/i,  // TIC SIC NO is Turkish trade registry
    /\bfiş\s+no\b/i,  // FIŞ NO is Turkish receipt number
    /\bnakit\b/i,  // NAKIT (cash) is Turkish
    /\bmotorin\b/i,  // MOTORIN (diesel) is Turkish
    /\bpetrol\b/i,  // PETROL (fuel) is Turkish
    /\bistasyon\b/i,  // İSTASYON (station) is Turkish
    /\bdojistik\b/i,  // DOJISTIK (logistics) is Turkish
    /\bpetrolleri\b/i,  // PETROLLERI (petroleum) is Turkish
  ];

  // Check for TRY patterns
  for (const pattern of tryPatterns) {
    if (pattern.test(lowerText) || pattern.test(allLines)) {
      reasons.push("TRY detected from OCR pattern");
      return { currency: "TRY", symbol: "₺", confidence: 0.65, reasons };
    }
  }

  // Check for TRY suffix in amounts (e.g., "1.203,98 TL", "2.721,00 TL")
  // Enhanced pattern to catch "TRY" or "TL" after amounts
  const tryAmountPatterns = [
    /(\d[\d\.,]+)\s*(tl|₺|try)\b/i,  // "2.721,00 TL" or "2721.00 TRY"
    /\b(tl|try)\s*(\d[\d\.,]+)/i,    // "TL 2.721,00" or "TRY 2721.00"
    /(\d[\d\.,]+)\s*tl\s*$/i,        // Amount ending with "TL"
    /toplam.*?(\d[\d\.,]+)\s*(tl|try)\b/i,  // "Toplam ... TL"
    /total.*?(\d[\d\.,]+)\s*(tl|try)\b/i,   // "Total ... TL"
  ];
  
  for (const pattern of tryAmountPatterns) {
    if (pattern.test(lowerText) || pattern.test(allLines)) {
      reasons.push("TRY detected from amount suffix/prefix");
      return { currency: "TRY", symbol: "₺", confidence: 0.7, reasons };
    }
  }

  // THB detection - Enhanced patterns for Thai receipts
  const thbPatterns = [
    /\b฿\b/,
    /\bbaht\b/i,
    /\bthb\b/i,
    /\bvat\s*7%/i,
    /\bvat\s*:?\s*7%/i,
    /\b7%\s*vat\b/i,
    /[\u0E00-\u0E7F]/, // Thai script presence
    /\bthailand\b/i,
    /\bthai\b/i,
    /\bpattaya\b/i, // Common Thai city
    /\bbangkok\b/i, // Thai capital
    /\bphuket\b/i, // Thai city
    /\bchiang\s*mai\b/i, // Thai city
    /\bstarbucks\s*(?:coffee|thailand|th)\b/i, // Starbucks in Thailand
    /\btax\s+id\s*:?\s*\d{13}/i, // Thai TAX ID format (13 digits)
    /\b(?:ikano|ikea|7-eleven|big\s+c|tesco|central|family\s+mart|starbucks)\s*(?:\(.*thailand.*\)|thailand)/i, // Thai companies
    /\bwww\.starbucks\.co\.th\b/i, // Starbucks Thailand website
    /\bstarbucks\s*th\s*app\b/i, // Starbucks TH app mention
  ];

  for (const pattern of thbPatterns) {
    if (pattern.test(lowerText) || pattern.test(allLines)) {
      reasons.push("THB detected from OCR pattern");
      return { currency: "THB", symbol: "฿", confidence: 0.6, reasons };
    }
  }

  // USD detection - Enhanced patterns for better detection
  const usdPatterns = [
    /\$\s*\d/,                    // "$20"
    /\busd\b/i,                   // "USD"
    /\btotal\s+usd\b/i,           // "Total USD"
    /\$\s*\d+\.\d+\s*usd/i,       // "$20.00 USD"
    /\d+\.\d+\s*usd/i,            // "20.00 USD"
    /\bus\s*dollar/i,             // "US Dollar"
    /\bunited\s*states\s*dollar/i, // "United States Dollar"
    /\bamount\s+due.*usd/i,        // "Amount due ... USD"
    /\bdue.*usd/i,                // "... due ... USD"
  ];

  for (const pattern of usdPatterns) {
    if (pattern.test(lowerText) || pattern.test(allLines)) {
      reasons.push("USD detected from OCR pattern");
      return { currency: "USD", symbol: "$", confidence: 0.65, reasons };
    }
  }

  // EUR detection
  const eurPatterns = [
    /\b€\b/,
    /\beur\b/i,
    /\beuro\b/i,
    /\beuros\b/i,
  ];

  for (const pattern of eurPatterns) {
    if (pattern.test(lowerText) || pattern.test(allLines)) {
      reasons.push("EUR detected from OCR pattern");
      return { currency: "EUR", symbol: "€", confidence: 0.6, reasons };
    }
  }

  // MYR (Malaysian Ringgit) detection
  const myrPatterns = [
    /\brm\b/i,
    /\bmyr\b/i,
    /\bringgit\b/i,
    /\bmalaysia\b/i,
    /\bmalaysian\b/i,
    /\bkl\b/i,  // Kuala Lumpur
    /\bkuala\s+lumpur\b/i,
    /\bpetronas\b/i,
    /\bgst\s*6%/i,
    /\bsst\s*6%/i,
    /\bsst\s*8%/i, // SST increased to 8%
    /\brm\s*\d/i,  // RM followed by digit (e.g. RM10, RM 10) - captures cases where OCR misses space
    /rm\d/i,       // RM attached to digit without boundary (aggressive fallback for bad OCR)
  ];

  for (const pattern of myrPatterns) {
    if (pattern.test(lowerText) || pattern.test(allLines)) {
      reasons.push("MYR detected from OCR pattern");
      return { currency: "MYR", symbol: "RM", confidence: 0.6, reasons };
    }
  }

  // RUB (Russian Ruble) detection
  const rubPatterns = [
    /\b₽\b/,
    /\brub\b/i,
    /\bruble\b/i,
    /\brouble\b/i,
    /\brussia\b/i,
    /\brussian\b/i,
    /\bмосква\b/i,
    /\bсанкт-петербург\b/i,
    /\bндс\b/i,
    /\b[а-яё]/i,
  ];

  for (const pattern of rubPatterns) {
    if (pattern.test(lowerText) || pattern.test(allLines)) {
      reasons.push("RUB detected from OCR pattern");
      return { currency: "RUB", symbol: "₽", confidence: 0.6, reasons };
    }
  }

  // SGD (Singapore Dollar) detection
  const sgdPatterns = [
    /\bsgd\b/i,
    /\bsingapore\s+dollar\b/i,
    /\bsingapore\b/i,
    /\bs\$\b/,
    /\bgst\s*7%/i,  // Singapore GST is 7%
  ];

  for (const pattern of sgdPatterns) {
    if (pattern.test(lowerText) || pattern.test(allLines)) {
      reasons.push("SGD detected from OCR pattern");
      return { currency: "SGD", symbol: "S$", confidence: 0.6, reasons };
    }
  }

  // AED (UAE Dirham) detection
  const aedPatterns = [
    /\baed\b/i,
    /\bdirham\b/i,
    /\buae\b/i,
    /\bdubai\b/i,
    /\babu\s+dhabi\b/i,
    /\bemirates\b/i,
  ];

  for (const pattern of aedPatterns) {
    if (pattern.test(lowerText) || pattern.test(allLines)) {
      reasons.push("AED detected from OCR pattern");
      return { currency: "AED", symbol: "د.إ", confidence: 0.6, reasons };
    }
  }

  // JPY (Japanese Yen) detection
  const jpyPatterns = [
    /\b¥\b/,
    /\bjpy\b/i,
    /\byen\b/i,
    /\bjapan\b/i,
    /\bjapanese\b/i,
    /[ひらがなカタカナ漢字]/,  // Japanese script
    /\b消費税\b/i,  // Consumption tax
  ];

  for (const pattern of jpyPatterns) {
    if (pattern.test(lowerText) || pattern.test(allLines)) {
      reasons.push("JPY detected from OCR pattern");
      return { currency: "JPY", symbol: "¥", confidence: 0.6, reasons };
    }
  }

  // KRW (South Korean Won) detection
  const krwPatterns = [
    /\b₩\b/,
    /\bkrw\b/i,
    /\bwon\b/i,
    /\bkorea\b/i,
    /\bkorean\b/i,
    /[가-힣]/,  // Korean script
    /\b부가세\b/i,  // VAT in Korean
  ];

  for (const pattern of krwPatterns) {
    if (pattern.test(lowerText) || pattern.test(allLines)) {
      reasons.push("KRW detected from OCR pattern");
      return { currency: "KRW", symbol: "₩", confidence: 0.6, reasons };
    }
  }

  // VND (Vietnamese Dong) detection
  const vndPatterns = [
    /\bvnd\b/i,
    /\bdong\b/i,
    /\bvietnam\b/i,
    /\bvietnamese\b/i,
    /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/,  // Vietnamese script
  ];

  for (const pattern of vndPatterns) {
    if (pattern.test(lowerText) || pattern.test(allLines)) {
      reasons.push("VND detected from OCR pattern");
      return { currency: "VND", symbol: "₫", confidence: 0.6, reasons };
    }
  }

  // CNY (Chinese Yuan) detection
  const cnyPatterns = [
    /\bcny\b/i,
    /\byuan\b/i,
    /\brenminbi\b/i,
    /\brmb\b/i,
    /\bchina\b/i,
    /\bchinese\b/i,
    /[一-龯]/,  // Chinese characters
    /\b增值税\b/i,  // VAT in Chinese
  ];

  for (const pattern of cnyPatterns) {
    if (pattern.test(lowerText) || pattern.test(allLines)) {
      reasons.push("CNY detected from OCR pattern");
      return { currency: "CNY", symbol: "¥", confidence: 0.6, reasons };
    }
  }

  // INR (Indian Rupee) detection
  const inrPatterns = [
    /\b₹\b/,
    /\binr\b/i,
    /\brupee\b/i,
    /\brupees\b/i,
    /\bindia\b/i,
    /\bindian\b/i,
    /[अ-ह]/,  // Devanagari script
    /\bgst\b/i,  // India uses GST
  ];

  for (const pattern of inrPatterns) {
    if (pattern.test(lowerText) || pattern.test(allLines)) {
      reasons.push("INR detected from OCR pattern");
      return { currency: "INR", symbol: "₹", confidence: 0.6, reasons };
    }
  }

  // IDR (Indonesian Rupiah) detection
  const idrPatterns = [
    /\bidr\b/i,
    /\brupiah\b/i,
    /\bindonesia\b/i,
    /\bindonesian\b/i,
    /\bjakarta\b/i,
    /\bppn\b/i,  // PPN = VAT in Indonesian
  ];

  for (const pattern of idrPatterns) {
    if (pattern.test(lowerText) || pattern.test(allLines)) {
      reasons.push("IDR detected from OCR pattern");
      return { currency: "IDR", symbol: "Rp", confidence: 0.6, reasons };
    }
  }

  // PHP (Philippine Peso) detection
  const phpPatterns = [
    /\b₱\b/,
    /\bphp\b/i,
    /\bpeso\b/i,
    /\bphilippines\b/i,
    /\bphilippine\b/i,
    /\bmanila\b/i,
    /\bvat\b/i,  // Philippines uses VAT
  ];

  for (const pattern of phpPatterns) {
    if (pattern.test(lowerText) || pattern.test(allLines)) {
      reasons.push("PHP detected from OCR pattern");
      return { currency: "PHP", symbol: "₱", confidence: 0.6, reasons };
    }
  }

  // Amount suffix patterns for all currencies
  const amountPatterns = [
    { pattern: /(\d[\d\.,]+)\s*(rm|myr|ringgit)\b/i, currency: "MYR", symbol: "RM" },
    { pattern: /\b(rm|myr|ringgit)\s*(\d[\d\.,]+)/i, currency: "MYR", symbol: "RM" }, // Prefix pattern for RM
    { pattern: /(\d[\d\.,]+)\s*(₽|rub|ruble|rouble)\b/i, currency: "RUB", symbol: "₽" },
    { pattern: /(\d[\d\.,]+)\s*(sgd|s\$)\b/i, currency: "SGD", symbol: "S$" },
    { pattern: /(\d[\d\.,]+)\s*(aed|dirham)\b/i, currency: "AED", symbol: "د.إ" },
    { pattern: /(\d[\d\.,]+)\s*(jpy|yen|¥)\b/i, currency: "JPY", symbol: "¥" },
    { pattern: /(\d[\d\.,]+)\s*(krw|won|₩)\b/i, currency: "KRW", symbol: "₩" },
    { pattern: /(\d[\d\.,]+)\s*(vnd|dong|₫)\b/i, currency: "VND", symbol: "₫" },
    { pattern: /(\d[\d\.,]+)\s*(cny|yuan|rmb|renminbi)\b/i, currency: "CNY", symbol: "¥" },
    { pattern: /(\d[\d\.,]+)\s*(inr|rupee|rupees|₹)\b/i, currency: "INR", symbol: "₹" },
    { pattern: /(\d[\d\.,]+)\s*(idr|rupiah|rp)\b/i, currency: "IDR", symbol: "Rp" },
    { pattern: /(\d[\d\.,]+)\s*(php|peso|₱)\b/i, currency: "PHP", symbol: "₱" },
  ];

  for (const { pattern, currency, symbol } of amountPatterns) {
    if (pattern.test(lowerText) || pattern.test(allLines)) {
      reasons.push(`${currency} detected from amount suffix`);
      return { currency, symbol, confidence: 0.65, reasons };
    }
  }

  return { confidence: 0, reasons };
}

/**
 * Resolve currency from multiple sources
 */
export function resolveCurrency(
  ocrText: string,
  ocrLines: OCRLine[],
  detectedCountry?: string,
  placesResult?: { countryCode?: string; address_components?: any[] },
  documentType?: string,
  userCountry?: string | null,
  isAdmin?: boolean,
  countryConfig?: CountryConfig,
  gpsCountry?: string | null
): CurrencyResolution {
  const reasons: string[] = [];

  // HIGHEST PRIORITY: Country-specific tax patterns override everything
  // These are definitive indicators that trump even explicit currency mentions
  const lowerText = ocrText.toLowerCase();
  
  // Indonesia: PPN (11% VAT) OR NPWP (tax ID) OR "Indonesia" keyword with detected ID country
  const hasIndonesiaIndicators = /\bppn\b/i.test(lowerText) || 
                                 /\bnpwp\b/i.test(lowerText) || 
                                 /\bindonesia\b/i.test(lowerText);
  
  if (detectedCountry === 'ID' && hasIndonesiaIndicators) {
    reasons.push('currencyFromCountryAndTax=IDR (Indonesia with PPN/NPWP/keyword overrides all)');
    return {
      currency: 'IDR',
      symbol: 'Rp',
      confidence: 0.98, // Highest confidence - definitive indicator
      reasons,
    };
  }
  
  // Turkey: KDV is unique to Turkey
  if (detectedCountry === 'TR' && (/\bkdv\b/i.test(lowerText) || /\btopkdv\b/i.test(lowerText))) {
    reasons.push('currencyFromCountryAndTax=TRY (Turkey with KDV overrides all)');
    return {
      currency: 'TRY',
      symbol: '₺',
      confidence: 0.98,
      reasons,
    };
  }
  
  // Thailand: VAT 7% is unique to Thailand
  if (detectedCountry === 'TH' && (/\bvat\s*7%/i.test(lowerText) || /\b7%\s*vat\b/i.test(lowerText))) {
    reasons.push('currencyFromCountryAndTax=THB (Thailand with VAT 7% overrides all)');
    return {
      currency: 'THB',
      symbol: '฿',
      confidence: 0.98,
      reasons,
    };
  }

  // PRIORITY 0: OCR contains an explicit currency code (highest priority — confidence 0.95)
  // Exception: on a non-English receipt, if USD/EUR/GBP isn't literally present, OCR's foreign-currency guess is rejected → local currency wins
  const ocrResult = detectCurrencyFromOCR(ocrText, ocrLines, countryConfig);

  // Country-specific local receipt indicators
  const isTurkishReceipt =
    detectedCountry === 'TR' || /\b(saat|tarih|tckn|a101|fiş\s*no|top_am|top\s*am|kdv|topkdv|topkov|topkdy|topldv|topdv|topv|topkdi|topodv|topkda)\b/i.test(lowerText) || /\bt0pkdv\b/i.test(lowerText);
  const isMalaysianReceipt =
    detectedCountry === 'MY' || /\b(sst|ssm|resit|cukai|jumlah)\b/i.test(lowerText);
  const isThaiReceipt =
    detectedCountry === 'TH' || /[\u0E00-\u0E7F]/.test(lowerText);
  const isIndonesianReceipt =
    detectedCountry === 'ID' || /\b(npwp|ppn|pajak|struk)\b/i.test(lowerText);

  const isLocalReceipt = isTurkishReceipt || isMalaysianReceipt || isThaiReceipt || isIndonesianReceipt;
  
  // Does the currency appear as a word, not just as a symbol ($, €, £)?
  const hasExplicitForeignInText = /\b(usd|eur|euro|gbp)\b/i.test(lowerText);
  const isForeignOcrResult = ocrResult.currency === "USD" || ocrResult.currency === "EUR" || ocrResult.currency === "GBP";

  if (ocrResult.currency && ocrResult.confidence >= 0.6) {
    // If this is a local receipt and no currency word is explicitly present, ignore OCR's symbol-based currency guess ($, etc.)
    if (isLocalReceipt && !hasExplicitForeignInText && isForeignOcrResult) {
      // Fall through to Rule 1/2/5b → local currency (TRY, MYR, etc.)
    } else {
      const explicitCurrencyPatterns = [
        /\b(USD|US\s*Dollar|United\s*States\s*Dollar)\b/i,
        /\b(EUR|Euro|Euros)\b/i,
        /\b(GBP|British\s*Pound|Pound\s*Sterling)\b/i,
        /\$\s*\d+\.\d+\s*USD/i,
        /\d+\.\d+\s*USD/i,
        /\bamount\s+due.*USD/i,
        /\bdue.*USD/i,
      ];
      const hasExplicitCurrency = explicitCurrencyPatterns.some((p) => p.test(ocrText));
      
      // If it's a foreign currency (USD, EUR, GBP), require it to be explicitly written (hasExplicitCurrency).
      // If it's a local currency, high OCR confidence (>= 0.65) alone is enough to accept it.
      const isOverrideValid = isForeignOcrResult ? hasExplicitCurrency : (ocrResult.confidence >= 0.65);

      if (isOverrideValid) {
        reasons.push(`currencyFromExplicitOCR=${ocrResult.currency} (overriding country-based detection)`);
        return {
          currency: ocrResult.currency,
          symbol: ocrResult.symbol || "$",
          confidence: 0.95,
          reasons,
        };
      }
    }
  }

  // Rule 1: If placesResult returns countryCode -> use Country->Currency map (confidence 0.9)
  // Note: for regular users, USD gets rejected in the analyze route
  if (placesResult?.countryCode) {
    const countryCode = placesResult.countryCode.toUpperCase();
    const currencyMap = COUNTRY_CURRENCY_MAP[countryCode];
    if (currencyMap) {
      reasons.push(`currencyFromPlacesResult=${countryCode}->${currencyMap.currency}`);
      return {
        currency: currencyMap.currency,
        symbol: currencyMap.symbol,
        confidence: 0.9,
        reasons,
      };
    }
  }

  // Rule 2: Else if detectedCountry exists -> map to currency (confidence 0.8)
  // Note: for regular users, USD gets rejected in the analyze route
  if (detectedCountry) {
    const countryCode = detectedCountry.toUpperCase();
    const currencyMap = COUNTRY_CURRENCY_MAP[countryCode];
    if (currencyMap) {
      reasons.push(`currencyFromDetectedCountry=${countryCode}->${currencyMap.currency}`);
      return {
        currency: currencyMap.currency,
        symbol: currencyMap.symbol,
        confidence: 0.8,
        reasons,
      };
    }
  }

  // Rule 2b: country detection from GPS coordinates (fallback when there's no OCR/LLM signal)
  if (gpsCountry) {
    const countryCode = gpsCountry.toUpperCase();
    const currencyMap = COUNTRY_CURRENCY_MAP[countryCode];
    if (currencyMap) {
      reasons.push(`currencyFromGPS=${countryCode}->${currencyMap.currency}`);
      return {
        currency: currencyMap.currency,
        symbol: currencyMap.symbol,
        confidence: 0.75,
        reasons,
      };
    }
  }

  // Rule 3: OCR symbol/keyword hints (confidence 0.6) - if not already caught above
  // Note: for regular users, USD gets rejected in the analyze route
  if (ocrResult.currency) {
    return {
      currency: ocrResult.currency,
      symbol: ocrResult.symbol || "$",
      confidence: ocrResult.confidence,
      reasons: [...reasons, ...ocrResult.reasons],
    };
  }

  // Rule 4: Document type hints
  if (documentType === "INVOICE_TR" || documentType === "POS_TR_MARKET" || documentType === "POS_TR_MICRO") {
    reasons.push("currencyFromDocumentType=TR->TRY");
    return {
      currency: "TRY",
      symbol: "₺",
      confidence: 0.7,
      reasons,
    };
  }

  if (documentType === "POS_TH" || documentType === "INVOICE_TH") {
    reasons.push("currencyFromDocumentType=TH->THB");
    return {
      currency: "THB",
      symbol: "฿",
      confidence: 0.7,
      reasons,
    };
  }

  // Rule 5: Detect country from tax structure signals (NOT from plain country names)
  // Only use tax/VAT patterns that are specific to countries
  // Note: lowerText already defined above
  
  // Thailand: VAT 7% is specific to Thailand
  if (/\bvat\s*7%/i.test(lowerText) || /\b7%\s*vat\b/i.test(lowerText)) {
    reasons.push("currencyFromTaxStructure=THB (VAT 7% is Thailand-specific)");
    return {
      currency: "THB",
      symbol: "฿",
      confidence: 0.7,
      reasons,
    };
  }

  // Malaysia: GST/SST 6% is specific to Malaysia
  if (/\b(?:gst|sst)\s*(?:6|8)%/i.test(lowerText) || /\b(?:6|8)%\s*(?:gst|sst)\b/i.test(lowerText)) {
    reasons.push("currencyFromTaxStructure=MYR (GST/SST 6/8% is Malaysia-specific)");
    return {
      currency: "MYR",
      symbol: "RM",
      confidence: 0.7,
      reasons,
    };
  }

  // Singapore: GST 7% is specific to Singapore
  if (/\bgst\s*7%/i.test(lowerText) || /\b7%\s*gst\b/i.test(lowerText)) {
    reasons.push("currencyFromTaxStructure=SGD (GST 7% is Singapore-specific)");
    return {
      currency: "SGD",
      symbol: "S$",
      confidence: 0.7,
      reasons,
    };
  }

  // Turkey: KDV / TOPKDV (and OCR typos: TOPKOV, TOPKDY, TOPLDV) are specific to Turkey
  if (/\bkdv\b/i.test(lowerText) || /\btopkdv\b/i.test(lowerText) || /\btopkov\b/i.test(lowerText) || /\btopkdy\b/i.test(lowerText) || /\btopldv\b/i.test(lowerText) || /\btopdv\b/i.test(lowerText) || /\btopv\b/i.test(lowerText) || /\btopkdi\b/i.test(lowerText) || /\bt0pkdv\b/i.test(lowerText) || /\btopodv\b/i.test(lowerText) || /\btopkda\b/i.test(lowerText)) {
    reasons.push("currencyFromTaxStructure=TRY (KDV/TOPKDV is Turkey-specific)");
    return {
      currency: "TRY",
      symbol: "₺",
      confidence: 0.7,
      reasons,
    };
  }

  // Indonesia: PPN is specific to Indonesia
  if (/\bppn\b/i.test(lowerText)) {
    reasons.push("currencyFromTaxStructure=IDR (PPN is Indonesia-specific)");
    return {
      currency: "IDR",
      symbol: "Rp",
      confidence: 0.7,
      reasons,
    };
  }

  // Russia: НДС is specific to Russia
  if (/\bндс\b/i.test(lowerText)) {
    reasons.push("currencyFromTaxStructure=RUB (НДС is Russia-specific)");
    return {
      currency: "RUB",
      symbol: "₽",
      confidence: 0.7,
      reasons,
    };
  }

  // Japan: 消費税 is specific to Japan
  if (/\b消費税\b/i.test(lowerText)) {
    reasons.push("currencyFromTaxStructure=JPY (消費税 is Japan-specific)");
    return {
      currency: "JPY",
      symbol: "¥",
      confidence: 0.7,
      reasons,
    };
  }

  // South Korea: 부가세 is specific to South Korea
  if (/\b부가세\b/i.test(lowerText)) {
    reasons.push("currencyFromTaxStructure=KRW (부가세 is South Korea-specific)");
    return {
      currency: "KRW",
      symbol: "₩",
      confidence: 0.7,
      reasons,
    };
  }

  // China: 增值税 is specific to China
  if (/\b增值税\b/i.test(lowerText)) {
    reasons.push("currencyFromTaxStructure=CNY (增值税 is China-specific)");
    return {
      currency: "CNY",
      symbol: "¥",
      confidence: 0.7,
      reasons,
    };
  }

  // Rule 5b: Non-English receipt, no foreign currency → local currency
  // Turkish/other-language receipts: if USD/EUR/GBP/$/€/£ is absent, always assume local currency (TRY, etc.)
  // English receipts are checked for hints; non-English receipts default to local currency.
  const hasExplicitForeignCurrency = /\busd\b|\$\s*\d|\b(eur|euro|€)\b|\b(gbp|£)\b/i.test(lowerText);
  if (!hasExplicitForeignCurrency) {
    // Turkish receipt indicators (even if detectCountry was GENERIC)
    const hasTurkishIndicators =
      /\b(saat|tarih|tckn|a101|fiş\s*no|top_am|top\s*am)\b/i.test(lowerText) ||
      /\b(kdv|topkdv|topkov|topkdy|topldv|topdv|topv|topkdi|topodv|topkda)\b/i.test(lowerText) || /\bt0pkdv\b/i.test(lowerText);
    if (hasTurkishIndicators) {
      reasons.push("currencyFromReceiptLanguage=TRY (Turkish receipt, no USD/EUR/GBP)");
      return {
        currency: "TRY",
        symbol: "₺",
        confidence: 0.75,
        reasons,
      };
    }
    // If we have detectedCountry at this point it was already used in Rule 2; this path is for GENERIC + language hints
  }

  // Rule 6: Fallback to USD with confidence 0.2 (English receipts / unknown)
  reasons.push("currencyFallback=USD");
  return {
    currency: "USD",
    symbol: "$",
    confidence: 0.2,
    reasons,
  };
}





