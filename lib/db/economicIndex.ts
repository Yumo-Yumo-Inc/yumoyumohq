/**
 * Economic index database functions
 * 
 * Provides functions to lookup and manage economic indices from database
 */

import { db, withConnectionRetry } from "./client";
import { CountryCode } from "@/lib/mining/types";
import { EconomicIndexType } from "@/lib/mining/economicIndex";

export interface EconomicIndexRow {
  country: string;
  index_type: string;
  year_month: string;
  value: number;
  source?: string;
}

/**
 * Get economic index from database
 * Falls back to latest value before requested month if exact match not found
 * 
 * @param country - Country code (e.g., "TR", "US")
 * @param indexType - Type of index (CPI, FUEL, LABOR, RENT, DIGITAL)
 * @param yearMonth - Time period in "YYYY-MM" format
 * @returns Normalized index value (1.0 = reference baseline) or null if not found
 */
/**
 * Get economic index from DB with optional series (for TÜFE/ÜFE category-level).
 * @param series - Use '' for aggregate (legacy), or e.g. '01', 'GENEL', 'ARM' for category series
 */
// In-memory cache — economic indices update about once a month, so a daily TTL is safe.
// The pipeline runs 4 separate index queries per receipt, so this cache gives a large speedup.
const economicIndexCache = new Map<string, { value: number | null; expiresAt: number }>();
const ECONOMIC_INDEX_CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

function getCacheKey(country: string, indexType: string, yearMonth: string, series: string): string {
  return `${country}|${indexType}|${series}|${yearMonth}`;
}

export async function getEconomicIndexFromDB(
  country: CountryCode,
  indexType: EconomicIndexType,
  yearMonth: string,
  series: string = ""
): Promise<number | null> {
  const seriesVal = series || "";
  const cacheKey = getCacheKey(country, indexType, yearMonth, seriesVal);

  // In-memory cache lookup — return directly if the TTL hasn't expired.
  const cached = economicIndexCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.value;
  }

  try {
    const { getSql } = await import('@/lib/db/client');
    const sql = getSql();
    if (!sql) {
      console.error(`[getEconomicIndexFromDB] SQL client not available`);
      return null;
    }

    // SINGLE QUERY — if there's no exact match, prefer before, then after.
    // The old code ran 3-5 sequential queries (debug COUNT + DISTINCT + exact + before + after).
    // Picks the closest row by ABS(year_month <-> yearMonth) distance; before is
    // preferred (economic indices can't forecast future months).
    const result = await withConnectionRetry(() => sql`
      WITH ranked AS (
        SELECT
          value,
          year_month,
          CASE
            WHEN year_month = ${yearMonth} THEN 0
            WHEN year_month <= ${yearMonth} THEN 1
            ELSE 2
          END AS priority,
          ABS(EXTRACT(YEAR FROM (year_month || '-01')::date) * 12
              + EXTRACT(MONTH FROM (year_month || '-01')::date)
              - EXTRACT(YEAR FROM (${yearMonth} || '-01')::date) * 12
              - EXTRACT(MONTH FROM (${yearMonth} || '-01')::date)) AS distance
        FROM economic_indices
        WHERE country = ${country}
          AND index_type = ${indexType}
          AND COALESCE(series, '') = ${seriesVal}
      )
      SELECT value, year_month, priority, distance
      FROM ranked
      ORDER BY priority ASC, distance ASC, year_month DESC
      LIMIT 1
    `);

    if (result.length > 0) {
      const value = Number(result[0].value);
      // Cache it. Even a null result can be cached (with the 24h TTL).
      economicIndexCache.set(cacheKey, { value, expiresAt: Date.now() + ECONOMIC_INDEX_CACHE_TTL_MS });
      return value;
    }

    // No data at all — cache the null too (still 24h, to avoid hammering the hot path).
    economicIndexCache.set(cacheKey, { value: null, expiresAt: Date.now() + ECONOMIC_INDEX_CACHE_TTL_MS });
    return null;
  } catch (error) {
    console.error(`[getEconomicIndexFromDB] Error:`, error);
    return null;
  }
}

/**
 * For test/debug use: clears the cache. Not called in production.
 */
export function clearEconomicIndexCache(): void {
  economicIndexCache.clear();
}

/**
 * Bulk insert economic indices (for ETL/cron jobs)
 * 
 * @param indices - Array of economic index data to insert
 */
export async function insertEconomicIndices(
  indices: Array<{
    country: CountryCode;
    indexType: EconomicIndexType;
    yearMonth: string;
    value: number;
    series?: string;
    source?: string;
    sourceUrl?: string;
    isVerified?: boolean;
  }>
): Promise<void> {
  if (indices.length === 0) return;

  const { getSql } = await import('@/lib/db/client');
  const sql = getSql();
  if (!sql) {
    throw new Error("Database connection not available");
  }

  try {
    const BATCH_SIZE = 50;
    let inserted = 0;
    const now = new Date();

    for (let i = 0; i < indices.length; i += BATCH_SIZE) {
      const batch = indices.slice(i, i + BATCH_SIZE);
      await sql`BEGIN`;
      try {
        for (const idx of batch) {
          await sql`
            INSERT INTO economic_indices (country, index_type, year_month, value, series, source, source_url, fetch_date, is_verified)
            VALUES (
              ${idx.country},
              ${idx.indexType},
              ${idx.yearMonth},
              ${idx.value},
              ${idx.series ?? ""},
              ${idx.source ?? null},
              ${idx.sourceUrl ?? null},
              ${now},
              ${idx.isVerified ?? false}
            )
            ON CONFLICT (country, index_type, series, year_month)
            DO UPDATE SET
              value = EXCLUDED.value,
              source = EXCLUDED.source,
              source_url = EXCLUDED.source_url,
              fetch_date = EXCLUDED.fetch_date,
              is_verified = EXCLUDED.is_verified,
              updated_at = CURRENT_TIMESTAMP
          `;
        }
        await sql`COMMIT`;
      } catch (batchErr) {
        await sql`ROLLBACK`;
        throw batchErr;
      }
      inserted += batch.length;
      if (inserted % 500 === 0 || inserted === indices.length) {
        console.log(`  Progress: ${inserted}/${indices.length}...`);
      }
    }

    console.log(`[insertEconomicIndices] Inserted ${indices.length} indices`);
  } catch (error) {
    await sql`ROLLBACK`;
    console.error(`[insertEconomicIndices] Error:`, error);
    throw error;
  }
}

/**
 * Log ETL job execution
 */
export async function logETLJob(
  jobName: string,
  status: "running" | "success" | "failed" | "skipped",
  recordsUpdated: number = 0,
  errorMessage?: string,
  executionTimeMs?: number
): Promise<void> {
  try {
    if (status === "running") {
      // Insert new running job
      await db.query(
        `INSERT INTO etl_job_logs (job_name, status, records_updated, started_at)
         VALUES ($1, $2, $3, CURRENT_TIMESTAMP)`,
        [jobName, status, recordsUpdated]
      );
    } else {
      // Update existing job or insert completed job
      await db.query(
        `INSERT INTO etl_job_logs (job_name, status, records_updated, error_message, execution_time_ms, started_at, completed_at)
         VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
         ON CONFLICT DO NOTHING`,
        [jobName, status, recordsUpdated, errorMessage || null, executionTimeMs || null]
      );
    }
  } catch (error) {
    console.error(`[logETLJob] Error:`, error);
    // Don't throw - logging failure shouldn't break ETL
  }
}
