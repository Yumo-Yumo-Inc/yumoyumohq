/**
 * Minimal Telegram Bot API client.
 *
 * Wraps the handful of Bot API methods the in-chat receipt flow needs. The bot
 * token is read from TELEGRAM_BOT_TOKEN and never leaves the server. All calls
 * are defensive: they resolve to `{ ok: false }` on transport/API errors rather
 * than throwing, so a Telegram hiccup never crashes the webhook handler.
 *
 * SERVER-ONLY.
 */

if (typeof window !== "undefined") {
  throw new Error("telegram/bot-client is a server-only module.");
}

const API_BASE = "https://api.telegram.org";

function botToken(): string | null {
  return process.env.TELEGRAM_BOT_TOKEN?.trim() || null;
}

interface TgResponse<T = unknown> {
  ok: boolean;
  result?: T;
  description?: string;
  error_code?: number;
}

async function callTelegram<T = unknown>(
  method: string,
  params?: Record<string, unknown>
): Promise<TgResponse<T>> {
  const token = botToken();
  if (!token) return { ok: false, description: "no_bot_token" };
  try {
    const res = await fetch(`${API_BASE}/bot${token}/${method}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params ?? {}),
    });
    return (await res.json()) as TgResponse<T>;
  } catch (error) {
    console.warn(`[telegram/bot] ${method} failed:`, error instanceof Error ? error.message : error);
    return { ok: false, description: "transport_error" };
  }
}

export interface InlineKeyboardButton {
  text: string;
  url?: string;
  callback_data?: string;
}

export async function sendMessage(
  chatId: number | string,
  text: string,
  opts?: { parseMode?: "HTML" | "MarkdownV2"; buttons?: InlineKeyboardButton[][] }
): Promise<TgResponse> {
  return callTelegram("sendMessage", {
    chat_id: chatId,
    text,
    parse_mode: opts?.parseMode,
    reply_markup: opts?.buttons ? { inline_keyboard: opts.buttons } : undefined,
    disable_web_page_preview: true,
  });
}

export async function sendChatAction(chatId: number | string, action: "typing" | "upload_photo"): Promise<void> {
  await callTelegram("sendChatAction", { chat_id: chatId, action });
}

/** Send a PNG/JPEG buffer as a photo with an optional caption. Uses multipart. */
export async function sendPhoto(
  chatId: number | string,
  photo: Buffer,
  opts?: { caption?: string; parseMode?: "HTML" | "MarkdownV2"; filename?: string; buttons?: InlineKeyboardButton[][] }
): Promise<TgResponse> {
  const token = botToken();
  if (!token) return { ok: false, description: "no_bot_token" };
  try {
    const form = new FormData();
    form.append("chat_id", String(chatId));
    if (opts?.caption) form.append("caption", opts.caption);
    if (opts?.parseMode) form.append("parse_mode", opts.parseMode);
    if (opts?.buttons) form.append("reply_markup", JSON.stringify({ inline_keyboard: opts.buttons }));
    const blob = new Blob([new Uint8Array(photo)], { type: "image/png" });
    form.append("photo", blob, opts?.filename ?? "yumo-result.png");
    const res = await fetch(`${API_BASE}/bot${token}/sendPhoto`, { method: "POST", body: form });
    return (await res.json()) as TgResponse;
  } catch (error) {
    console.warn("[telegram/bot] sendPhoto failed:", error instanceof Error ? error.message : error);
    return { ok: false, description: "transport_error" };
  }
}

/** Resolve a Telegram file_id to a downloadable path, then fetch its bytes. */
export async function downloadTelegramFile(fileId: string): Promise<Buffer | null> {
  const token = botToken();
  if (!token) return null;
  const meta = await callTelegram<{ file_path?: string }>("getFile", { file_id: fileId });
  const filePath = meta.ok ? meta.result?.file_path : undefined;
  if (!filePath) return null;
  try {
    const res = await fetch(`${API_BASE}/file/bot${token}/${filePath}`);
    if (!res.ok) return null;
    return Buffer.from(await res.arrayBuffer());
  } catch (error) {
    console.warn("[telegram/bot] file download failed:", error instanceof Error ? error.message : error);
    return null;
  }
}

export async function setMyCommands(
  commands: Array<{ command: string; description: string }>
): Promise<TgResponse> {
  return callTelegram("setMyCommands", { commands });
}

export async function setWebhook(url: string, secretToken: string): Promise<TgResponse> {
  return callTelegram("setWebhook", {
    url,
    secret_token: secretToken,
    allowed_updates: ["message", "callback_query"],
    drop_pending_updates: true,
  });
}

async function deleteWebhook(): Promise<TgResponse> {
  return callTelegram("deleteWebhook", { drop_pending_updates: false });
}

interface WebhookInfo {
  url?: string;
  pending_update_count?: number;
  last_error_date?: number;
  last_error_message?: string;
  max_connections?: number;
  ip_address?: string;
}

/** Current webhook registration + Telegram's last delivery error (the key diagnostic). */
export async function getWebhookInfo(): Promise<TgResponse<WebhookInfo>> {
  return callTelegram<WebhookInfo>("getWebhookInfo");
}
