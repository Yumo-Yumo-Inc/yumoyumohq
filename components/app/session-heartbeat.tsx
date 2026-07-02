"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

const AUTH_PUBLIC_PATHS = new Set([
  "/app/login",
  "/app/register",
  "/app/verify-email",
  "/app/forgot-password",
  "/app/reset-password",
]);

const HEARTBEAT_INTERVAL_MS = 5 * 60 * 1000;

export function SessionHeartbeat() {
  const pathname = usePathname();
  const router = useRouter();
  const [offlineToast, setOfflineToast] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const runCheck = async () => {
      if (AUTH_PUBLIC_PATHS.has(pathname)) {
        return;
      }

      try {
        const response = await fetch("/api/auth/session", {
          credentials: "include",
          cache: "no-store",
        });
        const data = await response.json().catch(() => ({ user: null }));
        if (cancelled) return;

        if (!data?.user) {
          window.location.href = "/app/login";
          return;
        }

        if (data.user.emailVerified === false && pathname !== "/app/verify-email") {
          window.location.href = "/app/verify-email";
        }
      } catch {
        if (!cancelled) {
          setOfflineToast(true);
          router.refresh();
          setTimeout(() => {
            if (!cancelled) setOfflineToast(false);
          }, 5000);
        }
      }
    };

    void runCheck();
    const intervalId = window.setInterval(() => {
      void runCheck();
    }, HEARTBEAT_INTERVAL_MS);

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void runCheck();
      }
    };

    window.addEventListener("focus", runCheck);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
      window.removeEventListener("focus", runCheck);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [pathname, router]);

  if (!offlineToast) return null;

  return (
    <div
      className="fixed top-16 left-1/2 -translate-x-1/2 z-[9999] flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium shadow-lg pointer-events-none"
      style={{
        background: "var(--app-bg-elevated)",
        border: "1px solid rgba(239,68,68,0.4)",
        color: "var(--app-text-primary)",
        backdropFilter: "blur(12px)",
      }}
    >
      <span style={{ color: "#ef4444" }}>⚠</span>
      Bağlantı sorunu, yeniden bağlanılıyor…
    </div>
  );
}
