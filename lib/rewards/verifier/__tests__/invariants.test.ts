import { describe, it, expect } from "vitest";
import {
  checkRootMatch,
  checkLedgerHash,
  checkSoftCap,
  checkCumulativeCap,
  checkWindowContiguity,
  checkTotalMatch,
} from "../invariants";

describe("Step 7 invariants", () => {
  it("root match", () => {
    expect(checkRootMatch("abc", "abc").ok).toBe(true);
    expect(checkRootMatch("abc", "def").ok).toBe(false);
    expect(checkRootMatch(null, "def").ok).toBe(false);
  });

  it("ledger hash (tamper detection)", () => {
    expect(checkLedgerHash("h1", "h1").ok).toBe(true);
    expect(checkLedgerHash("h1", "h2").ok).toBe(false);
  });

  it("soft cap", () => {
    expect(checkSoftCap(1000, 1000).ok).toBe(true);
    expect(checkSoftCap(1001.5, 1000).ok).toBe(false);
  });

  it("cumulative cap", () => {
    expect(checkCumulativeCap(60_000_000_000, 4_000_000_000, 64_350_000_000).ok).toBe(true);
    expect(checkCumulativeCap(64_000_000_000, 1_000_000_000, 64_350_000_000).ok).toBe(false);
  });

  it("window contiguity (no double-pay)", () => {
    expect(checkWindowContiguity(null, "2026-01-08T00:00:00.000Z").ok).toBe(true);
    const t = "2026-01-08T00:00:00.000Z";
    expect(checkWindowContiguity(t, t).ok).toBe(true);
    expect(checkWindowContiguity(t, "2026-01-07T00:00:00.000Z").ok).toBe(false);
  });

  it("total match", () => {
    expect(checkTotalMatch(500, 500).ok).toBe(true);
    expect(checkTotalMatch(500, 600).ok).toBe(false);
  });
});
