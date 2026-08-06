/**
 * Telegram Bot webhook.
 *
 * Telegram POSTs updates here. Authenticity is enforced by the secret token
 * Telegram echoes in the `X-Telegram-Bot-Api-Secret-Token` header (set via
 * setWebhook) — matched against TELEGRAM_WEBHOOK_SECRET. Because the request is
 * authenticated by that shared secret, the `from.id` inside the update is
 * trusted (no initData needed).
 *
 * The heavy work (pipeline + image) runs in an `after()` callback so we return
 * 200 immediately and Telegram does not retry / duplicate the update.
 */
import { NextResponse, after } from "next/server";

import { downloadTelegramFile } from "@/lib/telegram/bot-client";
import { handlePhoto } from "@/lib/telegram/handle-photo";
import { handleStart, handleScan, handleHelp, handleLimit } from "@/lib/telegram/commands";
import {
  webhookSecretMatches,
  toTelegramUser,
  extractImageFileId,
  parseCommand,
} from "@/lib/telegram/webhook-utils";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60; // OCR + LLM + image render

export async function POST(req: Request) {
  if (!webhookSecretMatches(req.headers.get("x-telegram-bot-api-secret-token"), process.env.TELEGRAM_WEBHOOK_SECRET)) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  let update: any;
  try {
    update = await req.json();
  } catch {
    return NextResponse.json({ ok: true }); // ack malformed bodies, don't retry
  }

  const message = update?.message ?? update?.edited_message;
  const from = message?.from as Record<string, unknown> | undefined;
  const chatId = message?.chat?.id;
  const user = toTelegramUser(from);

  // Nothing actionable — ack so Telegram stops retrying.
  if (!message || chatId == null || !user) {
    return NextResponse.json({ ok: true });
  }

  // Handle in the background; respond 200 now so Telegram doesn't re-deliver.
  after(async () => {
    try {
      const command = parseCommand(typeof message.text === "string" ? message.text : null);

      if (command === "start") return void (await handleStart(chatId, user));
      if (command === "scan") return void (await handleScan(chatId, user));
      if (command === "help") return void (await handleHelp(chatId, user));
      if (command === "limit") return void (await handleLimit(chatId, user));

      // Photo (compressed) or an image/pdf sent as a document.
      const fileId = extractImageFileId(message);
      if (fileId) {
        await handlePhoto(chatId, user, fileId, downloadTelegramFile);
        return;
      }

      // Any other message — nudge toward sending a photo.
      if (command) return; // unknown command: stay quiet
      const { sendMessage } = await import("@/lib/telegram/bot-client");
      const tr = (user.languageCode ?? "").toLowerCase().startsWith("tr");
      await sendMessage(
        chatId,
        tr
          ? "Bir fiş fotoğrafı gönder, gizli maliyetini çıkarayım. /help"
          : "Send a receipt photo and I'll reveal its hidden cost. /help"
      );
    } catch (error) {
      console.error("[telegram/webhook] handler error:", error instanceof Error ? error.message : error);
    }
  });

  return NextResponse.json({ ok: true });
}
