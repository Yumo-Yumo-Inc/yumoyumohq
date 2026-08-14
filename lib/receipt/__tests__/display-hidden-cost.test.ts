import { describe, expect, it } from "vitest";
import {
  displayHiddenCost,
  displayHiddenPercent,
  isHiddenCostUnavailable,
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
        hiddenCost: { totalHidden: 120, hiddenCostCore: 120 },
      })
    ).toBe(120);
  });

  it("marks provenance unavailable as could-not-compute", () => {
    expect(
      isHiddenCostUnavailable({
        documentType: "payment_receipt",
        hiddenCost: { hiddenCostCore: 0, provenance: "unavailable" },
      })
    ).toBe(true);
  });

  it("does not treat money_transfer zero as unavailable purchase HC", () => {
    expect(
      isHiddenCostUnavailable({
        documentType: "money_transfer",
        hiddenCost: { hiddenCostCore: 0 },
      })
    ).toBe(false);
  });

  it("treats legacy zero with no breakdown as unavailable", () => {
    expect(
      isHiddenCostUnavailable({
        documentType: "receipt",
        hiddenCost: { hiddenCostCore: 0, breakdownItems: [] },
      })
    ).toBe(true);
  });

  it("treats nested breakdown items as priced when present", () => {
    expect(
      isHiddenCostUnavailable({
        documentType: "receipt",
        hiddenCost: {
          hiddenCostCore: 0,
          breakdownItems: [],
        },
      })
    ).toBe(true);
    expect(
      isHiddenCostUnavailable({
        documentType: "receipt",
        hiddenCost: {
          hiddenCostCore: 4.95,
          totalHidden: 4.95,
          breakdown: { items: [{ amount: 4.95 }] },
        } as { hiddenCostCore: number; totalHidden: number; breakdown: { items: Array<{ amount: number }> } },
      })
    ).toBe(false);
  });
});
