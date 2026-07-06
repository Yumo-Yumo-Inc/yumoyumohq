import { computeBonusStack } from "@/lib/receipt/reward-bonus";

describe("reward-bonus", () => {
  it("applies scan bonus on a rewarded receipt", () => {
    const result = computeBonusStack({
      rawReward: 1.96,
      firstScanOfDay: false,
      streakActive: false,
    });
    expect(result.scanBonus).toBe(75);
    expect(result.boostedReward).toBe(76.96);
  });

  it("adds first-scan-of-day bonus and streak multiplier", () => {
    const result = computeBonusStack({
      rawReward: 1.96,
      firstScanOfDay: true,
      streakActive: true,
    });
    // (1.96 + 75 + 15) × 1.1 = 101.16 — three-digit target
    expect(result.firstScanOfDayBonus).toBe(15);
    expect(result.streakMultiplier).toBe(1.1);
    expect(result.boostedReward).toBe(101.16);
  });

  it("returns zero stack when the base reward is zero", () => {
    const result = computeBonusStack({
      rawReward: 0,
      firstScanOfDay: true,
      streakActive: true,
    });
    expect(result.boostedReward).toBe(0);
    expect(result.scanBonus).toBe(0);
    expect(result.firstScanOfDayBonus).toBe(0);
    expect(result.streakMultiplier).toBe(1);
  });
});
