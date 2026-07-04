/**
 * GET  /api/wallet/link — return the session user's linked reward wallet.
 * POST /api/wallet/link — link a reward wallet to the session user's account.
 *
 * Two link paths (see decision 2026-07-04, mobile wallet session split):
 *   - Verified: body carries { walletAddress, message, signature }. The Ed25519
 *     signature is checked server-side (ownership proof) → wallet_verified=true.
 *   - Pasted:   body carries { walletAddress } only → stored unverified; ownership
 *     is proven later at claim time.
 *
 * The wallet is account-level, so receipt uploads no longer need a live wallet
 * connection in the current browser tab.
 */
import { NextResponse } from "next/server";
import { getSessionUsername } from "@/lib/auth/session";
import { isValidSolanaAddress, verifyWalletSignature } from "@/lib/wallet/verify-signature";
import { getUserWallet, setUserWallet } from "@/lib/wallet/user-wallet";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const username = await getSessionUsername();
  if (!username) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const wallet = await getUserWallet(username);
  return NextResponse.json(wallet);
}

export async function POST(req: Request) {
  const username = await getSessionUsername();
  if (!username) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const { walletAddress, message, signature } = body as {
    walletAddress?: string;
    message?: string;
    signature?: number[] | string;
  };

  const address = typeof walletAddress === "string" ? walletAddress.trim() : "";
  if (!address || !isValidSolanaAddress(address)) {
    return NextResponse.json({ error: "A valid Solana wallet address is required" }, { status: 400 });
  }

  // Ownership proof is optional. When a signature is supplied it MUST verify and
  // MUST be over a message that names this exact address (binds the proof to it).
  let verified = false;
  if (signature && typeof message === "string" && message.length > 0) {
    const sigOk = verifyWalletSignature(address, message, signature);
    const boundToAddress = message.includes(address);
    if (!sigOk || !boundToAddress) {
      return NextResponse.json({ error: "Wallet ownership signature is invalid" }, { status: 400 });
    }
    verified = true;
  }

  const ok = await setUserWallet(username, address, verified);
  if (!ok) {
    return NextResponse.json({ error: "Could not save wallet" }, { status: 503 });
  }

  const wallet = await getUserWallet(username);
  return NextResponse.json({ ...wallet, ok: true });
}
