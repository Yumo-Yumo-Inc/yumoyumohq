/**
 * Shareable "hidden cost" card — a scroll-stopping, social-native PNG of a
 * receipt's hidden-cost reveal (X, Instagram, TikTok, WhatsApp status).
 *
 * Design direction: typography-as-hero with the money amount (not a percentage) as
 * the giant scroll-stop, thousands abbreviated with K/M, generous breathing room,
 * 4:5 portrait so it lands native in feeds and stories. The palette is Yumo Yumo's
 * own — deep slate base, gold as the value/hero accent, and the in-app cost-layer
 * colours for the breakdown — so the card feels continuous with the product, not
 * borrowed from a template. Defensive: any failure rejects so the caller can fall back.
 */

import type { Receipt } from "@/lib/mock/types";
import { normalizeReceiptCategory } from "@/lib/receipt/categories";
import { currencySymbol } from "@/components/app/receipt-detail/proof/theme";

const W = 1080;
const H = 1350;
const M = 90; // outer margin
const CW = W - 2 * M; // content width

// Yumo Yumo palette — slate + gold + the in-app cost-layer accents.
const C = {
  bg0: "#0E1119",
  bg1: "#0A0C12",
  ink: "#F0F0FF",
  inkSoft: "rgba(240,240,255,0.72)",
  inkMute: "rgba(240,240,255,0.42)",
  gold0: "#E8C97A",
  gold1: "#C9A84C",
  gold2: "#A07830",
  coral: "#F87171",
  emerald: "#34D399", // product / real value
  sky: "#0EA5E9", // supply
  violet: "#A78BFA", // retail / store
  purple: "#8B5CF6", // tax (VAT)
  pink: "#F472B6", // excise
  glassLine: "rgba(255,255,255,0.10)",
  ink900: "#14110A", // text on gold
};

/** Localized labels for canonical receipt categories (EN is the source). */
const CATEGORY_LABELS: Record<string, { en: string; tr: string }> = {
  cafe: { en: "Cafe", tr: "Kafe" },
  restaurant: { en: "Restaurant", tr: "Restoran" },
  grocery: { en: "Grocery", tr: "Market" },
  kiosk: { en: "Convenience", tr: "Bakkal" },
  apparel: { en: "Apparel", tr: "Giyim" },
  electronics: { en: "Electronics", tr: "Elektronik" },
  fuel: { en: "Fuel", tr: "Yakıt" },
  alcohol: { en: "Alcohol", tr: "Alkol" },
  tobacco: { en: "Tobacco", tr: "Tütün" },
  pharmacy: { en: "Pharmacy", tr: "Eczane" },
  fashion: { en: "Fashion", tr: "Giyim" },
  beauty: { en: "Beauty", tr: "Kozmetik" },
  personal_care: { en: "Personal care", tr: "Kişisel Bakım" },
  utilities: { en: "Utilities", tr: "Faturalar" },
  travel: { en: "Travel", tr: "Seyahat" },
  hospitality_lodging: { en: "Lodging", tr: "Konaklama" },
  healthcare: { en: "Healthcare", tr: "Sağlık" },
  services: { en: "Services", tr: "Hizmet" },
  other: { en: "Other", tr: "Diğer" },
};

function categoryLabel(value: string | null | undefined, isTr: boolean): string | null {
  const canonical = normalizeReceiptCategory(value);
  if (!canonical || canonical === "other") return null;
  const entry = CATEGORY_LABELS[canonical];
  return entry ? (isTr ? entry.tr : entry.en) : null;
}

function fontVar(name: string): string {
  if (typeof document === "undefined") return "";
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

/** Abbreviate money: 117140.62 → "₺117K", 450000 → "₺450K", 8500 → "₺8.5K", 46 → "₺46". */
function shortMoney(value: number, symbol: string, currency: string): string {
  const n = value ?? 0;
  const abs = Math.abs(n);
  let core: string;
  if (abs >= 1e6) {
    const m = n / 1e6;
    core = `${Math.abs(m) >= 10 ? Math.round(m) : Math.round(m * 10) / 10}M`;
  } else if (abs >= 1e3) {
    const k = n / 1e3;
    core = `${Math.abs(k) >= 10 ? Math.round(k) : Math.round(k * 10) / 10}K`;
  } else {
    core = Number.isInteger(n) ? String(n) : (Math.round(n * 100) / 100).toFixed(2);
  }
  if (symbol) return `${symbol}${core}`;
  return currency ? `${core} ${currency}` : core;
}

/** Load a same-origin image for canvas compositing (no toBlob taint). */
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`share-card: image load failed (${src})`));
    img.src = src;
  });
}

function roundRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
): void {
  const rr = Math.min(r, h / 2, w / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

export async function generateReceiptShareCard(receipt: Receipt, locale: string): Promise<Blob> {
  if (typeof document === "undefined") throw new Error("share-card: no document");

  try {
    await (document as Document & { fonts?: FontFaceSet }).fonts?.ready;
  } catch {
    /* ignore */
  }

  let logo: HTMLImageElement | null = null;
  try {
    logo = await loadImage("/pwa/icon-512.png");
  } catch {
    logo = null;
  }

  const isTr = locale === "tr";
  const cond = fontVar("--font-barlow-condensed");
  const sans = fontVar("--font-dm-sans");
  const COND = (size: number, weight = 800) =>
    `${weight} ${size}px ${cond ? `${cond},` : ""} "Arial Narrow", "Helvetica Neue", sans-serif`;
  const SANS = (size: number, weight = 700) =>
    `${weight} ${size}px ${sans ? `${sans},` : ""} ui-sans-serif, system-ui, sans-serif`;

  const dpr = 2;
  const canvas = document.createElement("canvas");
  canvas.width = W * dpr;
  canvas.height = H * dpr;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("share-card: no 2d context");
  ctx.scale(dpr, dpr);
  ctx.textBaseline = "alphabetic";

  const setLS = (px: number) => {
    try {
      (ctx as CanvasRenderingContext2D & { letterSpacing?: string }).letterSpacing = `${px}px`;
    } catch {
      /* not supported */
    }
  };
  const fitSize = (text: string, mk: (s: number) => string, start: number, maxW: number, min = 48) => {
    let s = start;
    ctx.font = mk(s);
    while (ctx.measureText(text).width > maxW && s > min) {
      s -= 4;
      ctx.font = mk(s);
    }
    return s;
  };
  /** Vertical gold gradient between two y values — the brand FLAME. */
  const goldGrad = (y0: number, y1: number) => {
    const g = ctx.createLinearGradient(0, y0, 0, y1);
    g.addColorStop(0, C.gold0);
    g.addColorStop(0.55, C.gold1);
    g.addColorStop(1, C.gold2);
    return g;
  };

  const hc = receipt.hiddenCost;
  const total = receipt.total || 0;
  const symbol = currencySymbol(receipt.currency);
  const cur = receipt.currency;
  const hidden = hc?.totalHidden || 0;
  const hiddenPct = total > 0 ? Math.round((hidden / total) * 100) : 0;
  const money = (v: number) => shortMoney(v, symbol, cur);

  // ===== background: deep slate, warm gold spotlight, cool depth =====
  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, C.bg0);
  bg.addColorStop(1, C.bg1);
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  const blob = (cx: number, cy: number, rad: number, color: string, a: number) => {
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, rad);
    g.addColorStop(0, color);
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.save();
    ctx.globalAlpha = a;
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    ctx.restore();
  };
  blob(W * 0.34, 430, 560, C.gold1, 0.16); // warm spotlight on the hero amount
  blob(W - 30, 110, 420, C.violet, 0.12); // cool depth, top-right
  blob(70, H - 70, 540, C.sky, 0.1); // cool depth, bottom-left

  // hairline gold frame for premium edge
  ctx.strokeStyle = "rgba(201,168,76,0.16)";
  ctx.lineWidth = 2;
  roundRectPath(ctx, 18, 18, W - 36, H - 36, 34);
  ctx.stroke();

  // ===== top row: Yumbie logo + merchant / category =====
  const logoSize = 78;
  const logoY = 84;
  if (logo) {
    ctx.drawImage(logo, M, logoY, logoSize, logoSize);
  }
  const headX = M + logoSize + 22;
  ctx.fillStyle = C.ink;
  ctx.font = SANS(30, 800);
  let merchant = receipt.merchantName || "—";
  while (ctx.measureText(merchant).width > CW - logoSize - 22 && merchant.length > 4) {
    merchant = merchant.slice(0, -2);
  }
  if (merchant !== (receipt.merchantName || "—")) merchant = `${merchant.trimEnd()}…`;
  ctx.fillText(merchant, headX, logoY + 32);
  const metaParts = [
    categoryLabel(receipt.category, isTr),
    (receipt.date || "").split("T")[0] || null,
  ].filter(Boolean) as string[];
  ctx.fillStyle = C.inkMute;
  ctx.font = SANS(21, 700);
  setLS(0.5);
  ctx.fillText(metaParts.join("   ·   "), headX, logoY + 64);
  setLS(0);

  // ===== HERO: giant hidden-cost amount in gold (the scroll-stop) =====
  let y = 322;
  ctx.fillStyle = C.coral;
  ctx.font = SANS(34, 800);
  setLS(3);
  ctx.fillText(isTr ? "GİZLİ MALİYET" : "HIDDEN COST", M, y);
  setLS(0);

  const heroText = money(hidden);
  const heroSize = fitSize(heroText, (s) => COND(s, 800), 300, CW, 120);
  ctx.font = COND(heroSize, 800);
  const heroTop = y + 40;
  const heroBaseline = heroTop + heroSize * 0.78;
  // gold glow halo so the number reads as a glowing value, not flat text
  ctx.save();
  ctx.shadowColor = "rgba(201,168,76,0.55)";
  ctx.shadowBlur = 48;
  ctx.fillStyle = goldGrad(heroTop, heroBaseline + 8);
  ctx.fillText(heroText, M - 4, heroBaseline);
  ctx.restore();

  // context line — paid amount, amounts leading; % only as a small chip
  y = heroBaseline + 54;
  ctx.fillStyle = C.ink;
  ctx.font = SANS(38, 800);
  const paidStr = money(total);
  ctx.fillText(isTr ? `${paidStr} ödedim` : `out of ${paidStr} I paid`, M, y);
  ctx.font = SANS(24, 800);
  const chip = isTr ? `harcamamın %${hiddenPct}'i` : `${hiddenPct}% of my spend`;
  const chipW = ctx.measureText(chip).width + 36;
  const chipH = 44;
  const chipY = y + 22;
  roundRectPath(ctx, M, chipY, chipW, chipH, 22);
  ctx.fillStyle = "rgba(201,168,76,0.12)";
  ctx.fill();
  ctx.fillStyle = C.gold0;
  ctx.fillText(chip, M + 18, chipY + 30);

  // ===== breakdown: bold amount-led bars in the in-app layer colours =====
  const layerDefs = [
    { amount: hc?.productValue || 0, color: C.emerald, en: "Product", tr: "Ürün" },
    { amount: hc?.importSystem || 0, color: C.sky, en: "Supply", tr: "Tedarik" },
    { amount: hc?.retailBrand || 0, color: C.violet, en: "Store", tr: "Mağaza" },
    { amount: hc?.exciseTax || 0, color: C.pink, en: "Excise", tr: "ÖTV" },
    { amount: hc?.state || 0, color: C.purple, en: "Tax", tr: "Vergi" },
  ]
    .filter((l) => l.amount > 0)
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 3);
  const maxAmt = layerDefs.reduce((m, l) => Math.max(m, l.amount), 0) || 1;

  let by = chipY + chipH + 92;
  ctx.fillStyle = C.inkMute;
  ctx.font = SANS(26, 800);
  setLS(2);
  ctx.fillText(isTr ? "PARA NEREYE GİTTİ" : "WHERE THE MONEY WENT", M, by - 34);
  setLS(0);

  const rowH = 96;
  layerDefs.forEach((l) => {
    ctx.fillStyle = C.ink;
    ctx.font = SANS(28, 800);
    ctx.fillText((isTr ? l.tr : l.en).toUpperCase(), M, by);
    ctx.textAlign = "right";
    ctx.fillStyle = l.color;
    ctx.font = COND(58, 800);
    ctx.fillText(money(l.amount), W - M, by);
    ctx.textAlign = "left";
    const trackY = by + 18;
    const trackH = 18;
    roundRectPath(ctx, M, trackY, CW, trackH, 9);
    ctx.fillStyle = "rgba(255,255,255,0.08)";
    ctx.fill();
    const segW = Math.max(trackH, (CW * l.amount) / maxAmt);
    roundRectPath(ctx, M, trackY, segW, trackH, 9);
    ctx.fillStyle = l.color;
    ctx.fill();
    by += rowH;
  });

  // ===== reward sticker (never top-right) — gold rotated badge =====
  const reward = receipt.reward;
  if (reward && reward.amount > 0) {
    const unit = reward.symbol || "cPoints";
    const valueText = `+${shortMoney(reward.amount, "", "")} ${unit}`;
    const label = isTr ? "KAZANDIN" : "YOU EARNED";
    ctx.font = COND(46, 800);
    const vW = ctx.measureText(valueText).width;
    ctx.font = SANS(22, 800);
    const lW = ctx.measureText(label).width;
    const padX = 30;
    const stickerW = Math.max(vW, lW) + padX * 2;
    const stickerH = 116;
    const stickerX = M;
    const stickerY = by + 14;
    ctx.save();
    ctx.translate(stickerX + stickerW / 2, stickerY + stickerH / 2);
    ctx.rotate((-2.5 * Math.PI) / 180);
    ctx.translate(-stickerW / 2, -stickerH / 2);
    ctx.shadowColor = "rgba(201,168,76,0.4)";
    ctx.shadowBlur = 30;
    ctx.shadowOffsetY = 10;
    roundRectPath(ctx, 0, 0, stickerW, stickerH, 22);
    ctx.fillStyle = goldGrad(0, stickerH);
    ctx.fill();
    ctx.shadowColor = "transparent";
    ctx.fillStyle = C.ink900;
    ctx.font = SANS(22, 800);
    setLS(2);
    ctx.fillText(label, padX, 42);
    setLS(0);
    ctx.font = COND(46, 800);
    ctx.fillText(valueText, padX, 92);
    ctx.restore();
  }

  // ===== footer: url (brand carried by logo + url, no repeated name) =====
  ctx.fillStyle = C.inkMute;
  ctx.font = SANS(22, 700);
  ctx.fillText(isTr ? "fişini tara, gerçeği gör" : "scan your receipt, see the truth", M, H - 78);
  ctx.fillStyle = C.ink;
  ctx.font = SANS(34, 800);
  ctx.fillText("yumoyumo.com", M, H - 40);

  return await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("share-card: toBlob failed"));
    }, "image/png");
  });
}
