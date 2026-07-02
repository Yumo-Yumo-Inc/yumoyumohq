import type { ReceiptContext } from "@/app/api/receipt/analyze/types";
import { MY_CONFIG } from "../MY.config";
import { extractVATRobust } from "@/lib/extractors/robust/extract-vat-robust";

const MY_SST_MAX_RATIO = 0.1;
const MY_SST_RATE = 0.06;

function findExplicitMalaysiaSSTAmount(
  ocrLines: { text: string }[],
  totalPaid: number
): number | null {
  const maxSST = totalPaid * MY_SST_MAX_RATIO;
  const isReasonableSST = (value: number) => Number.isFinite(value) && value > 0 && value <= maxSST;

  for (let i = 0; i < ocrLines.length; i++) {
    const line = (ocrLines[i].text || "").trim();
    if (/\bsst\s*\(?\s*inclu?\s*6\s*%|sst\s+6\s*%\s*\(?\s*inc\.?/i.test(line)) {
      const sameLine = line.match(/(?:sst|amount|tax)[\s:]*(\d+[.,]\d{2})/i);
      if (sameLine) {
        const value = parseFloat(sameLine[1].replace(",", "."));
        if (isReasonableSST(value)) return value;
      }

      for (let j = 1; j <= 5 && i + j < ocrLines.length; j++) {
        const next = (ocrLines[i + j].text || "").trim();
        const match = next.match(/(\d+[.,]\d{2})/);
        if (match) {
          const value = parseFloat(match[1].replace(",", "."));
          if (isReasonableSST(value)) return value;
        }
      }
    }

    const amountMatch = line.match(/\bamount\s+(\d+[.,]\d{2})/i);
    if (amountMatch) {
      const value = parseFloat(amountMatch[1].replace(",", "."));
      if (isReasonableSST(value)) return value;
    }
  }

  return null;
}

export async function extractMalaysiaSST(
  context: ReceiptContext
): Promise<{ amount: number; rate?: number }> {
  const totalPaid = context.totalPaid || 0;
  const explicitSST = findExplicitMalaysiaSSTAmount(context.ocrLines, totalPaid);
  if (explicitSST != null) {
    console.log(`[extractMalaysiaSST] Using explicit SST amount: ${explicitSST.toFixed(2)} MYR`);
    return { amount: explicitSST, rate: MY_SST_RATE };
  }

  const vatExtraction = extractVATRobust(context.ocrLines, totalPaid, MY_CONFIG);
  let amount = vatExtraction.value || 0;
  let rate = vatExtraction.rate ?? MY_SST_RATE;

  const expectedSST =
    totalPaid > 0 ? Math.round((totalPaid - totalPaid / (1 + MY_SST_RATE)) * 100) / 100 : 0;
  const maxSST = totalPaid * MY_SST_MAX_RATIO;

  if (amount > maxSST || amount <= 0 || !Number.isFinite(amount)) {
    amount = expectedSST;
    rate = MY_SST_RATE;
  } else if (Math.abs(amount - expectedSST) > 0.5 && amount > expectedSST * 1.5) {
    amount = expectedSST;
  }

  let serviceCharge = 0;
  const serviceLabels = /\b(?:service\s+charge|service\s+fee)\b/i;
  for (const line of context.ocrLines) {
    if (!serviceLabels.test(line.text || "")) continue;
    const match = (line.text || "").match(/(?:RM\s*)?([\d,]+\.?\d*)/);
    if (!match) continue;
    const parsed = parseFloat(match[1].replace(/,/g, ""));
    if (Number.isFinite(parsed) && parsed > 0 && parsed < (context.totalPaid || 0)) {
      serviceCharge = parsed;
      break;
    }
  }

  if (serviceCharge > 0) {
    (context as any).serviceCharge = serviceCharge;
  }

  return { amount, rate };
}
