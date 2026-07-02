"use client";

import Link from "next/link";
import { useAppLocale } from "@/lib/i18n/app-context";
import { useTier } from "@/lib/theme/theme-context";
import { cn } from "@/lib/utils";

interface DashboardIdentityProps {
  displayName?: string;
  accountLevel?: number;
  streak?: number;
  className?: string;
}

export function DashboardIdentity({
  displayName,
  accountLevel = 1,
  streak = 0,
  className,
}: DashboardIdentityProps) {
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
        "flex items-center justify-between gap-3 pb-4",
        className
      )}
    >
      <div className="flex items-center gap-3 min-w-0">
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-bold border"
          style={{
            background: `linear-gradient(135deg, ${bg1}, ${bg2})`,
            borderColor: `${tier.accent}40`,
            color: tier.accent,
          }}
        >
          {accountLevel}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold truncate" style={{ color: "var(--app-text-primary)" }}>{name}</p>
          <p className="text-xs font-medium flex items-center gap-1.5 mt-0.5" style={{ color: tier.accent }}>
            <span>{tier.name}</span>
            {streak > 0 && (
              <>
                <span style={{ color: "var(--app-text-muted)" }}>·</span>
                <span>{byLocale(`${streak} gün streak`, `${streak} day streak`, `${streak} дн. серия`, `สตรีค ${streak} วัน`, `racha de ${streak} días`, `${streak} 天连续记录`)}</span>
              </>
            )}
          </p>
        </div>
      </div>
      <Link
        href="/app/profile"
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border-2 transition-opacity hover:opacity-90"
        style={{
          borderColor: tier.accent,
          background: `linear-gradient(135deg, ${bg1}, ${bg2})`,
          color: tier.accent,
        }}
        aria-label={byLocale("Profil", "Profile", "Профиль", "โปรไฟล์", "Perfil", "个人资料")}
      >
        <span className="text-sm font-bold">{initials}</span>
      </Link>
    </div>
  );
}
