import type { ReceiptContext } from "@/app/api/receipt/analyze/types";
import type { CountryMerchantResult } from "../base";
import { extractMerchant } from "@/lib/receipt/ocr/extract-merchant";

const MERCHANT_TYPE_PATTERN =
  /\b(pizzeria|tavern|restaurant|burger|burgers|cafe|coffee|market|buffet|grill|pizza|kitchen|bar|longboards|express|sushi|fusion)\b/i;
const MERCHANT_IGNORE_PATTERN =
  /^(store\s*#\s*\d+|micros\s+demo\s+system|register\s+\d+|server:?|cashier:?|order[:#]|check:?|credit\s+card\s+auth)\b/i;
const MERCHANT_CONTINUATION_PATTERN =
  /^[A-Z][A-Z'&.+/-]*(?:\s+[A-Z][A-Z'&.+/-]*){0,4}$/i;

function looksLikeUsStateZipLine(text: string): boolean {
  return /\b[a-z .'-]+,\s*[a-z]{2}\s+\d{5}(?:-\d{4})?\b/i.test(text);
}

function looksLikeUsAddressOrContactLine(text: string): boolean {
  return (
    /\b\d+\s+[a-z0-9 .'-]+\b(?:street|st|avenue|ave|road|rd|boulevard|blvd|drive|dr|lane|ln|highway|hwy|way|suite|ste|unit|plaza|plz)\b/i.test(
      text
    ) ||
    /\b\d+\s+[a-z0-9 .'/-]+\b(?:expressway|expy)\b/i.test(text) ||
    /\b(?:\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}|www\.|https?:\/\/|[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,})\b/i.test(
      text
    ) ||
    looksLikeUsStateZipLine(text)
  );
}

function trimUsMerchantLine(text: string): string {
  return text
    .replace(/^welcome\s+to\s+/i, "")
    .replace(/\s*\(\d+\)\s*$/i, "")
    .replace(/\s+\d{4,}\s*$/i, "")
    .replace(/\s+\d{2,6}\b.*$/i, "")
    .replace(/\s+\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}.*$/i, "")
    .replace(/\s+[a-z .'-]+,\s*[a-z]{2}\s+\d{5}(?:-\d{4})?.*$/i, "")
    .replace(
      /\b((?:[A-Z][A-Z'&.-]*\s+){0,3}(?:BURGER|BURGERS|PIZZERIA|TAVERN|RESTAURANT|MARKET|CAFE|COFFEE|GRILL|PIZZA))\b(?:\s+[A-Z][A-Z'&.-]*){1,2}\s*$/i,
      "$1"
    )
    .trim();
}

function looksLikeMenuItemLead(text: string): boolean {
  return /^\d+\s+[a-z]/i.test(text) || /\bdraft\b/i.test(text);
}

function looksLikeMerchantContinuation(text: string): boolean {
  const trimmed = text.trim();
  return (
    trimmed.length >= 3 &&
    trimmed.length <= 30 &&
    MERCHANT_CONTINUATION_PATTERN.test(trimmed) &&
    !looksLikeUsAddressOrContactLine(trimmed) &&
    !MERCHANT_IGNORE_PATTERN.test(trimmed)
  );
}

function normalizeBrandToken(text: string): string {
  return text.replace(/[^A-Za-z]/g, "").toUpperCase();
}

function addCandidate(
  candidates: CountryMerchantResult[],
  name: string,
  confidence: number,
  sourceLine?: number
): void {
  const trimmed = trimUsMerchantLine(name);
  if (trimmed.length < 3) return;
  if (MERCHANT_IGNORE_PATTERN.test(trimmed)) return;
  candidates.push({ name: trimmed, confidence, sourceLine });
}

export function extractUsMerchant(context: ReceiptContext): CountryMerchantResult {
  const candidates: CountryMerchantResult[] = [];
  const topBrandToken = normalizeBrandToken(context.ocrLines[0]?.text ?? "");

  for (let i = 0; i < Math.min(6, context.ocrLines.length); i++) {
    const line = context.ocrLines[i].text.trim();
    const nextLine = i + 1 < context.ocrLines.length ? context.ocrLines[i + 1].text.trim() : "";

    if (looksLikeUsStateZipLine(line)) {
      continue;
    }

    const isShortTopBrandCandidate =
      i === 0 &&
      line.length >= 3 &&
      line.length <= 5 &&
      /^[A-Za-z&]+$/.test(line) &&
      looksLikeUsAddressOrContactLine(nextLine);

    if (isShortTopBrandCandidate) {
      addCandidate(candidates, line, 0.88, context.ocrLines[i].lineNo);
    }
  }

  for (let i = 0; i < Math.min(6, context.ocrLines.length); i++) {
    const line = context.ocrLines[i].text.trim();
    const prevLine = i > 0 ? context.ocrLines[i - 1].text.trim() : "";
    const nextLine = i + 1 < context.ocrLines.length ? context.ocrLines[i + 1].text.trim() : "";

    const welcomeMatch = line.match(/^welcome\s+to\s+(.+)$/i);
    if (welcomeMatch?.[1]) {
      addCandidate(candidates, welcomeMatch[1], 0.96, context.ocrLines[i].lineNo);
    }

    if (MERCHANT_IGNORE_PATTERN.test(line)) continue;
    if (looksLikeMenuItemLead(line)) continue;
    const trimmed = trimUsMerchantLine(line);
    const normalizedTrimmed = normalizeBrandToken(trimmed);

    if (
      topBrandToken &&
      i > 0 &&
      normalizedTrimmed.includes(topBrandToken) &&
      MERCHANT_TYPE_PATTERN.test(trimmed)
    ) {
      const combined = looksLikeMerchantContinuation(nextLine) ? `${trimmed} ${nextLine}` : trimmed;
      addCandidate(candidates, combined, 0.97, context.ocrLines[i].lineNo);
    }

    if (!MERCHANT_TYPE_PATTERN.test(trimmed)) continue;

    addCandidate(candidates, trimmed, 0.92, context.ocrLines[i].lineNo);

    if (
      prevLine &&
      looksLikeMerchantContinuation(prevLine) &&
      !trimmed.toLowerCase().includes(prevLine.toLowerCase())
    ) {
      addCandidate(candidates, `${prevLine} ${trimmed}`, 0.95, context.ocrLines[i - 1].lineNo);
    }

    if (
      nextLine &&
      looksLikeMerchantContinuation(nextLine) &&
      !looksLikeMenuItemLead(nextLine) &&
      !trimmed.toLowerCase().includes(nextLine.toLowerCase())
    ) {
      addCandidate(candidates, `${trimmed} ${nextLine}`, 0.94, context.ocrLines[i].lineNo);
    }
  }

  if (candidates.length > 0) {
    candidates.sort((a, b) => {
      if (b.confidence !== a.confidence) return b.confidence - a.confidence;
      const aPenalty = /[a-z]+\.[a-z]+/.test(a.name) ? 1 : 0;
      const bPenalty = /[a-z]+\.[a-z]+/.test(b.name) ? 1 : 0;
      if (aPenalty !== bPenalty) return aPenalty - bPenalty;
      return b.name.length - a.name.length;
    });
    return candidates[0];
  }

  const generic = extractMerchant(context.ocrLines, {
    isPosSlip: (context as any).documentProfile === "pos-slip" || !!(context as any).isPosSlip,
    isEfatura: false,
  });

  const trimmedName = trimUsMerchantLine(generic.name);
  if (trimmedName && trimmedName !== generic.name) {
    return {
      ...generic,
      name: trimmedName,
    };
  }

  return generic;
}
