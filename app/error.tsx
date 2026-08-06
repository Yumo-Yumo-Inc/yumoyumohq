"use client";

import { useEffect } from "react";
import { getCrashCopy } from "@/lib/i18n/error-messages";

/**
 * Segment-level crash boundary for everything under the root layout. Catches
 * render/runtime errors that the in-tree ErrorBoundary does not (e.g. errors
 * thrown from a Server Component boundary). Renders inside the root layout, so
 * global CSS is available, but outside the app i18n provider — copy therefore
 * comes from the provider-free, cookie-based helper. The raw error is never
 * shown to the user.
 */
export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Keep a console trail for debugging without surfacing anything to the user.
    console.error("Segment error boundary caught an error:", error);
  }, [error]);

  const copy = getCrashCopy();

  const msg = error?.message || "";
  const isNetworkError =
    /failed to fetch|networkerror|network request failed|err_internet_disconnected|err_network_changed/i.test(
      msg
    );

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/[0.03] p-7 text-center">
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
