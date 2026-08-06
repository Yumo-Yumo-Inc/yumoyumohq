/**
 * DOSM (Department of Statistics Malaysia) → monthly CPI by COICOP division ETL.
 *
 * OpenDOSM publishes the Malaysian CPI as an open, unauthenticated CSV covering
 * MCOICOP divisions 01–13 plus "overall", monthly, base 2010 = 100. Unlike IMF IFS
 * (headline only, 12–14 months behind), this gives the division-level breakdown the
 * hidden-cost engine needs to price a line against ITS OWN spending group.
 *
 * Source: https://storage.dosm.gov.my/cpi/cpi_2d.csv
 *   columns: date (YYYY-MM-01), division ("overall" | "01".."13"), index
 *
 * MCOICOP follows COICOP 2018, whose tail differs from the COICOP 1999 numbering our
 * canonical schema uses (Eurostat/TÜİK): source 12 is "Financial Services" and source
 * 13 is "Personal Care, Social Protection and Miscellaneous". Canonical 12 means the
 * latter, so 13 is remapped to 12 and source 12 is dropped — financial services have
 * no canonical counterpart, and a wrong division is worse than a missing one since
 * the engine falls back to headline CPI.
 *
 * Each series is normalized to the 2025-01 = 1.0 baseline and upserted into
 * economic_indices, exactly like the Eurostat and IMF adapters.
 */

import {
  normalizeToBaseline,
  upsertIndices,
  summarizeRows,
  type EtlIndexRow,
  type EtlResult,
} from "./etl-helpers";

const SOURCE = "DOSM_OPENDOSM";
const CSV_URL = "https://storage.dosm.gov.my/cpi/cpi_2d.csv";

/** Canonical CPI series code for a DOSM division value, or null when out of schema. */
function toCanonicalSeries(division: string): string | null {
  const value = division.trim().toLowerCase();
  if (value === "overall") return "GENEL";
  if (value === "12") return null; // COICOP 2018 financial services — no counterpart
  if (value === "13") return "12"; // personal care & miscellaneous → canonical 12
  return /^(0[1-9]|1[01])$/.test(value) ? value : null;
}

/**
 * Fetches the OpenDOSM CPI CSV and returns series code → (month → raw index).
 * A malformed row is skipped; a fetch failure throws so the cron records the
 * country as failed instead of silently writing nothing.
 */
async function fetchDivisionSeries(): Promise<Map<string, Map<string, number>>> {
  const res = await fetch(CSV_URL, {
    headers: { "User-Agent": "YumoYumo data bot (compliance@yumoyumo.com)", Accept: "text/csv" },
    signal: AbortSignal.timeout(60_000),
  });
  if (!res.ok) throw new Error(`OpenDOSM CPI fetch failed: HTTP ${res.status}`);
  const csv = await res.text();

  const bySeries = new Map<string, Map<string, number>>();
  const lines = csv.split("\n");
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const [date, division, index] = line.split(",");
    if (!date || !division || !index) continue;

    const series = toCanonicalSeries(division);
    if (!series) continue; // MCOICOP-only division (13) — no canonical counterpart
    const yearMonth = date.slice(0, 7);
    if (!/^\d{4}-\d{2}$/.test(yearMonth)) continue;
    const value = Number(index);
    if (!Number.isFinite(value) || value <= 0) continue;

    let months = bySeries.get(series);
    if (!months) { months = new Map(); bySeries.set(series, months); }
    months.set(yearMonth, value);
  }
  return bySeries;
}

/**
 * Malaysia CPI ETL: division-level index → 2025-01 = 1.0 → economic_indices.
 * `since` filters the written months; the full history is still fetched because
 * the baseline month must be present for normalization.
 */
export async function runDosmCpiEtl(opts: {
  country?: string;
  since?: string;
  dryRun?: boolean;
}): Promise<EtlResult> {
  const country = opts.country ?? "MY";
  const since = opts.since;
  const bySeries = await fetchDivisionSeries();

  const rows: EtlIndexRow[] = [];
  for (const [series, rawByMonth] of bySeries) {
    const normalized = normalizeToBaseline(rawByMonth);
    // An un-normalizable series (baseline month absent) is skipped, not guessed.
    for (const [yearMonth, value] of normalized) {
      if (since && yearMonth < since) continue;
      rows.push({
        country,
        indexType: "CPI",
        series,
        yearMonth,
        value,
        source: SOURCE,
        isVerified: true,
      });
    }
  }

  const written = opts.dryRun ? 0 : await upsertIndices(rows);
  return summarizeRows(rows, written, Boolean(opts.dryRun));
}
