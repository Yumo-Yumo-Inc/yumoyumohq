/**
 * Sector hidden-cost benchmark read layer.
 *
 * Feeds the "Sector comparison" card on the results screen. Returns only the
 * row where is_verified=TRUE with the most recent effective_date. Returns null
 * if no data exists — the card is not shown (no fabricated data).
 *
 * This file never writes data: a sourced draft is written via
 * `scripts/insert-sector-benchmark-draft.ts`, and an admin approves it via
 * `/api/admin/sector-benchmark` PATCH.
 */

import { getSql } from "@/lib/db/client";

export interface SectorBenchmark {
  /** Sector-average hidden-cost ratio (% of amount paid, 0-100). */
  ratioPct: number;
  /** Source institution + citation (required). */
  source: string;
  sourceUrl: string | null;
  /** ISO date (effective date). */
  effectiveDate: string;
}

/**
 * Returns the verified sector benchmark for a category + country.
 * Returns null if not found (the card is hidden). Defensive: returns null if
 * the DB is unavailable or on error.
 */
export async function getSectorBenchmark(
  category: string | null | undefined,
  country = "TR"
): Promise<SectorBenchmark | null> {
  const cat = (category ?? "").trim();
  if (!cat) return null;

  const sql = getSql();
  if (!sql) return null;

  const cc = country.trim().toUpperCase().slice(0, 2) || "TR";

  try {
    const rows = (await sql`
      SELECT hidden_ratio_pct, source, source_url, effective_date
      FROM sector_hidden_cost_benchmark
      WHERE country = ${cc}
        AND category = ${cat}
        AND is_verified = TRUE
        AND effective_date <= CURRENT_DATE
      ORDER BY effective_date DESC
      LIMIT 1
    `) as Array<{
      hidden_ratio_pct: number | string;
      source: string;
      source_url: string | null;
      effective_date: string | Date;
    }>;

    if (!rows.length) return null;
    const r = rows[0];
    const ratio = Number(r.hidden_ratio_pct);
    if (!Number.isFinite(ratio)) return null;

    const effDate =
      r.effective_date instanceof Date
        ? r.effective_date.toISOString().slice(0, 10)
        : String(r.effective_date).slice(0, 10);

    return {
      ratioPct: Math.max(0, Math.min(100, ratio)),
      source: r.source,
      sourceUrl: r.source_url ?? null,
      effectiveDate: effDate,
    };
  } catch (error) {
    console.error("[sector-benchmark] read error:", error);
    return null;
  }
}
