/**
 * Shareable result card for the Telegram bot (satori / next-og → PNG).
 *
 * This is a social-first, 4:5 portrait card built to be screenshotted and
 * reshared: layered slate ground, warm gold spotlight behind the hero number,
 * gradient hero type, and saturated layer bars. It follows the Yumo Yumo design
 * constitution — depth from gradient + hairline + glow (never a flat rectangle),
 * gold reserved for value, weight/scale contrast carrying the hierarchy.
 *
 * Privacy: carries ONLY non-sensitive fields — merchant, category, hidden-cost
 * total, total paid, top layers, and the points the user *could* earn. Never the
 * receipt image, address, line items, or payment details.
 *
 * satori constraints honoured: flexbox only, every multi-child node is
 * display:flex, gradients via backgroundImage, gradient text via
 * backgroundClip:"text". No blur/backdrop-filter and no radial-gradient (satori
 * draws those with hard box edges and a dark core) — depth comes from full-bleed
 * linear washes. Amounts render the ISO currency code, not the
 * symbol: the bundled font is Latin-only and would draw ฿/₺ as tofu boxes.
 *
 * SERVER-ONLY.
 */

import { ImageResponse } from "next/og";

const W = 1080;
const H = 1350;
const PAD = 76;

const C = {
  ink: "#F4F5FF",
  inkSoft: "rgba(244,245,255,0.66)",
  inkMute: "rgba(244,245,255,0.38)",
  gold0: "#FFE9A8",
  gold1: "#E8C97A",
  gold2: "#C9A84C",
  coral: "#FF7A7A",
  emerald: "#3DDC97",
  sky: "#38BDF8",
  violet: "#B197FC",
  pink: "#F472B6",
  purple: "#9B7BFF",
  hair: "rgba(255,255,255,0.10)",
  ink900: "#141006",
};

export interface ResultLayer {
  label: string;
  amount: number;
  color: string;
}

export interface ResultView {
  merchant: string;
  category: string | null;
  currency: string;
  /** Kept for callers/captions; the card intentionally renders the code instead. */
  symbol: string;
  total: number;
  hidden: number;
  layers: ResultLayer[];
  rewardAmount: number;
  rewardUnit: string;
  isTr: boolean;
}

/** Group digits so big numbers stay readable: 117 → 117, 1234.5 → 1,234.5 */
function formatAmount(value: number): string {
  const n = value ?? 0;
  const fixed = Number.isInteger(n) ? String(n) : (Math.round(n * 100) / 100).toFixed(2);
  const [int, dec] = fixed.split(".");
  const grouped = int.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return dec ? `${grouped}.${dec}` : grouped;
}

/** Hero type scale — keeps the headline number on a single line at any magnitude. */
function heroSize(text: string): number {
  const n = text.length;
  if (n <= 4) return 232;
  if (n <= 6) return 206;
  if (n <= 8) return 168;
  if (n <= 10) return 138;
  return 116;
}

export async function renderReceiptResultImage(view: ResultView): Promise<Buffer> {
  const hiddenText = formatAmount(view.hidden);
  const hiddenPct = view.total > 0 ? Math.round((view.hidden / view.total) * 100) : 0;
  const layers = view.layers
    .filter((l) => l.amount > 0)
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 3);
  const maxAmt = layers.reduce((m, l) => Math.max(m, l.amount), 0) || 1;
  const cur = view.currency || "";

  const image = new ImageResponse(
    (
      <div
        style={{
          width: `${W}px`,
          height: `${H}px`,
          display: "flex",
          flexDirection: "column",
          position: "relative",
          padding: `${PAD}px`,
          backgroundColor: "#090B11",
          backgroundImage: "linear-gradient(155deg, #141A2B 0%, #0B0E17 46%, #07090F 100%)",
          color: C.ink,
          fontFamily: "sans-serif",
        }}
      >
        {/* ── depth: full-bleed angled washes ─────────────────────────────
            satori renders radial-gradient with hard rectangular edges and a
            dark core, so depth is built from linear washes only. Each stop
            fades to its OWN rgb at alpha 0 (fading to rgba(0,0,0,0) muddies
            the midpoint), and every layer is full-bleed so no box edge shows. */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: `${W}px`,
            height: `${H}px`,
            display: "flex",
            backgroundImage:
              "linear-gradient(212deg, rgba(155,123,255,0.34) 0%, rgba(155,123,255,0.10) 26%, rgba(155,123,255,0) 48%)",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: `${W}px`,
            height: `${H}px`,
            display: "flex",
            backgroundImage:
              "linear-gradient(18deg, rgba(56,189,248,0.30) 0%, rgba(56,189,248,0.08) 28%, rgba(56,189,248,0) 52%)",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: `${W}px`,
            height: `${H}px`,
            display: "flex",
            backgroundImage:
              "linear-gradient(168deg, rgba(232,201,122,0) 14%, rgba(232,201,122,0.20) 30%, rgba(232,201,122,0.04) 44%, rgba(232,201,122,0) 58%)",
          }}
        />

        {/* ── header ─────────────────────────────────────────────────────── */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", fontSize: 40, fontWeight: 800, letterSpacing: -0.5 }}>
              {view.merchant}
            </div>
            {view.category && (
              <div
                style={{
                  display: "flex",
                  marginTop: 12,
                  fontSize: 20,
                  fontWeight: 700,
                  letterSpacing: 3,
                  color: C.inkMute,
                }}
              >
                {view.category.toLocaleUpperCase(view.isTr ? "tr-TR" : "en-US")}
              </div>
            )}
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              padding: "12px 22px",
              borderRadius: 999,
              border: `1px solid ${C.hair}`,
              backgroundImage: "linear-gradient(180deg, rgba(255,255,255,0.09), rgba(255,255,255,0.02))",
              fontSize: 20,
              fontWeight: 800,
              letterSpacing: 2,
              color: C.inkSoft,
            }}
          >
            YUMO YUMO
          </div>
        </div>

        <div
          style={{
            display: "flex",
            height: "1px",
            marginTop: 34,
            backgroundImage:
              "linear-gradient(90deg, rgba(255,255,255,0.22), rgba(255,255,255,0.05) 55%, rgba(255,255,255,0))",
          }}
        />

        {/* ── hero ───────────────────────────────────────────────────────── */}
        <div style={{ display: "flex", flexDirection: "column", marginTop: 54 }}>
          <div style={{ display: "flex", alignItems: "center" }}>
            <div style={{ display: "flex", width: 44, height: 4, borderRadius: 2, backgroundColor: C.coral }} />
            <div
              style={{
                display: "flex",
                marginLeft: 16,
                fontSize: 26,
                fontWeight: 800,
                letterSpacing: 6,
                color: C.coral,
              }}
            >
              {view.isTr ? "GİZLİ MALİYET" : "HIDDEN COST"}
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "flex-end", marginTop: 14 }}>
            <div
              style={{
                display: "flex",
                fontSize: heroSize(hiddenText),
                fontWeight: 800,
                lineHeight: 1,
                letterSpacing: -4,
                backgroundImage: `linear-gradient(160deg, ${C.gold0} 8%, ${C.gold1} 52%, ${C.gold2} 100%)`,
                backgroundClip: "text",
                color: "transparent",
              }}
            >
              {hiddenText}
            </div>
            <div
              style={{
                display: "flex",
                marginLeft: 18,
                marginBottom: 22,
                fontSize: 40,
                fontWeight: 800,
                letterSpacing: 4,
                color: C.gold2,
              }}
            >
              {cur}
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", marginTop: 26 }}>
            <div style={{ display: "flex", fontSize: 30, fontWeight: 600, color: C.inkSoft }}>
              {view.isTr
                ? `${formatAmount(view.total)} ${cur} ödedin`
                : `out of ${formatAmount(view.total)} ${cur} paid`}
            </div>
            <div
              style={{
                display: "flex",
                marginLeft: 20,
                padding: "10px 20px",
                borderRadius: 999,
                backgroundImage: "linear-gradient(135deg, rgba(255,122,122,0.26), rgba(255,122,122,0.10))",
                border: "1px solid rgba(255,122,122,0.38)",
                fontSize: 28,
                fontWeight: 800,
                color: "#FFB4B4",
              }}
            >
              {view.isTr ? `%${hiddenPct}` : `${hiddenPct}%`}
            </div>
          </div>
        </div>

        {/* ── breakdown ──────────────────────────────────────────────────── */}
        <div style={{ display: "flex", flexDirection: "column", marginTop: 58 }}>
          <div style={{ display: "flex", fontSize: 22, fontWeight: 800, letterSpacing: 5, color: C.inkMute }}>
            {view.isTr ? "PARA NEREYE GİTTİ" : "WHERE THE MONEY WENT"}
          </div>

          {layers.map((l, i) => (
            <div key={i} style={{ display: "flex", flexDirection: "column", marginTop: 30 }}>
              <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
                <div style={{ display: "flex", fontSize: 27, fontWeight: 700, letterSpacing: 2, color: C.ink }}>
                  {l.label.toLocaleUpperCase(view.isTr ? "tr-TR" : "en-US")}
                </div>
                <div style={{ display: "flex", alignItems: "baseline" }}>
                  <div style={{ display: "flex", fontSize: 40, fontWeight: 800, color: l.color }}>
                    {formatAmount(l.amount)}
                  </div>
                  <div
                    style={{
                      display: "flex",
                      marginLeft: 10,
                      fontSize: 22,
                      fontWeight: 700,
                      letterSpacing: 2,
                      color: C.inkMute,
                    }}
                  >
                    {cur}
                  </div>
                </div>
              </div>
              <div
                style={{
                  display: "flex",
                  height: 14,
                  marginTop: 12,
                  borderRadius: 999,
                  backgroundColor: "rgba(255,255,255,0.07)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    width: `${Math.max(6, Math.round((l.amount / maxAmt) * 100))}%`,
                    borderRadius: 999,
                    backgroundImage: `linear-gradient(90deg, ${l.color}, ${l.color}99)`,
                  }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* pushes the CTA block to the bottom without ever overlapping above */}
        <div style={{ display: "flex", flexGrow: 1, minHeight: 40 }} />

        {/* ── value + CTA ────────────────────────────────────────────────── */}
        <div style={{ display: "flex", flexDirection: "column" }}>
          {view.rewardAmount > 0 && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                alignSelf: "flex-start",
                padding: "22px 34px",
                borderRadius: 24,
                backgroundImage: `linear-gradient(135deg, ${C.gold0} 0%, ${C.gold1} 48%, ${C.gold2} 100%)`,
                boxShadow: "0 18px 48px rgba(201,168,76,0.34)",
                color: C.ink900,
              }}
            >
              <div style={{ display: "flex", fontSize: 24, fontWeight: 800, letterSpacing: 3 }}>
                {view.isTr ? "KAZANABİLİRSİN" : "YOU COULD EARN"}
              </div>
              <div style={{ display: "flex", marginLeft: 18, fontSize: 46, fontWeight: 800, letterSpacing: -1 }}>
                {`+${formatAmount(view.rewardAmount)}`}
              </div>
              <div style={{ display: "flex", marginLeft: 10, fontSize: 26, fontWeight: 800 }}>
                {view.rewardUnit}
              </div>
            </div>
          )}

          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginTop: 34,
              paddingTop: 26,
              borderTop: `1px solid ${C.hair}`,
            }}
          >
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ display: "flex", fontSize: 34, fontWeight: 800, letterSpacing: -0.5 }}>
                yumoyumo.com
              </div>
              <div style={{ display: "flex", marginTop: 8, fontSize: 22, fontWeight: 600, color: C.inkMute }}>
                {view.isTr ? "fişini tara, gerçeğini gör" : "scan your receipt, see the truth"}
              </div>
            </div>
            <div
              style={{
                display: "flex",
                padding: "14px 26px",
                borderRadius: 999,
                border: `1px solid ${C.hair}`,
                backgroundImage: "linear-gradient(180deg, rgba(255,255,255,0.10), rgba(255,255,255,0.02))",
                fontSize: 22,
                fontWeight: 800,
                letterSpacing: 2,
                color: C.inkSoft,
              }}
            >
              {view.isTr ? "TARA & KAZAN" : "SCAN & EARN"}
            </div>
          </div>
        </div>
      </div>
    ),
    { width: W, height: H }
  );

  return Buffer.from(await image.arrayBuffer());
}
