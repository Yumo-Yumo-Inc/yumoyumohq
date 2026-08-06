"use client";

import Link from "next/link";
import { Bell, CheckCheck, ChevronRight } from "lucide-react";
import { AppShell } from "@/components/app/app-shell";
import { Surface } from "@/components/ui/surface";
import { StaggerReveal, Reveal } from "@/components/ui/stagger-reveal";
import { useNotifications } from "@/lib/app/use-notifications";
import { useAppLocale } from "@/lib/i18n/app-context";

function formatNotificationDate(value: string, locale: string) {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "";
  return new Intl.DateTimeFormat(locale, {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export default function NotificationsPage() {
  const { notifications, unreadCount, markAllRead } = useNotifications();
  const { t, locale } = useAppLocale();

  return (
    <AppShell className="max-w-[430px] lg:max-w-[980px]">
      <div className="space-y-4">
        <Surface variant="value" accent="gold" glow radius="xl" className="p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[10px] font-bold tracking-[0.2em]" style={{ color: "var(--app-text-muted)" }}>{t("notificationsPage.eyebrow")}</p>
              <h1 className="mt-1 text-2xl font-black tracking-[-0.03em]" style={{ color: "var(--app-text-primary)" }}>{t("notificationsPage.title")}</h1>
              <p className="mt-1 text-sm font-semibold" style={{ color: "var(--app-text-secondary)" }}>{t("notificationsPage.unread", { count: unreadCount })}</p>
            </div>
            <button
              type="button"
              onClick={() => markAllRead().then(() => {})}
              className="inline-flex h-10 items-center gap-2 rounded-full px-3 text-xs font-black transition"
              style={{ border: "1px solid var(--app-gold-border)", background: "var(--app-gold-glow)", color: "var(--app-gold)" }}
            >
              <CheckCheck className="h-4 w-4" strokeWidth={2} />
              {t("notificationsPage.markAllRead")}
            </button>
          </div>
        </Surface>

        {notifications.length > 0 ? (
          <StaggerReveal className="space-y-3">
            {notifications.map((notification) => {
              const payloadRoute = typeof notification.payload?.route === "string" && notification.payload.route.startsWith("/app") ? notification.payload.route : null;
              const href = payloadRoute ?? (notification.receiptId ? `/app/receipts/${notification.receiptId}` : "/app/insights");
              return (
                <Reveal key={notification.id}>
                  <Surface as={Link} href={href} variant="flat" radius="lg" interactive className="flex items-center gap-3 p-4">
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl" style={{ background: "var(--app-gold-glow)", color: "var(--app-gold)" }}>
                      <Bell className="h-4.5 w-4.5" strokeWidth={2} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-black" style={{ color: "var(--app-text-primary)" }}>{notification.title || t("notificationsPage.defaultTitle")}</span>
                      <span className="mt-0.5 block truncate text-xs font-semibold" style={{ color: "var(--app-text-secondary)" }}>
                        {notification.body || t("notificationsPage.defaultBody")}
                      </span>
                      <span className="mt-1 block text-[11px] font-bold" style={{ color: "var(--app-text-muted)" }}>
                        {formatNotificationDate(notification.createdAt, locale)}
                      </span>
                    </span>
                    <ChevronRight className="h-4 w-4 shrink-0" style={{ color: "var(--app-text-muted)" }} strokeWidth={2} />
                  </Surface>
                </Reveal>
              );
            })}
          </StaggerReveal>
        ) : (
          <Surface variant="flat" radius="lg" className="p-4">
            <p className="text-sm font-bold" style={{ color: "var(--app-text-primary)" }}>{t("notificationsPage.empty")}</p>
            <p className="mt-1 text-xs font-semibold" style={{ color: "var(--app-text-secondary)" }}>{t("notificationsPage.emptyDesc")}</p>
          </Surface>
        )}
      </div>
    </AppShell>
  );
}
