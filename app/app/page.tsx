import { redirect } from "next/navigation";

/**
 * /app landing route — server-side redirect to dashboard.
 *
 * Previously this was a client component with useEffect + router.replace,
 * which caused a brief loading spinner to be shown AND left in the DOM during
 * soft navigation (visible above dashboard content after redirect).
 * Server redirect avoids any render — the user goes straight to /app/dashboard.
 */
export default function AppLandingPage() {
  redirect("/app/dashboard");
}
