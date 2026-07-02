/**
 * Turkey (TR) country configuration
 * Contains all Turkey-specific patterns and settings for receipt parsing
 */

import type { CountryConfig } from "./base";

export const TR_CONFIG: CountryConfig = {
  code: "TR",

  detection: {
    countryIndicators: [
      /\bturkey\b/i,
      /\btürkiye\b/i,
      /\bkdv\b/i,
      /\btopkdv\b/i,
      /\btopkov\b/i,   // OCR misread TOPKDV (D→O)
      /\btop\s*kdv\b/i,
      /\btop\s*kov\b/i,
      /\btopkow\b/i,   // OCR misread TOPKDV (V→W)
      /\btopkdw\b/i,   // OCR misread TOPKDV (V→W)
      /\btopkdy\b/i,   // OCR misread TOPKDV (V→Y)
      /\btop\s*kdy\b/i,
      /\btopldv\b/i,   // OCR misread TOPKDV (K→L)
      /\btop\s*ldv\b/i,
      /\btopdv\b/i,    // OCR: TOPKDV (K dropped)
      /\btopv\b/i,     // OCR: TOPKDV (KD dropped)
      /\btopkdi\b/i,   // OCR: TOPKDV (V→I)
      /\bt0pkdv\b/i,   // OCR: TOPKDV (O→0)
      /\btopodv\b/i,   // OCR: TOPKDV (K→O)
      /\btopkda\b/i,   // OCR: TOPKDV (V→A)
      /\btoplam\s*kdv\b/i,
      /\bkdv\s*toplam\b/i,
      /\be-arsiv\b/i,
      /\be\s*arsiv\b/i,
      /\be-arşiv\b/i,
      /\bmersis\s+no\b/i,
      /\btic\s+sic\s+no\b/i,
      /\bfiş\s+no\b/i,
      /\bnakit\b/i,
      /\bmotorin\b/i,
      /\bpetrol\b/i,
      /\bistasyon\b/i,
      /\bdojistik\b/i,
      /\bpetrolleri\b/i,
      /\b\.ş\.\b/i,
      /\ba\.ş\.\b/i,
      // Turkish receipt labels (Saat, Tarih, TCKN, A101)
      /\bsaat\b/i,
      /\btarih\b/i,
      /\btckn\b/i,
      /\ba101\b/i,
      /\btop_am\b/i,   // OCR misread TOPLAM (L→_)
      /\btop\.am\b/i,  // OCR misread TOPLAM (L→.)
      /\btop\s*am\b/i,
      /\btopam\b/i,    // OCR: TOPLAM without space
      /\bgtoplam\b/i,  // OCR: leading G
      /\btoplah\b/i,   // OCR: TOPLAM (m→h)
      /\btoplom\b/i,   // OCR: TOPLAM (a→o)
      /\btoplarn\b/i,  // OCR: TOPLAM (m→rn)
      /\btoplan\b/i,   // OCR: TOPLAM (m→n)
      /\btop1am\b/i,   // OCR: TOPLAM (L→1)
      /\bt0plam\b/i,   // OCR: TOPLAM (o→0)
      /\btoplam\b/i,
    ],
    currencyIndicators: [
      /\b₺\b/,
      /\btl\b/i,
      /\btry\b/i,
      /\btürk\s+lirası\b/i,
      /\bkdv\b/i,
      /\btopkdv\b/i,
      /\btopkov\b/i,
      /\btopdv\b/i,
      /\btopkdi\b/i,
      /\btoplam\s*kdv\b/i,
      /\be-arsiv\b/i,
      /\be\s*arsiv\b/i,
      /\be-arşiv\b/i,
      /\bödenecek\s+toplam\b/i,
      /\bara\s+toplam\b/i,
      /\bmatrah\b/i,
      /\bmersis\s+no\b/i,
      /\btic\s+sic\s+no\b/i,
      /\bfiş\s+no\b/i,
      /\bnakit\b/i,
      /\bmotorin\b/i,
      /\bpetrol\b/i,
      /\bistasyon\b/i,
      /\bdojistik\b/i,
      /\bpetrolleri\b/i,
    ],
  },

  currency: {
    code: "TRY",
    symbol: "₺",
    keywords: ["TL", "TRY", "₺", "Türk Lirası"],
  },

  dateTime: {
    // Turkish date patterns: DD-MM-YYYY, DD/MM/YYYY, DD.MM.YYYY
    datePatterns: [
      /\b(\d{1,2})[./-](\d{1,2})[./-](\d{4})\b/,
    ],
    // International date patterns: YYYY-MM-DD, YYYY/MM/DD
    isoPatterns: [
      /\b(\d{4})[./-](\d{1,2})[./-](\d{1,2})\b/,
    ],
    // Short date patterns: DD-MM-YY, DD/MM/YY
    shortPatterns: [
      /\b(\d{1,2})[./-](\d{1,2})[./-](\d{2})\b/,
    ],
    // Time patterns: HH:MM, HH.MM, HH-MM
    timePatterns: [
      /\b([01]?\d|2[0-3])[:.]([0-5]\d)(?:[:.]([0-5]\d))?\b/,
      /\b(0?\d|1[0-2])[:.]([0-5]\d)\s*(AM|PM|am|pm|ÖÖ|ÖS|öö|ös)\b/i,
      /\b(0?\d|1[0-2])[:.]([0-5]\d)(AM|PM|am|pm)\b/i,
    ],
  },

  numberFormat: {
    decimalSeparators: [","],
    thousandSeparators: ["."],
    parseFunction: (text: string) => {
      // Turkish number format: "3.125,00" -> 3125.00
      const cleaned = text.trim();
      if (!cleaned) return null;
      // If there is a dot decimal and no comma (e.g. "69.25"), treat dot as decimal.
      if (!cleaned.includes(",") && /^\d+\.\d{2}$/.test(cleaned)) {
        const dotDecimal = parseFloat(cleaned);
        return Number.isFinite(dotDecimal) ? dotDecimal : null;
      }
      const normalized = parseFloat(cleaned.replace(/\./g, '').replace(',', '.'));
      return Number.isFinite(normalized) ? normalized : null;
    },
  },

  labels: {
    total: [
      "ödenecek tutar",
      "ödenecek toplam",
      "ödenecek kdv dahil tutar",
      "odenecek kdv dahil tutar",
      "odenecek kdv dahil tuta",
      "kdv dahil tutar",
      "kdv dahil",
      "genel toplam",
      "vergiler dahil toplam tutar",
      "vergiler dahil toplam",
      "toplam tutar",
      "fatura tutarı",
      "fiş tutarı",
      "ödenen tutar",
      "toplam",
      "top_am",
      "top.am",
      "top am",
      "topam",
      "gtoplam",
      "toplah",
      "toplom",
      "toplarn",
      "toplan",
      "top1am",
      "t0plam",
    ],
    vat: [
      "kdv",
      "kdv tutarı",
      "topkdv",
      "top kdv",
      "topkov",
      "top kov",
      "topkow",
      "topkdw",
      "topkdy",
      "top kdy",
      "topldv",
      "top ldv",
      "topdv",
      "topv",
      "topkdi",
      "topkda",
      "toplam kdv",
      "kdv toplam",
    ],
    subtotal: [
      "ara toplam",
      "matrah",
    ],
    service: [
      "servis",
      "servis ücreti",
      "hizmet",
    ],
    discount: [
      "indirim",
      "iskonto",
      "çek indirimi",
    ],
    tenderCash: [
      "nakit",
      "cash",
    ],
    tenderCard: [
      "kart",
      "kredi kartı",
      "banka kartı",
    ],
    change: [
      "para üstü",
      "üstü",
    ],
    merchantId: [
      "mersis no",
      "tic sic no",
      "vergi no",
      "vkn",
    ],
    branchId: [
      "şube",
      "branch",
    ],
  },

  vatKeywords: ["KDV", "TOPKDV", "TOPLAM KDV"],

  layoutHints: {
    rightAlignedTotals: true,
    maxBottomLines: 10,
  },
};
