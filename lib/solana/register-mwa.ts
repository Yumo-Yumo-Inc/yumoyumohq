"use client";

/**
 * Register the Mobile Wallet Adapter as a Wallet Standard wallet.
 *
 * WHY: the app used only the extension adapters (Phantom/Solflare). On a phone
 * there is no extension, so "connect" either did nothing or forced the user into
 * the wallet's own in-app browser. Registering MWA makes a phone able to connect
 * to an installed wallet app locally — the OS wallet chooser opens, the user
 * approves, and control returns to us. On Android this is the good path; on iOS
 * and desktop the legacy Phantom/Solflare adapters still handle it (deeplink /
 * extension), so this ADDS a path rather than replacing one.
 *
 * Local vs remote: `remoteHostAuthority` would enable remote (iOS/desktop over a
 * reflector), but Solana Mobile has not published a public reflector endpoint, so
 * it is omitted. Without it MWA registers in LOCAL mode — Android connects to the
 * installed wallet; iOS/desktop fall through to the extension/deeplink adapters.
 *
 * Called once, client-side only (registerMwa touches window). A module guard keeps
 * a double-invoke — React strict mode, fast refresh — from registering twice.
 */

import {
  registerMwa,
  createDefaultAuthorizationCache,
  createDefaultChainSelector,
  createDefaultWalletNotFoundHandler,
} from "@solana-mobile/wallet-standard-mobile";

let registered = false;

export function registerMobileWalletAdapter(): void {
  if (registered || typeof window === "undefined") return;
  registered = true;

  try {
    registerMwa({
      appIdentity: {
        name: "Yumo Yumo",
        uri: window.location.origin,
        // Absolute URL — the wallet renders it in the approval sheet.
        icon: `${window.location.origin}/pwa/icon-192.png`,
      },
      // Mainnet only: the ledger and rewards live on mainnet-beta.
      chains: ["solana:mainnet"],
      authorizationCache: createDefaultAuthorizationCache(),
      chainSelector: createDefaultChainSelector(),
      onWalletNotFound: createDefaultWalletNotFoundHandler(),
    });
  } catch (e) {
    // A failed registration must not take the wallet provider down with it — the
    // extension/deeplink adapters still work. Log and carry on.
    registered = false;
    console.warn("[mwa] registerMwa failed; extension/deeplink adapters remain:", e);
  }
}
