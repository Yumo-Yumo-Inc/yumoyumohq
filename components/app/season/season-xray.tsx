"use client";

/**
 * SeasonXray — the "Season X-Ray" capability (season pass L9). When the viewer
 * owns it, this breaks the season's spend and hidden cost down by category, so
 * the pass unlocks a real, data-backed view — not just a cosmetic. Renders nothing
 * when the capability is not owned.
 */

import { useEffect, useState } from "react";
import { useAppLocale } from "@/lib/i18n/app-context";
import { useAppProfile } from "@/lib/app/profile-context";
import { useCosmeticGrants } from "@/lib/app/use-cosmetic-grants";
import { hasCapability } from "@/config/season-capabilities";

type Cat = { category: string; receipts: number; hidden: number; spend: number };

const HEAT = ["#FF9D47", "#FF5D3B", "#4FB4FF", "#A78BFA", "#34D399", "#FFD66B", "#F472B6", "#9AA4B2"];

function currencyFor(country?: string | null): string {
  switch ((country ?? "").toUpperCase()) {
    case "US": case "USA": return "$";
    case "GB": case "UK": return "£";
    case "RU": return "₽";
    case "TH": return "฿";
    case "CN": return "¥";
    default: return "₺";
  }
}

export function SeasonXray() {
  const { locale } = useAppLocale();
  const { profile } = useAppProfile();
  const currency = currencyFor(profile?.country);
  const grants = useCosmeticGrants();
  const [cats, setCats] = useState<Cat[] | null>(null);
  const owned = hasCapability(grants, "season_xray");
  const l = (tr: string, en: string) => (locale === "tr" ? tr : en);
  const fmt = (n: number) => n.toLocaleString(locale === "tr" ? "tr-TR" : "en-US");

  useEffect(() => {
    if (!owned) return;
    let alive = true;
    fetch("/api/season/recap", { cache: "no-store", credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => alive && setCats(Array.isArray(d?.categories) ? d.categories : []))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [owned]);

  if (!owned || !cats || cats.length === 0) return null;
  const maxSpend = Math.max(...cats.map((c) => c.spend), 1);
  const title = (c: string) => c.charAt(0).toUpperCase() + c.slice(1);
  // "Category Colors" capability (pass L2) paints the breakdown; without it the
  // bars are a single muted tone — so owning it genuinely "colours" your categories.
  const colored = hasCapability(grants, "category_colors");
  const barColor = (i: number) => (colored ? HEAT[i % HEAT.length] : "#6b7280");

  return (
    <section className="mt-8">
      <div className="mb-1 flex items-center gap-2">
        <span className="h-2 w-2 rounded-full" style={{ background: "#A78BFA", boxShadow: "0 0 8px #A78BFA" }} />
        <h2 className="text-[15px] font-bold">{l("Sezon Röntgeni", "Season X-Ray")}</h2>
      </div>
      <p className="mb-4 text-[13px]" style={{ color: "var(--app-text-muted)" }}>
        {l("Bu sezon nereye harcadın, gizli maliyet nerede çıktı.", "Where you spent this season, and where the hidden cost was.")}
      </p>
      <ul>
        {cats.map((c, i) => (
          <li key={c.category} className="border-t py-3 first:border-t-0" style={{ borderColor: "var(--app-border)" }}>
            <div className="mb-1.5 flex items-baseline justify-between gap-3">
              <span className="text-[14px] font-semibold">{title(c.category)}</span>
              <span className="font-mono text-[13px] tabular-nums" style={{ color: "var(--app-text-primary)" }}>
                {currency}{fmt(c.spend)}
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full" style={{ background: "rgba(255,255,255,0.06)" }}>
              <div className="h-full rounded-full" style={{ width: `${(c.spend / maxSpend) * 100}%`, background: barColor(i) }} />
            </div>
            <div className="mt-1 flex justify-between font-mono text-[11px] tabular-nums" style={{ color: "var(--app-text-muted)" }}>
              <span>{c.receipts} {l("fiş", "receipts")}</span>
              <span>{l("gizli maliyet", "hidden cost")} {currency}{fmt(c.hidden)}</span>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
