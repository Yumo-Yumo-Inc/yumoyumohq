/**
 * Ed25519 signature verification for Solana wallet ownership proofs.
 * SERVER-ONLY. Uses Node's built-in crypto — no extra dependency.
 *
 * A Solana public key is a raw 32-byte Ed25519 key. Node's crypto.verify needs
 * an SPKI-wrapped key, so we prepend the fixed 12-byte Ed25519 SPKI header.
 */

import { createPublicKey, verify as cryptoVerify } from "crypto";
import bs58 from "bs58";

// DER prefix for an Ed25519 SubjectPublicKeyInfo (12 bytes) + 32-byte raw key.
const ED25519_SPKI_PREFIX = Buffer.from("302a300506032b6570032100", "hex");

/** Basic shape check: a base58 string that decodes to 32 bytes. */
export function isValidSolanaAddress(address: string): boolean {
  try {
    const decoded = bs58.decode(address.trim());
    return decoded.length === 32;
  } catch {
    return false;
  }
}

/**
 * Verify that `signature` over `message` was produced by `address`'s key.
 * @param address   base58 Solana public key
 * @param message   the exact bytes that were signed (UTF-8 text)
 * @param signature 64-byte Ed25519 signature (byte array or base58 string)
 * Returns false on any malformed input — never throws.
 */
export function verifyWalletSignature(
  address: string,
  message: string,
  signature: number[] | Uint8Array | string
): boolean {
  try {
    const pubkeyRaw = bs58.decode(address.trim());
    if (pubkeyRaw.length !== 32) return false;

    let sigBytes: Buffer;
    if (typeof signature === "string") {
      sigBytes = Buffer.from(bs58.decode(signature.trim()));
    } else {
      sigBytes = Buffer.from(signature);
    }
    if (sigBytes.length !== 64) return false;

    const spki = Buffer.concat([ED25519_SPKI_PREFIX, Buffer.from(pubkeyRaw)]);
    const keyObject = createPublicKey({ key: spki, format: "der", type: "spki" });

    return cryptoVerify(null, Buffer.from(message, "utf8"), keyObject, sigBytes);
  } catch {
    return false;
  }
}
