import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── In-memory fake of the Neon tagged-template SQL client ──────────────────
interface FakeState {
  channels: Record<string, string>; // username → source_channel
  counts: Record<string, number>; // `${subject}|${date}` → attempts_count
  verified: Record<string, number>;
}

const state: FakeState = { channels: {}, counts: {}, verified: {} };

function makeSql() {
  return async (strings: TemplateStringsArray, ...values: unknown[]) => {
    const q = strings.join(" ? ");
    if (q.includes("SELECT source_channel FROM users")) {
      const username = String(values[0]);
      return [{ source_channel: state.channels[username] ?? "web" }];
    }
    if (q.includes("INSERT INTO receipt_daily_usage")) {
      const key = `${values[0]}|${values[1]}`;
      state.counts[key] = (state.counts[key] ?? 0) + 1;
      return [{ attempts_count: state.counts[key] }];
    }
    if (q.includes("SELECT attempts_count")) {
      const key = `${values[0]}|${values[1]}`;
      return [{ attempts_count: state.counts[key] ?? 0 }];
    }
    if (q.includes("verified_count = verified_count + 1")) {
      const key = `${values[0]}|${values[1]}`;
      state.verified[key] = (state.verified[key] ?? 0) + 1;
      return [];
    }
    if (q.includes("UPDATE receipt_daily_usage") && q.includes("GREATEST")) {
      const key = `${values[0]}|${values[1]}`;
      state.counts[key] = Math.max(0, (state.counts[key] ?? 0) - 1);
      return [];
    }
    return [];
  };
}

vi.mock("@/lib/db/client", () => ({
  getSql: () => makeSql(),
}));

const {
  reserveTelegramDailyAttempt,
  refundDailyAttempt,
  getDailyQuota,
  isTelegramChannelUser,
  utcDateKey,
  nextUtcResetAt,
  telegramIdFromUsername,
} = await import("../daily-usage");

const TG = "telegram_500";

beforeEach(() => {
  state.channels = { [TG]: "telegram", telegram_999: "telegram", alice: "web" };
  state.counts = {};
  state.verified = {};
  process.env.TELEGRAM_DAILY_RECEIPT_LIMIT = "2";
  process.env.TELEGRAM_ADMIN_USER_IDS = "999";
});

describe("daily-usage — Telegram channel quota", () => {
  it("accepts the first and second attempts, rejects the third (limit 2)", async () => {
    const first = await reserveTelegramDailyAttempt(TG);
    const second = await reserveTelegramDailyAttempt(TG);
    const third = await reserveTelegramDailyAttempt(TG);

    expect(first.allowed).toBe(true);
    expect(first.reserved).toBe(true);
    expect(second.allowed).toBe(true);
    expect(third.allowed).toBe(false);
    expect(third.reserved).toBe(false); // over-limit increment is not a usable slot
    expect(third.quota?.remaining).toBe(0);
  });

  it("does NOT reserve for web (non-Telegram) accounts — web keeps its own throttle", async () => {
    const r1 = await reserveTelegramDailyAttempt("alice");
    const r2 = await reserveTelegramDailyAttempt("alice");
    const r3 = await reserveTelegramDailyAttempt("alice");
    expect(r1.allowed && r2.allowed && r3.allowed).toBe(true);
    expect(r1.subjectId).toBeNull();
    expect(r1.reserved).toBe(false);
    expect(state.counts[`alice|${utcDateKey()}`]).toBeUndefined();
  });

  it("lets admin/test Telegram ids bypass the limit (test override)", async () => {
    const admin = "telegram_999";
    const a = await reserveTelegramDailyAttempt(admin);
    const b = await reserveTelegramDailyAttempt(admin);
    const c = await reserveTelegramDailyAttempt(admin);
    expect(a.allowed && b.allowed && c.allowed).toBe(true);
    expect(a.reserved).toBe(false);
  });

  it("two simultaneous reservations cannot both pass a limit of 1", async () => {
    process.env.TELEGRAM_DAILY_RECEIPT_LIMIT = "1";
    const results = await Promise.all([
      reserveTelegramDailyAttempt(TG),
      reserveTelegramDailyAttempt(TG),
    ]);
    const allowed = results.filter((r) => r.allowed).length;
    expect(allowed).toBe(1); // exactly one wins; atomic increment serializes them
  });

  it("refund restores a consumed slot", async () => {
    await reserveTelegramDailyAttempt(TG); // used 1
    const before = await getDailyQuota(TG);
    expect(before.used).toBe(1);
    await refundDailyAttempt(TG);
    const after = await getDailyQuota(TG);
    expect(after.used).toBe(0);
    // ...and the next reservation is allowed again.
    const again = await reserveTelegramDailyAttempt(TG);
    expect(again.allowed).toBe(true);
  });

  it("refund never drops below zero", async () => {
    await refundDailyAttempt(TG);
    const q = await getDailyQuota(TG);
    expect(q.used).toBe(0);
  });

  it("getDailyQuota reports limit/used/remaining/resetAt", async () => {
    await reserveTelegramDailyAttempt(TG);
    const q = await getDailyQuota(TG);
    expect(q.limit).toBe(2);
    expect(q.used).toBe(1);
    expect(q.remaining).toBe(1);
    expect(q.resetAt).toBe(nextUtcResetAt());
  });

  it("isTelegramChannelUser reflects the stored source_channel", async () => {
    expect(await isTelegramChannelUser(TG)).toBe(true);
    expect(await isTelegramChannelUser("alice")).toBe(false);
  });

  it("resetAt is the next UTC midnight (day boundary)", () => {
    const reset = new Date(nextUtcResetAt(new Date("2026-07-15T23:59:00.000Z")));
    expect(reset.toISOString()).toBe("2026-07-16T00:00:00.000Z");
  });

  it("utcDateKey is a UTC calendar day, independent of local offset", () => {
    expect(utcDateKey(new Date("2026-07-15T23:30:00.000Z"))).toBe("2026-07-15");
    expect(utcDateKey(new Date("2026-07-16T00:30:00.000Z"))).toBe("2026-07-16");
  });

  it("telegramIdFromUsername extracts the numeric id", () => {
    expect(telegramIdFromUsername("telegram_7814459987")).toBe("7814459987");
    expect(telegramIdFromUsername("alice")).toBeNull();
  });
});
