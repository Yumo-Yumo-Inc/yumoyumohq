import { computeBonusStack, getItemizedMultiplier } from "@/lib/receipt/reward-bonus";

describe("reward-bonus", () => {
  it("applies scan bonus on a rewarded receipt", () => {
    const result = computeBonusStack({
      rawReward: 1.96,
      firstScanOfDay: false,
      streakActive: false,
      itemized: false,
    });
    expect(result.scanBonus).toBe(75);
    expect(result.boostedReward).toBe(76.96);
  });

  it("adds first-scan-of-day bonus and streak multiplier", () => {
    const result = computeBonusStack({
      rawReward: 1.96,
      firstScanOfDay: true,
      streakActive: true,
      itemized: false,
    });
    // (1.96 + 75 + 15) × 1.1 = 101.16 — three-digit target
    expect(result.firstScanOfDayBonus).toBe(15);
    expect(result.streakMultiplier).toBe(1.1);
    expect(result.boostedReward).toBe(101.16);
  });

  it("applies the itemized multiplier when the document proves its items", () => {
    const base = computeBonusStack({
      rawReward: 1.96,
      firstScanOfDay: false,
      streakActive: false,
      itemized: false,
    });
    const itemized = computeBonusStack({
      rawReward: 1.96,
      firstScanOfDay: false,
      streakActive: false,
      itemized: true,
    });
    const multiplier = getItemizedMultiplier();
    expect(itemized.itemizedMultiplier).toBe(multiplier);
    expect(base.itemizedMultiplier).toBe(1);
    expect(itemized.boostedReward).toBe(
      Math.round(base.boostedReward * multiplier * 100) / 100
    );
  });

  it("maps inflation percent into the [1.0, 2.0] CPI band", async () => {
    const { cpiMultiplierFromInflationPercent } = await import("@/lib/receipt/reward-bonus");
    expect(cpiMultiplierFromInflationPercent(0)).toBe(1.0); // no data / deflation
    expect(cpiMultiplierFromInflationPercent(-2)).toBe(1.0); // never below 1
    expect(cpiMultiplierFromInflationPercent(15)).toBe(1.5); // mid-band
    expect(cpiMultiplierFromInflationPercent(30)).toBe(2.0); // band top
    expect(cpiMultiplierFromInflationPercent(120)).toBe(2.0); // capped — max gap 2×
  });

  it("returns zero stack when the base reward is zero", () => {
    const result = computeBonusStack({
      rawReward: 0,
      firstScanOfDay: true,
      streakActive: true,
      itemized: true,
    });
    expect(result.boostedReward).toBe(0);
    expect(result.scanBonus).toBe(0);
    expect(result.firstScanOfDayBonus).toBe(0);
    expect(result.streakMultiplier).toBe(1);
    expect(result.itemizedMultiplier).toBe(1);
  });
});
