import type { ReceiptContext } from "@/app/api/receipt/analyze/types";
import type { CountryAddressResult } from "../base";
import { extractAddress } from "@/lib/receipt/ocr/extract-address";

const US_STREET_PATTERN =
  /\b\d+\s+[a-z0-9 .'-]+\b(?:street|st|avenue|ave|road|rd|boulevard|blvd|drive|dr|lane|ln|highway|hwy|way|suite|ste|unit|plaza|plz|circle|ct|building|bldg)\b/i;

const US_STATE_ZIP_PATTERN =
  /\b[a-z .'-]+,\s*[a-z]{2}\s+\d{5}(?:-\d{4})?\b/i;

const US_CONTACT_PATTERN =
  /\b(?:\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}|www\.|https?:\/\/|[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,})\b/i;

export function extractUsAddress(context: ReceiptContext): CountryAddressResult {
  const candidateLines: string[] = [];
  let bestConfidence = 0;

  for (let i = 0; i < Math.min(20, context.ocrLines.length); i++) {
    const line = context.ocrLines[i].text.trim();
    if (line.length < 8 || line.length > 200) continue;

    const hasStreet = US_STREET_PATTERN.test(line);
    const hasStateZip = US_STATE_ZIP_PATTERN.test(line);
    const hasContact = US_CONTACT_PATTERN.test(line);
    if (!hasStreet && !hasStateZip) continue;

    candidateLines.push(line);
    let confidence = 0.7;
    if (hasStreet) confidence += 0.15;
    if (hasStateZip) confidence += 0.12;
    if (hasContact) confidence += 0.03;
    bestConfidence = Math.max(bestConfidence, Math.min(confidence, 0.95));

    if (candidateLines.length >= 3) break;
  }

  if (candidateLines.length > 0) {
    return {
      address: candidateLines.join(" ").trim(),
      confidence: bestConfidence || 0.78,
    };
  }

  return extractAddress(context.ocrLines);
}
