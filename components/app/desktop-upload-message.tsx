"use client";

import { useAppLocale } from "@/lib/i18n/app-context";
import { ThemeCard } from "@/components/app/theme-card";
import { Smartphone } from "lucide-react";

/** Optional app store URLs - set in env or leave empty to hide links */
const APP_STORE_URL = process.env.NEXT_PUBLIC_APP_STORE_URL || "";
const PLAY_STORE_URL = process.env.NEXT_PUBLIC_PLAY_STORE_URL || "";

/**
 * Shown on desktop when user visits /app/mine or /app/upload.
 * Tells them to use the mobile app for scanning/uploading receipts.
 * Optionally shows App Store / Play Store links if env URLs are set.
 */
export function DesktopUploadMessage() {
  const { t } = useAppLocale();
  const showStoreLinks = Boolean(APP_STORE_URL || PLAY_STORE_URL);

  return (
    <ThemeCard className="p-8 text-center max-w-md mx-auto">
      <div className="flex justify-center mb-4">
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center"
          style={{ background: "var(--app-bg-elevated)", border: "1px solid var(--app-border)" }}
        >
          <Smartphone className="w-8 h-8" style={{ color: "var(--app-text-muted)" }} />
        </div>
      </div>
      <h2 className="text-lg font-semibold mb-2" style={{ color: "var(--app-text-primary)" }}>
        {t("mine.desktopOnlyTitle")}
      </h2>
      <p className="text-sm mb-6" style={{ color: "var(--app-text-muted)" }}>
        {t("mine.desktopOnlyDescription")}
      </p>
      {showStoreLinks && (
        <div className="flex flex-wrap justify-center gap-3">
          {APP_STORE_URL && (
            <a
              href={APP_STORE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium px-4 py-2 rounded-lg border transition-colors hover:opacity-90"
              style={{ borderColor: "var(--app-border)", color: "var(--app-text-primary)" }}
            >
              {t("mine.desktopOnlyAppStore")}
            </a>
          )}
          {PLAY_STORE_URL && (
            <a
              href={PLAY_STORE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium px-4 py-2 rounded-lg border transition-colors hover:opacity-90"
              style={{ borderColor: "var(--app-border)", color: "var(--app-text-primary)" }}
            >
              {t("mine.desktopOnlyPlayStore")}
            </a>
          )}
        </div>
      )}
    </ThemeCard>
  );
}
