import type { ReceiptContext } from "@/app/api/receipt/analyze/types";
import type { CountryMerchantResult, CountryTemplateTotalsInput } from "../base";
import { extractMerchant } from "@/lib/receipt/ocr/extract-merchant";

const KNOWN_INVOICE_URLS: { pattern: RegExp; merchant: string }[] = [
  { pattern: /fatura\.a101\.com\.tr/i, merchant: "A101" },
  { pattern: /fatura\.bim\.com\.tr/i, merchant: "BIM" },
  { pattern: /www\.a101\.com\.tr/i, merchant: "A101" },
  { pattern: /www\.bim\.com\.tr/i, merchant: "BIM" },
];

function extractTrMerchantVkn(fullText: string): string | null {
  const patterns = [
    /\bV\.?K\.?N\.?\s*[:=]?\s*(\d{10})\b/i,
    /\bVDM\s+(\d{10})\b/i,
    /\bV\.D\.\s*(?:No\.?\s*)?(\d{10})\b/i,
  ];

  for (const pattern of patterns) {
    const match = fullText.match(pattern);
    if (match) return match[1];
  }

  return null;
}

function isRationalTrVatPair(total: number, vat: number): boolean {
  if (total <= 0) return false;
  if (vat <= 0) return true;

  const impliedRate = vat / (total - vat);
  const validRates = [0.01, 0.10, 0.18, 0.20];
  return validRates.some((rate) => Math.abs(impliedRate - rate) < 0.02);
}

export function extractTurkishMerchant(context: ReceiptContext): CountryMerchantResult {
  const fullText = context.fullText || "";
  for (const { pattern, merchant } of KNOWN_INVOICE_URLS) {
    if (pattern.test(fullText)) {
      return {
        name: merchant,
        confidence: 0.95,
      };
    }
  }

  const documentProfile = (context as any).documentProfile;
  return extractMerchant(context.ocrLines, {
    isPosSlip: documentProfile === "pos-slip" || !!(context as any).isPosSlip,
    isEfatura: documentProfile === "efatura" || !!(context as any).isEcommerceEfatura,
  });
}

export function shouldUseTurkishTemplateTotalVat(
  context: ReceiptContext,
  template: CountryTemplateTotalsInput
): boolean {
  const documentProfile = (context as any).documentProfile;
  return documentProfile === "efatura" && isRationalTrVatPair(template.total, template.vat);
}

export function postProcessTurkishExtraction(context: ReceiptContext): void {
  if (!context.merchantTaxId) {
    const vkn = extractTrMerchantVkn(context.fullText);
    if (vkn) {
      context.merchantTaxId = vkn;
      console.log(`[postProcessTurkishExtraction] TR VKN extracted: ${vkn}`);
    }
  }
}
