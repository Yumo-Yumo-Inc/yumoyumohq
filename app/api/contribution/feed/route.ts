import { NextResponse } from "next/server";
import { getSessionUsername } from "@/lib/auth/session";
import { getContributionFeed } from "@/lib/contribution/feed";
import { db } from "@/lib/db/client";

export const dynamic = "force-dynamic";

interface StoredCandidate {
  canonical_id?: string | null;
  external_reference?: string | null;
}

/**
 * Attach the external price reference to each option.
 *
 * The reference is numbers and a merchant name, produced by the catalog annotation step —
 * no translatable copy, so it is safe to pass through. The "none of these" option is NOT
 * added here: it is an answer kind (`kind: "none"`), not a product, and rendering it as a
 * lettered product option would make it indistinguishable from a real choice.
 */
export async function GET(request: Request) {
  const username = await getSessionUsername();
  if (!username) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const limit = Math.max(1, Math.min(20, Number(new URL(request.url).searchParams.get("limit")) || 10));
  const feed = await getContributionFeed(username, limit);
  const taskIds = feed.tasks.map((task) => task.id);
  const rows = taskIds.length
    ? (await db.query<{ id: string; candidates: StoredCandidate[] | null }>(
        `SELECT id::text, candidates FROM contribution_tasks WHERE id = ANY($1::bigint[])`,
        [taskIds]
      )).rows
    : [];

  const referenceByTask = new Map<string, Map<string, string>>();
  for (const row of rows) {
    const byCanonical = new Map<string, string>();
    for (const candidate of Array.isArray(row.candidates) ? row.candidates : []) {
      if (candidate?.canonical_id && candidate.external_reference) {
        byCanonical.set(candidate.canonical_id, candidate.external_reference);
      }
    }
    if (byCanonical.size) referenceByTask.set(row.id, byCanonical);
  }

  return NextResponse.json({
    ...feed,
    tasks: feed.tasks.map((task) => {
      const references = referenceByTask.get(task.id);
      return {
        ...task,
        candidates: task.candidates.map((candidate) => ({
          ...candidate,
          reference: candidate.canonicalId
            ? references?.get(candidate.canonicalId) ?? null
            : null,
        })),
      };
    }),
  });
}
