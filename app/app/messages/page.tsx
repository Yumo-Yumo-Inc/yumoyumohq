"use client";

/** Conversation list — one row per friend you've messaged, with the last message
 * and an unread count. Polls for freshness. Tap a row to open the thread. */

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MessageCircle } from "lucide-react";
import { AppShell } from "@/components/app/app-shell";
import { UserAvatar, UserName, type IdentityUser } from "@/components/social/user-identity";
import { useAppLocale } from "@/lib/i18n/app-context";
import { MESSAGING_ENABLED } from "@/config/features";

interface Conversation extends IdentityUser {
  lastBody: string; lastAt: string; lastFromMe: boolean; unread: number;
}

function when(iso: string, locale: string): string {
  try {
    const d = new Date(iso), now = new Date();
    const sameDay = d.toDateString() === now.toDateString();
    return sameDay
      ? d.toLocaleTimeString(locale === "tr" ? "tr-TR" : "en-US", { hour: "2-digit", minute: "2-digit" })
      : d.toLocaleDateString(locale === "tr" ? "tr-TR" : "en-US", { day: "2-digit", month: "2-digit" });
  } catch { return ""; }
}

export default function MessagesPage() {
  const router = useRouter();
  const { locale } = useAppLocale();
  const L = (tr: string, en: string) => (locale === "tr" ? tr : en);
  const [convos, setConvos] = useState<Conversation[]>([]);
  const [loaded, setLoaded] = useState(false);

  const load = useCallback(async () => {
    try {
      const r = await fetch("/api/messages", { credentials: "include", cache: "no-store" });
      const d = await r.json();
      setConvos(d.conversations ?? []);
    } catch { /* keep */ } finally { setLoaded(true); }
  }, []);
  useEffect(() => {
    if (!MESSAGING_ENABLED) { router.replace("/app/friends"); return; }
    void load();
    const id = setInterval(load, 10000);
    return () => clearInterval(id);
  }, [load, router]);

  if (!MESSAGING_ENABLED) return <AppShell><div className="p-6" /></AppShell>;

  const cardStyle: React.CSSProperties = {
    background: "linear-gradient(160deg, var(--app-bg-elevated, #161B29), var(--app-bg-surface, #0F1117))",
    border: "1px solid var(--app-border, rgba(255,255,255,0.1))", borderRadius: 16,
  };

  return (
    <AppShell>
      <div className="mx-auto max-w-2xl space-y-4 pb-10">
        <div className="flex items-center gap-2 pt-1">
          <MessageCircle className="h-5 w-5" style={{ color: "var(--app-primary)" }} />
          <h1 className="text-xl font-bold">{L("Mesajlar", "Messages")}</h1>
        </div>

        <div style={cardStyle}>
          <div className="p-2">
            {!loaded ? (
              <p className="p-4 text-[13px]" style={{ color: "var(--app-text-muted)" }}>{L("Yükleniyor…", "Loading…")}</p>
            ) : convos.length === 0 ? (
              <div className="rounded-xl px-4 py-8 text-center text-[13px]" style={{ color: "var(--app-text-muted)" }}>
                {L("Henüz sohbet yok. Arkadaşlar sayfasından birine mesaj at.", "No chats yet. Message a friend from the Friends page.")}
                <div className="mt-3"><Link href="/app/friends" className="rounded-lg px-3 py-1.5 text-[13px] font-bold" style={{ background: "var(--app-primary)", color: "#0b0d12" }}>{L("Arkadaşlar", "Friends")}</Link></div>
              </div>
            ) : (
              <div>
                {convos.map((c) => (
                  <Link key={c.username} href={`/app/messages/${encodeURIComponent(c.username)}`} className="flex items-center gap-3 rounded-xl px-2 py-2.5 transition hover:bg-white/[0.04]">
                    <UserAvatar u={c} size={44} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <UserName u={c} className="truncate font-semibold" />
                        <span className="shrink-0 text-[11px]" style={{ color: "var(--app-text-muted)" }}>{when(c.lastAt, locale)}</span>
                      </div>
                      <p className="truncate text-[13px]" style={{ color: c.unread > 0 && !c.lastFromMe ? "var(--app-text-primary)" : "var(--app-text-muted)" }}>
                        {c.lastFromMe ? <span style={{ color: "var(--app-text-muted)" }}>{L("Sen: ", "You: ")}</span> : null}{c.lastBody}
                      </p>
                    </div>
                    {c.unread > 0 && (
                      <span className="flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[11px] font-bold" style={{ background: "var(--app-primary)", color: "#0b0d12" }}>{c.unread}</span>
                    )}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
