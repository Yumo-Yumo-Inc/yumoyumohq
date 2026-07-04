"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ADMIN_TABS = [
  { label: "Overview", href: "/app/admin", match: ["/app/admin"] },
  { label: "Users", href: "/app/admin/users", match: ["/app/admin/users"] },
  {
    label: "Receipts",
    href: "/app/admin/receipts",
    match: ["/app/admin/receipts", "/app/admin/approvals", "/app/admin/rejected"],
  },
  { label: "Merchants", href: "/app/admin/merchants", match: ["/app/admin/merchants"] },
  {
    label: "Data & OCR",
    href: "/app/admin/receipt-line-items",
    match: ["/app/admin/receipt-line-items", "/app/admin/scraped-products"],
  },
  { label: "Feedback", href: "/app/admin/feedback", match: ["/app/admin/feedback"] },
  { label: "Rewards", href: "/app/admin/reward-epochs", match: ["/app/admin/reward-epochs"] },
  { label: "Airdrop", href: "/app/admin/airdrop-campaigns", match: ["/app/admin/airdrop-campaigns"] },
  {
    label: "Diğer",
    href: "/app/admin/other",
    match: [
      "/app/admin/other",
      "/app/admin/bulk-upload",
      "/app/admin/blob-download",
      "/app/admin/log-download",
      "/app/admin/ocr-download",
      "/app/admin/analyze-file",
      "/app/admin/economic-indices",
      "/app/admin/hidden-cost-data",
    ],
  },
  { label: "Tools", href: "/app/admin/quest-test", match: ["/app/admin/quest-test"] },
] as const;

function isActive(pathname: string, matches: readonly string[]) {
  return matches.some((match) => pathname === match || pathname.startsWith(`${match}/`));
}

export function AdminTopNav() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-30 border-b border-[var(--app-border)] bg-[var(--app-nav-bg)] backdrop-blur">
      <div className="flex min-h-16 flex-col gap-3 px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link href="/app/admin" className="group">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/35">
              Yumo Yumo
            </p>
            <p className="text-lg font-semibold text-white transition-colors group-hover:text-white/80">
              Admin Panel
            </p>
          </Link>
          <Link
            href="/app/dashboard"
            className="rounded-md border border-white/10 px-3 py-2 text-xs font-medium text-white/55 transition-colors hover:border-white/25 hover:text-white"
          >
            App dashboard
          </Link>
        </div>
        <nav className="-mx-1 flex gap-1 overflow-x-auto pb-1" aria-label="Admin sections">
          {ADMIN_TABS.map((tab) => {
            const active = isActive(pathname, tab.match);
            return (
              <Link
                key={tab.href}
                href={tab.href}
                aria-current={active ? "page" : undefined}
                className={[
                  "shrink-0 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-white text-[#0a0c10]"
                    : "text-white/55 hover:bg-white/[0.08] hover:text-white",
                ].join(" ")}
              >
                {tab.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
