/**
 * Decides whether a merchant_name value is a real business name (so it can appear
 * in the insights "top places" list) or junk that the receipt LLM sometimes
 * writes into merchant_name: placeholders, error notes, prompt echoes, generic
 * category words, bank/POS provider names, and field-label prefixes.
 *
 * Examples of junk seen in real data:
 *   "[Satıcı adı yok — kullanıcı doldurmalı]", "[Unknown physical_receipt]",
 *   "[Görsel analiz hatası — kullanıcı doldurmalı]", "İşte fiş üzerinde yazan…",
 *   "İşletme Adı: Belirtilmemiş…", "İşletme Bilgileri:", "Restoran", "Diğer",
 *   "TEB", "İş Bankası", "QNB BANK A.Ş.", "VakıfBank", "GİB".
 *
 * Conservative: only drops clear non-business rows. A normal store name with a
 * legal suffix (e.g. "ÇAĞRI MAĞAZACILIK A.Ş.") is KEPT — it is a real merchant.
 */

function fold(value: string | null | undefined): string {
  return (value || "")
    .toLowerCase()
    .replace(/ı/g, "i").replace(/İ/g, "i").replace(/i̇/g, "i")
    .replace(/ş/g, "s").replace(/ğ/g, "g").replace(/ü/g, "u")
    .replace(/ö/g, "o").replace(/ç/g, "c")
    .replace(/\s+/g, " ")
    .trim();
}

// Exact-match generic/junk names (folded). Not a business name.
const EXACT_JUNK = new Set<string>([
  "diger", "diğer", "other",
  "restoran", "restaurant", "kafe", "cafe", "market", "eczane", "yakit",
  "bilinmeyen", "unknown", "n/a", "na", "-",
  "bilgi fis", "bilği fiş", "gib",
]);

// Bank / POS provider names — come from the receipt header, not a merchant.
const BANK_KEYWORDS = [
  "is bankasi", "isbank", "turkiye is bankasi", "teb", "qnb", "vakifbank",
  "ziraat", "garanti", "akbank", "yapi kredi", "yapikredi", "halkbank",
  "denizbank", "ing bank", "finansbank", "kuveyt turk", "albaraka",
  "pos cihazi", "pos terminal", "pos provider", "uye isyeri",
];

// Junk indicator patterns — if the folded name contains one of these, it isn't a business.
const JUNK_CONTAINS = [
  "isletme adi", "isletme bilgileri", "satici adi yok", "satici adi belirtilmemis",
  "kullanici doldurmali", "gorsel analiz hatasi", "iste fis uzerinde",
  "belirtilmemis", "yer almamaktadir", "kesilmistir",
  "unknown ", "tab]", "_receipt", "_invoice", "_ticket",
];

export function isJunkMerchantName(name: string | null | undefined): boolean {
  const raw = (name || "").trim();
  if (!raw) return true;

  // Placeholder starting with a square bracket: "[Satıcı adı yok…]", "[Unknown…]".
  if (raw.startsWith("[")) return true;

  const f = fold(raw);
  if (!f) return true;

  if (EXACT_JUNK.has(f)) return true;

  for (const k of JUNK_CONTAINS) {
    if (f.includes(k)) return true;
  }

  // Bank/POS: drop if the name matches or starts with a bank name. (A normal
  // business with "bank" in its name is rare; prefix matching is safe.)
  for (const b of BANK_KEYWORDS) {
    if (f === b || f.startsWith(b + " ") || f.startsWith(b)) {
      // exact/prefix match, e.g. "isbank"
      if (f === b || f.startsWith(b)) return true;
    }
  }

  // Field label ending in a colon ("İşletme Bilgileri:") — a description, not a name.
  if (raw.endsWith(":")) return true;

  return false;
}


// Legal suffix and generic business/company words (folded) — dropped from the grouping key.
const LEGAL_NOISE = new Set<string>([
  "a", "s", "as", "ltd", "sti", "limited", "sirketi", "anonim",
  "ticaret", "tic", "sanayi", "san", "ve", "kozmetik", "elektronik", "lojistik",
  "pazarlama", "gida", "turizm", "tur", "tekstil", "insaat", "ins", "hizmetleri",
  "hiz", "magazacilik", "mag", "uretim", "dis", "ic", "nakliyat", "nak", "otomotiv",
  "oto", "grup", "group", "holding", "company", "co", "inc", "gmbh",
]);

/**
 * Returns a normalized grouping key so different spellings/legal forms of the
 * SAME business collapse together:
 *   "SEVIL", "SEVİL PARFÜMERİ KOZMETİK TİCARET VE SANAYİ A.Ş.",
 *   "SEVIL PARFUMERI KOZMETIK TICARET VE SANAYI A.S." -> "sevil parfumeri".
 * Method: fold, strip punctuation, drop legal/generic words, keep first up-to-2
 * meaningful tokens. Single-token names still group with their longer forms.
 */
export function merchantGroupKey(name: string | null | undefined): string {
  const f = fold(name).replace(/[^a-z0-9 ]+/g, " ").replace(/\s+/g, " ").trim();
  if (!f) return "";
  const tokens = f.split(" ").filter((tk) => tk && !LEGAL_NOISE.has(tk));
  if (tokens.length === 0) return f;
  return tokens.slice(0, 2).join(" ");
}
