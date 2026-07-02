/**
 * Web Push subscription helpers (OS-level notifications via service worker).
 * Used from onboarding finish and contextual opt-in prompts — not from Yumbie chat.
 */

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/\-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  return Uint8Array.from(rawData.split("").map((c) => c.charCodeAt(0)));
}

export function pushSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    "Notification" in window &&
    "serviceWorker" in navigator
  );
}

export function pushPermission(): NotificationPermission | "unsupported" {
  if (!pushSupported()) return "unsupported";
  return Notification.permission;
}

export async function isPushSubscribed(): Promise<boolean> {
  if (!pushSupported()) return false;
  try {
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    return !!sub;
  } catch {
    return false;
  }
}

/** Onboarding frequency choices that imply OS push consent. */
export function wantsOsPushNotifications(freq: string | null | undefined): boolean {
  if (!freq || freq === "none") return false;
  return freq === "important_only" || freq === "daily" || freq === "frequent";
}

export type PushSubscribeResult =
  | { ok: true }
  | { ok: false; reason: "unsupported" | "denied" | "no_vapid" | "error" };

export async function subscribeToPush(): Promise<PushSubscribeResult> {
  if (!pushSupported()) return { ok: false, reason: "unsupported" };

  try {
    const perm = await Notification.requestPermission();
    if (perm !== "granted") return { ok: false, reason: "denied" };

    const reg = await navigator.serviceWorker.ready;
    const res = await fetch("/api/push/vapid-public-key");
    const { publicKey } = (await res.json()) as { publicKey?: string };
    if (!publicKey) return { ok: false, reason: "no_vapid" };

    const existing = await reg.pushManager.getSubscription();
    const sub =
      existing ??
      (await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey).buffer as ArrayBuffer,
      }));

    let timeZone: string | undefined;
    try {
      timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    } catch {
      timeZone = undefined;
    }

    await fetch("/api/push/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        endpoint: sub.endpoint,
        keys: {
          p256dh: btoa(String.fromCharCode(...new Uint8Array(sub.getKey("p256dh")!))),
          auth: btoa(String.fromCharCode(...new Uint8Array(sub.getKey("auth")!))),
        },
        timeZone,
      }),
    });

    return { ok: true };
  } catch (err) {
    console.error("[PushSubscribe] Subscribe failed:", err);
    return { ok: false, reason: "error" };
  }
}

export async function unsubscribeFromPush(): Promise<void> {
  if (!pushSupported()) return;
  try {
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    if (!sub) return;
    await sub.unsubscribe();
    await fetch("/api/push/subscribe", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ endpoint: sub.endpoint }),
    });
  } catch (err) {
    console.error("[PushSubscribe] Unsubscribe failed:", err);
  }
}
