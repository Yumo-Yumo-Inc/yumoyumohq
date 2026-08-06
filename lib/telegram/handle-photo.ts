/**
 * Telegram bot photo handler — the core in-chat receipt flow.
 *
 * Downloads the photo, runs it through the shared receipt pipeline
 * (run-pipeline-headless → same runAnalyzeStages + post-process, incl. the
 * Telegram daily-quota reservation), renders a privacy-safe result card, and
 * sends it back into the chat. Limit / rejection / duplicate / error each get a
 * clear message. No stack traces or internal detail leak to the user.
 *
 * SERVER-ONLY.
 */

import type { ReceiptAnalysis } from "@/lib/receipt/types";
import type { Receipt } from "@/lib/mock/types";
import { convertReceiptAnalysisToReceipt } from "@/lib/receipt/receipt-converter";
import { runReceiptPipelineHeadless } from "@/lib/receipt/analyze/run-pipeline-headless";
import { renderReceiptResultImage, type ResultLayer } from "@/lib/telegram/result-image";
import { getOrCreateTelegramUser, type TelegramUser } from "@/lib/telegram/identity";
import { getDailyQuota } from "@/lib/receipt/daily-usage";
import { sendMessage, sendPhoto, sendChatAction } from "@/lib/telegram/bot-client";

const CURRENCY_SYMBOLS: Record<string, string> = {
  TRY: "₺", USD: "$", EUR: "€", GBP: "£", RUB: "₽", THB: "฿", CNY: "¥", JPY: "¥",
};

function symbolFor(currency: string | null | undefined): string {
  return currency ? CURRENCY_SYMBOLS[currency.toUpperCase()] ?? "" : "";
}

function money(v: number, sym: string, cur: string): string {
  const n = v || 0;
  const core = Number.isInteger(n) ? String(n) : n.toFixed(2);
  return sym ? `${sym}${core}` : cur ? `${core} ${cur}` : core;
}

function buildLayers(receipt: Receipt, tr: boolean): ResultLayer[] {
  const hc = receipt.hiddenCost;
  if (!hc) return [];
  return [
    { label: tr ? "Ürün" : "Product", amount: hc.productValue || 0, color: "#34D399" },
    { label: tr ? "Tedarik" : "Supply", amount: hc.importSystem || 0, color: "#0EA5E9" },
    { label: tr ? "Mağaza" : "Store", amount: hc.retailBrand || 0, color: "#A78BFA" },
    { label: tr ? "ÖTV" : "Excise", amount: hc.exciseTax || 0, color: "#F472B6" },
    { label: tr ? "Vergi" : "Tax", amount: (hc as { state?: number }).state || 0, color: "#8B5CF6" },
  ];
}

export async function handlePhoto(
  chatId: number | string,
  u: TelegramUser,
  fileId: string,
  downloadFile: (id: string) => Promise<Buffer | null>
): Promise<void> {
  const tr = (u.languageCode ?? "").toLowerCase().startsWith("tr");
  const identity = await getOrCreateTelegramUser(u);

  const buffer = await downloadFile(fileId);
  if (!buffer) {
    // Download failed before any processing — no quota consumed.
    await sendMessage(
      chatId,
      tr ? "Fotoğrafı alamadım, bir daha dener misin?" : "I couldn't fetch the photo — please try again."
    );
    return;
  }

  await sendChatAction(chatId, "upload_photo");

  const result = await runReceiptPipelineHeadless({ username: identity.username, imageBuffer: buffer });

  if (result.ok === false) {
    if (result.kind === "limit") {
      const reset = new Date(result.quota.resetAt).toLocaleTimeString(tr ? "tr-TR" : "en-US", {
        hour: "2-digit", minute: "2-digit", timeZone: "UTC",
      });
      await sendMessage(
        chatId,
        tr
          ? `Bugünlük fiş sınırına ulaştın (${result.quota.limit}/${result.quota.limit}). Sınır ${reset} UTC'de sıfırlanır.`
          : `You've hit today's receipt limit (${result.quota.limit}/${result.quota.limit}). It resets at ${reset} UTC.`
      );
      return;
    }
    if (result.kind === "duplicate") {
      await sendMessage(chatId, tr ? "Bu fişi daha önce işledik. 🔁" : "We've already processed this receipt. 🔁");
      return;
    }
    if (result.kind === "rejected") {
      await sendMessage(
        chatId,
        tr
          ? "Bu görsel geçerli bir fiş gibi görünmüyor. Net bir fiş fotoğrafı gönderir misin?"
          : "This doesn't look like a valid receipt. Could you send a clear photo of one?"
      );
      return;
    }
    await sendMessage(
      chatId,
      tr ? "Fişi işlerken bir sorun oldu, birazdan tekrar dener misin?" : "Something went wrong processing the receipt — please try again shortly."
    );
    return;
  }

  // Success — render the privacy-safe card and send it with a short caption.
  const receipt = convertReceiptAnalysisToReceipt(result.payload as unknown as ReceiptAnalysis, "");
  const sym = symbolFor(receipt.currency);
  const cur = receipt.currency || "";
  const hidden = receipt.hiddenCost?.totalHidden || 0;
  const total = receipt.total || 0;
  const rewardAmount = receipt.reward?.amount || 0;

  let photo: Buffer | null = null;
  try {
    photo = await renderReceiptResultImage({
      merchant: receipt.merchantName || "—",
      category: receipt.category || null,
      currency: cur,
      symbol: sym,
      total,
      hidden,
      layers: buildLayers(receipt, tr),
      rewardAmount,
      rewardUnit: tr ? "puan" : "points",
      isTr: tr,
    });
  } catch (imgError) {
    console.warn("[telegram/photo] image render failed, sending text:", imgError instanceof Error ? imgError.message : imgError);
  }

  const quota = await getDailyQuota(identity.username);
  const pct = total > 0 ? Math.round((hidden / total) * 100) : 0;
  const caption = tr
    ? [
        `${receipt.merchantName || "Fiş"} · ${money(total, sym, cur)}`,
        `Gizli maliyet: ${money(hidden, sym, cur)} (%${pct})`,
        rewardAmount > 0
          ? `Bu fişi yumoyumo.com'da tarasan +${Math.round(rewardAmount)} puan kazanırsın.`
          : `Kazanmaya başlamak için yumoyumo.com'da tara.`,
        `Bugün: ${quota.used}/${quota.limit} ücretsiz tarama`,
      ].join("\n")
    : [
        `${receipt.merchantName || "Receipt"} · ${money(total, sym, cur)}`,
        `Hidden cost: ${money(hidden, sym, cur)} (${pct}%)`,
        rewardAmount > 0
          ? `Scan this on yumoyumo.com to earn +${Math.round(rewardAmount)} points.`
          : `Scan on yumoyumo.com to start earning.`,
        `Today: ${quota.used}/${quota.limit} free scans`,
      ].join("\n");

  if (photo) {
    await sendPhoto(chatId, photo, { caption });
  } else {
    await sendMessage(chatId, caption);
  }
}
