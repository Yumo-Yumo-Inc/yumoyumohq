/**
 * TÜİK Yİ-ÜFE (Domestic Producer Price Index) ETL.
 *
 * Fetches the PPI series that dominate the hidden-cost calculation from the
 * TÜİK Data Browser 2 API, normalizes them to a 2025-01 = 1.0 base, and
 * upserts into `economic_indices`.
 *
 * Used by both the CLI script (scripts/fetch-tuik-yiufe-api.ts) and the monthly
 * cron route (app/api/cron/economic-indices) — the logic lives in one place.
 *
 * NOTE: TÜİK Data Browser 2 moved the old "DF_YIUFE_EDO" dataflow to the
 * versioned "DF_YIUFE_EDO_V1" identifier (the old identifier now returns
 * DATAFLOW_NOT_FOUND / HTTP 500) and renamed the product dimension from
 * FAALIYET_NACE_REV2 to URUN_UFE_NACE_CPA. The identifier and coordinates
 * below are current as of that change.
 */

import { getSql } from "@/lib/db/client";

const DATASET_ID = "TR,DF_YIUFE_EDO_V1,1.0";
const SOURCE = "TURKSTAT_YIUFE_API";
const BASELINE_MONTH = "2025-01";

type SeriesConfig = {
  series: string;
  apiCode: string;
  group: string;
};

/**
 * PPI series used by costCompositionConfig.ts. apiCode/group values correspond
 * to TÜİK's URUN_UFE_NACE_CPA + FAAL_GRUP dimension codes.
 */
const SERIES_CONFIGS: SeriesConfig[] = [
  { series: "GENEL", apiCode: "B-E36", group: "_T" },
  { series: "ARM", apiCode: "MIG_ING", group: "2" },
  { series: "ENJ", apiCode: "MIG_NRG", group: "2" },
  { series: "SEM", apiCode: "MIG_CAG", group: "2" },
  { series: "DZT", apiCode: "MIG_DCOG", group: "2" },
  { series: "DLT", apiCode: "MIG_NDCOG", group: "2" },
  { series: "C", apiCode: "C", group: "3" },
  { series: "D", apiCode: "D", group: "3" },
  { series: "10", apiCode: "C10", group: "4" },
  { series: "13", apiCode: "C13", group: "4" },
  { series: "14", apiCode: "C14", group: "4" },
  { series: "19", apiCode: "C19", group: "4" },
  { series: "20_4", apiCode: "C204", group: "5" },
  { series: "26", apiCode: "C26", group: "4" },
  { series: "31", apiCode: "C31", group: "4" },
  { series: "35", apiCode: "D35", group: "4" },
  { series: "36", apiCode: "E36", group: "4" },
];

type JsonStatDimension = {
  label: string;
  category: {
    index: string[];
    label?: Record<string, string>;
  };
};

type JsonStatDataset = {
  id: string[];
  size: number[];
  dimension: Record<string, JsonStatDimension>;
  value: Record<string, number | string>;
  label: string;
};

export interface YiufeIndexRow {
  country: string;
  indexType: string;
  series: string;
  yearMonth: string;
  value: number;
  source: string;
  isVerified: boolean;
}

export interface YiufeEtlResult {
  /** Number of prepared (normalized) records. */
  prepared: number;
  /** Number of records written to the DB (0 if dryRun). */
  written: number;
  /** Number of series covered. */
  seriesCount: number;
  /** Most recent month in the dataset (YYYY-MM) — a freshness indicator. */
  latestMonth: string | null;
  /** Sample of the first few records (for logs/responses). */
  samples: Array<{ series: string; yearMonth: string; value: number }>;
  dryRun: boolean;
}

function getArgPosition(dataset: JsonStatDataset, dimensionId: string, code: string): number {
  const dimension = dataset.dimension[dimensionId];
  const idx = dimension?.category.index.indexOf(code) ?? -1;
  if (idx === -1) {
    throw new Error(`Dimension value bulunamadı: ${dimensionId}=${code}`);
  }
  return idx;
}

function getObservationKey(dataset: JsonStatDataset, coordinates: Record<string, string>): string {
  let offset = 0;
  for (let i = 0; i < dataset.id.length; i++) {
    const dimensionId = dataset.id[i];
    const pos = getArgPosition(dataset, dimensionId, coordinates[dimensionId] ?? "");
    offset *= dataset.size[i];
    offset += pos;
  }
  return String(offset);
}

function getObservationValue(
  dataset: JsonStatDataset,
  coordinates: Record<string, string>
): number | null {
  const key = getObservationKey(dataset, coordinates);
  const raw = dataset.value[key];
  if (raw === undefined || raw === null || raw === "") return null;
  const num = Number(raw);
  return Number.isFinite(num) ? num : null;
}

async function fetchDataset(): Promise<JsonStatDataset> {
  const response = await fetch(
    `https://databrowser2.tuik.gov.tr/api/core/nodes/1/datasets/${DATASET_ID}/data`,
    {
      method: "POST",
      headers: {
        Accept: "application/json, text/plain, */*",
        "Content-Type": "application/json",
        Referer: "https://databrowser2.tuik.gov.tr/",
        "User-Agent": "Mozilla/5.0 (compatible; YumoDataBot/1.0)",
      },
      body: JSON.stringify([
        { id: "REF_AREA", filterValues: ["TR"], type: "CodeValues", period: 0 },
      ]),
      signal: AbortSignal.timeout(300_000),
    }
  );

  if (!response.ok) {
    throw new Error(`HTTP ${response.status} (${response.statusText})`);
  }

  const dataset = (await response.json()) as JsonStatDataset;
  if (!dataset.dimension?.TIME_PERIOD?.category?.index?.length) {
    throw new Error("TIME_PERIOD boyutu bulunamadı");
  }
  return dataset;
}

function buildRows(
  dataset: JsonStatDataset,
  opts: { since: string; month?: string }
): YiufeIndexRow[] {
  const allMonths = dataset.dimension.TIME_PERIOD.category.index
    .filter((yearMonth) => yearMonth >= opts.since)
    .filter((yearMonth) => (opts.month ? yearMonth === opts.month : true));

  const rows: YiufeIndexRow[] = [];

  for (const config of SERIES_CONFIGS) {
    const baseline = getObservationValue(dataset, {
      REF_AREA: "TR",
      INDICATOR: "F_YIUFE",
      DEGISIM: "1",
      BASE_PER: "2003",
      FREQ: "M",
      URUN_UFE_NACE_CPA: config.apiCode,
      FAAL_GRUP: config.group,
      TIME_PERIOD: BASELINE_MONTH,
    });

    if (!baseline || baseline <= 0) {
      console.warn(
        `[YIUFE-ETL] ⚠️  Baseline bulunamadı: ${config.series} (${config.apiCode}/${config.group})`
      );
      continue;
    }

    for (const yearMonth of allMonths) {
      const rawIndex = getObservationValue(dataset, {
        REF_AREA: "TR",
        INDICATOR: "F_YIUFE",
        DEGISIM: "1",
        BASE_PER: "2003",
        FREQ: "M",
        URUN_UFE_NACE_CPA: config.apiCode,
        FAAL_GRUP: config.group,
        TIME_PERIOD: yearMonth,
      });

      if (!rawIndex || rawIndex <= 0) continue;

      rows.push({
        country: "TR",
        indexType: "PPI",
        series: config.series,
        yearMonth,
        value: rawIndex / baseline,
        source: SOURCE,
        isVerified: true,
      });
    }
  }

  return rows;
}

async function upsertRows(
  sql: NonNullable<ReturnType<typeof getSql>>,
  rows: YiufeIndexRow[]
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
 * Fetches Yİ-ÜFE series, normalizes them, and upserts into the DB (unless dryRun).
 */
export async function runYiufeEtl(
  opts: { since?: string; month?: string; dryRun?: boolean } = {}
): Promise<YiufeEtlResult> {
  const since = opts.since ?? BASELINE_MONTH;
  const dryRun = opts.dryRun ?? false;

  const dataset = await fetchDataset();
  const rows = buildRows(dataset, { since, month: opts.month });

  const latestMonth =
    rows.reduce<string | null>(
      (max, r) => (max === null || r.yearMonth > max ? r.yearMonth : max),
      null
    );
  const seriesCount = new Set(rows.map((r) => r.series)).size;
  const samples = rows
    .slice()
    .sort((a, b) => (a.yearMonth < b.yearMonth ? 1 : a.yearMonth > b.yearMonth ? -1 : a.series.localeCompare(b.series)))
    .slice(0, 20)
    .map((r) => ({ series: r.series, yearMonth: r.yearMonth, value: r.value }));

  let written = 0;
  if (!dryRun) {
    const sql = getSql();
    if (!sql) {
      throw new Error("DB bağlantısı kurulamadı");
    }
    await upsertRows(sql, rows);
    written = rows.length;
  }

  return {
    prepared: rows.length,
    written,
    seriesCount,
    latestMonth,
    samples,
    dryRun,
  };
}

export { SOURCE as YIUFE_SOURCE };
