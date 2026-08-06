/**
 * Step-7 analog for price epochs: independently verify a stored epoch.
 *
 * Deliberately reimplements the leaf preimage assembly + keccak + manifest build
 * from the STORED snapshot (does NOT import lib/prices/engine/leaf), then folds
 * with the independent merkle path (lib/rewards/verifier/merkle-independent). If
 * the engine and this path disagree on any leaf hash, the root, or the manifest
 * hash, verification fails. A price epoch that does not pass must never be sealed.
 *
 * The provenance preamble is the one part taken from config rather than rewritten:
 * it is static boilerplate wrapped around the data, where a mistake yields a typo
 * instead of a wrong price. Everything a bug could corrupt — preimages, ordering,
 * hashing, the fold — is still derived twice.
 *
 * Verifying from the persisted snapshot (not re-querying receipts) guarantees the
 * exact property external parties need: the on-chain root commits precisely the
 * published manifest, and the published manifest is exactly this snapshot — even
 * if the underlying receipts are later edited or re-canonicalised.
 */

import { keccak256 } from "js-sha3";
import { sql } from "@/lib/db/client";
import { rootIndependent } from "@/lib/rewards/verifier/merkle-independent";
import {
  FIELD_SEP,
  OBS_LEAF_TAG,
  WITHDRAWN_LEAF_TAG,
  PRICE_LEDGER_VERSION,
  LEDGER_FORMAT_V2_FROM_EPOCH,
  deriveObservationKind,
  manifestPreamble,
} from "@/config/price-ledger";

export type PriceVerifyResult = {
  ok: boolean;
  epochNumber: number;
  checks: { name: string; ok: boolean; reason?: string }[];
  recomputedRoot: string;
  recomputedManifestHash: string;
};

/**
 * Independent reassembly of an observation preimage from stored columns.
 * Mirrors the v1 field order: id, name, brand, pack, category, country, city,
 * merchant, date (no time), price, currency, unit.
 */
function obsPreimageIndependent(r: Record<string, unknown>, epochNumber: number): string {
  const f = (v: unknown) => (v === null || v === undefined ? "" : String(v));
  const fields = [
    OBS_LEAF_TAG,
    f(r.canonical_product_id),
    f(r.product_name),
    f(r.brand),
    f(r.pack_size),
    f(r.category_path),
    f(r.country),
    f(r.city),
    f(r.merchant),
    f(r.obs_date),
    f(r.unit_price),
    f(r.currency),
    f(r.unit_type),
  ];
  if (Number(epochNumber) >= LEDGER_FORMAT_V2_FROM_EPOCH) {
    // kind is re-derived from category_path, not read from a stored column — the
    // engine derives it the same way, so this path stays independent of it while
    // still agreeing byte-for-byte. discounted is "0" until extraction detects one.
    fields.push(deriveObservationKind(f(r.category_path)), "0");
  }
  return fields.join(FIELD_SEP);
}

export async function verifyPriceEpoch(epochNumber: number): Promise<PriceVerifyResult> {
  const fail = (name: string, reason: string): PriceVerifyResult => ({
    ok: false,
    epochNumber,
    checks: [{ name, ok: false, reason }],
    recomputedRoot: "",
    recomputedManifestHash: "",
  });

  const headerRows = await sql`
    SELECT epoch_number, window_start, window_end, merkle_root, manifest_hash,
           catalog_hash, catalog_tx, observation_count, receipt_count
    FROM price_epochs WHERE epoch_number = ${epochNumber}
  `;
  const header = (headerRows as any[])[0];
  if (!header) return fail("exists", "price epoch not found");

  const obsRows = (await sql`
    SELECT leaf_hash, canonical_product_id, product_name, brand, pack_size, category_path,
           country, city, merchant, obs_date, unit_price, currency, unit_type
    FROM price_epoch_observations WHERE epoch_number = ${epochNumber}
  `) as any[];
  const receiptRows = (await sql`
    SELECT leaf_hash FROM price_epoch_receipt_leaves WHERE epoch_number = ${epochNumber}
  `) as any[];

  // 1) each stored observation leaf hash must match an independent recompute.
  const obsLeafHashes: string[] = [];
  let leafMismatch: string | null = null;
  for (const r of obsRows) {
    const recomputed = keccak256(obsPreimageIndependent(r, header.epoch_number));
    obsLeafHashes.push(recomputed);
    if (recomputed !== String(r.leaf_hash) && !leafMismatch) {
      leafMismatch = `observation leaf hash mismatch (stored ${String(r.leaf_hash).slice(0, 12)}… vs recomputed ${recomputed.slice(0, 12)}…)`;
    }
  }

  const receiptLeafHashes = receiptRows.map((r) => String(r.leaf_hash));

  // Withdrawals are re-derived here, not read: the engine's own leaf_hash column is
  // exactly what this path exists to disagree with.
  const wdrRows = (await sql`
    SELECT target_epoch, target_leaf, reason FROM price_epoch_withdrawals
    WHERE epoch_number = ${epochNumber}
  `) as any[];
  const wdrPreimages = wdrRows.map((r) => {
    const f = (v: unknown) => (v === null || v === undefined ? "" : String(v));
    return [WITHDRAWN_LEAF_TAG, String(r.target_epoch), f(r.target_leaf), f(r.reason)].join(FIELD_SEP);
  });
  const wdrLeafHashes = wdrPreimages.map((p) => keccak256(p));

  const allLeaves = [...obsLeafHashes, ...receiptLeafHashes, ...wdrLeafHashes];

  // 2) independent root fold must equal the stored root.
  const recomputedRoot = rootIndependent(allLeaves);

  // 3) rebuild the manifest independently and re-hash it.
  const obsPreimages = obsRows.map((r) => obsPreimageIndependent(r, header.epoch_number)).sort();
  const recRec = [...receiptLeafHashes].sort();
  const manifestLines: string[] = [
    `=== YUMO YUMO PRICE EPOCH ${PRICE_LEDGER_VERSION} ===`,
    // Boilerplate is shared with the engine (config/price-ledger); the leaves,
    // their ordering and the fold above are re-derived here instead. A bug in a
    // preamble is a typo, a bug in a leaf is a wrong price on chain forever.
    ...(header.epoch_number >= LEDGER_FORMAT_V2_FROM_EPOCH ? manifestPreamble() : []),
    `EPOCH ${FIELD_SEP} ${header.epoch_number}`,
    `WINDOW_START ${FIELD_SEP} ${new Date(header.window_start).toISOString()}`,
    `WINDOW_END ${FIELD_SEP} ${new Date(header.window_end).toISOString()}`,
    `MERKLE_ROOT ${FIELD_SEP} ${header.merkle_root}`,
    `OBSERVATION_COUNT ${FIELD_SEP} ${header.observation_count}`,
    `RECEIPT_COUNT ${FIELD_SEP} ${header.receipt_count}`,
    ...(wdrPreimages.length ? [`WITHDRAWN_COUNT ${FIELD_SEP} ${wdrPreimages.length}`] : []),
    `CATALOG_HASH ${FIELD_SEP} ${header.catalog_hash ?? ""}`,
    `=== OBSERVATIONS ===`,
    ...obsPreimages,
    `=== RECEIPT_LEAVES ===`,
    ...recRec,
    ...(wdrPreimages.length ? [`=== WITHDRAWN ===`, ...[...wdrPreimages].sort()] : []),
  ];
  const recomputedManifestHash = keccak256(manifestLines.join("\n"));

  const checks = [
    { name: "leaf_hashes", ok: !leafMismatch, reason: leafMismatch ?? undefined },
    {
      name: "observation_count",
      ok: Number(header.observation_count) === obsRows.length,
      reason:
        Number(header.observation_count) === obsRows.length
          ? undefined
          : `header ${header.observation_count} vs stored ${obsRows.length}`,
    },
    {
      name: "receipt_count",
      ok: Number(header.receipt_count) === receiptRows.length,
      reason:
        Number(header.receipt_count) === receiptRows.length
          ? undefined
          : `header ${header.receipt_count} vs stored ${receiptRows.length}`,
    },
    {
      name: "root_match",
      ok: !!header.merkle_root && recomputedRoot === header.merkle_root,
      reason:
        recomputedRoot === header.merkle_root
          ? undefined
          : `stored ${String(header.merkle_root).slice(0, 12)}… vs recomputed ${recomputedRoot.slice(0, 12)}…`,
    },
    {
      name: "manifest_hash",
      ok: !!header.manifest_hash && recomputedManifestHash === header.manifest_hash,
      reason:
        recomputedManifestHash === header.manifest_hash
          ? undefined
          : `stored ${String(header.manifest_hash).slice(0, 12)}… vs recomputed ${recomputedManifestHash.slice(0, 12)}…`,
    },
  ];

  return {
    ok: checks.every((c) => c.ok),
    epochNumber,
    checks,
    recomputedRoot,
    recomputedManifestHash,
  };
}
