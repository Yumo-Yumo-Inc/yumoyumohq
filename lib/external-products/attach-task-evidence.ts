/**
 * Annotate open identification tasks with external catalog evidence.
 *
 * This runs AFTER the task generator, never instead of it. The generator owns which
 * strings become tasks and which canonical products are offered as options — including
 * its generic-word, presentability and readable-brand filters. This step only adds the
 * market and price a candidate was observed at, so a user choosing between three similar
 * products has something concrete to choose on.
 *
 * Consequences of that split, all deliberate:
 *   - the candidate set is never changed, so a user-supplied "Diğer" option survives
 *   - no task is created here, so no filter can be bypassed
 *   - it is idempotent and safe to re-run after every import
 *
 * Server-only.
 */

if (typeof window !== "undefined") {
  throw new Error("lib/external-products/attach-task-evidence is server-only.");
}

import { db } from "@/lib/db/client";
import {
  evidenceReference,
  loadExternalEvidence,
  type ExternalCatalogEvidence,
} from "./evidence";

interface TaskCandidate {
  canonical_id?: string | null;
  label?: string;
  external_evidence?: ExternalCatalogEvidence[];
  external_reference?: string | null;
  [key: string]: unknown;
}

interface OpenTaskRow {
  id: string;
  merchant_id: string | null;
  candidates: TaskCandidate[] | null;
}

export interface AttachEvidenceResult {
  scanned: number;
  annotated: number;
}

/**
 * @param options.batchId  Restrict to merchants that appear in one import batch.
 * @param options.limit    Tasks examined per run.
 */
export async function attachExternalEvidenceToOpenTasks(
  options: { batchId?: string | null; limit?: number } = {}
): Promise<AttachEvidenceResult> {
  const limit = Math.max(1, Math.min(500, options.limit ?? 200));
  const batchId = options.batchId ?? null;

  const { rows } = await db.query<OpenTaskRow>(
    `SELECT t.id, t.merchant_id, t.candidates
       FROM contribution_tasks t
      WHERE t.task_type = 'product_identify'
        AND t.status = 'open'
        AND t.merchant_id IS NOT NULL
        AND jsonb_typeof(t.candidates) = 'array'
        AND ($1::uuid IS NULL OR t.merchant_id IN (
          SELECT DISTINCT merchant_id FROM external_price_observations WHERE batch_id = $1::uuid
        ))
      ORDER BY t.priority DESC, t.id
      LIMIT $2`,
    [batchId, limit]
  );

  let annotated = 0;
  for (const task of rows) {
    const candidates = task.candidates ?? [];
    const canonicalIds = candidates
      .map((candidate) => candidate.canonical_id)
      .filter((id): id is string => typeof id === "string" && id.length > 0);
    if (canonicalIds.length === 0) continue;

    const evidence = await loadExternalEvidence({ canonicalIds, merchantId: task.merchant_id });
    if (evidence.size === 0) continue;

    const merged = candidates.map((candidate) => {
      const found = candidate.canonical_id ? evidence.get(candidate.canonical_id) : undefined;
      if (!found?.length) return candidate;
      return {
        ...candidate,
        external_evidence: found,
        external_reference: evidenceReference(found),
      };
    });
    const externalProductIds = [
      ...new Set(
        merged.flatMap((candidate) =>
          (candidate.external_evidence ?? []).map((item) => item.externalProductId)
        )
      ),
    ];
    if (externalProductIds.length === 0) continue;

    // Guarded on status and on the exact snapshot that was read: a "Diğer" answer appending
    // a candidate between the read and the write must win, not be overwritten. Losing the
    // race costs nothing — the next run annotates the new snapshot.
    const updated = await db.query<{ id: string }>(
      `UPDATE contribution_tasks
          SET candidates = $2::jsonb,
              external_product_ids = $3::uuid[]
        WHERE id = $1 AND status = 'open' AND candidates = $4::jsonb
        RETURNING id`,
      [task.id, JSON.stringify(merged), externalProductIds, JSON.stringify(candidates)]
    );
    if (updated.rows.length) annotated += 1;
  }

  return { scanned: rows.length, annotated };
}
