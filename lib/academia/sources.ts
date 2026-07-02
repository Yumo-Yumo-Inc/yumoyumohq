import "server-only";

/**
 * Academia paper — live source registry (Half A data).
 *
 * Reads the provenance behind the hidden-cost estimate straight from the tables
 * that feed the calculation: only verified rows surface, so approving a draft in
 * /api/admin/hidden-cost-data changes the paper with no redeploy (T3).
 *
 * Every query is defensive (tribe.ts pattern): a missing table/column degrades to
 * an empty group, never throws. No fabricated rows — a null source is skipped.
 */

import { getSql } from "@/lib/db/client";

const COUNTRY = "TR";

export interface SourceRow {
  source: string;
  sourceUrl: string | null;
  effectiveDate: string | null;
  confidence: string | null;
  count: number;
  scope: string[];
}

export type SourceGroupKey =
  | "tax"
  | "margins"
  | "costWeights"
  | "referencePrices"
  | "indices";

export interface SourceGroup {
  key: SourceGroupKey;
  rows: SourceRow[];
}

export interface AcademiaSources {
  groups: SourceGroup[];
  totalSources: number;
  lastUpdated: string | null;
}

function isoDate(v: unknown): string | null {
  if (!v) return null;
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  const s = String(v);
  return s.length >= 10 ? s.slice(0, 10) : s;
}

function cleanScope(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v.filter((x): x is string => typeof x === "string" && x.length > 0);
}

function toRow(r: Record<string, unknown>): SourceRow {
  return {
    source: String(r.source ?? ""),
    sourceUrl: r.source_url ? String(r.source_url) : null,
    effectiveDate: isoDate(r.effective_date),
    confidence: r.confidence ? String(r.confidence) : null,
    count: Number(r.count ?? 0),
    scope: cleanScope(r.scope),
  };
}

async function fetchTax(): Promise<SourceRow[]> {
  const sql = getSql();
  if (!sql) return [];
  try {
    const rows = (await sql`
      SELECT source,
             MAX(source_url)                                  AS source_url,
             TO_CHAR(MAX(effective_date), 'YYYY-MM-DD')       AS effective_date,
             MIN(confidence)                                  AS confidence,
             COUNT(*)::int                                    AS count,
             (ARRAY_AGG(DISTINCT split_part(rate_key, '.', 1)))[1:6] AS scope
      FROM tax_rates
      WHERE country = ${COUNTRY} AND is_verified = TRUE
      GROUP BY source
      ORDER BY MAX(effective_date) DESC NULLS LAST
    `) as Record<string, unknown>[];
    return rows.map(toRow);
  } catch {
    return [];
  }
}

async function fetchMargins(): Promise<SourceRow[]> {
  const sql = getSql();
  if (!sql) return [];
  try {
    const rows = (await sql`
      SELECT source,
             MAX(source_url)                            AS source_url,
             TO_CHAR(MAX(effective_date), 'YYYY-MM-DD') AS effective_date,
             MIN(confidence)                            AS confidence,
             COUNT(*)::int                              AS count,
             (ARRAY_AGG(DISTINCT category))[1:6] AS scope
      FROM commercial_margins
      WHERE country = ${COUNTRY} AND is_verified = TRUE
      GROUP BY source
      ORDER BY MAX(effective_date) DESC NULLS LAST
    `) as Record<string, unknown>[];
    return rows.map(toRow);
  } catch {
    return [];
  }
}

async function fetchCostWeights(): Promise<SourceRow[]> {
  const sql = getSql();
  if (!sql) return [];
  try {
    const rows = (await sql`
      SELECT source,
             MAX(source_url)                            AS source_url,
             TO_CHAR(MAX(effective_date), 'YYYY-MM-DD') AS effective_date,
             MIN(confidence)                            AS confidence,
             COUNT(*)::int                              AS count,
             (ARRAY_AGG(DISTINCT category))[1:8] AS scope
      FROM production_cost_weights
      WHERE country = ${COUNTRY} AND is_verified = TRUE
      GROUP BY source
      ORDER BY MAX(effective_date) DESC NULLS LAST
    `) as Record<string, unknown>[];
    return rows.map(toRow);
  } catch {
    return [];
  }
}

async function fetchReferencePrices(): Promise<SourceRow[]> {
  const sql = getSql();
  if (!sql) return [];
  const out: SourceRow[] = [];
  try {
    const rows = (await sql`
      SELECT source,
             MAX(year_month)        AS year_month,
             COUNT(*)::int          AS count,
             (ARRAY_AGG(DISTINCT category_tr))[1:6] AS scope
      FROM tuik_reference_prices
      GROUP BY source
      ORDER BY count DESC
    `) as Record<string, unknown>[];
    for (const r of rows) {
      const ym = r.year_month ? `${String(r.year_month)}-01` : null;
      out.push({
        source:
          String(r.source) === "TURKSTAT_AVG_PRICES_CSV"
            ? "TÜİK — Ortalama Perakende Fiyatlar"
            : String(r.source),
        sourceUrl: "https://veriportali.tuik.gov.tr",
        effectiveDate: isoDate(ym),
        confidence: "high",
        count: Number(r.count ?? 0),
        scope: cleanScope(r.scope),
      });
    }
  } catch {
    /* table optional */
  }
  try {
    const rows = (await sql`
      SELECT source,
             TO_CHAR(MAX(trade_date), 'YYYY-MM-DD') AS trade_date,
             COUNT(*)::int AS count
      FROM hks_hal_prices
      GROUP BY source
    `) as Record<string, unknown>[];
    for (const r of rows) {
      out.push({
        source:
          String(r.source) === "IZMIR_HAL_OPENDATA"
            ? "İzmir Hali — Açık Veri (toptan referans)"
            : String(r.source),
        sourceUrl: "https://acikveri.bizizmir.com",
        effectiveDate: isoDate(r.trade_date),
        confidence: "high",
        count: Number(r.count ?? 0),
        scope: [],
      });
    }
  } catch {
    /* table optional */
  }
  return out;
}

async function fetchIndices(): Promise<SourceRow[]> {
  const sql = getSql();
  if (!sql) return [];
  try {
    // Only the headline series the hidden-cost models read live (TÜFE / Yİ-ÜFE).
    // Other series (rent forecasts, niche indices) carry off-cadence dates and
    // would otherwise pollute the registry and the "last updated" line.
    const rows = (await sql`
      SELECT index_type,
             COUNT(DISTINCT series)::int AS series_count,
             MAX(year_month)             AS year_month
      FROM economic_indices
      WHERE country = ${COUNTRY} AND index_type IN ('CPI', 'PPI')
      GROUP BY index_type
      ORDER BY index_type
    `) as Record<string, unknown>[];
    return rows
      .filter((r) => Number(r.series_count ?? 0) > 0)
      .map((r) => {
        const ym = r.year_month ? `${String(r.year_month)}-01` : null;
        const type = String(r.index_type);
        return {
          source:
            type === "CPI"
              ? "TÜİK — Tüketici Fiyat Endeksi (TÜFE)"
              : type === "PPI"
                ? "TÜİK — Yurt İçi Üretici Fiyat Endeksi (Yİ-ÜFE)"
                : `TÜİK — ${type}`,
          sourceUrl: "https://data.tuik.gov.tr",
          effectiveDate: isoDate(ym),
          confidence: "high",
          count: Number(r.series_count ?? 0),
          scope: [],
        } satisfies SourceRow;
      });
  } catch {
    return [];
  }
}

export async function getAcademiaSources(): Promise<AcademiaSources> {
  const [tax, margins, costWeights, referencePrices, indices] = await Promise.all([
    fetchTax(),
    fetchMargins(),
    fetchCostWeights(),
    fetchReferencePrices(),
    fetchIndices(),
  ]);

  const allGroups: SourceGroup[] = [
    { key: "tax", rows: tax },
    { key: "margins", rows: margins },
    { key: "costWeights", rows: costWeights },
    { key: "referencePrices", rows: referencePrices },
    { key: "indices", rows: indices },
  ];
  const groups = allGroups.filter((grp) => grp.rows.length > 0);

  // "Last updated" should never read a future date (some series carry forecast
  // periods). Cap at today.
  const todayIso = new Date().toISOString().slice(0, 10);
  const distinct = new Set<string>();
  let last: string | null = null;
  for (const grp of groups) {
    for (const r of grp.rows) {
      if (r.source) distinct.add(r.source);
      if (r.effectiveDate && r.effectiveDate <= todayIso && (!last || r.effectiveDate > last)) {
        last = r.effectiveDate;
      }
    }
  }

  return { groups, totalSources: distinct.size, lastUpdated: last };
}
