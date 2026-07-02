"use client";

import { SolanaWalletProvider } from "@/components/providers/solana-wallet-provider";
import { AppI18nProvider, type AppLocale } from "@/lib/i18n/app-context";
import { AppProfileProvider } from "@/lib/app/profile-context";
import { ThemeProvider } from "@/lib/theme/theme-context";
import { AppQueryProvider } from "@/lib/app/app-query-client";
import { SessionHeartbeat } from "@/components/app/session-heartbeat";
import { OfflineBootstrapManager } from "@/components/app/offline-bootstrap-manager";

export function AppLayoutClient({
  children,
  initialLocale,
}: {
  children: React.ReactNode;
  initialLocale: AppLocale;
}) {
  return (
    <AppI18nProvider initialLocale={initialLocale}>
      <AppQueryProvider>
        <ThemeProvider>
          <SolanaWalletProvider>
            <AppProfileProvider>
              <OfflineBootstrapManager />
              <SessionHeartbeat />
              {children}
            </AppProfileProvider>
          </SolanaWalletProvider>
        </ThemeProvider>
      </AppQueryProvider>
    </AppI18nProvider>
  );
}
