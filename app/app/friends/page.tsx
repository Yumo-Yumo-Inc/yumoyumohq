"use client";

/**
 * Friends — two tabs: "Friends" (search + requests + a friends-scoped mini
 * leaderboard ranked by hidden cost uncovered) and "My Network" (the referral
 * hub: bubble map + invitee cards, see components/app/network). Reuses the
 * avatar cosmetics (frame + sticker + name color) so friends look like they do
 * everywhere else.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/app/app-shell";
import { AvatarImage } from "@/components/app/avatar-image";
import { AvatarFrame } from "@/components/app/avatar-frame";
import { AvatarSticker } from "@/components/app/avatar-sticker";
import { NetworkPanel } from "@/components/app/network/network-panel";
import { useAppLocale } from "@/lib/i18n/app-context";
import { useTheme } from "@/lib/theme/theme-context";
import { resolveNameColorHex } from "@/config/name-colors";
import { MESSAGING_ENABLED } from "@/config/features";
import { UserPlus, Check, Clock, Users, Search, EyeOff, Flame, MessageCircle } from "lucide-react";

type ThemeMode = "light" | "dark";

interface BaseUser {
  username: string; displayName: string | null; avatarUrl: string | null;
  nameColor: string | null; profileFrame: string | null; avatarSticker: string | null;
}
interface FriendUser extends BaseUser { accountLevel: number; streak: number; receiptsVerified: number; hiddenCostUncovered: number; }
type SearchUser = BaseUser & { status: "none" | "friends" | "incoming" | "outgoing" };

function compact(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return String(Math.round(n));
}

function Avatar({ u, size, theme }: { u: BaseUser; size: number; theme: ThemeMode }) {
  const initials = (u.displayName || u.username || "?").slice(0, 2).toUpperCase();
  return (
    <span className="relative inline-flex shrink-0">
      <AvatarFrame frameKey={u.profileFrame}>
        <div className="grid place-items-center overflow-hidden rounded-full text-xs font-bold text-white"
          style={{ width: size, height: size, background: "linear-gradient(135deg,#ff7a1a,#ec4899,#3b82f6)" }}>
          {u.avatarUrl ? <AvatarImage src={u.avatarUrl} className="h-full w-full object-cover" /> : initials}
        </div>
      </AvatarFrame>
      <AvatarSticker stickerKey={u.avatarSticker} />
    </span>
  );
}

function Name({ u, theme }: { u: BaseUser; theme: ThemeMode }) {
  const color = resolveNameColorHex(u.nameColor, theme) ?? "var(--app-text-primary)";
  return <span className="truncate font-semibold" style={{ color }}>{u.displayName || u.username}</span>;
}

export default function FriendsPage() {
  const { locale } = useAppLocale();
  const { theme } = useTheme();
  const L = (tr: string, en: string) => (locale === "tr" ? tr : en);

  const [friends, setFriends] = useState<FriendUser[]>([]);
  const [incoming, setIncoming] = useState<BaseUser[]>([]);
  const [outgoing, setOutgoing] = useState<BaseUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [results, setResults] = useState<SearchUser[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [tab, setTab] = useState<"friends" | "network">("friends");
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Deep-link support: /app/friends?tab=network (used by the rewards card).
  useEffect(() => {
    if (typeof window !== "undefined" && new URLSearchParams(window.location.search).get("tab") === "network") {
      setTab("network");
    }
  }, []);

  const load = useCallback(async () => {
    try {
      const r = await fetch("/api/friends", { credentials: "include", cache: "no-store" });
      const d = await r.json();
      setFriends(d.friends ?? []); setIncoming(d.incoming ?? []); setOutgoing(d.outgoing ?? []);
    } catch { /* keep prior */ } finally { setLoading(false); }
  }, []);
  useEffect(() => { void load(); }, [load]);

  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    if (q.trim().length < 2) { setResults([]); return; }
    searchTimer.current = setTimeout(async () => {
      try {
        const r = await fetch(`/api/users/search?q=${encodeURIComponent(q.trim())}`, { credentials: "include", cache: "no-store" });
        const d = await r.json();
        setResults(d.results ?? []);
      } catch { setResults([]); }
    }, 300);
  }, [q]);

  const act = async (username: string, method: "POST" | "PATCH", action?: string) => {
    setBusy(username);
    try {
      await fetch("/api/friends", {
        method, credentials: "include", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(action ? { username, action } : { username }),
      });
      await load();
      // reflect new status in search results
      setResults((prev) => prev.map((u) => u.username === username
        ? { ...u, status: action === "reject" || action === "remove" ? "none" : action === "accept" ? "friends" : method === "POST" ? "outgoing" : u.status }
        : u));
    } finally { setBusy(null); }
  };

  const cardStyle: React.CSSProperties = {
    background: "linear-gradient(160deg, var(--app-bg-elevated, #161B29), var(--app-bg-surface, #0F1117))",
    border: "1px solid var(--app-border, rgba(255,255,255,0.1))", borderRadius: 16,
  };
  const pillBtn = (bg: string, color: string): React.CSSProperties => ({ background: bg, color, borderRadius: 10, border: "1px solid transparent" });

  return (
    <AppShell>
      <div className="mx-auto max-w-2xl space-y-4 pb-10">
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5" style={{ color: "var(--app-primary)" }} />
            <h1 className="text-xl font-bold">{L("Arkadaşlar", "Friends")}</h1>
          </div>
          {MESSAGING_ENABLED && (
            <Link href="/app/messages" className="flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[13px] font-semibold" style={{ borderColor: "var(--app-border)", color: "var(--app-text-secondary)" }}>
              <MessageCircle className="h-4 w-4" />{L("Mesajlar", "Messages")}
            </Link>
          )}
        </div>

        {/* Tabs: Friends | My Network */}
        <div
          className="flex gap-1.5 rounded-full p-1"
          style={{ backgroundColor: "var(--app-bg-elevated)", border: "1px solid var(--app-border)" }}
        >
          {([
            { key: "friends" as const, label: L("Arkadaşlar", "Friends") },
            { key: "network" as const, label: L("Ağım", "My Network") },
          ]).map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className="flex-1 rounded-full py-2 text-[13px] font-semibold transition-colors"
              style={
                tab === t.key
                  ? {
                      color: "#0F1117",
                      fontWeight: 750,
                      background: "linear-gradient(120deg, #10B981, #3B82F6 55%, #8B5CF6)",
                      boxShadow: "0 6px 18px -6px rgba(59,130,246,0.55)",
                    }
                  : { color: "var(--app-text-secondary)" }
              }
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === "network" ? (
          <NetworkPanel />
        ) : (
          <>
        {/* Search / add */}
        <div style={cardStyle}>
          <div className="p-4">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: "var(--app-text-muted)" }} />
              <input
                value={q} onChange={(e) => setQ(e.target.value)}
                placeholder={L("Kullanıcı adı veya isimle ara…", "Search by username or name…")}
                className="h-11 w-full rounded-xl border pl-10 pr-3 text-[15px] outline-none"
                style={{ background: "var(--app-bg-base, rgba(255,255,255,0.04))", borderColor: "var(--app-border)", color: "var(--app-text-primary)" }}
              />
            </div>
            {results.length > 0 && (
              <div className="mt-3 space-y-2">
                {results.map((u) => (
                  <div key={u.username} className="flex items-center gap-3">
                    <Avatar u={u} size={38} theme={theme} />
                    <div className="min-w-0 flex-1"><Name u={u} theme={theme} /><p className="truncate text-[11px]" style={{ color: "var(--app-text-muted)" }}>@{u.username}</p></div>
                    {u.status === "friends" ? (
                      <span className="flex items-center gap-1 px-2 py-1 text-[12px] font-semibold" style={{ color: "#34d399" }}><Check className="h-3.5 w-3.5" />{L("Arkadaş", "Friends")}</span>
                    ) : u.status === "outgoing" ? (
                      <span className="flex items-center gap-1 px-2 py-1 text-[12px] font-semibold" style={{ color: "var(--app-text-muted)" }}><Clock className="h-3.5 w-3.5" />{L("Beklemede", "Pending")}</span>
                    ) : u.status === "incoming" ? (
                      <button disabled={busy === u.username} onClick={() => act(u.username, "PATCH", "accept")} className="px-3 py-1.5 text-[12px] font-bold" style={pillBtn("var(--app-primary)", "#0b0d12")}>{L("Kabul et", "Accept")}</button>
                    ) : (
                      <button disabled={busy === u.username} onClick={() => act(u.username, "POST")} className="flex items-center gap-1 px-3 py-1.5 text-[12px] font-bold" style={pillBtn("var(--app-primary)", "#0b0d12")}><UserPlus className="h-3.5 w-3.5" />{L("Ekle", "Add")}</button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Incoming requests */}
        {incoming.length > 0 && (
          <div style={cardStyle}>
            <div className="p-4">
              <h3 className="mb-3 text-[13px] font-bold uppercase tracking-wide" style={{ color: "var(--app-text-muted)" }}>{L("İstekler", "Requests")} · {incoming.length}</h3>
              <div className="space-y-2">
                {incoming.map((u) => (
                  <div key={u.username} className="flex items-center gap-3">
                    <Avatar u={u} size={38} theme={theme} />
                    <div className="min-w-0 flex-1"><Name u={u} theme={theme} /><p className="truncate text-[11px]" style={{ color: "var(--app-text-muted)" }}>@{u.username}</p></div>
                    <button disabled={busy === u.username} onClick={() => act(u.username, "PATCH", "accept")} className="px-3 py-1.5 text-[12px] font-bold" style={pillBtn("var(--app-primary)", "#0b0d12")}>{L("Kabul", "Accept")}</button>
                    <button disabled={busy === u.username} onClick={() => act(u.username, "PATCH", "reject")} className="px-3 py-1.5 text-[12px] font-semibold" style={pillBtn("rgba(255,255,255,0.06)", "var(--app-text-secondary)")}>{L("Yok", "Ignore")}</button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Friends list — mini leaderboard by hidden cost uncovered */}
        <div style={cardStyle}>
          <div className="p-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-[13px] font-bold uppercase tracking-wide" style={{ color: "var(--app-text-muted)" }}>{L("Arkadaşların", "Your friends")} · {friends.length}</h3>
              {friends.length > 0 && <span className="flex items-center gap-1 text-[11px]" style={{ color: "var(--app-text-muted)" }}><EyeOff className="h-3 w-3" />{L("gizli maliyet", "hidden cost")}</span>}
            </div>
            {loading ? (
              <p className="text-[13px]" style={{ color: "var(--app-text-muted)" }}>{L("Yükleniyor…", "Loading…")}</p>
            ) : friends.length === 0 ? (
              <div className="rounded-xl px-4 py-8 text-center text-[13px]" style={{ background: "var(--app-bg-base)", border: "1px dashed var(--app-border)", color: "var(--app-text-muted)" }}>
                {L("Henüz arkadaşın yok. Yukarıdan arayıp ekle.", "No friends yet. Search above to add some.")}
              </div>
            ) : (
              <div className="space-y-2.5">
                {friends.map((u, i) => (
                  <div key={u.username} className="flex items-center gap-3">
                    <span className="w-5 shrink-0 text-center font-mono text-[12px] font-bold tabular-nums" style={{ color: "var(--app-text-muted)" }}>{i + 1}</span>
                    <Avatar u={u} size={40} theme={theme} />
                    <div className="min-w-0 flex-1">
                      <Name u={u} theme={theme} />
                      <p className="flex items-center gap-2 text-[11px]" style={{ color: "var(--app-text-muted)" }}>
                        Lv.{u.accountLevel} · {u.receiptsVerified} {L("fiş", "receipts")}
                        {u.streak > 0 && <span className="flex items-center gap-0.5"><Flame className="h-3 w-3" style={{ color: "#F2803D" }} />{u.streak}</span>}
                      </p>
                    </div>
                    <span className="font-mono text-sm font-bold tabular-nums" style={{ color: "var(--app-primary)" }}>{compact(u.hiddenCostUncovered)}</span>
                    {MESSAGING_ENABLED && (
                      <Link href={`/app/messages/${encodeURIComponent(u.username)}`} className="flex h-8 w-8 items-center justify-center rounded-lg border" style={{ borderColor: "var(--app-border)" }} aria-label={L("Mesaj", "Message")}>
                        <MessageCircle className="h-4 w-4" style={{ color: "var(--app-text-secondary)" }} />
                      </Link>
                    )}
                    <button disabled={busy === u.username} onClick={() => act(u.username, "PATCH", "remove")} className="px-2 py-1 text-[11px] font-semibold" style={{ color: "var(--app-text-muted)" }}>{L("Çıkar", "Remove")}</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
          </>
        )}
      </div>
    </AppShell>
  );
}
