"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { Button } from "@/components/ui/button";
import { Wallet, LogOut, Loader2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useState, useEffect, useRef } from "react";
import { useAppLocale } from "@/lib/i18n/app-context";

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

export function WalletConnectButton() {
  const { t } = useAppLocale();
  const { 
    wallet, 
    publicKey, 
    disconnect, 
    connected, 
    connecting,
    connect,
    select
  } = useWallet();
  const { setVisible } = useWalletModal();
  const [isSigning, setIsSigning] = useState(false);
  const hasSignedRef = useRef(false);
  const userRejectedRef = useRef(false);
  const previousWalletRef = useRef(wallet);
  const [modalWasOpen, setModalWasOpen] = useState(false);
  
  // Debug: log wallet state
  useEffect(() => {
    console.log("🔍 Wallet state changed:", {
      wallet: wallet?.adapter?.name,
      connected,
      connecting,
      publicKey: publicKey?.toString(),
      hasAdapter: !!wallet?.adapter,
    });
  }, [wallet, connected, connecting, publicKey]);

  // Check if modal provider is available on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      console.log("🔍 WalletConnectButton mounted");
      console.log("🔍 setVisible available:", typeof setVisible === 'function');
      console.log("🔍 Wallet adapter available:", !!wallet?.adapter);
    }
  }, [setVisible, wallet]);

  // SIWS-like authentication - request signature after wallet connection
  useEffect(() => {
    const handleSIWSAuth = async () => {
      // Check if we have a valid session first
      const sessionKey = `siws_session_${publicKey?.toString()}`;
      const sessionData = sessionStorage.getItem(sessionKey);
      
      if (sessionData) {
        try {
          const { signature, expiresAt } = JSON.parse(sessionData);
          // Check if session is still valid (24 hours)
          if (new Date(expiresAt) > new Date() && signature) {
            console.log("Valid session found, skipping signature");
            hasSignedRef.current = true; // Mark as signed
            userRejectedRef.current = false; // Reset rejection flag
            return;
          }
        } catch (e) {
          // Invalid session data, continue to sign
        }
      }

      // Only request signature if:
      // - Connected and has publicKey
      // - Wallet adapter exists
      // - Not already signing
      // - Hasn't signed yet
      // - User hasn't rejected
      // - Wallet was just connected (not from page load)
      if (connected && publicKey && wallet?.adapter && !isSigning && !hasSignedRef.current && !userRejectedRef.current) {
        try {
          setIsSigning(true);
          hasSignedRef.current = true;
          
          // Create SIWS-like message format that Phantom wallet can display properly
          const domain = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
          const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
          const now = new Date();
          const expirationTime = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours
          
          // SIWS format message - this will be displayed in Phantom wallet
          const messageText = `${domain} wants you to sign in with your Solana account:\n\n` +
            `${publicKey.toString()}\n\n` +
            `URI: ${origin}\n` +
            `Version: 1\n` +
            `Chain ID: 101\n` +
            `Nonce: ${Math.random().toString(36).substring(2, 15)}\n` +
            `Issued At: ${now.toISOString()}\n` +
            `Expiration Time: ${expirationTime.toISOString()}\n\n` +
            `By signing, you prove ownership of this wallet. This signature is valid for 24 hours.`;
          
          // Convert to Uint8Array for Solana
          const message = new TextEncoder().encode(messageText);

          // Use wallet adapter's signMessage method
          const adapter = wallet.adapter as any;
          if (adapter && typeof adapter.signMessage === 'function') {
            const signatureResult = await adapter.signMessage(message);
            
            // Handle different signature formats
            let signatureBytes: number[] | Uint8Array | undefined;
            
            if (signatureResult) {
              // Check if signature is in different formats
              if (signatureResult.signature) {
                // Format: { signature: Uint8Array }
                if (signatureResult.signature instanceof Uint8Array) {
                  signatureBytes = Array.from(signatureResult.signature);
                } else if (Array.isArray(signatureResult.signature)) {
                  signatureBytes = signatureResult.signature;
                } else {
                  // Try to convert if it's iterable
                  try {
                    signatureBytes = Array.from(signatureResult.signature as any);
                  } catch (e) {
                    console.warn("Could not convert signature to array", e);
                  }
                }
              } else if (signatureResult instanceof Uint8Array) {
                // Format: Uint8Array directly
                signatureBytes = Array.from(signatureResult);
              } else if (Array.isArray(signatureResult)) {
                // Format: Array directly
                signatureBytes = signatureResult;
              }
            }
            
            // Only store session if we have a valid signature
            if (signatureBytes && signatureBytes.length > 0) {
              const sessionData = {
                signature: signatureBytes,
                publicKey: publicKey.toString(),
                expiresAt: expirationTime.toISOString(),
              };
              sessionStorage.setItem(sessionKey, JSON.stringify(sessionData));
              userRejectedRef.current = false; // Reset rejection flag on success
              console.log("SIWS authentication successful");

              // Persist the wallet to the account (verified path). This decouples
              // rewards from the live connection: once linked, receipt uploads and
              // reward epochs read the account wallet even if the browser tab has
              // no live connection (common on mobile).
              try {
                await fetch("/api/wallet/link", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  credentials: "include",
                  body: JSON.stringify({
                    walletAddress: publicKey.toString(),
                    message: messageText,
                    signature: signatureBytes,
                  }),
                });
              } catch (linkErr) {
                console.warn("Wallet account-link failed (non-fatal):", linkErr);
              }
            } else {
              console.warn("Invalid signature format received");
              hasSignedRef.current = false;
            }
          } else {
            console.warn("Wallet adapter does not support signMessage");
            hasSignedRef.current = false;
          }
        } catch (error: any) {
          // Handle user rejection gracefully
          if (error?.message?.includes("reject") || error?.name === "WalletSignMessageError" || error?.code === 4001) {
            console.log("User rejected signature request - skipping authentication");
            userRejectedRef.current = true;
            // Don't reset hasSignedRef and don't try again automatically
            // User can disconnect and reconnect if they want to sign later
          } else {
            console.error("Failed to sign SIWS message:", error);
            hasSignedRef.current = false;
          }
        } finally {
          setIsSigning(false);
        }
      }
    };

    // Delay to ensure wallet is fully connected after user selects it from modal
    // This ensures: 1) User selects wallet from modal, 2) Wallet connects, 3) Then signature request appears
    const timeoutId = setTimeout(() => {
      handleSIWSAuth();
    }, 1500); // Give user time to see the connection success before signature request

    return () => clearTimeout(timeoutId);
  }, [connected, publicKey, wallet, isSigning]);

  // Auto-call connect() once a wallet is selected in the modal.
  // The WalletAdapter modal only does select(); with autoConnect=false, connect() was never triggered otherwise.
  useEffect(() => {
    if (!wallet || connected || connecting) return;
    if (wallet === previousWalletRef.current) return;
    previousWalletRef.current = wallet;
    console.log("Wallet selected from modal, connecting...", wallet.adapter?.name);
    let cancelled = false;
    connect()
      .then(() => {
        if (!cancelled) console.log("Wallet connected after modal selection");
      })
      .catch((err) => {
        if (!cancelled) {
          if (isUserRejectedWalletRequest(err)) {
            console.log("Auto-connect cancelled by user");
          } else {
            console.error("Auto-connect after modal selection failed:", err);
          }
        }
      });
    return () => {
      cancelled = true;
    };
  }, [wallet, connected, connecting, connect]);

  // Reset the signing flag when the wallet disconnects
  useEffect(() => {
    if (!connected) {
      hasSignedRef.current = false;
      userRejectedRef.current = false; // Reset rejection flag on disconnect
      previousWalletRef.current = null as any;
    }
  }, [connected]);

  const handleConnect = async () => {
    try {
      console.log("=== Connect Wallet Button Clicked ===");
      console.log("Current wallet state:", { 
        wallet: wallet?.adapter?.name, 
        connected, 
        connecting,
        publicKey: publicKey?.toString(),
        hasSetVisible: typeof setVisible === 'function'
      });
      
      if (!setVisible) {
        console.error("setVisible is not available - WalletModalProvider might be missing");
        alert("Wallet modal provider is not available. Please refresh the page.");
        return;
      }
      
      // Check if wallet adapter is available
      if (!wallet && !connecting) {
        console.log("No wallet selected, opening modal...");
        setModalWasOpen(true);
        setVisible(true);
        console.log("Modal opened successfully");
      } else if (wallet && !connected && !connecting) {
        // Wallet selected but not connected, try to connect
        console.log("Wallet selected but not connected, attempting to connect...");
        try {
          await connect();
          console.log("Wallet connected successfully");
        } catch (error) {
          if (isUserRejectedWalletRequest(error)) {
            console.log("Wallet connection cancelled by user");
          } else {
            console.error("Failed to connect wallet:", error);
          }
          // If connection fails, open modal to select wallet again
          setVisible(true);
        }
      } else if (connecting) {
        console.log("Wallet is already connecting...");
      } else {
        console.log("Wallet is already connected or in an unknown state");
      }
    } catch (error) {
      console.error("Failed to handle connect:", error);
      setModalWasOpen(false);
      // Try to open modal as fallback
      try {
        setVisible(true);
      } catch (e) {
        console.error("Failed to open modal as fallback:", e);
      }
    }
  };

  const handleDisconnect = () => {
    disconnect();
    hasSignedRef.current = false;
  };

  const shortenAddress = (address: string) => {
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  };

  if (connected && publicKey) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="gap-2" disabled={isSigning}>
            <Wallet className="h-4 w-4" />
            {isSigning ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {t("settings.wallet.signing")}
              </>
            ) : (
              shortenAddress(publicKey.toString())
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={handleDisconnect}>
            <LogOut className="mr-2 h-4 w-4" />
            {t("settings.wallet.disconnect")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <Button 
      onClick={handleConnect} 
      className="gap-2" 
      disabled={connecting || isSigning}
      type="button"
    >
      {connecting || isSigning ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          {connecting ? t("settings.wallet.connecting") : t("settings.wallet.signing")}
        </>
      ) : (
        <>
          <Wallet className="h-4 w-4" />
          {t("settings.wallet.connect")}
        </>
      )}
    </Button>
  );
}

