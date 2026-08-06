"use client";

/**
 * Direct-message thread with a friend. Polls the thread every 5s while open
 * (no realtime infra — fits the serverless stack). Marks incoming messages read
 * on load. Friends-only (server enforces).
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Send } from "lucide-react";
import { AppShell } from "@/components/app/app-shell";
import { UserAvatar, UserName, type IdentityUser } from "@/components/social/user-identity";
import { useAppLocale } from "@/lib/i18n/app-context";
import { MESSAGING_ENABLED } from "@/config/features";

interface Msg { id: number; sender: string; body: string; createdAt: string; mine: boolean; }
const POLL_MS = 5000;

function hhmm(iso: string, locale: string): string {
  try { return new Date(iso).toLocaleTimeString(locale === "tr" ? "tr-TR" : "en-US", { hour: "2-digit", minute: "2-digit" }); }
  catch { return ""; }
}

export default function MessageThreadPage() {
  const params = useParams();
  const router = useRouter();
  const { locale } = useAppLocale();
  const L = (tr: string, en: string) => (locale === "tr" ? tr : en);
  const other = decodeURIComponent(String(params?.username ?? ""));

  const [partner, setPartner] = useState<IdentityUser | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [text, setText] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [forbidden, setForbidden] = useState(false);
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const atBottomRef = useRef(true);

  const fetchThread = useCallback(async () => {
    try {
      const r = await fetch(`/api/messages?with=${encodeURIComponent(other)}`, { credentials: "include", cache: "no-store" });
      if (r.status === 403) { setForbidden(true); return; }
      const d = await r.json();
      if (d.partner) setPartner(d.partner);
      if (Array.isArray(d.messages)) setMessages(d.messages);
    } catch { /* keep prior */ } finally { setLoaded(true); }
  }, [other]);

  useEffect(() => {
    if (!MESSAGING_ENABLED) { router.replace("/app/friends"); return; }
    void fetchThread();
    const id = setInterval(fetchThread, POLL_MS);
    return () => clearInterval(id);
  }, [fetchThread, router]);

  // auto-scroll to bottom when new messages arrive and we were already at bottom
  useEffect(() => {
    const el = scrollRef.current;
    if (el && atBottomRef.current) el.scrollTop = el.scrollHeight;
  }, [messages]);

  const onScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    atBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 60;
  };

  const send = async () => {
    const body = text.trim();
    if (!body || sending) return;
    setSending(true);
    setText("");
    // optimistic
    const temp: Msg = { id: -Date.now(), sender: "me", body, createdAt: new Date().toISOString(), mine: true };
    atBottomRef.current = true;
    setMessages((m) => [...m, temp]);
    try {
      await fetch("/api/messages", { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ to: other, body }) });
      await fetchThread();
    } catch { /* leave optimistic */ } finally { setSending(false); }
  };

  if (!MESSAGING_ENABLED) return <AppShell><div className="p-6" /></AppShell>;

  return (
    <AppShell>
      <div className="mx-auto flex h-[calc(100dvh-160px)] max-w-2xl flex-col">
        {/* header */}
        <div className="flex items-center gap-3 border-b py-2" style={{ borderColor: "var(--app-border)" }}>
          <button onClick={() => router.push("/app/messages")} className="flex h-8 w-8 items-center justify-center rounded-lg border" style={{ borderColor: "var(--app-border)" }} aria-label="Back">
            <ArrowLeft className="h-4 w-4" style={{ color: "var(--app-text-muted)" }} />
          </button>
          {partner ? (
            <>
              <UserAvatar u={partner} size={36} />
              <div className="min-w-0"><UserName u={partner} className="font-bold" /><p className="truncate text-[11px]" style={{ color: "var(--app-text-muted)" }}>@{partner.username}</p></div>
            </>
          ) : <span className="font-bold">@{other}</span>}
        </div>

        {/* messages */}
        <div ref={scrollRef} onScroll={onScroll} className="flex-1 space-y-2 overflow-y-auto py-3">
          {forbidden ? (
            <p className="mt-6 text-center text-[13px]" style={{ color: "var(--app-text-muted)" }}>{L("Yalnızca arkadaşlarınla mesajlaşabilirsin.", "You can only message your friends.")}</p>
          ) : !loaded ? (
            <p className="text-center text-[13px]" style={{ color: "var(--app-text-muted)" }}>{L("Yükleniyor…", "Loading…")}</p>
          ) : messages.length === 0 ? (
            <p className="mt-6 text-center text-[13px]" style={{ color: "var(--app-text-muted)" }}>{L("Henüz mesaj yok. Selam ver 👋", "No messages yet. Say hi 👋")}</p>
          ) : (
            messages.map((m) => (
              <div key={m.id} className={`flex ${m.mine ? "justify-end" : "justify-start"}`}>
                <div className="max-w-[78%] rounded-2xl px-3 py-2" style={m.mine
                  ? { background: "var(--app-primary)", color: "#0b0d12", borderBottomRightRadius: 6 }
                  : { background: "var(--app-bg-elevated, rgba(255,255,255,0.06))", color: "var(--app-text-primary)", border: "1px solid var(--app-border)", borderBottomLeftRadius: 6 }}>
                  <p className="whitespace-pre-wrap break-words text-[14px] leading-snug">{m.body}</p>
                  <p className="mt-0.5 text-right text-[10px]" style={{ opacity: 0.6 }}>{hhmm(m.createdAt, locale)}</p>
                </div>
              </div>
            ))
          )}
        </div>

        {/* composer */}
        {!forbidden && (
          <div className="flex items-center gap-2 border-t py-2" style={{ borderColor: "var(--app-border)" }}>
            <input
              value={text} onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void send(); } }}
              placeholder={L("Mesaj yaz…", "Write a message…")} maxLength={2000}
              className="h-11 flex-1 rounded-full border px-4 text-[15px] outline-none"
              style={{ background: "var(--app-bg-base, rgba(255,255,255,0.04))", borderColor: "var(--app-border)", color: "var(--app-text-primary)" }}
            />
            <button onClick={send} disabled={sending || !text.trim()} className="flex h-11 w-11 items-center justify-center rounded-full disabled:opacity-40" style={{ background: "var(--app-primary)", color: "#0b0d12" }} aria-label="Send">
              <Send className="h-5 w-5" />
            </button>
          </div>
        )}
      </div>
    </AppShell>
  );
}
