import type { ReceiptContext } from "@/app/api/receipt/analyze/types";
import type { CountryMerchantResult } from "../base";
import { extractMerchant } from "@/lib/receipt/ocr/extract-merchant";

const INDONESIAN_COMPANY_LINE =
  /\b(?:pt\.?|cv\.?|tbk\.?|ud\.?|koperasi)\b/i;

const INDONESIAN_ADDRESS_HINT =
  /\b(?:jalan|jl\.?|kecamatan|kabupaten|desa|kelurahan|rt\s*\/?\s*rw|gang|gg\.?)\b/i;

export function extractIndonesianMerchant(context: ReceiptContext): CountryMerchantResult {
  for (let i = 0; i < Math.min(15, context.ocrLines.length); i++) {
    const line = context.ocrLines[i].text.trim();
    if (line.length < 5 || line.length > 100) continue;
    if (!INDONESIAN_COMPANY_LINE.test(line)) continue;
    if (INDONESIAN_ADDRESS_HINT.test(line)) continue;

    return {
      name: line,
      confidence: 0.92,
      sourceLine: context.ocrLines[i].lineNo,
    };
  }

  return extractMerchant(context.ocrLines, {
    isPosSlip: (context as any).documentProfile === "pos-slip" || !!(context as any).isPosSlip,
    isEfatura: false,
  });
}
