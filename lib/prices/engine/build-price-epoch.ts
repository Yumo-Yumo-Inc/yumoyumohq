/**
 * Build one price epoch from the CLEAN LAYER (I/O shell).
 *
 * The ledger reads ONLY from price_ledger_clean (Uğur 2026-07-16) — never from
 * raw receipt_line_items. Everything that decides what is publishable (tax/
 * placeholder removal, unit normalisation, internal-median or external-reference
 * validation, category flexibility, pack-uncertainty) already happened there;
 * this file just serialises what was accepted. Only disposition='clean' is
 * published: 'excluded' and 'hold' are out of scope, 'review' goes to the review
 * queue (K5).
 *
 * Two leaf kinds land in one tree:
 *   - observations: public, identity-free, self-describing (no time, no wallet)
 *   - receipt anchors: opaque hashes binding receipt_id + content_hash + wallet,
 *     so an owner can prove a receipt is theirs without exposing anything (K3)
 *
 * Returns the epoch; does NOT write to the DB and NEVER signs. The cron persists;
 * ops publishes to Arweave + seals the root on Solana.
 */

import { sql } from "@/lib/db/client";
import { buildTree } from "@/lib/rewards/engine/merkle";
import { deriveObservationKind, publishCeiling } from "@/config/price-ledger";
import {
  type PriceObservation,
  observationLeaf,
  withdrawalPreimage,
  withdrawalLeaf,
  type Withdrawal,
  observationPreimage,
  receiptLeaf,
  canonicalMoney,
  canonicalDate,
  normalizeField,
  buildManifest,
  buildCatalog,
  pickCatalogEntries,
  catalogHash,
  manifestHash,
  type ManifestHeader,
} from "./leaf";
import { isDateInRange } from "./clean-layer";

type BuiltObservation = PriceObservation & {
  sourceLineId: number;
  leafHash: string;
  leafIndex: number;
};

type BuiltReceiptAnchor = {
  receiptId: string;
  leafHash: string;
  leafIndex: number;
};

export type PriceEpochResult = {
  epochNumber: number;
  windowStart: string;
  windowEnd: string;
  merkleRoot: string;
  manifestHash: string;
  manifest: string;
  catalog: string;
  catalogHash: string;
  observationCount: number;
  receiptCount: number;
  withdrawnCount: number;
  observations: BuiltObservation[];
  receiptAnchors: BuiltReceiptAnchor[];
  /** Observations from earlier sealed epochs this one retracts. */
  withdrawals: BuiltWithdrawal[];
};

type BuiltWithdrawal = Withdrawal & { leafHash: string; leafIndex: number };

/**
 * Everything clean that has not been published yet — NOT a time window.
 *
 * price_ledger_clean.created_at is when the clean row was written, and the clean
 * layer is rebuilt whenever research turns 'hold' into 'clean'. Windowing on it
 * would re-publish sealed data after every rebuild.
 *
 * A line republishes when its PRICE changed, not when any byte of it changed
 * (Uğur, 2026-07-17). Leaf identity was the obvious rule and the wrong one: the
 * leaf covers every field, so normalising "İzmir" to "IZMIR" rewrote 5,249 leaves
 * and the epoch offered to withdraw and reissue all of them. The permanent record
 * would have read as 6,433 mistakes where 161 were made, and the real ones would
 * have been lost in the pile.
 *
 * So spelling settles quietly — old epochs keep the spelling they published, new
 * ones use the normalised form, and a reader folds the city before grouping (the
 * recipe says so). A wrong PRICE is a different thing, and it gets withdrawn.
 */
async function getObservations(epochNumber: number): Promise<(PriceObservation & { sourceLineId: number })[]> {
  // The publication delay is applied HERE, on selection, not in classifyLine: a
  // fresh price is correct and belongs in the median, it just waits its turn. The
  // ceiling moves with the build, so an observation held back today is picked up
  // by a later epoch once it ages past it — nothing is dropped.
  const ceiling = publishCeiling(new Date().toISOString().slice(0, 10));
  const rows = (await sql`
    SELECT c.source_line_id, c.canonical_id, c.product, c.brand, c.pack_size, c.category,
           c.country, c.city, c.merchant, c.obs_date, c.normalized_price, c.currency, c.unit_type
    FROM price_ledger_clean c
    WHERE c.disposition = 'clean'
      AND c.obs_date <= ${ceiling}
  `) as any[];
  // What each source line was last published AT — the price is what decides.
  const publishedPrice = new Map<number, string>();
  for (const r of (await sql`
    SELECT source_line_id, unit_price FROM price_epoch_observations
    WHERE epoch_number <> ${epochNumber} AND source_line_id IS NOT NULL
  `) as any[]) {
    publishedPrice.set(Number(r.source_line_id), canonicalMoney(r.unit_price));
  }
  return rows.map((r) => ({
    sourceLineId: Number(r.source_line_id),
    canonicalProductId: normalizeField(r.canonical_id),
    productName: normalizeField(r.product),
    brand: normalizeField(r.brand),
    packSize: normalizeField(r.pack_size),
    categoryPath: normalizeField(r.category),
    country: normalizeField(r.country).toUpperCase(),
    city: normalizeField(r.city),
    merchant: normalizeField(r.merchant),
    obsDate: canonicalDate(r.obs_date),
    unitPrice: canonicalMoney(r.normalized_price),
    currency: normalizeField(r.currency).toUpperCase(),
    unitType: normalizeField(r.unit_type),
    kind: deriveObservationKind(normalizeField(r.category)),
    discounted: "0" as const, // extraction does not detect discounts yet; field reserved
  })).filter((o) => {
    const was = publishedPrice.get(o.sourceLineId);
    return was === undefined || was !== o.unitPrice;
  });
}

/**
 * Observations an earlier SEALED epoch published that we now know are wrong.
 *
 * Gone or no longer clean → withdraw, carrying the clean layer's own reason. Still
 * clean but at a different PRICE → withdraw the stale leaf; the corrected line goes
 * out in this epoch (getObservations).
 *
 * Price, not the leaf: a leaf comparison also fires on a renormalised city or a
 * pack_size filled in from the name, and retracting 6,272 correct observations over
 * spelling would bury the 161 that are actually wrong.
 *
 * Only SEALED epochs are considered: a pending epoch's rows are still being built
 * and would be withdrawing themselves mid-flight.
 *
 * A leaf is withdrawn ONCE (G1, Uğur 2026-08-07). The scan re-evaluates every
 * sealed observation on every build, and without a cross-epoch exclusion it
 * re-emitted the same retraction in every epoch: #2..#22 each carried the
 * identical 277 withdrawals (21 × 277 = 5.817 rows), and each future seal would
 * have enshrined a byte-identical retraction block again. Only withdrawals from
 * SEALED epochs count as already-made: a pending epoch's retraction is still being
 * settled and may be rebuilt, so it must not suppress a legitimate new one.
 */
async function getWithdrawals(epochNumber: number): Promise<Withdrawal[]> {
  const rows = (await sql`
    SELECT o.epoch_number, o.leaf_hash, o.unit_price AS published_price,
           c.disposition, c.reason, c.normalized_price
    FROM price_epoch_observations o
    JOIN price_epochs e ON e.epoch_number = o.epoch_number AND e.memo_tx IS NOT NULL
    LEFT JOIN price_ledger_clean c ON c.source_line_id = o.source_line_id
    WHERE o.epoch_number <> ${epochNumber}
  `) as any[];

  // Retractions already sealed on-chain (memo_tx set). These are permanent; a
  // reader who applied epochs in order already dropped the leaf, so re-emitting it
  // here would only duplicate the permanent record.
  const alreadyWithdrawn = new Set<string>();
  for (const w of (await sql`
    SELECT w.target_epoch, w.target_leaf
    FROM price_epoch_withdrawals w
    JOIN price_epochs e ON e.epoch_number = w.epoch_number AND e.memo_tx IS NOT NULL
    WHERE w.epoch_number <> ${epochNumber}
  `) as any[]) {
    alreadyWithdrawn.add(`${String(w.target_epoch)}|${String(w.target_leaf)}`);
  }

  // A leaf is withdrawn once. Epoch 1 published some leaves more than once —
  // identical product, merchant, date and price hash to the same leaf — and the
  // retraction names the leaf, so one record retires every copy of it.
  const byTarget = new Map<string, Withdrawal>();
  const remember = (w: Withdrawal) => {
    const k = `${w.epochNumber}|${w.targetLeaf}`;
    const prev = byTarget.get(k);
    // Same leaf, two reasons: settle it by sorting rather than by row order, so a
    // rebuild produces the same manifest bytes.
    if (!prev || w.reason < prev.reason) byTarget.set(k, w);
  };

  for (const r of rows) {
    const published = String(r.leaf_hash);
    if (alreadyWithdrawn.has(`${String(r.epoch_number)}|${published}`)) continue;
    if (!r.disposition) {
      remember({ epochNumber: Number(r.epoch_number), targetLeaf: published, reason: "no_longer_in_ledger" });
      continue;
    }
    if (r.disposition !== "clean") {
      remember({
        epochNumber: Number(r.epoch_number),
        targetLeaf: published,
        reason: (r.reason || "failed_revalidation").toLowerCase(),
      });
      continue;
    }
    if (canonicalMoney(r.published_price) !== canonicalMoney(r.normalized_price)) {
      remember({ epochNumber: Number(r.epoch_number), targetLeaf: published, reason: "superseded_by_corrected_observation" });
    }
  }
  return [...byTarget.values()];
}

/**
 * Receipt anchors — only receipts from the period the ledger covers (Uğur
 * 2026-07-17: an epoch of 2026 prices anchors 2026 receipts, nothing else).
 * The date is derived exactly as an observation's is, so the two gates cannot
 * disagree about what "2026" means.
 *
 * The wallet is hashed in and never published (K3, a privacy property). It is
 * read HERE, at build time: the leaf freezes whichever wallet was linked when the
 * epoch was built, and sealing makes that permanent. Linking a wallet later
 * affects only future receipts — it cannot reach back into a sealed leaf.
 *
 * A wallet in the leaf is what later makes ownership provable, via a signature
 * from its private key (lib/prices/ownership.ts) — the address alone proves
 * nothing, since it is public. Receipts without a wallet still anchor (empty
 * key): they remain verifiable as unaltered, but can never be claimed, and
 * nothing is fabricated to fill the gap.
 */
async function getReceiptAnchors(
  epochNumber: number
): Promise<{ receiptId: string; contentHash: string; wallet: string }[]> {
  const rows = (await sql`
    SELECT r.receipt_id,
           COALESCE(r.content_hash, r.receipt_hash, r.receipt_id) AS content_hash,
           COALESCE(r.wallet_address, u.wallet_address, '')        AS wallet,
           r.extraction_date_value                                 AS d,
           r.created_at                                            AS created_at
    FROM receipts r
    LEFT JOIN users u ON u.username = r.username
    WHERE COALESCE(r.flags_rejected, false) = false
      AND r.duplicate_of IS NULL
      AND COALESCE(r.status, '') <> 'rejected'
      AND NOT EXISTS (
        SELECT 1 FROM price_epoch_receipt_leaves l
        WHERE l.receipt_id = r.receipt_id AND l.epoch_number <> ${epochNumber}
      )
  `) as any[];
  const today = new Date().toISOString().slice(0, 10);
  return rows
    .filter((r) => isDateInRange(canonicalDate(r.d) || canonicalDate(r.created_at), today))
    .map((r) => ({
      receiptId: String(r.receipt_id),
      contentHash: String(r.content_hash),
      wallet: String(r.wallet ?? ""),
    }));
}

/** Product catalog for the epoch's products — published alongside the manifest (K1). */

/** Build (but do not persist) the price epoch. */
export async function buildPriceEpoch(
  epochNumber: number,
  windowStart: string,
  windowEnd: string
): Promise<PriceEpochResult> {
  if (!sql) throw new Error("Database not available");

  // window_start/window_end describe the epoch's coverage in the manifest; they
  // do not select rows (see getObservations).
  const observations = await getObservations(epochNumber);
  const anchors = await getReceiptAnchors(epochNumber);
  const withdrawals = await getWithdrawals(epochNumber);

  const obsLeafHashes = observations.map((o) => observationLeaf(o, epochNumber));
  const receiptLeafHashes = anchors.map((a) => receiptLeaf(a));
  // Withdrawals fold in with everything else: a retraction the chain seals is a
  // retraction nobody can quietly drop later.
  const withdrawalLeafHashes = withdrawals.map((w) => withdrawalLeaf(w));

  const allLeafHashes = [...obsLeafHashes, ...receiptLeafHashes, ...withdrawalLeafHashes];
  const { root, layers } = buildTree(allLeafHashes);
  const sorted = layers[0]; // ascending, includes duplicates

  // Consume sorted positions so identical leaf hashes still get unique indices.
  const positionsByHash = new Map<string, number[]>();
  sorted.forEach((h, i) => {
    const arr = positionsByHash.get(h);
    if (arr) arr.push(i);
    else positionsByHash.set(h, [i]);
  });
  const takeIndex = (h: string): number => {
    const arr = positionsByHash.get(h);
    return arr && arr.length ? arr.shift()! : -1;
  };

  const builtObservations: BuiltObservation[] = observations.map((o, i) => ({
    ...o,
    leafHash: obsLeafHashes[i],
    leafIndex: takeIndex(obsLeafHashes[i]),
  }));
  const builtAnchors: BuiltReceiptAnchor[] = anchors.map((a, i) => ({
    receiptId: a.receiptId,
    leafHash: receiptLeafHashes[i],
    leafIndex: takeIndex(receiptLeafHashes[i]),
  }));
  const builtWithdrawals: BuiltWithdrawal[] = withdrawals.map((w, i) => ({
    ...w,
    leafHash: withdrawalLeafHashes[i],
    leafIndex: takeIndex(withdrawalLeafHashes[i]),
  }));

  const catalog = buildCatalog(pickCatalogEntries(observations, epochNumber), epochNumber);
  const cHash = catalogHash(catalog);

  const header: ManifestHeader = {
    epochNumber,
    windowStart,
    windowEnd,
    merkleRoot: root,
    observationCount: builtObservations.length,
    receiptCount: builtAnchors.length,
    withdrawnCount: withdrawals.length,
    catalogHash: cHash,
  };
  const manifest = buildManifest(
    header,
    observations.map((o) => observationPreimage(o, epochNumber)),
    receiptLeafHashes,
    withdrawals.map((w) => withdrawalPreimage(w))
  );

  return {
    epochNumber,
    windowStart,
    windowEnd,
    merkleRoot: root,
    manifestHash: manifestHash(manifest),
    manifest,
    catalog,
    catalogHash: cHash,
    observationCount: builtObservations.length,
    receiptCount: builtAnchors.length,
    withdrawnCount: withdrawals.length,
    observations: builtObservations,
    receiptAnchors: builtAnchors,
    withdrawals: builtWithdrawals,
  };
}
