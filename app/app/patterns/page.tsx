"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/app/app-shell";
import { useAppLocale } from "@/lib/i18n/app-context";
import type { SpendingIdentity } from "@/lib/insights/identity/identity-types";
import type { TribeData } from "@/lib/insights/identity/tribe";
import { EmptyIdentity, IdentityView, PatternsSkeleton } from "./components/identity-view";
import type { IdentityRange } from "./identity-copy";

export default function PatternsPage() {
  const { locale } = useAppLocale();
  const [identity, setIdentity] = useState<SpendingIdentity | null>(null);
  const [tribe, setTribe] = useState<TribeData | null>(null);
  const [heatmap, setHeatmap] = useState<number[][] | null>(null);
  const [range, setRange] = useState<IdentityRange>("90d");
  const [loading, setLoading] = useState(true);

  // Identity depends on the selected range; the tribe (cohort) does not.
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch(`/api/patterns/identity?range=${range}`, { cache: "no-store" });
        const json = res.ok ? await res.json() : null;
        if (alive) setIdentity(json?.identity ?? null);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [range]);

  useEffect(() => {
    let alive = true;
    (async () => {
      const res = await fetch("/api/patterns/tribe", { cache: "no-store" });
      const json = res.ok ? await res.json() : null;
      if (alive) setTribe(json?.tribe ?? null);
    })();
    return () => {
      alive = false;
    };
  }, []);

  // Spending rhythm (day × hour heatmap) — wide 90d window, independent of the
  // identity range. Sourced from the real insights bucket; null until loaded.
  useEffect(() => {
    let alive = true;
    (async () => {
      const res = await fetch("/api/insights/bucket?range=90d", { cache: "no-store" });
      const json = res.ok ? await res.json() : null;
      if (alive) setHeatmap(json?.bucket?.heatmap ?? null);
    })();
    return () => {
      alive = false;
    };
  }, []);

  return (
    <AppShell className="max-w-[430px] lg:max-w-[760px]">
      <div className="mx-auto w-full px-4 pb-24 pt-6">
        {loading && !identity ? (
          <PatternsSkeleton />
        ) : !identity || identity.insufficientData || !identity.classKeys ? (
          <EmptyIdentity locale={locale} />
        ) : (
          <IdentityView identity={identity} tribe={tribe} heatmap={heatmap} locale={locale} range={range} onRangeChange={setRange} />
        )}
      </div>
    </AppShell>
  );
}
