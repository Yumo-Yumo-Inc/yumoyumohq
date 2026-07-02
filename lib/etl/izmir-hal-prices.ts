/**
 * Izmir Metropolitan Municipality wholesale market (hal) price ETL.
 *
 * Source: eislem.izmir.bel.tr/tr/HalFiyatlari/ExceleAktar/YYYY-MM-DD → XLSX.
 * Columns: Tip (type: MEYVE/SEBZE/İTHAL — fruit/vegetable/imported), Adi (name),
 * Birimi (unit: KG/ADET — kg/piece), EnAz (min), EnCok (max), Ortalama (average).
 *
 * The municipality's open-data API is unreachable, so this XLSX export is the
 * current wholesale (hal) price source. Data is upserted into hks_hal_prices;
 * the produce hidden-cost calculation (amount paid − hal price × quantity) and
 * the mv measurement check run on this data. No data on weekends → falls back
 * to the most recent business day.
 */

import * as XLSX from "xlsx";
import { getSql } from "@/lib/db/client";

const SOURCE = "IZMIR_HAL_OPENDATA";
const BASE = "https://eislem.izmir.bel.tr/tr/HalFiyatlari/ExceleAktar/";

export interface HalRow {
  hksName: string;       // full Izmir product name (e.g. ARMUT DEVECI)
  canonicalKey: string;  // normalized base form (e.g. armut)
  type: string;          // MEYVE/SEBZE/İTHAL (fruit/vegetable/imported)
  unit: string;          // KG/ADET (kg/piece)
  min: number; max: number; avg: number;
  tradeDate: string;     // YYYY-MM-DD
}

export interface IzmirHalResult { date: string | null; prepared: number; written: number; samples: HalRow[]; dryRun: boolean; }

/** Turkish ASCII normalization + product base name (first meaningful word). */
function toCanonicalKey(adi: string): string {
  const ascii = adi.toLowerCase()
    .replace(/ı/g, "i").replace(/ş/g, "s").replace(/ğ/g, "g")
    .replace(/ü/g, "u").replace(/ö/g, "o").replace(/ç/g, "c").trim();
  // First word is the base product (e.g. armut deveci → armut); skip if too short/numeric.
  const first = ascii.split(/\s+/)[0] ?? ascii;
  return first.replace(/[^a-z]/g, "");
}

function ymd(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** Fetches and parses the XLSX for the given date. Returns null if no data. */
async function fetchDate(date: string): Promise<HalRow[] | null> {
  const res = await fetch(BASE + date, {
    headers: { "User-Agent": "Mozilla/5.0 (compatible; YumoDataBot/1.0)", Accept: "application/octet-stream,*/*" },
    signal: AbortSignal.timeout(40_000),
  });
  if (!res.ok) return null;
  const buf = Buffer.from(await res.arrayBuffer());
  // XLSX files start with "PK" (zip signature); otherwise (HTML error page), skip.
  if (buf.length < 200 || buf[0] !== 0x50 || buf[1] !== 0x4b) return null;
  const wb = XLSX.read(buf, { type: "buffer" });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<any[]>(ws, { header: 1 });
  const out: HalRow[] = [];
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    const adi = String(r?.[1] ?? "").trim();
    const unit = String(r?.[2] ?? "").trim().toUpperCase();
    const min = Number(r?.[3]), max = Number(r?.[4]), avg = Number(r?.[5]);
    if (!adi || !Number.isFinite(avg) || avg <= 0) continue;
    out.push({ hksName: adi, canonicalKey: toCanonicalKey(adi), type: String(r?.[0] ?? "").trim(), unit, min, max, avg, tradeDate: date });
  }
  return out.length ? out : null;
}

/**
 * Fetches the most recent business day's Izmir wholesale-market data (tries
 * backward from the given date), upserts into hks_hal_prices. Looks back up to
 * lookbackDays days.
 */
export async function runIzmirHalEtl(opts: { date?: string; lookbackDays?: number; dryRun?: boolean } = {}): Promise<IzmirHalResult> {
  const lookback = opts.lookbackDays ?? 7;
  const start = opts.date ? new Date(opts.date) : new Date();
  let rows: HalRow[] | null = null;
  let used: string | null = null;
  for (let i = 0; i <= lookback; i++) {
    const d = new Date(start); d.setDate(start.getDate() - i);
    const ds = ymd(d);
    rows = await fetchDate(ds).catch(() => null);
    if (rows) { used = ds; break; }
  }
  if (!rows || !used) return { date: null, prepared: 0, written: 0, samples: [], dryRun: opts.dryRun ?? false };

  let written = 0;
  if (!opts.dryRun) {
    const sql = getSql();
    if (!sql) throw new Error("DB bağlantısı kurulamadı");
    // Refresh rows for the same source+date (idempotent).
    await sql`DELETE FROM hks_hal_prices WHERE source = ${SOURCE} AND trade_date = ${used}`;
    for (const r of rows) {
      // variety = full Izmir name → avoids collisions on the unique key (canonical_key, variety, trade_date, city).
      await sql`
        INSERT INTO hks_hal_prices
          (hks_name, canonical_key, variety, unit, trade_date, price_min_tl, price_max_tl, price_avg_tl, market_city, source)
        VALUES
          (${r.hksName}, ${r.canonicalKey}, ${r.hksName}, ${r.unit}, ${r.tradeDate},
           ${r.min}, ${r.max}, ${r.avg}, ${"İzmir"}, ${SOURCE})
        ON CONFLICT (canonical_key, variety, trade_date, market_city) DO UPDATE SET
          price_min_tl = EXCLUDED.price_min_tl,
          price_max_tl = EXCLUDED.price_max_tl,
          price_avg_tl = EXCLUDED.price_avg_tl,
          unit = EXCLUDED.unit,
          source = EXCLUDED.source
      `;
      written++;
    }
  }
  return { date: used, prepared: rows.length, written, samples: rows.slice(0, 8), dryRun: opts.dryRun ?? false };
}

export { SOURCE as IZMIR_HAL_SOURCE };
