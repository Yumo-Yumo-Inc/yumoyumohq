/**
 * Client-side fetchers + types for the Contribution Center screen.
 *
 * Shapes mirror the API routes exactly (app/api/contribution/*). Kept separate from the
 * server modules (which import lib/db) so the client bundle never pulls in server code.
 */

export interface ContributionCandidate {
  canonicalId: string | null;
  label: string;
  /** Normalised pack token for product_pack_size tasks (e.g. 100g, 15adet). */
  packSize?: string | null;
  /**
   * Merchant and price this product was observed at in the external catalog, when there is
   * one. A merchant name and numbers, so there is nothing in it to translate.
   */
  reference: string | null;
}

export interface ContributionTask {
  id: string;
  taskType: string;
  rawText: string;
  merchantLabel: string | null;
  priceMedian: number | null;
  currency: string | null;
  /** How many receipt lines one answer would fix — the honest multiplier. */
  rowCount: number;
  isWitness: boolean;
  candidates: ContributionCandidate[];
}

export interface ContributionFeed {
  tasks: ContributionTask[];
  quotaRemaining: number;
  pointsRemaining: number;
}

/** "none" says the options are all wrong, which is a different fact from not knowing. */
export type AnswerKind = "pick" | "other" | "none" | "unknown";

export interface AnswerInput {
  taskId: string;
  kind: AnswerKind;
  canonicalId?: string | null;
  freeText?: string | null;
  latencyMs?: number | null;
}

export interface AnswerResult {
  pointsAwarded: number;
  quotaRemaining: number;
  resolved: boolean;
  rowsFixed: number;
}

export type AnswerErrorCode =
  | "quota_exhausted"
  | "already_answered"
  | "task_not_open"
  | "invalid"
  | "unauthorized"
  | "answer_failed";

export class AnswerError extends Error {
  code: AnswerErrorCode;
  constructor(code: AnswerErrorCode) {
    super(code);
    this.code = code;
    this.name = "AnswerError";
  }
}

export interface ContributionStats {
  me: {
    answered: number;
    rowsFixed: number;
    quota: number;
    quotaRemaining: number;
    pointsToday: number;
    pointsRemaining: number;
  };
  collective: {
    openTasks: number;
    resolvedTasks: number;
  };
  consensus: {
    witnessRate: number | null;
    trigger: number;
    reachable: boolean;
  };
}

export async function fetchContributionFeed(limit = 10): Promise<ContributionFeed> {
  const res = await fetch(`/api/contribution/feed?limit=${limit}`, {
    headers: { "cache-control": "no-cache" },
  });
  if (!res.ok) throw new Error("feed_unavailable");
  return (await res.json()) as ContributionFeed;
}

export async function fetchContributionStats(): Promise<ContributionStats> {
  const res = await fetch("/api/contribution/stats", {
    headers: { "cache-control": "no-cache" },
  });
  if (!res.ok) throw new Error("stats_unavailable");
  return (await res.json()) as ContributionStats;
}

export async function submitContributionAnswer(input: AnswerInput): Promise<AnswerResult> {
  const res = await fetch("/api/contribution/answer", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    let code: AnswerErrorCode = "answer_failed";
    if (res.status === 401) code = "unauthorized";
    else {
      const body = (await res.json().catch(() => null)) as { error?: string } | null;
      if (body?.error) code = body.error as AnswerErrorCode;
    }
    throw new AnswerError(code);
  }
  return (await res.json()) as AnswerResult;
}
