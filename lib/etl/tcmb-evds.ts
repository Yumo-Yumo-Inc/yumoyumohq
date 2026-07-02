/**
 * TCMB EVDS (Electronic Data Distribution System) API client.
 * Exchange rates: TP.DK.USD.S.YTL (USD sell rate), TP.DK.EUR.S.YTL, etc.
 * API key: obtained via https://evds2.tcmb.gov.tr/; sent in the request header.
 * Docs: EVDS Web Service Usage Guide (key in header, 403 otherwise).
 */

const EVDS_BASE = "https://evds2.tcmb.gov.tr/service/evds";

/** TRY per 1 USD (sell rate). Series: TP.DK.USD.S.YTL */
const SERIES_USD_TRY = "TP.DK.USD.S.YTL";

export interface EvdsObservation {
  [key: string]: string; // e.g. Tarih: "01.01.2025", TP_DK_USD_S_YTL: "34.5678"
}

export interface EvdsResponse {
  items?: EvdsObservation[];
  message?: string;
}

/**
 * Fetches data for the given series from EVDS.
 * @param series Series code (e.g. TP.DK.USD.S.YTL). Separate multiple with "-".
 * @param startDate dd-mm-yyyy
 * @param endDate dd-mm-yyyy
 * @param frequency 5=monthly, 1=daily
 */
export async function fetchEvdsSeries(
  series: string,
  startDate: string,
  endDate: string,
  options: { frequency?: number; type?: "json" | "csv" | "xml" } = {}
): Promise<EvdsResponse> {
  const key = process.env.TCMB_EVDS_API_KEY ?? process.env.EVDS_API_KEY;
  if (!key) {
    throw new Error("TCMB_EVDS_API_KEY or EVDS_API_KEY env required for EVDS");
  }
  const frequency = options.frequency ?? 5; // monthly
  const type = options.type ?? "json";
  const url = `${EVDS_BASE}/?series=${series}&startDate=${startDate}&endDate=${endDate}&type=${type}&frequency=${frequency}&aggregationTypes=avg`;
  const res = await fetch(url, {
    headers: { key },
    next: { revalidate: 3600 },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`EVDS ${res.status}: ${text.slice(0, 200)}`);
  }
  const data = (await res.json()) as EvdsResponse;
  return data;
}

/**
 * Returns the latest observation: TRY per 1 USD (sell rate).
 * EVDS returns dates in dd.MM.yyyy format; picks the most recent value.
 */
export async function fetchUsdTryRateLatest(): Promise<number | null> {
  const end = new Date();
  const start = new Date(end);
  start.setMonth(start.getMonth() - 2);
  const startStr = formatEvdsDate(start);
  const endStr = formatEvdsDate(end);
  const data = await fetchEvdsSeries(SERIES_USD_TRY, startStr, endStr, { frequency: 1 });
  const items = data.items ?? [];
  if (items.length === 0) return null;
  const last = items[items.length - 1];
  const key = Object.keys(last).find((k) => k !== "Tarih" && k.startsWith("TP_"));
  if (!key) return null;
  const val = parseFloat(String(last[key]).replace(",", "."));
  return Number.isFinite(val) ? val : null;
}

function formatEvdsDate(d: Date): string {
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}-${month}-${year}`;
}

/**
 * Average USD/TRY for a given month (EVDS monthly series).
 * yearMonth: "2025-12"
 */
export async function fetchUsdTryRateForMonth(yearMonth: string): Promise<number | null> {
  const [y, m] = yearMonth.split("-").map(Number);
  const startStr = `01-${String(m).padStart(2, "0")}-${y}`;
  const lastDay = new Date(y, m, 0).getDate();
  const endStr = `${String(lastDay).padStart(2, "0")}-${String(m).padStart(2, "0")}-${y}`;
  const data = await fetchEvdsSeries(SERIES_USD_TRY, startStr, endStr, { frequency: 5 });
  const items = data.items ?? [];
  if (items.length === 0) return null;
  const row = items[0];
  const key = Object.keys(row).find((k) => k !== "Tarih" && k.startsWith("TP_"));
  if (!key) return null;
  const val = parseFloat(String(row[key]).replace(",", "."));
  return Number.isFinite(val) ? val : null;
}
