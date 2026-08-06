/**
 * INDEC (Argentina) → monthly CPI by COICOP division ETL.
 *
 * INDEC publishes the national IPC as an open CSV carrying the index level for the
 * general level ("0") and COICOP divisions "01".."12", per region. We take the
 * `Nacional` region only; the regional breakdowns are out of scope for hidden cost.
 *
 * Source: https://www.indec.gob.ar/ftp/cuadros/economia/serie_ipc_divisiones.csv
 *   semicolon-delimited, latin-1, comma decimal separator, Periodo = YYYYMM.
 *   columns: Codigo;Descripcion;Clasificador;Periodo;Indice_IPC;v_m_IPC;v_i_a_IPC;Region
 *
 * Non-COICOP aggregates in the same file (Núcleo, Regulados, Estacional, B, S) are
 * skipped — they have no canonical series counterpart.
 */

import {
  normalizeToBaseline,
  upsertIndices,
  summarizeRows,
  type EtlIndexRow,
  type EtlResult,
} from "./etl-helpers";

const SOURCE = "INDEC_IPC";
const CSV_URL = "https://www.indec.gob.ar/ftp/cuadros/economia/serie_ipc_divisiones.csv";

/** Canonical CPI series code for an INDEC `Codigo`, or null when out of schema. */
function toCanonicalSeries(codigo: string): string | null {
  const value = codigo.trim();
  if (value === "0") return "GENEL";
  return /^(0[1-9]|1[0-2])$/.test(value) ? value : null;
}

/** INDEC writes decimals with a comma ("12010,3199"). */
function parseNumber(raw: string): number {
  return Number(raw.trim().replace(/\./g, "").replace(",", "."));
}

async function fetchNationalSeries(): Promise<Map<string, Map<string, number>>> {
  const res = await fetch(CSV_URL, {
    headers: { "User-Agent": "YumoYumo data bot (compliance@yumoyumo.com)", Accept: "*/*" },
    signal: AbortSignal.timeout(60_000),
  });
  if (!res.ok) throw new Error(`INDEC IPC fetch failed: HTTP ${res.status}`);
  // The file is latin-1; decoding it as UTF-8 would corrupt the accented labels we
  // never read, but would also risk mangling the delimiters on malformed bytes.
  const csv = new TextDecoder("latin1").decode(await res.arrayBuffer());

  const bySeries = new Map<string, Map<string, number>>();
  const lines = csv.split("\n");
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const cols = line.split(";");
    if (cols.length < 8) continue;
    const [codigo, , , periodo, indice] = cols;
    const region = cols[7].trim();
    if (region !== "Nacional") continue;

    const series = toCanonicalSeries(codigo);
    if (!series) continue;
    if (!/^\d{6}$/.test(periodo.trim())) continue;
    const yearMonth = `${periodo.trim().slice(0, 4)}-${periodo.trim().slice(4, 6)}`;
    const value = parseNumber(indice);
    if (!Number.isFinite(value) || value <= 0) continue;

    let months = bySeries.get(series);
    if (!months) { months = new Map(); bySeries.set(series, months); }
    months.set(yearMonth, value);
  }
  return bySeries;
}

/** Argentina CPI ETL: national division index → 2025-01 = 1.0 → economic_indices. */
export async function runIndecCpiEtl(opts: {
  country?: string;
  since?: string;
  dryRun?: boolean;
}): Promise<EtlResult> {
  const country = opts.country ?? "AR";
  const bySeries = await fetchNationalSeries();

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
