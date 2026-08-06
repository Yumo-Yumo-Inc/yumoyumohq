"use client";

import { useMemo, useEffect } from "react";
import {
  ConnectionProvider,
  WalletProvider,
} from "@solana/wallet-adapter-react";
import {
  PhantomWalletAdapter,
  SolflareWalletAdapter,
} from "@solana/wallet-adapter-wallets";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { getClientEndpoint } from "@/lib/solana/rpc";
import { registerMobileWalletAdapter } from "@/lib/solana/register-mwa";
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
  const rpcUrl = getClientEndpoint();

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

  // Put the Mobile Wallet Adapter into the Wallet Standard registry once, on the
  // client. The registry is reactive, so registering here (after mount) still makes
  // a phone's installed wallet show up in the modal before the user opens it.
  useEffect(() => {
    registerMobileWalletAdapter();
  }, []);

  const wallets = useMemo(() => {
    // Explicit extension adapters for desktop and for iOS deeplink. MWA is NOT
    // listed here — registerMwa above puts it into the Wallet Standard registry,
    // which WalletProvider merges with this list automatically, so it shows up on
    // a phone without us hard-coding it. Android uses MWA; iOS/desktop use these.
    const phantom = new PhantomWalletAdapter();
    const solflare = new SolflareWalletAdapter();
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

