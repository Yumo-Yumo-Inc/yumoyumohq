/**
 * Eurostat → CPI (HICP) + PPI (NACE) ETL — EU countries (DE, EE, RO).
 *
 * Eurostat publishes both COICOP-based HICP (consumer) and NACE Rev.2-based
 * producer price index (PPI) through a single SDMX/JSON-stat API. No key required.
 *
 *   CPI: dataset prc_hicp_midx, coicop=CP00/CP01.., unit=I15 (2015=100)
 *   PPI: dataset sts_inpp_m, nace_r2=C/D/C10.., indic_bt=PRC_PRR, unit=I21
 *
 * Source codes are converted to the canonical schema (CPI: COICOP CPxx → "GENEL"/"01".."12";
 * PPI: Eurostat NACE → our ISIC codes "10","13","26","31","19","20_4","35","C","D","ARM").
 * Each series is normalized to a 2025-01 = 1.0 base and upserted into economic_indices.
 */

import {
  normalizeToBaseline,
  upsertIndices,
  summarizeRows,
  BASELINE_MONTH,
  type EtlIndexRow,
  type EtlResult,
} from "./etl-helpers";

const SOURCE = "EUROSTAT";
const API = "https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data";

const EUROSTAT_COUNTRIES = new Set(["DE", "EE", "RO"]);

// Canonical CPI series code → Eurostat COICOP code.
const CPI_MAP: Record<string, string> = {
  GENEL: "CP00", "01": "CP01", "02": "CP02", "03": "CP03", "04": "CP04",
  "05": "CP05", "06": "CP06", "07": "CP07", "08": "CP08", "09": "CP09",
  "10": "CP10", "11": "CP11", "12": "CP12",
};

// Canonical PPI series code → Eurostat NACE Rev.2 code.
// 35→D and ARM→C are proxies (nearest aggregation available in Eurostat, in lieu of a dedicated series).
const PPI_MAP: Record<string, string> = {
  C: "C", D: "D", "10": "C10", "13": "C13", "19": "C19",
  "20_4": "C20", "26": "C26", "31": "C31_32", "35": "D", ARM: "C",
};

interface JsonStat {
  value?: Record<string, number>;
  dimension?: { time?: { category?: { index?: Record<string, number> } } };
}

/** Converts a Eurostat JSON-stat single-series response into a month→raw-value map (other dimensions have size 1). */
function parseJsonStat(js: JsonStat, since: string): Map<string, number> {
  const out = new Map<string, number>();
  const idx = js.dimension?.time?.category?.index;
  const val = js.value;
  if (!idx || !val) return out;
  for (const [ym, pos] of Object.entries(idx)) {
    if (ym < since) continue;
    const v = val[String(pos)];
    if (typeof v === "number" && Number.isFinite(v) && v > 0) out.set(ym, v);
  }
  return out;
}

async function fetchEurostat(dataset: string, params: Record<string, string>): Promise<JsonStat | null> {
  const qs = new URLSearchParams({ format: "JSON", lang: "EN", ...params }).toString();
  const url = `${API}/${dataset}?${qs}`;
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; YumoDataBot/1.0)", Accept: "application/json" },
      signal: AbortSignal.timeout(60_000),
    });
    if (!res.ok) return null; // 404 = this dimension combination doesn't exist → skip defensively
    return (await res.json()) as JsonStat;
  } catch {
    return null;
  }
}

/**
 * Fetches an EU country's CPI + PPI series, normalizes to 2025-01=1.0, and upserts.
 */
export async function runEurostatEtl(opts: {
  country: string;
  since?: string;
  dryRun?: boolean;
}): Promise<EtlResult> {
  const country = opts.country.toUpperCase();
  if (!EUROSTAT_COUNTRIES.has(country)) {
    throw new Error(`Eurostat adaptörü ${country} için tanımlı değil (DE/EE/RO).`);
  }
  const since = opts.since ?? BASELINE_MONTH;
  const dryRun = opts.dryRun ?? false;
  const rows: EtlIndexRow[] = [];

  // ── CPI (HICP) ───────────────────────────────────────────────────────────
  for (const [ourCode, coicop] of Object.entries(CPI_MAP)) {
    const js = await fetchEurostat("prc_hicp_midx", {
      geo: country, coicop, unit: "I15", sinceTimePeriod: since,
    });
    if (!js) continue;
    const norm = normalizeToBaseline(parseJsonStat(js, since));
    for (const [ym, v] of norm) {
      rows.push({ country, indexType: "CPI", series: ourCode, yearMonth: ym, value: v, source: SOURCE, isVerified: true });
    }
  }

  // ── PPI (NACE) ───────────────────────────────────────────────────────────
  // Multiple canonical codes can map to the same Eurostat NACE code → cache the fetch.
  const ppiCache = new Map<string, Map<string, number>>();
  for (const [ourCode, nace] of Object.entries(PPI_MAP)) {
    let norm = ppiCache.get(nace);
    if (!norm) {
      const js = await fetchEurostat("sts_inpp_m", {
        geo: country, nace_r2: nace, indic_bt: "PRC_PRR", s_adj: "NSA", unit: "I21", sinceTimePeriod: since,
      });
      norm = js ? normalizeToBaseline(parseJsonStat(js, since)) : new Map();
      ppiCache.set(nace, norm);
    }
    for (const [ym, v] of norm) {
      rows.push({ country, indexType: "PPI", series: ourCode, yearMonth: ym, value: v, source: SOURCE, isVerified: true });
    }
  }

  const written = dryRun ? 0 : await upsertIndices(rows);
  return summarizeRows(rows, written, dryRun);
}

export { SOURCE as EUROSTAT_SOURCE, EUROSTAT_COUNTRIES };
