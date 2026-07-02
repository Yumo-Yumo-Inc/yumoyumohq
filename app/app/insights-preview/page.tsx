"use client";

/**
 * /app/insights-preview
 *
 * Dev-only preview of the new insights design. Renders the static HTML
 * mockup (public/insights-mockup.html) inside an iframe so the visual
 * direction can be reviewed against the live app shell without touching the
 * real /insights route. Wired up so the existing AppShell header + nav
 * surround the preview, matching how the production page will eventually
 * feel.
 *
 * Remove this route (and public/insights-mockup.html) once the design is
 * promoted to /insights via a real React/TSX implementation.
 */

import { useState } from "react";
import { AppShell } from "@/components/app/app-shell";

export default function InsightsPreviewPage() {
  const [loaded, setLoaded] = useState(false);

  return (
    <AppShell>
      <div className="space-y-3 pb-24 lg:pb-8">
        <div className="flex items-center justify-between gap-3 px-1">
          <div>
            <div className="text-[11px] uppercase tracking-[0.08em] text-app-text-muted">
              Önizleme · tasarım mockup'ı
            </div>
            <h1 className="text-headline-sm text-app-text-primary mt-1">
              İzler — yeni tasarım
            </h1>
          </div>
          <a
            href="/insights-mockup.html"
            target="_blank"
            rel="noreferrer"
            className="text-[12px] text-app-text-secondary hover:text-app-text-primary underline-offset-4 hover:underline"
          >
            Tam ekran aç ↗
          </a>
        </div>

        <div
          className="relative w-full overflow-hidden rounded-2xl border"
          style={{
            borderColor: "var(--app-border)",
            background: "var(--app-bg-elevated)",
            // The Yumo dark slate theme is also active inside the iframe itself, but
            // keep the background in the theme color while it loads.
          }}
        >
          {!loaded && (
            <div
              className="absolute inset-0 flex items-center justify-center text-[12px] text-app-text-muted"
              style={{ background: "var(--app-bg-elevated)" }}
            >
              Önizleme yükleniyor…
            </div>
          )}
          <iframe
            src="/insights-mockup.html"
            title="Yumo İzler — yeni tasarım önizlemesi"
            onLoad={() => setLoaded(true)}
            style={{
              width: "100%",
              // Wide content: keep the height close to the viewport, it has its own
              // scrollbar. AppShell already provides the outer scroll; the iframe's
              // interior scrolls on its own.
              height: "calc(100vh - 180px)",
              minHeight: "720px",
              border: "0",
              display: "block",
              background: "transparent",
              colorScheme: "dark",
            }}
            // Comes from the same origin — sandboxing isn't required, but still
            // restrict it with a safe default.
            sandbox="allow-same-origin allow-scripts allow-popups"
          />
        </div>

        <p className="text-[12px] text-app-text-muted px-1">
          Bu sayfa dev önizlemesidir. Üretim {`/insights`} rotası şimdilik
          değişmedi. Onay sonrası React'a çevrilecek.
        </p>
      </div>
    </AppShell>
  );
}
