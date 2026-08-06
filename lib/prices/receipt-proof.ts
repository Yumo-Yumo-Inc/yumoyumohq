/**
 * Portable receipt proof package.
 *
 * The chain is a notary: it never stores the receipt, it seals a fingerprint of
 * it. This builds the text an owner can keep forever and verify independently —
 * even if Yumo Yumo is gone.
 *
 * WHAT THIS PROVES: inclusion. The leaf was folded into a root that Solana
 * sealed, so this receipt existed with this exact content at seal time and was
 * not altered afterwards. That part needs no trust in Yumo Yumo.
 *
 * WHAT IT DOES NOT PROVE: ownership. The wallet is hashed in (so it is not
 * published — a privacy property, K3), but a wallet address is a PUBLIC
 * identifier, not a secret: anyone holding (receipt_id, content_hash, wallet)
 * derives the same leaf. Only a signature from the wallet's private key can
 * prove control of it, and nothing here asks for one. Do not describe this
 * package as proof of ownership — see the 2026-07-17 correction in
 * memory/decisions/2026-07-15-onchain-fiyat-defteri-mimari.md.
 *
 * Labeled plain text (proje T1), same dialect as the manifest.
 */

import { FIELD_SEP } from "@/config/price-ledger";
import { receiptPreimage, receiptLeaf } from "./engine/leaf";

export type ReceiptProofInput = {
  receiptId: string;
  contentHash: string;
  wallet: string;
  epochNumber: number;
  merkleRoot: string;
  proof: string[];
  memoTx: string | null;
  arweaveTx: string | null;
  /** The owner's own receipt data — echoed back so the package is self-contained. */
  receipt: {
    merchant: string;
    date: string;
    total: string;
    currency: string;
    lines: { name: string; quantity: string; price: string }[];
  };
};

export function buildReceiptProof(i: ReceiptProofInput): string {
  const leaf = receiptLeaf({ receiptId: i.receiptId, contentHash: i.contentHash, wallet: i.wallet });
  const L = (k: string, v: string) => `${k} ${FIELD_SEP} ${v}`;
  const lines: string[] = [];
  lines.push(`=== YUMO YUMO RECEIPT PROOF v1 ===`);
  lines.push(L("RECEIPT_ID", i.receiptId));
  lines.push(L("WALLET", i.wallet || "(bağlı cüzdan yok)"));
  lines.push(L("CONTENT_HASH", i.contentHash));
  lines.push(L("LEAF", leaf));
  lines.push(L("LEAF_PREIMAGE", receiptPreimage({ receiptId: i.receiptId, contentHash: i.contentHash, wallet: i.wallet })));
  lines.push(L("EPOCH", String(i.epochNumber)));
  lines.push(L("MERKLE_ROOT", i.merkleRoot));
  lines.push(L("MEMO_TX", i.memoTx ?? "(henüz mühürlenmedi)"));
  lines.push(L("ARWEAVE_TX", i.arweaveTx ?? "(henüz yayımlanmadı)"));
  lines.push(`=== PROOF (kardeş hash'ler, sırayla katlanır) ===`);
  for (const p of i.proof) lines.push(p);
  lines.push(`=== FİŞ (senin verin — zincirde DEĞİL) ===`);
  lines.push(L("MERCHANT", i.receipt.merchant));
  lines.push(L("DATE", i.receipt.date));
  lines.push(L("TOTAL", `${i.receipt.total} ${i.receipt.currency}`));
  for (const l of i.receipt.lines) {
    lines.push(["LINE", l.name, l.quantity, l.price].join(` ${FIELD_SEP} `));
  }
  lines.push(`=== NASIL DOĞRULARSIN ===`);
  lines.push(`1) LEAF = keccak256(LEAF_PREIMAGE)`);
  lines.push(`2) PROOF'taki her hash'i sırayla katla: node = keccak256(sıralı(çift))`);
  lines.push(`   -> sonuç MERKLE_ROOT'a eşit olmalı`);
  lines.push(`3) Solana mainnet'te MEMO_TX'i oku:`);
  lines.push(`   yumoyumo:price-epoch:v1:<epoch>:<merkle_root>:<manifest_hash>:<arweave_tx>`);
  lines.push(`   -> içindeki merkle_root yukarıdakiyle aynı olmalı`);
  lines.push(`4) İstersen https://arweave.net/<ARWEAVE_TX> manifestini indir;`);
  lines.push(`   RECEIPT_LEAVES bölümünde LEAF'ini bulmalısın.`);
  lines.push(`Bu dört adım, fişinin o tarihte var olduğunu, değişmediğini ve senin`);
  lines.push(`olduğunu kanıtlar. Cüzdan hiçbir yerde yazmaz — yalnız LEAF'in girdisidir.`);
  return lines.join("\n");
}
