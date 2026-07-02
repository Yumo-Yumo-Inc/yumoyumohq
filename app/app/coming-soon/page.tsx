"use client";

import { AppShell } from "@/components/app/app-shell";
import { ThemeCard } from "@/components/app/theme-card";
import { useAppProfile } from "@/lib/app/profile-context";
import { useAppLocale } from "@/lib/i18n/app-context";
import { Construction } from "lucide-react";

export default function ComingSoonPage() {
  const { t } = useAppLocale();
  const { profile } = useAppProfile();
  const accountLevel = profile?.accountLevel ?? 1;

  return (
    <AppShell>
      <div className="max-w-lg mx-auto px-4 py-12">
        <ThemeCard accountLevel={accountLevel} className="p-8 text-center">
          <div
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4"
            style={{
              background: "var(--app-bg-elevated)",
              border: "2px solid var(--app-border)",
            }}
          >
            <Construction className="h-8 w-8" style={{ color: "var(--app-text-muted)" }} />
          </div>
          <h1 className="text-xl font-bold mb-2" style={{ color: "var(--app-text-primary)" }}>
            {t("comingSoon.title")}
          </h1>
          <p className="text-sm" style={{ color: "var(--app-text-muted)" }}>
            {t("comingSoon.description")}
          </p>
        </ThemeCard>
      </div>
    </AppShell>
  );
}
