import { NextResponse } from "next/server";
import { getSessionUsername } from "@/lib/auth/session";
import { fetchShoppingSuggestions } from "@/lib/shopping-list/suggestions";

export async function GET(req: Request) {
  const username = await getSessionUsername();
  if (!username) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const q = (url.searchParams.get("q") ?? "").slice(0, 80);

  // Still send recent-purchase suggestions even on a very short query, so the
  // "recent purchases" card panel can show when the input opens.
  // If q is empty or 1 character, only the recent set is returned.
  try {
    const suggestions = await fetchShoppingSuggestions(username, q);
    return NextResponse.json({ success: true, suggestions });
  } catch (error) {
    // Don't let a smart-suggest error break the UX — return empty, the frontend falls back to free text.
    console.error("[shopping-list/suggestions] failed", error);
    return NextResponse.json({ success: true, suggestions: [] });
  }
}
