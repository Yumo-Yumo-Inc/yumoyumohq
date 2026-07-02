const CACHE_VERSION = "v3";
const STATIC_CACHE = `yumo-static-${CACHE_VERSION}`;
const RUNTIME_CACHE = `yumo-runtime-${CACHE_VERSION}`;
const OFFLINE_URL = "/offline";

// In local development a cached service worker silently serves stale client JS
// chunks (Next dev uses stable chunk names), so code changes never reach the
// browser even after a hard refresh. The SW must then self-destruct: drop every
// cache, unregister itself, and reload open tabs onto fresh code.
// This applies to localhost AND to LAN access (phone hitting the dev server via
// a private IP like 192.168.x.x / 10.x / 172.16-31.x or an *.local host): in
// production-cache mode the cache-first static handler would keep serving a build
// behind on those devices. Real deployments always run on a public domain, never
// a private IP, so treating private IPs as dev is safe.
const HOSTNAME = self.location.hostname;
const IS_PRIVATE_LAN =
  /^10\./.test(HOSTNAME) ||
  /^192\.168\./.test(HOSTNAME) ||
  /^172\.(1[6-9]|2\d|3[01])\./.test(HOSTNAME) ||
  HOSTNAME.endsWith(".local");
const IS_DEV =
  HOSTNAME === "localhost" ||
  HOSTNAME === "127.0.0.1" ||
  HOSTNAME === "[::1]" ||
  IS_PRIVATE_LAN;

if (IS_DEV) {
  self.addEventListener("install", () => self.skipWaiting());
  self.addEventListener("activate", (event) => {
    event.waitUntil(
      (async () => {
        const keys = await caches.keys();
        await Promise.all(keys.map((key) => caches.delete(key)));
        await self.clients.claim();
        const clients = await self.clients.matchAll({ type: "window" });
        clients.forEach((client) => client.navigate(client.url));
        await self.registration.unregister();
      })()
    );
  });
  // No fetch handler in dev → nothing is ever served from cache.
}
const PRECACHE_URLS = [
  OFFLINE_URL,
  "/manifest.webmanifest",
  "/pwa/icon-192.png",
  "/pwa/icon-512.png",
  "/pwa/icon-512-maskable.png",
  "/pwa/apple-touch-icon.png",
];

self.addEventListener("install", (event) => {
  if (IS_DEV) return;
  // Do NOT call skipWaiting() here automatically.
  // Automatic skipWaiting() + clients.claim() + controllerchange → window.location.reload()
  // was silently force-reloading all open tabs on every deployment, interrupting uploads.
  // The user-triggered "Refresh" toast (pwa-init.tsx) still sends SKIP_WAITING when clicked.
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => cache.addAll(PRECACHE_URLS))
  );
});

self.addEventListener("activate", (event) => {
  if (IS_DEV) return;
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key.startsWith("yumo-") && key !== STATIC_CACHE && key !== RUNTIME_CACHE)
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

self.addEventListener("fetch", (event) => {
  if (IS_DEV) return;
  const { request } = event;
  if (request.method !== "GET") {
    return;
  }

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) {
    return;
  }

  if (url.pathname.startsWith("/api/")) {
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(handleNavigationRequest(request));
    return;
  }

  if (isStaticAsset(url.pathname)) {
    event.respondWith(handleStaticRequest(request));
    return;
  }

  event.respondWith(handleRuntimeRequest(request));
});

async function handleNavigationRequest(request) {
  try {
    const response = await fetch(request);
    if (response && response.ok) {
      const cache = await caches.open(RUNTIME_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    const cached = await caches.match(request);
    return cached || caches.match(OFFLINE_URL);
  }
}

async function handleStaticRequest(request) {
  const cached = await caches.match(request);
  const fetchPromise = fetch(request)
    .then(async (response) => {
      if (response && response.ok) {
        const cache = await caches.open(STATIC_CACHE);
        cache.put(request, response.clone());
      }
      return response;
    })
    .catch(() => undefined);

  if (cached) {
    return cached;
  }

  const networkResponse = await fetchPromise;
  if (networkResponse) {
    return networkResponse;
  }

  return Response.error();
}

async function handleRuntimeRequest(request) {
  try {
    const response = await fetch(request);
    if (response && response.ok) {
      const cache = await caches.open(RUNTIME_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    const cached = await caches.match(request);
    if (cached) {
      return cached;
    }

    if (request.destination === "document") {
      return caches.match(OFFLINE_URL);
    }

    throw error;
  }
}

function isStaticAsset(pathname) {
  return (
    pathname.startsWith("/_next/static/") ||
    pathname.startsWith("/images/") ||
    pathname.startsWith("/pwa/") ||
    /\.(?:js|css|png|jpg|jpeg|svg|webp|gif|ico|woff2?)$/i.test(pathname)
  );
}

/* ── Push Notifications ── */

self.addEventListener("push", (event) => {
  let payload = { title: "Yumo", body: "Yeni bir mesajın var!", data: {} };
  try {
    if (event.data) {
      payload = { ...payload, ...event.data.json() };
    }
  } catch {
    /* malformed payload — fall back to defaults */
  }

  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      icon: payload.icon || "/pwa/icon-192.png",
      badge: payload.badge || "/pwa/icon-192.png",
      tag: payload.tag || "yumo-default",
      data: payload.data || {},
      requireInteraction: false,
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const data = event.notification.data || {};
  const targetUrl = data.url || "/app";

  /* Track click telemetry */
  if (data.scenarioId) {
    self.registration.pushManager.getSubscription().then((sub) => {
      if (sub) {
        fetch("/api/push/track-click", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ scenarioId: data.scenarioId }),
        }).catch(() => {});
      }
    });
  }

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if (client.url === targetUrl && "focus" in client) {
            return client.focus();
          }
        }
        if (self.clients.openWindow) {
          return self.clients.openWindow(targetUrl);
        }
      })
  );
});
