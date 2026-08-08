import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUsername } from "@/lib/auth/session";
import { submitAnswerWithExternal } from "@/lib/contribution/external-answer";

/**
 * "None of these" arrives as its own answer kind. It used to be inferred from a sentinel
 * canonical id or from free text matched against a hardcoded Turkish word list, which put
 * user-facing language in the transport layer and only worked in two languages.
 */
const schema = z.object({
  taskId: z.union([z.string().min(1), z.number().int().positive()]),
  kind: z.enum(["pick", "other", "none", "unknown"]),
  canonicalId: z.string().uuid().nullable().optional(),
  freeText: z.string().trim().min(1).max(80).nullable().optional(),
  latencyMs: z.number().int().min(0).max(3_600_000).nullable().optional(),
});

export async function POST(request: Request) {
  const username = await getSessionUsername();
  if (!username) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "invalid" }, { status: 400 });
  const result = await submitAnswerWithExternal({ ...parsed.data, username });
  if (!result.ok) {
    const status = result.code === "already_answered" || result.code === "task_not_open" ? 409 : 400;
    return NextResponse.json({ error: result.code }, { status });
  }
  return NextResponse.json({
    pointsAwarded: result.pointsAwarded,
    quotaRemaining: result.quotaRemaining,
    resolved: result.outcome.status === "resolved",
    rowsFixed: result.outcome.status === "resolved" ? result.outcome.rowsFixed : 0,
  });
}
