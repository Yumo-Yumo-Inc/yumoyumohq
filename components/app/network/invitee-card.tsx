"use client";

/**
 * One invitee in the referral network list. The left color rail + avatar ring
 * take the invitee's spending-identity trait colors (friend-gated); the stats
 * grid shows join date / receipts / active days, and the milestone ladder shows
 * ladder progress with the per-side reward amounts.
 */

import { motion, useReducedMotion } from "framer-motion";
import type { TraitKey } from "@/lib/insights/identity/identity-types";
import { TRAIT_ACCENT, className as archetypeName } from "@/app/app/patterns/identity-copy";
import { REFERRAL_MILESTONE_REWARD } from "@/lib/referral/referral-config";

export interface NetworkInvitee {
  username: string;
  displayName: string;
  avatarUrl: string | null;
  joinedAt: string;
  receipts: number;
  activeDays: number;
  lastReceiptAt: string | null;
  isActive: boolean;
  milestones: { firstReceipt: boolean; threeInSevenDays: boolean; retained30d: boolean };
  completed: boolean;
  earnedByMe: number;
  isFriend: boolean;
  archetype: { primary: string; secondary: string | null } | null;
}

type L = (tr: string, en: string, ru: string, th: string, es: string, zh: string) => string;

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

const RUNGS = [
  { key: "firstReceipt", reward: REFERRAL_MILESTONE_REWARD.first_receipt },
  { key: "threeInSevenDays", reward: REFERRAL_MILESTONE_REWARD.three_in_7d },
  { key: "retained30d", reward: REFERRAL_MILESTONE_REWARD.retained_30d },
] as const;

export function InviteeCard({
  item,
  locale,
  l,
  highlighted,
  index,
}: {
  item: NetworkInvitee;
  locale: string;
  l: L;
  highlighted: boolean;
  index: number;
}) {
  const reduce = useReducedMotion();
  const primary = item.archetype?.primary as TraitKey | undefined;
  const secondary = (item.archetype?.secondary ?? undefined) as TraitKey | undefined;
  const c1 = primary ? TRAIT_ACCENT[primary] : "var(--app-text-muted)";
  const c2 = secondary ? TRAIT_ACCENT[secondary] : c1;
  const hasArch = !!primary;

  const joined = new Date(item.joinedAt).toLocaleDateString(locale, { day: "numeric", month: "short" });
  const doneCount = RUNGS.filter((r) => item.milestones[r.key]).length;

  const rungLabel = (key: (typeof RUNGS)[number]["key"]) =>
    key === "firstReceipt"
      ? l("İlk fiş", "First receipt", "Первый чек", "ใบแรก", "1er recibo", "首张小票")
      : key === "threeInSevenDays"
        ? l("7g/3 fiş", "3 in 7d", "3 за 7 дн.", "3 ใน 7 วัน", "3 en 7 d", "7天3张")
        : l("30 gün", "30 days", "30 дней", "30 วัน", "30 días", "30天");

  return (
    <motion.div
      id={`invitee-${item.username}`}
      initial={reduce ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: reduce ? 0 : Math.min(index * 0.05, 0.3), ease: "easeOut" }}
      className="relative overflow-hidden rounded-[20px] p-3.5 pb-3"
      style={{
        background: "linear-gradient(160deg, var(--app-bg-surface) 0%, var(--app-bg-elevated) 65%)",
        border: highlighted ? `1px solid ${c1}` : "1px solid var(--app-border-strong)",
        boxShadow: highlighted ? `0 0 0 1px ${c1}, 0 14px 34px -18px ${c1}` : "var(--app-shadow-card)",
      }}
    >
      {/* archetype color rail */}
      <span
        className="absolute left-0 w-[3px] rounded-r"
        style={{
          top: "12%",
          bottom: "12%",
          background: hasArch ? `linear-gradient(180deg, ${c1}, ${c2})` : "var(--app-text-muted)",
          boxShadow: hasArch ? `0 0 16px 0 ${c1}` : "none",
          opacity: hasArch ? 1 : 0.4,
        }}
      />

      <div className="flex items-center gap-3">
        <span className="relative grid h-[46px] w-[46px] shrink-0 place-items-center rounded-full text-[15px] font-extrabold text-white">
          <span
            className="absolute rounded-full"
            style={{
              inset: -3,
              background: hasArch ? `conic-gradient(${c1}, ${c2}, ${c1})` : "var(--app-border-strong)",
            }}
          />
          <span
            className="relative grid h-full w-full place-items-center overflow-hidden rounded-full"
            style={{ backgroundColor: "var(--app-bg-surface3, var(--app-bg-surface))" }}
          >
            {item.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={item.avatarUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              initials(item.displayName)
            )}
          </span>
        </span>

        <div className="min-w-0 flex-1">
          <p className="truncate text-[15px] font-bold" style={{ color: "var(--app-text-primary)" }}>
            {item.displayName}
          </p>
          <p className="truncate text-[11px]" style={{ color: "var(--app-text-muted)" }}>
            {l(`Katıldı: ${joined}`, `Joined ${joined}`, `С ${joined}`, `เข้าร่วม ${joined}`, `Desde ${joined}`, `${joined} 加入`)}
            {item.isFriend &&
              " · " + l("arkadaşın", "your friend", "ваш друг", "เพื่อนคุณ", "tu amigo", "你的好友")}
          </p>
        </div>

        {hasArch && primary ? (
          <span
            className="flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-extrabold"
            style={{ backgroundColor: "rgba(255,255,255,0.05)", border: "1px solid var(--app-border-strong)" }}
          >
            <span style={{ color: c1 }}>
              {secondary ? archetypeName([primary, secondary], locale) : archetypeName([primary, primary], locale)}
            </span>
          </span>
        ) : (
          <span className="whitespace-nowrap text-[11px] italic" style={{ color: "var(--app-text-muted)" }}>
            {item.isFriend
              ? l("arketip şekilleniyor…", "archetype forming…", "архетип формируется…", "กำลังก่อตัว…", "arquetipo en formación…", "类型形成中…")
              : ""}
          </span>
        )}
      </div>

      {/* stats grid */}
      <div
        className="mt-3 grid grid-cols-3 gap-px overflow-hidden rounded-[13px]"
        style={{ backgroundColor: "var(--app-border)" }}
      >
        {[
          { k: l("Fiş", "Receipts", "Чеки", "ใบเสร็จ", "Recibos", "小票"), v: item.receipts.toLocaleString(locale), gold: false },
          { k: l("Aktif gün", "Active days", "Активных дн.", "วันที่ใช้งาน", "Días activos", "活跃天数"), v: item.activeDays.toLocaleString(locale), gold: false },
          { k: l("Sana kazandırdı", "Earned you", "Принёс вам", "ทำให้คุณได้", "Te dio", "为你赚得"), v: `+${item.earnedByMe.toLocaleString(locale)}`, gold: true },
        ].map((s) => (
          <div key={s.k} className="px-2.5 py-2" style={{ backgroundColor: "rgba(255,255,255,0.03)" }}>
            <p className="text-[8.5px] font-bold uppercase tracking-[0.12em]" style={{ color: "var(--app-text-muted)" }}>
              {s.k}
            </p>
            <p
              className="mt-0.5 font-mono text-sm font-bold tabular-nums"
              style={{ color: s.gold ? "var(--app-gold-light)" : "var(--app-text-primary)" }}
            >
              {s.v}
            </p>
          </div>
        ))}
      </div>

      {/* milestone ladder */}
      <div className="mt-2.5 flex items-center gap-1.5">
        {RUNGS.map((r) => {
          const done = item.milestones[r.key];
          return (
            <div key={r.key} className="flex-1">
              <div
                className="h-[5px] rounded-full"
                style={{
                  background: done
                    ? "linear-gradient(90deg, var(--app-gold), var(--app-gold-light))"
                    : "var(--app-border-strong)",
                  boxShadow: done ? "0 0 10px -1px var(--app-gold)" : "none",
                }}
              />
              <p
                className="mt-1 text-center text-[8.5px] font-bold"
                style={{ color: done ? "var(--app-gold-light)" : "var(--app-text-muted)" }}
              >
                {rungLabel(r.key)} · +{r.reward}
              </p>
            </div>
          );
        })}
        <span
          className="ml-1.5 whitespace-nowrap text-[12px] font-extrabold"
          style={{ color: doneCount === 3 ? "var(--app-gold-light)" : "var(--app-text-muted)" }}
        >
          {doneCount}/3{doneCount === 3 ? " ✦" : ""}
        </span>
      </div>
    </motion.div>
  );
}
