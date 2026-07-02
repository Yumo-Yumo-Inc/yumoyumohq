"use client";

import { forwardRef, useCallback, useEffect, useImperativeHandle, useId, useRef, useState } from "react";

declare global {
  interface Window {
    turnstile?: {
      render: (
        element: HTMLElement,
        options: {
          sitekey: string;
          theme?: "light" | "dark" | "auto";
          execution?: "render" | "execute";
          appearance?: "always" | "execute" | "interaction-only";
          size?: "normal" | "compact" | "flexible";
          callback?: (token: string) => void;
          "expired-callback"?: () => void;
          "error-callback"?: () => void;
          "timeout-callback"?: () => void;
        }
      ) => string;
      execute: (widgetId?: string | HTMLElement) => void;
      reset: (widgetId?: string) => void;
      remove: (widgetId?: string) => void;
    };
  }
}

export interface TurnstileWidgetHandle {
  execute: () => Promise<string | null>;
  reset: () => void;
}

interface TurnstileWidgetProps {
  onTokenChange: (token: string | null) => void;
  resetKey?: number;
  execution?: "render" | "execute";
  appearance?: "always" | "execute" | "interaction-only";
}

const SCRIPT_ID = "cf-turnstile-script";

export const TurnstileWidget = forwardRef<TurnstileWidgetHandle, TurnstileWidgetProps>(function TurnstileWidget(
  { onTokenChange, resetKey = 0, execution = "render", appearance = "always" },
  ref
) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const widgetIdRef = useRef<string | null>(null);
  const tokenRef = useRef<string | null>(null);
  const pendingResolveRef = useRef<((token: string | null) => void) | null>(null);
  const renderId = useId();
  const [siteKey] = useState(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || "");
  const [ready, setReady] = useState(false);

  const resolvePending = useCallback((token: string | null) => {
    pendingResolveRef.current?.(token);
    pendingResolveRef.current = null;
  }, []);

  const clearToken = useCallback(() => {
    tokenRef.current = null;
    onTokenChange(null);
    resolvePending(null);
  }, [onTokenChange, resolvePending]);

  const resetWidget = useCallback(() => {
    clearToken();
    if (widgetIdRef.current && window.turnstile) {
      window.turnstile.reset(widgetIdRef.current);
    }
  }, [clearToken]);

  useImperativeHandle(ref, () => ({
    execute: async () => {
      if (!siteKey) {
        onTokenChange(null);
        return null;
      }

      if (tokenRef.current) {
        return tokenRef.current;
      }

      if (!widgetIdRef.current || !window.turnstile) {
        return null;
      }

      return new Promise<string | null>((resolve) => {
        pendingResolveRef.current = resolve;
        try {
          window.turnstile?.execute(widgetIdRef.current ?? undefined);
        } catch {
          resolvePending(null);
        }
      });
    },
    reset: resetWidget,
  }), [onTokenChange, resetWidget, resolvePending, siteKey]);

  useEffect(() => {
    if (!siteKey) {
      onTokenChange(null);
      return;
    }

    const existing = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;
    if (existing) {
      if (window.turnstile) {
        queueMicrotask(() => setReady(true));
      } else {
        existing.addEventListener("load", () => setReady(true), { once: true });
      }
      return;
    }

    const script = document.createElement("script");
    script.id = SCRIPT_ID;
    script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
    script.async = true;
    script.defer = true;
    script.onload = () => {
      setReady(true);
    };
    document.head.appendChild(script);
  }, [onTokenChange, siteKey]);

  useEffect(() => {
    const container = containerRef.current;
    const turnstile = window.turnstile;
    const guardBlocked = !ready || !siteKey || !container || !turnstile;
    if (guardBlocked) {
      return;
    }

    if (widgetIdRef.current) {
      window.turnstile?.remove(widgetIdRef.current);
      widgetIdRef.current = null;
    }

    clearToken();
    container.replaceChildren();
    widgetIdRef.current = turnstile.render(container, {
      sitekey: siteKey,
      theme: "dark",
      execution,
      appearance,
      size: "flexible",
      callback: (token) => {
        tokenRef.current = token;
        onTokenChange(token);
        resolvePending(token);
      },
      "expired-callback": clearToken,
      "error-callback": clearToken,
      "timeout-callback": clearToken,
    });

    return () => {
      clearToken();
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current);
        widgetIdRef.current = null;
      }
    };
  }, [appearance, clearToken, execution, onTokenChange, ready, renderId, resolvePending, siteKey]);

  useEffect(() => {
    resetWidget();
  }, [resetKey, resetWidget]);

  if (!siteKey) {
    return (
      <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-3 text-sm text-amber-100">
        Turnstile is not configured in this environment. Development bypass is active.
      </div>
    );
  }

  return <div ref={containerRef} className="min-h-[65px]" />;
});
