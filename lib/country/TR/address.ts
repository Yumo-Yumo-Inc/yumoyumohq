import type { ReceiptContext } from "@/app/api/receipt/analyze/types";
import type { CountryAddressResult } from "../base";
import { containsAddressTerm, hasPrimaryAddressTerm } from "@/lib/receipt/address-whitelist";
import { extractAddress } from "@/lib/receipt/ocr/extract-address";

const TURKISH_ADDRESS_PATTERN =
  /\b(cad(?:desi)?|sok(?:ak)?|bulv(?:ar)?|mah(?:alle)?|mah\.?|plaza|merkez|avm|şube)\b/i;

const SECONDARY_ADDRESS_PATTERN =
  /\b(no\s*[:.]?\s*\d+|apt\s*[:.]?\s*\d+|kat\s*[:.]?\s*\d+|blok\s*[:.]?\s*[a-z0-9]+)\b/i;

export function extractTurkishAddress(context: ReceiptContext): CountryAddressResult {
  const candidateLines: string[] = [];
  let bestConfidence = 0;

  for (let i = 0; i < Math.min(25, context.ocrLines.length); i++) {
    const line = context.ocrLines[i].text.trim();
    if (line.length < 8 || line.length > 200) continue;

    const hasPrimary =
      TURKISH_ADDRESS_PATTERN.test(line) || (containsAddressTerm(line) && hasPrimaryAddressTerm(line));
    const hasSecondary = SECONDARY_ADDRESS_PATTERN.test(line);
    if (!hasPrimary && !hasSecondary) continue;
    if (hasSecondary && !hasPrimary) continue;

    candidateLines.push(line);
    let confidence = 0.68;
    if (hasPrimary) confidence += 0.17;
    if (hasSecondary) confidence += 0.08;
    if (containsAddressTerm(line)) confidence += 0.05;
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
