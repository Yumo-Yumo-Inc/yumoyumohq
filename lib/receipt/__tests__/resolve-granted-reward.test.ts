import { describe, expect, it } from "vitest";
import { resolveGrantedReward } from "../resolve-granted-reward";

describe("resolveGrantedReward", () => {
  it("does not resurrect a stored reward for a duplicate receipt", () => {
    const result = resolveGrantedReward({
      receiptData: {
        documentType: "receipt",
        paymentProven: true,
        geminiLineItems: [{ name: "SALAD" }],
        verification: { isDuplicate: true },
      },
      merchantName: "Jones Salad",
      extractionDate: "2026-08-04",
      paymentProven: true,
      paidExTax: 270,
      hiddenCostCore: 40,
      usdRate: 35,
      storedRewardFinal: 0.03,
    });

    expect(result.duplicateBlocked).toBe(true);
    expect(result.eligible).toBe(false);
    expect(result.grantedBint).toBe(0);
  });
});
