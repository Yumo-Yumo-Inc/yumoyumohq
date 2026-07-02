import { ExternalLink } from "lucide-react";
import {
  getAcademiaSources,
  type SourceGroupKey,
  type SourceRow,
} from "@/lib/academia/sources";
import type { AcademiaLocale } from "@/lib/academia/shared";

const MONO = "var(--font-jetbrains-mono), ui-monospace, Menlo, Consolas, monospace";
const ACCENT = "#A78BFA";
const GOLD = "#E8C97A";
const TEXT_PRIMARY = "#F9FAFB";
const TEXT_SECONDARY = "#9CA3AF";
const TEXT_MUTED = "#6B7280";
const BORDER = "rgba(255, 255, 255, 0.06)";

const GROUP_LABEL: Record<SourceGroupKey, Record<"en" | "tr", string>> = {
  tax: { en: "Taxes & rates", tr: "Vergiler ve oranlar" },
  margins: { en: "Commercial margins", tr: "Ticari marjlar" },
  costWeights: { en: "Cost composition", tr: "Maliyet kompozisyonu" },
  referencePrices: { en: "Reference prices", tr: "Referans fiyatlar" },
  indices: { en: "Economic indices", tr: "Ekonomik endeksler" },
};

const COL = {
  en: { source: "Source", scope: "Scope", period: "Period", conf: "Conf.", empty: "Live source registry is being populated.", lead: "Read live from the database — only verified rows appear." },
  tr: { source: "Kaynak", scope: "Kapsam", period: "Dönem", conf: "Güven", empty: "Canlı kaynak kütüğü dolduruluyor.", lead: "Veritabanından canlı okunur — yalnızca doğrulanmış satırlar görünür." },
};

function pick(locale: AcademiaLocale): "en" | "tr" {
  return locale === "tr" ? "tr" : "en";
}

function confColor(level: string | null): string {
  if (level === "high") return GOLD;
  if (level === "low") return TEXT_MUTED;
  return TEXT_SECONDARY;
}

function Row({ row, l }: { row: SourceRow; l: "en" | "tr" }) {
  return (
    <tr style={{ borderTop: `0.5px solid ${BORDER}` }} className="align-top">
      <td className="px-3.5 py-2.5 leading-[1.55]" style={{ color: TEXT_PRIMARY }}>
        <span className="font-medium">{row.source}</span>
        {row.sourceUrl ? (
          <a
            href={row.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="ml-1.5 inline-flex translate-y-[2px]"
            style={{ color: ACCENT }}
            aria-label="source link"
          >
            <ExternalLink className="h-3 w-3" />
          </a>
        ) : null}
        {row.count > 1 ? (
          <span className="ml-2 text-[11px]" style={{ color: TEXT_MUTED, fontFamily: MONO }}>
            ×{row.count}
          </span>
        ) : null}
      </td>
      <td className="px-3.5 py-2.5 leading-[1.55]" style={{ color: TEXT_SECONDARY }}>
        {row.scope.length > 0 ? (
          <span className="flex flex-wrap gap-1">
            {row.scope.map((s) => (
              <span
                key={s}
                className="rounded px-1.5 py-0.5 text-[11px]"
                style={{ background: "rgba(255,255,255,0.04)", color: TEXT_MUTED, fontFamily: MONO }}
              >
                {s}
              </span>
            ))}
          </span>
        ) : (
          <span style={{ color: TEXT_MUTED }}>—</span>
        )}
      </td>
      <td
        className="whitespace-nowrap px-3.5 py-2.5 text-[12px] tabular-nums"
        style={{ color: TEXT_SECONDARY, fontFamily: MONO }}
      >
        {row.effectiveDate ?? "—"}
      </td>
      <td
        className="whitespace-nowrap px-3.5 py-2.5 text-[11px] uppercase tracking-[0.06em]"
        style={{ color: confColor(row.confidence), fontFamily: MONO }}
      >
        {row.confidence ?? "—"}
      </td>
    </tr>
  );
}

/**
 * Live source registry table, embedded in the paper via the ```academia-sources```
 * fence. Async server component — reads getAcademiaSources() directly at render.
 */
export async function AcademiaSourcesTable({ locale }: { locale: AcademiaLocale }) {
  const l = pick(locale);
  let data;
  try {
    data = await getAcademiaSources();
  } catch {
    data = { groups: [], totalSources: 0, lastUpdated: null };
  }

  if (data.groups.length === 0) {
    return (
      <div
        className="mt-6 px-4 py-3 text-[13px]"
        style={{ borderLeft: `2px solid ${ACCENT}`, background: "rgba(167,139,250,0.06)", color: TEXT_SECONDARY }}
      >
        {COL[l].empty}
      </div>
    );
  }

  return (
    <div className="mt-6">
      <div className="mb-3 flex flex-wrap items-baseline gap-x-4 gap-y-1 text-[12px]" style={{ color: TEXT_MUTED, fontFamily: MONO }}>
        <span>
          <span style={{ color: ACCENT }} className="tabular-nums">{data.totalSources}</span> {l === "tr" ? "kaynak" : "sources"}
        </span>
        {data.lastUpdated ? (
          <span>
            {l === "tr" ? "son güncelleme" : "updated"} <span className="tabular-nums" style={{ color: TEXT_SECONDARY }}>{data.lastUpdated}</span>
          </span>
        ) : null}
      </div>
      <p className="mb-4 text-[13px] italic" style={{ color: TEXT_MUTED }}>
        {COL[l].lead}
      </p>

      <div className="space-y-7">
        {data.groups.map((group) => (
          <div key={group.key}>
            <div
              className="mb-2 text-[11px] font-medium uppercase tracking-[0.1em]"
              style={{ color: ACCENT, fontFamily: MONO }}
            >
              {GROUP_LABEL[group.key][l]}
            </div>
            <div
              className="overflow-x-auto"
              style={{
                borderRadius: "6px",
                border: `0.5px solid rgba(167,139,250,0.22)`,
                background: "rgba(167,139,250,0.03)",
              }}
            >
              <table className="min-w-full border-collapse text-left text-[13px]">
                <thead style={{ background: "rgba(167,139,250,0.09)", borderBottom: "0.5px solid rgba(167,139,250,0.3)" }}>
                  <tr>
                    {[COL[l].source, COL[l].scope, COL[l].period, COL[l].conf].map((h) => (
                      <th
                        key={h}
                        className="px-3.5 py-2.5 text-[10px] font-medium uppercase tracking-[0.1em]"
                        style={{ color: "#C4B5FD", fontFamily: MONO }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {group.rows.map((row, i) => (
                    <Row key={row.source + i} row={row} l={l} />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
