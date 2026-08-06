import { describe, expect, it } from "vitest";
import {
  DAILY_TASK_POINT_CAP,
  QUOTA_MAX,
  QUOTA_MIN,
  QUOTA_BASE,
  RELIABILITY_DEFAULT,
  TASK_POINTS_IDENTIFY,
  TASK_POINTS_OTHER_WINNER,
  dailyQuotaFor,
  reliabilityFrom,
  taskPriority,
  taskSourceType,
} from "@/config/contribution-center";

describe("task economy", () => {
  it("keeps the quota ceiling and the daily point cap on the same number", () => {
    // Uğur set 500/day. Everything else is derived from it so there is ONE lever, not
    // two that can silently drift apart.
    expect(QUOTA_MAX * TASK_POINTS_IDENTIFY).toBe(DAILY_TASK_POINT_CAP);
  });

  it("pays a task well below a receipt", () => {
    // A good receipt is ~20-60 cPoints. Uploading one must stay the primary behaviour;
    // a task is one tap against photographing and uploading a receipt.
    expect(TASK_POINTS_IDENTIFY).toBeLessThan(20);
  });

  it("pays the winning free-text author more than a tap", () => {
    // They did the hard half: the machine had no candidate, they supplied the name.
    expect(TASK_POINTS_OTHER_WINNER).toBeGreaterThan(TASK_POINTS_IDENTIFY);
  });

  it("namespaces the ledger source_type so the daily cap can sum it", () => {
    expect(taskSourceType("product_identify")).toBe("task_product_identify");
    expect(taskSourceType("product_identify").startsWith("task_")).toBe(true);
  });
});

describe("reliabilityFrom — Beta prior", () => {
  it("starts a new account at exactly 0.5", () => {
    // Breaks K2's chicken-and-egg: no history would otherwise mean no quota, and no
    // quota would mean no way to build history.
    expect(reliabilityFrom(0, 0)).toBe(0.5);
    expect(RELIABILITY_DEFAULT).toBe(0.5);
  });

  it("does not call a short streak perfect", () => {
    // A raw rate would say 2/2 = 1.0 and hand out the ceiling for two lucky taps.
    expect(reliabilityFrom(2, 2)).toBeLessThan(0.8);
    expect(reliabilityFrom(2, 2)).toBeGreaterThan(0.5);
  });

  it("does not write anyone off for one mistake", () => {
    // A raw rate would say 0/1 = 0.0 and floor the account instantly.
    expect(reliabilityFrom(0, 1)).toBeGreaterThan(0.3);
  });

  it("converges on real evidence in both directions", () => {
    expect(reliabilityFrom(10, 10)).toBeGreaterThan(0.8);
    expect(reliabilityFrom(10, 10)).toBeLessThan(1);
    expect(reliabilityFrom(0, 10)).toBeLessThan(0.2);
    expect(reliabilityFrom(0, 10)).toBeGreaterThan(0);
  });

  it("is monotonic in accuracy", () => {
    const rates = [0, 2, 5, 8, 10].map((c) => reliabilityFrom(c, 10));
    for (let i = 1; i < rates.length; i++) {
      expect(rates[i]).toBeGreaterThan(rates[i - 1]);
    }
  });

  it("survives impossible counters instead of returning nonsense", () => {
    expect(reliabilityFrom(5, 2)).toBeLessThanOrEqual(1);
    expect(reliabilityFrom(-3, 10)).toBeGreaterThanOrEqual(0);
  });
});

describe("dailyQuotaFor — accuracy earns volume (K2)", () => {
  it("gives a new account the base quota", () => {
    expect(dailyQuotaFor(RELIABILITY_DEFAULT)).toBe(QUOTA_BASE);
  });

  it("never drops to zero", () => {
    // A user at the floor must still be able to earn their way back, and gold tasks are
    // the only instrument that can measure them.
    expect(dailyQuotaFor(0)).toBe(QUOTA_MIN);
    expect(dailyQuotaFor(0)).toBeGreaterThan(0);
  });

  it("caps at the ceiling", () => {
    expect(dailyQuotaFor(1)).toBe(QUOTA_MAX);
  });

  it("rises with accuracy", () => {
    expect(dailyQuotaFor(0.86)).toBeGreaterThan(dailyQuotaFor(0.5));
    expect(dailyQuotaFor(0.5)).toBeGreaterThan(dailyQuotaFor(0.14));
  });

  it("cannot exceed the point cap when every task pays", () => {
    for (const r of [0, 0.25, 0.5, 0.75, 1]) {
      expect(dailyQuotaFor(r) * TASK_POINTS_IDENTIFY).toBeLessThanOrEqual(
        DAILY_TASK_POINT_CAP
      );
    }
  });

  it("handles a NaN reliability instead of producing NaN quota", () => {
    expect(dailyQuotaFor(Number.NaN)).toBe(QUOTA_BASE);
  });
});

describe("taskPriority", () => {
  it("ranks a multi-merchant string above a single-merchant one with the same reach", () => {
    // Resolving a string seen at several merchants merges price series across stores —
    // that is the product's actual promise, so it outranks equal row count.
    expect(taskPriority(10, 3)).toBeGreaterThan(taskPriority(10, 1));
  });

  it("ranks wider reach higher at equal merchant spread", () => {
    expect(taskPriority(40, 1)).toBeGreaterThan(taskPriority(4, 1));
  });
});
