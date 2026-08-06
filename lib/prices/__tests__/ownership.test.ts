/**
 * Runs standalone, no test runner:
 *   NODE_PATH=$PWD/node_modules npx tsx lib/prices/__tests__/ownership.test.ts
 *
 * Uğur's requirement, as a test:
 *   "sahibi tarafından ispatlanabilmesi, sahibi olmayan birinin ispatlayamaması"
 * The second half is the one that matters — an attacker who holds EVERY public
 * input must still fail.
 */
import { Keypair } from "@solana/web3.js";
import nacl from "tweetnacl";
import bs58 from "bs58";
import { verifyOwnership, ownershipMessage } from "@/lib/prices/ownership";
import { receiptLeaf } from "@/lib/prices/engine/leaf";
import { buildTree, getProof } from "@/lib/rewards/engine/merkle";

const owner = Keypair.generate();
const attacker = Keypair.generate();
const wallet = owner.publicKey.toBase58();

const receiptId = "9f1c2b7a-0000-4d3e-9a1b-000000000001";
const contentHash = "a".repeat(64);

// A sealed epoch: our receipt plus other people's.
const leaf = receiptLeaf({ receiptId, contentHash, wallet });
const others = Array.from({ length: 6 }, (_, i) =>
  receiptLeaf({ receiptId: `other-${i}`, contentHash: String(i).repeat(64), wallet: Keypair.generate().publicKey.toBase58() })
);
const { root, layers } = buildTree([leaf, ...others]);
const proof = getProof(layers, leaf);

const sign = (kp: typeof owner, nonce = "", rid = receiptId, chash = contentHash) =>
  bs58.encode(nacl.sign.detached(new TextEncoder().encode(ownershipMessage(rid, chash, nonce)), kp.secretKey));

const base = { receiptId, contentHash, wallet, proof, merkleRoot: root };
const cases: [string, ReturnType<typeof verifyOwnership>, boolean][] = [
  ["SAHİP imzalıyor → geçmeli",
    verifyOwnership({ ...base, signature: sign(owner) }), true],
  ["SAHİP taze meydan okumayı imzalıyor (nonce) → geçmeli",
    verifyOwnership({ ...base, signature: sign(owner, "verifier-nonce-123"), nonce: "verifier-nonce-123" }), true],

  ["SALDIRGAN her açık girdiye sahip, kendi anahtarıyla imzalıyor → KALMALI",
    verifyOwnership({ ...base, signature: sign(attacker) }), false],
  ["SALDIRGAN sahibin imzasını çalıp cüzdanını kendisininkiyle değiştiriyor → KALMALI",
    verifyOwnership({ ...base, wallet: attacker.publicKey.toBase58(), signature: sign(owner) }), false],
  ["SALDIRGAN eski imzayı yeni meydan okumaya karşı tekrar oynatıyor → KALMALI",
    verifyOwnership({ ...base, signature: sign(owner, "eski-nonce"), nonce: "yeni-nonce" }), false],
  // These two must fail at the INCLUSION check, not the signature check: the owner
  // signs honestly for the altered values, so only the chain can catch them.
  ["SAHİP dürüstçe imzalıyor ama fiş içeriği değiştirilmiş → içerilmede KALMALI",
    verifyOwnership({ ...base, contentHash: "b".repeat(64), signature: sign(owner, "", receiptId, "b".repeat(64)) }), false],
  ["SAHİP dürüstçe imzalıyor ama fiş bu epoch'ta çapalanmamış → içerilmede KALMALI",
    verifyOwnership({ ...base, receiptId: "hic-capalanmamis", signature: sign(owner, "", "hic-capalanmamis") }), false],
  ["İmzasız, yalnız içerilme kanıtı (BUGÜNKÜ durum) → KALMALI",
    verifyOwnership({ ...base, signature: "" }), false],
  ["Cüzdanı olmayan fiş (çapaların %96,4'ü) → KALMALI",
    verifyOwnership({ ...base, wallet: "", signature: sign(owner) }), false],
  ["Bozuk imza (çöp girdi çökertmemeli) → KALMALI",
    verifyOwnership({ ...base, signature: "!!!bozuk!!!" }), false],
];

let pass = 0;
for (const [name, verdict, expected] of cases) {
  const ok = verdict.ok === expected;
  if (ok) pass++;
  console.log(`  ${ok ? "✓" : "✗ BEKLENMEDİK"}  ${name}`);
  if (!ok || !expected) console.log(`        → ${verdict.reason}`);
}
console.log(`\n${pass}/${cases.length} ${pass === cases.length ? "GEÇTİ ✓" : "KALDI ✗"}`);
if (pass !== cases.length) process.exitCode = 1;
