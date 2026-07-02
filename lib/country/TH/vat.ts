import type { ReceiptContext } from "@/app/api/receipt/analyze/types";
import { TH_CONFIG } from "../TH.config";
import { extractVATRobust } from "@/lib/extractors/robust/extract-vat-robust";

export async function extractThaiVAT(
  context: ReceiptContext
): Promise<{ amount: number; rate?: number }> {
  const { ocrLines, fullText, totalPaid } = context;
  const vatExtraction = extractVATRobust(ocrLines, totalPaid, TH_CONFIG);
  let vatAmount = vatExtraction.value || 0;
  let vatRate = vatExtraction.rate;

  const hasVatIncluded = /\bvat\s+included\b/i.test(fullText) || /\bรวมภาษี\b/i.test(fullText);
  if (hasVatIncluded && totalPaid > 0) {
    const defaultThaiVatRate = 0.07;
    const expectedVat = totalPaid - totalPaid / (1 + defaultThaiVatRate);
    const vatPercentage = vatAmount > 0 ? (vatAmount / totalPaid) * 100 : 0;

    if (vatAmount === 0 || vatPercentage < 5 || vatPercentage > 15) {
      vatRate = defaultThaiVatRate;
      vatAmount = expectedVat;
      console.log(
        `[extractThaiVAT] Recalculated VAT (VAT Included): ${vatAmount.toFixed(2)} THB (7%)`
      );
    }
  }

  return { amount: vatAmount, rate: vatRate };
}
