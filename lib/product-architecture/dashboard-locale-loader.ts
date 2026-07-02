/**
 * Dashboard locale loader.
 *
 * Generates copy at runtime from the messages/{locale}.json:dashboard.* namespace.
 * Falls back to EN per-key for any missing key.
 *
 * To add a new dashboard string:
 *   1. Add the new key to the DASHBOARD_COPY_EN constant in dashboard-contract.ts.
 *   2. Add the same key to messages/en.json:dashboard (verify with `pnpm i18n:audit`).
 *   3. Run `pnpm i18n:sync` → ru/th/es/zh fill in automatically.
 */

/* eslint-disable @typescript-eslint/no-require-imports */
const ruMsgs = require("../../messages/ru.json") as { dashboard?: Record<string, unknown> };
const thMsgs = require("../../messages/th.json") as { dashboard?: Record<string, unknown> };
const esMsgs = require("../../messages/es.json") as { dashboard?: Record<string, unknown> };
const zhMsgs = require("../../messages/zh.json") as { dashboard?: Record<string, unknown> };
/* eslint-enable @typescript-eslint/no-require-imports */

export function buildLocaleCopy<T extends Record<string, string>>(
  fallback: T,
  messages: { dashboard?: Record<string, unknown> },
): { [K in keyof T]: string } {
  const dashboard = messages.dashboard ?? {};
  const out = {} as Record<string, string>;
  for (const key of Object.keys(fallback)) {
    const v = dashboard[key];
    out[key] = typeof v === "string" && v.length > 0 ? v : (fallback[key] as string);
  }
  return out as { [K in keyof T]: string };
}

export const dashboardMessages = {
  ru: ruMsgs,
  th: thMsgs,
  es: esMsgs,
  zh: zhMsgs,
};
