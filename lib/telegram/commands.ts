/**
 * Telegram bot slash-command handlers: /start /scan /help /limit.
 * Copy is inline EN/TR (bot audience TR-first, product language EN). Plain text
 * only — no MarkdownV2/HTML parse mode, so no escaping pitfalls.
 *
 * SERVER-ONLY.
 */

import { sendMessage } from "@/lib/telegram/bot-client";
import { getOrCreateTelegramUser, type TelegramUser } from "@/lib/telegram/identity";
import { getDailyQuota, getTelegramDailyReceiptLimit } from "@/lib/receipt/daily-usage";

function isTrUser(u: TelegramUser): boolean {
  return (u.languageCode ?? "").toLowerCase().startsWith("tr");
}

export async function handleStart(chatId: number | string, u: TelegramUser): Promise<void> {
  const tr = isTrUser(u);
  const limit = getTelegramDailyReceiptLimit();
  const text = tr
    ? [
        "Yumo Yumo'ya hoş geldin. 👋",
        "",
        "Bir fişin fotoğrafını gönder — ödediğinin içindeki gizli maliyeti çıkarıp sana bir kart olarak geri yollarım ve puan kazandırırım.",
        "",
        `Günde en fazla ${limit} fiş işleyebilirsin.`,
        "",
        "Başlamak için bir fiş fotoğrafı gönder, ya da /help yaz.",
      ].join("\n")
    : [
        "Welcome to Yumo Yumo. 👋",
        "",
        "Send a photo of a receipt — I'll reveal the hidden cost inside what you paid, send it back as a card, and earn you points.",
        "",
        `You can process up to ${limit} receipts per day.`,
        "",
        "Send a receipt photo to start, or type /help.",
      ].join("\n");
  await sendMessage(chatId, text);
}

export async function handleScan(chatId: number | string, u: TelegramUser): Promise<void> {
  const tr = isTrUser(u);
  await sendMessage(
    chatId,
    tr
      ? "📸 Bir fişin fotoğrafını çek ve buraya gönder. Gerisini ben hallederim."
      : "📸 Take a photo of a receipt and send it here. I'll take care of the rest."
  );
}

export async function handleHelp(chatId: number | string, u: TelegramUser): Promise<void> {
  const tr = isTrUser(u);
  const text = tr
    ? [
        "Nasıl çalışır",
        "1) Bir fiş fotoğrafı gönder (market, kafe, akaryakıt, eczane…).",
        "2) Fişi işleyip gizli maliyet kartını geri yollarım.",
        "3) Fiş hesabına kaydedilir ve puan kazanırsın.",
        "",
        "Gizlilik: Paylaştığım kartta fiş görselin, adres, ödeme/kart bilgisi yer almaz — yalnızca marka, kategori, gizli maliyet ve kazandığın puan.",
        "",
        "Komutlar: /scan · /limit · /help",
      ].join("\n")
    : [
        "How it works",
        "1) Send a receipt photo (grocery, cafe, fuel, pharmacy…).",
        "2) I process it and send back the hidden-cost card.",
        "3) The receipt is saved to your account and you earn points.",
        "",
        "Privacy: the card I share never includes your receipt image, address, or payment/card details — only merchant, category, hidden cost, and points earned.",
        "",
        "Commands: /scan · /limit · /help",
      ].join("\n");
  await sendMessage(chatId, text);
}

export async function handleLimit(chatId: number | string, u: TelegramUser): Promise<void> {
  const tr = isTrUser(u);
  const identity = await getOrCreateTelegramUser(u);
  const quota = await getDailyQuota(identity.username);
  const resetLocal = new Date(quota.resetAt).toLocaleTimeString(tr ? "tr-TR" : "en-US", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
  });
  const text = tr
    ? `📊 Bugün ${quota.limit} fişten ${quota.used} tanesini kullandın (${quota.remaining} kaldı). Sınır ${resetLocal} UTC'de sıfırlanır.`
    : `📊 You've used ${quota.used} of ${quota.limit} receipts today (${quota.remaining} left). Resets at ${resetLocal} UTC.`;
  await sendMessage(chatId, text);
}

export const BOT_COMMANDS = [
  { command: "start", description: "Start / bilgi" },
  { command: "scan", description: "Fiş gönder / send a receipt" },
  { command: "limit", description: "Günlük hakkın / your daily quota" },
  { command: "help", description: "Yardım / help" },
];
