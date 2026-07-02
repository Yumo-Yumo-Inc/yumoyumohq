import type { ReceiptContext } from "@/app/api/receipt/analyze/types";
import type { OCRLine } from "@/lib/receipt/types";
import { extractVATRobust } from "@/lib/extractors/robust/extract-vat-robust";
import { TR_CONFIG } from "../TR.config";

const TR_VAT_RATE_IDS = [1, 10, 18, 20] as const;

function parseTurkishLooseNumber(token: string): number | null {
  let s = (token ?? "").trim();
  if (!s) return null;

  s = s.replace(/^[bB]\s*([\d,.]+)$/, "$1");
  s = s.replace(/^8\s*([\d,.]+)$/, "$1");

  const eightPrefixMatch = s.match(/^8(\d{1,4}(?:[.,]\d{2})?)$/);
  if (eightPrefixMatch) {
    const withoutEight = eightPrefixMatch[1];
    const testValue = parseFloat(withoutEight.replace(/,/g, "."));
    const originalValue = parseFloat(s.replace(/,/g, "."));
    if (testValue > 0.01 && testValue < 10000) {
      if (originalValue > testValue * 2 || originalValue > 5000) {
        s = withoutEight;
      }
    }
  }

  s = s.replace(/\s+/g, "");
  const hasComma = s.includes(",");
  const hasDot = s.includes(".");

  if (hasComma && hasDot) {
    const lastComma = s.lastIndexOf(",");
    const lastDot = s.lastIndexOf(".");
    if (lastDot > lastComma) {
      s = s.replace(/,/g, "");
    } else {
      s = s.replace(/\./g, "");
      s = s.replace(/,/g, ".");
    }
  } else if (hasComma && !hasDot) {
    const parts = s.split(",");
    if (parts.length === 2 && parts[1].length === 2) {
      s = s.replace(/,/g, ".");
    } else {
      s = s.replace(/,/g, "");
    }
  }

  const value = parseFloat(s);
  return Number.isFinite(value) ? value : null;
}

function isRateLikeValue(value: number): boolean {
  return Number.isInteger(value) && TR_VAT_RATE_IDS.includes(value as (typeof TR_VAT_RATE_IDS)[number]);
}

function isValidTurkishVatRate(vatAmount: number, totalPaid: number): boolean {
  if (totalPaid <= 0 || vatAmount <= 0) return true;
  const impliedRate = vatAmount / (totalPaid - vatAmount);
  const validRates = [0.01, 0.10, 0.18, 0.20];
  return validRates.some((rate) => Math.abs(impliedRate - rate) < 0.02);
}

function isBlendedGroceryRate(vatAmount: number, totalPaid: number): boolean {
  if (totalPaid <= 0 || vatAmount <= 0 || vatAmount >= totalPaid) return false;
  const impliedRate = vatAmount / (totalPaid - vatAmount);
  return impliedRate >= 0.01 && impliedRate <= 0.25;
}

export interface TurkishVatCandidate {
  value: number;
  lineNo: number;
  source: "topkdv" | "kdv_pattern" | "kdv_line";
}

export function extractTurkishVATCandidates(
  ocrLines: OCRLine[],
  fullText: string
): TurkishVatCandidate[] {
  const candidates: TurkishVatCandidate[] = [];
  const seen = new Set<number>();

  const add = (value: number, lineNo: number, source: TurkishVatCandidate["source"]) => {
    if (value <= 0 || value >= 100000 || isRateLikeValue(value)) return;
    const key = Math.round(value * 100);
    if (seen.has(key)) return;
    seen.add(key);
    candidates.push({ value, lineNo, source });
  };

  const hasKdvLabel =
    /\bkdv\b|\btopkdv\b|\btopkov\b|\btop\s*kdv\b|\btop\s*kov\b|\btopkow\b|\btopkdw\b|\btoplam\s*kdv\b|\bkdv\s*toplam\b|\bpkdv\b/i.test(
      fullText
    );
  if (!hasKdvLabel) return candidates;

  for (let i = 0; i < ocrLines.length; i++) {
    const line = ocrLines[i].text;
    const isTopkdvLine =
      /TOPKDV|TOP\s*KDV|TOPKOV|TOP\s*KOV|TOPKOW|TOPKDW|PKDV/i.test(line.toUpperCase()) ||
      /\btoplam\s*kdv\b|\bkdv\s*toplam\b/i.test(line);
    if (!isTopkdvLine) continue;

    const lineNo = ocrLines[i].lineNo ?? i + 1;
    for (const numStr of line.match(/([\d,.]+)/g) || []) {
      const parsed = parseTurkishLooseNumber(numStr);
      if (parsed != null && parsed > 0.01) add(parsed, lineNo, "topkdv");
    }

    for (let look = 1; look <= 3; look++) {
      const next = ocrLines[i + look];
      if (!next) break;
      const nextNo = next.lineNo ?? i + look + 1;
      for (const numStr of next.text.match(/([\d,.]+)/g) || []) {
        const parsed = parseTurkishLooseNumber(numStr);
        if (parsed != null && parsed > 0.01) add(parsed, nextNo, "topkdv");
      }
    }
  }

  const kdvPatterns = [
    /topkdv[\s:*]+([\d,.]+)/gi,
    /top\s*kdv[\s:*]+([\d,.]+)/gi,
    /topkov[\s:*]+([\d,.]+)/gi,
    /top\s*kov[\s:*]+([\d,.]+)/gi,
    /topkow[\s:*]+([\d,.]+)/gi,
    /topkdw[\s:*]+([\d,.]+)/gi,
    /\bpkdv[\s:*]+([\d,.]+)/gi,
    /toplam\s*kdv[\s:*]+([\d,.]+)/gi,
    /kdv\s*toplam[\s:*]+([\d,.]+)/gi,
    /\bkdv[\s:*]+\*?([\d,.]+)/gi,
  ];

  for (const pattern of kdvPatterns) {
    for (const match of fullText.matchAll(pattern)) {
      if (!match[1]) continue;
      const value = parseTurkishLooseNumber(match[1]);
      if (value != null && value > 0.01) add(value, 0, "kdv_pattern");
    }
  }

  for (let i = 0; i < ocrLines.length; i++) {
    const line = ocrLines[i].text;
    const hasKdvOnLine =
      /\bkdv\b|\btopkdv\b|\btopkov\b|\btop\s*kdv\b|\btop\s*kov\b|\btopkow\b|\btopkdw\b|\btoplam\s*kdv\b|\bkdv\s*toplam\b/i.test(
        line
      );
    if (!hasKdvOnLine) continue;

    const lineNo = ocrLines[i].lineNo ?? i + 1;
    for (const numStr of line.match(/([\d,.]+)/g) || []) {
      const value = parseTurkishLooseNumber(numStr);
      if (value != null && value > 0.01) add(value, lineNo, "kdv_line");
    }

    for (let look = 1; look <= 5; look++) {
      const next = ocrLines[i + look];
      if (!next) break;
      const nextNo = next.lineNo ?? i + look + 1;
      for (const numStr of next.text.match(/([\d,.]+)/g) || []) {
        const value = parseTurkishLooseNumber(numStr);
        if (value != null && value > 0.01) add(value, nextNo, "kdv_line");
      }
    }
  }

  return candidates;
}

export async function extractTurkishVAT(
  context: ReceiptContext
): Promise<{ amount: number; rate?: number }> {
  const { ocrLines, fullText, totalPaid } = context;
  const isEfatura = !!(context as any).isEcommerceEfatura;
  const vatExtraction = extractVATRobust(ocrLines, totalPaid, TR_CONFIG);
  let vatAmount = 0;
  let vatRate: number | undefined;

  const hasKdv =
    /\bkdv\b|\btopkdv\b|\btopkov\b|\btop\s*kdv\b|\btop\s*kov\b|\btopkow\b|\btopkdw\b|\btoplam\s*kdv\b|\bkdv\s*toplam\b/i.test(
      fullText
    );

  if (hasKdv) {
    for (let i = 0; i < ocrLines.length; i++) {
      const line = ocrLines[i].text;
      const isTopkdvLine =
        line.toUpperCase().includes("TOPKDV") ||
        line.toUpperCase().includes("TOP KDV") ||
        line.toUpperCase().includes("TOPKOV") ||
        line.toUpperCase().includes("TOP KOV") ||
        line.toUpperCase().includes("TOPKOW") ||
        line.toUpperCase().includes("TOPKDW") ||
        line.toUpperCase().includes("PKDV") ||
        /\btoplam\s*kdv\b|\bkdv\s*toplam\b/i.test(line);
      if (!isTopkdvLine) continue;

      let maxKdv = 0;

      for (const numStr of line.match(/([\d,.]+)/g) || []) {
        const parsed = parseTurkishLooseNumber(numStr);
        if (parsed == null || isRateLikeValue(parsed)) continue;
        const isReasonableRange = parsed > 0.01 && parsed < 100000;
        const strictVatLtTotal = totalPaid <= 0 || parsed < totalPaid;
        const passesTotalCheck = totalPaid >= 100 && parsed < totalPaid * 0.35;
        const totalSuspicious = totalPaid < 100;
        const passesRateCheck =
          !isEfatura ||
          totalPaid < 100 ||
          isValidTurkishVatRate(parsed, totalPaid) ||
          isBlendedGroceryRate(parsed, totalPaid);
        if (isReasonableRange && strictVatLtTotal && (passesTotalCheck || totalSuspicious) && passesRateCheck) {
          if (parsed > maxKdv) {
            maxKdv = parsed;
          }
        }
      }

      if (maxKdv === 0) {
        const candidates: number[] = [];
        for (let look = 1; look <= 3; look++) {
          const nextLine = ocrLines[i + look];
          if (!nextLine) continue;
          for (const numStr of nextLine.text.match(/([\d,.]+)/g) || []) {
            const parsed = parseTurkishLooseNumber(numStr);
            if (parsed == null || isRateLikeValue(parsed)) continue;
            const isReasonableRange = parsed > 0.01 && parsed < 100000;
            const strictVatLtTotal = totalPaid <= 0 || parsed < totalPaid;
            const passesTotalCheck = totalPaid >= 100 && parsed < totalPaid * 0.35;
            const totalSuspicious = totalPaid < 100;
            const passesRateCheck =
              !isEfatura ||
              totalPaid < 100 ||
              isValidTurkishVatRate(parsed, totalPaid) ||
              isBlendedGroceryRate(parsed, totalPaid);
            if (isReasonableRange && strictVatLtTotal && (passesTotalCheck || totalSuspicious) && passesRateCheck) {
              candidates.push(parsed);
            }
          }
        }

        if (candidates.length > 0) {
          const vatLike = candidates.filter((value) => totalPaid <= 0 || value <= totalPaid * 0.25);
          maxKdv = Math.min(...(vatLike.length > 0 ? vatLike : candidates));
        }
      }

      if (maxKdv > 0) {
        vatAmount = maxKdv;
        break;
      }
    }

    if (vatAmount === 0) {
      const kdvPatterns = [
        /topkdv[\s:*]+([\d,.]+)/gi,
        /top\s*kdv[\s:*]+([\d,.]+)/gi,
        /topkov[\s:*]+([\d,.]+)/gi,
        /top\s*kov[\s:*]+([\d,.]+)/gi,
        /topkow[\s:*]+([\d,.]+)/gi,
        /topkdw[\s:*]+([\d,.]+)/gi,
        /\bpkdv[\s:*]+([\d,.]+)/gi,
        /toplam\s*kdv[\s:*]+([\d,.]+)/gi,
        /kdv\s*toplam[\s:*]+([\d,.]+)/gi,
        /\bkdv[\s:*]+\*?([\d,.]+)/gi,
        /kdv\s+\*([\d,.]+)/gi,
      ];

      const totalSuspicious = totalPaid < 100;
      for (const pattern of kdvPatterns) {
        for (const match of fullText.matchAll(pattern)) {
          if (!match[1]) continue;
          const kdvValue = parseTurkishLooseNumber(match[1]);
          if (kdvValue == null || isRateLikeValue(kdvValue)) continue;
          const valid = kdvValue > 0.1 && kdvValue < 100000;
          const strictVatLtTotal = totalPaid <= 0 || kdvValue < totalPaid;
          const passesCheck = totalSuspicious || (totalPaid > 0 && kdvValue < totalPaid * 0.35);
          const passesRateCheck =
            !isEfatura ||
            totalPaid < 100 ||
            isValidTurkishVatRate(kdvValue, totalPaid) ||
            isBlendedGroceryRate(kdvValue, totalPaid);
          if (valid && strictVatLtTotal && passesCheck && passesRateCheck) {
            vatAmount = kdvValue;
            break;
          }
        }
        if (vatAmount > 0) break;
      }
    }

    if (vatAmount === 0) {
      const kdvRateAmounts: { rate: number; amount: number }[] = [];
      const seenRates = new Set<number>();

      for (let i = 0; i < ocrLines.length; i++) {
        const lineText = ocrLines[i].text;
        const kdvRateLineMatch = lineText.match(/\bkdv\s*%\s*(\d{1,2})\b/i);
        if (!kdvRateLineMatch) continue;

        const rate = parseInt(kdvRateLineMatch[1], 10);
        if (![1, 10, 18, 20].includes(rate) || seenRates.has(rate)) continue;

        const searchLines = [lineText, ...(ocrLines[i + 1] ? [ocrLines[i + 1].text] : [])];
        for (const searchLine of searchLines) {
          for (const numStr of searchLine.match(/([\d.,]+)/g) || []) {
            const parsed = parseTurkishLooseNumber(numStr);
            if (parsed == null || isRateLikeValue(parsed) || parsed <= 0) continue;
            const upperBound = totalPaid > 0 ? totalPaid * 0.4 : 100000;
            if (parsed < upperBound) {
              kdvRateAmounts.push({ rate, amount: parsed });
              seenRates.add(rate);
              break;
            }
          }
          if (seenRates.has(rate)) break;
        }
      }

      if (kdvRateAmounts.length >= 2) {
        const totalKdv = kdvRateAmounts.reduce((sum, item) => sum + item.amount, 0);
        const isReasonable = totalKdv > 0 && (totalPaid <= 0 || totalKdv < totalPaid * 0.5);
        if (isReasonable) {
          vatAmount = totalKdv;
        }
      }
    }

    if (vatAmount === 0) {
      for (let i = 0; i < ocrLines.length; i++) {
        const lineText = ocrLines[i].text;
        const hasKdvLine =
          /\bkdv\b|\btopkdv\b|\btopkov\b|\btop\s*kdv\b|\btop\s*kov\b|\btopkow\b|\btopkdw\b|\btoplam\s*kdv\b|\bkdv\s*toplam\b|\bpkdv\b/i.test(
            lineText
          );
        if (!hasKdvLine) continue;

        const totalSuspicious = totalPaid < 100;
        for (const numStr of lineText.match(/([\d,.]+)/g) || []) {
          const value = parseTurkishLooseNumber(numStr);
          if (value == null || isRateLikeValue(value)) continue;
          const valid = value > 0.1 && value < 100000;
          const strictVatLtTotal = totalPaid <= 0 || value < totalPaid;
          const passesCheck = totalSuspicious || (totalPaid > 0 && value < totalPaid * 0.35);
          const passesRateCheck =
            !isEfatura ||
            totalPaid < 100 ||
            isValidTurkishVatRate(value, totalPaid) ||
            isBlendedGroceryRate(value, totalPaid);
          if (valid && strictVatLtTotal && passesCheck && passesRateCheck) {
            vatAmount = value;
            break;
          }
        }
        if (vatAmount > 0) break;

        for (let look = 1; look <= 5; look++) {
          const nextLine = ocrLines[i + look];
          if (!nextLine) continue;
          const numbersToTry = isEfatura
            ? (nextLine.text.match(/([\d,.]+)/g) || [])
            : (() => {
                const match = nextLine.text.match(/([\d,.]+)/);
                return match ? [match[1]] : [];
              })();

          for (const numStr of numbersToTry) {
            const value = parseTurkishLooseNumber(numStr);
            if (value == null || isRateLikeValue(value)) continue;
            const valid = value > 1 && value < 100000;
            const strictVatLtTotal = totalPaid <= 0 || value < totalPaid;
            const passesCheck = totalSuspicious || (totalPaid > 0 && value < totalPaid * 0.35);
            const passesRateCheck =
              !isEfatura ||
              totalPaid < 100 ||
              isValidTurkishVatRate(value, totalPaid) ||
              isBlendedGroceryRate(value, totalPaid);
            if (valid && strictVatLtTotal && passesCheck && passesRateCheck) {
              vatAmount = value;
              break;
            }
          }
          if (vatAmount > 0) break;
        }
        if (vatAmount > 0) break;
      }
    }
  }

  if (isEfatura && vatAmount > 0 && totalPaid > 0 && !isValidTurkishVatRate(vatAmount, totalPaid)) {
    if (!isBlendedGroceryRate(vatAmount, totalPaid)) {
      vatAmount = 0;
      vatRate = undefined;
    }
  }

  if (vatAmount > 0 && totalPaid > 0) {
    const calculatedRate = vatAmount / (totalPaid - vatAmount);
    const validRates = [0.01, 0.10, 0.18, 0.20];
    let closestRate = validRates[0];
    let minDiff = Math.abs(calculatedRate - validRates[0]);

    for (const rate of validRates) {
      const diff = Math.abs(calculatedRate - rate);
      if (diff < minDiff) {
        minDiff = diff;
        closestRate = rate;
      }
    }

    if (minDiff < 0.02) {
      vatRate = closestRate;
    }
  }

  if (vatAmount === 0 && vatExtraction.value > 0) {
    const fallbackVat = vatExtraction.value;
    if (!isRateLikeValue(fallbackVat) && !(totalPaid > 0 && fallbackVat >= totalPaid)) {
      const isRational =
        totalPaid > 0 &&
        [0.01, 0.10, 0.18, 0.20].some((rate) => Math.abs(fallbackVat / (totalPaid - fallbackVat) - rate) < 0.02);
      const hasPercent20 = /\b%20\b|% 20|\b20\s*%/.test(fullText);
      const fallbackLikelyWrong = hasPercent20 && totalPaid > 100 && fallbackVat < totalPaid * 0.03;
      if (isRational && !fallbackLikelyWrong) {
        vatAmount = fallbackVat;
        vatRate = vatExtraction.rate;
      }
    }
  }

  const isVatExempt = /\bkdv\s*den\s*istisnad[ıi]r\b|\bkdv\s*istisnas[ıi]\b/i.test(fullText);
  if (isVatExempt && vatAmount > 0) {
    vatAmount = 0;
    vatRate = 0;
  }

  if (totalPaid > 0 && vatAmount >= totalPaid) {
    vatAmount = 0;
    vatRate = undefined;
  }

  return { amount: vatAmount, rate: vatRate };
}
