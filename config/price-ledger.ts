/**
 * Price ledger (Faz 1 — Merkle-anchor) configuration.
 *
 * The public, decentralised price-transparency layer: every eligible receipt's
 * line items become kimliksiz (identity-free) price observations. Each daily
 * epoch commits ALL its leaves into one Merkle root; the root + a manifest hash
 * are sealed to Solana mainnet in a single memo transaction, and the full public
 * manifest is published to Arweave. Anyone can then rebuild the dataset, recompute
 * the root, and check inclusion — without trusting Yumo Yumo for integrity.
 *
 * Decision: memory/decisions/2026-07-15-onchain-fiyat-defteri-mimari.md
 *
 * KEY INVARIANTS (do not change without bumping the version + a decision note):
 *  - The USER never signs a price write. The protocol multisig seals the root
 *    (İ1). This config drives an off-chain build; signing stays a manual ops step
 *    (scripts/commit-price-epoch.ts), exactly like reward epochs.
 *  - Observations are identity-free (İ2). No username / receipt_id / wallet in an
 *    observation leaf. Receipts contribute only an opaque hash leaf (fiş = özel).
 *  - Leaf + manifest are plain, labeled, pipe-separated text (proje T1 kuralı),
 *    never JSON — so a third party parses them defensively and deterministically.
 */

/** Stable spec version stamped into every leaf preimage and the memo. */
export const PRICE_LEDGER_VERSION = "v1" as const;

/** Field separator inside a leaf preimage / manifest row. Values are sanitised
 *  to never contain it, so the split is unambiguous. */
export const FIELD_SEP = "|";

/** Prefix tags that domain-separate the leaf kinds inside one tree. */
export const OBS_LEAF_TAG = `price-obs:${PRICE_LEDGER_VERSION}`;
export const RECEIPT_LEAF_TAG = `price-receipt:${PRICE_LEDGER_VERSION}`;

/**
 * Withdrawal: a later epoch stating that an observation it already published is
 * wrong, and that readers should drop it.
 *
 * Arweave keeps what was written, so a mistake cannot be erased — it can only be
 * answered. Accounting has done this forever: the wrong entry stays and a
 * reversing entry goes under it.
 *
 * It names its target by LEAF HASH, which costs no privacy: the hash is derived
 * from a line everybody can already read in the published manifest, so pointing at
 * it exposes nothing that was not exposed. (A source line id would have been the
 * obvious identifier and the wrong one — sequential ids let anyone regroup a
 * receipt's lines, which is the profiling the missing time field exists to prevent.)
 *
 * Withdrawals fold into the same Merkle tree as everything else, so the correction
 * is sealed exactly as strongly as the mistake was.
 */
export const WITHDRAWN_LEAF_TAG = `price-withdrawn:${PRICE_LEDGER_VERSION}`;

/** Memo preimage sealed on-chain (independently re-derivable):
 *  yumoyumo:price-epoch:v1:<n>:<merkle_root>:<manifest_hash>:<arweave_tx> */
export const PRICE_MEMO_PREFIX = `yumoyumo:price-epoch:${PRICE_LEDGER_VERSION}`;

/** Arweave tags for the published manifest (discoverable via GraphQL). */
export const ARWEAVE_APP_NAME = "Yumo Yumo Price Ledger";

/** The address that seals every epoch. Discovery starts here: read its memos. */
export const SEALER_ADDRESS = "32T9x5xGz6uaHtPnRhUhqHgJyWshbDJas7RYahEJjMjE";

export const PUBLIC_SITE = "https://yumoyumo.com";

/**
 * First epoch published in the v2 format. Everything sealed before it must rebuild
 * byte-for-byte as it went out.
 *
 * Anything that changes published BYTES changes the sealed hash, and a sealed hash
 * is on Solana forever: rebuilding an old epoch under a new rule yields a different
 * hash and reports drift on an epoch nobody touched — indistinguishable from
 * tampering, and it stops the seal. So format changes are gated here rather than
 * applied to history.
 *
 * v2 covers two changes, both made 2026-07-17:
 *  - the provenance preamble inside the manifest and catalog (identity, licence,
 *    verification recipe)
 *  - a catalog entry chosen by sorting the candidates for an id instead of by
 *    whichever row a query returned first (see pickCatalogEntries)
 *  - two fields appended to each observation line: kind (product | category) and
 *    discounted (0 | 1). An epoch before this keeps its 13-field line.
 *
 * Raise this only for a not-yet-sealed epoch, never retroactively.
 */
export const LEDGER_FORMAT_V2_FROM_EPOCH = 2;

/**
 * Permalink to the verification recipe, emitted into every preamble from
 * LEDGER_FORMAT_V2_FROM_EPOCH onward.
 *
 * On Arweave, not in a repo (Uğur, 2026-07-17: "Git yarın öbür gün kapanırsa ne
 * yapacağız?"). The preamble is sealed on Solana forever, so an address printed in
 * it must resolve forever — which a GitHub URL cannot promise, and a permanent
 * record pointing at a dead link is a promise we broke. Permanent seal, permanent
 * address.
 *
 * Frozen by design: this copy matches the epochs that point at it. Improve the
 * recipe → publish a new one (scripts/publish-verification-recipe.ts) → set this
 * to the new tx, and later epochs carry it while older ones keep the copy that
 * describes them.
 */
export const PUBLIC_RECIPE_URL = "https://arweave.net/eabxr24slHrMbnZWIaKL3QiL7oitneL7y5sBHzK6EXQ";

/**
 * Licence for the published data (Uğur delegated the choice, 2026-07-17): CC0 1.0,
 * a public-domain dedication.
 *
 * Permanence is what decides this. A share-alike or attribution licence would place
 * a condition we cannot enforce against anonymous copies of an Arweave file — and an
 * unenforceable condition only deters the party that checks: a company's lawyer reads
 * "licence unclear" and walks away, while a bad actor takes it regardless. CC0 also
 * waives the EU/TR sui generis DATABASE right, which copyright alone would leave
 * ambiguous over a compilation of facts.
 *
 * The cost is real and irrevocable: anyone, including a competitor, may build on this
 * data without attribution. Accepted — the moat is the pipeline that produces an
 * observation (OCR → LLM → canonical matching → validation), not the sealed snapshot,
 * and the snapshot is permanently public either way.
 */
export const LEDGER_LICENCE_ID = "CC0-1.0";
export const LEDGER_LICENCE = `${LEDGER_LICENCE_ID} · https://creativecommons.org/publicdomain/zero/1.0/`;

/**
 * Eligibility for the PUBLIC price ledger (Uğur, 2026-07-15):
 * "Tüm doğrulanmış fişler" — every non-rejected, non-duplicate receipt with a
 * canonical, priced product line. This is intentionally BROADER than the
 * anonymisation data pool (which is payment-proof only); the price ledger is a
 * separate, public product. Payment-proof is NOT required here.
 *
 * A line qualifies when: line_kind = 'product', canonical_id IS NOT NULL,
 * unit_price > 0. A receipt qualifies when: NOT flags_rejected, status not
 * 'rejected', duplicate_of IS NULL.
 */
export const PRICE_ELIGIBILITY = {
  requirePaymentProof: false,
  productLineKind: "product",
} as const;

/**
 * The ledger only covers the period Yumo Yumo has actually operated (Uğur,
 * 2026-07-17). Anything dated before this is either a genuinely old receipt a
 * user happened to upload (a 2015 café bill) or an OCR date error ("1976 Otogaz")
 * — neither belongs in a current price record. Future dates are always an error.
 */
export const OBS_DATE_FLOOR = "2026-01-01";

/**
 * Publication delay (Uğur, 2026-07-18): an observation is not published until it is
 * this many days old.
 *
 * A permanent, merchant-identified feed of *today's* chain-market prices could read
 * as the shared price board the Rekabet Kurumu fined five chains 2.68bn TRY for in
 * 2021 (hub-and-spoke signalling), even though ours is a public consumer record.
 * The mitigant is age: a price a fortnight old is history, not a live signal — the
 * way TÜİK reports last month's inflation rather than today's.
 *
 * It is a PUBLICATION rule, not a quality one. A fresh price is correct, so it stays
 * `clean` and counts toward the median; only its release waits. The next epoch picks
 * it up automatically once it ages past the ceiling — nothing is lost, and epoch 1's
 * already-published fresh prices are NOT retracted (the policy is not retroactive).
 */
export const OBS_PUBLISH_DELAY_DAYS = 14;

/** Newest obs_date publishable as of `today` (YYYY-MM-DD in, YYYY-MM-DD out). */
export function publishCeiling(today: string): string {
  const d = new Date(`${today}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() - OBS_PUBLISH_DELAY_DAYS);
  return d.toISOString().slice(0, 10);
}

/** Merchant resolution for public observations (Uğur, 2026-07-15):
 *  marka + şehir + ülke. Branch / address / district / neighbourhood are NEVER
 *  published (a branch can single out a person — §9). */
export const PUBLIC_MERCHANT_GRANULARITY = "brand_city_country" as const;

/**
 * Category-path roots whose products are loose produce: the canonical id names a
 * category (Domates, Karpuz), not a package. These observations are typed "category"
 * so a reader never compares them as if one id meant one product, and so the median
 * groups them by category + city + unit rather than by an id that spans a bunch and
 * a crate.
 *
 * Derived from category_path, not stored — the engine and the independent verifier
 * both compute it the same way, so a snapshot needs no extra column and the two
 * paths cannot disagree.
 */
export const CATEGORY_OBSERVATION_ROOTS = ["groceries.produce"] as const;

export function deriveObservationKind(categoryPath: string): "product" | "category" {
  const p = (categoryPath ?? "").toLowerCase();
  return CATEGORY_OBSERVATION_ROOTS.some((r) => p === r || p.startsWith(r + ".")) ? "category" : "product";
}

/**
 * Provenance preamble carried inside a published manifest or catalog.
 *
 * Lives here rather than in the engine because BOTH the engine and the independent
 * Step-7 verifier emit it, and the verifier refuses to import the engine on
 * purpose: it re-derives every leaf, the ordering and the root a second time, so
 * that a bug in one shows up as a disagreement instead of a sealed mistake.
 *
 * Sharing this text costs nothing that matters. It is static boilerplate around
 * the data — a mistake in it produces a typo, never a wrong price or a wrong root.
 * The parts a bug could corrupt stay double-implemented.
 *
 * Every line is `#`-prefixed; parsers select rows by their own prefix, so the
 * preamble is inert to them.
 */
export function buildPreamble(what: string, extra: string[] = []): string[] {
  const lines = [
    `#`,
    `# Yumo Yumo — open price ledger`,
    `# ${what}`,
    `#`,
    `# Publisher : Yumo Yumo Inc · ${PUBLIC_SITE}`,
    `# Sealed by : ${SEALER_ADDRESS} (Solana mainnet)`,
    `#             One memo per epoch, no other authority:`,
    `#             ${PRICE_MEMO_PREFIX}:<n>:<merkle_root>:<manifest_hash>:<arweave_tx>`,
    ...extra,
  ];
  if (PUBLIC_RECIPE_URL) lines.push(`# Recipe    : ${PUBLIC_RECIPE_URL}`);
  if (LEDGER_LICENCE) {
    lines.push(`# Licence   : ${LEDGER_LICENCE}`);
    lines.push(`#             Public domain. Take it, republish it, build on it.`);
    lines.push(`#             Attribution appreciated, never required.`);
  }
  lines.push(`#`);
  return lines;
}

/** The manifest's preamble — the epoch file's own identity and verification spec. */
export function manifestPreamble(): string[] {
  return buildPreamble("Product prices read from real receipts, published permanently.", [
    `#`,
    `# Each observation below is identity-free: no buyer, no wallet, no receipt`,
    `# id, and no time — merchant, city, date and price only. Receipt leaves are`,
    `# opaque hashes; a receipt sealed with a wallet can be proven its owner's by`,
    `# signing with that wallet's key, and reveals nothing to anyone else.`,
    `#`,
    `# Verify (needs nothing but this file and the memo above):`,
    `#   1. keccak256(this file) === <manifest_hash> in the memo`,
    `#   2. leaf = keccak256(utf8(line))          — the line IS the preimage`,
    `#      node = keccak256(concat(sort([l,r]))) — 32-byte pairs, sorted`,
    `#      leaves sorted ascending; an odd node is carried up unchanged`,
    `#   3. fold every ${OBS_LEAF_TAG}| line + every receipt leaf`,
    `#      → must equal MERKLE_ROOT below and the root in the memo`,
    `#`,
    `# The chain proves this data was not altered. It does not prove we read`,
    `# each receipt correctly: observations are validated before publication,`,
    `# and whatever fails is withheld rather than published.`,
    `#`,
    `# When we get one wrong after publishing it, we say so here rather than`,
    `# quietly. A === WITHDRAWN === section, when present, lists observations from`,
    `# earlier epochs that this epoch retracts:`,
    `#   ${WITHDRAWN_LEAF_TAG}|<epoch>|<leaf_hash>|<reason>`,
    `# <leaf_hash> is keccak256 of the published line, so you can find it in that`,
    `# epoch's manifest yourself. Apply epochs in order and drop what is withdrawn;`,
    `# a corrected value, where one exists, is republished here as a normal`,
    `# observation. Withdrawals fold into the root below, so a retraction is sealed`,
    `# as firmly as the mistake was.`,
    `#`,
    `# Row : ${OBS_LEAF_TAG}|<canonical_id>|<product_name>|<brand>|<pack_size>`,
    `#       |<category_path>|<country>|<city>|<merchant>|<obs_date>|<unit_price>`,
    `#       |<currency>|<unit_type>|<kind>|<discounted>`,
    `#       kind = product | category (category = loose produce, id is a category)`,
    `#       discounted = 1 if the price was on offer, else 0`,
  ]);
}

/** The catalog's preamble — what each product id in the manifest actually is. */
export function catalogPreamble(): string[] {
  return buildPreamble("What each product id in the price manifest actually is.", [
    `# Bound to  : the epoch's manifest by CATALOG_HASH = keccak256(this file)`,
    `# Row       : <canonical_id>|<product_name>|<brand>|<pack_size>|<category_path>`,
  ]);
}
