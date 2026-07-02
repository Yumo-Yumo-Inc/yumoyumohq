"use client";

import type { CSSProperties } from "react";
import { ChevronDown, Earth } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAppLocale, type AppLocale } from "@/lib/i18n/app-context";
import { cn } from "@/lib/utils";

/** All app languages — shared across locale pickers */
export const APP_LOCALES: readonly {
  readonly value: AppLocale;
  readonly short: string;
  readonly label: string;
  readonly flag: string;
}[] = [
  { value: "en", short: "EN", label: "English", flag: "🇬🇧" },
  { value: "tr", short: "TR", label: "Türkçe", flag: "🇹🇷" },
  { value: "ru", short: "RU", label: "Русский", flag: "🇷🇺" },
  { value: "th", short: "TH", label: "ไทย", flag: "🇹🇭" },
  { value: "es", short: "ES", label: "Español", flag: "🇪🇸" },
  { value: "zh", short: "ZH", label: "简体中文", flag: "🇨🇳" },
] as const;

type Variant = "topbar" | "dashboard";

interface AppLocaleDropdownProps {
  variant: Variant;
  /** Tier accent (#hex) for the topbar — subtle highlight for the active row */
  accentHex?: string;
}

export function AppLocaleDropdown({ variant, accentHex }: AppLocaleDropdownProps) {
  const { locale, setLocale, t } = useAppLocale();

  const current = APP_LOCALES.find((x) => x.value === locale) ?? APP_LOCALES[0];

  const contentCls =
    variant === "dashboard"
      ? "min-w-[216px] max-h-[min(70vh,420px)] overflow-y-auto border border-white/12 bg-[#11131d] p-1.5 text-white shadow-[0_24px_70px_rgba(0,0,0,0.42)]"
      : "min-w-[200px] max-h-[min(70vh,420px)] overflow-y-auto";

  const itemCls =
    variant === "dashboard"
      ? "cursor-pointer gap-2 rounded-[10px] py-2 text-sm text-white focus:bg-white/12 focus:text-white data-[highlighted]:bg-white/12 data-[highlighted]:text-white"
      : "cursor-pointer gap-2 py-2";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {variant === "topbar" ? (
          <button
            suppressHydrationWarning
            type="button"
            className="flex items-center gap-0.5 rounded-[10px] px-1.5 py-1 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1"
            style={{
              background: "color-mix(in srgb, var(--app-header-nav-icon) 8%, transparent)",
              border: `1px solid var(--app-header-nav-border)`,
              color: accentHex ?? "var(--app-header-nav-icon)",
              ...(accentHex
                ? ({ ["--tw-ring-color" as string]: `${accentHex}66` } as CSSProperties)
                : {}),
            }}
            aria-label={`${t("topbar.language.aria")} (${current.label})`}
            title={current.label}
          >
            <Earth className="h-4 w-4 shrink-0" aria-hidden strokeWidth={1.8} />
            <ChevronDown className="h-3 w-3 shrink-0 opacity-65" aria-hidden />
          </button>
        ) : (
          <button
            suppressHydrationWarning
            type="button"
            className="flex h-8 items-center gap-0.5 rounded-full px-2 text-white/90 transition hover:bg-white/12 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ffb347]"
            aria-label={`${t("topbar.language.aria")} (${current.label})`}
            title={current.label}
          >
            <Earth className="h-[18px] w-[18px] shrink-0 text-white/85" aria-hidden strokeWidth={1.8} />
            <ChevronDown className="h-3.5 w-3.5 shrink-0 opacity-65" aria-hidden />
          </button>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent side="bottom" align="end" sideOffset={6} className={cn(contentCls)}>
        {APP_LOCALES.map((opt) => {
          const active = locale === opt.value;
          return (
            <DropdownMenuItem
              suppressHydrationWarning
              key={opt.value}
              onClick={() => setLocale(opt.value)}
              className={cn(itemCls, active && variant === "topbar" && "bg-accent/40 font-semibold")}
              style={
                active && variant === "topbar" && accentHex
                  ? ({ backgroundColor: `${accentHex}26` } as CSSProperties)
                  : undefined
              }
            >
              <span className="text-base leading-none" aria-hidden>
                {opt.flag}
              </span>
              <span className="flex-1 truncate">{opt.label}</span>
              <span className={cn("shrink-0 text-[10px] font-bold uppercase opacity-75", variant === "dashboard" && "text-white/55")}>
                {opt.short}
              </span>
              {active && <span className="shrink-0 text-xs">✓</span>}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
