/**
 * Receipt ownership: provable by the owner, unprovable by anyone else.
 *
 * The requirement (Uğur, 2026-07-17): "sistemdeki fişlerin sahipliğinin, sahibi
 * tarafından ispatlanabilmesi. O fişin sahibi olmayan birinin ise bunu
 * ispatlayamaması."
 *
 * Inclusion alone never satisfied that. The leaf binds the wallet, but a wallet
 * ADDRESS is a public identifier: anyone holding (receipt_id, content_hash,
 * wallet) re-derives the same leaf, so re-deriving it proves nothing about who
 * you are. The missing half is a secret only the owner holds — their private key.
 *
 * A complete proof is therefore two independent checks:
 *
 *   1. SIGNATURE  — ed25519 over a message naming the receipt, verified against
 *                   the wallet address. Proves control of the wallet. A non-owner
 *                   cannot produce it; neither can Yumo Yumo, which never holds a
 *                   user's private key. This is an off-chain message signature:
 *                   free, no transaction, so İ1 ("the user never signs a price
 *                   write") is intact — the user signs only when THEY want to
 *                   prove something.
 *   2. INCLUSION  — the leaf built from those same inputs folds to a root sealed
 *                   on Solana. Proves the receipt existed with that content, was
 *                   not altered, and was anchored to that wallet.
 *
 * Either half alone is worthless: a signature proves a wallet but says nothing
 * about a receipt; an inclusion proof shows an anchored receipt but not whose.
 *
 * NOTE the hard limit: this works only where a wallet was in the leaf at seal
 * time. Receipts anchored with an empty wallet field (the vast majority of epoch
 * 1) carry no key and can never become ownership-provable — those leaves are
 * sealed. Connecting a wallet affects a user's FUTURE receipts only.
 *
 * Verifiable by a third party with nothing but this file's rules, the published
 * manifest and a Solana RPC. Labeled plain text (proje T1), never JSON.
 */

import nacl from "tweetnacl";
import bs58 from "bs58";
import { FIELD_SEP, PRICE_LEDGER_VERSION } from "@/config/price-ledger";
import { receiptLeaf } from "./engine/leaf";
import { rootFromProof } from "@/lib/rewards/engine/merkle";

const OWNERSHIP_MSG_PREFIX = `yumoyumo:receipt-ownership:${PRICE_LEDGER_VERSION}`;

/**
 * The exact bytes the owner signs.
 *
 * `nonce` is what separates a bearer document from a live proof. Without one the
 * signature is static: self-contained and verifiable forever, but replayable —
 * whoever holds the package can present it, like handing over a signed letter.
 * With a nonce the VERIFIER chooses the challenge, so only someone holding the
 * key right now can answer. Use a nonce whenever the answer is "is this person
 * the owner", and omit it for an archive copy.
 */
export function ownershipMessage(receiptId: string, contentHash: string, nonce = ""): string {
  return [OWNERSHIP_MSG_PREFIX, receiptId, contentHash, nonce].join(FIELD_SEP);
}

export type OwnershipClaim = {
  receiptId: string;
  contentHash: string;
  /** Base58 Solana address — the ed25519 public key the leaf was built with. */
  wallet: string;
  /** Base58 ed25519 signature over ownershipMessage(...). */
  signature: string;
  nonce?: string;
  /** Sibling hashes, in order, from the published proof package. */
  proof: string[];
  /** The root sealed in the epoch's Solana memo. */
  merkleRoot: string;
};

export type OwnershipVerdict = {
  ok: boolean;
  signatureValid: boolean;
  inclusionValid: boolean;
  leaf: string | null;
  reason: string;
};

const fail = (reason: string, extra: Partial<OwnershipVerdict> = {}): OwnershipVerdict => ({
  ok: false,
  signatureValid: false,
  inclusionValid: false,
  leaf: null,
  reason,
  ...extra,
});

/**
 * Verify a claim. Defensive throughout: malformed input is a false verdict, never
 * an exception — a verifier that crashes on bad input is a verifier an attacker
 * controls.
 */
export function verifyOwnership(claim: OwnershipClaim): OwnershipVerdict {
  if (!claim.wallet) {
    return fail("Bu fişte cüzdan yok — mühürlendiğinde bağlı cüzdan olmadığı için sahiplik ispatlanamaz.");
  }
  if (!claim.receiptId || !claim.contentHash) return fail("receipt_id veya content_hash eksik.");
  if (!claim.signature) return fail("İmza yok — sahiplik yalnız imzayla ispatlanır.");

  // 1) Does this person control the wallet?
  let signatureValid = false;
  try {
    const pubkey = bs58.decode(claim.wallet);
    const sig = bs58.decode(claim.signature);
    if (pubkey.length !== 32) return fail("Cüzdan adresi 32 baytlık bir ed25519 anahtarı değil.");
    if (sig.length !== 64) return fail("İmza 64 bayt değil.");
    const msg = new TextEncoder().encode(
      ownershipMessage(claim.receiptId, claim.contentHash, claim.nonce ?? "")
    );
    signatureValid = nacl.sign.detached.verify(msg, sig, pubkey);
  } catch {
    return fail("İmza veya cüzdan adresi çözümlenemedi (base58 bekleniyor).");
  }
  if (!signatureValid) {
    return fail("İmza bu cüzdana ait değil — sahiplik ispatlanamadı.", { signatureValid: false });
  }

  // 2) Was this exact receipt anchored to that wallet?
  const leaf = receiptLeaf({
    receiptId: claim.receiptId,
    contentHash: claim.contentHash,
    wallet: claim.wallet,
  });
  let inclusionValid = false;
  try {
    inclusionValid = rootFromProof(leaf, claim.proof ?? []) === claim.merkleRoot;
  } catch {
    return fail("Kanıt yolu katlanamadı.", { signatureValid: true, leaf });
  }
  if (!inclusionValid) {
    return {
      ok: false,
      signatureValid: true,
      inclusionValid: false,
      leaf,
      reason: "Cüzdan doğrulandı ama bu yaprak mühürlenmiş köke katlanmıyor — fiş bu içerikle bu cüzdana çapalanmamış.",
    };
  }

  return {
    ok: true,
    signatureValid: true,
    inclusionValid: true,
    leaf,
    reason: "Sahiplik ispatlandı: cüzdan imzayla doğrulandı ve fiş bu cüzdana çapalanmış hâlde zincirde mühürlü.",
  };
}
