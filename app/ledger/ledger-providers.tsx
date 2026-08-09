"use client";

import { AppI18nProvider, type AppLocale } from "@/lib/i18n/app-context";
import { ThemeProvider } from "@/lib/theme/theme-context";

export function LedgerProviders({
  children,
  initialLocale,
}: {
  children: React.ReactNode;
  initialLocale: AppLocale;
}) {
  return (
    <AppI18nProvider initialLocale={initialLocale}>
      <ThemeProvider>{children}</ThemeProvider>
    </AppI18nProvider>
  );
}
