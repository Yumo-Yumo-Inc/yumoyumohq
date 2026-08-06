"use client";

/**
 * SeasonCompleteGate — fetches closed-season completion once the user is
 * authenticated, and shows SeasonCompleteModal the first time they enter
 * after close (localStorage dedupe per season number).
 */

import { useEffect, useState } from "react";
import {
  SeasonCompleteModal,
  markSeasonCompleteSeen,
  readSeenSeasonNumbers,
  type SeasonCompletePayload,
} from "@/components/app/season/season-complete-modal";

export function SeasonCompleteGate({ blocked = false }: { blocked?: boolean }) {
  const [payload, setPayload] = useState<SeasonCompletePayload | null>(null);

  useEffect(() => {
    let alive = true;

    const preview =
      process.env.NODE_ENV !== "production" &&
      typeof window !== "undefined" &&
      new URLSearchParams(window.location.search).get("seasonCompletePreview") === "1";

    if (preview) {
      setPayload({
        seasonNumber: 2,
        name: "Genesis",
        key: "genesis",
        rank: 3,
        seasonXp: 8420,
        tier: { key: "flame", index: 3, pointsReward: 5000 },
      });
      return () => {
        alive = false;
      };
    }

    fetch("/api/season/completion", { cache: "no-store", credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { pending?: SeasonCompletePayload | null } | null) => {
        if (!alive || !d?.pending) return;
        const pending = d.pending;
        const seen = readSeenSeasonNumbers();
        if (seen.includes(pending.seasonNumber)) return;
        setPayload(pending);
      })
      .catch(() => {});

    return () => {
      alive = false;
    };
  }, []);

  if (blocked || !payload) return null;

  return (
    <SeasonCompleteModal
      payload={payload}
      onDismiss={() => {
        markSeasonCompleteSeen(payload.seasonNumber);
        setPayload(null);
      }}
    />
  );
}
