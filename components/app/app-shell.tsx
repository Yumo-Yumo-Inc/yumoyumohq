"use client";

import { memo, Suspense, useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Topbar } from "./topbar";
import { BottomNav } from "./bottom-nav";
import { DesktopSidebar } from "./desktop-sidebar";
import { ThemeBg } from "./theme-bg";
import { useAppProfile } from "@/lib/app/profile-context";
import { useNotifications } from "@/lib/app/use-notifications";
import { ThemeLevelProvider, TierVarsInjector } from "@/lib/theme/theme-context";
import { SoundProvider } from "@/lib/audio/sound-context";
import { useIsDesktop } from "@/lib/hooks/use-is-desktop";
import { cn } from "@/lib/utils";
import { InstallPrompt } from "@/components/pwa/install-prompt";
import { ACCOUNT_LEVEL_XP_THRESHOLDS } from "@/config/account-level-config";

interface AppShellProps {
  children: React.ReactNode;
  className?: string;
  topbarTitle?: string;
  topbarMode?: "default" | "profile";
  topbarHomeVariant?: boolean;
  topbarShowBack?: boolean;
  onTopbarSettingsClick?: () => void;
  /**
   * Lock the shell to a single non-scrolling viewport: the topbar stays pinned,
   * the bottom nav stays fixed, and <main> fills the exact space between them
   * with its own overflow clipped. Used by app-screen feeds (e.g. the receipts
   * swipe deck) so card content never scrolls under the sticky header.
   */
  fixedViewport?: boolean;
}

function AppShellFallback() {
  return null;
}

export function AppShell({
  children,
  className,
  topbarTitle,
  topbarMode = "default",
  topbarHomeVariant = true,
  topbarShowBack = false,
  onTopbarSettingsClick,
  fixedViewport = false,
}: AppShellProps) {
  return (
    <Suspense fallback={<AppShellFallback />}>
      <AppShellInner
        className={className}
        topbarTitle={topbarTitle}
        topbarMode={topbarMode}
        topbarHomeVariant={topbarHomeVariant}
        topbarShowBack={topbarShowBack}
        onTopbarSettingsClick={onTopbarSettingsClick}
        fixedViewport={fixedViewport}
      >
        {children}
      </AppShellInner>
    </Suspense>
  );
}

const AppShellInner = memo(function AppShellInner({
  children,
  className,
  topbarTitle,
  topbarMode = "default",
  topbarHomeVariant = true,
  topbarShowBack = false,
  onTopbarSettingsClick,
  fixedViewport = false,
}: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { profile: ctxProfile } = useAppProfile();
  const { notifications, unreadCount, refetch: refetchNotifications, markRead, markAllRead } = useNotifications();
  const levelParam = searchParams.get("level");
  const levelOverride =
    levelParam != null ? Math.max(1, Math.min(999, parseInt(levelParam, 10) || 1)) : null;
  const accountLevel = levelOverride ?? ctxProfile?.accountLevel ?? 1;
  const initials = (ctxProfile?.displayName || ctxProfile?.username || "?").slice(0, 2).toUpperCase();
  const avatarUrl = ctxProfile?.avatarUrl ?? undefined;
  const displayName = ctxProfile?.displayName || ctxProfile?.username || "User";
  const streak = ctxProfile?.streak ?? 0;
  const healthScore = Math.max(0, Math.min(100, Number(ctxProfile?.honor ?? 50) || 0));
  const cPoints = Math.round(ctxProfile?.contributionPoints?.total ?? 0);
  const isDesktop = useIsDesktop();
  const isMenuPage = pathname === "/app/menu";
  const isDashboardPage = pathname === "/app" || pathname === "/app/dashboard";
  const showMenuButton = !isDesktop;
  const nextThreshold =
    ACCOUNT_LEVEL_XP_THRESHOLDS[accountLevel] ??
    ACCOUNT_LEVEL_XP_THRESHOLDS[ACCOUNT_LEVEL_XP_THRESHOLDS.length - 1];
  const previousThreshold = ACCOUNT_LEVEL_XP_THRESHOLDS[accountLevel - 1] ?? 0;
  const accountXp = ctxProfile?.accountXp ?? 0;
  const xpSpan = Math.max(1, nextThreshold - previousThreshold);
  const xpProgress = Math.max(8, Math.min(96, Math.round(((accountXp - previousThreshold) / xpSpan) * 100)));
  const hasXpInCurrentLevel = accountXp > previousThreshold;
  // In fixedViewport mode the shell already clamps itself to one 100dvh screen
  // with its overflow clipped. But <body> stays a scroll container (globals.css
  // only sets overflow-x), so on mobile — where 100dvh slightly exceeds the
  // visible area while the browser toolbar is shown — the document scrolls and
  // drags the whole screen (topbar included) up/down. Lock the document scroll
  // while a fixed-viewport screen is mounted so only the inner card can move;
  // restore the previous inline styles on unmount.
  useEffect(() => {
    if (!fixedViewport || typeof document === "undefined") return;
    const html = document.documentElement;
    const body = document.body;
    const prev = {
      htmlOverflow: html.style.overflow,
      bodyOverflow: body.style.overflow,
      bodyOverscroll: body.style.overscrollBehavior,
    };
    html.style.overflow = "hidden";
    body.style.overflow = "hidden";
    body.style.overscrollBehavior = "none";
    return () => {
      html.style.overflow = prev.htmlOverflow;
      body.style.overflow = prev.bodyOverflow;
      body.style.overscrollBehavior = prev.bodyOverscroll;
    };
  }, [fixedViewport]);

  const handleMenuBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push("/app/dashboard");
    }
  };

  return (
    <ThemeLevelProvider level={accountLevel}>
      <TierVarsInjector />
      <SoundProvider>
        <div
          className={cn(
            "relative font-sans transition-[background-color] duration-500",
            fixedViewport ? "h-[100dvh] overflow-hidden" : "min-h-screen",
            isDashboardPage
              ? "bg-[var(--app-bg-dashboard)] text-[var(--app-text-primary)] select-none caret-transparent"
              : "bg-[var(--app-bg-shell)] text-[var(--app-text-primary)]"
          )}
        >
          {!isDashboardPage && <ThemeBg accountLevel={accountLevel} />}
          <DesktopSidebar />
          <div className={cn("lg:pl-64 flex flex-col", fixedViewport ? "h-[100dvh] overflow-hidden" : "min-h-screen")}>
            <Topbar
              title={topbarTitle}
              mode={topbarMode}
              onBack={
                showMenuButton && (topbarShowBack || isMenuPage)
                  ? handleMenuBack
                  : undefined
              }
              onMenu={!isDashboardPage && showMenuButton && !isMenuPage ? () => router.push("/app/menu") : undefined}
              accountLevel={accountLevel}
              streak={streak}
              healthScore={healthScore}
              initials={initials}
              avatarUrl={avatarUrl}
              displayName={displayName}
              cPoints={cPoints}
              xpProgress={xpProgress}
              hasXpInCurrentLevel={hasXpInCurrentLevel}
              unreadCount={unreadCount}
              notifications={notifications}
              onNotificationsOpen={refetchNotifications}
              onMarkNotificationRead={markRead}
              onMarkAllNotificationsRead={markAllRead}
              onNavigateToReceipt={(id) => router.push(`/app/receipts/${id}`)}
              homeVariant={topbarHomeVariant}
              onSettingsClick={onTopbarSettingsClick}
            />
            {/* Yumbie lives only in the dashboard room now — the dashboard page
                renders the workspace itself at the Ledger position. No other
                route shows it. */}
            <main
              className={cn(
                "relative z-10 w-full min-w-0 flex-1 max-w-[430px] lg:max-w-[1500px] mx-auto",
                fixedViewport
                  ? "min-h-0 overflow-hidden flex flex-col px-3 sm:px-4 pt-3 sm:pt-4 lg:px-8 lg:pt-6"
                  : "p-3 sm:p-4 pb-24 lg:px-8 lg:py-6 lg:pb-10",
                className
              )}
            >
              {children}
            </main>
            <InstallPrompt />
            <div className="lg:hidden">
              <BottomNav accountLevel={accountLevel} />
            </div>
          </div>
        </div>
      </SoundProvider>
    </ThemeLevelProvider>
  );
});
