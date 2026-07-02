"use client";

/**
 * Yumbie chat panel. Rendered through a PORTAL to document.body so no ancestor
 * stacking context / overflow can trap or clip it (the earlier bug: only the
 * backdrop showed). Plain fixed layout + a CSS slide-up — no framer-motion.
 */
import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useYumbieChatStore } from "./useYumbieChatStore";
import { useAppProfile } from "@/lib/app/profile-context";
import { useAppLocale } from "@/lib/i18n/app-context";
import { cn } from "@/lib/utils";

function pageKey(pathname: string): "dashboard" | "receipts" | "rewards" | "default" {
  if (/^\/app\/receipts/.test(pathname)) return "receipts";
  if (/^\/app\/rewards/.test(pathname)) return "rewards";
  if (/^\/app(\/dashboard)?\/?$/.test(pathname)) return "dashboard";
  return "default";
}

const CHIPS: Record<string, Array<{ key: string; href?: string }>> = {
  dashboard: [{ key: "todayEarned" }, { key: "giveTip" }],
  receipts: [{ key: "showLastReceipt", href: "/app/receipts" }, { key: "monthSpend" }],
  rewards: [{ key: "myCpoints" }],
  default: [{ key: "whatsHere" }, { key: "help" }],
};

export function YumbieChat() {
  const { open, messages, loading, closeChat, push, setLoading } = useYumbieChatStore();
  const { profile } = useAppProfile();
  const { t, locale } = useAppLocale();
  const pathname = usePathname() ?? "";
  const router = useRouter();
  const [text, setText] = useState("");
  const [mounted, setMounted] = useState(false);
  const listRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => setMounted(true), []);
  useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages, open, loading]);

  const send = async (raw: string) => {
    const msg = raw.trim();
    if (!msg || loading) return;
    const prior = useYumbieChatStore.getState().messages.slice(-6).map((m) => ({ role: m.role, text: m.text }));
    push("user", msg);
    setText("");
    setLoading(true);
    try {
      const res = await fetch("/api/yumbie/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: msg,
          history: prior,
          context: {
            page: pageKey(pathname),
            cPoints: Math.round(profile?.contributionPoints?.total ?? 0),
            streak: profile?.streak ?? 0,
            locale,
          },
        }),
      });
      const data = (await res.json().catch(() => ({ reply: "" }))) as { reply?: string };
      push("yumbie", data?.reply || t("yumbie.chat.fallback"));
    } catch {
      push("yumbie", t("yumbie.chat.fallback"));
    } finally {
      setLoading(false);
    }
  };

  if (!mounted || !open) return null;

  const chips = CHIPS[pageKey(pathname)] ?? CHIPS.default;

  return (
    // Inline panel inside the Yumbie dock (where the message line sits) — no
    // portal/fixed, so it can't be trapped under the app's z-9999 overlay layer.
    <div role="dialog" aria-label="Yumbie" className="flex w-full flex-col bg-[var(--app-bg-base)]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="inline-block h-6 w-6 rounded-full bg-[#F2C14E]" aria-hidden />
            <span className="text-[13px] font-black uppercase tracking-[0.18em] text-[#ffb347]">Yumbie</span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={closeChat}
              className="rounded-full px-2 py-1 text-[15px] text-white/50 hover:text-white/90"
              aria-label={t("yumbie.chat.close")}
            >
              ✕
            </button>
          </div>
        </div>

        {/* Messages */}
        <div ref={listRef} className="max-h-[42vh] min-h-[88px] flex-1 space-y-2 overflow-y-auto px-4 py-3">
          {messages.length === 0 && (
            <p className="py-3 text-center text-[13px] text-white/55">{t("yumbie.chat.greeting")}</p>
          )}
          {messages.map((m) => (
            <div key={m.id} className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}>
              <div
                className={cn(
                  "max-w-[82%] rounded-2xl px-3 py-2 text-[13.5px] leading-[1.5]",
                  m.role === "user"
                    ? "bg-[#ffb347] text-[#1a1206]"
                    : "border border-white/[0.08] bg-white/[0.05] text-white/90"
                )}
              >
                {m.text}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="rounded-2xl border border-white/[0.08] bg-white/[0.05] px-3 py-2 text-[13px] text-white/55">
                {t("yumbie.chat.thinking")}
              </div>
            </div>
          )}
        </div>

        {/* Chips */}
        <div className="flex flex-wrap gap-2 px-4 pb-2">
          {chips.map((c) => {
            const label = t(`yumbie.chat.chips.${c.key}`);
            return (
              <button
                key={c.key}
                onClick={() => {
                  if (c.href) {
                    if (!pathname.startsWith(c.href)) router.push(c.href);
                    closeChat();
                    return;
                  }
                  void send(label);
                }}
                className="rounded-full border border-[var(--app-border)] bg-[var(--app-bg-elevated)] px-3 py-1.5 text-[12px] text-[var(--app-text-secondary)] hover:opacity-80"
              >
                {label}
              </button>
            );
          })}
        </div>

        {/* Input */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void send(text);
          }}
          className="flex items-center gap-2 border-t border-white/[0.06] px-3 py-2.5"
        >
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={t("yumbie.chat.placeholder")}
            className="min-w-0 flex-1 rounded-full border border-white/[0.10] bg-white/[0.04] px-4 py-2 text-[14px] text-white placeholder:text-white/35 focus:border-[#ffb347]/50 focus:outline-none"
          />
          <button
            type="submit"
            disabled={loading || !text.trim()}
            className="shrink-0 rounded-full bg-[#ffb347] px-4 py-2 text-[13px] font-bold text-[#1a1206] disabled:opacity-40"
          >
            {t("yumbie.chat.send")}
          </button>
        </form>
    </div>
  );
}
