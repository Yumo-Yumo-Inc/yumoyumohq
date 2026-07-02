"use client";

import { SolanaWalletProvider } from "./solana-wallet-provider";

export function WalletProviderWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  return <SolanaWalletProvider>{children}</SolanaWalletProvider>;
}





