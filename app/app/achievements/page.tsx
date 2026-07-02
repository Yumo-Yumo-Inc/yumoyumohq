"use client";

/**
 * /app/achievements — the badge showcase. Standalone for now; the same
 * AchievementShowcase component is meant to embed into /app/account (Overview)
 * once that command-center shell exists (Phase 0b).
 */

import { AppShell } from "@/components/app/app-shell";
import { AchievementShowcase } from "@/components/achievements/achievement-showcase";
import { useAppLocale } from "@/lib/i18n/app-context";

export default function AchievementsPage() {
  const { locale } = useAppLocale();
  const tr = (tk: string, en: string) => (locale === "tr" ? tk : en);

  return (
    <AppShell>
      <div className="mx-auto max-w-3xl px-4 py-6">
        <header className="mb-6">
          <h1 className="text-2xl font-black tracking-tight" style={{ color: "var(--app-text-primary)" }}>
            {tr("Başarımlar", "Achievements")}
          </h1>
          <p className="mt-1 text-sm" style={{ color: "var(--app-text-muted)" }}>
            {tr(
              "Eylemlerinle açtığın kademeli yollar. Her seviye yeni bir ad ve rozet.",
              "Tiered tracks you unlock through your activity. Each level is a new name and badge.",
            )}
          </p>
        </header>
        <AchievementShowcase />
      </div>
    </AppShell>
  );
}
