import { NextResponse } from "next/server";
import { getSessionUsername } from "@/lib/auth/session";
import { warmUpConnection } from "@/lib/db/client";
import { readAlphaPeriodLeaderboard } from "@/lib/alpha-period/read-leaderboard";

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 200;

export async function GET(request: Request) {
  try {
    const username = await getSessionUsername();
    if (!username) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await warmUpConnection();

    const { searchParams } = new URL(request.url);
    const limit = Math.min(
      MAX_LIMIT,
      Math.max(1, Number.parseInt(searchParams.get("limit") || String(DEFAULT_LIMIT), 10))
    );

    const result = await readAlphaPeriodLeaderboard({ limit });

    // cPoints is the one user-facing balance, so the leaderboard shows it too —
    // the same number the Wallet and the profile show. fairScore still decides
    // the ordering; it is a ranking input, not a second currency.
    return NextResponse.json({
      snapshotAt: result.snapshotAt,
      entryCount: result.entryCount,
      viewerUsername: username,
      leaderboard: result.entries.map((entry) => ({
        rank: entry.rank,
        username: entry.username,
        displayName: entry.displayName,
        avatarUrl: entry.avatarUrl,
        country: entry.country,
        points: entry.cpointsTotal,
        discoveryScore: entry.discoveryScore,
        receiptCount: entry.receiptCount,
      })),
    });
  } catch (error) {
    console.error("[api/rewards/alpha-leaderboard] GET error:", error);
    return NextResponse.json(
      { error: "Failed to load Early Alpha leaderboard" },
      { status: 500 }
    );
  }
}
