import type { CountryConfig } from "@/lib/country/base";
import { parseLooseNumber } from "./parse-number";

export function scoreToConfidence(score: number): number {
  if (score >= 120) return 0.95;
  if (score >= 80)  return 0.90;
  if (score >= 50)  return 0.75;
  if (score >= 10)  return 0.60;
  return 0.40;
}

export function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export function extractAmountsFromText(
  text: string,
  countryConfig?: CountryConfig
): Array<{ value: number; raw: string }> {
  const amountPattern =
    /(\*{0,2}\d{1,3}(?:[,\s]\d{3})*(?:[.,]\d{2})?|\*{0,2}\d+[.,]\d{2}|\*{0,2}\d+)/g;
  const out: Array<{ value: number; raw: string }> = [];
  for (const m of text.matchAll(amountPattern)) {
    const raw = m[0];
    const v = parseLooseNumber(raw, countryConfig);
    if (v == null) continue;
    out.push({ value: v, raw });
  }
  return out;
}
