"use client";

/**
 * AchievementShowcase — the badge showcase. Fetches /api/user/achievements and
 * renders each track as a section: a progress bar to the next tier and a grid of
 * tier badges (earned in full color, locked as silhouettes). Designed to be
 * embeddable into /app/account (Overview) later; for now it stands alone on
 * /app/achievements.
 */

import { useEffect, useState } from "react";
import { AchievementBadge } from "@/components/achievements/achievement-badge";
import { pickAchName, type AchName } from "@/config/achievements";
import { useAppLocale } from "@/lib/i18n/app-context";

type Tier = {
  index: number;
  key: string;
  threshold: number;
  name: AchName;
  description: AchName;
  earned: boolean;
  earnedAt: string | null;
};
type Track = {
  key: string;
  metric: string;
  name: AchName;
  value: number;
  currentTier: { index: number } | null;
  nextTier: { index: number; threshold: number } | null;
  tiers: Tier[];
};

export function AchievementShowcase() {
  const { locale } = useAppLocale();
  const loc = locale as string;
  const [tracks, setTracks] = useState<Track[] | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let alive = true;
    fetch("/api/user/achievements", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((d) => alive && setTracks(d.tracks ?? []))
      .catch(() => alive && setError(true));
    return () => {
      alive = false;
    };
  }, []);

  const tr = (tk: string, en: string) => (loc === "tr" ? tk : en);

  if (error) {
    return (
      <p className="px-4 py-8 text-center text-sm" style={{ color: "var(--app-text-muted)" }}>
        {tr("Başarımlar yüklenemedi.", "Couldn't load achievements.")}
      </p>
    );
  }
  if (!tracks) {
    return (
      <p className="px-4 py-8 text-center text-sm" style={{ color: "var(--app-text-muted)" }}>
        {tr("Yükleniyor…", "Loading…")}
      </p>
    );
  }

  return (
    <div className="space-y-8">
      {tracks.map((track) => {
        const earnedCount = track.tiers.filter((t) => t.earned).length;
        const next = track.nextTier;
        const pct = next ? Math.min(100, Math.round((track.value / next.threshold) * 100)) : 100;
        return (
          <section key={track.key}>
            <div className="mb-3 flex items-baseline justify-between gap-3">
              <h3 className="text-base font-black tracking-tight" style={{ color: "var(--app-text-primary)" }}>
                {pickAchName(track.name, loc)}
              </h3>
              <span className="text-xs font-bold" style={{ color: "var(--app-text-muted)" }}>
                {earnedCount}/{track.tiers.length}
              </span>
            </div>

            {/* progress to next tier */}
            <div className="mb-4">
              <div className="flex items-center justify-between text-[11px] font-semibold" style={{ color: "var(--app-text-muted)" }}>
                <span>{track.value.toLocaleString(loc === "tr" ? "tr-TR" : "en-US")}</span>
                <span>
                  {next
                    ? `→ ${next.threshold.toLocaleString(loc === "tr" ? "tr-TR" : "en-US")}`
                    : tr("Tamamlandı", "Maxed out")}
                </span>
              </div>
              <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full" style={{ background: "color-mix(in srgb, var(--app-text-primary) 10%, transparent)" }}>
                <div
                  className="h-full rounded-full transition-[width] duration-500"
                  style={{ width: `${pct}%`, background: "linear-gradient(90deg,#2BC4AE,#F2B33D)" }}
                />
              </div>
            </div>

            {/* tier grid */}
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6">
              {track.tiers.map((tier) => (
                <div key={tier.key} className="flex flex-col items-center gap-1.5 text-center">
                  <AchievementBadge
                    badgeKey={tier.key}
                    tierIndex={tier.index}
                    tierCount={track.tiers.length}
                    earned={tier.earned}
                    size={76}
                  />
                  <span
                    className="text-[11px] font-bold leading-tight"
                    style={{ color: tier.earned ? "var(--app-text-primary)" : "var(--app-text-muted)" }}
                  >
                    {pickAchName(tier.name, loc)}
                  </span>
                  <span className="text-[10px]" style={{ color: "var(--app-text-muted)" }}>
                    {pickAchName(tier.description, loc)}
                  </span>
                </div>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
