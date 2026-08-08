import { describe, expect, it } from "vitest";
import {
  detectBrandSlug,
  importExternalCatalogHtml,
  type ExternalCatalogImportRepository,
  type ImportBatchRecord,
  type ProductObservationWriteResult,
} from "../import-service";
import type { ParsedExternalProduct } from "../types";
import { marketFiyatiPageFixture } from "./market-fiyati-fixture";

class MemoryRepository implements ExternalCatalogImportRepository {
  batches = new Map<string, ImportBatchRecord>();
  products = new Map<string, ParsedExternalProduct>();
  brands = new Map<string, string | null>();
  observations = new Set<string>();

  async beginBatch(input: {
    source: string;
    batchKey: string;
    contentChecksum: string;
  }): Promise<ImportBatchRecord> {
    const key = `${input.source}|${input.batchKey}`;
    const existing = this.batches.get(key);
    if (existing) {
      if (existing.contentChecksum !== input.contentChecksum) throw new Error("batch_key_conflict");
      return existing;
    }
    const batch = { id: `batch-${this.batches.size + 1}`, batchKey: input.batchKey, contentChecksum: input.contentChecksum };
    this.batches.set(key, batch);
    return batch;
  }

  async resolveMerchantId(label: string): Promise<string | null> {
    return label.toLowerCase() === "bim" ? "merchant-bim" : null;
  }

  async loadBrandIndex(): Promise<Map<string, string>> {
    return new Map([["sut", "sut_brand"]]);
  }

  async upsertProductAndObservation(input: {
    source: string;
    product: ParsedExternalProduct;
    merchantId: string;
    brandSlug: string | null;
    batchId: string;
    locationLabel: string | null;
    searchTerm: string | null;
  }): Promise<ProductObservationWriteResult> {
    const productKey = `${input.source}|${input.product.sourceProductId}|${input.merchantId}`;
    const productInserted = !this.products.has(productKey);
    this.products.set(productKey, input.product);
    this.brands.set(productKey, input.brandSlug);
    const observationKey = `${productKey}|${input.batchId}|${input.locationLabel ?? ""}|${input.searchTerm ?? ""}`;
    const observationInserted = !this.observations.has(observationKey);
    this.observations.add(observationKey);
    return { productInserted, observationInserted };
  }

  async completeBatch(): Promise<void> {}
}

describe("external catalog import service", () => {
  it("merges four pages into one 100-product batch", async () => {
    const repository = new MemoryRepository();
    const result = await importExternalCatalogHtml(
      {
        source: "marketfiyati",
        pages: [1, 2, 3, 4].map((page) => ({ html: marketFiyatiPageFixture({ page }) })),
        batchKey: "fixture-100",
        observedAt: new Date("2026-08-07T10:00:00Z"),
      },
      repository
    );
    expect(result.parsedCount).toBe(100);
    expect(result.importedCount).toBe(100);
    expect(result.observationCount).toBe(100);
    expect(repository.products.size).toBe(100);
  });

  it("is idempotent when the same batch is imported twice", async () => {
    const repository = new MemoryRepository();
    const input = {
      source: "marketfiyati" as const,
      pages: [{ html: marketFiyatiPageFixture({ page: 1, count: 1 }) }],
      batchKey: "same-batch",
      observedAt: new Date("2026-08-07T10:00:00Z"),
    };
    const first = await importExternalCatalogHtml(input, repository);
    const second = await importExternalCatalogHtml(input, repository);
    expect(first.importedCount).toBe(1);
    expect(first.observationCount).toBe(1);
    expect(second.importedCount).toBe(0);
    expect(second.observationCount).toBe(0);
    expect(repository.products.size).toBe(1);
    expect(repository.observations.size).toBe(1);
  });

  it("deduplicates a repeated source product within a batch", async () => {
    const repository = new MemoryRepository();
    const result = await importExternalCatalogHtml(
      {
        source: "marketfiyati",
        pages: [
          { html: marketFiyatiPageFixture({ page: 1, count: 1 }) },
          { html: marketFiyatiPageFixture({ page: 2, count: 1, duplicateSourceId: "P0001" }) },
        ],
        observedAt: new Date("2026-08-07T10:00:00Z"),
      },
      repository
    );
    expect(result.parsedCount).toBe(2);
    expect(result.duplicateCount).toBe(1);
    expect(repository.products.size).toBe(1);
  });

  it("resolves the brand from the registry index", async () => {
    const repository = new MemoryRepository();
    await importExternalCatalogHtml(
      {
        source: "marketfiyati",
        pages: [{ html: marketFiyatiPageFixture({ page: 1, count: 1, start: 3 }) }],
        observedAt: new Date("2026-08-07T10:00:00Z"),
      },
      repository
    );
    expect([...repository.brands.values()]).toEqual(["sut_brand"]);
  });
});

describe("brand detection", () => {
  const index = new Map([
    ["eti", "eti"],
    ["karam", "eti_karam"],
    ["coca", "coca_cola"],
  ]);

  it("prefers the longest matching token", () => {
    expect(detectBrandSlug("ETI KARAM GOFRET 50 G", index)).toBe("eti_karam");
  });

  it("folds Turkish characters before matching", () => {
    expect(detectBrandSlug("Coca Cola Şişe 1 Lt", index)).toBe("coca_cola");
  });

  it("returns null when no brand token is present", () => {
    expect(detectBrandSlug("KKT. BRDK CORBA", index)).toBeNull();
  });

  it("returns null for an empty registry rather than guessing", () => {
    expect(detectBrandSlug("ETI KARAM GOFRET", new Map())).toBeNull();
  });
});

