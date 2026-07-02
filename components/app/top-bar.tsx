"use client";

import { Flame } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTier } from "@/lib/theme/theme-context";

interface TopBarProps {
  accountLevel?: number;
  streak?: number;
  displayName?: string;
  avatarUrl?: string;
  className?: string;
}

export function TopBar({
  accountLevel = 1,
  streak = 0,
  displayName,
  avatarUrl,
  className,
}: TopBarProps) {
  const tier = useTier(accountLevel);

  return (
    <header
      className={cn(
        "sticky top-0 z-30 flex items-center justify-between px-4 py-2 border-b border-border/50",
        className
      )}
      style={{ background: "hsl(0 0% 7%)" }}
    >
      <div className="flex items-center gap-2">
        <div
          className="h-8 w-8 rounded-lg flex items-center justify-center text-sm font-bold"
          style={{ background: tier.cardBg, color: tier.accent, border: `1px solid ${tier.accent}40` }}
        >
          {accountLevel}
        </div>
        <span className="font-semibold text-sm truncate max-w-[120px]">
          {displayName ?? "YUMO"}
        </span>
      </div>

      <div className="flex items-center gap-3">
        {streak > 0 && (
          <div
            className="flex items-center gap-1 px-2 py-1 rounded-md text-sm font-medium"
            style={{ background: tier.cardBg, color: tier.accent }}
          >
            <Flame className="h-4 w-4" />
            <span>{streak}</span>
          </div>
        )}
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt=""
            className="h-8 w-8 rounded-full object-cover border-2"
            style={{ borderColor: tier.accent }}
          />
        ) : (
          <div
            className="h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold"
            style={{ background: tier.cardBg, color: tier.accent }}
          >
            {(displayName ?? "Y")[0].toUpperCase()}
          </div>
        )}
      </div>
    </header>
  );
}
