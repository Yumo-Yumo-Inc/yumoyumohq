import {
  getMaxRewardPerReceiptForLevel,
  getMaxDailyRewardForLevel,
} from "@/lib/receipt/reward-caps";

describe("reward-caps decade bands", () => {
  it("steps the per-receipt cap by account-level decade", () => {
    expect(getMaxRewardPerReceiptForLevel(1)).toBe(500);
    expect(getMaxRewardPerReceiptForLevel(9)).toBe(500);
    expect(getMaxRewardPerReceiptForLevel(10)).toBe(750);
    expect(getMaxRewardPerReceiptForLevel(19)).toBe(750);
    expect(getMaxRewardPerReceiptForLevel(20)).toBe(1250);
    expect(getMaxRewardPerReceiptForLevel(29)).toBe(1250);
    expect(getMaxRewardPerReceiptForLevel(30)).toBe(2000);
    expect(getMaxRewardPerReceiptForLevel(39)).toBe(2000);
    expect(getMaxRewardPerReceiptForLevel(40)).toBe(3000);
    expect(getMaxRewardPerReceiptForLevel(50)).toBe(3000);
  });

  it("steps the daily cap by decade from the approved tokenomics table", () => {
    expect(getMaxDailyRewardForLevel(1)).toBe(1500);
    expect(getMaxDailyRewardForLevel(9)).toBe(1500);
    expect(getMaxDailyRewardForLevel(10)).toBe(2200);
    expect(getMaxDailyRewardForLevel(19)).toBe(2200);
    expect(getMaxDailyRewardForLevel(20)).toBe(3000);
    expect(getMaxDailyRewardForLevel(30)).toBe(4000);
    expect(getMaxDailyRewardForLevel(40)).toBe(5000);
    expect(getMaxDailyRewardForLevel(49)).toBe(5000);
    expect(getMaxDailyRewardForLevel(50)).toBe(6000);
  });

  it("treats invalid levels as the base band", () => {
    expect(getMaxRewardPerReceiptForLevel(0)).toBe(500);
    expect(getMaxRewardPerReceiptForLevel(NaN)).toBe(500);
    expect(getMaxDailyRewardForLevel(0)).toBe(1500);
  });
});
