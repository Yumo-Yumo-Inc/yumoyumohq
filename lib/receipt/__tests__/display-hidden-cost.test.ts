import { describe, expect, it } from "vitest";
import {
  displayHiddenCost,
  displayHiddenPercent,
  resolveRawHiddenCost,
} from "@/lib/receipt/display-hidden-cost";

describe("display-hidden-cost", () => {
  it("resolveRawHiddenCost prefers hiddenTotal over core", () => {
    expect(
      resolveRawHiddenCost({ hiddenTotal: 120, hiddenCostCore: 80 })
    ).toBe(120);
  });

  it("does not sum breakdown columns (core only when no hiddenTotal)", () => {
    expect(resolveRawHiddenCost({ hiddenCostCore: 298 })).toBe(298);
  });

  it("clamps hidden to total paid for UI", () => {
    expect(
      displayHiddenCost({
        totalPaid: 500,
        hiddenCost: { totalHidden: 596, hiddenCostCore: 298 },
      })
    ).toBe(500);
  });

  it("caps percent at 100 when clamped", () => {
    expect(
      displayHiddenPercent({
        totalPaid: 500,
        hiddenCost: { totalHidden: 596 },
      })
    ).toBe(100);
  });

  it("leaves normal receipts unchanged", () => {
    expect(
      displayHiddenCost({
        totalPaid: 500,
        hiddenCost: { totalHidden: 280 },
      })
    ).toBe(280);
  });
});
