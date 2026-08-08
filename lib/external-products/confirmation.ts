import { db } from "@/lib/db/client";

interface TaskConfirmationRow {
  raw_text_norm: string;
  sample_raw_text: string | null;
  merchant_id: string | null;
  external_product_ids: string[];
  candidates: Array<{
    canonical_id?: string;
    external_evidence?: Array<{ externalProductId?: string }>;
  }> | null;
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function allowedExternalIds(task: TaskConfirmationRow): Set<string> {
  return new Set((task.external_product_ids ?? []).filter((id) => UUID_PATTERN.test(id)));
}

export async function confirmExternalMatchesForTask(input: {
  taskId: string | number;
  canonicalId: string;
  confirmedBy: string;
}): Promise<number> {
  const { rows } = await db.query<{ external_matches: number }>(
    `SELECT external_matches, rows_fixed
       FROM apply_external_product_confirmation($1::bigint, $2::uuid, $3::text)`,
    [input.taskId, input.canonicalId, input.confirmedBy]
  );
  return Number(rows[0]?.external_matches ?? 0);
}

export async function rejectExternalCandidatesForTask(input: {
  taskId: string | number;
  username: string;
}): Promise<number> {
  const { rows } = await db.query<TaskConfirmationRow>(
    `SELECT raw_text_norm, sample_raw_text, merchant_id, candidates, external_product_ids
       FROM contribution_tasks WHERE id = $1`,
    [input.taskId]
  );
  const task = rows[0];
  if (!task || !Array.isArray(task.candidates)) return 0;
  const allowed = allowedExternalIds(task);
  let rejected = 0;
  for (const candidate of task.candidates) {
    for (const evidence of candidate.external_evidence ?? []) {
      if (
        !evidence.externalProductId
        || !UUID_PATTERN.test(evidence.externalProductId)
        || !allowed.has(evidence.externalProductId)
        || !candidate.canonical_id
      ) continue;
      const result = await db.query<{ id: string }>(
        `UPDATE external_product_canonical_matches
            SET status = 'rejected', confirmed_by = $3, confirmed_at = now(), updated_at = now(),
                evidence = evidence || jsonb_build_object('rejected_from_task', $4::text)
          WHERE external_product_id = $1 AND canonical_id = $2 AND status = 'suggested'
          RETURNING id`,
        [evidence.externalProductId, candidate.canonical_id, input.username, String(input.taskId)]
      );
      rejected += result.rows.length;
      await db.query(
        `UPDATE external_product_catalog SET match_status = 'needs_review'
          WHERE id = $1 AND match_status <> 'user_confirmed'`,
        [evidence.externalProductId]
      );
    }
  }
  return rejected;
}

export async function markExternalCandidatesNeedsReviewForTask(input: {
  taskId: string | number;
}): Promise<number> {
  const { rows } = await db.query<{ id: string }>(
    `UPDATE external_product_catalog ep
        SET match_status = 'needs_review'
      WHERE ep.id = ANY(
        SELECT unnest(external_product_ids)
          FROM contribution_tasks
         WHERE id = $1
      )
        AND ep.match_status <> 'user_confirmed'
      RETURNING ep.id`,
    [input.taskId]
  );
  return rows.length;
}

export async function revertExternalConfirmation(input: {
  externalProductId: string;
  taskId?: string | number | null;
  revertedBy: string;
}): Promise<{ canonicalId: string | null; rowsCleared: number }> {
  const current = await db.query<{ canonical_id: string | null }>(
    `SELECT canonical_id FROM external_product_catalog WHERE id = $1`,
    [input.externalProductId]
  );
  const canonicalId = current.rows[0]?.canonical_id ?? null;
  await db.query(
    `UPDATE external_product_canonical_matches
        SET status = 'superseded', reverted_by = $2, reverted_at = now(), updated_at = now(),
            evidence = evidence || jsonb_build_object('reverted', true)
      WHERE external_product_id = $1 AND status = 'user_confirmed'`,
    [input.externalProductId, input.revertedBy]
  );
  await db.query(
    `UPDATE external_product_catalog
        SET canonical_id = NULL, match_status = 'needs_review'
      WHERE id = $1`,
    [input.externalProductId]
  );
  if (!canonicalId || !input.taskId) return { canonicalId, rowsCleared: 0 };

  const taskRows = await db.query<{
    raw_text_norm: string;
    sample_raw_text: string | null;
    merchant_id: string | null;
  }>(
    `SELECT raw_text_norm, sample_raw_text, merchant_id FROM contribution_tasks WHERE id = $1`,
    [input.taskId]
  );
  const task = taskRows.rows[0];
  if (!task) return { canonicalId, rowsCleared: 0 };
  const rawText = task.sample_raw_text ?? task.raw_text_norm;
  // The Contribution Center resolver stamps crowd-taught aliases with match_type='crowd'
  // (lib/contribution/resolve.ts). Deleting only 'user_confirmed' left the wrong alias in
  // place, so the next receipt carrying this string was re-linked to the reverted product.
  // Machine-learned ('exact', 'fuzzy', 'llm') and admin ('manual') aliases are left alone:
  // they were not created by this decision and are not this function's to undo.
  await db.query(
    `DELETE FROM receipt_product_aliases
      WHERE raw_text = $1 AND canonical_id = $2 AND merchant_id IS NOT DISTINCT FROM $3::uuid
        AND match_type IN ('crowd', 'user_confirmed')`,
    [rawText, canonicalId, task.merchant_id]
  );
  const cleared = await db.query<{ id: number }>(
    `UPDATE receipt_line_items li
        SET canonical_id = NULL
       FROM receipts r
      WHERE r.receipt_id = li.receipt_id
        AND li.canonical_id = $2
        AND upper(btrim(li.raw_name)) = $1
        AND r.merchant_id IS NOT DISTINCT FROM $3::uuid
      RETURNING li.id`,
    [task.raw_text_norm, canonicalId, task.merchant_id]
  );
  await db.query(
    `UPDATE contribution_tasks SET status = 'void', resolution = NULL, resolved_at = now()
      WHERE id = $1 AND resolved_canonical_id = $2`,
    [input.taskId, canonicalId]
  );
  return { canonicalId, rowsCleared: cleared.rows.length };
}
