import type { OCRLine } from "../../receipt/types";
import type { CountryConfig } from "@/lib/country/base";
import { parseLooseNumber } from "./parse-number";
import type { AmountCandidate } from "./preprocess";

function isRepeatedShortNumberArtifact(text: string): boolean {
  const compact = text.trim().replace(/\s+/g, " ");
  const digitsOnly = compact.replace(/[^\d]/g, "");

  if (digitsOnly.length < 6 || digitsOnly.length > 12) return false;
  if (/^(\d)\1{5,}$/.test(digitsOnly)) return true;
  if (/^(\d{2,3})\1{2,}$/.test(digitsOnly)) return true;

  return /^(\d{1,2})(?:\s+\1){2,}$/.test(compact) || /^(\d{2,3})(?:[ .,-]?\1){2,}$/.test(compact);
}

export function generateAmountCandidates(lines: OCRLine[], countryConfig?: CountryConfig): AmountCandidate[] {
  const candidates: AmountCandidate[] = [];

  const multipleDotsPattern = /(\*{0,2}\d{1,3}(?:\.\d{3})+\.\d{2}\*{0,2})/g;
  const turkishFormatPattern = /(\*{0,2}\d{1,3}(?:\.\d{3})+,\d{2}\*{0,2})/g;
  const amountPattern = /(\*{0,2}\d{1,3}(?:[,\s]\d{3})*(?:[.,]\d{2})?|\*{0,2}\d+[.,]\d{2}|\*{0,2}\d+)/g;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (isRepeatedShortNumberArtifact(line.text)) {
      continue;
    }

    if (/\b\d{1,2}[./-]\d{1,2}[./-]\d{2,4}\b/.test(line.text)) {
      continue;
    }

    const matchedMultipleDots: Set<string> = new Set();

    for (const match of line.text.matchAll(turkishFormatPattern)) {
      const token = match[0];
      const hasAsteriskPrefix = /^\*/.test(token);
      const matchStart = match.index || 0;
      const matchEnd = matchStart + match[0].length;

      for (let pos = matchStart; pos < matchEnd; pos++) {
        matchedMultipleDots.add(`${i}:${pos}`);
      }

      const value = parseLooseNumber(token, countryConfig);
      if (value == null || value <= 0) continue;

      const prevLine = i > 0 ? lines[i - 1].text : "";
      const nextLine = i < lines.length - 1 ? lines[i + 1].text : "";
      candidates.push({
        value,
        lineNo: line.lineNo,
        rawText: line.text,
        matchedText: token,
        hasAsteriskPrefix,
        contextWindow: {
          prev: prevLine,
          current: line.text,
          next: nextLine,
        },
        score: 0,
        scoreBreakdown: [],
      });
    }

    for (const match of line.text.matchAll(multipleDotsPattern)) {
      const token = match[0];
      const hasAsteriskPrefix = /^\*/.test(token);
      const cleanToken = token.replace(/\*/g, "");
      const matchStart = match.index || 0;
      const matchEnd = matchStart + match[0].length;

      for (let pos = matchStart; pos < matchEnd; pos++) {
        matchedMultipleDots.add(`${i}:${pos}`);
      }

      const value = parseLooseNumber(cleanToken, countryConfig);
      if (value == null || value <= 0) continue;

      const prevLine = i > 0 ? lines[i - 1].text : "";
      const nextLine = i < lines.length - 1 ? lines[i + 1].text : "";
      candidates.push({
        value,
        lineNo: line.lineNo,
        rawText: line.text,
        matchedText: token,
        hasAsteriskPrefix,
        contextWindow: {
          prev: prevLine,
          current: line.text,
          next: nextLine,
        },
        score: 0,
        scoreBreakdown: [],
      });
    }

    for (const match of line.text.matchAll(amountPattern)) {
      const token = match[0];
      const matchStart = match.index || 0;
      const matchEnd = matchStart + token.length;

      let overlaps = false;
      for (let pos = matchStart; pos < matchEnd; pos++) {
        if (matchedMultipleDots.has(`${i}:${pos}`)) {
          overlaps = true;
          break;
        }
      }
      if (overlaps) continue;

      const hasAsteriskPrefix = /^\*/.test(token);
      const value = parseLooseNumber(token, countryConfig);
      if (value == null || value <= 0) continue;

      const prevLine = i > 0 ? lines[i - 1].text : "";
      const nextLine = i < lines.length - 1 ? lines[i + 1].text : "";
      candidates.push({
        value,
        lineNo: line.lineNo,
        rawText: line.text,
        matchedText: token,
        hasAsteriskPrefix,
        contextWindow: {
          prev: prevLine,
          current: line.text,
          next: nextLine,
        },
        score: 0,
        scoreBreakdown: [],
      });
    }
  }

  const hasDotOrComma = (text: string) => text.includes(".") || text.includes(",");
  const candidatesWithDecimal = candidates.filter(
    (candidate) => hasDotOrComma(candidate.matchedText) || hasDotOrComma(candidate.rawText)
  );
  const onlyDotCommaCandidate = candidatesWithDecimal.length === 1;

  return candidates.map((candidate) => ({
    ...candidate,
    isOnlyDotCommaCandidate:
      onlyDotCommaCandidate &&
      (hasDotOrComma(candidate.matchedText) || hasDotOrComma(candidate.rawText)),
  }));
}
