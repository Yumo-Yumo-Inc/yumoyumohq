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

    const isLocalhost =
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1" ||
      window.location.hostname === "[::1]";
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
      } catch (error) {
        console.warn("[pwa] service worker registration failed", error);
      }
    };

    void register();
  }, []);

  return null;
}
