import { cookies } from "next/headers";
import type { AppLocale } from "@/lib/i18n/app-context";
import { LedgerProviders } from "./ledger-providers";

const VALID_APP_LOCALES = ["en", "tr", "ru", "th", "es", "zh"] as const;

function readAppLocale(raw: string | undefined): AppLocale {
  if (raw && (VALID_APP_LOCALES as readonly string[]).includes(raw)) {
    return raw as AppLocale;
  }
  return "en";
}

export default async function LedgerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const initialLocale = readAppLocale(cookieStore.get("app_locale")?.value);

  return <LedgerProviders initialLocale={initialLocale}>{children}</LedgerProviders>;
}
