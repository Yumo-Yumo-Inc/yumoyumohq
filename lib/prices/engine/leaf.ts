/**
 * Canonical leaf + manifest spec for the price ledger (engine side).
 *
 * Division of labour (Uğur 2026-07-16): **Arweave is the database** (the open
 * price data lives there), **Solana is the proof of expense** (one memo per epoch
 * carrying the merkle root + manifest hash + arweave tx). Solana holds no data —
 * it anchors it. Anyone rebuilds the dataset from Arweave and verifies it against
 * the root, then queries their own copy.
 *
 * Two leaf kinds share one Merkle tree (tree primitives reused from the reward
 * engine, lib/rewards/engine/merkle — generic over leaf hashes):
 *
 *   observation leaf (PUBLIC, identity-free, self-describing):
 *     preimage = `price-obs:v1|{canonical_product_id}|{product_name}|{brand}
 *                 |{pack_size}|{category_path}|{country}|{city}|{merchant}
 *                 |{obs_date}|{unit_price}|{currency}|{unit_type}`
 *     leaf     = keccak256(utf8(preimage))
 *
 *     The product NAME/brand/pack are in the leaf on purpose: a bare UUID is
 *     meaningless to a third party, and "look up Sek milk at Migros over the last
 *     year" is the whole point (K1). NO time — only the date: same merchant+date+
 *     minute would let anyone regroup a basket, which rebuilds a shopping profile
 *     even without a name (K2). No wallet, no pseudonym, no receipt id.
 *
 *   receipt leaf (PRIVATE — only the hash is ever published, K3/K4):
 *     preimage = `price-receipt:v1|{receipt_id}|{content_hash}|{wallet}`
 *     leaf     = keccak256(utf8(preimage))
 *
 *     The wallet is hashed in and appears nowhere on chain — a PRIVACY property:
 *     a stranger sees an opaque string and cannot reverse it (K3).
 *
 *     It is NOT an ownership proof. A wallet address is a public identifier, not
 *     a secret, so anyone holding (receipt_id, content_hash, wallet) derives the
 *     same leaf. Folding the proof shows the receipt was ANCHORED unaltered —
 *     proving the wallet is yours needs a signature from its private key, which
 *     this system never requests. Correction of 2026-07-17; the ownership claim
 *     was wrong. See the decision memo before re-stating it anywhere.
 *
 * Every string is normalised deterministically so the engine, the independent
 * verifier, and any external re-builder agree byte-for-byte. Values are sanitised
 * to never contain the field separator.
 *
 * The published manifest is labeled, section-delimited plain text (proje T1).
 */

import { keccak256 } from "js-sha3";
import {
  FIELD_SEP,
  OBS_LEAF_TAG,
  RECEIPT_LEAF_TAG,
  WITHDRAWN_LEAF_TAG,
  PRICE_LEDGER_VERSION,
  PRICE_MEMO_PREFIX,
  SEALER_ADDRESS,
  PUBLIC_SITE,
  LEDGER_FORMAT_V2_FROM_EPOCH,
  manifestPreamble,
  catalogPreamble,
} from "@/config/price-ledger";

/** A public, identity-free price observation. All fields are pre-normalised. */
export type PriceObservation = {
  canonicalProductId: string;
  productName: string;
  brand: string;
  packSize: string;
  categoryPath: string;
  country: string;
  city: string;
  merchant: string;
  obsDate: string; // YYYY-MM-DD — date only, never a time (K2)
  unitPrice: string; // canonical money, 2 dp, e.g. "31.90"
  currency: string; // e.g. "TRY"
  unitType: string;
  /**
   * v2 fields. Published only from LEDGER_FORMAT_V2_FROM_EPOCH onward — an earlier
   * epoch's leaf must stay 13 fields or its sealed root breaks.
   *
   * kind: "product" for a branded/packaged good whose id means one thing;
   *       "category" for loose produce (Domates, Karpuz) where the id is a
   *       category, not a package — Open Prices types these apart from birth, and
   *       so must we, or one id spans a 10-egg box and a 30-egg tray.
   * discounted: "1" if this price was on offer, else "0". A promo silently drags a
   *       median down, so it belongs in the record rather than in the noise. The
   *       value is "0" until extraction learns to read a discount — the field is
   *       here now so a permanent ledger never has to retrofit it.
   */
  kind?: "product" | "category";
  discounted?: "0" | "1";
};

/** A private receipt anchor — only the hash is ever exposed. */
export type ReceiptAnchor = {
  receiptId: string;
  contentHash: string;
  /** Invisible key: hashed in, never published (K3). */
  wallet: string;
};

/** Collapse whitespace, strip the separator, trim. Empty/undefined → "". */
export function normalizeField(value: unknown): string {
  if (value === null || value === undefined) return "";
  return String(value)
    .replace(new RegExp(`\\${FIELD_SEP}`, "g"), " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Canonical money string: fixed 2 decimals. Normalising a unit price via
 * line_total/quantity produces long floats (31.899521531100483); a permanent
 * public record should read like money.
 */
export function canonicalMoney(value: unknown): string {
  const n = typeof value === "number" ? value : parseFloat(String(value));
  if (!Number.isFinite(n)) return "";
  return n.toFixed(2);
}

/** Normalise a receipt date field to YYYY-MM-DD, or "" when unparseable. */
export function canonicalDate(value: unknown): string {
  const raw = normalizeField(value);
  if (!raw) return "";
  const iso = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;
  const dmy = raw.match(/^(\d{1,2})[./](\d{1,2})[./](\d{2,4})/);
  if (dmy) {
    const d = dmy[1].padStart(2, "0");
    const m = dmy[2].padStart(2, "0");
    let y = dmy[3];
    if (y.length === 2) y = `20${y}`;
    return `${y}-${m}-${d}`;
  }
  const parsed = new Date(raw);
  if (!Number.isNaN(parsed.getTime())) return parsed.toISOString().slice(0, 10);
  return "";
}

/**
 * The exact preimage string committed for one observation (also its manifest row).
 *
 * `epochNumber` decides the field count: epochs sealed before v2 keep the 13-field
 * line they published, so their root still rebuilds; v2 epochs append kind +
 * discounted. Omitting it assumes v2 — new callers get the current format, and an
 * old epoch that must stay 13 fields has to pass its number explicitly, exactly as
 * the catalog and preamble gate do.
 */
export function observationPreimage(o: PriceObservation, epochNumber?: number): string {
  const fields = [
    OBS_LEAF_TAG,
    o.canonicalProductId,
    o.productName,
    o.brand,
    o.packSize,
    o.categoryPath,
    o.country,
    o.city,
    o.merchant,
    o.obsDate,
    o.unitPrice,
    o.currency,
    o.unitType,
  ];
  if (epochNumber === undefined || epochNumber >= LEDGER_FORMAT_V2_FROM_EPOCH) {
    fields.push(o.kind ?? "product", o.discounted ?? "0");
  }
  return fields.join(FIELD_SEP);
}

export function observationLeaf(o: PriceObservation, epochNumber?: number): string {
  return keccak256(observationPreimage(o, epochNumber));
}

export function receiptPreimage(r: ReceiptAnchor): string {
  return [
    RECEIPT_LEAF_TAG,
    normalizeField(r.receiptId),
    normalizeField(r.contentHash),
    normalizeField(r.wallet),
  ].join(FIELD_SEP);
}

export function receiptLeaf(r: ReceiptAnchor): string {
  return keccak256(receiptPreimage(r));
}

/**
 * A withdrawal of an observation published in an earlier epoch.
 *
 * `reason` is a fixed slug, not prose: readers group by it, and a sentence would
 * drift between epochs while meaning the same thing.
 */
export type Withdrawal = {
  /** The epoch that published the observation being withdrawn. */
  epochNumber: number;
  /**
   * keccak256 of the published observation line — its name in that manifest.
   * Deliberately NOT called leafHash: a withdrawal has a leaf of its own, and two
   * fields by that name in one object let a spread quietly overwrite the target
   * with the withdrawal's own hash, leaving a record that retracts itself.
   */
  targetLeaf: string;
  reason: string;
};

export function withdrawalPreimage(w: Withdrawal): string {
  return [
    WITHDRAWN_LEAF_TAG,
    String(w.epochNumber),
    normalizeField(w.targetLeaf),
    normalizeField(w.reason),
  ].join(FIELD_SEP);
}

export function withdrawalLeaf(w: Withdrawal): string {
  return keccak256(withdrawalPreimage(w));
}

/** One product catalog entry (id → what it actually is). */
export type CatalogEntry = {
  canonicalProductId: string;
  productName: string;
  brand: string;
  packSize: string;
  categoryPath: string;
};

/**
 * Pick one catalog entry per product id, independently of row order.
 *
 * Both callers used to keep the first row they saw for an id, and "first" is
 * whatever the query happened to return: build-price-epoch reads the clean layer,
 * epoch-artifacts reads the snapshot with no ORDER BY. One id can carry rows that
 * disagree — "Portakal 350g" and "Portakal" share an id, and only one of them
 * spells out a pack — so the same epoch produced two different catalogs, and the
 * seal refused with a hash mismatch that looked like drift.
 *
 * The manifest never had this problem because its lines are sorted. Sorting the
 * candidates and taking the first gives the catalog the same property: the epoch
 * decides, not the row order.
 */
export function pickCatalogEntries(observations: PriceObservation[], epochNumber?: number): CatalogEntry[] {
  // Epochs sealed under v1 keep first-seen, or they stop rebuilding to their own
  // published bytes. New epochs get the deterministic rule.
  if (epochNumber !== undefined && epochNumber < LEDGER_FORMAT_V2_FROM_EPOCH) {
    const first = new Map<string, CatalogEntry>();
    for (const o of observations) {
      if (!o.canonicalProductId || first.has(o.canonicalProductId)) continue;
      first.set(o.canonicalProductId, {
        canonicalProductId: o.canonicalProductId,
        productName: o.productName,
        brand: o.brand,
        packSize: o.packSize,
        categoryPath: o.categoryPath,
      });
    }
    return [...first.values()];
  }
  const byId = new Map<string, CatalogEntry[]>();
  for (const o of observations) {
    if (!o.canonicalProductId) continue;
    const e: CatalogEntry = {
      canonicalProductId: o.canonicalProductId,
      productName: o.productName,
      brand: o.brand,
      packSize: o.packSize,
      categoryPath: o.categoryPath,
    };
    (byId.get(o.canonicalProductId) ?? byId.set(o.canonicalProductId, []).get(o.canonicalProductId)!).push(e);
  }
  const line = (e: CatalogEntry) =>
    [e.canonicalProductId, e.productName, e.brand, e.packSize, e.categoryPath].join(FIELD_SEP);
  return [...byId.values()].map((candidates) => candidates.sort((a, b) => (line(a) < line(b) ? -1 : 1))[0]);
}

/**
 * Canonical catalog text: sorted, one product per line. Published to Arweave.
 *
 * `epochNumber` decides only whether the preamble is emitted — epochs sealed
 * before LEDGER_FORMAT_V2_FROM_EPOCH must rebuild exactly as published. Pass it
 * from the epoch being built; omitting it assumes a new epoch and emits the
 * preamble, which would silently change the hash of anything already sealed.
 */
export function buildCatalog(entries: CatalogEntry[], epochNumber?: number): string {
  const lines = entries
    .map((e) =>
      [e.canonicalProductId, e.productName, e.brand, e.packSize, e.categoryPath].join(FIELD_SEP)
    )
    .sort();
  const head = [`=== YUMO YUMO PRICE CATALOG ${PRICE_LEDGER_VERSION} ===`];
  if (epochNumber === undefined || epochNumber >= LEDGER_FORMAT_V2_FROM_EPOCH) {
    head.push(...catalogPreamble());
  }
  return [...head, ...lines].join("\n");
}

export function catalogHash(catalog: string): string {
  return keccak256(catalog);
}

/** Header fields carried in the manifest and cross-checked at verify time. */
export type ManifestHeader = {
  epochNumber: number;
  windowStart: string;
  windowEnd: string;
  merkleRoot: string;
  observationCount: number;
  receiptCount: number;
  /** Observations from earlier epochs this one withdraws. Absent = none. */
  withdrawnCount?: number;
  /**
   * keccak256 of the catalog text — binds the catalog to this epoch by CONTENT.
   * The catalog's Arweave tx is deliberately NOT in the manifest: it is only known
   * at publish time, and embedding it would change the manifest after its hash was
   * verified. Location is discoverable (Arweave tag Price-Epoch / our API); the
   * hash is what proves you fetched the right catalog.
   */
  catalogHash?: string;
};

/**
 * Build the canonical public manifest text. Observation rows are their full
 * preimages (recomputable → leaf); receipt rows are opaque leaf hashes only
 * (private). Both sections are sorted so the text is deterministic.
 */
export function buildManifest(
  header: ManifestHeader,
  observationPreimages: string[],
  receiptLeafHashes: string[],
  withdrawalPreimages: string[] = []
): string {
  const obs = [...observationPreimages].sort();
  const rec = [...receiptLeafHashes].sort();
  const wdr = [...withdrawalPreimages].sort();
  const lines: string[] = [];
  lines.push(`=== YUMO YUMO PRICE EPOCH ${PRICE_LEDGER_VERSION} ===`);
  if (header.epochNumber >= LEDGER_FORMAT_V2_FROM_EPOCH) {
    lines.push(
      ...manifestPreamble()
    );
  }
  lines.push(`EPOCH ${FIELD_SEP} ${header.epochNumber}`);
  lines.push(`WINDOW_START ${FIELD_SEP} ${header.windowStart}`);
  lines.push(`WINDOW_END ${FIELD_SEP} ${header.windowEnd}`);
  lines.push(`MERKLE_ROOT ${FIELD_SEP} ${header.merkleRoot}`);
  lines.push(`OBSERVATION_COUNT ${FIELD_SEP} ${header.observationCount}`);
  lines.push(`RECEIPT_COUNT ${FIELD_SEP} ${header.receiptCount}`);
  if (header.withdrawnCount) lines.push(`WITHDRAWN_COUNT ${FIELD_SEP} ${header.withdrawnCount}`);
  lines.push(`CATALOG_HASH ${FIELD_SEP} ${header.catalogHash ?? ""}`);
  lines.push(`=== OBSERVATIONS ===`);
  for (const line of obs) lines.push(line);
  lines.push(`=== RECEIPT_LEAVES ===`);
  for (const h of rec) lines.push(h);
  // Last section, and only when there is something to say: a reader that stops at
  // RECEIPT_LEAVES still gets a complete, correctly-parsed epoch, and an epoch with
  // nothing to withdraw looks exactly as it did before withdrawals existed.
  if (wdr.length > 0) {
    lines.push(`=== WITHDRAWN ===`);
    for (const w of wdr) lines.push(w);
  }
  return lines.join("\n");
}

/** keccak256 of the whole manifest text — the on-chain-sealed dataset commitment. */
export function manifestHash(manifest: string): string {
  return keccak256(manifest);
}
