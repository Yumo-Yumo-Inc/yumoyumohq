"use client";

import { useCallback, useEffect, useState } from "react";
import { CalendarClock, Loader2, Play, Square } from "lucide-react";

/**
 * Founder season control — open / close the gamification season from the admin
 * panel instead of hitting /api/admin/season by hand. Manual start is a founder
 * action (no auto-open); the cron only closes.
 */

type SeasonRow = {
  id: number;
  season_number: number;
  name: string;
  start_at: string;
  end_at: string;
  status: string;
  closed_at: string | null;
};

type SeasonData = {
  seasons: SeasonRow[];
  active: SeasonRow | null;
  genesisConfig: { seasonNumber: number; name: string; durationDays: number } | null;
  serverNow: string;
};

function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("tr-TR", { day: "2-digit", month: "short", year: "numeric" });
}

function daysLeft(end: string, now: string): number {
  const ms = new Date(end).getTime() - new Date(now).getTime();
  return Math.max(0, Math.ceil(ms / (24 * 60 * 60 * 1000)));
}

export function SeasonControlCard() {
  const [data, setData] = useState<SeasonData | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ tone: "ok" | "err"; text: string } | null>(null);
  const [openNumber, setOpenNumber] = useState<number | "">("");
  const [openName, setOpenName] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/season");
      const d = (await res.json()) as SeasonData & { error?: string };
      if (!res.ok) throw new Error(d.error || `HTTP ${res.status}`);
      setData(d);
      const maxNum = Math.max(0, ...(d.seasons ?? []).map((s) => s.season_number));
      const suggest = d.active ? d.active.season_number + 1 : maxNum + 1;
      setOpenNumber(suggest);
      setOpenName(d.genesisConfig?.seasonNumber === suggest ? d.genesisConfig.name : "");
    } catch (e) {
      setMsg({ tone: "err", text: e instanceof Error ? e.message : "Yüklenemedi" });
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const post = async (body: Record<string, unknown>, okText: string) => {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/admin/season", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      const d = (await res.json()) as { error?: string; awarded?: number };
      if (!res.ok) throw new Error(d.error || `HTTP ${res.status}`);
      setMsg({
        tone: "ok",
        text: typeof d.awarded === "number" ? `${okText} · ${d.awarded} ödül dağıtıldı` : okText,
      });
      await load();
    } catch (e) {
      setMsg({ tone: "err", text: e instanceof Error ? e.message : "İşlem başarısız" });
    }
    setBusy(false);
  };

  const closeActive = () => {
    const active = data?.active;
    if (!active) return;
    if (
      !window.confirm(
        `"${active.name}" (#${active.season_number}) KAPATILACAK. Kapanışta uygun katılımcılara tier ödülü + rozet verilir ve herkesin sezon XP'si sıfırlanır. Devam?`,
      )
    )
      return;
    void post({ action: "close", seasonNumber: active.season_number }, `Sezon #${active.season_number} kapatıldı`);
  };

  const openSeason = () => {
    if (openNumber === "" || !openName.trim()) {
      setMsg({ tone: "err", text: "Sezon numarası ve ad gerekli" });
      return;
    }
    if (data?.active) {
      setMsg({ tone: "err", text: `Önce aktif sezon (#${data.active.season_number}) kapatılmalı` });
      return;
    }
    if (
      !window.confirm(
        `Sezon #${openNumber} "${openName.trim()}" AÇILACAK ve herkesin sezon XP'si sıfırlanacak. Devam?`,
      )
    )
      return;
    void post(
      { action: "open", seasonNumber: Number(openNumber), name: openName.trim() },
      `Sezon #${openNumber} açıldı`,
    );
  };

  const active = data?.active ?? null;

  return (
    <section className="rounded-md border border-white/10 bg-white/[0.035] p-4">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-white">Sezon kontrolü</h2>
          <p className="mt-1 text-sm text-white/40">Gamification sezonunu aç / kapat (founder aksiyonu)</p>
        </div>
        <CalendarClock size={18} className="text-white/35" />
      </div>

      {loading && !data ? (
        <div className="flex min-h-24 items-center justify-center gap-2 text-white/45">
          <Loader2 size={16} className="animate-spin" />
          <span className="text-sm">Yükleniyor…</span>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Active season */}
          {active ? (
            <div className="rounded-md border border-emerald-400/25 bg-emerald-400/[0.07] p-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-medium uppercase tracking-[0.16em] text-emerald-200/70">Aktif sezon</p>
                  <p className="mt-1 text-lg font-semibold text-white">
                    #{active.season_number} · {active.name}
                  </p>
                  <p className="mt-0.5 text-sm text-white/45">
                    Bitiş {fmtDate(active.end_at)} · {data ? daysLeft(active.end_at, data.serverNow) : "?"} gün kaldı
                  </p>
                </div>
                <button
                  type="button"
                  onClick={closeActive}
                  disabled={busy}
                  className="inline-flex items-center gap-1.5 rounded-md border border-red-400/30 bg-red-400/10 px-3 py-2 text-sm font-semibold text-red-200 transition-colors hover:bg-red-400/20 disabled:opacity-50"
                >
                  {busy ? <Loader2 size={15} className="animate-spin" /> : <Square size={15} />}
                  Kapat
                </button>
              </div>
            </div>
          ) : (
            <div className="rounded-md border border-white/10 bg-black/20 p-3">
              <p className="text-sm text-white/55">Aktif sezon yok — yeni sezon aç.</p>
            </div>
          )}

          {/* Open next season */}
          <div className="rounded-md border border-white/10 bg-black/20 p-3">
            <p className="mb-2 text-xs font-medium uppercase tracking-[0.16em] text-white/35">Yeni sezon aç</p>
            <div className="flex flex-wrap items-end gap-2">
              <label className="flex flex-col gap-1">
                <span className="text-xs text-white/40">No</span>
                <input
                  type="number"
                  min={1}
                  value={openNumber}
                  onChange={(e) => setOpenNumber(e.target.value === "" ? "" : Number(e.target.value))}
                  className="w-20 rounded-md border border-white/15 bg-white/[0.04] px-2 py-1.5 text-sm text-white outline-none focus:border-white/35"
                />
              </label>
              <label className="flex min-w-40 flex-1 flex-col gap-1">
                <span className="text-xs text-white/40">Ad</span>
                <input
                  type="text"
                  value={openName}
                  onChange={(e) => setOpenName(e.target.value)}
                  placeholder="Genesis"
                  className="w-full rounded-md border border-white/15 bg-white/[0.04] px-2 py-1.5 text-sm text-white outline-none focus:border-white/35"
                />
              </label>
              <button
                type="button"
                onClick={openSeason}
                disabled={busy || !!active}
                title={active ? "Önce aktif sezonu kapat" : undefined}
                className="inline-flex items-center gap-1.5 rounded-md bg-white px-3 py-2 text-sm font-semibold text-[#0a0c10] transition-colors hover:bg-white/85 disabled:opacity-40"
              >
                {busy ? <Loader2 size={15} className="animate-spin" /> : <Play size={15} />}
                Aç
              </button>
            </div>
          </div>

          {/* Message */}
          {msg && (
            <div
              className={`rounded-md border px-3 py-2 text-sm ${
                msg.tone === "ok"
                  ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-200"
                  : "border-red-400/30 bg-red-400/10 text-red-200"
              }`}
            >
              {msg.text}
            </div>
          )}

          {/* Season history */}
          {data && data.seasons.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-medium uppercase tracking-[0.16em] text-white/35">Sezon geçmişi</p>
              <div className="space-y-1.5">
                {data.seasons.map((s) => (
                  <div
                    key={s.id}
                    className="flex items-center justify-between gap-3 rounded-md border border-white/10 bg-white/[0.02] px-3 py-2 text-sm"
                  >
                    <span className="font-medium text-white/80">
                      #{s.season_number} · {s.name}
                    </span>
                    <span className="flex items-center gap-3 text-white/40">
                      <span>{fmtDate(s.start_at)} → {fmtDate(s.end_at)}</span>
                      <span
                        className={`rounded px-1.5 py-0.5 text-xs font-semibold ${
                          s.status === "active"
                            ? "bg-emerald-400/15 text-emerald-200"
                            : "bg-white/10 text-white/50"
                        }`}
                      >
                        {s.status}
                      </span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
