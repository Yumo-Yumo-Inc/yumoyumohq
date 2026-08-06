import { Connection } from "@solana/web3.js";

type SolanaNetwork = "mainnet-beta" | "devnet";

const PUBLIC_FALLBACKS: Record<SolanaNetwork, string> = {
  "mainnet-beta": "https://api.mainnet-beta.solana.com",
  devnet: "https://api.devnet.solana.com",
};

function getNetwork(): SolanaNetwork {
  const raw = process.env.NEXT_PUBLIC_SOLANA_NETWORK;
  return raw === "devnet" ? "devnet" : "mainnet-beta";
}

/** Client-visible RPC endpoint (wallet provider). Prefers a dedicated RPC key. */
export function getClientEndpoint(): string {
  const configured = process.env.NEXT_PUBLIC_SOLANA_RPC_URL;
  if (configured) return configured;
  return PUBLIC_FALLBACKS[getNetwork()];
}

/**
 * Server-side connection for ops scripts and API routes. Network-aware: when the
 * app runs against devnet, a devnet RPC is chosen instead of the (mainnet)
 * SOLANA_RPC_URL, so on-chain reads like claim-confirm's getTransaction hit the
 * same cluster the claim was sent to. Without this, a devnet claim would be
 * verified against mainnet and always fail.
 */
export function getServerConnection(): Connection {
  const network = getNetwork();
  const url =
    network === "devnet"
      ? process.env.SOLANA_RPC_URL_DEVNET || process.env.NEXT_PUBLIC_SOLANA_RPC_URL
      : process.env.SOLANA_RPC_URL || process.env.NEXT_PUBLIC_SOLANA_RPC_URL;
  if (!url) {
    console.warn(
      `[solana/rpc] No ${network} RPC configured; falling back to public ${network} RPC (rate-limited)`,
    );
  }
  return new Connection(url || PUBLIC_FALLBACKS[network], "confirmed");
}
