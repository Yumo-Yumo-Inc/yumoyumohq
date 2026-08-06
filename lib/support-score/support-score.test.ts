import { describe, expect, it } from "vitest";
import { computeSupportGrossScore } from "@/lib/support-score/compute-gross";
import {
  supportEventPoints,
  supportFairScore,
  supportIntegrityRatio,
  supportNetScore,
  supportTimeWeight,
} from "@/config/support-score";

describe("supportTimeWeight", () => {
  it("returns 1 at age 0", () => {
    expect(supportTimeWeight(0, 90)).toBe(1);
  });
});

describe("computeSupportGrossScore", () => {
  it("weights discovery above dampened airdrop core", () => {
    const result = computeSupportGrossScore({
      contributionPoints: 10000,
      distinctMerchants: 50,
      receiptCount: 200,
      discoveryPoints: 5000,
      otherBonusPoints: 100,
    });
    expect(result.discoveryScore).toBe(5000);
    expect(result.airdropCoreWeighted).toBeLessThan(result.discoveryScore);
    expect(result.grossScore).toBeCloseTo(
      result.discoveryScore + result.otherBonusScore + result.airdropCoreWeighted,
      2
    );
  });
});

describe("supportNetScore", () => {
  it("subtracts penalties without going negative", () => {
    expect(supportNetScore(100, 30)).toBe(70);
    expect(supportNetScore(10, 50)).toBe(0);
  });
});

describe("supportIntegrityRatio", () => {
  it("drops when penalties rise", () => {
    expect(supportIntegrityRatio(1000, 0)).toBeGreaterThan(supportIntegrityRatio(1000, 500));
  });
});

describe("supportFairScore", () => {
  it("reduces score for longer tenure", () => {
    expect(supportFairScore(1000, 10)).toBeGreaterThan(supportFairScore(1000, 200));
  });
});

describe("supportEventPoints", () => {
  it("applies decay when enabled", () => {
    expect(supportEventPoints(50, 90, { useDecay: true, halfLifeDays: 90 })).toBeCloseTo(25);
  });
});
