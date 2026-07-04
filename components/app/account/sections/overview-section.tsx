"use client";

/**
 * Overview — the gamification identity face of the command center: who you are
 * (avatar, name, active title, level), your quick stats, the title selector, and
 * the achievement vitrin. Reads live profile + badges; renders empty states when
 * nothing is earned yet (no fabricated counts).
 */

import { motion, useReducedMotion, type Variants } from "framer-motion";
import { Coins, Flame, Heart } from "lucide-react";
import { AvatarImage } from "@/components/app/avatar-image";
import { AchievementShowcase } from "@/components/achievements/achievement-showcase";
import { pickLabel, SEASON_TITLE_LABELS } from "@/config/season-content";
import { useAppLocale } from "@/lib/i18n/app-context";
import { useAppProfile } from "@/lib/app/profile-context";
import { useBadges } from "@/components/app/account/hooks";

const container: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05, delayChildren: 0.02 } },
};
const item: Variants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 320, damping: 30 } },
};

function surfaceStyle(): React.CSSProperties {
  return {
    background: "linear-gradient(160deg, var(--app-bg-elevated), var(--app-bg-surface))",
    border: "1px solid var(--app-border)",
    borderRadius: 16,
    boxShadow: "var(--app-shadow-card)",
  };
}

export function OverviewSection() {
  const reduce = useReducedMotion();
  const { locale } = useAppLocale();
  const loc = locale as string;
  const { profile } = useAppProfile();
  const badges = useBadges();
  const tr = (t: string, e: string) => (loc === "tr" ? t : e);

  const name = profile?.displayName || profile?.username || "User";
  const initials = name.slice(0, 2).toUpperCase();
  const level = profile?.accountLevel ?? 1;
  const cPoints = Math.round(profile?.contributionPoints?.total ?? 0);
  const streak = profile?.streak ?? 0;
  const health = Math.max(0, Math.min(100, Number(profile?.honor ?? 50) || 0));
  const numFmt = loc === "tr" ? "tr-TR" : "en-US";

  const activeTitle = badges.data?.titles.active ?? null;
  const earnedTitles = badges.data?.titles.earned ?? [];

  const stats = [
    { icon: Coins, label: "cPoints", value: cPoints.toLocaleString(numFmt), accent: "var(--app-gold)" },
    { icon: Flame, label: tr("Seri", "Streak"), value: `${streak}`, accent: "#F2803D" },
    { icon: Heart, label: tr("Sağlık", "Health"), value: `${health}`, accent: "var(--app-primary)" },
  ];

  return (
    <motion.div
      variants={reduce ? undefined : container}
      initial={reduce ? undefined : "hidden"}
      animate={reduce ? undefined : "show"}
      className="space-y-4"
    >
      {/* Identity hero */}
      <motion.div variants={reduce ? undefined : item} className="relative overflow-hidden p-5" style={surfaceStyle()}>
        <div className="absolute inset-x-0 top-0 h-px" style={{ background: "var(--app-gold-border)" }} />
        <div className="flex items-center gap-4">
          <div
            className="relative h-[68px] w-[68px] shrink-0 overflow-hidden rounded-full p-[2px]"
            style={{ background: "linear-gradient(135deg, var(--app-gold), var(--app-primary))" }}
          >
            <div className="h-full w-full overflow-hidden rounded-full" style={{ background: "var(--app-bg-base)" }}>
              {profile?.avatarUrl ? (
                <AvatarImage src={profile.avatarUrl} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-lg font-bold" style={{ color: "var(--app-text-primary)" }}>
                  {initials}
                </div>
              )}
            </div>
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-xl font-bold tracking-tight" style={{ color: "var(--app-text-primary)" }}>
              {name}
            </h2>
            {activeTitle ? (
              <span
                className="mt-1 inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide"
                style={{ background: "var(--app-gold-glow)", color: "var(--app-gold)", border: "1px solid var(--app-gold-border)" }}
              >
                {pickLabel(SEASON_TITLE_LABELS, activeTitle, loc)}
              </span>
            ) : (
              <span className="mt-1 block text-[12px]" style={{ color: "var(--app-text-muted)" }}>
                {tr("Henüz ünvan seçilmedi", "No title selected yet")}
              </span>
            )}
          </div>
          <div className="shrink-0 text-right">
            <div className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: "var(--app-text-muted)" }}>
              {tr("Seviye", "Level")}
            </div>
            <div className="font-mono text-2xl font-black tabular-nums" style={{ color: "var(--app-text-primary)" }}>
              {level}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Quick stats */}
      <motion.div variants={reduce ? undefined : item} className="grid grid-cols-3 gap-3">
        {stats.map((s) => (
          <div key={s.label} className="flex flex-col items-center gap-1 p-3" style={surfaceStyle()}>
            <s.icon className="h-4 w-4" style={{ color: s.accent }} />
            <div className="font-mono text-lg font-bold tabular-nums" style={{ color: "var(--app-text-primary)" }}>
              {s.value}
            </div>
            <div className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: "var(--app-text-muted)" }}>
              {s.label}
            </div>
          </div>
        ))}
      </motion.div>

      {/* Title selector */}
      <motion.div variants={reduce ? undefined : item} className="p-5" style={surfaceStyle()}>
        <h3 className="mb-1 text-base font-bold tracking-tight" style={{ color: "var(--app-text-primary)" }}>
          {tr("Ünvanın", "Your title")}
        </h3>
        <p className="mb-3 text-[12px]" style={{ color: "var(--app-text-muted)" }}>
          {tr("Kazandığın ünvanlardan birini seç; profilinde ve sıralamalarda görünür.", "Pick one of the titles you've earned; it shows on your profile and leaderboards.")}
        </p>
        {earnedTitles.length === 0 ? (
          <div
            className="rounded-xl px-4 py-6 text-center text-[13px]"
            style={{ background: "var(--app-bg-base)", border: "1px dashed var(--app-border)", color: "var(--app-text-muted)" }}
          >
            {tr("Sezonda ilerledikçe ünvanlar burada açılır.", "Titles unlock here as you progress through the season.")}
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {earnedTitles.map((key) => {
              const isActive = key === activeTitle;
              return (
                <button
                  key={key}
                  type="button"
                  disabled={badges.saving}
                  onClick={() => badges.selectTitle(isActive ? null : key)}
                  className="rounded-full px-3.5 py-1.5 text-[13px] font-bold transition-transform active:scale-95 disabled:opacity-60"
                  style={
                    isActive
                      ? { background: "var(--app-gold)", color: "var(--app-bg-base)", border: "1px solid var(--app-gold)" }
                      : { background: "var(--app-bg-base)", color: "var(--app-text-secondary)", border: "1px solid var(--app-border)" }
                  }
                >
                  {pickLabel(SEASON_TITLE_LABELS, key, loc)}
                </button>
              );
            })}
          </div>
        )}
      </motion.div>

      {/* Achievement vitrin */}
      <motion.div variants={reduce ? undefined : item} className="p-5" style={surfaceStyle()}>
        <h3 className="mb-4 text-base font-bold tracking-tight" style={{ color: "var(--app-text-primary)" }}>
          {tr("Başarımlar", "Achievements")}
        </h3>
        <AchievementShowcase />
      </motion.div>
    </motion.div>
  );
}
