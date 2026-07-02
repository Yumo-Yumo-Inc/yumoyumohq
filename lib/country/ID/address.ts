import type { ReceiptContext } from "@/app/api/receipt/analyze/types";
import type { CountryAddressResult } from "../base";
import { extractAddress } from "@/lib/receipt/ocr/extract-address";

const INDONESIAN_ADDRESS_PATTERN =
  /\b(jl\.?|jalan|kecamatan|kabupaten|desa|kelurahan|rt\s*\/?\s*rw|gang|gg\.?|perumahan|komplek|blok\s+[a-z]|lantai|lt\.?)\b/i;

const POSTAL_CODE_PATTERN = /\b\d{5}\b/;

export function extractIndonesianAddress(context: ReceiptContext): CountryAddressResult {
  const candidateLines: string[] = [];
  let bestConfidence = 0;

  for (let i = 0; i < Math.min(35, context.ocrLines.length); i++) {
    const line = context.ocrLines[i].text.trim();
    if (line.length < 8 || line.length > 200) continue;
    if (!INDONESIAN_ADDRESS_PATTERN.test(line) && !POSTAL_CODE_PATTERN.test(line)) continue;

    candidateLines.push(line);
    let confidence = 0.7;
    if (INDONESIAN_ADDRESS_PATTERN.test(line)) confidence += 0.15;
    if (POSTAL_CODE_PATTERN.test(line)) confidence += 0.1;
    if (/\b(jalan|jl\.)\b/i.test(line)) confidence += 0.05;
    bestConfidence = Math.max(bestConfidence, Math.min(confidence, 0.95));

    if (candidateLines.length >= 3) break;
  }

  if (candidateLines.length > 0) {
    return {
      address: candidateLines.join(" ").trim(),
      confidence: bestConfidence || 0.75,
    };
  }

  return extractAddress(context.ocrLines);
}
