/**
 * Seed file → upsert into the merchants table.
 *
 * Flow:
 *   1. For each seed entry, does an exact match already exist in merchants?
 *      - checked via the canonical_name + country_code unique index
 *   2. If not, INSERT (based on tier)
 *   3. aliases list → upsert into merchant_patterns
 *   4. update display_names JSONB (multilingual)
 *   5. Idempotent: re-running the same seed file does not create new rows
 *
 * Cluster auto-detect (optional):
 *   - When a new master is added with embedding cosine ≥ 0.95 against an
 *     existing master, write a suggestion to the review queue (admin decides on merge).
 */

import { db } from "@/lib/db/client";
import type { SeedFile, SeedMerchant } from "../../../data/seeds/_schema";
import { normalizeEntity } from "../preprocess";
import { phoneticKey } from "../phonetic";

export interface ImportStats {
  total: number;
  inserted: number;
  updated: number;
  skipped: number;
  errors: number;
  alias_added: number;
}

export interface ImportOptions {
  dryRun?: boolean;
  /** Force overwrite display_names + tier on existing entries */
  overwrite?: boolean;
}

interface ExistingMerchant {
  id: string;
  canonical_name: string;
  display_name: string;
  tier: string;
  merchant_kind: string;
  display_names: Record<string, string> | null;
}

export async function importSeedFile(
  seed: SeedFile,
  options: ImportOptions = {}
): Promise<ImportStats> {
  const stats: ImportStats = {
    total: seed.merchants.length,
    inserted: 0,
    updated: 0,
    skipped: 0,
    errors: 0,
    alias_added: 0,
  };

  for (const m of seed.merchants) {
    try {
      const existing = await findExisting(m, seed.country_code);
      if (existing) {
        if (options.overwrite) {
          if (!options.dryRun) {
            await updateExisting(existing.id, m);
            stats.alias_added += await syncAliases(
              existing.id,
              m.aliases ?? [],
              options
            );
          }
          stats.updated++;
        } else {
          stats.skipped++;
        }
        continue;
      }

      // New entry
      if (!options.dryRun) {
        const id = await insertNewMerchant(m, seed.country_code);
        if (id) {
          stats.alias_added += await syncAliases(id, m.aliases ?? [], options);
          stats.inserted++;
        } else {
          stats.errors++;
        }
      } else {
        stats.inserted++; // dry-run count
      }
    } catch (e) {
      console.warn(
        `[seed-importer] error for ${m.id} (${m.canonical_name}):`,
        (e as Error).message.slice(0, 120)
      );
      stats.errors++;
    }
  }

  return stats;
}

async function findExisting(
  m: SeedMerchant,
  countryCode: string
): Promise<ExistingMerchant | null> {
  const rows = await db.query<ExistingMerchant>(
    `SELECT id, canonical_name, display_name, tier, merchant_kind, display_names
     FROM merchants
     WHERE country_code = $1
       AND (
         LOWER(TRIM(canonical_name)) = LOWER(TRIM($2))
         OR LOWER(TRIM(display_name)) = LOWER(TRIM($2))
         OR ($3::text IS NOT NULL AND vkn = $3)
       )
     LIMIT 1`,
    [countryCode, m.canonical_name, m.vkn ?? null]
  );
  return rows.rows[0] ?? null;
}

async function insertNewMerchant(
  m: SeedMerchant,
  countryCode: string
): Promise<string | null> {
  // display_name preference: prefer 'tr', then first available, fallback to canonical_name
  const display =
    m.display_names.tr ??
    Object.values(m.display_names)[0] ??
    m.canonical_name;

  // master_id is NOT inserted here: the trg_merchants_set_self_master BEFORE INSERT
  // trigger sets NEW.master_id = NEW.id (defined in migration 073).
  const { rows } = await db.query<{ id: string }>(
    `INSERT INTO merchants (
       canonical_name,
       display_name,
       display_names,
       category,
       tier,
       merchant_kind,
       country_code,
       vkn,
       canonization_source,
       canonization_confidence
     )
     VALUES ($1, $2, $3::jsonb, $4, $5, $6, $7, $8, 'public_db', 1.0)
     ON CONFLICT DO NOTHING
     RETURNING id`,
    [
      m.canonical_name,
      display,
      JSON.stringify(m.display_names),
      m.category,
      m.tier ?? "verified",
      m.merchant_kind ?? "brand",
      countryCode,
      m.vkn ?? null,
    ]
  );
  if (rows.length === 0) return null;
  return rows[0].id;
}

async function updateExisting(id: string, m: SeedMerchant): Promise<void> {
  // Merge seed into existing display_names (overlay, not override)
  await db.query(
    `UPDATE merchants
     SET
       display_names = COALESCE(display_names, '{}'::jsonb) || $1::jsonb,
       category = COALESCE(NULLIF($2, ''), category),
       tier = COALESCE(NULLIF($3, ''), tier),
       merchant_kind = COALESCE(NULLIF($4, ''), merchant_kind),
       canonization_source = 'public_db',
       updated_at = now()
     WHERE id = $5`,
    [
      JSON.stringify(m.display_names),
      m.category ?? "",
      m.tier ?? "",
      m.merchant_kind ?? "",
      id,
    ]
  );
}

async function syncAliases(
  merchantId: string,
  aliases: string[],
  options: ImportOptions
): Promise<number> {
  if (aliases.length === 0) return 0;
  if (options.dryRun) return aliases.length;

  let added = 0;
  for (const alias of aliases) {
    const trimmed = alias.trim();
    if (!trimmed) continue;
    const norm = normalizeEntity(trimmed);
    const pkey = phoneticKey(trimmed);

    try {
      // language is CHAR(2) — 'unknown' (7 chars) doesn't fit, fall back to NULL
      const lang = norm.language === "unknown" ? null : norm.language;
      const result = await db.query<{ id: string }>(
        `INSERT INTO merchant_patterns
           (merchant_id, pattern, normalized_pattern, pattern_type,
            confidence_score, token_set, legal_stripped, phonetic_key,
            language, source)
         VALUES ($1, $2, $3, 'exact', 1.0, $4::text[], $5, $6, $7, 'public_db')
         ON CONFLICT DO NOTHING
         RETURNING id`,
        [
          merchantId,
          trimmed,
          norm.asciiNormalized,
          norm.contentTokens,
          norm.legalStripped,
          pkey,
          lang,
        ]
      );
      if (result.rows.length > 0) added++;
    } catch (e) {
      console.warn(
        `[seed-importer] alias insert failed for "${trimmed}":`,
        (e as Error).message.slice(0, 80)
      );
    }
  }
  return added;
}
