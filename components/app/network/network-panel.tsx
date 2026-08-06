"use client";

/**
 * "My Network" tab — the referral hub inside Friends. Bubblemaps-style map of
 * everyone the user invited (see bubble-map.tsx for the encoding), network
 * totals, the short invite link, the network origin (who invited me), and a
 * sortable list of invitee cards. Tapping a bubble highlights its card.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { Link2, Loader2, Share2, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { useAppLocale } from "@/lib/i18n/app-context";
import type { TraitKey } from "@/lib/insights/identity/identity-types";
import { TRAIT_ACCENT } from "@/app/app/patterns/identity-copy";
import { BubbleMap, type BubbleNode } from "./bubble-map";
import { InviteeCard, type NetworkInvitee } from "./invitee-card";

interface NetworkPayload {
  invitees: NetworkInvitee[];
  summary: { invited: number; active: number; completed: number; earnedTotal: number };
  origin: { username: string; displayName: string | null } | null;
}

type SortKey = "active" | "new" | "completed" | "passive";

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function NetworkPanel() {
  const { locale } = useAppLocale();
  const l = (tr: string, en: string, ru: string, th: string, es: string, zh: string) =>
    locale === "tr" ? tr : locale === "ru" ? ru : locale === "th" ? th : locale === "es" ? es : locale === "zh" ? zh : en;

  const [data, setData] = useState<NetworkPayload | null>(null);
  const [link, setLink] = useState<string | null>(null);
  const [meName, setMeName] = useState<string>("?");
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<string | null>(null);
  const [sort, setSort] = useState<SortKey>("active");

  useEffect(() => {
    (async () => {
      try {
        const [netRes, linkRes] = await Promise.all([
          fetch("/api/referral/network", { credentials: "include", cache: "no-store" }),
          fetch("/api/referral/link", { credentials: "include" }),
        ]);
        if (netRes.ok) setData(await netRes.json());
        if (linkRes.ok) {
          const d = await linkRes.json();
          if (typeof d?.link === "string") setLink(d.link);
          if (typeof d?.username === "string") setMeName(d.username);
        }
      } catch {
        /* keep empty state */
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const share = useCallback(async () => {
    if (!link) return;
    // URL only — no title/text. Share targets that merge the fields would
    // otherwise glue the copy onto the link and break the ref code.
    if (navigator.share) {
      try {
        await navigator.share({ url: link });
        return;
      } catch {
        /* cancelled → copy below */
      }
    }
    try {
      await navigator.clipboard.writeText(link);
      toast.success(l("Davet linki kopyalandı!", "Invite link copied!", "Ссылка скопирована!", "คัดลอกลิงก์แล้ว!", "¡Enlace copiado!", "已复制邀请链接！"));
    } catch {
      toast.error(l("Kopyalanamadı", "Could not copy", "Не удалось", "คัดลอกไม่สำเร็จ", "No se pudo", "复制失败"));
    }
  }, [link, l]);

  const bubbles = useMemo<BubbleNode[]>(
    () =>
      (data?.invitees ?? []).map((i) => ({
        username: i.username,
        label: initials(i.displayName),
        receipts: i.receipts,
        color: i.archetype?.primary ? TRAIT_ACCENT[i.archetype.primary as TraitKey] : null,
        completed: i.completed,
        dim: !i.isActive,
      })),
    [data],
  );

  const sorted = useMemo(() => {
    const list = [...(data?.invitees ?? [])];
    switch (sort) {
      case "new":
        return list.sort((a, b) => +new Date(b.joinedAt) - +new Date(a.joinedAt));
      case "completed":
        return list.sort((a, b) => Number(b.completed) - Number(a.completed) || b.earnedByMe - a.earnedByMe);
      case "passive":
        return list.sort((a, b) => Number(a.isActive) - Number(b.isActive) || a.activeDays - b.activeDays);
      default:
        return list.sort((a, b) => b.activeDays - a.activeDays);
    }
  }, [data, sort]);

  const onBubble = useCallback((username: string) => {
    setSelected(username);
    document.getElementById(`invitee-${username}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-5 w-5 animate-spin" style={{ color: "var(--app-text-muted)" }} />
      </div>
    );
  }

  const summary = data?.summary ?? { invited: 0, active: 0, completed: 0, earnedTotal: 0 };
  const hasNetwork = (data?.invitees.length ?? 0) > 0;

  const sortChips: { key: SortKey; label: string }[] = [
    { key: "active", label: l("En aktif", "Most active", "Активные", "ใช้งานมาก", "Más activos", "最活跃") },
    { key: "new", label: l("Yeni", "Newest", "Новые", "ใหม่", "Nuevos", "最新") },
    { key: "completed", label: "3/3 ✦" },
    { key: "passive", label: l("Pasif", "Inactive", "Пассивные", "ไม่ใช้งาน", "Inactivos", "不活跃") },
  ];

  return (
    <div className="space-y-3">
      {/* ── hero: bubble map + totals + invite link ── */}
      <div
        className="relative overflow-hidden rounded-[22px] p-3 pb-3.5"
        style={{
          background: "linear-gradient(165deg, #1B2233 0%, var(--app-bg-base, #0F1117) 70%)",
          border: "1px solid var(--app-border-strong)",
        }}
      >
        <span
          className="pointer-events-none absolute inset-x-0 top-0 h-px"
          style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.28), transparent)" }}
        />
        <span className="pointer-events-none absolute -left-24 -top-32 h-72 w-72 rounded-full opacity-25" style={{ backgroundColor: "#8B5CF6", filter: "blur(60px)" }} />
        <span className="pointer-events-none absolute -bottom-36 -right-24 h-72 w-72 rounded-full opacity-25" style={{ backgroundColor: "#10B981", filter: "blur(60px)" }} />

        {hasNetwork ? (
          <BubbleMap nodes={bubbles} meLabel={initials(meName)} selected={selected} onSelect={onBubble} />
        ) : (
          <div className="relative flex flex-col items-center gap-3 py-10 text-center">
            <span
              className="grid h-14 w-14 place-items-center rounded-full"
              style={{ border: "2px solid var(--app-gold-light)", boxShadow: "0 0 26px -4px var(--app-gold)", color: "var(--app-gold-light)" }}
            >
              <UserPlus className="h-6 w-6" />
            </span>
            <p className="text-sm font-bold" style={{ color: "var(--app-text-primary)" }}>
              {l("Ağın seni bekliyor", "Your network awaits", "Ваша сеть ждёт", "เครือข่ายรอคุณ", "Tu red te espera", "你的网络在等你")}
            </p>
            <p className="max-w-[16rem] text-xs leading-relaxed" style={{ color: "var(--app-text-secondary)" }}>
              {l(
                "Bir arkadaşınla fiyat hafızası kur. İlk fişini doğrulattığında ikiniz de bonus kazanırsınız.",
                "Build price memory with a friend. You both unlock a bonus after their first verified receipt.",
                "Строй память о ценах с другом — вы оба получите бонус после первого чека.",
                "สร้างความทรงจำราคากับเพื่อน ทั้งคู่ได้โบนัสเมื่อยืนยันใบเสร็จแรก",
                "Crea memoria de precios con un amigo. Ambos ganan un bono tras su primer recibo.",
                "和朋友建立价格记忆。好友验证首张小票后你们都能获得奖励。",
              )}
            </p>
          </div>
        )}

        {hasNetwork && (
          <div className="flex flex-wrap gap-x-3.5 gap-y-1.5 px-1.5 pb-1 pt-2 text-[9.5px] font-semibold" style={{ color: "var(--app-text-muted)" }}>
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full" style={{ backgroundColor: "#10B981" }} />{l("çap = fiş", "size = receipts", "размер = чеки", "ขนาด = ใบเสร็จ", "tamaño = recibos", "大小=小票")}</span>
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full" style={{ backgroundColor: "#EC4899" }} />{l("renk = arketip", "color = archetype", "цвет = архетип", "สี = ประเภท", "color = arquetipo", "颜色=类型")}</span>
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full" style={{ backgroundColor: "var(--app-gold-light)" }} />{l("halka = 3/3", "halo = 3/3", "кольцо = 3/3", "วง = 3/3", "halo = 3/3", "光环=3/3")}</span>
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full" style={{ backgroundColor: "var(--app-text-muted)" }} />{l("soluk = pasif", "dim = inactive", "тусклый = пассив", "จาง = ไม่ใช้งาน", "tenue = inactivo", "暗=不活跃")}</span>
          </div>
        )}

        {hasNetwork && (
          <div className="my-2.5 flex justify-center gap-6">
            {[
              { v: summary.invited, k: l("Davet", "Invited", "Приглашено", "ชวน", "Invitados", "已邀请"), gold: false },
              { v: summary.active, k: l("Aktif", "Active", "Активны", "ใช้งาน", "Activos", "活跃"), gold: false },
              { v: summary.completed, k: "3/3", gold: false },
              { v: summary.earnedTotal, k: l("Kazancın", "Earned", "Заработано", "ได้รับ", "Ganado", "收益"), gold: true },
            ].map((s) => (
              <div key={s.k} className="text-center">
                <p
                  className="font-mono text-xl font-extrabold tabular-nums"
                  style={s.gold ? { color: "var(--app-gold-light)", textShadow: "0 0 24px var(--app-gold-glow)" } : { color: "var(--app-text-primary)" }}
                >
                  {s.v.toLocaleString(locale)}
                </p>
                <p className="text-[9.5px] font-bold uppercase tracking-[0.14em]" style={{ color: "var(--app-text-muted)" }}>
                  {s.k}
                </p>
              </div>
            ))}
          </div>
        )}

        <div className="relative flex gap-2">
          <div
            className="flex min-w-0 flex-1 items-center gap-2 overflow-hidden rounded-[14px] px-3.5 py-2.5 font-mono text-[13px]"
            style={{ backgroundColor: "rgba(255,255,255,0.04)", border: "1px solid var(--app-border-strong)", color: "var(--app-text-primary)" }}
          >
            <Link2 className="h-3.5 w-3.5 shrink-0" style={{ color: "var(--app-gold-light)" }} />
            <span className="truncate">{link ?? "…"}</span>
          </div>
          <button
            type="button"
            onClick={share}
            className="flex shrink-0 items-center gap-1.5 rounded-[14px] px-4 py-2.5 text-[13px] font-bold"
            style={{
              background: "linear-gradient(120deg, var(--app-gold-light), var(--app-gold))",
              color: "#0F1117",
              boxShadow: "0 8px 22px -8px var(--app-gold)",
            }}
          >
            <Share2 className="h-3.5 w-3.5" />
            {l("Davet et", "Invite", "Пригласить", "ชวน", "Invitar", "邀请")}
          </button>
        </div>
      </div>

      {/* ── origin ── */}
      {data?.origin && (
        <div
          className="flex items-center gap-2.5 rounded-[14px] px-3 py-2.5 text-xs"
          style={{ border: "1px dashed var(--app-gold-border)", backgroundColor: "var(--app-gold-glow)", color: "var(--app-text-secondary)" }}
        >
          <span
            className="grid h-[26px] w-[26px] shrink-0 place-items-center rounded-full text-[10px] font-extrabold"
            style={{ backgroundColor: "var(--app-bg-surface)", border: "2px solid var(--app-gold)", color: "var(--app-gold-light)" }}
          >
            {initials(data.origin.displayName || data.origin.username)}
          </span>
          <span>
            {l("Seni ", "", "Вас пригласил ", "", "Te invitó ", "")}
            <b style={{ color: "var(--app-gold-light)" }}>@{data.origin.username}</b>
            {l(" davet etti — ağın kökeni", " invited you — your network origin", " — исток вашей сети", " ชวนคุณ — จุดเริ่มเครือข่าย", " — el origen de tu red", " 邀请了你——网络起点")}
          </span>
        </div>
      )}

      {/* ── sort + cards ── */}
      {hasNetwork && (
        <>
          <div className="flex gap-1.5 px-0.5">
            {sortChips.map((c) => (
              <button
                key={c.key}
                type="button"
                onClick={() => setSort(c.key)}
                className="rounded-full px-3 py-1.5 text-[11px] font-bold transition-colors"
                style={
                  sort === c.key
                    ? { backgroundColor: "var(--app-text-primary)", color: "var(--app-bg-base, #0F1117)" }
                    : { border: "1px solid var(--app-border-strong)", color: "var(--app-text-secondary)" }
                }
              >
                {c.label}
              </button>
            ))}
          </div>

          <div className="space-y-3">
            {sorted.map((item, i) => (
              <InviteeCard key={item.username} item={item} locale={locale} l={l} highlighted={selected === item.username} index={i} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
