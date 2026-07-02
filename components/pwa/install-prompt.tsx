"use client";

import { useEffect, useMemo, useState } from "react";
import { Download, Share, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAppLocale } from "@/lib/i18n/app-context";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

const DISMISS_KEY = "pwa-install-dismissed-at";
const DISMISS_MS = 1000 * 60 * 60 * 24 * 7;

function isStandaloneMode() {
  if (typeof window === "undefined") return false;

  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

function isIosDevice() {
  if (typeof navigator === "undefined") return false;
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

export function InstallPrompt({ className }: { className?: string }) {
  const { locale } = useAppLocale();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isStandalone, setIsStandalone] = useState(true);
  const [dismissed, setDismissed] = useState(true);
  const [showIosHint, setShowIosHint] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const standalone = isStandaloneMode();
    const dismissedAtRaw = window.localStorage.getItem(DISMISS_KEY);
    const dismissedAt = dismissedAtRaw ? Number(dismissedAtRaw) : 0;
    const recentlyDismissed = Number.isFinite(dismissedAt) && Date.now() - dismissedAt < DISMISS_MS;

    setIsStandalone(standalone);
    setDismissed(recentlyDismissed);
    setShowIosHint(!standalone && isIosDevice());

    const mediaQuery = window.matchMedia("(display-mode: standalone)");
    const syncStandalone = () => setIsStandalone(isStandaloneMode());
    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
      setDismissed(recentlyDismissed);
    };

    syncStandalone();
    mediaQuery.addEventListener("change", syncStandalone);
    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      mediaQuery.removeEventListener("change", syncStandalone);
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const content = useMemo(() => {
    if (locale === "tr") {
      return {
        title: "Yumo Yumo'yu telefonuna ekle",
        body:
          deferredPrompt != null
            ? "Uygulamayı ana ekranına ekleyip tam ekran, daha hızlı ve native'e yakın şekilde kullanabilirsin."
            : "Safari'de Paylaş menüsünü açıp Ana Ekrana Ekle seçeneğiyle uygulamayı telefonuna kurabilirsin.",
        install: "Yükle",
        later: "Daha Sonra",
        iosHint: "Paylaş",
        iosHintSuffix: "ve ardından Ana Ekrana Ekle",
      };
    }

    return {
      title: "Install Yumo Yumo",
      body:
        deferredPrompt != null
          ? "Add the app to your home screen for a faster, fullscreen mobile experience."
          : "Open Safari share sheet and choose Add to Home Screen to install the app on your phone.",
      install: "Install",
      later: "Later",
      iosHint: "Share",
      iosHintSuffix: "then Add to Home Screen",
    };
  }, [deferredPrompt, locale]);

  if (isStandalone || dismissed || (!deferredPrompt && !showIosHint)) {
    return null;
  }

  const handleDismiss = () => {
    window.localStorage.setItem(DISMISS_KEY, Date.now().toString());
    setDismissed(true);
  };

  const handleInstall = async () => {
    if (!deferredPrompt) {
      return;
    }

    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;

    if (choice.outcome === "accepted") {
      setDeferredPrompt(null);
      setDismissed(true);
      return;
    }

    handleDismiss();
  };

  return (
    <div
      className={cn(
        "fixed left-3 right-3 z-[60] rounded-3xl border border-[var(--app-border-strong)] bg-[var(--app-bg-elevated)] p-4 shadow-[var(--app-shadow-card)] backdrop-blur-xl",
        "lg:left-auto lg:right-4 lg:max-w-sm",
        className
      )}
      style={{
        bottom: "calc(env(safe-area-inset-bottom) + clamp(5.5rem, 14svh, 6.75rem))",
      }}
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[var(--app-primary)]/15 text-[var(--app-primary)]">
          {deferredPrompt ? <Download className="h-5 w-5" /> : <Share className="h-5 w-5" />}
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-[var(--app-text-primary)]">{content.title}</p>
          <p className="mt-1 text-xs leading-5 text-[var(--app-text-secondary)]">{content.body}</p>

          {showIosHint && !deferredPrompt && (
            <p className="mt-2 text-xs text-[var(--app-text-muted)]">
              {content.iosHint} <span className="font-semibold text-[var(--app-text-primary)]">Share</span>{" "}
              {content.iosHintSuffix}
            </p>
          )}

          <div className="mt-3 flex flex-wrap gap-2">
            {deferredPrompt && (
              <Button
                type="button"
                onClick={() => void handleInstall()}
                className="h-9 rounded-xl bg-[var(--app-primary)] px-4 text-black hover:opacity-90"
              >
                {content.install}
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              onClick={handleDismiss}
              className="h-9 rounded-xl border-[var(--app-border)] bg-[var(--app-bg-surface)] text-[var(--app-text-primary)] hover:bg-white/5"
            >
              {content.later}
            </Button>
          </div>
        </div>

        <button
          type="button"
          onClick={handleDismiss}
          className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[var(--app-text-muted)] transition-colors hover:bg-white/5 hover:text-[var(--app-text-primary)]"
          aria-label="Dismiss install prompt"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
