"use client";

import Link from "next/link";
import { useAppLocale } from "@/lib/i18n/app-context";
import { useTier } from "@/lib/theme/theme-context";
import { cn } from "@/lib/utils";

interface DashboardGreetingProps {
  displayName?: string;
  /** Optional subtitle e.g. "3 day streak · 142 cPoints" */
  subtitle?: string;
  accountLevel?: number;
  className?: string;
}

export function DashboardGreeting({
  displayName,
  subtitle,
  accountLevel = 1,
  className,
}: DashboardGreetingProps) {
  const { locale } = useAppLocale();
  const byLocale = (tr: string, en: string, ru: string, th: string, es: string, zh: string) => {
    if (locale === "tr") return tr;
    if (locale === "ru") return ru;
    if (locale === "th") return th;
    if (locale === "es") return es;
    if (locale === "zh") return zh;
    return en;
  };
  const tier = useTier(accountLevel);
  const name = displayName?.trim() || byLocale("Kullanıcı", "User", "Пользователь", "ผู้ใช้", "Usuario", "用户");
  const initials = name.slice(0, 2).toUpperCase();
  const [bg1, bg2] = tier.avatarBg.split(",");

  return (
    <div
      className={cn(
        "flex items-center justify-between gap-4 pb-4",
        className
      )}
    >
      <div className="min-w-0 flex-1">
        <h1 className="text-[22px] font-bold leading-tight text-foreground">
          {byLocale("Merhaba", "Hello", "Привет", "สวัสดี", "Hola", "你好")}, <span style={{ color: tier.accent }}>{name}</span> 👋
        </h1>
        {subtitle != null && subtitle !== "" && (
          <p className="mt-0.5 text-[13px] text-muted-foreground">
            {subtitle}
          </p>
        )}
      </div>
      <Link
        href="/app/account"
        className="flex-shrink-0 rounded-full border-2 p-0.5 transition-opacity hover:opacity-90"
        style={{
          borderColor: tier.accent,
          background: `linear-gradient(135deg, ${bg1}, ${bg2})`,
        }}
        aria-label={byLocale("Profil ve ayarlar", "Profile and settings", "Профиль и настройки", "โปรไฟล์และการตั้งค่า", "Perfil y ajustes", "个人资料和设置")}
      >
        <span
          className="flex h-11 w-11 items-center justify-center rounded-full text-base font-bold"
          style={{ color: tier.accent }}
        >
          {initials}
        </span>
      </Link>
    </div>
  );
}
