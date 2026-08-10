"use client";

/**
 * In-app ledger — loads sealed epochs from the same public API as /ledger,
 * so AppShell navigation stays in-product without duplicating the query path.
 */
import { useEffect, useState } from "react";
import { AppShell } from "@/components/app/app-shell";
import { LedgerDocument } from "@/components/ledger/ledger-document";
import type { SealedPriceEpoch } from "@/lib/prices/epoch-list";

export default function AppLedgerPage() {
  const [epochs, setEpochs] = useState<SealedPriceEpoch[]>([]);
  const [loadError, setLoadError] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch("/api/prices/epochs", { cache: "no-store" });
        if (!alive) return;
        if (!res.ok) {
          setLoadError(true);
          setReady(true);
          return;
        }
        const json = (await res.json()) as { epochs?: SealedPriceEpoch[] };
        setEpochs(Array.isArray(json.epochs) ? json.epochs : []);
      } catch {
        if (alive) setLoadError(true);
      } finally {
        if (alive) setReady(true);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  return (
    <AppShell topbarShowBack className="!p-0">
      <div className="mx-auto w-full max-w-[720px] px-4 pb-24 pt-2 lg:pb-8">
        {!ready ? (
          <div className="animate-pulse space-y-4 pt-6">
            <div className="h-3 w-40 rounded-full bg-[var(--app-text-muted)]/15" />
            <div className="h-9 w-56 rounded-lg bg-[var(--app-text-muted)]/15" />
            <div className="h-24 w-full rounded-xl bg-[var(--app-text-muted)]/10" />
          </div>
        ) : (
          <LedgerDocument epochs={epochs} loadError={loadError} embedded />
        )}
      </div>
    </AppShell>
  );
}
