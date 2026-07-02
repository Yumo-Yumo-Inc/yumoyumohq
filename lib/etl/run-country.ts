/**
 * Per-country ETL dispatch — runs the correct ETL modules based on the
 * cpi_adapter / ppi_adapter values in the supported_countries record. Used by
 * the CLI (fetch-country-prices) and the monthly cron (api/cron/economic-indices).
 *
 * Each adapter returns an EtlResult-compatible result. National sources that
 * aren't implemented yet throw an explicit error; the caller catches it per
 * country with try/catch and skips (no fabrication).
 */

import { getSql } from "@/lib/db/client";
import { runEurostatEtl } from "./eurostat-prices";
import { runImfIfsEtl } from "./imf-ifs-prices";
import { runEvdsCpiEtl } from "./tcmb-evds-cpi";
import { runYiufeEtl } from "./tuik-yiufe";
import type { EtlResult } from "./etl-helpers";

function currentYearMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

type AdapterFn = (opts: { country: string; since?: string; dryRun?: boolean }) => Promise<EtlResult>;

/** National source not implemented yet — documents the source, throws an explicit error. */
function notImplemented(name: string, source: string): AdapterFn {
  return async () => {
    throw new Error(`ETL adaptörü '${name}' henüz uygulanmadı. Kaynak: ${source}`);
  };
}

/**
 * Adapter name → runner. Eurostat and dgbas produce CPI+PPI in a single call;
 * imf_ifs is CPI only; national sources are PPI.
 */
const ADAPTERS: Record<string, AdapterFn> = {
  eurostat: (o) => runEurostatEtl(o),
  imf_ifs: (o) => runImfIfsEtl(o),
  tcmb_evds: (o) => runEvdsCpiEtl({ since: o.since, end: currentYearMonth(), dryRun: o.dryRun }) as Promise<EtlResult>,
  tuik_yiufe: (o) => runYiufeEtl({ since: o.since, dryRun: o.dryRun }) as Promise<EtlResult>,
  // National PPI / Taiwan sources — awaiting implementation (source documented).
  ibge: notImplemented("ibge", "IBGE SIDRA API — IPP (PPI) + IPCA (CPI), BR"),
  nbs: notImplemented("nbs", "Nigeria NBS — PPI by activity (nigerianstat.gov.ng)"),
  gso: notImplemented("gso", "Vietnam GSO — PPI by VSIC, ÇEYREKLİK (gso.gov.vn)"),
  bps: notImplemented("bps", "Indonesia BPS — PPI, ÇEYREKLİK (bps.go.id)"),
  dosm: notImplemented("dosm", "Malaysia DOSM — PPI monthly (dosm.gov.my)"),
  moc: notImplemented("moc", "Thailand Ministry of Commerce — PPI monthly"),
  rosstat: notImplemented("rosstat", "Russia Rosstat — PPI (erişim değişken; IMF yedek)"),
  dgbas: notImplemented("dgbas", "Taiwan DGBAS — CPI+PPI, API yok, Excel/ODF (eng.stat.gov.tw)"),
};

export interface CountryEtlOutcome {
  country: string;
  adapter: string;
  ok: boolean;
  result?: EtlResult;
  error?: string;
}

interface CountryRow {
  country: string;
  cpi_adapter: string | null;
  ppi_adapter: string | null;
  status: string;
}

/** Reads the supported_countries record. */
async function getCountryRow(country: string): Promise<CountryRow | null> {
  const sql = getSql();
  if (!sql) throw new Error("DB bağlantısı kurulamadı");
  const rows = await sql`
    SELECT country, cpi_adapter, ppi_adapter, status
    FROM supported_countries WHERE country = ${country.toUpperCase()}
  ` as CountryRow[];
  return rows[0] ?? null;
}

/**
 * Runs all adapters for a country (cpi + ppi, deduplicated).
 * If the same adapter handles both cpi and ppi (eurostat/dgbas), it runs once.
 */
export async function runCountryEtl(
  country: string,
  opts: { since?: string; dryRun?: boolean } = {}
): Promise<CountryEtlOutcome[]> {
  const row = await getCountryRow(country);
  if (!row) throw new Error(`supported_countries içinde yok: ${country}`);

  const adapters = [...new Set([row.cpi_adapter, row.ppi_adapter].filter(Boolean) as string[])];
  const outcomes: CountryEtlOutcome[] = [];

  for (const name of adapters) {
    const fn = ADAPTERS[name];
    if (!fn) {
      outcomes.push({ country: row.country, adapter: name, ok: false, error: `bilinmeyen adaptör: ${name}` });
      continue;
    }
    try {
      const result = await fn({ country: row.country, since: opts.since, dryRun: opts.dryRun });
      outcomes.push({ country: row.country, adapter: name, ok: true, result });
    } catch (err) {
      outcomes.push({ country: row.country, adapter: name, ok: false, error: (err as Error)?.message ?? String(err) });
    }
  }
  return outcomes;
}

/** Runs all active countries (for the cron). */
export async function runAllActiveCountries(
  opts: { since?: string; dryRun?: boolean } = {}
): Promise<CountryEtlOutcome[]> {
  const sql = getSql();
  if (!sql) throw new Error("DB bağlantısı kurulamadı");
  const rows = await sql`SELECT country FROM supported_countries WHERE status = 'active' ORDER BY country` as { country: string }[];
  const all: CountryEtlOutcome[] = [];
  // Cross-country pacing: most countries hit the same DBnomics (imf_ifs) server;
  // consecutive requests trip the burst rate-limit (429 after 10+ requests). A
  // ~700ms gap prevents this upfront; the adapter also retries with backoff on
  // 429 (belt and suspenders).
  const sleep = (ms: number) => new Promise<void>((res) => setTimeout(res, ms));
  let first = true;
  for (const r of rows) {
    if (!first) await sleep(700);
    first = false;
    try {
      all.push(...(await runCountryEtl(r.country, opts)));
    } catch (err) {
      all.push({ country: r.country, adapter: "(all)", ok: false, error: (err as Error)?.message ?? String(err) });
    }
  }
  return all;
}
