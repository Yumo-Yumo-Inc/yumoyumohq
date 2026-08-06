"use client";

/**
 * SeasonRecapPanel — fetches the caller's season-so-far numbers and renders the
 * shareable SeasonRecapCard with a share/save action (rasterizes the card via
 * modern-screenshot, then Web Share API with a download fallback). Lives at the
 * top of the season hub's Rewards tab.
 */

import { useEffect, useRef, useState } from "react";
import { Share2 } from "lucide-react";
import { useAppLocale } from "@/lib/i18n/app-context";
import { useAppProfile } from "@/lib/app/profile-context";
import { SeasonRecapCard, type SeasonRecapStats } from "@/components/app/season/season-recap-card";

/** Minimal country → currency symbol (falls back to the app's primary ₺). */
function currencyFor(country?: string | null): string {
  switch ((country ?? "").toUpperCase()) {
    case "US": case "USA": return "$";
    case "GB": case "UK": return "£";
    case "RU": return "₽";
    case "TH": return "฿";
    case "CN": return "¥";
    default: return "₺";
  }
}

export function SeasonRecapPanel({
  seasonName,
  tierKey,
  tierLabel,
  seasonLevel,
  maxLevel,
}: {
  seasonName: string;
  tierKey: string;
  tierLabel: string;
  seasonLevel: number;
  maxLevel: number;
}) {
  const { locale } = useAppLocale();
  const { profile } = useAppProfile();
  const cardRef = useRef<HTMLDivElement>(null);
  const [stats, setStats] = useState<SeasonRecapStats | null>(null);
  const [sharing, setSharing] = useState(false);
  const l = (tr: string, en: string) => (locale === "tr" ? tr : en);

  useEffect(() => {
    let alive = true;
    fetch("/api/season/recap", { cache: "no-store", credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (alive && d?.stats) setStats(d.stats as SeasonRecapStats);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  async function share() {
    const node = cardRef.current;
    if (!node) return;
    setSharing(true);
    try {
      const { domToBlob } = await import("modern-screenshot");
      const blob = await domToBlob(node, { scale: 2, type: "image/png" });
      const file = new File([blob], "yumo-season.png", { type: "image/png" });
      const text = l("Genesis sezonundaki durumum 🔥", "My Genesis season so far 🔥");
      if (typeof navigator !== "undefined" && navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: "Yumo Yumo", text });
      } else {
        const url = URL.createObjectURL(file);
        const a = document.createElement("a");
        a.href = url;
        a.download = file.name;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch {
      /* user cancelled or capture failed — no-op */
    } finally {
      setSharing(false);
    }
  }

  if (!stats) return null;

  const displayName = profile?.displayName ?? profile?.username ?? "Yumo";
  const currency = currencyFor(profile?.country);

  return (
    <section className="mb-6">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-[15px] font-bold">{l("Sezon Özetin", "Your Season")}</h2>
        <button
          type="button"
          onClick={share}
          disabled={sharing}
          className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-[13px] font-bold transition-transform active:scale-[0.97] disabled:opacity-60"
          style={{ background: "linear-gradient(135deg, #FFD66B, #F5A623)", color: "#1a1206" }}
        >
          <Share2 className="h-4 w-4" />
          {sharing ? l("Hazırlanıyor…", "Preparing…") : l("Paylaş", "Share")}
        </button>
      </div>
      <div className="flex justify-center">
        <SeasonRecapCard
          ref={cardRef}
          seasonName={seasonName}
          tierKey={tierKey}
          tierLabel={tierLabel}
          seasonLevel={seasonLevel}
          maxLevel={maxLevel}
          stats={stats}
          currency={currency}
          displayName={displayName}
          locale={locale}
        />
      </div>
    </section>
  );
}
