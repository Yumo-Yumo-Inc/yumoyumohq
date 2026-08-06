"use client";

import { useEffect } from "react";
import { getCrashCopy } from "@/lib/i18n/error-messages";

/**
 * Segment boundary for the authenticated app shell. A render error in any
 * /app/* page lands here instead of bubbling to the root boundary, so the
 * surrounding layout (topbar, navigation) stays mounted and the user can
 * navigate away without a full reload. Copy comes from the provider-free,
 * cookie-based helper; the raw error is never shown.
 */
export default function AppSegmentError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("App segment boundary caught an error:", error);
  }, [error]);

  const copy = getCrashCopy();

  const msg = error?.message || "";
  const isNetworkError =
    /failed to fetch|networkerror|network request failed|err_internet_disconnected|err_network_changed/i.test(
      msg
    );

  return (
    <div className="flex min-h-[60vh] items-center justify-center p-4">
      <div
        className="w-full max-w-md rounded-2xl p-7 text-center"
        style={{
          background:
            "linear-gradient(160deg, var(--app-bg-elevated, rgba(255,255,255,0.04)), var(--app-bg-surface, rgba(255,255,255,0.02)))",
          borderTop: "1px solid rgba(255,255,255,0.08)",
          boxShadow: "var(--app-shadow-card, 0 12px 32px rgba(0,0,0,0.35))",
        }}
      >
        <div aria-hidden className="mb-3 text-4xl leading-none">
          {isNetworkError ? "📶" : "⚠️"}
        </div>
        <h1 className="mb-2 text-lg font-semibold text-foreground">
          {isNetworkError ? copy.networkTitle : copy.title}
        </h1>
        <p className="mb-6 text-sm leading-relaxed text-muted-foreground">
          {isNetworkError ? copy.networkDescription : copy.description}
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => reset()}
            className="flex-1 rounded-lg border border-white/15 px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-white/5"
          >
            {copy.tryAgain}
          </button>
          <button
            type="button"
            onClick={() => {
              if (typeof window !== "undefined") window.location.reload();
            }}
            className="flex-1 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
          >
            {copy.reload}
          </button>
        </div>
      </div>
    </div>
  );
}
