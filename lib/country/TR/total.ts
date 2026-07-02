import type {
  CountryTotalStrategyCandidate,
  CountryTotalStrategyInput,
} from "../base";
import { parseLooseNumber } from "@/lib/extractors/robust/parse-number";

function parseTopkdvFromLines(lines: CountryTotalStrategyInput["processedLines"]): number | null {
  const topkdvHeader =
    /topkdv|top\s*kdv|topkov|top\s*kov|topkow|topkdw|topkdy|top\s*kdy|topldv|top\s*ldv|topdv|topv|topkdi|t0pkdv|topodv|topkda|toplam\s*kdv|kdv\s*toplam|pkdv|p\s*kdv/i;

  for (let i = 0; i < lines.length; i++) {
    if (!topkdvHeader.test(lines[i].text)) continue;

    const sameLine = lines[i].text.match(/\*?\s*(\d{1,3}(?:[.,]\d{3})*[.,]\d{2}|\d+[.,]\d{2})/);
    if (sameLine?.[1]) {
      const value = parseLooseNumber(sameLine[1], undefined);
      if (value != null && value > 0.5 && value < 100000) return value;
    }

    if (i + 1 < lines.length) {
      const nextLine = lines[i + 1].text;
      const match = nextLine.match(/\*?\s*(\d{1,3}(?:[.,]\d{3})*[.,]\d{2}|\d+[.,]\d{2})/);
      if (match?.[1]) {
        const value = parseLooseNumber(match[1], undefined);
        if (value != null && value > 0.5 && value < 100000) return value;
      }
    }
  }

  return null;
}

export function selectTurkishTotalCandidate(
  input: CountryTotalStrategyInput
): CountryTotalStrategyCandidate | null {
  const { processedLines, scoredCandidates, best } = input;
  if (!best || scoredCandidates.length <= 1) {
    return best ?? null;
  }

  const topkdvAmount = parseTopkdvFromLines(processedLines);
  if (topkdvAmount == null || topkdvAmount <= 0.5) {
    return best;
  }

  const expectedTotals = [
    topkdvAmount * 101,
    topkdvAmount * 11,
    topkdvAmount * (1 + 1 / 0.18),
    topkdvAmount * 6,
  ];
  const tolerance = Math.max(50, topkdvAmount * 0.5);

  let bestFit: CountryTotalStrategyCandidate | null = null;
  let bestDiff = Infinity;

  for (const candidate of scoredCandidates.slice(0, 8)) {
    if (candidate.score < 20) continue;
    const diff = Math.min(...expectedTotals.map((expected) => Math.abs(candidate.value - expected)));
    if (diff <= tolerance && diff < bestDiff) {
      bestDiff = diff;
      bestFit = candidate;
    }
  }

  return bestFit ?? best;
}
