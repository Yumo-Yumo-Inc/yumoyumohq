"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Home, ScanLine, TrendingUp, Wallet, Settings } from "lucide-react";
import { AvatarImage } from "@/components/app/avatar-image";
import yumoYellowLogo from "@/assets/yumo-yellow-mark-transparent.png";
import { useAppProfile } from "@/lib/app/profile-context";
import { useAppLocale } from "@/lib/i18n/app-context";
import { ACCOUNT_LEVEL_XP_THRESHOLDS } from "@/config/account-level-config";
import { pickText, type UserFacingText, type YumoLocale } from "@/lib/product-architecture/dashboard-contract";
import { cn } from "@/lib/utils";

const ARCHETYPES: UserFacingText[] = [
  { tr: "Düzen Ustası", en: "The Organizer", ru: "Организатор", th: "นักจัดระเบียบ", es: "El Organizador", zh: "整理大师" },
  { tr: "Planlayıcı", en: "The Planner", ru: "Планировщик", th: "นักวางแผน", es: "El Planificador", zh: "规划者" },
  { tr: "Kaşif", en: "The Explorer", ru: "Исследователь", th: "นักสำรวจ", es: "El Explorador", zh: "探索者" },
  { tr: "Kurucu", en: "The Builder", ru: "Создатель", th: "นักสร้าง", es: "El Constructor", zh: "建造者" },
  { tr: "Koruyucu", en: "The Protector", ru: "Защитник", th: "ผู้พิทักษ์", es: "El Protector", zh: "守护者" },
];

const NAV_ITEMS: readonly { href: string; label: UserFacingText; icon: React.ElementType }[] = [
  { href: "/app/dashboard", label: { tr: "Bugün", en: "Today", ru: "Сегодня", th: "วันนี้", es: "Hoy", zh: "今天" }, icon: Home },
  { href: "/app/mine", label: { tr: "Tara", en: "Scan", ru: "Скан", th: "สแกน", es: "Escanear", zh: "扫描" }, icon: ScanLine },
  { href: "/app/patterns", label: { tr: "Yaşam", en: "Life", ru: "Жизнь", th: "ชีวิต", es: "Vida", zh: "生活" }, icon: TrendingUp },
  { href: "/app/insights", label: { tr: "Cüzdan", en: "Wallet", ru: "Кошелёк", th: "กระเป๋าเงิน", es: "Cartera", zh: "钱包" }, icon: Wallet },
];

export function DesktopSidebar() {
  const pathname = usePathname();
  const { profile } = useAppProfile();
  const { locale } = useAppLocale();
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  // Stable fallbacks for SSR and the first client paint (prevents hydration mismatch).
  const safeLocale = mounted ? locale : "en";
  const safeProfile = mounted ? profile : null;

  const l = (tr: string, en: string, ru: string, th: string, es: string, zh: string) =>
    safeLocale === "tr" ? tr : safeLocale === "ru" ? ru : safeLocale === "th" ? th : safeLocale === "es" ? es : safeLocale === "zh" ? zh : en;
  const accountLevel = safeProfile?.accountLevel ?? 1;
  const accountXp = safeProfile?.accountXp ?? 0;
  const profileName = safeProfile?.displayName || safeProfile?.username || (mounted ? l("Kullanıcı", "User", "Пользователь", "ผู้ใช้", "Usuario", "用户") : "User");
  const initials = mounted ? profileName.slice(0, 2).toUpperCase() : "";
  const avatarUrl = safeProfile?.avatarUrl ?? null;
  const archetype = pickText(ARCHETYPES[(accountLevel - 1) % ARCHETYPES.length], safeLocale as YumoLocale);
  const cPoints = safeProfile?.contributionPoints?.total ?? 0;
  const seasonXp = safeProfile?.seasonXp ?? 0;
  const honor = Math.max(0, Math.min(100, safeProfile?.honor ?? 50));

  // XP progress bar
  const nextThreshold = ACCOUNT_LEVEL_XP_THRESHOLDS[accountLevel] ?? ACCOUNT_LEVEL_XP_THRESHOLDS[ACCOUNT_LEVEL_XP_THRESHOLDS.length - 1];
  const prevThreshold = ACCOUNT_LEVEL_XP_THRESHOLDS[accountLevel - 1] ?? 0;
  const xpSpan = Math.max(1, nextThreshold - prevThreshold);
  const xpProgress = Math.max(4, Math.min(96, Math.round(((accountXp - prevThreshold) / xpSpan) * 100)));

  // Health Score color: >40 green, 30-40 orange, 20-30 red, <20 purple
  const honorBarColor =
    honor > 40 ? "from-[#22c55e] to-[#86efac]"
    : honor > 30 ? "from-[#d97706] to-[#fbbf24]"
    : honor > 20 ? "from-[#ef4444] to-[#f87171]"
    : "from-[#7c3aed] to-[#a78bfa]";
  const honorBarWidth = Math.max(2, Math.round((honor / 100) * 100));

  const isActive = (href: string) => {
    if (href === "/app/dashboard") {
      return pathname === "/app" || pathname === "/app/dashboard";
    }
    return pathname.startsWith(href);
  };

  return (
    <aside className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-30 lg:flex lg:w-64 lg:flex-col lg:border-r lg:border-[var(--app-border)] lg:bg-[var(--app-bg-dashboard)]">
      {/* Logo */}
      <div className="border-b border-white/10 p-5">
        <Link href="/app/dashboard" className="flex items-center gap-3" aria-label="Yumo Yumo dashboard">
          <Image src={yumoYellowLogo} alt="Yumo Yumo" className="h-11 w-auto shrink-0 object-contain" priority />
          <span className="min-w-0">
            <span className="block text-2xl font-black tracking-[-0.04em] text-white">Yumo Yumo</span>
          </span>
        </Link>
      </div>

      {/* Profile card with XP bar + tokens */}
      <div className="p-4">
        <Link
          href="/app/account"
          className="block rounded-[26px] border border-white/10 bg-white/[0.06] p-4 shadow-[0_18px_44px_rgba(0,0,0,0.25)] transition hover:bg-white/[0.08]"
        >
          <div className="flex items-center gap-3">
            <div className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-full bg-[linear-gradient(135deg,#ff7a1a,#ec4899,#3b82f6)] text-sm font-black text-white">
              {avatarUrl ? <AvatarImage src={avatarUrl} className="h-full w-full object-cover" /> : initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-black text-white">{profileName}</p>
              <div className="flex items-center gap-1.5">
                <p className="text-[10px] font-bold text-[#ffb347]">{archetype}</p>
                <span className="text-[9px] font-black text-[#fcd34d]">Lv.{accountLevel}</span>
              </div>
            </div>
          </div>

          {/* XP progress bar */}
          <div className="mt-3">
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-bold uppercase tracking-[0.15em] text-white/38">XP</span>
              <span className="text-[9px] font-bold text-white/38">{accountXp} / {nextThreshold}</span>
            </div>
            <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#ff7a1a] to-[#ffb347] transition-[width] duration-500"
                style={{ width: `${xpProgress}%` }}
              />
            </div>
          </div>

          {/* Tokens row */}
          <div className="mt-3 grid grid-cols-2 gap-2">
            <div className="rounded-[14px] bg-white/[0.05] px-2.5 py-1.5">
              <p className="text-[8px] font-bold uppercase tracking-[0.14em] text-white/36">cPoints</p>
              <p className="mt-0.5 text-[11px] font-black text-[#fcd34d]">
                ◈ {cPoints >= 1000 ? `${(cPoints / 1000).toFixed(1)}K` : cPoints}
              </p>
            </div>
            <div className="rounded-[14px] bg-white/[0.05] px-2.5 py-1.5">
              <p className="text-[8px] font-bold uppercase tracking-[0.14em] text-white/36">Season XP</p>
              <p className="mt-0.5 text-[11px] font-black text-[#c4b5fd]">
                ◇ {seasonXp >= 1000 ? `${(seasonXp / 1000).toFixed(1)}K` : seasonXp}
              </p>
            </div>
          </div>

          {/* Health Score */}
          <div className="mt-3">
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-bold uppercase tracking-[0.15em] text-white/38">
                {l("Sağlık Skoru", "Health Score", "Индекс здоровья", "คะแนนสุขภาพ", "Índice de salud", "健康指数")}
              </span>
              <span className="text-[9px] font-bold text-white/38">{honor}/100</span>
            </div>
            <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
              <div
                className={`h-full rounded-full bg-gradient-to-r ${honorBarColor} transition-[width] duration-500`}
                style={{ width: `${honorBarWidth}%` }}
              />
            </div>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-2" aria-label={l("Masaüstü gezinme", "Desktop navigation", "Навигация рабочего стола", "การนำทางเดสก์ท็อป", "Navegación de escritorio", "桌面导航")}>
        {NAV_ITEMS.map((item) => {
          const active = isActive(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex items-center gap-3 rounded-[18px] px-3 py-3 text-sm font-black transition",
                active
                  ? "bg-[linear-gradient(135deg,#ff7a1a,#ec4899)] text-white shadow-[0_16px_34px_rgba(255,122,26,0.22)]"
                  : "text-white/58 hover:bg-white/[0.07] hover:text-white"
              )}
            >
              <Icon className="h-5 w-5" strokeWidth={active ? 2.2 : 1.9} />
              <span>{pickText(item.label, safeLocale as YumoLocale)}</span>
            </Link>
          );
        })}
      </nav>

      {/* Quick link: profile preferences (locale, sound, cookies) */}
      <div className="border-t border-white/10 p-3">
        <Link
          href="/app/account#profile-preferences"
          className="flex items-center gap-3 rounded-[18px] px-3 py-2.5 text-xs font-bold text-white/42 transition hover:bg-white/[0.06] hover:text-white/70"
        >
          <Settings className="h-4 w-4" strokeWidth={1.8} />
          <span>{l("Tercihler", "Preferences", "Настройки", "การตั้งค่า", "Preferencias", "偏好设置")}</span>
        </Link>
      </div>
    </aside>
  );
}
