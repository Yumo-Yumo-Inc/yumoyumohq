"use client";

import { useAppLocale } from "@/lib/i18n/app-context";

function fmtToken(value: number): string {
  if (value >= 1_000_000) return `${Math.floor(value / 1_000_000)}M`;
  if (value >= 10_000)    return `${Math.floor(value / 1_000)}K`;
  if (value >= 1_000)     return Math.round(value).toLocaleString("tr-TR");
  return value.toFixed(2);
}

interface TokenCardsProps {
  ayumo?: number;
  ryumo?: number;
}

export function TokenCards({ ayumo = 0, ryumo = 0 }: TokenCardsProps) {
  const { locale } = useAppLocale();
  const byLocale = (tr: string, en: string, ru: string, th: string, es: string, zh: string) => {
    if (locale === "tr") return tr;
    if (locale === "ru") return ru;
    if (locale === "th") return th;
    if (locale === "es") return es;
    if (locale === "zh") return zh;
    return en;
  };
  const tokens = [
    {
      key: "cPointsTotal",
      label: "cPoints",
      desc: byLocale("Toplam katkı puanı", "Total contribution points", "Общие баллы вклада", "คะแนนการมีส่วนร่วมทั้งหมด", "Puntos totales de contribución", "总贡献积分"),
      display: fmtToken(ayumo + ryumo),
      color: "#C9A84C",
      active: ayumo + ryumo > 0,
    },
    {
      key: "cPointsReceipt",
      label: byLocale("Fiş cPoints", "Receipt cPoints", "cPoints чеков", "cPoints จากใบเสร็จ", "cPoints de recibos", "收据 cPoints"),
      desc: byLocale("Fiş katkı puanı", "Receipt contribution", "Вклад по чекам", "คะแนนจากใบเสร็จ", "Contribución por recibos", "收据贡献"),
      display: fmtToken(ayumo),
      color: "#34D399",
      active: ayumo > 0,
    },
    {
      key: "cPointsQuest",
      label: byLocale("Bonus cPoints", "Bonus cPoints", "Бонус cPoints", "โบนัส cPoints", "Bonus cPoints", "奖励 cPoints"),
      desc: byLocale("Görev katkı puanı", "Quest contribution", "Вклад квестов", "คะแนนจากภารกิจ", "Contribución de misión", "任务贡献"),
      display: fmtToken(ryumo),
      color: "var(--app-text-secondary)",
      active: ryumo > 0,
    },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {/* Title */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0 2px" }}>
        <p style={{
          fontSize: 10, fontWeight: 700, letterSpacing: "0.14em",
          color: "var(--app-text-muted)", textTransform: "uppercase",
        }}>
          {byLocale("cPoints Bakiyeleri", "cPoints Balances", "Баланс cPoints", "ยอดคงเหลือ cPoints", "Saldos de cPoints", "cPoints 余额")}
        </p>
      </div>

      {tokens.map(t => (
        <div key={t.key} style={{
          background: "var(--app-bg-elevated)",
          borderRadius: 14,
          border: `1px solid ${t.active ? t.color + "22" : "var(--app-border)"}`,
          padding: "14px 16px",
          display: "flex", alignItems: "center", gap: 14,
        }}>
          {/* Token icon */}
          <div style={{
            width: 40, height: 40, borderRadius: 12, flexShrink: 0,
            background: t.active ? `${t.color}14` : "var(--app-bg-surface)",
            border: `1px solid ${t.active ? t.color + "30" : "var(--app-border)"}`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 14, fontWeight: 800,
            color: t.active ? t.color : "var(--app-text-muted)",
          }}>
            ⟁
          </div>

          {/* Name + description */}
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 15, fontWeight: 700, color: t.active ? "var(--app-text-primary)" : "var(--app-text-muted)" }}>
              {t.label}
            </p>
            <p style={{ fontSize: 11, color: "var(--app-text-muted)", marginTop: 2 }}>{t.desc}</p>
          </div>

          {/* Balance */}
          <div style={{ textAlign: "right" }}>
            <p style={{
              fontSize: 18, fontWeight: 700,
              fontFamily: "monospace", color: t.color,
              letterSpacing: "-0.01em",
            }}>
              {t.display}
            </p>
            {t.active
              ? <p style={{ fontSize: 11, color: "#34D399", marginTop: 3, fontFamily: "monospace" }}>{byLocale("aktif", "active", "активно", "ใช้งาน", "activo", "已启用")}</p>
              : <p style={{ fontSize: 11, color: "var(--app-text-muted)", marginTop: 3 }}>{byLocale("Henüz yok", "Not yet", "Пока нет", "ยังไม่มี", "Aún no", "暂无")}</p>
            }
          </div>
        </div>
      ))}
    </div>
  );
}
