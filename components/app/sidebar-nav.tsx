"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTier } from "@/lib/theme/theme-context";
import { useAppLocale } from "@/lib/i18n/app-context";
import { AvatarImage } from "@/components/app/avatar-image";
import { MOD, SIDEBAR_MODS } from "@/lib/theme/modules";
import { cn } from "@/lib/utils";


export interface SidebarProfile {
  displayName?: string;
  username?: string;
  avatarUrl?: string | null;
  accountLevel?: number;
  streak?: number;
  ayumo?: number;
  ryumo?: number;
  title?: string;
}

export interface SidebarSeason {
  seasonNumber?: number;
  daysLeft?: number;
  seasonXp?: number;
  seasonXpNext?: number;
}

interface SidebarNavProps {
  open: boolean;
  onClose: () => void;
  profile: SidebarProfile | null;
  season: SidebarSeason | null;
  className?: string;
}

function Bar({ pct, color, h = 2 }: { pct: number; color: string; h?: number }) {
  return (
    <div
      className="rounded-full overflow-hidden"
      style={{ background: "var(--app-border)", height: h }}
    >
      <div
        className="h-full rounded-full transition-[width] duration-[.8s] ease-[cubic-bezier(.4,0,.2,1)]"
        style={{ width: `${Math.min(pct, 100)}%`, background: color }}
      />
    </div>
  );
}

export function SidebarNav({ open, onClose, profile, season, className }: SidebarNavProps) {
  const pathname = usePathname();
  const { t } = useAppLocale();
  const accountLevel = profile?.accountLevel ?? 1;
  const tier = useTier(accountLevel);
  const acc = tier.accent;
  const [bg1, bg2] = tier.avatarBg.split(",");

  const name = profile?.displayName || profile?.username || t("sidebar.defaultUser");
  const initials = name.slice(0, 2).toUpperCase();
  const avatarUrl = profile?.avatarUrl ?? null;
  const title = profile?.title || t("sidebar.defaultTitle");
  const ayumo = profile?.ayumo ?? 0;
  const ryumo = profile?.ryumo ?? 0;
  const seasonNum = season?.seasonNumber ?? 1;
  const daysLeft = season?.daysLeft ?? 0;
  const seasonXp = season?.seasonXp ?? 0;
  const seasonXpNext = season?.seasonXpNext ?? 5000;
  const seaPct = seasonXpNext > 0 ? (seasonXp / seasonXpNext) * 100 : 0;

  return (
    <>
      {open && (
        <div
          role="button"
          tabIndex={0}
          onClick={onClose}
          onKeyDown={(e) => e.key === "Escape" && onClose()}
          className="fixed inset-0 z-[90] bg-black/72 backdrop-blur-sm"
          aria-label={t("nav.closeMenu")}
        />
      )}
      <aside
        className={cn(
          "fixed left-0 top-0 bottom-0 z-[95] flex flex-col overflow-hidden transition-transform duration-300 ease-out",
          open ? "translate-x-0" : "-translate-x-full",
          className
        )}
        style={{
          width: "min(85vw, 300px)",
          maxWidth: 300,
          background: "#1E2329",
          borderRight: "1px solid var(--app-border)",
          boxShadow: "4px 0 24px rgba(0,0,0,0.4)",
        }}
      >
        {/* Binance-style: top bar — X on the left, title centered */}
        <div className="flex items-center justify-between h-14 px-3 border-b border-white/[0.06] shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="flex items-center justify-center w-10 h-10 -ml-1 rounded-lg border-none bg-transparent cursor-pointer hover:bg-white/[0.06] active:bg-white/[0.1] transition-colors"
            aria-label={t("nav.close")}
          >
            <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="var(--app-icon-stroke)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
          <span className="text-[13px] font-semibold text-white/90">{t("nav.menu")}</span>
          <div className="w-10" />
        </div>

        {/* Profile — Binance: avatar + name + balance row */}
        <div className="px-4 py-4 border-b border-white/[0.06]">
          <div className="flex items-center gap-3">
            <div
              className="w-11 h-11 rounded-full flex-shrink-0 flex items-center justify-center overflow-hidden text-sm font-semibold"
              style={{
                background: `linear-gradient(135deg,${bg1},${bg2})`,
                border: `1px solid ${acc}50`,
                color: acc,
              }}
            >
              {avatarUrl ? (
                <AvatarImage src={avatarUrl} className="h-full w-full object-cover" />
              ) : (
                initials
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[15px] font-semibold text-white truncate">{name}</p>
              <p className="text-[11px] text-white/50">{title}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 mt-3 text-[11px]">
            <span style={{ color: acc }}>{tier.name} · Lv{accountLevel}</span>
          </div>
          <div className="flex gap-2 mt-2">
            {[
              { label: "cPoints", val: ayumo + ryumo, color: acc },
              { label: "Bonus cPoints", val: ryumo, color: tier.accent2 },
            ].map((tk) => (
              <div key={tk.label} className="flex-1 rounded-lg py-1.5 px-2 bg-white/[0.05] border border-white/[0.06]">
                <span className="font-mono text-xs font-medium tabular-nums" style={{ color: tk.color }}>{Number(tk.val).toLocaleString("tr-TR", { maximumFractionDigits: 0 })}</span>
                <span className="ml-1 text-white/40 text-[10px]">{tk.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Menu list — icon + label, single row */}
        <div className="app-sidebar-scroll app-sidebar-scroll-fade flex-1 py-2">
          <div className="px-2">
          {SIDEBAR_MODS.map((m) => {
            const mod = MOD[m.key];
            if (!mod) return null;
            const href =
              m.key === "insights" ? "/app/insights"
              : m.key === "games" ? "/app/tasks"
              : m.comingSoon ? "/app/coming-soon"
              : "/app/receipts";
            const isActive = !m.comingSoon && (pathname === href || (pathname.startsWith(href) && pathname.length > href.length));
            return (
              <Link
                key={m.key}
                href={href}
                onClick={onClose}
                className={cn(
                  "flex items-center gap-3 py-2.5 px-3 rounded-lg transition-colors",
                  isActive ? "bg-white/[0.08]" : "hover:bg-white/[0.05]"
                )}
              >
                <div
                  className="w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center"
                  style={{ background: mod.dim, border: `1px solid ${mod.mid}` }}
                >
                  <ModuleIcon name={mod.icon} size={16} color={mod.neon} />
                </div>
                <span className="text-[13px] font-medium text-white/90">{t(`nav.sidebar.${m.key}`)}</span>
                {m.comingSoon ? (
                  <span className="ml-auto text-[10px] font-medium px-2 py-0.5 rounded" style={{ background: "var(--app-bg-elevated)", color: "var(--app-text-muted)" }}>{t("comingSoon.short")}</span>
                ) : (
                  <svg width={12} height={12} className="ml-auto shrink-0 text-white/30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 18l6-6-6-6" />
                  </svg>
                )}
              </Link>
            );
          })}
          </div>
        </div>

        <div className="px-4 py-2 border-t border-white/[0.06] shrink-0">
          <div className="flex justify-between text-[10px] text-white/40">
            <span>{t("sidebar.season")} {seasonNum}</span>
            <span style={{ color: acc }}>{daysLeft} {t("sidebar.days")}</span>
          </div>
          <Bar pct={seaPct} color={acc} h={2} />
        </div>
      </aside>
    </>
  );
}

function ModuleIcon({ name, size = 20, color }: { name: string; size?: number; color: string }) {
  const s = { width: size, height: size, display: "block" as const, flexShrink: 0 };
  const p = { fill: "none" as const, stroke: color, strokeWidth: 1.5, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  switch (name) {
    case "economy":
    case "insights":
      return <svg style={s} viewBox="0 0 24 24"><polyline {...p} points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline {...p} points="17 6 23 6 23 12" /></svg>;
    case "guild":
      return <svg style={s} viewBox="0 0 24 24"><circle {...p} cx="12" cy="8" r="3" /><circle {...p} cx="5" cy="16" r="3" /><circle {...p} cx="19" cy="16" r="3" /><path {...p} d="M12 11v2M7.5 15l2.5-2M16.5 15l-2.5-2" /></svg>;
    case "games":
      return <svg style={s} viewBox="0 0 24 24"><rect {...p} x="2" y="6" width="20" height="12" rx="3" /><line {...p} x1="8" y1="12" x2="12" y2="12" /><line {...p} x1="10" y1="10" x2="10" y2="14" /><circle cx="16" cy="11" r="1" fill={color} stroke="none" /><circle cx="18" cy="13" r="1" fill={color} stroke="none" /></svg>;
    case "ai":
      return <svg style={s} viewBox="0 0 24 24"><path {...p} d="M12 2a9 9 0 100 18A9 9 0 0012 2z" /><path {...p} d="M8 12h8M12 8v8" /><circle cx="12" cy="12" r="2" fill={color} stroke="none" /></svg>;
    case "market":
      return <svg style={s} viewBox="0 0 24 24"><polyline {...p} points="2 12 6 7 10 14 14 5 18 10 22 6" /></svg>;
    case "social":
      return <svg style={s} viewBox="0 0 24 24"><path {...p} d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2v10z" /></svg>;
    case "basket":
      return <svg style={s} viewBox="0 0 24 24"><path {...p} d="M6 2l3 6h6l3-6" /><path {...p} d="M3 8h18l-1.5 10H4.5L3 8z" /><circle cx="10" cy="14" r="1" fill={color} stroke="none" /><circle cx="14" cy="14" r="1" fill={color} stroke="none" /></svg>;
    default:
      return null;
  }
}
