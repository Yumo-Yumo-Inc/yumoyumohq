/**
 * LLM product canonicalizer with Retrieval-Augmented decision making.
 *
 * Flow:
 *   raw OCR line + retrieved candidates
 *     ↓
 *   Gemini disambiguator (decides match vs new)
 *     ↓
 *   Redis-first cache (write-through) + Postgres audit trail
 *     ↓
 *   LlmProductDecision (apply in resolveCanonicalObservationsV3)
 *
 * Compared to existing normalize-product-llm.ts:
 *   - Sees existing canonical_products candidates → matches not duplicates
 *   - Decision shape: 'match' | 'new' (no merge_to_master since products
 *     don't have legal-entity hierarchy like merchants)
 *
 * Server-only.
 */

if (typeof window !== "undefined") {
  throw new Error(
    "lib/canonical/llm-product-canonicalize is server-only."
  );
}

import crypto from "crypto";
import { cacheGet, cacheSet } from "@/lib/cache/redis";
import { db } from "@/lib/db/client";
import { CacheKeys, CacheTTL } from "./cache-config";
import { normalizeBrandName } from "@/lib/receipt/name-normalization";
import type { ProductCandidate } from "./retrieve-product-candidates";

import { callGeminiText, getGeminiKey } from "./gemini-text";

// Gemini transport — the OpenAI account ran out of quota in production.
const MODEL = process.env.PRODUCT_LLM_MODEL ?? "gemini-3.1-flash-lite";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface LlmProductDecision {
  raw_name: string;
  decision: "match" | "new";
  matched_id: string | null;
  // For 'new': v3 normalization fields
  canonical_name: string | null;
  display_name_tr: string | null;
  brand: string | null;
  category_path: string | null;
  attributes: Record<string, unknown>;
  unit_size: string | null;
  unit_type: string | null;
  lifestyle_tags: string[];
  consumption_occasions: string[];
  allergens: string[];
  price_tier: string | null;
  confidence: number;
  reasoning: string;
}

interface CacheRow {
  decision_type: string;
  matched_id: string | null;
  proposed_canonical: string | null;
  proposed_category_path: string | null;
  proposed_attributes: Record<string, unknown> | null;
  confidence: number;
  reasoning: string | null;
}

// ─── Cache ───────────────────────────────────────────────────────────────────

function decisionHash(
  rawName: string,
  merchantId: string | null | undefined
): string {
  return crypto
    .createHash("sha1")
    .update(`${merchantId ?? ""}|${rawName.trim().toLowerCase()}`)
    .digest("hex");
}

function redisKey(
  rawName: string,
  merchantId: string | null | undefined
): string {
  return CacheKeys.productDecision(decisionHash(rawName, merchantId));
}

function rowToDecision(rawName: string, row: CacheRow): LlmProductDecision {
  return {
    raw_name: rawName,
    decision: row.decision_type === "match" ? "match" : "new",
    matched_id: row.matched_id,
    canonical_name: row.proposed_canonical,
    display_name_tr: null,
    brand: null,
    category_path: row.proposed_category_path,
    attributes:
      row.proposed_attributes && typeof row.proposed_attributes === "object"
        ? row.proposed_attributes
        : {},
    unit_size: null,
    unit_type: null,
    lifestyle_tags: [],
    consumption_occasions: [],
    allergens: [],
    price_tier: null,
    confidence: Number(row.confidence) || 0,
    reasoning: row.reasoning ?? "",
  };
}

export async function getCachedProductDecision(
  rawName: string,
  merchantId: string | null | undefined
): Promise<LlmProductDecision | null> {
  const key = redisKey(rawName, merchantId);
  const fromRedis = await cacheGet<LlmProductDecision>(key);
  if (fromRedis) return fromRedis;

  const hash = decisionHash(rawName, merchantId);
  const rows = await db.query<CacheRow>(
    `SELECT decision_type, matched_id, proposed_canonical, proposed_category_path,
            proposed_attributes, confidence, reasoning
     FROM product_decision_cache
     WHERE cache_key = $1 AND expires_at > now()
     LIMIT 1`,
    [hash]
  );
  if (rows.rows.length === 0) return null;

  const decision = rowToDecision(rawName, rows.rows[0]);
  void cacheSet(key, decision, CacheTTL.productDecision);
  return decision;
}

export async function setCachedProductDecision(
  rawName: string,
  merchantId: string | null | undefined,
  candidates: ProductCandidate[],
  decision: LlmProductDecision
): Promise<void> {
  const key = redisKey(rawName, merchantId);
  const hash = decisionHash(rawName, merchantId);

  await cacheSet(key, decision, CacheTTL.productDecision);

  void db
    .query(
      `INSERT INTO product_decision_cache
         (cache_key, raw_text, merchant_id, decision_type, matched_id,
          proposed_canonical, proposed_category_path, proposed_attributes,
          confidence, reasoning, candidates_seen, llm_model)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb, $9, $10, $11::jsonb, $12)
       ON CONFLICT (cache_key) DO UPDATE SET
         decision_type = EXCLUDED.decision_type,
         matched_id = EXCLUDED.matched_id,
         proposed_canonical = EXCLUDED.proposed_canonical,
         proposed_category_path = EXCLUDED.proposed_category_path,
         proposed_attributes = EXCLUDED.proposed_attributes,
         confidence = EXCLUDED.confidence,
         reasoning = EXCLUDED.reasoning,
         candidates_seen = EXCLUDED.candidates_seen,
         llm_model = EXCLUDED.llm_model,
         decided_at = now(),
         expires_at = now() + INTERVAL '30 days'`,
      [
        hash,
        rawName,
        merchantId ?? null,
        decision.decision,
        decision.matched_id,
        decision.canonical_name,
        decision.category_path,
        JSON.stringify(decision.attributes ?? {}),
        decision.confidence,
        decision.reasoning,
        JSON.stringify(
          candidates.map((c) => ({
            id: c.id,
            canonical_name: c.canonical_name,
            score: c.score,
            source: c.source,
          }))
        ),
        MODEL,
      ]
    )
    .catch((error) => {
      console.warn(
        "[llm-product-canonicalize] PG cache write failed:",
        (error as Error).message
      );
    });
}

// ─── LLM Prompt ──────────────────────────────────────────────────────────────

const SYSTEM = `You are a multilingual receipt PRODUCT canonicalizer for Yumo, supporting TR/EN/MS/ID/TH/AR. You handle cross-script products where the same item appears in multiple languages on different receipts.

Your job: given a raw OCR product line and a list of existing canonical_products candidates, decide:
  1. "match": this raw line refers to one of the candidates (same brand + same size + same variant)
  2. "new":   no candidate fits → propose a new canonical entry

═══════════════════════════════════════════════════════════════════════════
CROSS-SCRIPT / MULTILINGUAL MATCHING
═══════════════════════════════════════════════════════════════════════════

The same product appears in different scripts on different receipts:
  "Coca Cola 330ml" (EN) ↔ "كوكاكولا 330مل" (AR) ↔ "โคคาโคล่า 330" (TH) ↔ "Coca Cola 33cl" (EN variant)
  "Tadım Antep Fıstığı 150g" (TR) ↔ "Tadim Pistachio 150g" (EN) ↔ "TADIM FISTIK 150G" (OCR uppercase)
  "Lipton Çay" (TR) ↔ "ليبتون شاي" (AR) ↔ "ลิปตัน ชา" (TH)

If a candidate has matching size/variant/brand even in a different script, prefer "match".

═══════════════════════════════════════════════════════════════════════════
DEFINITELY DIFFERENT (return "new")
═══════════════════════════════════════════════════════════════════════════

Only return "new" when one of these is clearly different:
  - SIZE/QUANTITY: 150g vs 200g, 33cl vs 50cl, 10-pack vs 20-pack
  - VARIANT: regular vs zero/diet/light, classic vs strawberry, plain vs flavored
  - BRAND: Coca Cola vs Pepsi (even if size/category match)
  - PACKAGE: glass vs PET, can vs bottle (if attributes track this)

═══════════════════════════════════════════════════════════════════════════
v3 NORMALIZATION FIELDS (for "new")
═══════════════════════════════════════════════════════════════════════════

  - display_name_tr: human Turkish name with proper diacritics
  - brand: identified brand or null
  - category_path: deepest matching Yumo taxonomy path
  - attributes: weight_g, volume_ml, package_type, etc.
  - lifestyle_tags: ["vejetaryan","vegan","helal","glutensiz",...]
  - consumption_occasions: ["atistirmalik","kahvalti",...]
  - allergens: ["fıstık","gluten","laktoz",...]
  - price_tier: "butce" | "orta" | "premium" | "luks" | "degisken"

═══════════════════════════════════════════════════════════════════════════
HARD RULES (never override)
═══════════════════════════════════════════════════════════════════════════

  - alcohol / bira / şarap / votka / arak / wine / arak → groceries.alcohol
  - tobacco / sigara / cigarette / heets / iqos / دخان → groceries.tobacco
  - fuel / benzin / motorin / LPG / gasoline / diesel → transport.fuel.*

═══════════════════════════════════════════════════════════════════════════
POLLUTION FILTER (NEVER canonicalize as product)
═══════════════════════════════════════════════════════════════════════════

These are receipt artifacts, NOT products. Return "new" only if you must, but
flag with confidence < 0.5 and category_path = "hizmet_diger" so cleanup can
catch them:
  - Discount labels: "% 40 İndirim", "1 TL", "kampanya", "online offer"
  - Plastic bag charges: "Alışveriş Poşeti", "Poşet 25g"
  - Fee/tax: "Fiyat Farkı", "KDV", "Hizmet Ücreti", "ETN", "ETTN"
  - Receipt admin: "Fiş İptal", "K. Kartı", "Mali Değeri Yoktur"

═══════════════════════════════════════════════════════════════════════════
OUTPUT (labeled plain text — one block per input line, use the given numbering)
═══════════════════════════════════════════════════════════════════════════
=== ITEM <n> ===
DECISION: match | new
MATCHED_ID: <uuid of the matched candidate, or -> (only for match)
DISPLAY_TR: <human Turkish name, or ->
BRAND: <brand name, or ->
CATEGORY_PATH: <taxonomy path, or ->
ATTRIBUTES: <key=value; key=value, or ->
UNIT_SIZE: <number, or ->
UNIT_TYPE: <g|kg|ml|l|adet|..., or ->
LIFESTYLE: <comma list, or ->
OCCASIONS: <comma list, or ->
ALLERGENS: <comma list, or ->
PRICE_TIER: <butce|orta|premium|luks|degisken, or ->
CONFIDENCE: <0.0-1.0>
REASONING: <short>

One field per line. Use "-" for unknown/empty. No JSON, no markdown fences.`;

// ─── Output normalizers ──────────────────────────────────────────────────────

function safeStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((v): v is string => typeof v === "string" && v.length > 0);
}

function safeRecord(value: unknown): Record<string, unknown> {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return {};
}

function fallbackNewDecision(rawName: string, reason: string): LlmProductDecision {
  return {
    raw_name: rawName,
    decision: "new",
    matched_id: null,
    canonical_name: null,
    display_name_tr: rawName.trim() || null,
    brand: null,
    category_path: null,
    attributes: {},
    unit_size: null,
    unit_type: null,
    lifestyle_tags: [],
    consumption_occasions: [],
    allergens: [],
    price_tier: null,
    confidence: 0.5,
    reasoning: reason,
  };
}

// ─── Labeled plain-text parsing (T1: no JSON from the LLM) ───────────────────

/**
 * Parse "=== ITEM <n> ===" blocks with "FIELD: value" lines.
 * Defensive: a missing or malformed line leaves that field undefined,
 * a malformed block is skipped — never throws.
 */
function parseItemBlocks(raw: string): Map<number, Record<string, string>> {
  const blocks = new Map<number, Record<string, string>>();
  const sections = raw.split(/^\s*===\s*ITEM\s+(\d+)\s*===\s*$/m);
  // sections = [preamble, "1", body1, "2", body2, ...]
  for (let i = 1; i + 1 < sections.length; i += 2) {
    const num = Number(sections[i]);
    if (!Number.isInteger(num) || num < 1) continue;
    const fields: Record<string, string> = {};
    for (const line of sections[i + 1].split("\n")) {
      const m = line.match(/^\s*([A-Z_]+)\s*:\s*(.*)\s*$/);
      if (!m) continue;
      const value = m[2].trim();
      if (value && value !== "-") fields[m[1]] = value;
    }
    blocks.set(num, fields);
  }
  return blocks;
}

function parseCommaList(v: string | undefined): string[] {
  if (!v) return [];
  return v.split(",").map((s) => s.trim()).filter(Boolean);
}

function parseAttributePairs(v: string | undefined): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  if (!v) return out;
  for (const pair of v.split(";")) {
    const eq = pair.indexOf("=");
    if (eq <= 0) continue;
    const key = pair.slice(0, eq).trim();
    const value = pair.slice(eq + 1).trim();
    if (key && value) out[key] = value;
  }
  return out;
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function fieldsToDecision(
  rawName: string,
  f: Record<string, string>
): LlmProductDecision {
  const matchedId =
    f.MATCHED_ID && UUID_RE.test(f.MATCHED_ID) ? f.MATCHED_ID : null;
  const confNum = Number(f.CONFIDENCE);
  return {
    raw_name: rawName,
    decision: f.DECISION?.toLowerCase() === "match" && matchedId ? "match" : "new",
    matched_id: matchedId,
    // The canonical slug is always built in code (product-slug.ts); the LLM
    // only supplies display fields.
    canonical_name: null,
    display_name_tr: f.DISPLAY_TR ?? null,
    // Same guard as every other brand ingestion point: a column-misaligned
    // parse that put a quantity/price into BRAND must not survive.
    brand: normalizeBrandName(f.BRAND ?? null, rawName),
    category_path: f.CATEGORY_PATH ?? null,
    attributes: parseAttributePairs(f.ATTRIBUTES),
    unit_size: f.UNIT_SIZE ?? null,
    unit_type: f.UNIT_TYPE?.toLowerCase() ?? null,
    lifestyle_tags: parseCommaList(f.LIFESTYLE),
    consumption_occasions: parseCommaList(f.OCCASIONS),
    allergens: parseCommaList(f.ALLERGENS),
    price_tier: f.PRICE_TIER?.toLowerCase() ?? null,
    confidence:
      Number.isFinite(confNum) && confNum >= 0 && confNum <= 1 ? confNum : 0.7,
    reasoning: f.REASONING ?? "",
  };
}

// ─── Main batch API ──────────────────────────────────────────────────────────

const LLM_BATCH = Number(process.env.PRODUCT_LLM_BATCH ?? 18);

/**
 * Batch RAC for products. Returns map keyed by NORMALIZED raw_name (lowercase trim).
 *
 * @param rawNames Raw OCR product lines (deduplicated upstream recommended)
 * @param candidatesByRaw For each raw line, top-K candidates from retrieve helper
 * @param merchantId Hint for cache key
 * @param language Optional: language hint for prompt
 * @param priceByRaw Observed unit price per raw line. A supermarket abbreviation is
 *                   ambiguous on text alone but the price narrows it hard, so it goes
 *                   into the prompt alongside each candidate's reference median.
 */
export async function llmCanonicalizeProductsBatch(input: {
  rawNames: string[];
  candidatesByRaw: Map<string, ProductCandidate[]>;
  merchantId?: string | null;
  language?: string;
  priceByRaw?: Map<string, { unitPrice: number | null; unitType: string | null }>;
}): Promise<Map<string, LlmProductDecision>> {
  const out = new Map<string, LlmProductDecision>();
  if (!getGeminiKey() || input.rawNames.length === 0) return out;

  // De-dup raw names, normalize for cache key matching
  const unique = Array.from(
    new Set(input.rawNames.map((n) => n.trim()).filter(Boolean))
  );
  if (unique.length === 0) return out;

  // Process in chunks of LLM_BATCH
  for (let i = 0; i < unique.length; i += LLM_BATCH) {
    const chunk = unique.slice(i, i + LLM_BATCH);

    const lines = chunk.map((raw, idx) => {
      const cands = input.candidatesByRaw.get(raw) ?? [];
      const candStr =
        cands.length === 0
          ? "NO_CANDIDATES"
          : cands
              .slice(0, 3)
              .map((c) => {
                const attrs = JSON.stringify(c.attributes ?? {});
                const ref =
                  c.price_median != null ? ` ref_price=${c.price_median}` : "";
                return `[id=${c.id} name="${c.display_name_tr ?? c.canonical_name}" cat=${c.category_path ?? "?"} size=${c.typical_unit_size ?? "?"} attrs=${attrs}${ref} score=${c.score.toFixed(2)} via=${c.source}]`;
              })
              .join("; ");
      const price = input.priceByRaw?.get(raw);
      const priceStr =
        price?.unitPrice != null && price.unitPrice > 0
          ? ` observed_price=${price.unitPrice.toFixed(2)} unit=${price.unitType ?? "?"}`
          : "";
      return `${idx + 1}. raw=${JSON.stringify(raw)}${priceStr} candidates=${candStr}`;
    });

    const userMsg = `Receipt language: ${input.language ?? "unknown"}
Merchant id: ${input.merchantId ?? "unknown"}

For each line, prefer matching to candidates over creating new. Output one "=== ITEM <n> ===" block per line, using the numbering shown.

When observed_price is present, use it as evidence. A candidate whose ref_price is far
from observed_price (roughly beyond a 2x factor either way) is probably the wrong product
— a 47g wafer and a 500g box do not share a price. Treat ref_price as a hint, not proof:
it is a median over few observations and may be missing or stale. Never invent a price.

${lines.join("\n")}`;

    try {
      const rawContent = (await callGeminiText(MODEL, SYSTEM, userMsg)) ?? "";
      for (const [num, f] of parseItemBlocks(rawContent)) {
        const rawName = chunk[num - 1];
        if (!rawName) continue;
        out.set(rawName.toLowerCase(), fieldsToDecision(rawName, f));
      }
    } catch (error) {
      console.error(
        "[llm-product-canonicalize] LLM batch failed:",
        (error as Error).message
      );
      // Fill chunk with fallback decisions
      for (const raw of chunk) {
        const k = raw.toLowerCase();
        if (!out.has(k)) {
          out.set(k, fallbackNewDecision(raw, `LLM error: ${(error as Error).message.slice(0, 80)}`));
        }
      }
    }
  }

  return out;
}
