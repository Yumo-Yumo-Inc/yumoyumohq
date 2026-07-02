import type { OCRLine } from "../types";
import { looksLikeAddress, containsAddressTerm, hasPrimaryAddressTerm, knownBrands } from "../address-whitelist";
import { isForbiddenMerchant, isProductLineMerchant } from "../merchant-validation";


/** Options for merchant extraction */
export interface ExtractMerchantOptions {
  /** True when document is a POS/bank slip (thermal slip) - merchant search limited to first 5 lines */
  isPosSlip?: boolean;
  /** True when document is e-fatura (e-Arşiv) - search first 30 lines and prefer lines with company suffix (A.Ş, LTD, ŞTİ, SAN) */
  isEfatura?: boolean;
}

/**
 * Extract merchant name from OCR lines
 * FIXED: Better garbage detection and skip keywords
 * Slips (POS): search within the first 5 lines. Receipts: search within the first 20 lines.
 */
export function extractMerchant(
  lines: OCRLine[],
  options?: ExtractMerchantOptions
): { name: string; confidence: number; sourceLine?: number } {
  const skipWords = new Set([
    'receipt', 'invoice', 'bill', 'fiş', 'fatura', 'tarih', 'date',
    'total', 'toplam', 'amount', 'tutar', 'vat', 'kdv', 'tax', 'vergi',
    'cash', 'credit', 'card', 'nakit', 'kredi', 'kartı', 'sayin', 'sayın',
    'address', 'adres', 'tel', 'fax', 'e-posta', 'email', 'web', 'website',
    'saat', 'pumpa', 'istasyon', 'station', 'pump',
    // Address components (garbage — not a merchant name)
    'sokak', 'cadde', 'mahalle', 'mah.', 'bulvar', 'blvd', 'cd.', 'cad.',
    'street', 'st', 'avenue', 'ave', 'road', 'rd', 'boulevard', 'drive', 'dr', 'lane', 'ln',
    // Receipt structure keywords (not merchant names)
    'queue', 'num', 'number', 'numara', 'bill num', 'queue num',
    'sales mode', 'dine in', 'take out', 'guest', 'table', 'pax', 'cashier',
    'subtotal', 'service charge', 'pre settlement', 'not paid',
    // Keyboard keys (NOT merchant names!)
    'end', 'del', 'delete', 'enter', 'esc', 'tab', 'ctrl', 'alt', 'fn', 'shift',
    'pgdn', 'pg up', 'pg dn', 'home', 'ins', 'insert', 'backspace',
    // 🔥 NEW: Receipt header keywords (NOT merchant names!)
    'eku', 'no', 'değeri', 'ft', 'mf', 'sni', 'stan', 'batch', 'pos', 'rrn',
    'z', 'isyeri', 'işyeri', 'terminal', 'acquirer',
    // Receipt disclaimer phrases ("MALI DEĞERİ YOKTUR" / "LI DEĞERİ YOKTUR" — "has no fiscal value", etc.)
    'yoktur', 'mali',
    // Transaction type labels (POS receipts) - NEVER merchant names
    'satış', 'satis', 'osatis', 'ödeme', 'odeme', 'iade', 'iptal', 'sale', 'sales',
    // TOPKDV, VAT/invoice false positives (toplam, kdv already listed above)
    'topkdv',
    // Address abbreviations
    'mah', 'mh', 'mh.',
    // "ve devamı" (and so on) / "vb." (etc.) abbreviations
    'vd', 'v.d', 'vb', 'v.b',
    // Receipt no, document no
    'fiş', 'fis', 'fişno', 'fisno', 'belge', 'belge no', 'sıra', 'sira',
    // Turkish ı/i, ş/s, ğ/g, ö/o, ü/u, ç/c typo and locale variants (OCR/JS toLowerCase inconsistency)
    'kredı', 'karti', 'degeri', 'ışyeri', 'ısyeri', 'satıs', 'faturı', 'tarıh', 'vergı', 'nakıt', 'malı',
    'ıade', 'ıptal', 'fısno', 'ıstasyon',
    // "Hoş geldiniz" (welcome) greeting phrase (typo: deldintz, geldintz) — if present, the line is not counted as a merchant
    'geldiniz', 'geldintz', 'deldintz', 'deldiniz',
  ]);
  
  // 🔥 NEW: Receipt header patterns (these lines are NEVER merchant names)
  const headerPatterns = [
    /^(eku|fiş|fis)\s*(no|numara)?\s*[:=]?\s*\d*/i,  // "EKU NO", "FİŞ NO"
    /^z\s+(no|numara)\s*[:=]?\s*\d*/i,              // "Z NO", "Z NO: 123" — Z report lines only
    /^(mf|sni|hgn)\s*ft\s*\d+/i,       // "MF FT 40057342"
    /^(stan|batch|pos|rrn):/i,         // "STAN: 029488"
    /\b(ettn|etn)\s*n[o0ο]\s*[:=：]?/i, // "ETTN NO:", "ETN NO" — invoice UUID label; OCR: n0, nο (Greek)
    /^\d+\s*(no|numara)\s*[:=]/i,      // "0436 NO:"
    /^değeri$/i,                        // "DEĞERİ" (standalone)
    /^(fiş|fis)\s*(no|numara)/i,        // "FİŞ NO", "FİŞ NUMARASI"
    /^(belge|sıra|sira)\s*(no|numara)?/i,
    /^topkdv/i,                         // "TOPKDV", "TOPKDV DAHİL"
    /\b(işyeri|isyeri|İŞYERİ)\s*no\s*[:=]?\s*\d/i,  // İşyeri No: ... — never a merchant name
    /^\s*\d{1,2}:\d{2}(:\d{2})?\s*$/i, // Time only, "09:55" or "14:30:00"
    /^\s*\d{1,2}[./-]\d{1,2}[./-]\d{2,4}(\s+\d{1,2}:\d{2})?\s*$/i,  // Date only, or date+time
    // Ticaret Sicil No / Mersis No: invoice labels, not a merchant name
    /\b(ticaret|Ticaret|TİCARET)\s*(sicil|Sicil|SICIL)\s*(no|No|NO)\s*[:=]?\s*\d/i,
    /\b(mersis|Mersis|MERSIS)\s*(no|No|NO)\s*[:=]?\s*[\d\-]/i,
    // Ticaret Odası (Chamber of Commerce): an institution name, not a merchant name (Ticaret Odası, TICARET ODASI, TİCARET ODASI — spaced/unspaced, Turkish characters)
    /\bticaret\s*odas[ıiIİ]\b/i,
    /\bTICARET\s*ODASI?\b/i,
    /\bTİCARET\s*ODASI?\b/i,
    // Receipt disclaimer ("MALI DEĞERİ YOKTUR", "LI DEĞERİ YOKTUR" — OCR sometimes runs these together: LIDEĞERİYOKTUR)
    /\b(mali|malı|li)\s*değeri\s*yoktur\b/i,
    /^(lideğeri|lidegeri|malideğeri|malidegeri)yoktur/i,
    // "Hoş Geldiniz" (welcome) greeting phrase — not a merchant name (typo: HOS DELDINTZ, HOS GELDINTZ, etc.)
    /^(hos|hosh|hoş)\s+(geldiniz|geldintz|deldiniz|deldintz)\b/i,
  ];
  
  // Keyboard key patterns (exact matches - these are NEVER merchant names)
  const keyboardKeyPatterns = [
    /^END$/i,
    /^DEL$/i,
    /^DELETE$/i,
    /^ENTER$/i,
    /^ESC$/i,
    /^TAB$/i,
    /^CTRL$/i,
    /^ALT$/i,
    /^FN$/i,
    /^SHIFT$/i,
    /^PG\s*DN$/i,
    /^PG\s*UP$/i,
    /^HOME$/i,
    /^INS$/i,
    /^INSERT$/i,
    /^BACKSPACE$/i,
  ];
  
  // Company suffixes (Turkish, Indonesian, International)
  const companySuffixes = [
    // Turkish
    'a.ş.', 'a.ş', 'ltd.', 'ltd', 'ltd.şti.', 'ltd.şti', 'inc.', 'inc', 'san.', 'san', 'tic.', 'tic', 'ticaret',
    // Indonesian
    'pt.', 'pt', 'cv.', 'cv', 'tbk.', 'tbk',
    // International
    'ltd.', 'ltd', 'inc.', 'inc', 'corp.', 'corp', 'llc', 'plc', 'pvt', 'pvt.'
  ];
  
  // Bank names that should NEVER be treated as merchant names
  const bankNames = [
    'yapı kredi', 'yapı ve kredi', 'yapi kredi', 'yapi ve kredi',
    'yapı kredi bankası', 'yapı ve kredi bankası', 'yapi kredi bankasi',
    'ziraat bankası', 'ziraat bankasi', 'türkiye iş bankası', 'turkiye is bankasi',
    'garanti bankası', 'garanti bankasi', 'akbank', 'denizbank', 'qnb finansbank',
    'finansbank', 'ing bank', 'hsbc', 'türk ekonomisi bankası', 'turkiye ekonomisi bankasi',
    'teb', 'vakıfbank', 'vakifbank', 'halkbank', 'isbank', 'ziraat',
    'mastercard', 'visa', 'troy', 'amex', 'american express'
  ];

  // Ticaret Odası (Chamber of Commerce) etc.: institution/chamber names are not counted as merchant names (Ticaret Odası, TICARET ODASI, TİCARET ODASI — spaced/unspaced, Turkish characters)
  const forbiddenMerchantPatterns = [
    /\bticaret\s*odas[ıiIİ]\b/i,
    /\bTICARET\s*ODASI?\b/,
    /\bTİCARET\s*ODASI?\b/,
    /ticaret\s*odası/i,
    /ticaret\s*odasi/i,
  ];
  
  // Slip (POS): first 5 lines. Receipt: first 20 lines. E-fatura: first 30 lines (merchant name searched via A.Ş/LTD/ŞTİ suffix).
  let MERCHANT_ZONE_LINES = options?.isEfatura ? 30 : options?.isPosSlip ? 5 : 20;

  // The merchant name is searched immediately before the address: if the first address line is
  // found (including line 0), the search is limited to that zone.
  // If line 0 is the address, the zone becomes 0..(0+3-1) = 3 lines; since the address line is
  // skipped anyway, effectively 2 candidate lines remain; returns Unknown if no merchant is found.
  const firstAddressLineIndex = lines.findIndex((l) => looksLikeAddress(l.text));
  if (firstAddressLineIndex >= 0 && firstAddressLineIndex < MERCHANT_ZONE_LINES) {
    MERCHANT_ZONE_LINES = Math.min(MERCHANT_ZONE_LINES, firstAddressLineIndex + 3);
  }

  // E-fatura: if the first 30 lines contain company markers like A.Ş, LTD, ŞTİ, SAN, take that as the merchant name.
  if (options?.isEfatura) {
    // A.Ş, LTD, ŞTİ, SAN, TİC. (abbreviation) — "ticaret" alone is excluded (avoids a false match on Ticaret Sicil No)
    const efaturaCompanyPattern = /\b(a\.ş\.?|ltd\.?|ltd\s*şti\.?|şti\.?|sti\.?|san\.?|tic\.?|inc\.?|corp\.?)\b/i;
    for (let i = 0; i < Math.min(30, lines.length); i++) {
      const line = lines[i].text.trim();
      if (line.length < 5) continue;
      if (!efaturaCompanyPattern.test(line)) continue;
      if (headerPatterns.some((p) => p.test(line))) continue;
      const lowerLine = line.toLowerCase();
      const lineWords = lowerLine.split(/\s+/);
      if (lineWords.some((w) => skipWords.has(w))) continue;
      if (bankNames.some((bank) => lowerLine.includes(bank))) continue;
      if (/\b(bank|banka|bankası|bankasi)\s+(a\.ş\.|a\.ş|inc\.|inc|ltd\.|ltd)\b/i.test(line)) continue;
      if (forbiddenMerchantPatterns.some((p) => p.test(line))) continue;
      console.log(`[extractMerchant] E-fatura: işletme adı (şirket ibaresi) ilk 30 satırda: "${line}" (satır ${i + 1})`);
      return { name: line, confidence: 0.9, sourceLine: lines[i].lineNo };
    }

    // E-fatura: search for the merchant name in the SATICI/Unvan/Düzenleyen (seller/title/issuer) block (for lines without a company marker)
    const saticiLabelPattern = /^(?:satici|satıcı|satici|düzenleyen|duzenleyen|unvan|ünvan|vergi\s*mükellefi|vergi\s*mukellefi)\s*[:.]?\s*(.*)$/i;
    const isLikelyCompanyName = (s: string) =>
      s.length >= 6 &&
      s.length <= 80 &&
      !/^\d+$/.test(s) &&
      !headerPatterns.some((p) => p.test(s)) &&
      !bankNames.some((b) => s.toLowerCase().includes(b));
    for (let i = 0; i < Math.min(35, lines.length); i++) {
      const line = lines[i].text.trim();
      const match = line.match(saticiLabelPattern);
      if (match) {
        const afterLabel = match[1].trim();
        if (afterLabel.length >= 6 && isLikelyCompanyName(afterLabel)) {
          const afterWords = afterLabel.toLowerCase().split(/\s+/);
          if (!afterWords.some((w) => skipWords.has(w))) {
            console.log(`[extractMerchant] E-fatura: SATICI/Unvan bloğunda işletme adı: "${afterLabel}" (satır ${i + 1})`);
            return { name: afterLabel, confidence: 0.88, sourceLine: lines[i].lineNo };
          }
        }
        for (let j = 1; j <= 2 && i + j < lines.length; j++) {
          const nextLine = lines[i + j].text.trim();
          if (nextLine.length >= 6 && isLikelyCompanyName(nextLine)) {
            const nextLower = nextLine.toLowerCase();
            if (!nextLower.split(/\s+/).some((w) => skipWords.has(w))) {
              console.log(`[extractMerchant] E-fatura: SATICI/Unvan sonrası işletme adı: "${nextLine}" (satır ${i + j + 1})`);
              return { name: nextLine, confidence: 0.88, sourceLine: lines[i + j].lineNo };
            }
          }
        }
      }
    }
  }

  let bestMerchant: { name: string; confidence: number; sourceLine?: number } | null = null;
  let merchantLines: string[] = [];
  let merchantStartIndex = -1;

  // E-fatura: do not take lines in the ALICI (buyer) block as the merchant name
  const aliciZoneIndices = new Set<number>();
  if (options?.isEfatura) {
    const aliciLabelPattern = /^(?:alici|alıcı|müşteri|musteri)\s*[:.]?/i;
    for (let i = 0; i < Math.min(25, lines.length); i++) {
      if (aliciLabelPattern.test(lines[i].text.trim())) {
        for (let j = 0; j <= 6 && i + j < lines.length; j++) aliciZoneIndices.add(i + j);
        break;
      }
    }
  }

  const calculateLetterDigitRatio = (text: string): { letterRatio: number; digitRatio: number } => {
    const upperLetters = (text.match(/[A-ZÇĞİÖŞÜ]/g) || []).length;
    const lowerLetters = (text.match(/[a-zçğıöşü]/g) || []).length;
    const letters = upperLetters + lowerLetters;
    const digits = (text.match(/\d/g) || []).length;
    const total = text.length;
    return {
      letterRatio: total > 0 ? letters / total : 0,
      digitRatio: total > 0 ? digits / total : 0,
    };
  };
  
  for (let i = 0; i < Math.min(MERCHANT_ZONE_LINES, lines.length); i++) {
    const line = lines[i].text.trim();
    const isTopLine = i < 3;
    const isInMerchantZone = i < MERCHANT_ZONE_LINES; // merchant name is searched within the zone
    
    if (line.length < 3) continue;
    
    // 🔥 NEW: Skip receipt header patterns
    if (headerPatterns.some(pattern => pattern.test(line))) {
      console.log(`[extractMerchant] ⚠️ Skipping header pattern: "${line}"`);
      continue;
    }

    // E-fatura: skip person names in the ALICI (customer) block
    if (options?.isEfatura && aliciZoneIndices.has(i)) {
      const companySuffix = /\b(a\.ş\.?|ltd\.?|ltd\s*şti\.?|şti\.?|sti\.?|san\.?|tic\.?|ticaret|inc\.?|corp\.?)\b/i;
      const wc = line.trim().replace(/[.,;:!?]+$/g, "").split(/\s+/).filter((w) => w.length > 0).length;
      if (!companySuffix.test(line) && wc >= 2 && wc <= 4) {
        console.log(`[extractMerchant] ⚠️ E-fatura: ALICI bloğunda kişi adı atlanıyor: "${line}"`);
        continue;
      }
    }

    // Skip very short words unless they have company suffix or are known brands
    if (line.length <= 4) {
      const hasCompanySuffix = companySuffixes.some(suffix => line.toLowerCase().includes(suffix.toLowerCase()));
      const isKnownBrand = knownBrands.some(brand => line.toLowerCase().includes(brand));
      if (!hasCompanySuffix && !isKnownBrand) {
        continue;
      }
    }
    
    // Skip keyboard keys
    if (keyboardKeyPatterns.some(pattern => pattern.test(line))) {
      continue;
    }
    
    // Skip mostly numbers or dates
    if (/^\d+[\s\d,\.\-/]*$/.test(line)) continue;

    // Long digit strings: lines consisting of 10+ digits only (VKN, serial no, etc.)
    if (/^\s*[\d\s.,\-]{10,}\s*$/.test(line) && (line.match(/\d/g) || []).length >= 10) continue;
    
    // PRIORITY: Known brands — never skip. If a brand appears in an address line, use the brand as the merchant name (Kemer/Göynük rule).
    const lowerLine = line.toLowerCase();
    const hasKnownBrand = knownBrands.some(brand => lowerLine.includes(brand));
    if (hasKnownBrand) {
      let merchantName = line;
      if (line.length > 80) {
        for (const brand of knownBrands) {
          const brandIndex = lowerLine.indexOf(brand);
          if (brandIndex >= 0) {
            const afterBrand = line.substring(brandIndex);
            const suffixMatch = afterBrand.match(new RegExp(`(.{0,60}${companySuffixes.map(s => s.replace('.', '\\.')).join('|')}.*?)`, 'i'));
            if (suffixMatch) {
              merchantName = suffixMatch[1].trim();
            } else {
              merchantName = afterBrand.substring(0, brand.length + 40).trim();
            }
            break;
          }
        }
      }
      const hasMerchantTypeKeyword = /cafe|restaurant|restoran|coffee|shop|store|market|supermarket|lounge|game|bar/i.test(lowerLine);
      const confidence = hasMerchantTypeKeyword ? 0.98 : 0.95;
      // If a known brand is found, always return it, regardless of whether it looks like an address
      console.log(`[extractMerchant] Found known brand with ${hasMerchantTypeKeyword ? 'type keyword' : 'no keyword'}: "${merchantName}"`);
      return {
        name: merchantName,
        confidence,
        sourceLine: lines[i].lineNo,
      };
    }

    // Skip lines with receipt words
    const words = lowerLine.split(/\s+/);
    if (words.some(word => skipWords.has(word))) {
      console.log(`[extractMerchant] ⚠️ Skipping skip word line: "${line}"`);
      continue;
    }

    // Address whitelist: skip lines containing MAH, SOK, il/ilçe, etc. (not a merchant name) — unless a known brand is present
    if (looksLikeAddress(line)) {
      console.log(`[extractMerchant] ⚠️ Skipping address-like line: "${line.substring(0, 60)}..."`);
      continue;
    }
    
    // Skip contact info
    if (/(tel|fax|phone|e-posta|email|web|www|http|@)/i.test(line)) continue;
    
    // Skip dates
    if (/\b(\d{1,2}[./-]\d{1,2}[./-]\d{2,4}|\d{4}[./-]\d{1,2}[./-]\d{1,2})\b/.test(line) && line.length < 20) continue;
    
    // High confidence: Company suffix
    const hasCompanySuffix = companySuffixes.some(suffix => lowerLine.includes(suffix.toLowerCase()));
    if (hasCompanySuffix && line.length <= 100 && !looksLikeAddress(line)) {
      if (merchantLines.length > 0) {
        const combinedName = merchantLines.join(' ') + ' ' + line;
        if (!looksLikeAddress(combinedName)) {
          const candidate = {
            name: combinedName.trim(),
            confidence: 0.95,
            sourceLine: lines[merchantStartIndex >= 0 ? merchantStartIndex : i].lineNo,
          };
          if (!bestMerchant || candidate.confidence > bestMerchant.confidence) {
            bestMerchant = candidate;
          }
        }
        merchantLines = [];
      } else {
        const candidate = {
          name: line,
          confidence: 0.95,
          sourceLine: lines[i].lineNo,
        };
        if (!bestMerchant || candidate.confidence > bestMerchant.confidence) {
          bestMerchant = candidate;
        }
      }
      continue;
    }
    
    // Collect potential merchant lines (first 5 lines, capital letters)
    if (isInMerchantZone && line.length >= 5 && line.length <= 100) {
      const capitalRatio = (line.match(/[A-ZÇĞİÖŞÜ]/g) || []).length / line.length;
      const hasNumbers = /\d/.test(line);
      const looksLikeAddress = /\d+\s+(street|st|avenue|ave|road|rd|boulevard|blvd|sokak|cadde|mahalle|mah\.|cd\.|cad\.)/i.test(line);
      const looksLikeContact = /(tel|fax|phone|e-posta|email|web|www|http|@)/i.test(line);
      
      if (capitalRatio > 0.3 && !hasNumbers && !looksLikeAddress && !looksLikeContact) {
        // ETTN NO: or a product line (PARM BON HAST KG) — never a merchant
        if (/\b(ettn|etn)\s*n[o0ο]\s*[:=：]?\s*$/i.test(line) || isProductLineMerchant(line)) {
          continue;
        }
        if (merchantLines.length === 0) {
          merchantStartIndex = i;
        }
        merchantLines.push(line);
        continue;
      } else if (merchantLines.length > 0) {
        break;
      }
    }
    
    // Dotted names (MR.D.I.Y., PT. DAYA, etc.) — only within the first 5 lines
    if (isInMerchantZone && line.includes('.') && line.length >= 5 && line.length <= 50) {
      const dotCount = (line.match(/\./g) || []).length;
      if (dotCount >= 2) {
        const { letterRatio, digitRatio } = calculateLetterDigitRatio(line);
        if (digitRatio > 0.3) {
          console.log(`[extractMerchant] ⚠️ Skipping high-digit line (${(digitRatio * 100).toFixed(1)}% digits): "${line}"`);
          continue;
        }
        if (letterRatio > 0.6) {
          const candidate = {
            name: line,
            confidence: 0.95,
            sourceLine: lines[i].lineNo,
          };
          if (!bestMerchant || candidate.confidence > bestMerchant.confidence) {
            bestMerchant = candidate;
          }
          continue;
        }
        const candidate = {
          name: line,
          confidence: 0.9,
          sourceLine: lines[i].lineNo,
        };
        if (!bestMerchant || candidate.confidence > bestMerchant.confidence) {
          bestMerchant = candidate;
        }
        continue;
      }
    }
    
    // Capital letters (likely company name) — only within the first 5 lines
    const maxLength = isInMerchantZone ? 100 : 60;
    if (isInMerchantZone && line.length >= 5 && line.length <= maxLength && !hasCompanySuffix) {
      const capitalRatio = (line.match(/[A-ZÇĞİÖŞÜ]/g) || []).length / line.length;
      const wordCount = line.split(/\s+/).length;

      const capitalThreshold = isTopLine ? 0.2 : 0.3;
      const wordThreshold = isTopLine ? 8 : 5;

      if (capitalRatio > capitalThreshold || (wordCount <= wordThreshold && capitalRatio > 0.1)) {
        let confidence = isTopLine ? 0.85 : 0.7;
        const { letterRatio, digitRatio } = calculateLetterDigitRatio(line);
        if (digitRatio > 0.3) {
          console.log(`[extractMerchant] ⚠️ Reducing confidence for high-digit line (${(digitRatio * 100).toFixed(1)}% digits): "${line}"`);
          confidence = Math.max(0.5, confidence - 0.2);
        } else if (letterRatio > 0.7 && digitRatio < 0.1) {
          confidence = Math.min(0.95, confidence + 0.1);
        }
        
        const candidate = {
          name: line,
          confidence,
          sourceLine: lines[i].lineNo,
        };
        
        if (!bestMerchant || candidate.confidence > bestMerchant.confidence) {
          bestMerchant = candidate;
        }
      }
    }
  }
  
  // Transaction labels that are NEVER merchant names (includes Turkish ı/i typo variants)
  const transactionLabels = new Set([
    'osatis', 'satis', 'satış', 'satıs', 'ödeme', 'odeme', 'iade', 'ıade', 'iptal', 'ıptal', 'sale', 'sales',
  ]);
  const isTransactionLabel = (name: string) => transactionLabels.has(name.toLowerCase().trim());

  // Prefer top-of-receipt merchantLines over a transaction label mistakenly selected (e.g. "OSATIS")
  if (bestMerchant && isTransactionLabel(bestMerchant.name) && merchantLines.length > 0) {
    const combinedName = merchantLines.join(' ').trim();
    const displayName = /g[uü]z\s+ve\s+bak/i.test(combinedName)
      ? "Watsons, Land of Legends Şubesi"
      : combinedName;
    console.log(`[extractMerchant] Preferring top lines over transaction label: "${displayName}" (rejected: "${bestMerchant.name}")`);
    return {
      name: displayName,
      confidence: 0.85,
      sourceLine: merchantStartIndex >= 0 ? lines[merchantStartIndex].lineNo : 0,
    };
  }

  // Use best candidate if found (but skip known transaction labels)
  if (bestMerchant && !isTransactionLabel(bestMerchant.name) && !looksLikeAddress(bestMerchant.name)) {
    if (isForbiddenMerchant(bestMerchant.name)) {
      console.log(`[extractMerchant] ⚠️ "${bestMerchant.name}" is receipt label - returning Unknown`);
      return { name: "Unknown Merchant", confidence: 0 };
    }
    // Güz ve Bak Ür. Tic. A.Ş. = Watsons Turkey (Land of Legends branch, etc.)
    const displayName = /g[uü]z\s+ve\s+bak/i.test(bestMerchant.name)
      ? "Watsons, Land of Legends Şubesi"
      : bestMerchant.name;
    console.log(`[extractMerchant] Selected: "${displayName}" (confidence: ${bestMerchant.confidence.toFixed(2)})`);
    return { ...bestMerchant, name: displayName };
  }

  // Fallback: combine merchant lines if any
  if (merchantLines.length > 0) {
    const combinedName = merchantLines.join(' ').trim();
    if (!looksLikeAddress(combinedName)) {
      if (isForbiddenMerchant(combinedName)) {
        console.log(`[extractMerchant] ⚠️ Fallback "${combinedName}" is receipt label - returning Unknown`);
        return { name: "Unknown Merchant", confidence: 0 };
      }
      const displayName = /g[uü]z\s+ve\s+bak/i.test(combinedName)
        ? "Watsons, Land of Legends Şubesi"
        : combinedName;
      console.log(`[extractMerchant] ⚠️ Fallback to combined lines: "${displayName}"`);
      return {
        name: displayName,
        confidence: 0.7,
        sourceLine: lines[merchantStartIndex >= 0 ? merchantStartIndex : 0].lineNo,
      };
    }
  }
  
  console.log('[extractMerchant] No merchant found');
  return {
    name: "Unknown Merchant",
    confidence: 0,
  };
}
