/**
 * Core module for deriving category cost weights from the OECD ICIO table.
 *
 * deriveWeightsFromIcio: streams the ICIO long-matrix CSV and computes the cost
 * composition of each internal category (via the CATEGORY_ISIC mapping) for the
 * given country.
 * upsertWeights: upserts the result into production_cost_weights.
 *
 * model_type and benchmark_series are country-independent → taken from categorySeriesMap.
 * profit_margin_factor stays at the default (1.20) until country-specific retail-margin
 * research is available; ICIO does not provide this value.
 *
 * This module DOES NOT WORK without an ICIO CSV and throws an explicit error if
 * the format deviates from what's expected — it never fabricates a value.
 */

import { createReadStream, statSync } from "fs";
import { createInterface } from "readline";
import { getSql } from "@/lib/db/client";
import { categorySeriesMap } from "@/lib/mining/categorySeriesMap";

export interface DerivedWeight {
  category: string;
  raw_material_pct: number;
  labor_pct: number;
  rent_pct: number;
  energy_pct: number;
  other_pct: number;
  profit_margin_factor: number;
  model_type: string;
  benchmark_series: string | null;
}

// Classification of ISIC sector groups into cost components (source sector → component).
const ENERGY_ISIC = new Set(["D19", "D35T39", "D05T06", "D35"]);
const MATERIAL_PREFIX = ["D01T03", "D05T09", "D10T12", "D13T15", "D16", "D17T18",
  "D20", "D21", "D22T23", "D24", "D25", "D26", "D27", "D28", "D29T30", "D31T33", "D19"];

const DEFAULT_PROFIT_MARGIN_FACTOR = 1.20;

/** "DEU_D10T12" → {country:"DEU", industry:"D10T12"}; null for VA/final-demand columns. */
function parseColLabel(label: string): { country: string; industry: string } | null {
  const m = label.match(/^([A-Z]{3})_(.+)$/);
  if (!m) return null;
  return { country: m[1], industry: m[2] };
}

function classifyComponent(sourceIndustry: string): "raw" | "energy" | "other" {
  if (ENERGY_ISIC.has(sourceIndustry)) return "energy";
  if (MATERIAL_PREFIX.some((p) => sourceIndustry === p)) return "raw";
  return "other"; // services/logistics/trade intermediate inputs
}

/**
 * Reads the ICIO CSV and derives category weights for the given country.
 * iso3: ICIO country code (alpha-3). categoryIsic: category → ISIC sector codes.
 */
export async function deriveWeightsFromIcio(
  file: string,
  countryAlpha2: string,
  categoryIsic: Record<string, string[]>,
  iso3Override?: string
): Promise<DerivedWeight[]> {
  if (!statSync(file).isFile()) throw new Error(`ICIO dosyası okunamadı: ${file}`);
  const iso3 = iso3Override ?? ALPHA2_TO_ISO3[countryAlpha2.toUpperCase()];
  if (!iso3) throw new Error(`ISO3 eşlemesi yok: ${countryAlpha2}`);

  // Target columns: every ISIC sector referenced in the mapping for this country.
  const wantedIndustries = new Set(Object.values(categoryIsic).flat());
  // industry → { raw, energy, other, labor, totalIntermediate }
  const acc = new Map<string, { raw: number; energy: number; other: number; labor: number; output: number }>();

  let header: string[] | null = null;
  const colMeta: ({ country: string; industry: string } | null)[] = [];
  const targetColIdx = new Map<number, string>(); // csv col index → target industry

  const rl = createInterface({ input: createReadStream(file), crlfDelay: Infinity });
  for await (const line of rl) {
    const cells = line.split(",");
    if (!header) {
      header = cells;
      for (let i = 1; i < header.length; i++) {
        const meta = parseColLabel(header[i].replace(/^"|"$/g, ""));
        colMeta[i] = meta;
        if (meta && meta.country === iso3 && wantedIndustries.has(meta.industry)) {
          targetColIdx.set(i, meta.industry);
          if (!acc.has(meta.industry)) acc.set(meta.industry, { raw: 0, energy: 0, other: 0, labor: 0, output: 0 });
        }
      }
      if (targetColIdx.size === 0) {
        throw new Error(
          `ICIO başlığında ${iso3} için hedef sütun bulunamadı — format/vintage beklenenden farklı olabilir.`
        );
      }
      continue;
    }

    const rowLabel = (cells[0] ?? "").replace(/^"|"$/g, "");
    const rowMeta = parseColLabel(rowLabel);
    const isVaRow = /^(VALU|VA|TLS|LABR)/i.test(rowLabel); // value added / labor rows

    for (const [ci, industry] of targetColIdx) {
      const v = Number(cells[ci]);
      if (!Number.isFinite(v) || v === 0) continue;
      const a = acc.get(industry)!;
      a.output += v; // column sum ≈ total output
      if (isVaRow) {
        if (/LABR|^VALU/i.test(rowLabel)) a.labor += v; // labor/VA share (assumption: VA≈labor proxy)
      } else if (rowMeta) {
        a[classifyComponent(rowMeta.industry)] += v;
      }
    }
  }

  // Aggregate + normalize by category.
  const out: DerivedWeight[] = [];
  for (const [category, industries] of Object.entries(categoryIsic)) {
    let raw = 0, energy = 0, other = 0, labor = 0, output = 0;
    for (const ind of industries) {
      const a = acc.get(ind);
      if (!a) continue;
      raw += a.raw; energy += a.energy; other += a.other; labor += a.labor; output += a.output;
    }
    if (output <= 0) continue; // no data → skip the category (no fabrication)
    const total = raw + energy + other + labor;
    if (total <= 0) continue;
    const series = categorySeriesMap[category as keyof typeof categorySeriesMap];
    out.push({
      category,
      raw_material_pct: round2(raw / total),
      labor_pct: round2(labor / total),
      rent_pct: 0, // 4-component model; rent folds into other
      energy_pct: round2(energy / total),
      other_pct: round2(other / total),
      profit_margin_factor: DEFAULT_PROFIT_MARGIN_FACTOR,
      model_type: series?.modelType ?? "producer_gap",
      benchmark_series: series?.benchmarkSeries ?? null,
    });
  }
  return out;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/** Upserts the derived weights into production_cost_weights. Returns the row count. */
export async function upsertWeights(country: string, weights: DerivedWeight[]): Promise<number> {
  const sql = getSql();
  if (!sql) throw new Error("DB bağlantısı kurulamadı");
  let n = 0;
  for (const w of weights) {
    // Provenance: ICIO-derived rows are written as drafts (is_verified=FALSE); an admin approves them.
    // source is NOT NULL, so every row must carry a source (data provenance requirement).
    await sql`
      INSERT INTO production_cost_weights
        (country, category, raw_material_pct, labor_pct, rent_pct, energy_pct, other_pct,
         profit_margin_factor, model_type, benchmark_series, notes,
         source, source_url, effective_date, is_verified, confidence)
      VALUES
        (${country.toUpperCase()}, ${w.category}, ${w.raw_material_pct}, ${w.labor_pct},
         ${w.rent_pct}, ${w.energy_pct}, ${w.other_pct}, ${w.profit_margin_factor},
         ${w.model_type}, ${w.benchmark_series}, 'OECD_ICIO_2023',
         'OECD Inter-Country Input-Output (ICIO) Tables 2023',
         'https://www.oecd.org/sti/ind/inter-country-input-output-tables.htm',
         DATE '2023-01-01', FALSE, 'medium')
      ON CONFLICT (country, category) DO UPDATE SET
        raw_material_pct = EXCLUDED.raw_material_pct,
        labor_pct = EXCLUDED.labor_pct,
        rent_pct = EXCLUDED.rent_pct,
        energy_pct = EXCLUDED.energy_pct,
        other_pct = EXCLUDED.other_pct,
        model_type = EXCLUDED.model_type,
        benchmark_series = EXCLUDED.benchmark_series,
        notes = EXCLUDED.notes,
        source = EXCLUDED.source,
        source_url = EXCLUDED.source_url,
        effective_date = EXCLUDED.effective_date,
        confidence = EXCLUDED.confidence,
        updated_at = now()
    `;
    n++;
  }
  return n;
}

// ISO-3166 alpha-2 → alpha-3 (ICIO REF_AREA).
const ALPHA2_TO_ISO3: Record<string, string> = {
  DE: "DEU", EE: "EST", RO: "ROU", BR: "BRA", RU: "RUS", MY: "MYS",
  TH: "THA", ID: "IDN", VN: "VNM", NG: "NGA", TW: "TWN", TR: "TUR",
};
