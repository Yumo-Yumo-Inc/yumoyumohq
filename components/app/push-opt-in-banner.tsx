"use client";

import { useEffect, useState } from "react";
import { Bell, X } from "lucide-react";
import { useAppLocale } from "@/lib/i18n/app-context";
import {
  isPushSubscribed,
  pushPermission,
  pushSupported,
  subscribeToPush,
} from "@/lib/app/push-subscribe";

type PushOptInBannerProps = {
  open: boolean;
  onDismiss: () => void;
  onSubscribed?: () => void;
};

export function PushOptInBanner({ open, onDismiss, onSubscribed }: PushOptInBannerProps) {
  const { t } = useAppLocale();
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    if (!open) return;
    void isPushSubscribed().then(setSubscribed);
  }, [open]);

  if (!open || hidden || !pushSupported()) return null;
  const perm = pushPermission();
  if (perm === "denied" || subscribed) return null;

  const title = t("app.pushOptIn.title");
  const body = t("app.pushOptIn.body");
  const enableLabel = t("app.pushOptIn.enable");
  const dismissLabel = t("app.pushOptIn.dismiss");

  const handleEnable = async () => {
    setLoading(true);
    try {
      const result = await subscribeToPush();
      if (result.ok) {
        setSubscribed(true);
        onSubscribed?.();
        onDismiss();
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDismiss = () => {
    setHidden(true);
    onDismiss();
  };

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-[60] flex justify-center px-4 pb-[max(1rem,env(safe-area-inset-bottom))]"
      role="region"
      aria-label={title}
    >
      <div
        className="flex w-full max-w-md items-start gap-3 rounded-2xl border border-white/[0.10] bg-[var(--app-bg-elevated)] p-4 shadow-[0_-12px_40px_rgba(0,0,0,0.45)]"
      >
        <div
          className="grid h-9 w-9 shrink-0 place-items-center rounded-xl"
          style={{
            background: "rgba(250,199,117,0.12)",
            border: "1px solid rgba(250,199,117,0.28)",
          }}
        >
          <Bell size={16} className="text-[#FAC775]" strokeWidth={2.2} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-semibold text-[var(--app-text-primary)]">{title}</p>
          <p className="mt-0.5 text-[12px] leading-snug text-[var(--app-text-muted)]">{body}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void handleEnable()}
              disabled={loading}
              className="rounded-full bg-[#FAC775] px-3.5 py-1.5 text-[12px] font-semibold text-[#1a1206] disabled:opacity-50"
            >
              {enableLabel}
            </button>
            <button
              type="button"
              onClick={handleDismiss}
              className="rounded-full px-3 py-1.5 text-[12px] font-medium text-[var(--app-text-muted)] hover:text-[var(--app-text-secondary)]"
            >
              {dismissLabel}
            </button>
          </div>
        </div>
        <button
          type="button"
          onClick={handleDismiss}
          className="shrink-0 rounded-full p-1 text-[var(--app-text-muted)] hover:text-[var(--app-text-secondary)]"
          aria-label={dismissLabel}
        >
          <X size={16} strokeWidth={2} />
        </button>
      </div>
    </div>
  );
}
