/**
 * Contribution task generator.
 *
 * Scans unresolved product lines, groups them into (string, merchant) subjects, and
 * writes one open task per subject. Runs on a cron — never as a live query: the scan
 * touches every line item ever written, which is not something a screen open can pay for.
 *
 * Two things this deliberately does NOT do:
 *
 *   - It does not filter by row_count. PROD 2026-07-17: 96.9% of unresolved strings
 *     appear exactly once, and those are precisely the ones only their buyer can answer
 *     (K7). Generating them is right; showing them to a stranger is not. That decision
 *     belongs to the feed, which serves a single-row string only to a witness.
 *
 *   - It does not skip abbreviations. Shorthand like "K.GOFRET" is the whole point of
 *     the product — it is the question, not a reason to skip.
 *
 * A subject with no candidates produces no task: with nothing to put in the options, the
 * screen would be a blank text box, and a wrong-but-plausible free-text answer is worse
 * than no answer. Those strings wait for the machine (Faz 0 signals) or a field mission.
 *
 * Server-only.
 */

if (typeof window !== "undefined") {
  throw new Error("lib/contribution/build-tasks is server-only.");
}

import { db } from "@/lib/db/client";
import {
  CANDIDATES_PER_TASK,
  GENERIC_STRINGS,
  RETAIL_MERCHANT_CATEGORIES,
  taskPriority,
} from "@/config/contribution-center";
import { fold } from "@/lib/insights/non-product-filter";
import {
  retrieveProductCandidates,
  type ProductCandidate,
} from "@/lib/canonical/retrieve-product-candidates";

/**
 * The task asks the user for the product's BRAND and FULL NAME, so the options must read
 * like real branded products ("Eti Karam Gofret 50g", "Nabati Richeese Gofret 37g") — not
 * catalog fragments ("Gofret So", "Gofret Ci 29g").
 *
 * The candidates come back ranked by text similarity, and trigram similarity is biased
 * toward SHORT strings: a bare fragment "Gofret So" scores higher against "k gofret" than
 * the well-formed "Eti Karam Gofret 50g", because the extra tokens lower the ratio. So the
 * raw ranking actively prefers junk. These helpers re-rank by presentability instead — the
 * well-formed branded products already exist in the catalog; this surfaces them.
 */

const SIZE_RE = /\b\d+[.,]?\d*\s?(g|gr|gram|kg|ml|cl|lt?|l[iı]|lu|adet|x\d+)\b/i;

/** Prefix the brand when the name lacks it ("Gofret 81g" + eti_bidolu → "Eti Gofret 81g"). */
export function candidateLabel(c: Pick<ProductCandidate, "display_name_tr" | "canonical_name" | "brand_slug">): string {
  const base = (c.display_name_tr ?? c.canonical_name ?? "").trim();
  if (!c.brand_slug) return base;
  const brand = c.brand_slug.split("_")[0];
  if (brand.length < 2) return base;
  if (fold(base).includes(fold(brand))) return base;
  return `${brand.charAt(0).toUpperCase()}${brand.slice(1)} ${base}`;
}

/**
 * How much this candidate reads like a real, nameable product. Rewards a brand, a size,
 * and multiple real words; penalises 1–2 letter fragments ("So", "Ci") that mark a
 * malformed catalog entry.
 */
export function presentabilityScore(c: ProductCandidate): number {
  const label = candidateLabel(c);
  const tokens = label.split(/\s+/).filter(Boolean);
  const contentWords = tokens.filter(
    (t) => !/^[\d.,]+/.test(t) && t.replace(/[^a-zçğıöşüâî]/gi, "").length > 1,
  ).length;
  const fragments = tokens.filter((t) => /^[a-zçğıöşü]{1,2}$/i.test(t)).length;
  return (
    contentWords +
    (SIZE_RE.test(label) ? 1.5 : 0) +
    (c.brand_slug ? 1.5 : 0) -
    fragments * 1.5
  );
}

/** Below this, a candidate reads as a catalog fragment and is not shown as an option. */
const PRESENTABILITY_BAR = 4;

/**
 * Collapse near-duplicate options to the same product.
 *
 * The catalog holds several rows for one product ("Winston Slender Blue", "Winston Slen.
 * Blue", "Winston Slen Blue") — showing all three as options is meaningless. The signature
 * folds each word to its first 4 letters (so "Slen"/"Slender"/"Slen." collapse) but keeps
 * size tokens intact (so "Eti Gofret 50g" and "81g" stay distinct products).
 */
export function candidateSignature(label: string): string {
  return fold(label)
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .map((t) => t.slice(0, 4))
    .join("");
}

/** Subjects examined per run. Each miss costs an embedding call, so this is a budget. */
const DEFAULT_BATCH = 120;

interface SubjectRow {
  raw_text_norm: string;
  merchant_id: string | null;
  merchant_label: string | null;
  row_count: number;
  witness_count: number;
  merchant_count: number;
  price_median: string | number | null;
  unit_type: string | null;
  sample_raw_text: string | null;
  currency: string | null;
}

export interface BuildTasksResult {
  scanned: number;
  created: number;
  skippedGeneric: number;
  skippedAlreadyNamed: number;
  skippedNoCandidates: number;
  skippedExisting: number;
}

/**
 * A generic word identifies nothing — resolving "EKMEK" to a canonical bread teaches
 * us nothing about what was actually bought.
 *
 * These are also, perversely, the only strings that reach several witnesses (PROD: the
 * only 4+ witness strings were "UNLU MAM." and "YEDEK PARÇA"). A generator that ignored
 * this would hand the crowd exactly the questions that do not need answering, and look
 * productive while resolving nothing.
 */
// A dot glued inside or closing a word ("K.GOFRET", "FIND.SUT.CIK") — the product is
// still encoded even when a brand is present, so it stays a task.
const DOT_ABBREV_RE = /[a-zçğıöşü]\.[a-zçğıöşü]|[a-zçğıöşü]\.(\s|$)/i;

/**
 * Load brand tokens from brand_registry (single words, >= 3 chars, folded) for the
 * "already names its brand" test. Loaded once per generator run.
 */
async function loadBrandTokens(): Promise<Set<string>> {
  const tokens = new Set<string>();
  try {
    const { rows } = await db.query<{ name: string }>(
      `SELECT name FROM brand_registry WHERE name IS NOT NULL`,
    );
    for (const r of rows) {
      for (const t of fold(r.name).split(/[^a-z0-9]+/)) {
        if (t.length >= 3) tokens.add(t);
      }
    }
  } catch (error) {
    console.warn("[contribution/build-tasks] brand load failed:", (error as Error).message);
  }
  return tokens;
}

/**
 * Is the string already a complete, readable branded product? Then there is nothing to
 * identify — the receipt already tells us the brand and name ("WINSTON SLENDER BLUE",
 * "KIZILAY MADEN SUYU"). Asking would put the answer in the question. These are a machine
 * canonicalization gap, not a crowd task.
 *
 * Kept as tasks: strings that name a brand but still abbreviate the product with a dotted
 * cut ("TADELLE FIND.SUT.CIK"), and cryptic strings with no readable brand at all
 * ("K.GOFRET"), where the user knows what the receipt encoded.
 */
export function namesReadableBrand(rawName: string, brandTokens: Set<string>): boolean {
  if (DOT_ABBREV_RE.test(rawName)) return false;
  const toks = fold(rawName).split(/[^a-z0-9]+/).filter(Boolean);
  return toks.some((t) => t.length >= 3 && brandTokens.has(t));
}

export function isGenericString(rawName: string): boolean {
  const f = fold(rawName).replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
  if (!f) return true;
  if (GENERIC_STRINGS.has(f)) return true;
  // "EKMEK KG", "DOMATES ADET" — a generic head with only a unit after it.
  const head = f.replace(/\s+(kg|gr|gram|adet|ad|lt|litre|paket|kutu)$/, "").trim();
  if (GENERIC_STRINGS.has(head)) return true;
  // A fee/charge line ("Servis Ücreti", "Telsiz Kullanım Ücreti", "Kargo Bedeli") is a
  // non-product; identifying it as a "product" is meaningless. The line_kind classifier
  // keeps real purchased services ("Muayene Ücreti") as product, but those are services
  // to consume, not cryptic product strings to resolve — so they do not belong in the
  // identification pool either. Short only: a long descriptive name that ends in "ücreti"
  // is unusual and left alone.
  const words = f.split(" ");
  if (words.length <= 3 && /\b(ucret|ucreti|bedeli|bedel)$/.test(f)) return true;
  return false;
}

/**
 * Load (string, merchant) subjects that still have no canonical link.
 *
 * merchant_count is windowed over the string, not the group: it says how many merchants
 * print this string at all, which is where the product value sits — a string seen at
 * several merchants is one whose resolution merges price series across stores, which is
 * the entire point of a price-comparison product.
 */
async function loadSubjects(limit: number): Promise<SubjectRow[]> {
  const { rows } = await db.query<SubjectRow>(
    `
    WITH lines AS (
      SELECT
        upper(btrim(li.raw_name))                        AS raw_text_norm,
        r.merchant_id,
        r.username,
        li.raw_name,
        li.unit_type,
        li.unit_price_gross,
        r.pricing_currency AS currency
      FROM receipt_line_items li
      JOIN receipts r ON r.receipt_id = li.receipt_id
      WHERE li.canonical_id IS NULL
        AND (li.line_kind = 'product' OR li.line_kind IS NULL)
        AND li.raw_name IS NOT NULL
        AND length(btrim(li.raw_name)) > 0
        -- Coarse gate: only receipts from merchants that sell shelf products carry
        -- cryptic product strings. A bank/telecom/restaurant/fuel receipt has
        -- transactions, fees and menu items, not abbreviated products to name.
        AND r.merchant_category = ANY($2::text[])
    ),
    per_string AS (
      SELECT raw_text_norm, count(DISTINCT merchant_id)::int AS merchant_count
      FROM lines
      GROUP BY raw_text_norm
    ),
    per_subject AS (
      SELECT
        l.raw_text_norm,
        l.merchant_id,
        count(*)::int                              AS row_count,
        count(DISTINCT l.username)::int            AS witness_count,
        percentile_cont(0.5) WITHIN GROUP (ORDER BY l.unit_price_gross)
          FILTER (WHERE l.unit_price_gross > 0)    AS price_median,
        mode() WITHIN GROUP (ORDER BY l.unit_type) AS unit_type,
        mode() WITHIN GROUP (ORDER BY l.raw_name)  AS sample_raw_text,
        mode() WITHIN GROUP (ORDER BY l.currency)  AS currency
      FROM lines l
      GROUP BY l.raw_text_norm, l.merchant_id
    )
    SELECT
      s.raw_text_norm,
      s.merchant_id,
      m.display_name                AS merchant_label,
      s.row_count,
      s.witness_count,
      ps.merchant_count,
      s.price_median,
      s.unit_type,
      s.sample_raw_text,
      s.currency
    FROM per_subject s
    JOIN per_string ps ON ps.raw_text_norm = s.raw_text_norm
    LEFT JOIN merchants m ON m.id = s.merchant_id
    -- Skip subjects that already have a live task, and ones already retired as
    -- unresolvable — re-asking a question the crowd has already failed to answer just
    -- burns the same users on the same wall.
    WHERE NOT EXISTS (
      SELECT 1 FROM contribution_tasks t
      WHERE t.task_type = 'product_identify'
        AND t.raw_text_norm = s.raw_text_norm
        AND t.merchant_id IS NOT DISTINCT FROM s.merchant_id
        AND t.status IN ('open', 'capped', 'unresolvable', 'resolved')
    )
    -- Skip stragglers: strings the machine already knows. If a confident alias
    -- (>= 0.75, the same bar post-process auto-resolves at) already maps this string to
    -- a canonical, it is not an unknown — the line's canonical_id is NULL only because it
    -- was processed before the alias existed. Asking a human here is asking about
    -- something the machine can answer itself. PROD 2026-07-17: this is 9.8% of the pool,
    -- and it was the source of all four junk tasks in the first cron run ("Servis Ücreti",
    -- "Telsiz Kullanım Ücreti", a Portuguese carrier bag). A backfill/reprocess links
    -- them; the Contribution Center should not.
    AND NOT EXISTS (
      SELECT 1 FROM receipt_product_aliases a
      WHERE a.canonical_id IS NOT NULL
        AND a.raw_text_norm % lower(s.raw_text_norm)
        AND similarity(a.raw_text_norm, lower(s.raw_text_norm)) >= 0.75
    )
    ORDER BY (s.row_count * (1 + ps.merchant_count)) DESC, s.raw_text_norm
    LIMIT $1
    `,
    [limit, [...RETAIL_MERCHANT_CATEGORIES]]
  );
  return rows;
}

export async function buildContributionTasks(
  options: { limit?: number } = {}
): Promise<BuildTasksResult> {
  const limit = options.limit ?? DEFAULT_BATCH;
  const [subjects, brandTokens] = await Promise.all([loadSubjects(limit), loadBrandTokens()]);

  const result: BuildTasksResult = {
    scanned: subjects.length,
    created: 0,
    skippedGeneric: 0,
    skippedAlreadyNamed: 0,
    skippedNoCandidates: 0,
    skippedExisting: 0,
  };

  for (const s of subjects) {
    const sample = s.sample_raw_text ?? s.raw_text_norm;

    if (isGenericString(sample)) {
      result.skippedGeneric += 1;
      continue;
    }

    // The receipt already names the brand and product ("WINSTON SLENDER BLUE") — nothing
    // to ask; it needs machine canonicalization, not a crowd task.
    if (namesReadableBrand(sample, brandTokens)) {
      result.skippedAlreadyNamed += 1;
      continue;
    }

    const price = s.price_median == null ? null : Number(s.price_median);
    // Over-fetch so presentability selection has room to prefer well-formed branded
    // products over the short fragments trigram would otherwise rank first.
    const candidates = await retrieveProductCandidates({
      rawName: sample,
      merchantId: s.merchant_id,
      limit: 15,
      unitPrice: Number.isFinite(price as number) ? price : null,
      unitType: s.unit_type,
    });

    if (candidates.length === 0) {
      result.skippedNoCandidates += 1;
      continue;
    }

    // Keep only options that read like real products, best-formed first. A string whose
    // only matches are fragments gets no crowd task — garbage options are worse than none;
    // it becomes field-mission / catalog material instead. Then collapse near-duplicate
    // catalog rows so the user never sees the same product spelled three ways.
    const seenSignatures = new Set<string>();
    const presentable: Array<{ c: ProductCandidate; label: string }> = [];
    for (const c of candidates
      .map((cand) => ({ c: cand, p: presentabilityScore(cand) }))
      .filter((x) => x.p >= PRESENTABILITY_BAR)
      .sort((a, b) => b.p - a.p)) {
      const label = candidateLabel(c.c);
      const sig = candidateSignature(label);
      if (seenSignatures.has(sig)) continue;
      seenSignatures.add(sig);
      presentable.push({ c: c.c, label });
      if (presentable.length >= CANDIDATES_PER_TASK) break;
    }

    if (presentable.length === 0) {
      result.skippedNoCandidates += 1;
      continue;
    }

    const payload = presentable.map(({ c, label }) => ({
      canonical_id: c.id,
      label,
      score: Number(c.score.toFixed(3)),
      via: c.source,
      added_by: null as string | null,
    }));

    const inserted = await db.query<{ id: string }>(
      `
      INSERT INTO contribution_tasks (
        task_type, raw_text_norm, merchant_id, merchant_label, candidates,
        sample_raw_text, row_count, witness_count, merchant_count,
        price_median, currency, unit_type, priority
      )
      VALUES ('product_identify', $1, $2, $3, $4::jsonb, $5, $6, $7, $8, $9, $10, $11, $12)
      ON CONFLICT (task_type, raw_text_norm, COALESCE(merchant_id, '00000000-0000-0000-0000-000000000000'::uuid))
        WHERE status IN ('open', 'capped')
      DO NOTHING
      RETURNING id
      `,
      [
        s.raw_text_norm,
        s.merchant_id,
        s.merchant_label,
        JSON.stringify(payload),
        sample,
        s.row_count,
        s.witness_count,
        s.merchant_count,
        price,
        s.currency,
        s.unit_type,
        taskPriority(s.row_count, s.merchant_count),
      ]
    );

    if (inserted.rows.length > 0) result.created += 1;
    else result.skippedExisting += 1;
  }

  return result;
}
