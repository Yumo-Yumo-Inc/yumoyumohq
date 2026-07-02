import type { OCRLine, TotalExtraction } from "../../receipt/types";
import type { CountryConfig } from "@/lib/country/base";
import { getCountryProfile } from "@/lib/country/registry";
import { TOTAL_STRONG_KEYS } from "@/lib/shared/constants";
import { preprocessOCRLines, extractBranchIds } from "./preprocess";
import type { BranchIdMatch } from "./preprocess";
import { generateAmountCandidates } from "./candidates";
import { scoreCandidate } from "./score-candidate";
import { round2, scoreToConfidence } from "./helpers";

export interface ExtractTotalRobustOpts {
  isPosSlip?: boolean;
}
export function extractTotalRobust(
  lines: OCRLine[],
  countryConfig?: CountryConfig,
  opts?: ExtractTotalRobustOpts
): TotalExtraction & {
  evidence?: {
    pickedLineNo: number;
    score: number;
    topCandidates: Array<{ value: number; lineNo: number; score: number; why: string[] }>;
    branchIds: BranchIdMatch[];
  };
} {
  const processedLines = preprocessOCRLines(lines);
  const branchIds = extractBranchIds(processedLines);

  let candidates = generateAmountCandidates(processedLines, countryConfig);

  const vatTotalExcludePattern =
    /kdv|topkdv|toplam\s*kdv|kdv\s*toplam|topkdw|topkdy|topldv|pkdv|(?:vat|tax)\s*\d+(?:[.,]\d+)?\s*%|\d+(?:[.,]\d+)?\s*%\s*(?:vat|tax)/i;
  candidates = candidates.filter((candidate) => {
    const { prev, current, next } = candidate.contextWindow;
    const combined = [prev, current, next].filter(Boolean).join(" ");
    return !vatTotalExcludePattern.test(combined);
  });

  const totalKeywords = countryConfig?.labels.total || TOTAL_STRONG_KEYS;
  const scoredCandidates = candidates.map((candidate) => {
    const lineIndex = processedLines.findIndex((line) => line.lineNo === candidate.lineNo);
    return scoreCandidate(
      candidate,
      processedLines,
      branchIds,
      lineIndex >= 0 ? lineIndex : 0,
      totalKeywords,
      {
        isOnlyDotCommaCandidate: candidate.isOnlyDotCommaCandidate,
        isPosSlip: opts?.isPosSlip,
        countryConfig,
      }
    );
  });

  scoredCandidates.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    if (b.lineNo !== a.lineNo) return b.lineNo - a.lineNo;
    return b.value - a.value;
  });

  let best = scoredCandidates[0];

  if (countryConfig?.code) {
    const profile = getCountryProfile(countryConfig.code);
    const strategyCandidate = profile.strategies.extractTotal?.({
      lines,
      processedLines,
      countryConfig,
      opts,
      totalKeywords,
      scoredCandidates,
      best,
    });
    if (strategyCandidate) {
      best = strategyCandidate as typeof best;
    }
  }

  const topCandidates = scoredCandidates.slice(0, 5).map((candidate) => ({
    value: round2(candidate.value),
    lineNo: candidate.lineNo,
    score: candidate.score,
    why: candidate.scoreBreakdown,
  }));

  if (!best || best.score < 10) {
    return {
      value: 0,
      confidence: 0,
      evidence: {
        pickedLineNo: -1,
        score: best?.score ?? -999,
        topCandidates,
        branchIds,
      },
    };
  }

  return {
    value: round2(best.value),
    confidence: scoreToConfidence(best.score),
    sourceLine: best.lineNo,
    evidence: {
      pickedLineNo: best.lineNo,
      score: best.score,
      topCandidates,
      branchIds,
    },
  };
}
