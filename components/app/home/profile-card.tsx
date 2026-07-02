"use client";

import { useState } from "react";
import Link from "next/link";
import { AvatarImage } from "@/components/app/avatar-image";
import { ThemeCard } from "@/components/app/theme-card";
import { IdentityCardModal } from "@/components/app/home/identity-card-modal";
import { useAppLocale } from "@/lib/i18n/app-context";
import { useTier } from "@/lib/theme/theme-context";
import { useAppProfile } from "@/lib/app/profile-context";

interface ProfileCardProps {
  username?: string;
  displayName?: string;
  accountLevel?: number;
  accountXp?: number;
  accountXpNext?: number;
  accountXpPrev?: number;
  streak?: number;
  contributionTotal?: number;
  contributionFromReceipts?: number;
  contributionFromQuests?: number;
  totalReceipts?: number;
  totalHiddenCost?: number;
  leaderboardRank?: number;
  title?: string;
  joinDate?: string;
  className?: string;
}

/** Generates up to 2 character initials from the display name. */
function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function ProfileCard({
  username = "",
  displayName,
  accountLevel = 1,
  accountXp = 0,
  accountXpNext = 20000,
  accountXpPrev = 0,
  streak,
  contributionTotal = 0,
  contributionFromReceipts = 0,
  contributionFromQuests = 0,
  totalReceipts,
  totalHiddenCost,
  leaderboardRank,
  title,
  joinDate,
  className,
}: ProfileCardProps) {
  const { profile: ctxProfile } = useAppProfile();
  const { locale } = useAppLocale();
  const [idCardOpen, setIdCardOpen] = useState(false);
  const byLocale = (tr: string, en: string, ru: string, th: string, es: string, zh: string) => {
    if (locale === "tr") return tr;
    if (locale === "ru") return ru;
    if (locale === "th") return th;
    if (locale === "es") return es;
    if (locale === "zh") return zh;
    return en;
  };
  const tier = useTier(accountLevel);
  const acc = tier.accent;
  const name = displayName || username || byLocale("Kullanıcı", "User", "Пользователь", "ผู้ใช้", "Usuario", "用户");
  const initials = getInitials(name);
  const avatarUrl = ctxProfile?.avatarUrl ?? null;

  const pointsTotalFromCtx = ctxProfile?.contributionPoints?.total ?? contributionTotal;
  const receiptPointsFromCtx = ctxProfile?.contributionPoints?.fromReceipts ?? contributionFromReceipts;
  const questPointsFromCtx = ctxProfile?.contributionPoints?.fromQuests ?? contributionFromQuests;

  const xpInLevel = Math.max(0, accountXp - accountXpPrev);
  const xpRange = Math.max(1, accountXpNext - accountXpPrev);
  const xpPct = Math.min(100, Math.max(0, (xpInLevel / xpRange) * 100));
  const xpRemaining = Math.max(0, xpRange - xpInLevel);

  return (
    <>
      <ThemeCard accountLevel={accountLevel} className={className}>
        <div className="p-4 sm:p-5">
          {/* Top row: text left, avatar right */}
          <div className="flex items-start justify-between gap-3 mb-4">
            {/* Left: greeting + name + tier */}
            <button
              type="button"
              onClick={() => setIdCardOpen(true)}
              className="flex flex-col items-start text-left min-w-0 focus:outline-none"
                aria-label={byLocale("Kimlik kartını aç", "Open identity card", "Открыть карту профиля", "เปิดบัตรตัวตน", "Abrir tarjeta de identidad", "打开身份卡")}
            >
              <p
                className="text-[10px] font-semibold uppercase tracking-[0.18em] mb-1"
                style={{ color: "var(--app-text-muted)" }}
              >
                {byLocale("Hoş Geldin", "Welcome", "Добро пожаловать", "ยินดีต้อนรับ", "Bienvenido", "欢迎")}
              </p>
              <p
                className="text-[26px] font-bold leading-tight tracking-[-0.01em]"
                style={{ color: "var(--app-text-primary)" }}
              >
                {name}
              </p>
              {/* Badge row */}
              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                <span
                  className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide"
                  style={{
                    background: "var(--app-gold-glow, rgba(201,168,76,0.15))",
                    border: "1px solid var(--app-gold-border, rgba(201,168,76,0.18))",
                    color: "var(--app-gold, #C9A84C)",
                  }}
                >
                  Early Data Contributors
                </span>
                <span
                  className="text-[11px] font-medium"
                  style={{ color: "var(--app-text-muted)" }}
                >
                  {tier.name} · {byLocale("Seviye", "Level", "Уровень", "ระดับ", "Nivel", "等级")} {accountLevel}
                  {streak != null && streak > 0 && (
                    <span style={{ color: "var(--app-text-secondary)" }}> · {byLocale(`${streak} gün`, `${streak} days`, `${streak} дн.`, `${streak} วัน`, `${streak} días`, `${streak} 天`)}</span>
                  )}
                </span>
              </div>
            </button>

            {/* Right: initials avatar */}
            <button
              type="button"
              onClick={() => setIdCardOpen(true)}
              className="flex-shrink-0 focus:outline-none"
              aria-label={byLocale("Kimlik kartını aç", "Open identity card", "Открыть карту профиля", "เปิดบัตรตัวตน", "Abrir tarjeta de identidad", "打开身份卡")}
            >
              <div
                className="flex items-center justify-center overflow-hidden rounded-[14px] font-bold select-none"
                style={{
                  width: 56,
                  height: 56,
                  fontSize: 20,
                  fontWeight: 800,
                  background: `linear-gradient(135deg, ${tier.avatarBg.split(",")[0]}, ${tier.avatarBg.split(",")[1] ?? tier.avatarBg.split(",")[0]})`,
                  border: `2px solid ${acc}55`,
                  boxShadow: `0 0 20px rgba(201,168,76,0.15)`,
                  color: acc,
                  letterSpacing: "0.02em",
                }}
              >
                {avatarUrl ? (
                  <AvatarImage src={avatarUrl} className="h-full w-full object-cover" />
                ) : (
                  initials
                )}
              </div>
            </button>
          </div>

          {/* XP section */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span
                className="text-[10px] font-semibold uppercase tracking-[0.14em]"
                style={{ color: "var(--app-text-muted)" }}
              >
                {byLocale("Yumo ile ilerleme", "Growing with Yumo", "Прогресс с Yumo", "เติบโตไปกับ Yumo", "Creciendo con Yumo", "与 Yumo 一起成长")}
              </span>
              <span
                className="font-mono text-[11px] font-bold tabular-nums"
                style={{ color: acc }}
              >
                {xpInLevel} / {xpRange}
              </span>
            </div>
            <div
              className="h-1 w-full overflow-hidden rounded-full"
              style={{ background: `${acc}15` }}
            >
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{ width: `${xpPct}%`, background: acc, opacity: 0.65 }}
              />
            </div>
          </div>
        </div>
      </ThemeCard>

      <IdentityCardModal
        open={idCardOpen}
        onClose={() => setIdCardOpen(false)}
        displayName={displayName}
        username={username}
        accountLevel={accountLevel}
        accountXp={accountXp}
        accountXpNext={accountXpNext}
        accountXpPrev={accountXpPrev}
        streak={streak ?? 0}
        contributionTotal={pointsTotalFromCtx}
        contributionFromReceipts={receiptPointsFromCtx}
        contributionFromQuests={questPointsFromCtx}
        totalReceipts={totalReceipts}
        totalHiddenCost={totalHiddenCost}
        leaderboardRank={leaderboardRank}
        title={title}
        joinDate={joinDate}
      />
    </>
  );
}
