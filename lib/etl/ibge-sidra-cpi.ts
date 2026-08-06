/**
 * IBGE SIDRA (Brazil) → monthly CPI (IPCA) by expenditure group ETL.
 *
 * SIDRA table 7060 publishes the IPCA by grupo via classification c315. The table
 * exposes percentage variations only — there is no index-number variable — so we
 * chain the monthly variation (v/63) into an index series ourselves. The chain's
 * starting level is arbitrary because normalizeToBaseline rebases everything to
 * 2025-01 = 1.0; only the ratios matter.
 *
 * Source: https://apisidra.ibge.gov.br/values/t/7060/n1/all/v/63/p/all/c315/<codes>
 *
 * IBGE's 9 groups are a Brazilian expenditure classification, not literal COICOP.
 * The mapping below covers the groups whose scope matches a COICOP division closely
 * enough to price a line against. Groups without a safe counterpart are skipped
 * rather than forced — a wrong division is worse than falling back to headline CPI:
 *   - "Alimentação e bebidas" bundles restaurant meals with groceries, so it feeds
 *     division 01 only; division 11 (restaurants) is left to headline CPI.
 *   - "Despesas pessoais" and "Saúde e cuidados pessoais" mix divisions 06/09/12,
 *     so neither is mapped.
 */

import {
  normalizeToBaseline,
  upsertIndices,
  summarizeRows,
  type EtlIndexRow,
  type EtlResult,
} from "./etl-helpers";

const SOURCE = "IBGE_SIDRA_IPCA";

/** SIDRA c315 group code → canonical CPI series. Unmapped groups are not fetched. */
const GROUP_TO_SERIES: Record<string, string> = {
  "7169": "GENEL", // Índice geral
  "7170": "01",    // Alimentação e bebidas → food and non-alcoholic beverages
  "7445": "04",    // Habitação → housing, water, electricity, gas
  "7486": "05",    // Artigos de residência → furnishings, household equipment
  "7558": "03",    // Vestuário → clothing and footwear
  "7625": "07",    // Transportes → transport
  "7766": "10",    // Educação → education
  "7786": "08",    // Comunicação → communication
};

interface SidraRow { D3C?: string; D4C?: string; V?: string }

/** Fetches monthly % change per group and chains it into an index level series. */
async function fetchChainedIndex(): Promise<Map<string, Map<string, number>>> {
  const codes = Object.keys(GROUP_TO_SERIES).join(",");
  const url = `https://apisidra.ibge.gov.br/values/t/7060/n1/all/v/63/p/all/c315/${codes}`;
  const res = await fetch(url, {
    headers: { "User-Agent": "YumoYumo data bot (compliance@yumoyumo.com)", Accept: "application/json" },
    signal: AbortSignal.timeout(90_000),
  });
  if (!res.ok) throw new Error(`SIDRA IPCA fetch failed: HTTP ${res.status}`);
  const json = (await res.json()) as SidraRow[];

  // Monthly percentage changes per series, keyed by month.
  const pctBySeries = new Map<string, Map<string, number>>();
  for (const row of json.slice(1)) { // row 0 is the header descriptor
    const series = GROUP_TO_SERIES[String(row.D4C ?? "")];
    const period = String(row.D3C ?? "");
    if (!series || !/^\d{6}$/.test(period)) continue;
    const pct = Number(row.V);
    if (!Number.isFinite(pct)) continue; // "..." / "-" for suppressed months
    const yearMonth = `${period.slice(0, 4)}-${period.slice(4, 6)}`;
    let months = pctBySeries.get(series);
    if (!months) { months = new Map(); pctBySeries.set(series, months); }
    months.set(yearMonth, pct);
  }

  // Chain into an index. A gap in the middle would silently distort every later
  // month, so chaining stops at the first missing month and keeps what it has.
  const bySeries = new Map<string, Map<string, number>>();
  for (const [series, pctByMonth] of pctBySeries) {
    const months = [...pctByMonth.keys()].sort();
    const index = new Map<string, number>();
    let level = 100;
    let previous: string | null = null;
    for (const yearMonth of months) {
      if (previous && monthsBetween(previous, yearMonth) !== 1) break;
      level *= 1 + pctByMonth.get(yearMonth)! / 100;
      index.set(yearMonth, level);
      previous = yearMonth;
    }
    bySeries.set(series, index);
  }
  return bySeries;
}

/** Whole months from `a` to `b` (both "YYYY-MM"). */
function monthsBetween(a: string, b: string): number {
  const [ay, am] = a.split("-").map(Number);
  const [by, bm] = b.split("-").map(Number);
  return (by - ay) * 12 + (bm - am);
}

/** Brazil CPI ETL: chained IPCA group index → 2025-01 = 1.0 → economic_indices. */
export async function runIbgeSidraCpiEtl(opts: {
  country?: string;
  since?: string;
  dryRun?: boolean;
}): Promise<EtlResult> {
  const country = opts.country ?? "BR";
  const bySeries = await fetchChainedIndex();

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
