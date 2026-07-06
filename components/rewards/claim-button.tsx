"use client";

/**
 * INT claim card for the rewards page. Ships dark: renders nothing while
 * FEATURE_ONCHAIN_REWARDS is off (the claim-proof API answers {disabled}) or
 * when the user has no allocation. Until the distributor tree is ingested
 * (claimReady=false) the button stays disabled — "Claim opens at TGE".
 *
 * The claim transaction is signed by the user's wallet (the app never signs);
 * after confirmation the signature is recorded via /api/rewards/claim-confirm,
 * which re-verifies the transaction on-chain.
 */

import { useCallback, useEffect, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { Connection, PublicKey, Transaction } from "@solana/web3.js";
import { Coins, Lock, CheckCircle2, AlertTriangle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { buildNewClaimInstruction } from "@/lib/solana/distributor";
import { getClientEndpoint } from "@/lib/solana/rpc";
import { useAppLocale } from "@/lib/i18n/app-context";

interface ClaimProof {
  ok: boolean;
  disabled?: boolean;
  epoch: number;
  walletAddress: string;
  intAmount: string;
  claimed: boolean;
  claimTx: string | null;
  claimReady: boolean;
  distributorAddress: string | null;
  intMint: string | null;
  jitoProof: string[] | null;
}

export function ClaimButton() {
  const { t, locale } = useAppLocale();
  const { publicKey, sendTransaction } = useWallet();
  const [proof, setProof] = useState<ClaimProof | null>(null);
  const [claiming, setClaiming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/rewards/claim-proof?epoch=latest", { credentials: "include" });
      if (!res.ok) return; // no claimable epoch / no allocation → stay hidden
      const data = (await res.json()) as ClaimProof;
      if (data.ok) setProof(data);
    } catch {
      // network error → stay hidden
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (!proof) return null;

  const amount = Number(proof.intAmount);
  const walletMismatch = Boolean(publicKey && publicKey.toBase58() !== proof.walletAddress);

  const handleClaim = async () => {
    if (!publicKey || !proof.claimReady || !proof.distributorAddress || !proof.intMint || !proof.jitoProof) return;
    setClaiming(true);
    setError(null);
    try {
      const connection = new Connection(getClientEndpoint(), "confirmed");
      const ix = buildNewClaimInstruction({
        distributor: new PublicKey(proof.distributorAddress),
        claimant: publicKey,
        mint: new PublicKey(proof.intMint),
        amountUnlocked: BigInt(Math.round(amount * 1_000_000)),
        amountLocked: BigInt(0),
        proofHex: proof.jitoProof,
      });
      const tx = new Transaction().add(ix);
      const signature = await sendTransaction(tx, connection);
      await connection.confirmTransaction(signature, "confirmed");
      const confirm = await fetch("/api/rewards/claim-confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ epoch: proof.epoch, signature }),
      });
      if (!confirm.ok) throw new Error((await confirm.json()).error ?? "confirm failed");
      await load();
    } catch (e: any) {
      setError(e?.message ?? String(e));
    } finally {
      setClaiming(false);
    }
  };

  return (
    <Card className="card-cinematic card-secondary border-primary/30">
      <CardContent className="pt-4 pb-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-2.5">
            <div className="p-2 rounded-xl bg-primary/10 flex-shrink-0">
              <Coins className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold">{t("rewardsPage.claimTitle")}</p>
              <p className="text-xl font-black tabular-nums text-primary mt-0.5">
                {amount.toLocaleString(locale)} INT
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {t("rewardsPage.claimEpoch", { epoch: proof.epoch })}
              </p>
            </div>
          </div>
          <div className="flex-shrink-0">
            {proof.claimed ? (
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-400">
                <CheckCircle2 className="h-3.5 w-3.5" />
                {t("rewardsPage.claimDone")}
              </span>
            ) : (
              <Button
                size="sm"
                disabled={!proof.claimReady || walletMismatch || claiming || !publicKey}
                onClick={handleClaim}
              >
                {proof.claimReady ? (
                  <span className="text-xs">{claiming ? t("rewardsPage.claiming") : t("rewardsPage.claimNow")}</span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-xs">
                    <Lock className="h-3 w-3" />
                    {t("rewardsPage.claimOpensAtTge")}
                  </span>
                )}
              </Button>
            )}
          </div>
        </div>
        {walletMismatch && !proof.claimed && (
          <p className="mt-3 flex items-start gap-1.5 text-xs text-amber-400">
            <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0 mt-px" />
            {t("rewardsPage.claimWalletMismatch")}
          </p>
        )}
        {error && <p className="mt-3 text-xs text-red-400">{error}</p>}
      </CardContent>
    </Card>
  );
}
