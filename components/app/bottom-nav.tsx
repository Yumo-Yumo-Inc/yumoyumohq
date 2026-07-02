"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, ScanLine, TrendingUp, LineChart, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppLocale } from "@/lib/i18n/app-context";
import { type UserFacingText } from "@/lib/product-architecture/dashboard-contract";

type NavItem =
  | { href: string; label: UserFacingText; icon: React.ElementType; scan?: false }
  | { href: string; label: UserFacingText; icon: React.ElementType; scan: true };

const NAV_ITEMS: NavItem[] = [
  { href: "/app/dashboard", label: { tr: "Bugün", en: "Today", ru: "Сегодня", th: "วันนี้", es: "Hoy", zh: "今天" }, icon: Home },
  { href: "/app/analysis", label: { tr: "Analiz", en: "Analysis", ru: "Анализ", th: "วิเคราะห์", es: "Análisis", zh: "分析" }, icon: LineChart },
  { href: "/app/mine", label: { tr: "Tara", en: "Scan", ru: "Скан", th: "สแกน", es: "Escanear", zh: "扫描" }, icon: ScanLine, scan: true },
  { href: "/app/patterns", label: { tr: "Yaşam", en: "Life", ru: "Жизнь", th: "ชีวิต", es: "Vida", zh: "生活" }, icon: TrendingUp },
  {
    href: "/app/insights",
    label: {
      tr: "Cüzdan",
      en: "Wallet",
      ru: "Кошелёк",
      th: "กระเป๋าเงิน",
      es: "Cartera",
      zh: "钱包",
    },
    icon: Wallet,
  },
];

interface BottomNavProps {
  className?: string;
  accountLevel?: number;
}

export function BottomNav({ className }: BottomNavProps) {
  const pathname = usePathname();
  const { locale } = useAppLocale();
  const l = (tr: string, en: string, ru: string, th: string, es: string, zh: string) =>
    locale === "tr" ? tr : locale === "ru" ? ru : locale === "th" ? th : locale === "es" ? es : locale === "zh" ? zh : en;
  return (
    <nav
      aria-label={l("Ana gezinme", "Main navigation", "Главная навигация", "การนำทางหลัก", "Navegación principal", "主导航")}
      className={cn(
        "fixed inset-x-0 bottom-0 z-50 mx-auto max-w-[430px] px-0 pb-0",
        className
      )}
    >
      <div
        className="grid grid-cols-5 items-end gap-0.5 rounded-t-[28px] border-x border-t px-1.5 pb-[max(0.65rem,env(safe-area-inset-bottom))] pt-2 shadow-[0_-18px_54px_rgba(0,0,0,0.42)] backdrop-blur-2xl"
        style={{ background: "var(--app-nav-bg)", borderColor: "var(--app-header-nav-border)" }}
      >
        {NAV_ITEMS.map((item) => {
          const isActive =
            item.href === "/app/dashboard"
              ? pathname === "/app" || pathname === "/app/dashboard"
              : item.href === "/app/insights"
                ? pathname === "/app/insights" || pathname.startsWith("/app/insights/")
                : pathname.startsWith(item.href);
          const Icon = item.icon;

          if (item.scan) {
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className="group flex min-w-0 flex-col items-center gap-1 rounded-[18px] px-1 py-0.5 text-center outline-none focus-visible:ring-2 focus-visible:ring-[#a8c59d]"
              >
                <span
                  className={cn(
                    "grid h-10 w-10 place-items-center rounded-2xl border shadow-[0_10px_24px_rgba(255,122,26,0.30)] transition",
                    isActive
                      ? "border-white/40 bg-[linear-gradient(135deg,#ff7a1a,#ec4899,#3b82f6)] text-white"
                      : "border-white/20 bg-[linear-gradient(135deg,#ff7a1a,#ec4899)] text-white"
                  )}
                >
                  <Icon className="h-5 w-5" strokeWidth={2} />
                </span>
                <span className="text-[7.5px] font-black tracking-tight text-[#ffb347] sm:text-[9px]">
                  {item.label[locale]}
                </span>
              </Link>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              className="flex min-w-0 flex-col items-center gap-1 rounded-[18px] px-0.5 py-1.5 text-center outline-none transition focus-visible:ring-2 focus-visible:ring-[#a8c59d]"
              style={{ background: isActive ? "color-mix(in srgb, var(--app-text-primary) 9%, transparent)" : "transparent" }}
            >
              <Icon
                className="h-5 w-5"
                strokeWidth={isActive ? 2.1 : 1.8}
                style={{ color: isActive ? "var(--app-text-primary)" : "var(--app-text-muted)" }}
              />
              <span
                className="max-w-[52px] text-center text-[7.5px] font-semibold leading-[1.05] sm:text-[9px]"
                style={{ color: isActive ? "var(--app-text-primary)" : "var(--app-text-muted)" }}
              >
                {item.label[locale]}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
