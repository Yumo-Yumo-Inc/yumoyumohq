/**
 * Generate Contribution Center tasks for missing pack / gramaj.
 *
 * Shelf products whose receipt string carries neither pack_size nor a size in
 * the name cannot be published as comparable unit prices. They are held as
 * MISSING_PACK in the clean ledger and asked here as product_pack_size tasks.
 *
 * Server-only.
 */

if (typeof window !== "undefined") {
  throw new Error("lib/contribution/build-pack-tasks is server-only.");
}

import { db } from "@/lib/db/client";
import {
  RETAIL_MERCHANT_CATEGORIES,
  TASK_TYPE_PACK_SIZE,
  taskPriority,
} from "@/config/contribution-center";
import { isGenericString } from "@/lib/contribution/build-tasks";
import {
  nameEncodesPackOrSize,
  needsCrowdPackHint,
  PACK_SIZE_CANDIDATE_CHIPS,
  parsePackCount,
} from "@/lib/receipt/pack-size";

export { TASK_TYPE_PACK_SIZE };

interface SubjectRow {
  raw_text_norm: string;
  sample_raw_text: string;
  merchant_id: string | null;
  merchant_label: string | null;
  row_count: number;
  merchant_count: number;
  price_median: string | number | null;
  currency: string | null;
  pack_size: string | null;
  unit_type: string | null;
}

function packCandidatesJson(): unknown[] {
  // Mix of common sizes; UI keys by label. canonical_id stays null — answers
  // use free_text / other so the answers CHECK constraint stays happy.
  const chips = PACK_SIZE_CANDIDATE_CHIPS.slice(0, 8);
  return chips.map((c, i) => ({
    canonical_id: null,
    label: c.label,
    pack_size: c.packSize,
    score: 1 - i * 0.01,
    via: "chip",
    added_by: null,
  }));
}

export async function buildPackSizeTasks(opts: {
  limit?: number;
} = {}): Promise<{ scanned: number; created: number; skipped: number }> {
  const limit = Math.max(1, Math.min(500, opts.limit ?? 120));
  const retail = [...RETAIL_MERCHANT_CATEGORIES];

  const { rows } = await db.query<SubjectRow>(
    `
    SELECT
      upper(btrim(li.raw_name)) AS raw_text_norm,
      max(li.raw_name) AS sample_raw_text,
      r.merchant_id,
      max(COALESCE(NULLIF(m.display_name, ''), r.merchant_name)) AS merchant_label,
      count(*)::int AS row_count,
      count(DISTINCT r.merchant_id)::int AS merchant_count,
      percentile_cont(0.5) WITHIN GROUP (
        ORDER BY COALESCE(li.unit_price_gross, li.unit_price)
      ) FILTER (WHERE COALESCE(li.unit_price_gross, li.unit_price) > 0) AS price_median,
      max(r.pricing_currency) AS currency,
      max(NULLIF(btrim(li.pack_size), '')) AS pack_size,
      max(NULLIF(btrim(li.unit_type), '')) AS unit_type
    FROM receipt_line_items li
    JOIN receipts r ON r.receipt_id = li.receipt_id
    LEFT JOIN merchants m ON m.id = r.merchant_id
    WHERE li.raw_name IS NOT NULL
      AND btrim(li.raw_name) <> ''
      AND COALESCE(r.merchant_category, 'grocery') = ANY($1::text[])
      AND COALESCE(li.line_kind, 'product') = 'product'
      AND NOT EXISTS (
        SELECT 1 FROM product_pack_hints h
         WHERE h.raw_text_norm = upper(btrim(li.raw_name))
      )
    GROUP BY upper(btrim(li.raw_name)), r.merchant_id
    HAVING count(*) >= 1
    ORDER BY count(*) DESC
    LIMIT $2
    `,
    [retail, limit * 4]
  );

  let created = 0;
  let skipped = 0;
  const candidates = packCandidatesJson();

  for (const sub of rows) {
    if (created >= limit) break;
    const sample = sub.sample_raw_text || sub.raw_text_norm;
    if (isGenericString(sample)) {
      skipped += 1;
      continue;
    }
    if (nameEncodesPackOrSize(sample) || parsePackCount(sub.pack_size) != null) {
      skipped += 1;
      continue;
    }
    if (
      !needsCrowdPackHint({
        name: sample,
        packSize: sub.pack_size,
        unitType: sub.unit_type,
      })
    ) {
      skipped += 1;
      continue;
    }

    const priority = taskPriority(sub.row_count, sub.merchant_count);
    try {
      const { rows: upserted } = await db.query<{ id: string }>(
        `
        INSERT INTO contribution_tasks (
          task_type, raw_text_norm, merchant_id, merchant_label, candidates,
          sample_raw_text, row_count, merchant_count, price_median, currency,
          priority, status, answers_count
        )
        VALUES (
          $1, $2, $3, $4, $5::jsonb, $6, $7, $8, $9, $10, $11, 'open', 0
        )
        ON CONFLICT (
          task_type,
          raw_text_norm,
          COALESCE(merchant_id, '00000000-0000-0000-0000-000000000000'::uuid)
        )
        DO UPDATE SET
          sample_raw_text = EXCLUDED.sample_raw_text,
          row_count = EXCLUDED.row_count,
          merchant_count = EXCLUDED.merchant_count,
          price_median = EXCLUDED.price_median,
          currency = EXCLUDED.currency,
          priority = EXCLUDED.priority,
          merchant_label = EXCLUDED.merchant_label,
          candidates = CASE
            WHEN contribution_tasks.status = 'open'
             AND contribution_tasks.answers_count = 0
            THEN EXCLUDED.candidates
            ELSE contribution_tasks.candidates
          END
        WHERE contribution_tasks.status = 'open'
        RETURNING id
        `,
        [
          TASK_TYPE_PACK_SIZE,
          sub.raw_text_norm,
          sub.merchant_id,
          sub.merchant_label,
          JSON.stringify(candidates),
          sample,
          sub.row_count,
          sub.merchant_count,
          sub.price_median,
          sub.currency,
          priority,
        ]
      );
      if (upserted.length > 0) created += 1;
      else skipped += 1;
    } catch (error) {
      console.warn(
        "[contribution/build-pack-tasks] upsert failed:",
        (error as Error).message
      );
      skipped += 1;
    }
  }

  return { scanned: rows.length, created, skipped };
}
