"use client";

import { useEffect } from "react";
import { toast } from "sonner";

type ServiceWorkerWithWaiting = ServiceWorkerRegistration & {
  waiting?: ServiceWorker | null;
};

export function PwaInit() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }

    // Must match the IS_DEV scope in public/sw.js: private LAN IPs (phone
    // hitting a local server) count as dev, otherwise a prod build served over
    // LAN registers a SW that immediately self-destructs → reload loop.
    const hostname = window.location.hostname;
    const isPrivateLan =
      /^10\./.test(hostname) ||
      /^192\.168\./.test(hostname) ||
      /^172\.(1[6-9]|2\d|3[01])\./.test(hostname) ||
      hostname.endsWith(".local");
    const isLocalhost =
      hostname === "localhost" ||
      hostname === "127.0.0.1" ||
      hostname === "[::1]" ||
      isPrivateLan;
    const isProd = process.env.NODE_ENV === "production";

    // Keep PWA behavior out of local/dev sessions so stale caches do not mask UI changes.
    if (!isProd || isLocalhost) {
      void navigator.serviceWorker
        .getRegistrations()
        .then((registrations) => Promise.all(registrations.map((registration) => registration.unregister())))
        .then(() => caches.keys())
        .then((keys) =>
          Promise.all(keys.filter((key) => key.startsWith("yumo-")).map((key) => caches.delete(key)))
        )
        .catch((error) => {
          console.warn("[pwa] cleanup failed", error);
        });
      return;
    }

    let refreshing = false;

    const register = async () => {
      try {
        const registration = (await navigator.serviceWorker.register("/sw.js")) as ServiceWorkerWithWaiting;

        const promptRefresh = () => {
          toast("A new version of Yumo Yumo is ready.", {
            duration: Infinity,
            action: {
              label: "Refresh",
              onClick: () => registration.waiting?.postMessage({ type: "SKIP_WAITING" }),
            },
          });
        };

        if (registration.waiting) {
          promptRefresh();
        }

        registration.addEventListener("updatefound", () => {
          const installingWorker = registration.installing;
          if (!installingWorker) {
            return;
          }

          installingWorker.addEventListener("statechange", () => {
            if (installingWorker.state === "installed" && navigator.serviceWorker.controller) {
              promptRefresh();
            }
          });
        });

        navigator.serviceWorker.addEventListener("controllerchange", () => {
          if (refreshing) {
            return;
          }
          refreshing = true;
          window.location.reload();
        });

        // Long-lived tabs (installed PWA left open) never re-navigate, so the
        // browser never re-fetches sw.js on its own. Poll for a new deploy
        // hourly and whenever the app regains focus; sw.js is stamped with the
        // build id at deploy time, so update() notices every release.
        const checkForUpdate = () => {
          void registration.update().catch(() => {});
        };
        const updateInterval = window.setInterval(checkForUpdate, 60 * 60 * 1000);
        const onVisible = () => {
          if (document.visibilityState === "visible") {
            checkForUpdate();
          }
        };
        document.addEventListener("visibilitychange", onVisible);
        cleanup = () => {
          window.clearInterval(updateInterval);
          document.removeEventListener("visibilitychange", onVisible);
        };
      } catch (error) {
        console.warn("[pwa] service worker registration failed", error);
      }
    };

    let cleanup: (() => void) | undefined;
    void register();
    return () => cleanup?.();
  }, []);

  return null;
}
