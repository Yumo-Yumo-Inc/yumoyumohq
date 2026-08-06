"use client";

/**
 * Chain anchor + ownership proof for one receipt.
 *
 * Two claims, kept strictly apart because they are not the same thing:
 *
 *   ANCHORED  — the receipt's fingerprint was folded into a root sealed on Solana.
 *               True for anyone to check; says nothing about who owns it.
 *   MINE      — the owner signs a challenge with the wallet hashed into the leaf.
 *               Only the private key holder can produce it, so a non-owner fails,
 *               and so would Yumo Yumo.
 *
 * The signature is verified IN THE BROWSER (lib/prices/ownership) — the server is
 * not asked whether the proof is good, because the point is not to trust it. The
 * server only hands over the owner's own values and the sibling hashes.
 *
 * Signing here is a message, not a transaction: free, no chain write. İ1 ("the
 * user never signs a price write") holds — the user signs only when they choose
 * to prove something.
 */

import { useEffect, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { CheckCircle2, ExternalLink, Link2, Loader2, ShieldCheck, XCircle } from "lucide-react";
import bs58 from "bs58";
import { useAppLocale } from "@/lib/i18n/app-context";
import { verifyOwnership, ownershipMessage, type OwnershipVerdict } from "@/lib/prices/ownership";
import { MONO } from "./theme";

type Anchor = {
  sealed: boolean;
  verified?: boolean;
  receiptId?: string;
  contentHash?: string;
  wallet?: string;
  leafHash?: string;
  epoch?: number;
  merkleRoot?: string;
  proof?: string[];
  memoTx?: string | null;
  arweaveTx?: string | null;
  error?: string;
  message?: string;
};

const short = (s: string, n = 8) => (s.length > n * 2 ? `${s.slice(0, n)}…${s.slice(-n)}` : s);

export function ChainAnchor({ receiptId }: { receiptId: string }) {
  const { locale } = useAppLocale();
  const isTr = locale === "tr";
  const { publicKey, wallet, connected } = useWallet();

  const [anchor, setAnchor] = useState<Anchor | null>(null);
  const [loading, setLoading] = useState(true);
  const [signing, setSigning] = useState(false);
  const [verdict, setVerdict] = useState<OwnershipVerdict | null>(null);
  const [signError, setSignError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    fetch(`/api/receipts/${encodeURIComponent(receiptId)}/proof?json=1`)
      .then((r) => (r.ok || r.status === 409 ? r.json() : null))
      .then((d) => {
        if (alive) setAnchor(d);
      })
      .catch(() => {})
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [receiptId]);

  // Nothing sealed yet, or the ledger is off: say nothing rather than show an
  // empty shell — an unsealed receipt is a normal state, not a failure.
  if (loading || !anchor || anchor.sealed === false) return null;

  // 409: sealed, but the receipt no longer matches what was sealed (edited after,
  // or the wallet was linked later so the leaf can't be re-derived). Saying
  // "sealed ✓" here would be a lie, and the anchor genuinely cannot be shown.
  if (anchor.verified === false) {
    return (
      <div className="rounded-2xl p-4" style={{ background: "var(--pf-inset)", border: "1px solid var(--pf-line)" }}>
        <span className="inline-flex items-center gap-2 text-[15px] font-semibold" style={{ color: "var(--pf-text)" }}>
          <Link2 className="h-4 w-4" style={{ color: "var(--pf-mute)" }} />
          {isTr ? "Zincirdeki kaydı" : "On-chain record"}
        </span>
        <p className="mt-2 text-[11.5px] leading-relaxed" style={{ color: "var(--pf-mute)" }}>
          {isTr
            ? `Bu fiş ${anchor.epoch != null ? `#${anchor.epoch} yayınında ` : ""}mühürlendi, ama kaydın şu anki hâli mühürlenen parmak iziyle eşleşmiyor — fiş sonradan değişmiş ya da cüzdan sonradan bağlanmış. Mühürlenmiş kayıt olduğu gibi duruyor; ona karşı kanıt üretilemiyor.`
            : `This receipt was sealed${anchor.epoch != null ? ` in epoch #${anchor.epoch}` : ""}, but its current state no longer matches the sealed fingerprint — it changed afterwards, or the wallet was linked later. The sealed record stands; a proof against it cannot be produced.`}
        </p>
      </div>
    );
  }

  const anchoredWallet = anchor.wallet ?? "";
  const hasKey = anchoredWallet.length > 0;
  const walletMatches = !!publicKey && publicKey.toBase58() === anchoredWallet;

  async function proveOwnership() {
    if (!anchor?.receiptId || !anchor.contentHash) return;
    setSignError(null);
    setVerdict(null);
    setSigning(true);
    try {
      const adapter = wallet?.adapter as { signMessage?: (m: Uint8Array) => Promise<unknown> } | undefined;
      if (!adapter?.signMessage) {
        setSignError(isTr ? "Bu cüzdan mesaj imzalamayı desteklemiyor." : "This wallet cannot sign messages.");
        return;
      }
      // A fresh nonce makes this a live proof rather than a replayable document.
      const nonce = bs58.encode(crypto.getRandomValues(new Uint8Array(16)));
      const msg = new TextEncoder().encode(ownershipMessage(anchor.receiptId, anchor.contentHash, nonce));
      const raw = (await adapter.signMessage(msg)) as Uint8Array | { signature: Uint8Array };
      const sigBytes = raw instanceof Uint8Array ? raw : (raw as { signature: Uint8Array })?.signature;
      if (!sigBytes) {
        setSignError(isTr ? "Cüzdan imza döndürmedi." : "The wallet returned no signature.");
        return;
      }
      setVerdict(
        verifyOwnership({
          receiptId: anchor.receiptId,
          contentHash: anchor.contentHash,
          wallet: anchoredWallet,
          signature: bs58.encode(Uint8Array.from(sigBytes)),
          nonce,
          proof: anchor.proof ?? [],
          merkleRoot: anchor.merkleRoot ?? "",
        })
      );
    } catch {
      // A user closing the wallet popup is a cancel, not an error worth shouting.
      setSignError(isTr ? "İmza tamamlanmadı." : "Signing did not complete.");
    } finally {
      setSigning(false);
    }
  }

  const Row = ({ k, v, href }: { k: string; v: string; href?: string }) => (
    <div className="flex items-baseline justify-between gap-3 border-t pt-2 first:border-t-0 first:pt-0" style={{ borderColor: "var(--pf-line)" }}>
      <span className="text-[10.5px] uppercase tracking-[0.12em]" style={{ color: "var(--pf-mute)", fontFamily: MONO }}>{k}</span>
      {href ? (
        <a href={href} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[11.5px] tabular-nums hover:underline" style={{ color: "var(--pf-gold)", fontFamily: MONO }}>
          {v}
          <ExternalLink className="h-3 w-3" />
        </a>
      ) : (
        <span className="text-[11.5px] tabular-nums" style={{ color: "var(--pf-text)", fontFamily: MONO }}>{v}</span>
      )}
    </div>
  );

  return (
    <div className="rounded-2xl p-4" style={{ background: "var(--pf-inset)", border: "1px solid var(--pf-line)" }}>
      <div className="mb-3 flex items-center justify-between gap-2">
        <span className="inline-flex items-center gap-2 text-[15px] font-semibold" style={{ color: "var(--pf-text)" }}>
          <Link2 className="h-4 w-4" style={{ color: "var(--pf-gold)" }} />
          {isTr ? "Zincirdeki kaydı" : "On-chain record"}
        </span>
        {anchor.memoTx && (
          <span className="rounded-md px-2 py-0.5 text-[10px] font-semibold" style={{ background: "rgba(63,217,160,0.14)", color: "#3FD9A0" }}>
            {isTr ? "MÜHÜRLÜ" : "SEALED"}
          </span>
        )}
      </div>

      <p className="mb-3 text-[11.5px] leading-relaxed" style={{ color: "var(--pf-soft)" }}>
        {isTr
          ? "Fişin içeriği zincire yazılmadı — yalnız geriye çevrilemeyen bir parmak izi. Bu parmak izi Solana'da mühürlü bir köke katlanıyor: fişin var olduğunu ve değişmediğini kanıtlıyor."
          : "The receipt's contents were never written to the chain — only an irreversible fingerprint. It folds into a root sealed on Solana, which proves the receipt existed and was not altered."}
      </p>

      <div className="space-y-2">
        {anchor.epoch != null && <Row k={isTr ? "Yayın" : "Epoch"} v={`#${anchor.epoch}`} />}
        {anchor.leafHash && <Row k={isTr ? "Parmak izi" : "Fingerprint"} v={short(anchor.leafHash)} />}
        {anchor.memoTx && <Row k={isTr ? "Mühür" : "Seal"} v={short(anchor.memoTx)} href={`https://solscan.io/tx/${anchor.memoTx}`} />}
        {anchor.arweaveTx && <Row k={isTr ? "Veri" : "Data"} v={short(anchor.arweaveTx)} href={`https://arweave.net/${anchor.arweaveTx}`} />}
      </div>

      {/* Ownership — a separate claim, and only possible where a key was sealed in. */}
      <div className="mt-4 border-t pt-3.5" style={{ borderColor: "var(--pf-line)" }}>
        <span className="inline-flex items-center gap-2 text-[13px] font-semibold" style={{ color: "var(--pf-text)" }}>
          <ShieldCheck className="h-4 w-4" style={{ color: "var(--pf-gold)" }} />
          {isTr ? "Sahiplik" : "Ownership"}
        </span>

        {!hasKey ? (
          <p className="mt-1.5 text-[11.5px] leading-relaxed" style={{ color: "var(--pf-mute)" }}>
            {isTr
              ? "Bu fiş, cüzdanın bağlı değilken mühürlendi — parmak izinde anahtar yok, sahiplik ispatlanamıyor. Mühürlenmiş kayıt değişmez. Cüzdan bağlarsan bundan sonraki fişlerin ispatlanabilir olur."
              : "This receipt was sealed while no wallet was linked, so its fingerprint carries no key and ownership cannot be proven. A sealed record never changes. Link a wallet and your future receipts become provable."}
          </p>
        ) : verdict?.ok ? (
          <div className="mt-2 flex items-start gap-2 rounded-xl p-3" style={{ background: "rgba(63,217,160,0.1)", border: "1px solid rgba(63,217,160,0.28)" }}>
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" style={{ color: "#3FD9A0" }} />
            <div className="min-w-0">
              <p className="text-[12px] font-semibold" style={{ color: "var(--pf-text)" }}>
                {isTr ? "Bu fiş senin — ispatlandı." : "This receipt is yours — proven."}
              </p>
              <p className="mt-0.5 text-[11px] leading-snug" style={{ color: "var(--pf-mute)" }}>
                {isTr
                  ? "Cüzdanını imzayla doğruladın ve fiş o cüzdana çapalanmış hâlde zincirde mühürlü. Bu ispatı senden başkası yapamaz — biz de yapamayız."
                  : "You proved control of the wallet by signature, and the receipt is sealed on chain anchored to it. Nobody else can make this proof — not even Yumo Yumo."}
              </p>
            </div>
          </div>
        ) : (
          <>
            <p className="mt-1.5 text-[11.5px] leading-relaxed" style={{ color: "var(--pf-soft)" }}>
              {isTr
                ? "Mühürlü kayıt fişin var olduğunu gösterir, ama senin olduğunu göstermez — cüzdan adresi herkese açıktır. Sahipliği ancak cüzdanının özel anahtarıyla bir mesaj imzalayarak ispatlarsın. Bu bir işlem değil: ücretsiz, zincire hiçbir şey yazılmaz."
                : "The sealed record shows the receipt exists, not that it is yours — a wallet address is public. Ownership is proven by signing a message with the wallet's private key. This is not a transaction: free, and nothing is written to the chain."}
            </p>

            {!connected ? (
              <p className="mt-2.5 text-[11px]" style={{ color: "var(--pf-mute)", fontFamily: MONO }}>
                {isTr ? "İspat için cüzdanını bağla." : "Connect your wallet to prove it."}
              </p>
            ) : !walletMatches ? (
              <p className="mt-2.5 text-[11px] leading-relaxed" style={{ color: "var(--pf-amber)" }}>
                {isTr
                  ? `Bağlı cüzdan bu fişin mühürlendiği cüzdan değil (${short(anchoredWallet, 4)}). Sahiplik yalnız o cüzdanla ispatlanır.`
                  : `The connected wallet is not the one this receipt was sealed with (${short(anchoredWallet, 4)}). Only that wallet can prove ownership.`}
              </p>
            ) : (
              <button
                type="button"
                onClick={proveOwnership}
                disabled={signing}
                className="mt-3 inline-flex items-center gap-2 px-3.5 py-2 text-[11px] font-bold uppercase tracking-wide transition-transform hover:scale-[1.03] active:scale-95 disabled:opacity-50"
                style={{ background: "var(--pf-inset)", border: "1px solid var(--pf-line-strong)", color: "var(--pf-text)", fontFamily: MONO }}
              >
                {signing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ShieldCheck className="h-3.5 w-3.5" />}
                {signing
                  ? isTr ? "İmza bekleniyor…" : "Waiting for signature…"
                  : isTr ? "Sahipliğini ispatla" : "Prove it's yours"}
              </button>
            )}

            {(signError || (verdict && !verdict.ok)) && (
              <div className="mt-2.5 flex items-start gap-2 rounded-xl p-3" style={{ background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.28)" }}>
                <XCircle className="mt-0.5 h-4 w-4 shrink-0" style={{ color: "#F87171" }} />
                <p className="text-[11px] leading-snug" style={{ color: "var(--pf-text)" }}>{signError ?? verdict?.reason}</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
