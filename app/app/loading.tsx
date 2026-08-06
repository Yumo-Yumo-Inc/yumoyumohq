/**
 * Route-level fallback for /app/* navigations. Server component on purpose:
 * it ships no JS and paints immediately while the target page's bundle loads.
 * Motion is pure CSS and collapses to a static glyph under reduced motion.
 */
export default function AppSegmentLoading() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="flex flex-col items-center gap-4" role="status" aria-label="Loading">
        <span className="relative flex h-12 w-12 items-center justify-center">
          <span
            aria-hidden
            className="absolute inset-0 rounded-full border-2 border-white/10 border-t-[hsl(var(--primary))] motion-safe:animate-spin"
          />
          <span
            aria-hidden
            className="h-5 w-5 rounded-full motion-safe:animate-pulse"
            style={{
              background:
                "radial-gradient(circle at 35% 35%, hsl(var(--primary)), transparent 70%)",
            }}
          />
        </span>
      </div>
    </div>
  );
}
