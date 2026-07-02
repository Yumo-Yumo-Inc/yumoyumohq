/**
 * Shared helpers for multi-country economic-index ETL jobs.
 *
 * Every country adapter (eurostat, imf, national sources) uses these helpers:
 *   - normalizeToBaseline: rebases a raw series to 2025-01 = 1.0.
 *   - forwardFillQuarterly: forward-fills a quarterly series into a monthly series.
 *   - upsertIndices: idempotent upsert into economic_indices, including is_interpolated.
 *   - summarizeRows: standard ETL result (prepared/written/seriesCount/...).
 *
 * Series codes follow the canonical schema (CPI=COICOP, PPI=ISIC); each adapter
 * converts its source codes to this schema before passing them here.
 */

import { getSql } from "@/lib/db/client";

export const BASELINE_MONTH = "2025-01";

export interface EtlIndexRow {
  country: string;
  indexType: "CPI" | "PPI";
  series: string;
  yearMonth: string;
  value: number;
  source: string;
  isVerified: boolean;
  isInterpolated?: boolean;
}

export interface EtlResult {
  prepared: number;
  written: number;
  seriesCount: number;
  latestMonth: string | null;
  samples: Array<{ series: string; yearMonth: string; value: number }>;
  dryRun: boolean;
}

/**
 * Normalizes a month→raw-value map to a 2025-01 = 1.0 base.
 * Returns an empty map if the baseline month is missing (no fabrication — a series
 * that can't be normalized is skipped).
 */
export function normalizeToBaseline(
  rawByMonth: Map<string, number>,
  baseline: string = BASELINE_MONTH
): Map<string, number> {
  const base = rawByMonth.get(baseline);
  const out = new Map<string, number>();
  if (!base || !Number.isFinite(base) || base <= 0) return out;
  for (const [ym, v] of rawByMonth) {
    if (Number.isFinite(v) && v > 0) out.set(ym, v / base);
  }
  return out;
}

/**
 * Forward-fills quarterly values (YYYY-Q1/2/3/4 → month map) across the quarter's 3 months.
 * `quarterByYm` keys must be the quarter's last month ("YYYY-03", "-06", "-09", "-12").
 * All returned values must be marked is_interpolated=true (the caller's responsibility).
 */
export function forwardFillQuarterly(quarterByYm: Map<string, number>): Map<string, number> {
  const out = new Map<string, number>();
  for (const [ym, v] of quarterByYm) {
    const [y, m] = ym.split("-").map(Number);
    if (!y || !m) continue;
    // The quarter's last month → that month and the two preceding months get the same value.
    for (let d = 0; d < 3; d++) {
      const mm = m - d;
      if (mm < 1) continue;
      out.set(`${y}-${String(mm).padStart(2, "0")}`, v);
    }
  }
  return out;
}

/** Idempotent batch upsert into economic_indices, including is_interpolated. Returns the number of rows written. */
export async function upsertIndices(rows: EtlIndexRow[]): Promise<number> {
  if (rows.length === 0) return 0;
  const sql = getSql();
  if (!sql) throw new Error("DB bağlantısı kurulamadı");

  const BATCH = 50;
  let written = 0;
  for (let i = 0; i < rows.length; i += BATCH) {
    const batch = rows.slice(i, i + BATCH);
    await sql`BEGIN`;
    try {
      for (const r of batch) {
        await sql`
          INSERT INTO economic_indices
            (country, index_type, series, year_month, value, source, is_verified, is_interpolated, fetch_date)
          VALUES
            (${r.country}, ${r.indexType}, ${r.series}, ${r.yearMonth},
             ${r.value}, ${r.source}, ${r.isVerified}, ${r.isInterpolated ?? false}, now())
          ON CONFLICT (country, index_type, series, year_month) DO UPDATE SET
            value = EXCLUDED.value,
            source = EXCLUDED.source,
            is_verified = EXCLUDED.is_verified,
            is_interpolated = EXCLUDED.is_interpolated,
            fetch_date = EXCLUDED.fetch_date,
            updated_at = now()
        `;
      }
      await sql`COMMIT`;
    } catch (err) {
      await sql`ROLLBACK`;
      throw err;
    }
    written += batch.length;
  }
  return written;
}

/** Produces the standard ETL result from rows (written=0 when dryRun). */
export function summarizeRows(rows: EtlIndexRow[], written: number, dryRun: boolean): EtlResult {
  const latestMonth = rows.reduce<string | null>(
    (max, r) => (max === null || r.yearMonth > max ? r.yearMonth : max),
    null
  );
  const samples = rows
    .slice()
    .sort((a, b) =>
      a.yearMonth < b.yearMonth ? 1 : a.yearMonth > b.yearMonth ? -1 : a.series.localeCompare(b.series)
    )
    .slice(0, 20)
    .map((r) => ({ series: r.series, yearMonth: r.yearMonth, value: r.value }));
  return {
    prepared: rows.length,
    written,
    seriesCount: new Set(rows.map((r) => r.series)).size,
    latestMonth,
    samples,
    dryRun,
  };
}
