import { NextResponse } from "next/server";
import { getSessionUsername } from "@/lib/auth/session";
import {
  deleteBudget,
  listBudgets,
  upsertBudget,
  type BudgetUpsertInput,
} from "@/lib/budgets/server";

export async function GET() {
  const username = await getSessionUsername();
  if (!username) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const budgets = await listBudgets(username);
    return NextResponse.json({ budgets });
  } catch (error) {
    console.error("[api/budgets] GET failed:", error);
    return NextResponse.json({ error: "Failed to load budgets" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const username = await getSessionUsername();
  if (!username) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = (await req.json()) as Partial<BudgetUpsertInput> & { id?: string };
    if (!body.category || typeof body.amount !== "number" || !body.currency) {
      return NextResponse.json(
        { error: "category, amount and currency are required" },
        { status: 400 }
      );
    }
    const budget = await upsertBudget(username, {
      id: body.id,
      category: String(body.category),
      period: body.period === "weekly" ? "weekly" : "monthly",
      amount: Number(body.amount),
      currency: String(body.currency),
      note: body.note ?? null,
      source: body.source === "suggested" ? "suggested" : "manual",
      active: body.active ?? true,
    });
    if (!budget) {
      return NextResponse.json({ error: "Database not available" }, { status: 503 });
    }
    return NextResponse.json({ budget });
  } catch (error) {
    console.error("[api/budgets] POST failed:", error);
    return NextResponse.json({ error: "Failed to save budget" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const username = await getSessionUsername();
  if (!username) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }
    const deleted = await deleteBudget(username, id);
    if (!deleted) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[api/budgets] DELETE failed:", error);
    return NextResponse.json({ error: "Failed to delete budget" }, { status: 500 });
  }
}
