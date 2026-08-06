/**
 * Rebuild an epoch's published artefacts (catalog + manifest) from its snapshot.
 *
 * Shared by the preview and the seal so that what you are shown is byte-for-byte
 * what gets uploaded. If these were two code paths, a preview could reassure you
 * about bytes that were never published — which would make the review worthless.
 */

import {
  observationPreimage,
  buildCatalog,
  buildManifest,
  pickCatalogEntries,
  withdrawalPreimage,
  type Withdrawal,
  catalogHash,
  manifestHash,
  type PriceObservation,
  type CatalogEntry,
  type ManifestHeader,
} from "./leaf";
import { deriveObservationKind } from "@/config/price-ledger";

/** A row as stored in price_epoch_observations. */
export type SnapshotObservationRow = {
  canonical_product_id: string | null;
  product_name: string | null;
  brand: string | null;
  pack_size: string | null;
  category_path: string | null;
  country: string | null;
  city: string | null;
  merchant: string | null;
  obs_date: string | null;
  unit_price: string | null;
  currency: string | null;
  unit_type: string | null;
};

export type EpochSnapshotHeader = {
  epochNumber: number;
  windowStart: string;
  windowEnd: string;
  merkleRoot: string;
  observationCount: number;
  receiptCount: number;
};

/** A row as stored in price_epoch_withdrawals. */
export type SnapshotWithdrawalRow = {
  target_epoch: number;
  target_leaf: string;
  reason: string;
};

export type EpochArtifacts = {
  observations: PriceObservation[];
  catalog: string;
  catalogHash: string;
  manifest: string;
  manifestHash: string;
};

export function buildEpochArtifacts(
  header: EpochSnapshotHeader,
  obsRows: SnapshotObservationRow[],
  receiptLeafHashes: string[],
  withdrawalRows: SnapshotWithdrawalRow[] = []
): EpochArtifacts {
  const observations: PriceObservation[] = obsRows.map((r) => ({
    canonicalProductId: r.canonical_product_id ?? "",
    productName: r.product_name ?? "",
    brand: r.brand ?? "",
    packSize: r.pack_size ?? "",
    categoryPath: r.category_path ?? "",
    country: r.country ?? "",
    city: r.city ?? "",
    merchant: r.merchant ?? "",
    obsDate: r.obs_date ?? "",
    unitPrice: r.unit_price ?? "",
    currency: r.currency ?? "",
    unitType: r.unit_type ?? "",
    // Derived from category_path, exactly as the engine and verifier do — the
    // snapshot stores no kind column, so all three paths agree by construction.
    kind: deriveObservationKind(r.category_path ?? ""),
    discounted: "0" as const,
  }));

  const catalog = buildCatalog(pickCatalogEntries(observations, header.epochNumber), header.epochNumber);
  const cHash = catalogHash(catalog);

  const manifestHeader: ManifestHeader = {
    epochNumber: header.epochNumber,
    windowStart: header.windowStart,
    windowEnd: header.windowEnd,
    merkleRoot: header.merkleRoot,
    observationCount: header.observationCount,
    receiptCount: header.receiptCount,
    withdrawnCount: withdrawalRows.length,
    catalogHash: cHash,
  };
  const withdrawals: Withdrawal[] = withdrawalRows.map((w) => ({
    epochNumber: Number(w.target_epoch),
    targetLeaf: String(w.target_leaf),
    reason: String(w.reason),
  }));
  const manifest = buildManifest(
    manifestHeader,
    // Pass the epoch: a pre-v2 epoch must rebuild its 13-field lines, not gain two.
    observations.map((o) => observationPreimage(o, header.epochNumber)),
    receiptLeafHashes,
    withdrawals.map((w) => withdrawalPreimage(w))
  );

  return { observations, catalog, catalogHash: cHash, manifest, manifestHash: manifestHash(manifest) };
}
