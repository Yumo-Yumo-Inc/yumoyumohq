import { redirect } from "next/navigation";

/** Legacy Analysis slot — spending identity lives at /app/patterns (hexagon). */
export default function AnalysisRedirectPage() {
  redirect("/app/patterns");
}
