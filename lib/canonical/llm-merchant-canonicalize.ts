import crypto from "crypto";
import OpenAI from "openai";
import { cacheGet, cacheSet } from "@/lib/cache/redis";
import { db } from "@/lib/db/client";
import { CacheKeys, CacheTTL } from "./cache-config";
import type { Lang } from "./preprocess";
import type { MerchantCandidate } from "./retrieve-merchant-candidates";

const client = process.env.OPENAI_API_KEY ? new OpenAI() : null;
const MODEL = process.env.MERCHANT_LLM_MODEL ?? "gpt-4.1-mini";

export interface LlmMerchantDecision {
  decision: "match" | "new" | "merge_to_master";
  matched_id: string | null;
  proposed_canonical: string | null;
  proposed_relationship:
    | "legal_owner"
    | "franchise"
    | "subsidiary"
    | "rebranded"
    | "location"
    | "duplicate"
    | null;
  proposed_master_id: string | null;
  confidence: number;
  reasoning: string;
}

interface CacheDecisionRow {
  decision_type: string;
  matched_id: string | null;
  proposed_master_id: string | null;
  proposed_canonical: string | null;
  proposed_relationship: string | null;
  confidence: number;
  reasoning: string | null;
}

const SYSTEM = `You are a multilingual merchant canonicalization expert specialized in Turkish (TR), English (EN), Malay (MS), Indonesian (ID), Thai (TH), and Arabic (AR) business names. You handle cross-script matching where the same brand appears in multiple writing systems.

Your job: given an OCR-extracted merchant string and a list of existing canonical merchants, decide whether this string:
1. matches an existing merchant entity exactly,
2. should be merged under an existing master brand as a legal entity / franchise / location,
3. or represents a brand new merchant.

═══════════════════════════════════════════════════════════════════════════
CROSS-SCRIPT MATCHING (CRITICAL)
═══════════════════════════════════════════════════════════════════════════

The same brand often appears across writing systems. Treat them as the SAME if a candidate's brand matches:

  Starbucks (EN) ↔ ستاربكس (AR) ↔ สตาร์บัคส์ (TH) ↔ Старбакс (RU)
  → All map to Starbucks master.

  Carrefour (EN) ↔ كارفور (AR) ↔ Carrefour Türkiye (TR) ↔ CarrefourSA (TR)
  → All map to Carrefour family. CarrefourSA is the Turkish JV (Sabancı), often
    a "subsidiary" or "franchise" relationship to Carrefour master.

  McDonald's (EN) ↔ ماكدونالدز (AR) ↔ แมคโดนัลด์ (TH) ↔ Mekdonalds
  → McDonald's master.

  Tesco (EN) ↔ Tesco Stores (Malaysia) Sdn Bhd (MS) ↔ Tesco Lotus (legacy TH)
  → Tesco master. "Lotus's" (current TH brand after 2020) is "rebranded" relation.

═══════════════════════════════════════════════════════════════════════════
LEGAL ENTITY KNOWLEDGE BY COUNTRY
═══════════════════════════════════════════════════════════════════════════

Turkey (TR):
- A.Ş. / Anonim Şirketi = joint stock company. Legal name suffix.
- Ltd. Şti. / Limited Şirketi = limited liability.
- "BIM Birleşik Mağazalar A.Ş." → BIM brand (legal_owner)
- "Migros Ticaret Anonim Şirketi" → Migros brand (legal_owner)
- "Coffee Concepts Restoran İşletmeleri Tic. A.Ş." → Starbucks Turkey franchise (franchise)
- "Şok Marketler T.A.Ş." → Şok brand (legal_owner)
- "CarrefourSA Carrefour Sabancı Tic. Merkezi A.Ş." → Carrefour subsidiary (subsidiary)

Malaysia (MS):
- Sdn Bhd = Sendirian Berhad (Pte Ltd equivalent)
- Berhad / Bhd = public company
- "Tesco Stores (Malaysia) Sdn Bhd" → Tesco master (legal_owner / subsidiary)
- "Mydin Mohamed Holdings Berhad" → Mydin brand (legal_owner)

Indonesia (ID):
- PT (Perseroan Terbatas) = limited liability prefix
- "PT Indomarco Prismatama" → Indomaret brand (legal_owner) — well-known
- "PT Sumber Alfaria Trijaya Tbk" → Alfamart (legal_owner)
- "PT Hero Supermarket Tbk" → Hero / Giant brand

Thailand (TH):
- บริษัท / จำกัด / มหาชน = company / limited / public
- "บริษัท เซ็นทรัล รีเทล คอร์ปอเรชั่น" → Central Group brands
- "Big C Supercenter" / "บิ๊กซี" → Big C brand
- "7-Eleven (Thailand)" / "เซเว่น อีเลฟเว่น" → 7-Eleven master

Arabic (AR):
- شركة / محدودة / مساهمة = company / limited / joint-stock
- "شركة الراجحي المصرفية" / "Al Rajhi Bank" → Al Rajhi master
- "بنده" / "Panda Retail" → Panda master
- "الدانوب" / "Danube" → Danube (Saudi grocery) master

Branch / location indicators:
- TR: "şubesi", "Bağdat Cad.", "AVM"
- MS: "cawangan", mall name
- TH: "สาขา", mall name
- AR: "فرع", mall name
- EN: "branch", "store #N"
→ All these typically = "location" relationship.

═══════════════════════════════════════════════════════════════════════════
FALSE POSITIVE GUARDS
═══════════════════════════════════════════════════════════════════════════

Be cautious with partial-name overlaps:
- BIM (Turkish discount) ≠ BIMTAŞ (different chemical company) ≠ İBİM (different brand)
- Migros (TR) ≠ Migrelos (different)
- "Tesco" alone could be Tesco Malaysia, Tesco UK, Tesco Lotus (Thailand) — use country_code to disambiguate.

═══════════════════════════════════════════════════════════════════════════
OUTPUT (strict JSON only):
═══════════════════════════════════════════════════════════════════════════

{
  "decision": "match" | "new" | "merge_to_master",
  "matched_id": "<uuid>" or null,
  "proposed_canonical": "<short brand name in canonical script>" or null,
  "proposed_relationship": "legal_owner" | "franchise" | "subsidiary" | "rebranded" | "location" | "duplicate" | null,
  "proposed_master_id": "<uuid>" or null,
  "confidence": 0.0-1.0,
  "reasoning": "<one short sentence in English>"
}

DECISION SEMANTICS:
- "match": same exact merchant entity. matched_id required.
- "merge_to_master": this OCR is legal-entity / franchise / location of a brand in candidates. proposed_master_id + proposed_relationship required.
- "new": no candidate fits. proposed_canonical required (use the BRAND name, not legal name).`;

function decisionHash(raw: string, country: string | null | undefined): string {
  return crypto
    .createHash("sha1")
    .update(`${country ?? ""}|${raw.trim().toLowerCase()}`)
    .digest("hex");
}

function redisKey(raw: string, country: string | null | undefined): string {
  return CacheKeys.merchantDecision(decisionHash(raw, country));
}

function toDecision(row: CacheDecisionRow): LlmMerchantDecision {
  return {
    decision: row.decision_type as LlmMerchantDecision["decision"],
    matched_id: row.matched_id,
    proposed_canonical: row.proposed_canonical,
    proposed_relationship:
      (row.proposed_relationship as LlmMerchantDecision["proposed_relationship"]) ??
      null,
    proposed_master_id: row.proposed_master_id,
    confidence: Number(row.confidence) || 0,
    reasoning: row.reasoning ?? "",
  };
}

export async function getCachedDecision(
  raw: string,
  country: string | null | undefined
): Promise<LlmMerchantDecision | null> {
  const key = redisKey(raw, country);
  const fromRedis = await cacheGet<LlmMerchantDecision>(key);
  if (fromRedis) return fromRedis;

  const hash = decisionHash(raw, country);
  const rows = await db.query<CacheDecisionRow>(
    `SELECT decision_type, matched_id, proposed_master_id, proposed_canonical,
            proposed_relationship, confidence, reasoning
     FROM merchant_decision_cache
     WHERE cache_key = $1 AND expires_at > now()
     LIMIT 1`,
    [hash]
  );
  if (rows.rows.length === 0) return null;

  const decision = toDecision(rows.rows[0]);
  void cacheSet(key, decision, CacheTTL.merchantDecision);
  return decision;
}

export async function setCachedDecision(
  raw: string,
  country: string | null | undefined,
  candidates: MerchantCandidate[],
  decision: LlmMerchantDecision
): Promise<void> {
  const key = redisKey(raw, country);
  const hash = decisionHash(raw, country);

  await cacheSet(key, decision, CacheTTL.merchantDecision);

  void db
    .query(
      `INSERT INTO merchant_decision_cache
         (cache_key, raw_text, country_code, decision_type, matched_id,
          proposed_master_id, proposed_canonical, proposed_relationship,
          confidence, reasoning, candidates_seen, llm_model)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11::jsonb,$12)
       ON CONFLICT (cache_key) DO UPDATE SET
         decision_type = EXCLUDED.decision_type,
         matched_id = EXCLUDED.matched_id,
         proposed_master_id = EXCLUDED.proposed_master_id,
         proposed_canonical = EXCLUDED.proposed_canonical,
         proposed_relationship = EXCLUDED.proposed_relationship,
         confidence = EXCLUDED.confidence,
         reasoning = EXCLUDED.reasoning,
         candidates_seen = EXCLUDED.candidates_seen,
         llm_model = EXCLUDED.llm_model,
         decided_at = now(),
         expires_at = now() + INTERVAL '30 days'`,
      [
        hash,
        raw,
        country ?? null,
        decision.decision,
        decision.matched_id,
        decision.proposed_master_id,
        decision.proposed_canonical,
        decision.proposed_relationship,
        decision.confidence,
        decision.reasoning,
        JSON.stringify(
          candidates.map((candidate) => ({
            id: candidate.id,
            master_id: candidate.master_id,
            canonical_name: candidate.canonical_name,
            score: candidate.score,
            source: candidate.source,
          }))
        ),
        MODEL,
      ]
    )
    .catch((error) => {
      console.warn(
        "[llm-merchant-canonicalize] PG cache write failed:",
        (error as Error).message
      );
    });
}

function fallbackDecision(raw: string, reason: string): LlmMerchantDecision {
  return {
    decision: "new",
    matched_id: null,
    proposed_canonical: raw.trim() || null,
    proposed_relationship: null,
    proposed_master_id: null,
    confidence: 0.5,
    reasoning: reason,
  };
}

export async function llmCanonicalizeMerchant(input: {
  raw: string;
  language: Lang;
  countryCode?: string | null;
  category?: string | null;
  candidates: MerchantCandidate[];
}): Promise<LlmMerchantDecision> {
  if (!client) {
    return fallbackDecision(
      input.raw,
      "OPENAI_API_KEY not set; defaulting to new merchant."
    );
  }

  const candidateLines =
    input.candidates.length === 0
      ? "(no candidates)"
      : input.candidates
          .map((candidate, index) => {
            const aliases = candidate.aliases.slice(0, 5).join(", ");
            const masterNote =
              candidate.master_id !== candidate.id
                ? `member_of=${candidate.master_id}`
                : "is_master";
            return [
              `${index + 1}.`,
              `id=${candidate.id}`,
              `master_id=${candidate.master_id}`,
              `name="${candidate.canonical_name}"`,
              `display="${candidate.display_name}"`,
              `kind=${candidate.merchant_kind}`,
              `${masterNote}`,
              `country=${candidate.country_code ?? "?"}`,
              `category=${candidate.category ?? "?"}`,
              `score=${candidate.score.toFixed(2)}`,
              `source=${candidate.source}`,
              `aliases=[${aliases}]`,
            ].join(" ");
          })
          .join("\n");

  const userPrompt = `OCR merchant string: "${input.raw}"
Language detected: ${input.language}
Country: ${input.countryCode ?? "unknown"}
Category hint: ${input.category ?? "unknown"}

Existing merchant candidates:
${candidateLines}

Return JSON only.`;

  try {
    const completion = await client.chat.completions.create({
      model: MODEL,
      temperature: 0,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM },
        { role: "user", content: userPrompt },
      ],
    });

    const rawContent = completion.choices[0]?.message?.content ?? "{}";
    const parsed = JSON.parse(rawContent) as Partial<LlmMerchantDecision>;

    return {
      decision:
        parsed.decision === "match" ||
        parsed.decision === "merge_to_master" ||
        parsed.decision === "new"
          ? parsed.decision
          : "new",
      matched_id: typeof parsed.matched_id === "string" ? parsed.matched_id : null,
      proposed_canonical:
        typeof parsed.proposed_canonical === "string"
          ? parsed.proposed_canonical
          : null,
      proposed_relationship:
        parsed.proposed_relationship === "legal_owner" ||
        parsed.proposed_relationship === "franchise" ||
        parsed.proposed_relationship === "subsidiary" ||
        parsed.proposed_relationship === "rebranded" ||
        parsed.proposed_relationship === "location" ||
        parsed.proposed_relationship === "duplicate"
          ? parsed.proposed_relationship
          : null,
      proposed_master_id:
        typeof parsed.proposed_master_id === "string"
          ? parsed.proposed_master_id
          : null,
      confidence:
        typeof parsed.confidence === "number"
          ? Math.max(0, Math.min(1, parsed.confidence))
          : 0.7,
      reasoning: typeof parsed.reasoning === "string" ? parsed.reasoning : "",
    };
  } catch (error) {
    return fallbackDecision(
      input.raw,
      `LLM merchant canonicalization failed: ${(error as Error).message.slice(0, 120)}`
    );
  }
}
