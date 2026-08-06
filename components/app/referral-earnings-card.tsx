"use client";

/**
 * The only referral element on the rewards page (karar 2026-07-15): the total
 * cPoints earned from referral milestones, a one-line network summary, an
 * archetype-tinted facepile, and a deep link to the full network hub under
 * Friends → My Network. Renders nothing while empty AND unearned — the invite
 * entry point then lives in Friends and on the receipt result screen.
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useAppLocale } from "@/lib/i18n/app-context";
import type { TraitKey } from "@/lib/insights/identity/identity-types";
import { TRAIT_ACCENT } from "@/app/app/patterns/identity-copy";

interface Payload {
  invitees: {
    username: string;
    displayName: string;
    archetype: { primary: string } | null;
  }[];
  summary: { invited: number; active: number; completed: number; earnedTotal: number };
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function ReferralEarningsCard() {
  const { locale } = useAppLocale();
  const l = (tr: string, en: string, ru: string, th: string, es: string, zh: string) =>
    locale === "tr" ? tr : locale === "ru" ? ru : locale === "th" ? th : locale === "es" ? es : locale === "zh" ? zh : en;
  const [data, setData] = useState<Payload | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/referral/network", { credentials: "include", cache: "no-store" });
        if (res.ok) setData(await res.json());
      } catch {
        /* render nothing */
      }
    })();
  }, []);

  if (!data) return null;
  const { summary } = data;

  const faces = data.invitees.slice(0, 4);
  const extra = summary.invited - faces.length;

  return (
    <Link
      href="/app/friends?tab=network"
      className="relative block overflow-hidden rounded-[20px] p-4"
      style={{
        border: "1px solid var(--app-gold-border)",
        background:
          "radial-gradient(120% 140% at 85% -20%, var(--app-gold-glow), transparent 55%), linear-gradient(160deg, var(--app-bg-surface) 0%, var(--app-bg-elevated) 70%)",
      }}
    >
      <span
        className="pointer-events-none absolute inset-x-0 top-0 h-px"
        style={{ background: "linear-gradient(90deg, transparent, var(--app-gold-border), transparent)" }}
      />

      <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.15em]" style={{ color: "var(--app-text-secondary)" }}>
        ◈ {l("Davetlerden kazancın", "Earned from invites", "Доход с приглашений", "รายได้จากการชวน", "Ganado por invitar", "邀请收益")}
      </p>

      <p
        className="mb-0.5 mt-1.5 font-mono text-[34px] font-extrabold leading-none tabular-nums"
        style={{ color: "var(--app-gold-light)", textShadow: "0 0 34px var(--app-gold-glow)" }}
      >
        +{summary.earnedTotal.toLocaleString(locale)}{" "}
        <span className="text-[15px] font-semibold" style={{ color: "var(--app-text-secondary)", textShadow: "none" }}>
          {l("puan", "points", "очков", "แต้ม", "puntos", "分")}
        </span>
      </p>

      <div className="mt-2.5 flex items-center justify-between">
        <span className="text-xs" style={{ color: "var(--app-text-secondary)" }}>
          {summary.invited} {l("davet", "invited", "приглашено", "ชวน", "invitados", "邀请")} · {summary.active}{" "}
          {l("aktif", "active", "активны", "ใช้งาน", "activos", "活跃")}
          {summary.completed > 0 && <> · {summary.completed}×3/3</>}
        </span>
        <span className="flex items-center gap-1 text-[12.5px] font-extrabold" style={{ color: "#3B82F6" }}>
          {l("Ağını gör", "See your network", "Ваша сеть", "ดูเครือข่าย", "Ver tu red", "查看网络")}
          <ArrowRight className="h-3.5 w-3.5" />
        </span>
      </div>

      {faces.length > 0 && (
        <div className="mt-3 flex">
          {faces.map((f, i) => (
            <span
              key={f.username}
              className="grid h-[26px] w-[26px] place-items-center rounded-full text-[9px] font-extrabold text-white"
              style={{
                marginLeft: i === 0 ? 0 : -7,
                backgroundColor: "var(--app-bg-surface3, var(--app-bg-surface))",
                border: `2px solid ${f.archetype?.primary ? TRAIT_ACCENT[f.archetype.primary as TraitKey] : "var(--app-bg-elevated)"}`,
              }}
            >
              {initials(f.displayName)}
            </span>
          ))}
          {extra > 0 && (
            <span
              className="grid h-[26px] w-[26px] place-items-center rounded-full text-[9px] font-extrabold"
              style={{ marginLeft: -7, backgroundColor: "var(--app-bg-surface3, var(--app-bg-surface))", border: "2px solid var(--app-bg-elevated)", color: "var(--app-text-secondary)" }}
            >
              +{extra}
            </span>
          )}
        </div>
      )}
    </Link>
  );
}
