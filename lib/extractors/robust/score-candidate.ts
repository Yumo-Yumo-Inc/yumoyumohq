import type { OCRLine } from "../../receipt/types";
import type { CountryConfig } from "@/lib/country/base";
import { TOTAL_STRONG_KEYS, CURRENCY_SYMBOLS } from "@/lib/shared/constants";
import { tokenHasTwoDecimals } from "./parse-number";
import type { AmountCandidate, BranchIdMatch } from "./preprocess";

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function lineHasKeyword(line: string, keyword: string): boolean {
  return new RegExp(`\\b${escapeRegex(keyword).replace(/\s+/g, "\\s+")}\\b`, "i").test(line);
}

/** Lines containing these are loyalty/points (Maxi Puan, etc.) — not receipt total. */
const LOYALTY_PUAN_PATTERN = /maxipuan|maxi\s*puan|kazanilan\s*maxipuan|toplam\s*maxipuan/i;

export interface ScoreCandidateOpts {
  isOnlyDotCommaCandidate?: boolean;
  isPosSlip?: boolean;
  /** When set (e.g. MY), context disqualifier (-60) is skipped so footer lines with "%" / "charge" don't penalize "RM 61.50" on current line. */
  countryConfig?: CountryConfig;
}

/**
 * Score a candidate using explicit, additive rules
 */
export function scoreCandidate(
  candidate: AmountCandidate,
  lines: OCRLine[],
  branchIds: BranchIdMatch[],
  lineIndex: number,
  totalKeywords: string[] = TOTAL_STRONG_KEYS,
  opts?: ScoreCandidateOpts
): AmountCandidate {
  let score = 0;
  const breakdown: string[] = [];
  const { value, rawText, contextWindow, matchedText } = candidate;
  const isPosSlip = opts?.isPosSlip;
  const isOnlyDotCommaCandidate = candidate.isOnlyDotCommaCandidate ?? opts?.isOnlyDotCommaCandidate;

  const strongTotalKeywords = totalKeywords;
  const normalizedStrongTotalKeywords = strongTotalKeywords.map((k) => k.toLowerCase());
  const countryLabels = opts?.countryConfig?.labels;
  const tenderKeywords = [
    "cash",
    "nakit",
    "change",
    "cg",
    "para üstü",
    "parausto",
    "paraustu",
    "card",
    "kart",
    ...((countryLabels?.tenderCash ?? []).map((k) => k.toLowerCase())),
    ...((countryLabels?.tenderCard ?? []).map((k) => k.toLowerCase())),
    ...((countryLabels?.change ?? []).map((k) => k.toLowerCase())),
  ];
  const serviceKeywords = [
    "service",
    "servis",
    "tip",
    "bahşiş",
    ...((countryLabels?.service ?? []).map((k) => k.toLowerCase())),
  ];
  const totalHeaderLookback = opts?.countryConfig?.code === "US" ? 15 : 10;

  // +100: POS slip and single candidate with . or , (transaction amount)
  if (isPosSlip && isOnlyDotCommaCandidate) {
    score += 100;
    breakdown.push("+100: POS slip - single . or , amount (transaction total)");
  }

  const lowerCurrent = contextWindow.current.toLowerCase();
  const lowerPrev = contextWindow.prev.toLowerCase();
  const lowerNext = contextWindow.next.toLowerCase();
  const lowerContext = `${lowerPrev} ${lowerCurrent} ${lowerNext}`.toLowerCase();

  // -150: Amount in the loyalty/points section (e.g. TOPLAM MAXIPUAN 21.71 TL) — not the receipt total
  if (LOYALTY_PUAN_PATTERN.test(lowerContext)) {
    score -= 150;
    breakdown.push("-150: Line in loyalty/puan section (not receipt total)");
  }

  // +80: Contains strong total keywords on current line OR (current is number-only and prev has total keyword)
  const isMostlyNumberLine = /^[^a-zÃ Â¸Â-Ã Â¹â„¢]*\d+([.,]\d{1,2})?[^a-zÃ Â¸Â-Ã Â¹â„¢]*$/i.test(lowerCurrent);
  const prevHasStrong = normalizedStrongTotalKeywords.some((k) => lineHasKeyword(lowerPrev, k));
  const curHasStrong = normalizedStrongTotalKeywords.some((k) => lineHasKeyword(lowerCurrent, k));
  // Also check next line for "Grand Total :" pattern where total is on next line
  const nextHasValue = /^\d+([.,]\d{1,2})?$/.test(contextWindow.next.trim());

  // "Ödenecek tutar" ("amount due"): if the receipt carries an "ödenecek tutar" label,
  // treat the amount on that line or the following one as the total (A101, etc.).
  // Payment/card lines can appear between the label and the amount → scan back
  // 2-10 lines from the candidate line.
  const ODENECEK_TUTAR_KEYS = ["ödenecek tutar", "ödenecek toplam", "odenecek tutar", "odenecek toplam", "ödenecek kdv dahil tutar", "odenecek kdv dahil tutar"];
  const prevHasOdenecekTutar = ODENECEK_TUTAR_KEYS.some((k) => lowerPrev.includes(k));
  const curHasOdenecekTutar = ODENECEK_TUTAR_KEYS.some((k) => lowerCurrent.includes(k));
  const nextHasOdenecekTutar = ODENECEK_TUTAR_KEYS.some((k) => lowerNext.includes(k));
  let hasOdenecekTutarInPrevLines = prevHasOdenecekTutar || curHasOdenecekTutar || nextHasOdenecekTutar;
  if (!hasOdenecekTutarInPrevLines) {
    for (let j = Math.max(0, lineIndex - 10); j < lineIndex && j <= lineIndex - 2; j++) {
      const prevLineLower = (lines[j]?.text ?? "").toLowerCase();
      if (ODENECEK_TUTAR_KEYS.some((k) => prevLineLower.includes(k))) {
        hasOdenecekTutarInPrevLines = true;
        break;
      }
    }
  }
  if (hasOdenecekTutarInPrevLines) {
    score += 90;
    breakdown.push("+90: Ödenecek tutar satırı (veya önceki 10 satırda etiket)");
  }

  // The most authoritative total label, "Ödenecek KDV Dahil Tutar" ("Amount Due Incl. VAT"), gives +100 to the amount on the next line
  let hasOdenecekToplamHeader = false;
  if (!hasOdenecekTutarInPrevLines) {
    for (let j = Math.max(0, lineIndex - 3); j < lineIndex; j++) {
      const prevLineLower = (lines[j]?.text ?? "").toLowerCase();
      const hasOdenecekKey = ODENECEK_TUTAR_KEYS.some((k) => prevLineLower.includes(k));
      const prevLineHasNumbers = /\d/.test(prevLineLower);
      if (hasOdenecekKey && !prevLineHasNumbers) {
        hasOdenecekToplamHeader = true;
        break;
      }
    }
  } else if ((prevHasOdenecekTutar || curHasOdenecekTutar) && isMostlyNumberLine) {
    hasOdenecekToplamHeader = true;
  }
  if (hasOdenecekToplamHeader) {
    score += 100;
    breakdown.push("+100: Tutar 'Ödenecek KDV Dahil Tutar' başlığından sonra geliyor (en yetkili TR toplam etiketi)");
  }

  if (curHasStrong || (isMostlyNumberLine && prevHasStrong) || (curHasStrong && nextHasValue)) {
    score += 80;
    breakdown.push(`+80: Strong total keyword (current or prev-number pairing)`);
  }

  // +40: Within 3 lines of a strong total keyword line
  // +100: Turkish e-Arşiv pattern: TOPLAM header is 1-10 lines before amount
  let foundToplamInPrev = false;
  let nearStrongKeyword = false;
  
  // DEBUG: Log current line being scored
  
  for (let i = Math.max(0, lineIndex - totalHeaderLookback); i <= Math.min(lines.length - 1, lineIndex + 3); i++) {
    if (i === lineIndex) continue;
    const checkLine = lines[i].text.toLowerCase();
    const hasStrongKeyword = normalizedStrongTotalKeywords.some((k) => lineHasKeyword(checkLine, k));
    
    if (hasStrongKeyword) {
      // Check if it's a standalone header (no numbers on that line)
      const hasNumbers = /\d+([.,]\d{1,2})?/.test(checkLine);
      // "TOPLAM KDV" / "KDV TOPLAM" → a VAT summary label, not a grand-total header
      const isTotalKdvLine = /toplam\s*kdv|kdv\s*toplam/i.test(checkLine);
      
      if (!hasNumbers && i < lineIndex && (lineIndex - i) <= totalHeaderLookback) {
        // Do not treat "TOPLAM MAXIPUAN" or "TOPLAM KDV" as receipt total header
        if (!LOYALTY_PUAN_PATTERN.test(checkLine) && !isTotalKdvLine) {
          foundToplamInPrev = true;
        }
      }
      // Do not give +40 "near strong keyword" when the keyword is loyalty (e.g. TOPLAM MAXIPUAN) — ref/no lines would otherwise win over real total
      if (Math.abs(i - lineIndex) <= 3 && !LOYALTY_PUAN_PATTERN.test(checkLine)) {
        nearStrongKeyword = true;
      }
    }
  }
  
  // Same-line TOPLAM + amount (e.g. "TOPAM *272,90") — Turkish e-Arşiv; loop skips current line so we check here
  // The amount on a "TOPLAM KDV" line is a VAT amount, not the grand total — this bonus does not apply
  const curIsTotalKdvLine = /toplam\s*kdv|kdv\s*toplam/i.test(lowerCurrent);
  if (curHasStrong && !foundToplamInPrev && !curIsTotalKdvLine) {
    foundToplamInPrev = true;
  }

  if (foundToplamInPrev) {
    score += 100;
    breakdown.push(`+100: Amount found after standalone TOPLAM header (e-ArÅŸiv pattern)`);
  } else if (nearStrongKeyword) {
    score += 40;
    breakdown.push(`+40: Near strong total keyword line`);
  }
  
  // +30: Asterisk-prefixed amount (Turkish receipt convention: *43,50)
  if (candidate.hasAsteriskPrefix) {
    score += 30;
    breakdown.push(`+30: Asterisk-prefixed amount (Turkish convention)`);
  }

  // +25: Near end of receipt (last 25% lines)
  const lastQuarterStart = Math.floor(lines.length * 0.75);
  if (lineIndex >= lastQuarterStart) {
    score += 25;
    breakdown.push("+25: Near end of receipt");
  }

  // +15: Has 2 decimals (token-based, not line-based)
  if (tokenHasTwoDecimals(matchedText)) {
    score += 15;
    breakdown.push("+15: Has 2 decimal places");
  }

  // +10: Currency context found (in window)
  const currencyKeywords = [
    ...Object.keys(CURRENCY_SYMBOLS),
    ...Object.values(CURRENCY_SYMBOLS).map(c => c.toLowerCase()),
    "baht", "thb", "usd", "try", "tl", "eur", "gbp"
  ];
  if (currencyKeywords.some((k) => lowerContext.includes(k.toLowerCase()))) {
    score += 10;
    breakdown.push(`+10: Currency context`);
  }

  // DISQUALIFIERS (negative scores)
  const disqualifierKeywords = [
    "branch",
    "Ã Â¸ÂªÃ Â¸Â²Ã Â¸â€šÃ Â¸Â²",
    "tax id",
    "ref:",
    "ref ",
    "invoice",
    "receipt no",
    "tax invoice",
    "ticket #",
    "ticket:",
    "check #",
    "check:",
    "no.",
    "cashier",
    "date",
    "time",
    "tel",
    "phone",
    "password",
    "wifi",
    "qr",
    "vat:",
    "vatable",
    "%",
    // Turkish identifiers (never total amounts)
    "mersis",
    "belge no",
    "fiÅŸ no",
    "fatura no",
    "ettn",
    "z no",
    "z nj",
    "eko no",
    "ekü no",
    "eküno",
    "mf yab",
    "mf no",
    "mali cihaz",
    "cihaz no",
    "vergi no",
    "vkn",
    "tckn",
    "ÅŸube",
    "kasiyer",
    "tarih",
    "saat",
    "nakit",
    "para üstü",
    "para ustu",
    "paraustu",
    "kart",
    "kredi kart",
    "banka kart",
  ];

  // POS confirmation keywords: on current line = not the total (penalize); in context on POS slip = don't penalize
  const posConfirmationKeywords = [
    "onay kodu", "onay kod", "approval code", "rrn", "stan", "işlem no", "islem no",
  ];
  const currentLineIsPosConfirmation = posConfirmationKeywords.some((kw) => lowerCurrent.includes(kw));

  // Heavy disqualifier ONLY on current line
  const countryCode = opts?.countryConfig?.code;
  const skipContextDisqualifier = countryCode === "MY"; // MY: "RM 61.50" line often has "%" / "charge" in next line; only penalize current line

  if (disqualifierKeywords.some((kw) => lowerCurrent.includes(kw))) {
    score -= 200;
    breakdown.push(`-200: Current line contains disqualifier keyword`);
  } else if (currentLineIsPosConfirmation) {
    score -= 200;
    breakdown.push(`-200: Current line is POS approval/confirmation code`);
  } else if (!skipContextDisqualifier && !isPosSlip && disqualifierKeywords.some((kw) => lowerContext.includes(kw))) {
    score -= 60;
    breakdown.push(`-60: Context contains disqualifier keyword`);
  } else if (skipContextDisqualifier && disqualifierKeywords.some((kw) => lowerContext.includes(kw))) {
    breakdown.push(`+0: MY – context disqualifier skipped (only current-line penalty applies)`);
  } else if (
    !isPosSlip &&
    posConfirmationKeywords.some((kw) => lowerContext.includes(kw))
  ) {
    score -= 60;
    breakdown.push(`-60: Context contains POS approval code`);
  } else if (isPosSlip) {
    breakdown.push(`+0: POS slip - approval code context penalty skipped`);
  }

  // -200: Likely an identifier (integer >=4 digits, no decimals, with ID keywords)
  const isInteger = Number.isFinite(value) && value === Math.floor(value);
  const digitCount = String(Math.floor(value)).length;
  const idKeywords = ["Ã Â¸ÂªÃ Â¸Â²Ã Â¸â€šÃ Â¸Â²", "branch", "invoice", "tax", "id", "no", "date", "time"];
  const combinedIdKeywords = [...idKeywords, "ticket", "check"];
  const hasIdKeyword = combinedIdKeywords.some((kw) => lowerCurrent.includes(kw) || lowerContext.includes(kw));
  const tokenHasDecimal = /[.,]\d{1,2}\b/.test(matchedText);
  const currentLineIsTender = tenderKeywords.some((kw) => lowerCurrent.includes(kw));
  const contextLooksTender = tenderKeywords.some((kw) => lowerContext.includes(kw));

  if (isInteger && digitCount >= 4 && !tokenHasDecimal && hasIdKeyword) {
    score -= 200;
    breakdown.push(`-200: Likely identifier (${digitCount}-digit int + id keyword)`);
  }

  // -120: Tender lines: cash/change/"nakit"/"para üstü"/card ("parausto" = OCR misread of "para üstü")
  const paraUstuPattern = /para\s*[uü]st[uio]|paraust[uo]/i;
  const hasParaUstu = paraUstuPattern.test(lowerCurrent) || paraUstuPattern.test(lowerContext);
  if (
    currentLineIsTender ||
    hasParaUstu ||
    ((contextLooksTender || hasParaUstu) && !curHasStrong && !prevHasStrong)
  ) {
    score -= 120;
    breakdown.push("-120: Tender line (cash/change/nakit/para üstü/card)");
  }

  // -80: Value out of reasonable range
  if (value < 1 || value > 1_000_000) {
    score -= 80;
    breakdown.push(`-80: Out of range (${value})`);
  }

  // Branch ID match penalty (hard)
  for (const branch of branchIds) {
    if (Math.abs(value - branch.branchId) < 0.01 && !tokenHasDecimal) {
      score -= 250;
      breakdown.push(`-250: Matches branch ID ${branch.branchId} (line ${branch.lineNo})`);
    }
  }

  // Extra: Penalize obvious years (Thai Buddhist year 25xx or Gregorian 20xx) when no decimals
  if (!tokenHasDecimal && isInteger) {
    if ((value >= 2500 && value <= 2600) || (value >= 2000 && value <= 2100)) {
      score -= 180;
      breakdown.push(`-180: Looks like a year (${value})`);
    }
  }

  // Smart small value handling: Context determines if small amount is valid
  // Key insight: Small values CAN be totals if they're in the right context
  if (value < 100 && !curHasStrong && !prevHasStrong) {
    // 1. Check if this is clearly NOT a total (VAT, tender, service charge)
    const vatKeywords = ["vat", "kdv", "tax", "vergi", "topkdv"];
    const tenderKeywords = ["cash", "nakit", "change", "para üstü", "parausto", "paraustu", "card", "kart"];
    const serviceKeywords = ["service", "servis", "tip", "bahşiş"];
    
    const isVatLine = vatKeywords.some((kw) => 
      lowerCurrent.includes(kw) || lowerPrev.includes(kw)
    );
    const isTenderLine = tenderKeywords.some((kw) => 
      lowerCurrent.includes(kw) || lowerNext.includes(kw)
    );
    const isServiceLine = serviceKeywords.some((kw) => 
      lowerCurrent.includes(kw) || lowerPrev.includes(kw)
    );
    
    // 2. Check if this is clearly a TOTAL (after TOPLAM header, near end of receipt)
    const isAfterToplamHeader = foundToplamInPrev;
    const isNearEnd = lineIndex >= Math.floor(lines.length * 0.75);
    
    // 3. Apply penalties based on context
    if (isVatLine && !isAfterToplamHeader) {
      // VAT line: Heavy penalty (unless it's after TOPLAM, which could be VAT-inclusive total)
      score -= 200;
      breakdown.push(`-200: Small value (${value}) on VAT/KDV line`);
    } else if (isTenderLine) {
      // Tender line: Heavy penalty (cash/card payment, not total)
      score -= 200;
      breakdown.push(`-200: Small value (${value}) on tender line (cash/card)`);
    } else if (isServiceLine) {
      // Service charge line: Heavy penalty
      score -= 200;
      breakdown.push(`-200: Small value (${value}) on service charge line`);
    } else if (!isAfterToplamHeader && !isNearEnd) {
      // Small value in middle of receipt, not near TOPLAM: Moderate penalty
      score -= 150;
      breakdown.push(`-150: Small value (${value}) unlikely to be total (not near TOPLAM)`);
    } else if (isAfterToplamHeader && isNearEnd) {
      // After TOPLAM header AND near end: This is likely the total, NO penalty
      breakdown.push(`+0: Small value after TOPLAM header (valid total)`);
    }
  }

  // Store score
  return {
    ...candidate,
    score,
    scoreBreakdown: breakdown,
  };
}
