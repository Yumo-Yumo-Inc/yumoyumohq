import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  query: vi.fn(),
  submitAnswer: vi.fn(),
  getDailyBudget: vi.fn(),
  getReliability: vi.fn(),
  confirm: vi.fn(),
  reject: vi.fn(),
  needsReview: vi.fn(),
}));

vi.mock("@/lib/db/client", () => ({ db: { query: mocks.query } }));
vi.mock("../answer", () => ({ submitAnswer: mocks.submitAnswer }));
vi.mock("../reliability", () => ({
  getDailyBudget: mocks.getDailyBudget,
  getReliability: mocks.getReliability,
}));
vi.mock("@/lib/oracle/account-season-level", () => ({ getCurrentSeasonNumber: () => 1 }));
vi.mock("@/lib/external-products/confirmation", () => ({
  confirmExternalMatchesForTask: mocks.confirm,
  rejectExternalCandidatesForTask: mocks.reject,
  markExternalCandidatesNeedsReviewForTask: mocks.needsReview,
}));

import { submitAnswerWithExternal } from "../external-answer";

describe("external contribution answer safety", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getDailyBudget.mockResolvedValue({ remainingTasks: 5, pointsRemaining: 50 });
    mocks.getReliability.mockResolvedValue({ reliability: 0.5 });
    mocks.reject.mockResolvedValue(1);
    mocks.needsReview.mockResolvedValue(1);
    mocks.confirm.mockResolvedValue(1);
  });

  it("does not globally reject candidates for a none answer below consensus", async () => {
    mocks.query
      .mockResolvedValueOnce({ rows: [{ id: "answer-1" }] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [{ answer_kind: "none", weight: 0.5 }] });

    const result = await submitAnswerWithExternal({
      taskId: "7",
      username: "ugur",
      kind: "none",
    });

    expect(result.ok).toBe(true);
    if (result.ok) expect(result.outcome.status).toBe("open");
    expect(mocks.reject).not.toHaveBeenCalled();
    expect(mocks.confirm).not.toHaveBeenCalled();
  });

  it("rejects external suggestions only after none clears threshold and margin", async () => {
    mocks.getReliability.mockResolvedValue({ reliability: 0.8 });
    mocks.query
      .mockResolvedValueOnce({ rows: [{ id: "answer-1" }] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [{ answer_kind: "none", weight: 0.8 }] })
      .mockResolvedValueOnce({ rows: [{ id: "7" }] });

    const result = await submitAnswerWithExternal({
      taskId: "7",
      username: "ugur",
      kind: "none",
    });

    expect(result.ok).toBe(true);
    if (result.ok) expect(result.outcome.status).toBe("unresolvable");
    expect(mocks.reject).toHaveBeenCalledWith({ taskId: "7", username: "ugur" });
    expect(mocks.confirm).not.toHaveBeenCalled();
  });

  it("keeps unknown outcomes away from canonical writes and marks evidence for review", async () => {
    mocks.submitAnswer.mockResolvedValue({
      ok: true,
      pointsAwarded: 0,
      quotaRemaining: 4,
      outcome: { status: "unresolvable" },
    });

    const result = await submitAnswerWithExternal({
      taskId: "7",
      username: "ugur",
      kind: "unknown",
    });

    expect(result.ok).toBe(true);
    expect(mocks.needsReview).toHaveBeenCalledWith({ taskId: "7" });
    expect(mocks.confirm).not.toHaveBeenCalled();
    expect(mocks.reject).not.toHaveBeenCalled();
  });

  it("uses an actual winning pick owner when confirming a resolved task", async () => {
    mocks.submitAnswer.mockResolvedValue({
      ok: true,
      pointsAwarded: 10,
      quotaRemaining: 4,
      outcome: {
        status: "resolved",
        canonicalId: "11111111-1111-4111-8111-111111111111",
        rowsFixed: 2,
      },
    });
    mocks.query
      .mockResolvedValueOnce({ rows: [{ allowed: true }] })
      .mockResolvedValueOnce({ rows: [{ username: "winner" }] });

    await submitAnswerWithExternal({
      taskId: "7",
      username: "triggering-user",
      kind: "pick",
      canonicalId: "11111111-1111-4111-8111-111111111111",
    });

    expect(mocks.confirm).toHaveBeenCalledWith({
      taskId: "7",
      canonicalId: "11111111-1111-4111-8111-111111111111",
      confirmedBy: "winner",
    });
  });

  it("rejects a canonical id that is not in the task before the base resolver runs", async () => {
    mocks.query.mockResolvedValueOnce({ rows: [{ allowed: false }] });
    const result = await submitAnswerWithExternal({
      taskId: "7",
      username: "ugur",
      kind: "pick",
      canonicalId: "99999999-9999-4999-8999-999999999999",
    });
    expect(result).toEqual({ ok: false, code: "invalid" });
    expect(mocks.submitAnswer).not.toHaveBeenCalled();
    expect(mocks.confirm).not.toHaveBeenCalled();
  });

  it("moves external evidence to review if post-resolution confirmation fails", async () => {
    mocks.submitAnswer.mockResolvedValue({
      ok: true,
      pointsAwarded: 10,
      quotaRemaining: 4,
      outcome: {
        status: "resolved",
        canonicalId: "11111111-1111-4111-8111-111111111111",
        rowsFixed: 1,
      },
    });
    mocks.query
      .mockResolvedValueOnce({ rows: [{ allowed: true }] })
      .mockResolvedValueOnce({ rows: [{ username: "ugur" }] });
    mocks.confirm.mockRejectedValueOnce(new Error("task_validation_failed"));

    const result = await submitAnswerWithExternal({
      taskId: "7",
      username: "ugur",
      kind: "pick",
      canonicalId: "11111111-1111-4111-8111-111111111111",
    });
    expect(result.ok).toBe(true);
    expect(mocks.needsReview).toHaveBeenCalledWith({ taskId: "7" });
  });

  it("does not pay or mutate candidates when the same user answers none twice", async () => {
    mocks.query.mockResolvedValueOnce({ rows: [] });
    const result = await submitAnswerWithExternal({
      taskId: "7",
      username: "ugur",
      kind: "none",
    });
    expect(result).toEqual({ ok: false, code: "already_answered" });
    expect(mocks.query).toHaveBeenCalledTimes(1);
    expect(mocks.reject).not.toHaveBeenCalled();
  });
});
