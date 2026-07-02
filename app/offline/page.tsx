import Link from "next/link";

export default function OfflinePage() {
  return (
    <main className="min-h-screen bg-[var(--app-bg-shell)] text-[var(--app-text-primary)] px-6 py-10 flex items-center justify-center">
      <div className="w-full max-w-md rounded-[28px] border border-[var(--app-border)] bg-[var(--app-bg-elevated)] p-6 shadow-[var(--app-shadow-card)]">
        <div className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-2xl border border-[var(--app-border)] bg-[var(--app-bg-surface)]">
          <span className="text-2xl">Y</span>
        </div>

        <h1 className="text-2xl font-semibold tracking-tight">You&apos;re offline</h1>
        <p className="mt-3 text-sm leading-6 text-[var(--app-text-secondary)]">
          Yumo Yumo is installed and ready, but this screen needs a connection right now. As soon as you are back
          online, you can continue where you left off.
        </p>

        <div className="mt-6 flex flex-col gap-3">
          <Link
            href="/app"
            className="inline-flex min-h-11 items-center justify-center rounded-xl bg-[var(--app-primary)] px-4 text-sm font-semibold text-black transition-opacity hover:opacity-90"
          >
            Retry App
          </Link>
          <Link
            href="/app/receipts"
            className="inline-flex min-h-11 items-center justify-center rounded-xl border border-[var(--app-border)] bg-[var(--app-bg-surface)] px-4 text-sm font-medium text-[var(--app-text-primary)] transition-colors hover:bg-white/5"
          >
            Open Receipts
          </Link>
        </div>

        <p className="mt-5 text-xs text-[var(--app-text-muted)]">
          Tip: once pages are visited, the app can reopen them faster on the next launch.
        </p>
      </div>
    </main>
  );
}
