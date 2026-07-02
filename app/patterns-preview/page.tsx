"use client";

/**
 * DEV-ONLY standalone visual preview of the Patterns redesign with mock data.
 * Lives OUTSIDE the /app auth gate so it can be screenshotted without a session.
 * Not linked anywhere. Safe to delete — see the redesign decision record.
 *
 *   /patterns-preview            → full identity + populated tribe
 *   /patterns-preview?state=empty→ insufficient-data empty state
 *   /patterns-preview?state=lonely→ identity present, tribe empty state
 */

import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import type { SpendingIdentity, Trait } from "@/lib/insights/identity/identity-types";
import type { TribeData } from "@/lib/insights/identity/tribe";
import { EmptyIdentity, IdentityView } from "../app/patterns/components/identity-view";
import type { IdentityRange } from "../app/patterns/identity-copy";

const T = (
  key: Trait["key"],
  value: number | null,
  delta: number | null,
  evidence: Trait["evidence"],
): Trait => ({ key, value, delta, confidence: value === null ? "none" : "high", evidence });

const MOCK_IDENTITY: SpendingIdentity = {
  computedAt: "2026-06-23T00:00:00.000Z",
  homeCity: "İzmir",
  receiptCount: 47,
  windowDays: 90,
  classKeys: ["explorer", "hunter"],
  insufficientData: false,
  traits: [
    T("impulse", 72, -6, { impulse: { weekendNightShare: 0.34, receiptsWithTime: 30, totalReceipts: 47 } }),
    T("hunter", 88, 6, { hunter: { discountedItems: 31, totalItems: 47, discountedSpendShare: 0.41 } }),
    T("explorer", 81, 7, { explorer: { newMerchants: 12, merchantVisits: 38 } }),
    T("hedonist", 64, 3, { hedonist: { hedonicShare: 0.41 } }),
    T("loyal", 55, -3, { loyal: { topMerchantName: "Migros", topMerchantShare: 0.22, distinctMerchants: 18 } }),
    T("planner", 38, -4, { planner: { essentialShare: 0.32, basketCv: 0.7 } }),
  ],
};

const MOCK_TRIBE_FULL: TribeData = {
  enough: true,
  classKeys: ["explorer", "hunter"],
  city: "İstanbul",
  cityClassCohort: 2340,
  globalClassCohort: 18700,
  cityPeers: 5120,
  leaderboard: [
    { displayName: "gece_kaşifi", explorer: 92, isYou: false },
    { displayName: "kahve_avcısı", explorer: 88, isYou: false },
    { displayName: "sokak_lezzeti", explorer: 84, isYou: false },
    { displayName: "Uğur", explorer: 81, isYou: true },
    { displayName: "kampanya_kralı", explorer: 76, isYou: false },
  ],
  discovery: [
    { merchant: "Kronotrop", visitors: 84 },
    { merchant: "Lokanta Maya", visitors: 61 },
    { merchant: "Minoa", visitors: 47 },
  ],
};

const MOCK_TRIBE_EMPTY: TribeData = {
  enough: false,
  classKeys: ["explorer", "hunter"],
  city: "İstanbul",
  cityClassCohort: 0,
  globalClassCohort: 3,
  cityPeers: 14,
  leaderboard: [],
  discovery: [],
};

/** 7 days × 24 hours — weekday lunch + evening peaks, weekend afternoon. */
const MOCK_HEATMAP: number[][] = Array.from({ length: 7 }, (_, dow) => {
  const row = new Array(24).fill(0);
  if (dow < 5) {
    row[12] = 3;
    row[13] = 4;
    row[19] = 5;
    row[20] = 4;
  } else {
    row[14] = 3;
    row[15] = 4;
    row[16] = 5;
    row[21] = 3;
  }
  return row;
});

function PatternsPreviewContent() {
  const state = useSearchParams().get("state");
  const [range, setRange] = useState<IdentityRange>("90d");
  return (
    <div style={{ minHeight: "100vh", background: "var(--app-bg-base)" }}>
      <div className="mx-auto w-full max-w-[430px] px-4 pb-24 pt-6">
        {state === "empty" ? (
          <EmptyIdentity locale="tr" />
        ) : (
          <IdentityView
            identity={MOCK_IDENTITY}
            tribe={state === "lonely" ? MOCK_TRIBE_EMPTY : MOCK_TRIBE_FULL}
            heatmap={MOCK_HEATMAP}
            locale="tr"
            range={range}
            onRangeChange={setRange}
          />
        )}
      </div>
    </div>
  );
}

export default function PatternsPreviewStandalone() {
  return (
    <Suspense fallback={null}>
      <PatternsPreviewContent />
    </Suspense>
  );
}
