"use client";

import { usePathname, useSearchParams } from "next/navigation";
import Link from "next/link";
import { getTier } from "@/lib/theme/tiers";
import { cn } from "@/lib/utils";

/** One button per milestone (tier min level). Used by AppShell via ?level=. */
const MILESTONE_LEVELS = [1, 10, 20, 30, 40, 50, 60, 70, 90, 100];

export function AdminMilestoneBar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentLevel = Math.max(1, Math.min(999, parseInt(searchParams.get("level") ?? "1", 10) || 1));

  return (
    <div className="sticky top-0 z-50 border-b border-white/10 bg-black/80 backdrop-blur-sm">
      <div className="flex items-center gap-1 overflow-x-auto px-3 py-2 max-w-[430px] mx-auto">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-white/50 shrink-0 mr-1">
          Tema:
        </span>
        {MILESTONE_LEVELS.map((level) => {
          const tier = getTier(level, "dark");
          const isActive = currentLevel >= tier.min && currentLevel <= tier.max;
          const href = `${pathname}?${new URLSearchParams({ ...Object.fromEntries(searchParams.entries()), level: String(level) }).toString()}`;
          return (
            <Link
              key={level}
              href={href}
              className={cn(
                "shrink-0 rounded-md px-2 py-1 text-[11px] font-medium transition-all",
                "border",
                isActive ? "ring-1 ring-white/30" : "opacity-80 hover:opacity-100"
              )}
              style={{
                background: isActive ? tier.cardBg : "rgba(255,255,255,.06)",
                borderColor: isActive ? tier.accent : "rgba(255,255,255,.12)",
                color: isActive ? tier.accent : "rgba(255,255,255,.7)",
              }}
              title={`${tier.name} (${tier.range})`}
            >
              {level}
            </Link>
          );
        })}
        <span className="shrink-0 text-[10px] text-white/40 ml-1" title="Seçili tema">
          {getTier(currentLevel, "dark").name}
        </span>
      </div>
    </div>
  );
}
