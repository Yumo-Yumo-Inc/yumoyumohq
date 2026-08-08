import crypto from "node:crypto";
import { db } from "@/lib/db/client";
import { fold } from "@/lib/insights/non-product-filter";
import { parseMarketFiyatiHtml } from "./market-fiyati-parser";
import type {
  ExternalImportError,
  ExternalImportInput,
  ExternalImportResult,
  ParsedExternalProduct,
} from "./types";

export interface ImportBatchRecord {
  id: string;
  batchKey: string;
  contentChecksum: string;
}

export interface ProductObservationWriteResult {
  productInserted: boolean;
  observationInserted: boolean;
}

export interface ExternalCatalogImportRepository {
  beginBatch(input: {
    source: string;
    batchKey: string;
    contentChecksum: string;
    searchTerm: string | null;
    locationLabel: string | null;
    pageCount: number;
    createdBy: string | null;
  }): Promise<ImportBatchRecord>;
  resolveMerchantId(label: string): Promise<string | null>;
  loadBrandIndex(): Promise<Map<string, string>>;
  upsertProductAndObservation(input: {
    source: string;
    product: ParsedExternalProduct;
    merchantId: string;
    brandSlug: string | null;
    batchId: string;
    locationLabel: string | null;
    searchTerm: string | null;
    observedAt: Date;
  }): Promise<ProductObservationWriteResult>;
  completeBatch(input: {
    batchId: string;
    parsedCount: number;
    importedCount: number;
    observationCount: number;
    errorCount: number;
  }): Promise<void>;
}

interface BatchRow {
  id: string;
  batch_key: string;
  content_checksum: string;
}

export class PostgresExternalCatalogImportRepository implements ExternalCatalogImportRepository {
  async beginBatch(input: {
    source: string;
    batchKey: string;
    contentChecksum: string;
    searchTerm: string | null;
    locationLabel: string | null;
    pageCount: number;
    createdBy: string | null;
  }): Promise<ImportBatchRecord> {
    const existing = await db.query<BatchRow>(
      `SELECT id, batch_key, content_checksum
         FROM external_catalog_import_batches
        WHERE source = $1 AND batch_key = $2`,
      [input.source, input.batchKey]
    );
    if (existing.rows[0]) {
      if (existing.rows[0].content_checksum !== input.contentChecksum) {
        throw new Error("batch_key_conflict");
      }
      return {
        id: existing.rows[0].id,
        batchKey: existing.rows[0].batch_key,
        contentChecksum: existing.rows[0].content_checksum,
      };
    }

    const inserted = await db.query<BatchRow>(
      `INSERT INTO external_catalog_import_batches
       (source, batch_key, content_checksum, search_term, location_label, page_count, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (source, batch_key) DO NOTHING
       RETURNING id, batch_key, content_checksum`,
      [
        input.source,
        input.batchKey,
        input.contentChecksum,
        input.searchTerm,
        input.locationLabel,
        input.pageCount,
        input.createdBy,
      ]
    );
    let row = inserted.rows[0];
    if (!row) {
      const raced = await db.query<BatchRow>(
        `SELECT id, batch_key, content_checksum
           FROM external_catalog_import_batches
          WHERE source = $1 AND batch_key = $2`,
        [input.source, input.batchKey]
      );
      row = raced.rows[0];
      if (!row) throw new Error("batch_insert_failed");
      if (row.content_checksum !== input.contentChecksum) throw new Error("batch_key_conflict");
    }
    return { id: row.id, batchKey: row.batch_key, contentChecksum: row.content_checksum };
  }

  async resolveMerchantId(label: string): Promise<string | null> {
    const { rows } = await db.query<{ id: string }>(
      `SELECT m.id
         FROM merchants m
        WHERE normalize_receipt_text(m.canonical_name) = normalize_receipt_text($1)
           OR normalize_receipt_text(m.display_name) = normalize_receipt_text($1)
           OR EXISTS (
             SELECT 1 FROM merchant_patterns mp
              WHERE mp.merchant_id = m.id
                AND normalize_receipt_text(COALESCE(mp.normalized_pattern, mp.pattern)) = normalize_receipt_text($1)
           )
        ORDER BY
          CASE WHEN normalize_receipt_text(m.canonical_name) = normalize_receipt_text($1) THEN 0 ELSE 1 END,
          CASE m.tier WHEN 'verified' THEN 0 WHEN 'candidate' THEN 1 ELSE 2 END
        LIMIT 1`,
      [label]
    );
    return rows[0]?.id ?? null;
  }

  async loadBrandIndex(): Promise<Map<string, string>> {
    const bySlug = new Map<string, Set<string>>();
    try {
      const { rows } = await db.query<{ slug: string; name: string; name_variants: string[] | null }>(
        `SELECT slug, name, name_variants FROM brand_registry WHERE slug IS NOT NULL`
      );
      for (const row of rows) {
        for (const label of [row.name, ...(row.name_variants ?? [])]) {
          for (const token of fold(label).split(" ")) {
            if (token.length < 3) continue;
            if (!bySlug.has(token)) bySlug.set(token, new Set());
            bySlug.get(token)?.add(row.slug);
          }
        }
      }
    } catch (error) {
      console.warn("[external-catalog/import] brand load failed:", (error as Error).message);
      return new Map();
    }
    // A token owned by two brands identifies neither. Guessing one would write a brand the
    // matcher then treats as a hard conflict, so the ambiguous token is dropped instead.
    const index = new Map<string, string>();
    for (const [token, slugs] of bySlug) {
      if (slugs.size === 1) index.set(token, [...slugs][0]);
    }
    return index;
  }

  async upsertProductAndObservation(input: {
    source: string;
    product: ParsedExternalProduct;
    merchantId: string;
    brandSlug: string | null;
    batchId: string;
    locationLabel: string | null;
    searchTerm: string | null;
    observedAt: Date;
  }): Promise<ProductObservationWriteResult> {
    const p = input.product;
    const { rows } = await db.query<{ product_inserted: boolean; observation_inserted: boolean }>(
      `WITH product_upsert AS (
         INSERT INTO external_product_catalog (
           source, source_product_id, merchant_id, raw_name, normalized_name, brand,
           package_count, package_size, package_unit, package_signature, attributes
         ) VALUES ($1, $2, $3, $4, normalize_receipt_text($4), $5, $6, $7, $8, $9, '{}'::jsonb)
         ON CONFLICT (source, source_product_id, merchant_id) DO UPDATE SET
           raw_name = EXCLUDED.raw_name,
           normalized_name = EXCLUDED.normalized_name,
           brand = EXCLUDED.brand,
           package_count = EXCLUDED.package_count,
           package_size = EXCLUDED.package_size,
           package_unit = EXCLUDED.package_unit,
           package_signature = EXCLUDED.package_signature
         RETURNING id, (xmax = 0) AS inserted
       ), observation_insert AS (
         INSERT INTO external_price_observations (
           external_product_id, merchant_id, location_label, search_term,
           price_tl, old_price_tl, unit_price_tl, unit_type, observed_at, batch_id
         )
         SELECT id, $3, $10, $11, $12, $13, $14, $15, $16, $17
           FROM product_upsert
         ON CONFLICT (
           external_product_id, batch_id, COALESCE(location_label, ''), COALESCE(search_term, '')
         ) DO NOTHING
         RETURNING id
       )
       SELECT
         (SELECT inserted FROM product_upsert) AS product_inserted,
         EXISTS(SELECT 1 FROM observation_insert) AS observation_inserted`,
      [
        input.source,
        p.sourceProductId,
        input.merchantId,
        p.rawName,
        input.brandSlug,
        p.package.count,
        p.package.size,
        p.package.unit,
        p.package.signature,
        input.locationLabel,
        input.searchTerm,
        p.priceTl,
        p.oldPriceTl,
        p.unitPriceTl,
        p.unitType,
        input.observedAt.toISOString(),
        input.batchId,
      ]
    );
    return {
      productInserted: rows[0]?.product_inserted === true,
      observationInserted: rows[0]?.observation_inserted === true,
    };
  }

  async completeBatch(input: {
    batchId: string;
    parsedCount: number;
    importedCount: number;
    observationCount: number;
    errorCount: number;
  }): Promise<void> {
    await db.query(
      `UPDATE external_catalog_import_batches
          SET parsed_count = GREATEST(parsed_count, $2),
              imported_count = GREATEST(imported_count, $3),
              observation_count = GREATEST(observation_count, $4),
              error_count = GREATEST(error_count, $5),
              status = CASE
                WHEN GREATEST(error_count, $5) > 0 THEN 'completed_with_errors'
                ELSE 'completed'
              END,
              completed_at = now()
        WHERE id = $1`,
      [input.batchId, input.parsedCount, input.importedCount, input.observationCount, input.errorCount]
    );
  }
}

/**
 * Resolve the brand from the product text against the brand registry.
 *
 * The longest matching token wins so "coca" beats a shorter incidental hit. An unmatched
 * name keeps `brand = NULL`: the matcher reads that as "unknown", never as a conflict.
 */
export function detectBrandSlug(rawName: string, index: Map<string, string>): string | null {
  if (index.size === 0) return null;
  let best: { token: string; slug: string } | null = null;
  for (const token of fold(rawName).split(" ")) {
    if (token.length < 3) continue;
    const slug = index.get(token);
    if (!slug) continue;
    if (!best || token.length > best.token.length) best = { token, slug };
  }
  return best?.slug ?? null;
}

function checksumFor(input: ExternalImportInput): string {
  return crypto
    .createHash("sha256")
    .update(input.pages.map((page) => page.html).join("\n<!-- page -->\n"))
    .digest("hex");
}

export async function importExternalCatalogHtml(
  input: ExternalImportInput,
  repository: ExternalCatalogImportRepository = new PostgresExternalCatalogImportRepository()
): Promise<ExternalImportResult> {
  if (input.source !== "marketfiyati") throw new Error("unsupported_source");
  if (!input.pages.length) throw new Error("pages_required");
  if (!(input.observedAt instanceof Date) || !Number.isFinite(input.observedAt.getTime())) {
    throw new Error("invalid_observed_at");
  }

  const contentChecksum = checksumFor(input);
  const batchKey = input.batchKey?.trim() || contentChecksum;
  const parsedPages = input.pages.map((page) =>
    parseMarketFiyatiHtml(page.html, page.pageNumber ?? null)
  );
  const errors: ExternalImportError[] = parsedPages.flatMap((page) => page.errors);
  const parsed = parsedPages.flatMap((page) => page.products);
  const batch = await repository.beginBatch({
    source: input.source,
    batchKey,
    contentChecksum,
    searchTerm: input.searchTerm?.trim() || null,
    locationLabel: input.locationLabel?.trim() || null,
    pageCount: input.pages.length,
    createdBy: input.createdBy?.trim() || null,
  });

  const brandIndex = await repository.loadBrandIndex();
  const merchantCache = new Map<string, string | null>();
  const seen = new Set<string>();
  let importedCount = 0;
  let observationCount = 0;
  let duplicateCount = 0;

  for (const product of parsed) {
    const merchantKey = product.merchantLabel.toLocaleLowerCase("tr-TR").trim();
    const dedupeKey = `${product.sourceProductId}|${merchantKey}`;
    if (seen.has(dedupeKey)) {
      duplicateCount += 1;
      continue;
    }
    seen.add(dedupeKey);

    if (!merchantCache.has(merchantKey)) {
      merchantCache.set(merchantKey, await repository.resolveMerchantId(product.merchantLabel));
    }
    const merchantId = merchantCache.get(merchantKey) ?? null;
    if (!merchantId) {
      errors.push({
        pageNumber: product.pageNumber,
        code: "merchant_not_found",
        message: `Merchant could not be resolved: ${product.merchantLabel}`,
      });
      continue;
    }

    const written = await repository.upsertProductAndObservation({
      source: input.source,
      product,
      merchantId,
      brandSlug: detectBrandSlug(product.rawName, brandIndex),
      batchId: batch.id,
      locationLabel: input.locationLabel?.trim() || null,
      searchTerm: input.searchTerm?.trim() || null,
      observedAt: input.observedAt,
    });
    if (written.productInserted) importedCount += 1;
    if (written.observationInserted) observationCount += 1;
  }

  await repository.completeBatch({
    batchId: batch.id,
    parsedCount: parsed.length,
    importedCount,
    observationCount,
    errorCount: errors.length,
  });

  return {
    batchId: batch.id,
    batchKey,
    parsedCount: parsed.length,
    importedCount,
    observationCount,
    duplicateCount,
    errors,
  };
}
