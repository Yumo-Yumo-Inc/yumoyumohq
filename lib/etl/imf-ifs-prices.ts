/**
 * IMF IFS → monthly CPI (PCPI_IX) ETL — generic country source (via DBnomics).
 *
 * IMF International Financial Statistics publishes monthly headline CPI (PCPI_IX)
 * for most countries. We fetch it from DBnomics' stable JSON API rather than IMF's
 * legacy SDMX service (dataservices.imf.org) — the old IMF endpoint was retired
 * (HTTP 000). DBnomics re-serves the same IMF/IFS series; no key required.
 *
 * Provides headline CPI only (no COICOP sub-breakdown) — so it fills the GENEL
 * series; category-level breakdown requires national/PPI sources.
 *
 * Series code: `M.<ISO2>.PCPI_IX` (DBnomics IMF/IFS REF_AREA = ISO 3166 alpha-2;
 * NOT the alpha-3 used by the old SDMX service). An out-of-scope country (e.g. TM)
 * returns 404 → empty result, the cron skips the country (no fabrication).
 */

import {
  normalizeToBaseline,
  upsertIndices,
  summarizeRows,
  BASELINE_MONTH,
  type EtlIndexRow,
  type EtlResult,
} from "./etl-helpers";

const SOURCE = "IMF_IFS";
// DBnomics series endpoint: /v22/series/<provider>/<dataset>/<series_code>
const BASE = "https://api.db.nomics.world/v22/series/IMF/IFS";

/**
 * DBnomics' REF_AREA matches the ISO2 code for most countries, so we use the
 * country code directly by default. Exceptions go here only for countries where
 * DBnomics uses a different code (not needed currently; all target countries
 * resolve via ISO2).
 */
const REF_AREA_OVERRIDE: Record<string, string> = {};

/** DBnomics series response: parallel period[] + value[] arrays. */
interface DbnomicsDoc {
  period?: string[];
  value?: (number | string | null)[];
}
interface DbnomicsResponse {
  series?: { docs?: DbnomicsDoc[] };
}

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

/**
 * Resilient fetch from DBnomics. Retries with exponential backoff on 429 (burst
 * rate-limit) and 5xx/network errors (honors the Retry-After header if present).
 * Returns null immediately on 404 (out-of-scope country) — no retry. Needed so
 * bulk backfills don't silently write empty results when consecutive requests
 * hit DBnomics' burst limit.
 */
async function fetchDbnomics(url: string, tries = 4): Promise<DbnomicsResponse | null> {
  let backoff = 1500;
  for (let attempt = 1; attempt <= tries; attempt++) {
    try {
      const res = await fetch(url, {
        headers: { "User-Agent": "Mozilla/5.0 (compatible; YumoDataBot/1.0)", Accept: "application/json" },
        signal: AbortSignal.timeout(30_000),
      });
      if (res.ok) return (await res.json()) as DbnomicsResponse;
      if (res.status === 404) return null; // out-of-scope country — no data, retry is pointless
      if (res.status === 429 || res.status >= 500) {
        if (attempt === tries) return null;
        const retryAfter = Number(res.headers.get("retry-after"));
        const waitMs = Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter * 1000 : backoff;
        await sleep(waitMs);
        backoff *= 2;
        continue;
      }
      return null; // other 4xx — retry is pointless
    } catch {
      if (attempt === tries) return null; // network/timeout
      await sleep(backoff);
      backoff *= 2;
    }
  }
  return null;
}

export async function runImfIfsEtl(opts: {
  country: string;
  since?: string;
  dryRun?: boolean;
}): Promise<EtlResult> {
  const country = opts.country.toUpperCase();
  const area = REF_AREA_OVERRIDE[country] ?? country;
  const since = opts.since ?? BASELINE_MONTH;
  const dryRun = opts.dryRun ?? false;

  const url = `${BASE}/M.${area}.PCPI_IX?observations=1`;
  const raw = new Map<string, number>();
  const json = await fetchDbnomics(url);
  if (json) {
    const doc = json.series?.docs?.[0];
    const periods = doc?.period ?? [];
    const values = doc?.value ?? [];
    const n = Math.min(periods.length, values.length);
    for (let i = 0; i < n; i++) {
      const ym = periods[i];
      const v = Number(values[i]);
      if (ym && /^\d{4}-\d{2}$/.test(ym) && ym >= since && Number.isFinite(v) && v > 0) {
        raw.set(ym, v);
      }
    }
  }

  const norm = normalizeToBaseline(raw);
  const rows: EtlIndexRow[] = [];
  for (const [ym, v] of norm) {
    rows.push({ country, indexType: "CPI", series: "GENEL", yearMonth: ym, value: v, source: SOURCE, isVerified: true });
  }

  const written = dryRun ? 0 : await upsertIndices(rows);
  return summarizeRows(rows, written, dryRun);
}

export { SOURCE as IMF_IFS_SOURCE };
