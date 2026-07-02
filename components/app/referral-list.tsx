"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Clock, Coins, Loader2, ReceiptText, Sparkles, Users } from "lucide-react";
import { useAppLocale } from "@/lib/i18n/app-context";

interface ReferralItem {
  refereeUsername: string;
  displayName: string;
  avatarUrl: string | null;
  status: "pending" | "activated" | "expired";
  verifiedReceipts: number;
  totalEarnedPoints: number;
  lastReceiptAt: string | null;
  activatedAt: string | null;
  bonusExpiresAt: string | null;
  createdAt: string;
}

type Rel = (tr: string, en: string, ru: string, th: string, es: string, zh: string) => string;

// ─── helpers ──────────────────────────────────────────────────────────────────

const STATUS_TINT: Record<ReferralItem["status"], { ring: string; dot: string }> = {
  activated: { ring: "var(--app-gold-border)", dot: "var(--app-gold-light)" },
  pending: { ring: "rgba(234,179,8,0.30)", dot: "#eab308" },
  expired: { ring: "var(--app-border)", dot: "var(--app-text-muted)" },
};

function StatusBadge({ status, l }: { status: ReferralItem["status"]; l: Rel }) {
  const label =
    status === "activated"
      ? l("Aktif", "Active", "Активен", "ใช้งาน", "Activo", "活跃")
      : status === "pending"
        ? l("Bekliyor", "Pending", "Ожидание", "รอดำเนินการ", "Pendiente", "等待中")
        : l("Süresi doldu", "Expired", "Истёк", "หมดอายุ", "Caducado", "已过期");
  const tint = STATUS_TINT[status];
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold"
      style={{ border: `1px solid ${tint.ring}`, color: "var(--app-text-secondary)" }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: tint.dot }} />
      {label}
    </span>
  );
}

function daysLeft(expiresAt: string | null): number | null {
  if (!expiresAt) return null;
  const diff = new Date(expiresAt).getTime() - Date.now();
  if (diff <= 0) return 0;
  return Math.ceil(diff / (24 * 60 * 60 * 1000));
}

/** Relative "time since last receipt" — never exposes the absolute timestamp. */
function lastUploadLabel(lastReceiptAt: string | null, l: Rel): string {
  if (!lastReceiptAt) {
    return l("Henüz fiş yok", "No receipts", "Нет чеков", "ยังไม่มี", "Sin recibos", "暂无");
  }
  const ms = Date.now() - new Date(lastReceiptAt).getTime();
  const days = Math.floor(ms / (24 * 60 * 60 * 1000));
  if (days <= 0) return l("Bugün", "Today", "Сегодня", "วันนี้", "Hoy", "今天");
  if (days === 1) return l("Dün", "Yesterday", "Вчера", "เมื่อวาน", "Ayer", "昨天");
  if (days < 7) return l(`${days} gün önce`, `${days}d ago`, `${days} дн.`, `${days} วันก่อน`, `hace ${days} d`, `${days} 天前`);
  const weeks = Math.floor(days / 7);
  if (weeks < 5) return l(`${weeks} hafta önce`, `${weeks}w ago`, `${weeks} нед.`, `${weeks} สัปดาห์`, `hace ${weeks} sem`, `${weeks} 周前`);
  const months = Math.floor(days / 30);
  return l(`${months} ay önce`, `${months}mo ago`, `${months} мес.`, `${months} เดือน`, `hace ${months} m`, `${months} 个月前`);
}

/** A referee is "stale" when their last receipt is older than two weeks. */
function isStale(lastReceiptAt: string | null): boolean {
  if (!lastReceiptAt) return true;
  return Date.now() - new Date(lastReceiptAt).getTime() > 14 * 24 * 60 * 60 * 1000;
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function compact(n: number, locale: string): string {
  if (n >= 10_000) return new Intl.NumberFormat(locale, { notation: "compact", maximumFractionDigits: 1 }).format(n);
  return n.toLocaleString(locale);
}

// ─── surface ──────────────────────────────────────────────────────────────────

const CARD_SURFACE: React.CSSProperties = {
  border: "1px solid var(--app-border)",
  background: "linear-gradient(160deg, var(--app-bg-surface), var(--app-bg-elevated))",
  boxShadow: "var(--app-shadow-card)",
};

// ─── stat cell ────────────────────────────────────────────────────────────────

function StatCell({
  icon,
  label,
  value,
  accent,
  muted,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  accent?: boolean;
  muted?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1 px-3 py-2.5" style={{ backgroundColor: "var(--app-bg-elevated)" }}>
      <span
        className="flex items-center gap-1 text-[10px] font-medium uppercase tracking-wider"
        style={{ color: "var(--app-text-muted)" }}
      >
        {icon}
        {label}
      </span>
      <span
        className="text-sm font-bold tabular-nums"
        style={{
          color: accent ? "var(--app-gold-light)" : muted ? "var(--app-text-muted)" : "var(--app-text-primary)",
        }}
      >
        {value}
      </span>
    </div>
  );
}

// ─── component ──────────────────────────────────────────────────────────────────

export function ReferralList() {
  const { locale } = useAppLocale();
  const reduce = useReducedMotion();
  const l = (tr: string, en: string, ru: string, th: string, es: string, zh: string) =>
    locale === "tr" ? tr : locale === "ru" ? ru : locale === "th" ? th : locale === "es" ? es : locale === "zh" ? zh : en;
  const [items, setItems] = useState<ReferralItem[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/referral/list");
      const data = await res.json();
      if (res.ok && data.referrals) setItems(data.referrals);
    } catch {
      /* silent */
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const summary = useMemo(() => {
    const active = items.filter((i) => i.status === "activated").length;
    const combined = items.reduce((s, i) => s + (i.totalEarnedPoints || 0), 0);
    return { total: items.length, active, combined };
  }, [items]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-10">
        <Loader2 className="h-5 w-5 animate-spin" style={{ color: "var(--app-text-muted)" }} />
      </div>
    );
  }

  if (!items.length) {
    return (
      <div
        className="relative flex flex-col items-center gap-3 overflow-hidden rounded-2xl px-6 py-10 text-center"
        style={CARD_SURFACE}
      >
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-px"
          style={{ background: "linear-gradient(90deg, transparent, var(--app-gold-border), transparent)" }}
        />
        <span
          className="flex h-12 w-12 items-center justify-center rounded-full"
          style={{ border: "1px solid var(--app-gold-border)", backgroundColor: "var(--app-gold-glow)" }}
        >
          <Users className="h-5 w-5" style={{ color: "var(--app-gold-light)" }} />
        </span>
        <p className="text-sm font-semibold" style={{ color: "var(--app-text-primary)" }}>
          {l(
            "Henüz davet ettiğin kimse yok",
            "No invites yet",
            "Пока нет приглашённых",
            "ยังไม่มีเพื่อนที่ชวน",
            "Aún no tienes referidos",
            "你还没有邀请好友",
          )}
        </p>
        <p className="max-w-[15rem] text-xs leading-relaxed" style={{ color: "var(--app-text-muted)" }}>
          {l(
            "Linkini paylaş; davet ettiklerinin fiş ve kazançlarını buradan canlı takip et.",
            "Share your link and track your invites' receipts and earnings live, right here.",
            "Поделись ссылкой и следи за чеками и доходом приглашённых здесь.",
            "แชร์ลิงก์แล้วติดตามใบเสร็จและรายได้ของเพื่อนที่คุณชวนได้ที่นี่",
            "Comparte tu enlace y sigue aquí los recibos y ganancias de tus referidos.",
            "分享你的链接，在这里实时追踪受邀好友的小票和收益。",
          )}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* ── summary band ── */}
      <div className="relative overflow-hidden rounded-2xl" style={CARD_SURFACE}>
        <div
          className="pointer-events-none absolute inset-x-0 top-0 z-10 h-px"
          style={{ background: "linear-gradient(90deg, transparent, var(--app-gold-border), transparent)" }}
        />
        <div className="grid grid-cols-3 gap-px" style={{ backgroundColor: "var(--app-border)" }}>
          <div className="flex flex-col gap-1 px-4 py-3.5" style={{ backgroundColor: "var(--app-bg-surface)" }}>
            <span className="text-[10px] font-medium uppercase tracking-wider" style={{ color: "var(--app-text-muted)" }}>
              {l("Davet", "Invited", "Приглашено", "ชวนแล้ว", "Invitados", "已邀请")}
            </span>
            <span className="text-2xl font-black tabular-nums" style={{ color: "var(--app-text-primary)" }}>
              {summary.total}
            </span>
          </div>
          <div className="flex flex-col gap-1 px-4 py-3.5" style={{ backgroundColor: "var(--app-bg-surface)" }}>
            <span className="text-[10px] font-medium uppercase tracking-wider" style={{ color: "var(--app-text-muted)" }}>
              {l("Aktif", "Active", "Активны", "ใช้งาน", "Activos", "活跃")}
            </span>
            <span className="text-2xl font-black tabular-nums" style={{ color: "var(--app-text-primary)" }}>
              {summary.active}
            </span>
          </div>
          <div className="flex flex-col gap-1 px-4 py-3.5" style={{ backgroundColor: "var(--app-bg-surface)" }}>
            <span className="flex items-center gap-1 text-[10px] font-medium uppercase tracking-wider" style={{ color: "var(--app-text-muted)" }}>
              <Coins className="h-3 w-3" />
              {l("Ekip kazancı", "Network", "Команда", "ทีม", "Equipo", "团队")}
            </span>
            <span className="text-2xl font-black tabular-nums" style={{ color: "var(--app-gold-light)" }}>
              {compact(Math.round(summary.combined), locale)}
            </span>
          </div>
        </div>
      </div>

      {/* ── invitee cards ── */}
      {items.map((item, idx) => {
        const remaining = daysLeft(item.bonusExpiresAt);
        const stale = isStale(item.lastReceiptAt);
        const tint = STATUS_TINT[item.status];
        return (
          <motion.div
            key={item.refereeUsername}
            initial={reduce ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: reduce ? 0 : Math.min(idx * 0.05, 0.3), ease: "easeOut" }}
            className="relative overflow-hidden rounded-2xl p-3.5"
            style={CARD_SURFACE}
          >
            {/* header row */}
            <div className="flex items-center gap-3">
              <div
                className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full text-xs font-bold"
                style={{
                  border: `1.5px solid ${tint.ring}`,
                  backgroundColor: "var(--app-bg-elevated)",
                  color: "var(--app-text-secondary)",
                }}
              >
                {item.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.avatarUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  initials(item.displayName)
                )}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="truncate text-sm font-semibold" style={{ color: "var(--app-text-primary)" }}>
                    {item.displayName}
                  </span>
                  <StatusBadge status={item.status} l={l} />
                </div>
                {item.status === "activated" && remaining !== null && remaining > 0 ? (
                  <span className="mt-0.5 flex items-center gap-1 text-[11px]" style={{ color: "var(--app-gold-light)" }}>
                    <Sparkles className="h-3 w-3" />
                    {l(
                      `Bonus penceresi: ${remaining} gün`,
                      `Bonus window: ${remaining}d`,
                      `Бонус: ${remaining} дн.`,
                      `โบนัส: ${remaining} วัน`,
                      `Bono: ${remaining} días`,
                      `奖励窗口：${remaining} 天`,
                    )}
                  </span>
                ) : (
                  <span className="mt-0.5 block truncate text-[11px]" style={{ color: "var(--app-text-muted)" }}>
                    @{item.refereeUsername}
                  </span>
                )}
              </div>
            </div>

            {/* stat grid */}
            <div
              className="mt-3 grid grid-cols-3 gap-px overflow-hidden rounded-xl"
              style={{ backgroundColor: "var(--app-border)" }}
            >
              <StatCell
                icon={<ReceiptText className="h-3 w-3" />}
                label={l("Fiş", "Receipts", "Чеки", "ใบเสร็จ", "Recibos", "小票")}
                value={item.verifiedReceipts.toLocaleString(locale)}
              />
              <StatCell
                icon={<Clock className="h-3 w-3" />}
                label={l("Son yükleme", "Last upload", "Последний", "ล่าสุด", "Último", "最近")}
                value={lastUploadLabel(item.lastReceiptAt, l)}
                muted={stale}
              />
              <StatCell
                icon={<Coins className="h-3 w-3" />}
                label={l("Kazanç", "Earned", "Доход", "รายได้", "Ganado", "收益")}
                value={`${compact(item.totalEarnedPoints, locale)}`}
                accent
              />
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
