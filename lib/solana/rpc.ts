import { Connection } from "@solana/web3.js";

export type SolanaNetwork = "mainnet-beta" | "devnet";

const PUBLIC_FALLBACKS: Record<SolanaNetwork, string> = {
  "mainnet-beta": "https://api.mainnet-beta.solana.com",
  devnet: "https://api.devnet.solana.com",
};

export function getNetwork(): SolanaNetwork {
  const raw = process.env.NEXT_PUBLIC_SOLANA_NETWORK;
  return raw === "devnet" ? "devnet" : "mainnet-beta";
}

/** Client-visible RPC endpoint (wallet provider). Prefers a dedicated RPC key. */
export function getClientEndpoint(): string {
  const configured = process.env.NEXT_PUBLIC_SOLANA_RPC_URL;
  if (configured) return configured;
  return PUBLIC_FALLBACKS[getNetwork()];
}

/** Server-side connection for ops scripts and API routes. */
export function getServerConnection(): Connection {
  const url = process.env.SOLANA_RPC_URL || process.env.NEXT_PUBLIC_SOLANA_RPC_URL;
  if (!url) {
    console.warn(
      `[solana/rpc] SOLANA_RPC_URL is not set; falling back to public ${getNetwork()} RPC (rate-limited)`,
    );
  }
  return new Connection(url || PUBLIC_FALLBACKS[getNetwork()], "confirmed");
}
