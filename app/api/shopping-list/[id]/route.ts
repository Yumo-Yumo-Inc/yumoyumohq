import { NextResponse } from "next/server";
import { getSessionUsername } from "@/lib/auth/session";
import {
  deleteShoppingItem,
  renameShoppingItem,
  toggleShoppingItem,
} from "@/lib/shopping-list/server";

type Ctx = { params: Promise<{ id: string }> };

async function readId(ctx: Ctx): Promise<number | null> {
  const { id } = await ctx.params;
  const numeric = Number(id);
  return Number.isInteger(numeric) && numeric > 0 ? numeric : null;
}

export async function PATCH(req: Request, ctx: Ctx) {
  const username = await getSessionUsername();
  if (!username) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const id = await readId(ctx);
  if (id === null) return NextResponse.json({ error: "invalid_id" }, { status: 400 });

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  if (typeof body.name === "string") {
    const renamed = await renameShoppingItem(username, id, body.name);
    if (!renamed) return NextResponse.json({ error: "invalid_or_not_found" }, { status: 400 });
    return NextResponse.json({ success: true, item: renamed });
  }

  if (typeof body.completed === "boolean") {
    const updated = await toggleShoppingItem(username, id, body.completed);
    if (!updated) return NextResponse.json({ error: "not_found" }, { status: 404 });
    return NextResponse.json({ success: true, item: updated });
  }

  return NextResponse.json({ error: "no_changes" }, { status: 400 });
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const username = await getSessionUsername();
  if (!username) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const id = await readId(ctx);
  if (id === null) return NextResponse.json({ error: "invalid_id" }, { status: 400 });

  const ok = await deleteShoppingItem(username, id);
  if (!ok) return NextResponse.json({ error: "not_found" }, { status: 404 });
  return NextResponse.json({ success: true });
}
