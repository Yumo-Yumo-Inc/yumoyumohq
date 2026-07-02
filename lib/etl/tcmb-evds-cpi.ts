/**
 * TCMB EVDS → TÜFE (Consumer Price Index) ETL.
 *
 * TÜİK does not publish TÜFE on the Data Browser API (producer side only). TCMB
 * EVDS is the only current, machine-readable official source with TÜFE's COICOP
 * sub-groups (the underlying data still originates from TÜİK). This module fetches
 * headline TÜFE plus the main expenditure groups from the EVDS REST API, normalizes
 * to a 2025-01 = 1.0 base, and upserts into `economic_indices` with index_type='CPI'.
 *
 * Requires a free EVDS API key (evds2.tcmb.gov.tr → register → Profile → API Key).
 * The key is stored in the `EVDS_API_KEY` env variable and sent via the `key` header.
 *
 * Mapping — our CPI series code (2-digit COICOP) → EVDS series code:
 *   GENEL → TP.FG.J0 ; 01 → TP.FG.J01 ; … ; 12 → TP.FG.J12
 * costCompositionConfig.ts currently uses GENEL, 04, 08, 11; for consistency we
 * refresh all main groups (01-12).
 */

import { getSql } from "@/lib/db/client";

const SOURCE = "TCMB_EVDS";
const BASELINE_MONTH = "2025-01";
// EVDS moved to evds3 at the end of 2025; the old evds2/service/evds endpoint was fully shut down.
// New backend root (same as the fatihmete/evds EVDS3 client): params are appended
// to the root path without a `?`, e.g. ".../igmevdsms-dis/series=...&startDate=...&type=json".
const EVDS_BASE = "https://evds3.tcmb.gov.tr/igmevdsms-dis/";
// Monthly data (EVDS frequency code: 5 = monthly).
const EVDS_MONTHLY = "5";

/**
 * Our CPI series code (2-digit COICOP) → EVDS series code.
 * The current TÜFE datagroup is `bie_tukfiy2025` (2025=100 base), with series
 * codes TP.TUKFIY2025.{GENEL|01..12}. The old TP.FG.J* codes are deprecated.
 * The 2025=100 base aligns with our 2025-01 normalization.
 */
const CPI_SERIES_MAP: Record<string, string> = {
  GENEL: "TP.TUKFIY2025.GENEL",
  "01": "TP.TUKFIY2025.01",
  "02": "TP.TUKFIY2025.02",
  "03": "TP.TUKFIY2025.03",
  "04": "TP.TUKFIY2025.04",
  "05": "TP.TUKFIY2025.05",
  "06": "TP.TUKFIY2025.06",
  "07": "TP.TUKFIY2025.07",
  "08": "TP.TUKFIY2025.08",
  "09": "TP.TUKFIY2025.09",
  "10": "TP.TUKFIY2025.10",
  "11": "TP.TUKFIY2025.11",
  "12": "TP.TUKFIY2025.12",
};

export interface CpiIndexRow {
  country: string;
  indexType: string;
  series: string;
  yearMonth: string;
  value: number;
  source: string;
  isVerified: boolean;
}

export interface EvdsCpiResult {
  prepared: number;
  written: number;
  seriesCount: number;
  latestMonth: string | null;
  samples: Array<{ series: string; yearMonth: string; value: number }>;
  dryRun: boolean;
}

/** Converts the EVDS "Tarih" field ("2026-5" or "2026-05") to "YYYY-MM". */
function normalizeEvdsDate(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const m = raw.match(/^(\d{4})-(\d{1,2})$/);
  if (!m) return null;
  return `${m[1]}-${m[2].padStart(2, "0")}`;
}

/** EVDS JSON key: dots and hyphens in the series code become underscores (TP.FG.J0 → TP_FG_J0). */
function evdsJsonKey(seriesCode: string): string {
  return seriesCode.replace(/[.\-]/g, "_");
}

function ddmmyyyy(yearMonth: string, day: string): string {
  const [y, m] = yearMonth.split("-");
  return `${day}-${m}-${y}`;
}

interface EvdsItem {
  [key: string]: string | number | null | undefined;
  Tarih?: string;
}

async function fetchEvds(
  apiKey: string,
  since: string,
  end: string
): Promise<EvdsItem[]> {
  const seriesParam = Object.values(CPI_SERIES_MAP).join("-");
  const startDate = ddmmyyyy(since, "01");
  const endDate = ddmmyyyy(end, "28");
  // EVDS3: params are appended to the root path without a `?`; empty
  // aggregationTypes/formulas = the series' default aggregation (avg for TÜFE).
  // The key goes in the `key` header.
  const url =
    `${EVDS_BASE}series=${seriesParam}&startDate=${startDate}&endDate=${endDate}` +
    `&type=json&frequency=${EVDS_MONTHLY}&aggregationTypes=&formulas=`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      key: apiKey,
      Accept: "application/json",
      "User-Agent": "Mozilla/5.0 (compatible; YumoDataBot/1.0)",
    },
    signal: AbortSignal.timeout(120_000),
  });

  if (!response.ok) {
    throw new Error(`EVDS HTTP ${response.status} (${response.statusText})`);
  }

  const text = await response.text();
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    // EVDS may return HTML/a redirect on an invalid key — defensive check.
    throw new Error(`EVDS geçersiz JSON (key hatalı olabilir): ${text.slice(0, 120)}`);
  }

  const items = (parsed as { items?: EvdsItem[] })?.items;
  if (!Array.isArray(items)) {
    throw new Error("EVDS yanıtında 'items' dizisi yok");
  }
  return items;
}

function buildRows(items: EvdsItem[], since: string): CpiIndexRow[] {
  // Find each series' 2025-01 baseline value first.
  const baseline: Record<string, number> = {};
  for (const [ourCode, evdsCode] of Object.entries(CPI_SERIES_MAP)) {
    const jsonKey = evdsJsonKey(evdsCode);
    for (const item of items) {
      if (normalizeEvdsDate(item.Tarih) === BASELINE_MONTH) {
        const v = Number(item[jsonKey]);
        if (Number.isFinite(v) && v > 0) baseline[ourCode] = v;
        break;
      }
    }
  }

  const rows: CpiIndexRow[] = [];
  for (const item of items) {
    const yearMonth = normalizeEvdsDate(item.Tarih);
    if (!yearMonth || yearMonth < since) continue;

    for (const [ourCode, evdsCode] of Object.entries(CPI_SERIES_MAP)) {
      const base = baseline[ourCode];
      if (!base) continue; // no baseline → this series can't be normalized
      const raw = Number(item[evdsJsonKey(evdsCode)]);
      if (!Number.isFinite(raw) || raw <= 0) continue;

      rows.push({
        country: "TR",
        indexType: "CPI",
        series: ourCode,
        yearMonth,
        value: raw / base,
        source: SOURCE,
        isVerified: true,
      });
    }
  }

  return rows;
}

async function upsertRows(
  sql: NonNullable<ReturnType<typeof getSql>>,
  rows: CpiIndexRow[]
): Promise<void> {
  for (const row of rows) {
    await sql`
      INSERT INTO economic_indices
        (country, index_type, series, year_month, value, source, is_verified)
      VALUES
        (${row.country}, ${row.indexType}, ${row.series}, ${row.yearMonth},
         ${row.value}, ${row.source}, ${row.isVerified})
      ON CONFLICT (country, index_type, series, year_month) DO UPDATE SET
        value = EXCLUDED.value,
        source = EXCLUDED.source,
        is_verified = EXCLUDED.is_verified,
        updated_at = now()
    `;
  }
}

/**
 * Fetches TÜFE COICOP series from EVDS, normalizes them, and upserts (unless dryRun).
 *
 * @param opts.apiKey  EVDS API key (defaults to process.env.EVDS_API_KEY if omitted).
 * @param opts.since   Start month (YYYY-MM, default 2025-01).
 * @param opts.end     End month (YYYY-MM, default: provided by the caller; the cron passes the current month).
 */
export async function runEvdsCpiEtl(opts: {
  apiKey?: string;
  since?: string;
  end: string;
  dryRun?: boolean;
}): Promise<EvdsCpiResult> {
  const apiKey = opts.apiKey ?? process.env.EVDS_API_KEY;
  if (!apiKey) {
    throw new Error("EVDS_API_KEY yok — TÜFE çekilemez (evds2.tcmb.gov.tr'den ücretsiz alın)");
  }
  const since = opts.since ?? BASELINE_MONTH;
  const dryRun = opts.dryRun ?? false;

  const items = await fetchEvds(apiKey, since, opts.end);
  const rows = buildRows(items, since);

  const latestMonth = rows.reduce<string | null>(
    (max, r) => (max === null || r.yearMonth > max ? r.yearMonth : max),
    null
  );
  const seriesCount = new Set(rows.map((r) => r.series)).size;
  const samples = rows
    .slice()
    .sort((a, b) =>
      a.yearMonth < b.yearMonth ? 1 : a.yearMonth > b.yearMonth ? -1 : a.series.localeCompare(b.series)
    )
    .slice(0, 20)
    .map((r) => ({ series: r.series, yearMonth: r.yearMonth, value: r.value }));

  let written = 0;
  if (!dryRun) {
    const sql = getSql();
    if (!sql) throw new Error("DB bağlantısı kurulamadı");
    await upsertRows(sql, rows);
    written = rows.length;
  }

  return { prepared: rows.length, written, seriesCount, latestMonth, samples, dryRun };
}

export { SOURCE as EVDS_CPI_SOURCE, CPI_SERIES_MAP };
