import { redirect } from "next/navigation";
import { latestClosedWeekStart } from "@/lib/weekly-report/types";

export const dynamic = "force-dynamic";

/** /app/weekly → the latest closed week's ledger. */
export default function WeeklyIndexPage() {
  redirect(`/app/weekly/${latestClosedWeekStart()}`);
}
