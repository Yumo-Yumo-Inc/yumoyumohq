import { NextResponse } from "next/server";
import { getSessionUsername } from "@/lib/auth/session";
import { addShoppingItem, listShoppingItems } from "@/lib/shopping-list/server";

export async function GET() {
  const username = await getSessionUsername();
  if (!username) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const items = await listShoppingItems(username);
  return NextResponse.json({ success: true, items });
}

export async function POST(req: Request) {
  const username = await getSessionUsername();
  if (!username) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object" || typeof body.name !== "string") {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  // Backward compatibility: the old client only sends { name }.
  // The new client sends { name, canonicalId, suggestedBrand, rawInput, source } when autocomplete is selected.
  const item = await addShoppingItem(username, {
    name: body.name,
    canonicalId: typeof body.canonicalId === "string" ? body.canonicalId : null,
    suggestedBrand: typeof body.suggestedBrand === "string" ? body.suggestedBrand : null,
    rawInput: typeof body.rawInput === "string" ? body.rawInput : null,
    source:
      body.source === "suggestion" ||
      body.source === "recent_purchase" ||
      body.source === "favorite" ||
      body.source === "manual"
        ? body.source
        : undefined,
  });

  if (!item) {
    return NextResponse.json({ error: "invalid_or_quota" }, { status: 400 });
  }
  return NextResponse.json({ success: true, item });
}
