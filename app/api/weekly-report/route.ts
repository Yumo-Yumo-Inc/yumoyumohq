/**
 * Weekly Ledger API — GET ?week=YYYY-MM-DD (a Monday of a fully closed week;
 * defaults to the latest closed week). Level-gated by the account unlock
 * ladder (weekly_report_theme_set). Reports are frozen on first read.
 */
import { NextResponse } from "next/server";
import { getSessionUsername } from "@/lib/auth/session";
import { sql } from "@/lib/db/client";
import { WEEKLY_REPORT_LEVEL } from "@/config/account-unlocks";
import { getOrFreezeWeeklyReport, listFrozenWeeks } from "@/lib/weekly-report/server";
import { isClosedWeekStart, latestClosedWeekStart, type WeeklyLedgerResponse } from "@/lib/weekly-report/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function toRows<T = Record<string, unknown>>(r: unknown): T[] {
  if (Array.isArray(r)) return r as T[];
  if (r && typeof r === "object" && "rows" in r) return (r as { rows: T[] }).rows;
  return [];
}

export async function GET(req: Request) {
  const username = await getSessionUsername();
  if (!username) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!sql) return NextResponse.json({ error: "Database not available" }, { status: 503 });

  const levelRows = toRows<{ account_level: number | string | null }>(await sql`
    SELECT COALESCE(account_level, 1) AS account_level FROM user_profiles WHERE username = ${username} LIMIT 1
  `.catch(() => []));
  const accountLevel = Number(levelRows[0]?.account_level) || 1;
  if (accountLevel < WEEKLY_REPORT_LEVEL) {
    const locked: WeeklyLedgerResponse = { locked: true, requiredLevel: WEEKLY_REPORT_LEVEL, accountLevel };
    return NextResponse.json(locked, { headers: { "Cache-Control": "private, no-store" } });
  }

  const url = new URL(req.url);
  const requested = url.searchParams.get("week");
  const weekStart = requested && isClosedWeekStart(requested) ? requested : latestClosedWeekStart();

  try {
    const [report, archive] = await Promise.all([
      getOrFreezeWeeklyReport(username, weekStart),
      listFrozenWeeks(username),
    ]);
    const body: WeeklyLedgerResponse = report
      ? { weekStart, report, archive, accountLevel }
      : { weekStart, empty: true, archive, accountLevel };
    return NextResponse.json(body, { headers: { "Cache-Control": "private, no-store" } });
  } catch (e) {
    console.error("[api/weekly-report] failed:", (e as Error)?.message);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
