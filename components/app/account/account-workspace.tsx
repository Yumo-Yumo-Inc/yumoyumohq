"use client";

/**
 * AccountWorkspace — the command-center shell. A single tabbed surface with a
 * desktop side menu and a mobile segmented strip. Tabs:
 *   Overview        — gamification identity (badges, titles, achievements)
 *   Season & Quests — season progress + quest board
 *   Account         — the full profile/settings surface (ProfileWorkspace)
 *
 * Tab content transitions in the fast "Akış" motion regime (~200ms), and honors
 * prefers-reduced-motion. The Account tab reuses the existing, working profile
 * component verbatim — zero regression on account management.
 */

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { LayoutGrid, Trophy, UserRound, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppLocale } from "@/lib/i18n/app-context";
import { ProfileWorkspace } from "@/components/app/profile-workspace";
import { OverviewSection } from "./sections/overview-section";
import { SeasonSection } from "./sections/season-section";

type TabKey = "overview" | "season" | "account";

const TABS: Array<{ key: TabKey; icon: LucideIcon; tr: string; en: string }> = [
  { key: "overview", icon: LayoutGrid, tr: "Genel Bakış", en: "Overview" },
  { key: "season", icon: Trophy, tr: "Sezon & Görevler", en: "Season & Quests" },
  { key: "account", icon: UserRound, tr: "Hesap", en: "Account" },
];

/** Map a URL hash (legacy deep links) to an initial tab. */
function tabFromHash(hash: string): TabKey {
  const h = hash.replace("#", "");
  if (h === "profile" || h === "profile-preferences" || h === "settings" || h === "security") return "account";
  if (h === "season" || h === "quests") return "season";
  return "overview";
}

export function AccountWorkspace() {
  const reduce = useReducedMotion();
  const { locale } = useAppLocale();
  const loc = locale as string;
  const [tab, setTab] = useState<TabKey>("overview");

  useEffect(() => {
    if (typeof window !== "undefined" && window.location.hash) {
      setTab(tabFromHash(window.location.hash));
    }
  }, []);

  const label = (t: (typeof TABS)[number]) => (loc === "tr" ? t.tr : t.en);

  return (
    <div className="lg:flex lg:items-start lg:gap-6">
      {/* Desktop side menu */}
      <nav className="hidden shrink-0 lg:block lg:w-52">
        <div className="sticky top-6 flex flex-col gap-1">
          {TABS.map((t) => {
            const active = t.key === tab;
            const Icon = t.icon;
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => setTab(t.key)}
                className="group relative flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-left text-[14px] font-semibold transition-colors"
                style={{
                  background: active ? "var(--app-bg-elevated)" : "transparent",
                  color: active ? "var(--app-text-primary)" : "var(--app-text-secondary)",
                  border: `1px solid ${active ? "var(--app-border)" : "transparent"}`,
                }}
              >
                {active && (
                  <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-full" style={{ background: "var(--app-gold)" }} />
                )}
                <Icon className="h-[18px] w-[18px]" style={{ color: active ? "var(--app-gold)" : "var(--app-text-muted)" }} />
                {label(t)}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Mobile segmented strip */}
      <div
        className="mb-4 flex gap-1 rounded-2xl p-1 lg:hidden"
        style={{ background: "var(--app-bg-elevated)", border: "1px solid var(--app-border)" }}
      >
        {TABS.map((t) => {
          const active = t.key === tab;
          const Icon = t.icon;
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={cn(
                "relative flex flex-1 items-center justify-center gap-1.5 rounded-xl px-2 py-2 text-[12px] font-bold transition-transform active:scale-[0.97]",
              )}
              style={{
                background: active ? "var(--app-bg-base)" : "transparent",
                color: active ? "var(--app-text-primary)" : "var(--app-text-muted)",
                boxShadow: active ? "var(--app-shadow-card)" : "none",
              }}
            >
              <Icon className="h-4 w-4" style={{ color: active ? "var(--app-gold)" : "var(--app-text-muted)" }} />
              <span className="truncate">{label(t)}</span>
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={tab}
            initial={reduce ? false : { opacity: 0, y: 8 }}
            animate={reduce ? {} : { opacity: 1, y: 0 }}
            exit={reduce ? {} : { opacity: 0, y: -6 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
          >
            {tab === "overview" && <OverviewSection />}
            {tab === "season" && <SeasonSection />}
            {tab === "account" && <ProfileWorkspace variant="page" />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
