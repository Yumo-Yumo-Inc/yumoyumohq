import { NextResponse } from "next/server";
import { getReceiptsByDateRange } from "@/lib/receipt/storage-db";
import { getReceiptCount } from "@/lib/receipt/db";
import { getSessionUsername } from "@/lib/auth/session";

export type DashboardPeriod = "daily" | "weekly" | "monthly" | "yearly";

const PERIODS: DashboardPeriod[] = ["daily", "weekly", "monthly", "yearly"];

function getDateRange(period: DashboardPeriod): { start: Date; end: Date } {
  const now = new Date();
  const end = new Date(now);
  const start = new Date(now);

  switch (period) {
    case "daily":
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      break;
    case "weekly":
      start.setDate(now.getDate() - 7);
      break;
    case "monthly":
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      break;
    case "yearly":
      start.setFullYear(now.getFullYear() - 1);
      break;
  }
  return { start, end };
}

export async function GET(req: Request) {
  try {
    const username = await getSessionUsername();

    if (!username) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const raw = searchParams.get("period") ?? "monthly";
    const period = PERIODS.includes(raw as DashboardPeriod)
      ? (raw as DashboardPeriod)
      : "monthly";

    const { start, end } = getDateRange(period);
    const [receipts, totalReceiptCount] = await Promise.all([
      getReceiptsByDateRange(username, start, end),
      getReceiptCount(username),
    ]);

    return NextResponse.json({
      receipts,
      totalReceiptCount,
      period,
      start: start.toISOString(),
      end: end.toISOString(),
    });
  } catch (error: any) {
    console.error("[api/receipts/dashboard] error:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch dashboard receipts",
      },
      { status: 500 }
    );
  }
}
