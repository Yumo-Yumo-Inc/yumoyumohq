"use client";

import { useMemo, useEffect } from "react";
import {
  ConnectionProvider,
  WalletProvider,
} from "@solana/wallet-adapter-react";
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import {
  PhantomWalletAdapter,
  SolflareWalletAdapter,
} from "@solana/wallet-adapter-wallets";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import "@solana/wallet-adapter-react-ui/styles.css";

const isUserRejectedWalletRequest = (error: unknown): boolean => {
  const normalized = error as { message?: string; code?: number | string; name?: string } | undefined;
  const message = normalized?.message?.toLowerCase?.() ?? "";

  return (
    normalized?.code === 4001 ||
    normalized?.name === "WalletSignMessageError" ||
    message.includes("user rejected") ||
    message.includes("user declined") ||
    message.includes("rejected the request") ||
    message.includes("reject") ||
    message.includes("failed to connect to metamask") ||
    message.includes("metamask extension not found")
  );
};

export function SolanaWalletProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const network =
    (process.env.NEXT_PUBLIC_SOLANA_NETWORK as WalletAdapterNetwork) ||
    WalletAdapterNetwork.Mainnet;

  const rpcUrl =
    process.env.NEXT_PUBLIC_SOLANA_RPC_URL ||
    "https://api.mainnet-beta.solana.com";

  // Suppress React duplicate key warnings for MetaMask
  useEffect(() => {
    if (typeof window === "undefined") {
      return () => {}; // Return empty cleanup function for consistency
    }
    
    const originalError = console.error;
    console.error = (...args: any[]) => {
      if (
        typeof args[0] === "string" &&
        (args[0].includes("Encountered two children with the same key") ||
          (args[0].includes("MetaMask") && args[0].includes("key")))
      ) {
        // Suppress duplicate key warnings for MetaMask
        return;
      }
      originalError(...args);
    };
    
    return () => {
      console.error = originalError;
    };
  }, []);

  const wallets = useMemo(() => {
    // Create wallet adapters explicitly - only Solana wallets
    // We only want Phantom and Solflare, no auto-detection
    const phantom = new PhantomWalletAdapter();
    const solflare = new SolflareWalletAdapter();
    
    // Return only the wallets we explicitly create
    // This prevents any auto-detection issues
    return [phantom, solflare];
  }, []);

  // Disable autoConnect - user must manually click connect button
  // This prevents automatic wallet connection on page load
  return (
    <ConnectionProvider endpoint={rpcUrl}>
      <WalletProvider 
        wallets={wallets} 
        autoConnect={false}
        onError={(error) => {
          if (isUserRejectedWalletRequest(error)) {
            console.info("Wallet request rejected by user");
            return;
          }

          console.error("Wallet error:", error);
          if (error?.message) {
            console.error("Error details:", error.message);
          }
        }}
      >
        <WalletModalProvider>
          {children}
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}

