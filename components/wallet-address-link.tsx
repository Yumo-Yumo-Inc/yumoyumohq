"use client";

/**
 * Paste-to-link fallback for the reward wallet. Works on any device (no live
 * wallet connection needed): the user pastes their Solana address, which is
 * stored on their account as UNVERIFIED. Ownership is proven later at claim
 * time. When the user links via the connect button (signature), that path
 * stores the same field as VERIFIED and this card reflects it.
 */

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Check, ShieldCheck } from "lucide-react";

interface LinkedWallet {
  walletAddress: string | null;
  walletVerified: boolean;
}

export function WalletAddressLink({ locale }: { locale: string }) {
  const l = (tr: string, en: string) => (locale === "tr" ? tr : en);
  const [current, setCurrent] = useState<LinkedWallet | null>(null);
  const [value, setValue] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedTick, setSavedTick] = useState(false);

  useEffect(() => {
    let alive = true;
    fetch("/api/wallet/link", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (alive && d) setCurrent({ walletAddress: d.walletAddress ?? null, walletVerified: Boolean(d.walletVerified) });
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  const save = async () => {
    const addr = value.trim();
    if (!addr) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/wallet/link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ walletAddress: addr }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError((data as any)?.error || l("Adres kaydedilemedi.", "Could not save address."));
        return;
      }
      setCurrent({ walletAddress: (data as any).walletAddress ?? addr, walletVerified: Boolean((data as any).walletVerified) });
      setValue("");
      setSavedTick(true);
      setTimeout(() => setSavedTick(false), 1800);
    } catch {
      setError(l("Adres kaydedilemedi.", "Could not save address."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-2">
      {current?.walletAddress && (
        <div
          className="flex items-center gap-2 rounded-lg px-3 py-2 text-[13px]"
          style={{ background: "var(--app-bg-elevated)", border: "1px solid var(--app-border)", color: "var(--app-text-secondary)" }}
        >
          {current.walletVerified ? (
            <ShieldCheck className="h-4 w-4 shrink-0" style={{ color: "var(--app-primary)" }} />
          ) : (
            <Check className="h-4 w-4 shrink-0" style={{ color: "var(--app-text-muted)" }} />
          )}
          <span className="truncate font-mono">{current.walletAddress}</span>
          <span className="ml-auto shrink-0 text-[11px] font-semibold uppercase" style={{ color: current.walletVerified ? "var(--app-primary)" : "var(--app-text-muted)" }}>
            {current.walletVerified ? l("Doğrulandı", "Verified") : l("Kayıtlı", "Saved")}
          </span>
        </div>
      )}

      <p className="text-[12px] leading-5" style={{ color: "var(--app-text-muted)" }}>
        {l(
          "Cüzdan bağlayamıyorsan Solana adresini buraya yapıştır. Sahiplik, ödül talebi sırasında imzayla doğrulanır.",
          "If you can't connect a wallet, paste your Solana address here. Ownership is verified by signature at claim time.",
        )}
      </p>

      <div className="flex gap-2">
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={l("Solana adresi", "Solana address")}
          spellCheck={false}
          autoCapitalize="none"
          autoCorrect="off"
          className="min-w-0 flex-1 rounded-lg px-3 py-2 text-[13px] font-mono outline-none"
          style={{ background: "var(--app-bg-base)", border: "1px solid var(--app-border)", color: "var(--app-text-primary)" }}
        />
        <Button type="button" onClick={save} disabled={saving || !value.trim()} size="sm">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : savedTick ? <Check className="h-4 w-4" /> : l("Kaydet", "Save")}
        </Button>
      </div>

      {error && (
        <p className="text-[12px]" style={{ color: "var(--app-danger, #ef4444)" }}>
          {error}
        </p>
      )}
    </div>
  );
}
