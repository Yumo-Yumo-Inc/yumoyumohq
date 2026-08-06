/**
 * PBS (Pakistan Bureau of Statistics) → monthly CPI by COICOP division ETL.
 *
 * PBS publishes the CPI as a static SDMX 2.1 StructureSpecificData file on the IMF
 * ECOFIN_DSD structure, refreshed monthly. It carries the headline index
 * (INDICATOR="PCPI_IX") and all twelve COICOP divisions ("PCPI_CP_01_IX" …
 * "PCPI_CP_12_IX"), base 2015/2016 = 100. Weight series (*_WT) are ignored.
 *
 * Source: https://www.pbs.gov.pk/wp-content/uploads/2020/07/CPI.xml
 *
 * History starts 2022-07, which is ample for the 12-month comparison the hidden-cost
 * engine needs. Parsing is regex-based over the flat <Series>/<Obs> shape rather than
 * a full XML parser: the file has one fixed layout and no nested content.
 */

import {
  normalizeToBaseline,
  upsertIndices,
  summarizeRows,
  type EtlIndexRow,
  type EtlResult,
} from "./etl-helpers";

const SOURCE = "PBS_SDMX_CPI";
const XML_URL = "https://www.pbs.gov.pk/wp-content/uploads/2020/07/CPI.xml";

/** SDMX INDICATOR code → canonical CPI series, or null for series we do not store. */
function toCanonicalSeries(indicator: string): string | null {
  if (indicator === "PCPI_IX") return "GENEL";
  const match = /^PCPI_CP_(0[1-9]|1[0-2])_IX$/.exec(indicator);
  return match ? match[1] : null;
}

async function fetchDivisionSeries(): Promise<Map<string, Map<string, number>>> {
  const res = await fetch(XML_URL, {
    headers: { "User-Agent": "YumoYumo data bot (compliance@yumoyumo.com)", Accept: "application/xml" },
    signal: AbortSignal.timeout(60_000),
    redirect: "follow",
  });
  if (!res.ok) throw new Error(`PBS CPI fetch failed: HTTP ${res.status}`);
  const xml = await res.text();

  const bySeries = new Map<string, Map<string, number>>();
  const seriesBlocks = xml.matchAll(/<Series ([^>]*)>([\s\S]*?)<\/Series>/g);
  for (const [, attributes, body] of seriesBlocks) {
    const indicator = /INDICATOR="([^"]+)"/.exec(attributes)?.[1];
    if (!indicator) continue;
    const series = toCanonicalSeries(indicator);
    if (!series) continue;

    const months = new Map<string, number>();
    for (const [, period, raw] of body.matchAll(/TIME_PERIOD="([^"]+)" OBS_VALUE="([^"]+)"/g)) {
      if (!/^\d{4}-\d{2}$/.test(period)) continue;
      const value = Number(raw);
      if (!Number.isFinite(value) || value <= 0) continue;
      months.set(period, value);
    }
    if (months.size > 0) bySeries.set(series, months);
  }
  return bySeries;
}

/** Pakistan CPI ETL: division index → 2025-01 = 1.0 → economic_indices. */
export async function runPbsCpiEtl(opts: {
  country?: string;
  since?: string;
  dryRun?: boolean;
}): Promise<EtlResult> {
  const country = opts.country ?? "PK";
  const bySeries = await fetchDivisionSeries();

  const rows: EtlIndexRow[] = [];
  for (const [series, rawByMonth] of bySeries) {
    for (const [yearMonth, value] of normalizeToBaseline(rawByMonth)) {
      if (opts.since && yearMonth < opts.since) continue;
      rows.push({ country, indexType: "CPI", series, yearMonth, value, source: SOURCE, isVerified: true });
    }
  }

  const written = opts.dryRun ? 0 : await upsertIndices(rows);
  return summarizeRows(rows, written, Boolean(opts.dryRun));
}
