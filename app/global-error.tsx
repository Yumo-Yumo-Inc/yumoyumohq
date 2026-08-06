"use client";

import { getCrashCopy } from "@/lib/i18n/error-messages";

/**
 * Root-level crash boundary. Renders when the root layout itself throws — the
 * one case the in-tree ErrorBoundary and app/error.tsx cannot catch. Next.js
 * would otherwise show its bare "Application error: a client-side exception has
 * occurred" screen, which reads to the user as a raw JavaScript failure.
 *
 * This component REPLACES the root layout (own <html>/<body>), so it cannot rely
 * on global CSS, the theme, or the i18n provider being present. All styling is
 * inline and the copy comes from the provider-free cookie-based helper. The raw
 * error is never shown to the user.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const copy = getCrashCopy();

  const msg = error?.message || "";
  const isNetworkError =
    /failed to fetch|networkerror|network request failed|err_internet_disconnected|err_network_changed/i.test(
      msg
    );

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "16px",
          background: "#0a0a0f",
          color: "#e5e7eb",
          fontFamily:
            "system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: "420px",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: "16px",
            background: "rgba(255,255,255,0.03)",
            padding: "28px 24px",
            textAlign: "center",
          }}
        >
          <div
            aria-hidden
            style={{
              fontSize: "34px",
              lineHeight: 1,
              marginBottom: "14px",
            }}
          >
            {isNetworkError ? "📶" : "⚠️"}
          </div>
          <h1
            style={{
              margin: "0 0 8px",
              fontSize: "18px",
              fontWeight: 600,
              color: "#f9fafb",
            }}
          >
            {isNetworkError ? copy.networkTitle : copy.title}
          </h1>
          <p
            style={{
              margin: "0 0 22px",
              fontSize: "14px",
              lineHeight: 1.5,
              color: "#9ca3af",
            }}
          >
            {isNetworkError ? copy.networkDescription : copy.description}
          </p>
          <div style={{ display: "flex", gap: "10px" }}>
            <button
              type="button"
              onClick={() => reset()}
              style={{
                flex: 1,
                padding: "10px 14px",
                borderRadius: "10px",
                border: "1px solid rgba(255,255,255,0.14)",
                background: "transparent",
                color: "#e5e7eb",
                fontSize: "14px",
                fontWeight: 500,
                cursor: "pointer",
              }}
            >
              {copy.tryAgain}
            </button>
            <button
              type="button"
              onClick={() => {
                if (typeof window !== "undefined") window.location.reload();
              }}
              style={{
                flex: 1,
                padding: "10px 14px",
                borderRadius: "10px",
                border: "none",
                background: "#7c5cff",
                color: "#ffffff",
                fontSize: "14px",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              {copy.reload}
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
