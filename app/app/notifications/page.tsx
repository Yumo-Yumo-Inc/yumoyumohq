"use client";

import Link from "next/link";
import { Bell, CheckCheck, ChevronRight } from "lucide-react";
import { AppShell } from "@/components/app/app-shell";
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
        <section className="rounded-3xl border border-white/12 bg-[#12151f]/90 p-5 text-white shadow-[0_22px_70px_rgba(0,0,0,0.35)]">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[10px] font-bold tracking-[0.2em] text-white/45">{t("notificationsPage.eyebrow")}</p>
              <h1 className="mt-1 text-2xl font-black tracking-[-0.03em]">{t("notificationsPage.title")}</h1>
              <p className="mt-1 text-sm font-semibold text-white/55">{t("notificationsPage.unread", { count: unreadCount })}</p>
            </div>
            <button
              type="button"
              onClick={() => markAllRead().then(() => {})}
              className="inline-flex h-10 items-center gap-2 rounded-full border border-white/12 bg-white/[0.07] px-3 text-xs font-black text-white transition hover:bg-white/[0.12]"
            >
              <CheckCheck className="h-4 w-4" strokeWidth={2} />
              {t("notificationsPage.markAllRead")}
            </button>
          </div>
        </section>

        {notifications.length > 0 ? (
          <section className="space-y-3">
            {notifications.map((notification) => {
              const href = notification.receiptId ? `/app/receipts/${notification.receiptId}` : "/app/insights";
              return (
                <Link
                  key={notification.id}
                  href={href}
                  className="flex items-center gap-3 rounded-2xl border border-white/10 bg-[#151922]/90 p-4 text-white transition hover:bg-[#1b202c]"
                >
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#ff7a1a]/18 text-[#ffb347]">
                    <Bell className="h-4.5 w-4.5" strokeWidth={2} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-black">{notification.title || t("notificationsPage.defaultTitle")}</span>
                    <span className="mt-0.5 block truncate text-xs font-semibold text-white/62">
                      {notification.body || t("notificationsPage.defaultBody")}
                    </span>
                    <span className="mt-1 block text-[11px] font-bold text-white/45">
                      {formatNotificationDate(notification.createdAt, locale)}
                    </span>
                  </span>
                  <ChevronRight className="h-4 w-4 shrink-0 text-white/42" strokeWidth={2} />
                </Link>
              );
            })}
          </section>
        ) : (
          <section className="rounded-2xl border border-white/10 bg-[#151922]/90 p-4 text-white">
            <p className="text-sm font-bold">{t("notificationsPage.empty")}</p>
            <p className="mt-1 text-xs font-semibold text-white/58">{t("notificationsPage.emptyDesc")}</p>
          </section>
        )}
      </div>
    </AppShell>
  );
}
