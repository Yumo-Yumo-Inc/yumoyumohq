"use client";

import { Maximize2, Minus, Plus, RotateCcw, X } from "lucide-react";
import { useEffect, useId, useState } from "react";

type MermaidDiagramProps = {
  chart: string;
};

// Mermaid v11 is ESM-only and pulls in dagre + d3 at import time -- heavy.
// Keep init module-scoped so we only configure once per page load.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let mermaidInitPromise: Promise<any> | null = null;

const MIN_ZOOM = 0.9;
const MAX_ZOOM = 3;
const ZOOM_STEP = 0.25;
const MODAL_BASE_WIDTH = 1180;

function clampZoom(value: number) {
  return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, value));
}

function getMermaid() {
  if (!mermaidInitPromise) {
    mermaidInitPromise = import("mermaid").then(({ default: mermaid }) => {
      mermaid.initialize({
        startOnLoad: false,
        securityLevel: "loose",
        theme: "base",
        themeVariables: {
          background: "transparent",
          primaryColor: "#1A1A1A",
          primaryBorderColor: "#C9A84C",
          primaryTextColor: "#F0F0FF",
          lineColor: "#C9A84C",
          secondaryColor: "#252D3D",
          tertiaryColor: "#161B27",
          mainBkg: "#1A1A1A",
          secondBkg: "#252D3D",
          tertiaryBkg: "#161B27",
          textColor: "#F0F0FF",
          nodeBorder: "#C9A84C",
          clusterBkg: "rgba(201,168,76,0.05)",
          clusterBorder: "rgba(201,168,76,0.25)",
          edgeLabelBackground: "#0a0a0a",
          fontFamily: "DM Sans, system-ui, sans-serif",
        },
      });
      return mermaid;
    });
  }
  return mermaidInitPromise;
}

export function MermaidDiagram({ chart }: MermaidDiagramProps) {
  const [svg, setSvg] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [zoom, setZoom] = useState(1.25);

  useEffect(() => {
    if (!expanded) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setExpanded(false);
      if ((e.metaKey || e.ctrlKey) && e.key === "=") {
        e.preventDefault();
        setZoom((current) => clampZoom(current + ZOOM_STEP));
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "-") {
        e.preventDefault();
        setZoom((current) => clampZoom(current - ZOOM_STEP));
      }
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [expanded]);

  // useId in React 19 / Next 16 can emit ":" and other punctuation; mermaid uses
  // the id as a CSS selector AND DOM id, so strip everything non-alphanumeric.
  const rawId = useId();
  const id = `mermaid-${rawId.replace(/[^a-zA-Z0-9_-]/g, "")}`;

  useEffect(() => {
    let cancelled = false;

    async function renderChart() {
      try {
        const mermaid = await getMermaid();
        const rendered = await mermaid.render(id, chart);
        if (!cancelled) {
          setSvg(rendered.svg);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          console.error("[MermaidDiagram] render failed", err);
          setError("Diagram unavailable.");
        }
      }
    }

    renderChart();

    return () => {
      cancelled = true;
    };
  }, [chart, id]);

  if (error) {
    return (
      <div
        className="mt-8 rounded-lg p-4 text-sm"
        style={{
          background: "rgba(252, 211, 77, 0.06)",
          border: "0.5px solid rgba(252, 211, 77, 0.2)",
          color: "#FCD34D",
        }}
      >
        Diagram could not be rendered. The source has been logged for review.
      </div>
    );
  }

  const zoomPercent = Math.round(zoom * 100);

  return (
    <>
      <button
        type="button"
        onClick={() => {
          if (!svg) return;
          setZoom(1.25);
          setExpanded(true);
        }}
        className="group mt-8 block w-full overflow-x-auto rounded-lg border border-white/[0.08] bg-white/[0.03] p-4 text-left shadow-[0_18px_50px_rgba(0,0,0,0.4)] backdrop-blur-sm transition-colors hover:bg-white/[0.05]"
        aria-label="Open diagram full screen"
      >
        {svg ? (
          <>
            <div className="overflow-hidden">
              <div
                className="mx-auto w-full md:min-w-[900px] md:w-auto [&_svg]:!h-auto [&_svg]:!w-full [&_svg]:!max-w-none"
                dangerouslySetInnerHTML={{ __html: svg }}
              />
            </div>
            <div className="mt-3 flex items-center justify-end gap-1.5 text-[10px] uppercase tracking-[0.08em] text-gray-500 group-hover:text-gray-300">
              <span>Open</span>
              <Maximize2 className="h-3 w-3" aria-hidden />
            </div>
          </>
        ) : (
          <div className="flex min-h-48 items-center justify-center text-sm text-gray-400">
            Loading diagram...
          </div>
        )}
      </button>

      {expanded && svg ? (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 p-2 backdrop-blur-sm sm:p-4"
          onClick={() => setExpanded(false)}
        >
          <div
            className="absolute left-3 top-3 z-10 flex items-center gap-1 rounded-lg border border-white/15 bg-black/70 p-1 text-white shadow-2xl backdrop-blur sm:left-4 sm:top-4"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setZoom((current) => clampZoom(current - ZOOM_STEP))}
              disabled={zoom <= MIN_ZOOM}
              className="inline-flex h-9 w-9 items-center justify-center rounded-md text-white transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="Zoom out"
              title="Zoom out"
            >
              <Minus className="h-4 w-4" aria-hidden />
            </button>
            <div className="min-w-12 text-center text-xs tabular-nums text-white/80">
              {zoomPercent}%
            </div>
            <button
              type="button"
              onClick={() => setZoom((current) => clampZoom(current + ZOOM_STEP))}
              disabled={zoom >= MAX_ZOOM}
              className="inline-flex h-9 w-9 items-center justify-center rounded-md text-white transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="Zoom in"
              title="Zoom in"
            >
              <Plus className="h-4 w-4" aria-hidden />
            </button>
            <button
              type="button"
              onClick={() => setZoom(1.25)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-md text-white transition-colors hover:bg-white/10"
              aria-label="Reset zoom"
              title="Reset zoom"
            >
              <RotateCcw className="h-4 w-4" aria-hidden />
            </button>
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setExpanded(false);
            }}
            className="absolute right-3 top-3 z-10 inline-flex h-10 w-10 items-center justify-center rounded-lg border border-white/15 bg-black/70 text-white shadow-2xl transition-colors hover:bg-white/[0.12] sm:right-4 sm:top-4"
            aria-label="Close"
            title="Close"
          >
            <X className="h-5 w-5" aria-hidden />
          </button>

          <div
            onClick={(e) => e.stopPropagation()}
            className="h-[92vh] w-full max-w-[1600px] overflow-auto rounded-lg border border-white/10 bg-[#0a0a0a] p-4 pt-16 sm:p-6 sm:pt-16"
          >
            <div
              style={{
                minWidth: `${Math.round(MODAL_BASE_WIDTH * zoom)}px`,
                width: `${Math.round(100 * zoom)}%`,
              }}
              className="[&_svg]:!h-auto [&_svg]:!w-full [&_svg]:!max-w-none"
              dangerouslySetInnerHTML={{ __html: svg }}
            />
          </div>
        </div>
      ) : null}
    </>
  );
}
