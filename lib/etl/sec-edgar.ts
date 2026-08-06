/**
 * Shared SEC EDGAR XBRL helpers — annual gross margins from 10-K filings.
 *
 * The MARS/EDGAR companyconcept API returns each us-gaap concept's reported values;
 * we take annual (form 10-K, ~full-year) figures and compute gross margin as
 * GrossProfit/Revenue, falling back to (Revenue − CostOfRevenue) when a company does
 * not report GrossProfit for the target fiscal year (tags vary per filer).
 *
 * Used by scripts/fetch-us-margins-sec.ts and scripts/build-us-production-weights.ts.
 * No fabrication: a company whose margin cannot be computed returns null (caller skips it).
 */

const UA = "YumoYumo research bot (compliance@yumoyumo.com)";
const SEC = "https://data.sec.gov/api/xbrl/companyconcept";

const REVENUE_TAGS = [
  "RevenueFromContractWithCustomerExcludingAssessedTax",
  "Revenues",
  "SalesRevenueNet",
  "RevenueFromContractWithCustomerIncludingAssessedTax",
];
const GROSS_PROFIT_TAGS = ["GrossProfit"];
const COST_TAGS = ["CostOfGoodsAndServicesSold", "CostOfRevenue", "CostOfGoodsSold"];

export interface FyValue { fy: number; val: number; end: string; url: string; }
export interface MarginResult { name: string; fy: number; margin: number; end: string; url: string; via: string; }

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

/** Fetches a us-gaap concept; returns annual (10-K, ~full-year) USD values keyed by fiscal year. */
export async function fetchConcept(cik: string, tag: string): Promise<Map<number, FyValue>> {
  const url = `${SEC}/CIK${cik}/us-gaap/${tag}.json`;
  const out = new Map<number, FyValue>();
  const res = await fetch(url, { headers: { "User-Agent": UA, Accept: "application/json" }, signal: AbortSignal.timeout(30_000) });
  if (res.status === 404) return out; // company does not report this tag
  if (!res.ok) throw new Error(`SEC ${res.status} for ${tag} ${cik}`);
  const json = (await res.json()) as { units?: { USD?: Array<{ start?: string; end: string; val: number; fy?: number; fp?: string; form?: string }> } };
  const rows = json.units?.USD ?? [];
  for (const r of rows) {
    if (r.form !== "10-K" || r.fp !== "FY") continue;
    if (!r.start) continue;
    const days = (Date.parse(r.end) - Date.parse(r.start)) / 86_400_000;
    if (days < 350 || days > 380) continue; // full-year period only
    const fy = r.fy ?? Number(r.end.slice(0, 4));
    if (!Number.isFinite(fy)) continue;
    const prev = out.get(fy);
    if (!prev || r.end > prev.end) out.set(fy, { fy, val: r.val, end: r.end, url });
  }
  return out;
}

/** First non-empty concept among a tag list. Returns [map, tagUsed]. */
export async function firstConcept(cik: string, tags: string[]): Promise<[Map<number, FyValue>, string | null]> {
  for (const tag of tags) {
    const m = await fetchConcept(cik, tag);
    await sleep(150); // gentle on SEC (10 req/s cap)
    if (m.size > 0) return [m, tag];
  }
  return [new Map(), null];
}

/** Computes the latest-FY gross margin for a company from EDGAR. Returns null if unavailable. */
export async function computeMargin(cik: string, name: string): Promise<MarginResult | null> {
  const [rev, revTag] = await firstConcept(cik, REVENUE_TAGS);
  if (rev.size === 0) { console.warn(`  ⚠ ${name}: no revenue tag`); return null; }

  const [gp, gpTag] = await firstConcept(cik, GROSS_PROFIT_TAGS);
  const [cost, costTag] = await firstConcept(cik, COST_TAGS);

  const fy = [...rev.keys()].sort((a, b) => b - a).find((y) => gp.has(y) || cost.has(y));
  if (fy === undefined) { console.warn(`  ⚠ ${name}: no recent FY with revenue+profit (skipped)`); return null; }

  const revenue = rev.get(fy)!.val;
  if (!(revenue > 0)) { console.warn(`  ⚠ ${name}: non-positive revenue FY${fy}`); return null; }

  let grossProfit: number;
  let via: string;
  let anchor: FyValue;
  if (gp.has(fy)) {
    anchor = gp.get(fy)!;
    grossProfit = anchor.val;
    via = `${revTag} + ${gpTag}`;
  } else {
    anchor = cost.get(fy)!;
    grossProfit = revenue - anchor.val;
    via = `${revTag} − ${costTag}`;
  }
  const margin = grossProfit / revenue;
  if (!(margin > 0 && margin < 1)) { console.warn(`  ⚠ ${name}: implausible margin ${margin} FY${fy}`); return null; }

  return { name, fy, margin, end: anchor.end, url: anchor.url, via };
}
