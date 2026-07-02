"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useTier } from "@/lib/theme/theme-context";
import { Bell, Settings, Volume2, VolumeX } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { AvatarImage } from "@/components/app/avatar-image";
import { ThemeToggle } from "@/components/app/theme-toggle";
import { useAppLocale } from "@/lib/i18n/app-context";
import { cn } from "@/lib/utils";
import type { AppNotification } from "@/lib/app/use-notifications";
import { useSound } from "@/lib/audio/sound-context";
import yumoYellowLogo from "@/assets/yumo-yellow-mark-transparent.png";

/**
 * Health score rendered as a progress ring hugging the avatar — the score is a
 * metric about the user themselves, so wrapping it around their avatar reads as
 * "your own state" at a glance. Color steps by score band so the status is legible
 * without reading any card: >=50 green, 30-49 orange, 10-29 red, 0-9 no colored arc
 * (only the faint track shows). The whole arc lives in stroke-dashoffset; the track
 * stays a faint white hairline to sit on the dark dashboard surface.
 */
function HealthRing({
  score,
  size = 52,
  className,
}: {
  score: number;
  size?: number;
  className?: string;
}) {
  const clamped = Math.max(0, Math.min(100, score));
  const r = (size - 4) / 2;
  const c = 2 * Math.PI * r;
  const stroke =
    clamped >= 50
      ? "#34d399"
      : clamped >= 30
        ? "#fb923c"
        : clamped >= 10
          ? "#e85d75"
          : null;
  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className={className}
      role="img"
      aria-label={`Health score ${clamped}`}
    >
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth={3.5} />
      {stroke && (
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={stroke}
          strokeWidth={3.5}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - clamped / 100)}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: "stroke-dashoffset 0.6s ease, stroke 0.6s ease" }}
        />
      )}
    </svg>
  );
}

interface TopbarProps {
  title?: string;
  mode?: "default" | "profile";
  onMenu?: () => void;
  onBack?: () => void;
  accountLevel?: number;
  streak?: number;
  /** Health/honor score 0–100 — drives the avatar progress ring on the dashboard. */
  healthScore?: number;
  initials?: string;
  avatarUrl?: string;
  displayName?: string;
  cPoints?: number;
  xpProgress?: number;
  hasXpInCurrentLevel?: boolean;
  unreadCount?: number;
  notifications?: AppNotification[];
  onNotificationsOpen?: () => void;
  onMarkNotificationRead?: (id: number) => void;
  onMarkAllNotificationsRead?: () => void;
  onNavigateToReceipt?: (receiptId: string) => void;
  onNavigateToNotification?: (notification: AppNotification) => void;
  /** Home screen mode: hides logo, locale toggle, and streak pill */
  homeVariant?: boolean;
  /** When provided, called on avatar click instead of navigating to /app/profile (e.g. to open a modal). */
  onAvatarClick?: () => void;
  onSettingsClick?: () => void;
  className?: string;
}

export function Topbar({
  title = "YUMO",
  mode = "default",
  onMenu,
  onBack,
  accountLevel = 1,
  streak = 0,
  healthScore = 50,
  initials = "?",
  avatarUrl,
  displayName,
  cPoints = 0,
  xpProgress = 0,
  hasXpInCurrentLevel = false,
  unreadCount = 0,
  notifications = [],
  onNotificationsOpen,
  onMarkNotificationRead,
  onMarkAllNotificationsRead,
  onNavigateToReceipt,
  onNavigateToNotification,
  homeVariant = false,
  onAvatarClick,
  onSettingsClick,
  className,
}: TopbarProps) {
  const { t, locale, setLocale } = useAppLocale();
  const tier = useTier(accountLevel);
  const acc = tier.accent;
  const { prefs, toggleEnabled } = useSound();
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  /** Radix Popover generates unstable aria-controls ids during SSR vs client — render after mount. */
  const [notificationsUiMounted, setNotificationsUiMounted] = useState(false);
  useEffect(() => {
    setNotificationsUiMounted(true);
  }, []);

  const handleOpenChange = (open: boolean) => {
    if (open) onNotificationsOpen?.();
    setNotificationsOpen(open);
  };
  /**
   * SSR-safe header styles: all colors via CSS variables.
   * .dark = dark mode, .dark.app-theme-light = light mode.
   * No React-state-dependent value in inline style = no hydration mismatch.
   * acc (accent) is only used for active-state highlights (badges, pills).
   */
  const headerBg = "var(--app-header-bg)";
  // On the dashboard the yellow XP bar already reads as the header's natural lower
  // edge, so the divider drops to a near-invisible hairline instead of a visible line.
  const headerBorder = homeVariant ? "rgba(255,255,255,0.06)" : "var(--app-header-border)";
  const compactCPoints =
    cPoints >= 1_000_000
      ? `${(cPoints / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`
      : cPoints >= 1_000
        ? `${(cPoints / 1_000).toFixed(1).replace(/\.0$/, "")}K`
        : String(Math.round(cPoints));
  const barWidth = Math.max(0, Math.min(100, xpProgress));
  const barFill = hasXpInCurrentLevel
    ? "bg-gradient-to-r from-[#e6b800] via-[#f5d030] to-[#fde86a]"
    : "bg-gradient-to-r from-[#ff7a1a] to-[#ffb347]";
  const identityName = displayName?.trim() || title || "YUMO";
  const showDashboardIdentity = homeVariant;
  const isProfileMode = mode === "profile";
  const showDefaultRightActions = !isProfileMode;

  return (
    <header
      suppressHydrationWarning
      className={cn(
        "sticky top-0 z-40 flex items-center justify-between gap-2 px-4 py-3.5 pt-[max(0.875rem,env(safe-area-inset-top))] border-b backdrop-blur-[22px] transition-[border-color,background] duration-[.6s] min-w-0",
        className
      )}
      style={{
        background: headerBg,
        borderColor: headerBorder,
      }}
    >
      <div className="flex min-w-0 flex-1 items-center gap-2">
        {onBack ? (
          <button
            suppressHydrationWarning
            type="button"
            onClick={onBack}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border-none bg-transparent transition-colors hover:bg-black/[0.05] active:bg-black/[0.08] dark:hover:bg-white/[0.06] dark:active:bg-white/[0.1]"
            style={{ color: "var(--app-header-nav-icon)" }}
            aria-label={t("common.back")}
          >
            <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
          </button>
        ) : onMenu && !showDashboardIdentity ? (
          <button
            suppressHydrationWarning
            type="button"
            onClick={onMenu}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border-none bg-transparent transition-colors hover:bg-black/[0.05] active:bg-black/[0.08] dark:hover:bg-white/[0.06] dark:active:bg-white/[0.1]"
            style={{ color: "var(--app-header-nav-icon)" }}
            aria-label={t("nav.menu")}
          >
            <svg suppressHydrationWarning width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
        ) : isProfileMode ? (
          <div className="h-10 w-10 shrink-0" />
        ) : null}

        {showDashboardIdentity ? (
          <>
            <Link
              href="/app/account"
              className="flex min-w-0 flex-1 items-center gap-3 lg:hidden"
              aria-label="Profile"
              onClick={
                onAvatarClick
                  ? (e) => {
                      e.preventDefault();
                      onAvatarClick();
                    }
                  : undefined
              }
            >
              <div className="relative shrink-0">
                {/* Fixed-pixel avatar box via INLINE style (not a Tailwind arbitrary class):
                    the inner image is percentage-sized (h-full/w-full), so if the box loses its
                    definite size the photo resolves against grid/flex min-content and blows up to
                    fill the row. Inline width/height always applies even when a freshly-added
                    arbitrary utility is missing from a stale/cached stylesheet, so the box stays
                    37px and clips the photo to a circle. The health ring is a separate, larger
                    absolute overlay. */}
                <div
                  className="relative grid place-items-center overflow-hidden rounded-full border border-white/12 bg-white/[0.07] text-white"
                  style={{ width: 37, height: 37 }}
                >
                  {avatarUrl ? (
                    <AvatarImage src={avatarUrl} className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-sm font-black text-white/88">{initials}</span>
                  )}
                </div>
                <HealthRing
                  score={healthScore}
                  size={49}
                  className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
                />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex min-w-0 items-center gap-2">
                  <p className="min-w-0 truncate text-sm font-black tracking-[-0.02em] text-white [text-shadow:0_0_20px_rgba(251,191,36,0.18)]">
                    {identityName}
                  </p>
                  <span
                    className="shrink-0 text-[10px] font-black tabular-nums leading-none tracking-[-0.03em] text-[#fcd34d] [text-shadow:0_0_12px_rgba(251,191,36,0.35)]"
                    aria-label={`Level ${accountLevel}`}
                  >
                    Lv.{accountLevel}
                  </span>
                  <span className="inline-flex shrink-0 items-center rounded-full border border-[#67e8f9]/22 bg-[#67e8f9]/12 px-1.5 py-[2px] text-[10px] font-black tabular-nums leading-none tracking-[-0.02em] text-[#7dd3fc]">
                    {compactCPoints} cPoints
                  </span>
                </div>
                <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                  <div
                    className={`h-full rounded-full transition-[width] duration-300 ${barFill}`}
                    style={{ width: `${barWidth}%` }}
                  />
                </div>
              </div>
            </Link>
            <Link href="/app/dashboard" className="hidden min-w-0 items-center gap-3 lg:flex" aria-label={t("nav.dashboard")}>
              <Image src={yumoYellowLogo} alt="Yumo Yumo" className="h-11 w-auto shrink-0 object-contain" priority />
              <span className="truncate text-[28px] font-black leading-none tracking-[-0.04em] text-white">
                Yumo Yumo
              </span>
            </Link>
          </>
        ) : title === "YUMO" || title === undefined ? (
          <Link href="/app/dashboard" className="flex items-center gap-2 min-w-0 shrink" aria-label={t("nav.dashboard")}>
            <div
              suppressHydrationWarning
              className={cn("yumo-lockup-topbar", "light-tier", "topbar-compact")}
              style={
                ({
                  "--logo-accent": acc,
                  "--logo-accent2": tier.accent2,
                } as React.CSSProperties)
              }
            >
              <span className="yumo-word yumo-word-gold">YUMO</span>
              <div className="yumo-sep" />
              <span className="yumo-word yumo-word-silver">YUMO</span>
            </div>
          </Link>
        ) : isProfileMode ? (
          <div className="pointer-events-none absolute left-1/2 -translate-x-1/2">
            <span
              className="text-[17px] font-semibold tracking-[-0.03em]"
              style={{ color: "var(--app-text-primary)" }}
            >
              {title}
            </span>
          </div>
        ) : (
          <span
            className="text-[17px] font-bold uppercase tracking-[.12em]"
            style={{ color: "var(--app-text-primary)" }}
          >
            {title}
          </span>
        )}
      </div>


      <div className="flex items-center gap-2">
        <ThemeToggle className="w-8 h-8 rounded-lg" />

        {isProfileMode ? (
          <button
            suppressHydrationWarning
            type="button"
            onClick={onSettingsClick}
            className="relative h-10 w-10 rounded-[14px] flex items-center justify-center flex-shrink-0 transition-colors hover:opacity-90"
            style={{
              background: "color-mix(in srgb, var(--app-header-nav-icon) 10%, transparent)",
              border: "1px solid var(--app-header-nav-border)",
              color: "var(--app-header-nav-icon)",
            }}
            aria-label={t("settings.title")}
          >
            <Settings className="h-4.5 w-4.5" strokeWidth={2} />
          </button>
        ) : null}

        {showDefaultRightActions && !showDashboardIdentity && (
          <button
            suppressHydrationWarning
            type="button"
            onClick={toggleEnabled}
            className="relative w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors hover:opacity-90"
            style={{
              background: "color-mix(in srgb, var(--app-header-nav-icon) 10%, transparent)",
              border: `1px solid var(--app-header-nav-border)`,
              color: "var(--app-header-nav-icon)",
            }}
            aria-label={prefs.enabled ? t("settings.sound.mute") : t("settings.sound.unmute")}
            title={prefs.enabled ? t("settings.sound.mute") : t("settings.sound.unmute")}
          >
            {prefs.enabled ? <Volume2 className="w-4 h-4" strokeWidth={2} /> : <VolumeX className="w-4 h-4" strokeWidth={2} />}
          </button>
        )}

        {/* The locale selector now lives under Profile → Preferences (see profile-preferences).
            Keeps the header simple; language is changed from there instead.
            Per the product decision (2026-05-16). */}

        {/* Streak pill — hidden in homeVariant (shown in streak-row) */}
        {showDefaultRightActions && !homeVariant && streak > 0 && (
          <div
            suppressHydrationWarning
            className="flex items-center gap-1.5 rounded-full px-2.5 py-1"
            style={{
              background: "var(--app-gold-glow, rgba(201,168,76,0.15))",
              border: `1px solid var(--app-gold-border, rgba(201,168,76,0.18))`,
            }}
          >
            <span className="text-[11px] leading-none">🔥</span>
            <span
              className="font-mono text-[11px] font-bold tabular-nums"
              style={{ color: acc }}
            >
              {streak}
            </span>
          </div>
        )}

        {/* Streak flame chip — dashboard moves the streak here, next to the bell */}
        {homeVariant && streak > 0 && (
          <div
            suppressHydrationWarning
            className="flex items-center gap-1 rounded-full border border-[#ff7a1a]/22 bg-[#ff7a1a]/12 px-2 py-1"
            aria-label={`Streak ${streak}`}
          >
            <span className="text-[11px] leading-none">🔥</span>
            <span className="font-mono text-[11px] font-black tabular-nums leading-none text-[#ffb347]">
              {streak}
            </span>
          </div>
        )}

        {notificationsUiMounted ? (
          <Popover open={notificationsOpen} onOpenChange={handleOpenChange}>
            <PopoverTrigger asChild>
              <button
                type="button"
                className="relative w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors hover:opacity-90"
                style={{
                  background: "color-mix(in srgb, var(--app-header-nav-icon) 10%, transparent)",
                  border: `1px solid var(--app-header-nav-border)`,
                  color: "var(--app-header-nav-icon)",
                }}
                aria-label={t("topbar.notifications.willAppear")}
              >
                <Bell className="w-4 h-4" strokeWidth={2} />
                {unreadCount > 0 && (
                  <span
                    className="absolute -top-0.5 -right-0.5 min-w-[14px] h-[14px] rounded-full flex items-center justify-center text-[10px] font-bold"
                    style={{ background: acc, color: "#0a0a0a" }}
                  >
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </button>
            </PopoverTrigger>
            <PopoverContent
              align="end"
              sideOffset={8}
              className="w-[min(calc(100vw-2rem),320px)] p-4 border-[var(--app-border)] bg-[var(--app-bg-elevated)]"
            >
              <div className="flex items-center justify-between gap-2 mb-2">
                <h3 className="text-sm font-semibold" style={{ color: "var(--app-text-primary)" }}>
                  {t("topbar.notifications.title")}
                </h3>
                {unreadCount > 0 && onMarkAllNotificationsRead && (
                  <button
                    type="button"
                    onClick={onMarkAllNotificationsRead}
                    className="text-xs font-medium rounded px-2 py-1 transition-colors hover:bg-black/5 dark:hover:bg-white/5"
                    style={{ color: "var(--app-text-muted)" }}
                  >
                    {t("topbar.notifications.markAllRead")}
                  </button>
                )}
              </div>
              {notifications.length > 0 ? (
                <ul className="space-y-1 max-h-[280px] overflow-y-auto -mx-1 px-1">
                  {notifications.map((n) => (
                    <li key={n.id}>
                      <button
                        type="button"
                        onClick={() => {
                          if (onNavigateToNotification) {
                            onMarkNotificationRead?.(n.id);
                            setNotificationsOpen(false);
                            onNavigateToNotification(n);
                            return;
                          }
                          if (n.receiptId && onNavigateToReceipt) {
                            onMarkNotificationRead?.(n.id);
                            setNotificationsOpen(false);
                            onNavigateToReceipt(n.receiptId);
                          } else {
                            onMarkNotificationRead?.(n.id);
                          }
                        }}
                        className={cn(
                          "w-full text-left rounded-lg p-2.5 transition-colors border-none",
                          "hover:bg-black/5 dark:hover:bg-white/5",
                          !n.readAt && "bg-black/[0.03] dark:bg-white/[0.03]"
                        )}
                        style={{ color: "var(--app-text-primary)" }}
                      >
                        <p className="text-sm font-medium truncate">{n.title || n.type}</p>
                        {n.body && (
                          <p className="text-xs mt-0.5 line-clamp-2" style={{ color: "var(--app-text-muted)" }}>
                            {n.body}
                          </p>
                        )}
                        <p className="text-[10px] mt-1 opacity-70" style={{ color: "var(--app-text-muted)" }}>
                          {new Date(n.createdAt).toLocaleDateString(undefined, {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="py-6 text-center" style={{ color: "var(--app-text-muted)" }}>
                  <Bell className="w-10 h-10 mx-auto mb-3 opacity-50" />
                  <p className="text-sm font-medium mb-1">{t("topbar.notifications.empty")}</p>
                  <p className="text-xs">{t("topbar.notifications.emptyDesc")}</p>
                </div>
              )}
            </PopoverContent>
          </Popover>
        ) : (
          <button
            suppressHydrationWarning
            type="button"
            className="relative w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors hover:opacity-90"
            style={{
              background: "color-mix(in srgb, var(--app-header-nav-icon) 10%, transparent)",
              border: `1px solid var(--app-header-nav-border)`,
              color: "var(--app-header-nav-icon)",
            }}
            aria-label={t("topbar.notifications.willAppear")}
          >
            <Bell className="w-4 h-4" strokeWidth={2} />
            {unreadCount > 0 && (
              <span
                className="absolute -top-0.5 -right-0.5 min-w-[14px] h-[14px] rounded-full flex items-center justify-center text-[10px] font-bold"
                style={{ background: acc, color: "#0a0a0a" }}
              >
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </button>
        )}

      </div>

    </header>
  );
}
