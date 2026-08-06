"use client";

import { useParams } from "next/navigation";
import { WeeklyLedgerPage } from "@/components/weekly/weekly-ledger";
import { isClosedWeekStart, latestClosedWeekStart } from "@/lib/weekly-report/types";

export default function WeeklyLedgerRoute() {
  const params = useParams();
  const raw = ((params?.week as string | undefined) ?? "").trim();
  // Anything that isn't a Monday of a closed week resolves to the latest one.
  const week = isClosedWeekStart(raw) ? raw : latestClosedWeekStart();
  return <WeeklyLedgerPage week={week} />;
}
