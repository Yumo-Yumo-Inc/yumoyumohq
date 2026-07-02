import type { ReceiptContext } from "@/app/api/receipt/analyze/types";
import { ID_CONFIG } from "../ID.config";
import { extractVATRobust } from "@/lib/extractors/robust/extract-vat-robust";

function parseIndonesianNumber(text: string): number | null {
  if (!text) return null;

  let parsed = ID_CONFIG.numberFormat.parseFunction?.(text) ?? null;
  if (parsed !== null) {
    return parsed;
  }

  const cleaned = text.trim().replace(/\s+/g, "");
  if (cleaned.includes(",")) {
    const parts = cleaned.split(",");
    if (parts.length === 2 && parts[1].length <= 2) {
      parsed = parseFloat(cleaned.replace(",", "."));
    } else {
      parsed = parseFloat(cleaned.replace(/,/g, ""));
    }
  } else if (cleaned.includes(".")) {
    parsed = parseFloat(cleaned.replace(/\./g, ""));
  } else {
    parsed = parseFloat(cleaned);
  }

  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function collectExplicitPpnAmount(
  ocrLines: ReceiptContext["ocrLines"],
  totalPaid: number
): number | null {
  const ppnIncludedPatterns = [
    /ppn\s*(?:included|included\s+in\s+total|termasuk)/i,
    /total\s*incl\.?\s*ppn/i,
  ];

  let explicitPpnAmount: number | null = null;

  for (let i = 0; i < ocrLines.length; i++) {
    const line = ocrLines[i].text;
    const hasPpnIncludedPattern = ppnIncludedPatterns.some((pattern) => pattern.test(line));
    if (!hasPpnIncludedPattern) continue;

    const sameLinePatterns = [
      /ppn\s*(?:included|included\s+in\s+total|termasuk)[\s:]*rp\s*([\d,.]+)/i,
      /ppn\s*(?:included|included\s+in\s+total|termasuk)[\s:]+([\d,.]+)/i,
      /total\s*incl\.?\s*ppn[\s:]*rp\s*([\d,.]+)/i,
      /total\s*incl\.?\s*ppn[\s:]+([\d,.]+)/i,
      /rp\s*([\d,.]+)/i,
      /([\d,.]+)\s*rp/i,
    ];

    for (const pattern of sameLinePatterns) {
      const match = line.match(pattern);
      if (!match?.[1]) continue;
      const parsed = parseIndonesianNumber(match[1]);
      if (parsed == null || parsed < 100) continue;

      const maxReasonable = totalPaid > 10000 ? totalPaid * 0.2 : 10000;
      const minReasonable = totalPaid > 10000 ? totalPaid * 0.01 : 100;
      if (parsed <= maxReasonable && parsed >= minReasonable) {
        explicitPpnAmount = parsed;
        break;
      }
    }

    if (explicitPpnAmount != null) break;

    const candidateAmounts: Array<{ value: number; hasRp: boolean }> = [];
    for (let look = 1; look <= 5; look++) {
      const nextLine = ocrLines[i + look];
      if (!nextLine) break;
      const hasRp = /rp/i.test(nextLine.text);
      for (const match of nextLine.text.matchAll(/([\d,.]+)/g)) {
        const parsed = parseIndonesianNumber(match[1]);
        if (parsed == null || parsed < 100) continue;
        const isLikelyDateOrTime =
          parsed < 100 || (parsed < 1000 && /^\d{1,2}$/.test(match[1].replace(/[,.]/g, "")));
        if (isLikelyDateOrTime) continue;

        const maxReasonable = totalPaid > 10000 ? totalPaid * 0.2 : 10000;
        const minReasonable = totalPaid > 10000 ? totalPaid * 0.01 : 100;
        if (parsed <= maxReasonable && parsed >= minReasonable) {
          candidateAmounts.push({ value: parsed, hasRp });
        }
      }
    }

    if (candidateAmounts.length > 0) {
      candidateAmounts.sort((a, b) => {
        if (a.hasRp !== b.hasRp) return b.hasRp ? 1 : -1;
        return b.value - a.value;
      });
      explicitPpnAmount = candidateAmounts[0].value;
      break;
    }
  }

  return explicitPpnAmount;
}

export async function extractIndonesianVAT(
  context: ReceiptContext
): Promise<{ amount: number; rate?: number }> {
  const { ocrLines, fullText, totalPaid } = context;
  const hasPpnIncluded = /\b(total\s*(incl\.?|including|termasuk)\s*ppn|ppn\s*(incl\.?|included|termasuk)|total\s*incl\.?\s*ppn)\b/i.test(
    fullText
  );

  const explicitPpnAmount = collectExplicitPpnAmount(ocrLines, totalPaid);
  const vatExtraction = extractVATRobust(ocrLines, totalPaid, ID_CONFIG);
  let vatAmount = vatExtraction.value || 0;
  let vatRate = vatExtraction.rate;

  const defaultIndonesianVatRate = 0.11;
  const expectedVat = totalPaid - totalPaid / (1 + defaultIndonesianVatRate);
  const maxReasonableVat = totalPaid > 10000 ? totalPaid * 0.2 : 10000;
  const minReasonableVat = totalPaid > 10000 ? totalPaid * 0.01 : 100;

  if (vatAmount > 0 && vatAmount >= minReasonableVat && vatAmount <= maxReasonableVat) {
    const diffPercentage = Math.abs(vatAmount - expectedVat) / expectedVat * 100;
    if (diffPercentage < 20) {
      return { amount: vatAmount, rate: vatRate || defaultIndonesianVatRate };
    }
  }

  if (explicitPpnAmount != null && explicitPpnAmount > 0 && explicitPpnAmount >= 100) {
    vatRate = defaultIndonesianVatRate;
    const diffPercentage = Math.abs(explicitPpnAmount - expectedVat) / expectedVat * 100;
    vatAmount = diffPercentage < 5 ? explicitPpnAmount : expectedVat;
    return { amount: vatAmount, rate: vatRate };
  }

  if (vatAmount > 0 && vatAmount < totalPaid * 0.2 && vatAmount > totalPaid * 0.01) {
    const diffPercentage = Math.abs(vatAmount - expectedVat) / expectedVat * 100;
    if (diffPercentage < 10) {
      return { amount: vatAmount, rate: vatRate || defaultIndonesianVatRate };
    }
  }

  if (hasPpnIncluded && totalPaid > 0) {
    return { amount: expectedVat, rate: defaultIndonesianVatRate };
  }

  const vatPercentage = vatAmount > 0 ? (vatAmount / totalPaid) * 100 : 0;
  const isVatSuspicious =
    vatAmount > 0 &&
    (vatPercentage < 5 || vatPercentage > 15 || (vatAmount < 100 && totalPaid > 1000));

  if (isVatSuspicious || vatAmount === 0) {
    vatRate = defaultIndonesianVatRate;
    vatAmount = expectedVat;
  }

  return { amount: vatAmount, rate: vatRate };
}
