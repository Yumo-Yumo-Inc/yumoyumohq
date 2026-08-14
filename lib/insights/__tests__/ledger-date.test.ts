/**
 * ledger-date: invalid OCR dates must not become "this month".
 * Run: npx vitest run lib/insights/__tests__/ledger-date.test.ts
 */
import { describe, expect, it } from "vitest";
import {
  isValidLedgerDate,
  monthKeyFromLedgerDate,
  resolveLedgerDate,
} from "../ledger-date";

describe("ledger-date", () => {
  it("accepts a valid date", () => {
    expect(isValidLedgerDate("2026-08-08")).toBe(true);
  });

  it("derives a valid month key", () => {
    expect(monthKeyFromLedgerDate("2026-08-08")).toBe("2026-08");
  });

  it("rejects a glued-year garbage date", () => {
    expect(isValidLedgerDate("2019-05-2026")).toBe(false);
  });

  it("rejects a null-day garbage date", () => {
    expect(isValidLedgerDate("2026-06-null")).toBe(false);
  });

  it("returns null month key for a garbage glued-year date", () => {
    expect(monthKeyFromLedgerDate("2019-05-2026")).toBe(null);
  });

  it("returns null month key for an empty string", () => {
    expect(monthKeyFromLedgerDate("")).toBe(null);
  });

  it("rejects an impossible calendar day", () => {
    expect(isValidLedgerDate("2026-02-31")).toBe(false);
  });

  it("prefers a valid extraction over the fallback", () => {
    expect(resolveLedgerDate("2026-08-01", "2026-07-15")).toBe("2026-08-01");
  });

  it("falls back to the canonical date on a garbage extraction", () => {
    expect(resolveLedgerDate("2019-05-2026", "2026-07-15")).toBe("2026-07-15");
  });

  it("falls back to the canonical date on a null-day extraction", () => {
    expect(resolveLedgerDate("2026-06-null", "2026-06-16T12:00:00.000Z")).toBe("2026-06-16");
  });

  it("repairs Gemini YYYY-DD-MM (month 14) into a real calendar day", () => {
    expect(isValidLedgerDate("2026-14-08")).toBe(true);
    expect(monthKeyFromLedgerDate("2026-14-08")).toBe("2026-08");
    expect(resolveLedgerDate("2026-14-08", "2026-07-01")).toBe("2026-08-14");
  });

  it("rejects a month that cannot be swapped into a calendar date", () => {
    expect(isValidLedgerDate("2026-32-01")).toBe(false);
    expect(monthKeyFromLedgerDate("2026-32-01")).toBe(null);
  });

  it("never turns a garbage date into today's month", () => {
    const todayYm = new Date().toISOString().slice(0, 7);
    expect(monthKeyFromLedgerDate("2019-05-2026") === todayYm).toBe(false);
  });
});
