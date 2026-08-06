/**
 * PSA (Philippine Statistics Authority) → monthly CPI by COICOP division ETL.
 *
 * PSA serves the CPI through OpenSTAT, a standard PxWeb v1 API: GET returns table
 * metadata, POST returns the data for a selection. We request the national figure
 * ("PHILIPPINES") for the thirteen COICOP-2018 divisions, all years, months Jan–Dec
 * (the "Ave" period is an annual average and is excluded).
 *
 * Source: https://openstat.psa.gov.ph/PXWeb/api/v1/en/DB/2M/PI/CPI/2018NEW/0012M4ACP22.px
 *
 * PSA publishes COICOP 2018, whose tail differs from the COICOP 1999 numbering our
 * canonical schema uses: source 12 is "Financial Services" and source 13 is "Personal
 * Care, and Miscellaneous Goods and Services". Canonical 12 means the latter, so 13 is
 * remapped to 12 and source 12 is dropped rather than mis-filed.
 *
 * PxWeb value codes are positional indices into the table's variable lists, not the
 * COICOP codes themselves, so the commodity selection is resolved from the metadata at
 * runtime — the codes shift whenever PSA republishes the table.
 */

import {
  normalizeToBaseline,
  upsertIndices,
  summarizeRows,
  type EtlIndexRow,
  type EtlResult,
} from "./etl-helpers";

const SOURCE = "PSA_OPENSTAT";
const TABLE_URL =
  "https://openstat.psa.gov.ph/PXWeb/api/v1/en/DB/2M/PI/CPI/2018NEW/0012M4ACP22.px";

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

interface PxVariable { code: string; text: string; values: string[]; valueTexts: string[] }
interface PxMetadata { variables: PxVariable[] }

/** Canonical CPI series for a COICOP-2018 division label like "03 - CLOTHING …". */
function toCanonicalSeries(label: string): string | null {
  const code = /^(\d{1,2})\s*-/.exec(label.trim())?.[1]?.padStart(2, "0");
  if (!code) return null;
  if (code === "00") return "GENEL";
  if (code === "12") return null; // financial services — no canonical counterpart
  if (code === "13") return "12"; // personal care & miscellaneous → canonical 12
  return /^(0[1-9]|1[01])$/.test(code) ? code : null;
}

function variable(metadata: PxMetadata, code: string): PxVariable {
  const found = metadata.variables.find((v) => v.code === code);
  if (!found) throw new Error(`PSA OpenSTAT: variable '${code}' missing from table metadata`);
  return found;
}

/** Positional value code whose label matches `predicate`, or null. */
function valueCode(v: PxVariable, predicate: (text: string) => boolean): string | null {
  const index = v.valueTexts.findIndex(predicate);
  return index >= 0 ? v.values[index] : null;
}

async function fetchDivisionSeries(): Promise<Map<string, Map<string, number>>> {
  const headers = {
    "User-Agent": "YumoYumo data bot (compliance@yumoyumo.com)",
    Accept: "application/json",
  };
  const metaRes = await fetch(TABLE_URL, { headers, signal: AbortSignal.timeout(60_000) });
  if (!metaRes.ok) throw new Error(`PSA OpenSTAT metadata failed: HTTP ${metaRes.status}`);
  const metadata = (await metaRes.json()) as PxMetadata;

  const geo = variable(metadata, "Geolocation");
  const commodity = variable(metadata, "Commodity Description");
  const year = variable(metadata, "Year");
  const period = variable(metadata, "Period");

  const national = valueCode(geo, (t) => t.trim().toUpperCase() === "PHILIPPINES");
  if (!national) throw new Error("PSA OpenSTAT: national geolocation not found");

  // Division rows only: labels like "01 - FOOD …". Keep the canonical mapping beside
  // the positional code so the response can be decoded back to a series.
  const seriesByCode = new Map<string, string>();
  commodity.values.forEach((code, i) => {
    const series = toCanonicalSeries(commodity.valueTexts[i]);
    if (series) seriesByCode.set(code, series);
  });
  if (seriesByCode.size === 0) throw new Error("PSA OpenSTAT: no COICOP divisions in table");

  const monthCodes = MONTHS
    .map((m) => valueCode(period, (t) => t.trim() === m))
    .filter((c): c is string => Boolean(c));

  const query = {
    query: [
      { code: "Geolocation", selection: { filter: "item", values: [national] } },
      { code: "Commodity Description", selection: { filter: "item", values: [...seriesByCode.keys()] } },
      { code: "Year", selection: { filter: "item", values: year.values } },
      { code: "Period", selection: { filter: "item", values: monthCodes } },
    ],
    // PxWeb's own "json" format. json-stat2 is also advertised but returns a
    // collapsed single-cell body for this table, so it is not used.
    response: { format: "json" },
  };

  const dataRes = await fetch(TABLE_URL, {
    method: "POST",
    headers: { ...headers, "Content-Type": "application/json" },
    body: JSON.stringify(query),
    signal: AbortSignal.timeout(120_000),
  });
  if (!dataRes.ok) throw new Error(`PSA OpenSTAT data failed: HTTP ${dataRes.status}`);
  const payload = (await dataRes.json()) as { data?: Array<{ key: string[]; values: string[] }> };

  // Each row's `key` holds one value code per query variable, in query order:
  // [Geolocation, Commodity Description, Year, Period].
  const yearTextByCode = new Map(year.values.map((code, i) => [code, year.valueTexts[i]]));
  const monthTextByCode = new Map(period.values.map((code, i) => [code, period.valueTexts[i]]));

  const bySeries = new Map<string, Map<string, number>>();
  for (const row of payload.data ?? []) {
    const [, commodityCode, yearCode, periodCode] = row.key;
    const series = seriesByCode.get(commodityCode);
    const yearText = yearTextByCode.get(yearCode);
    const monthIndex = MONTHS.indexOf((monthTextByCode.get(periodCode) ?? "").trim());
    if (!series || !yearText || !/^\d{4}$/.test(yearText) || monthIndex < 0) continue;

    const value = Number(row.values?.[0]);
    if (!Number.isFinite(value) || value <= 0) continue; // ".." for unpublished months

    const yearMonth = `${yearText}-${String(monthIndex + 1).padStart(2, "0")}`;
    let months = bySeries.get(series);
    if (!months) { months = new Map(); bySeries.set(series, months); }
    months.set(yearMonth, value);
  }
  return bySeries;
}

/** Philippines CPI ETL: division index → 2025-01 = 1.0 → economic_indices. */
export async function runPsaCpiEtl(opts: {
  country?: string;
  since?: string;
  dryRun?: boolean;
}): Promise<EtlResult> {
  const country = opts.country ?? "PH";
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
