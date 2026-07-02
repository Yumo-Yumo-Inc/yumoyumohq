import { NextResponse } from "next/server";
import { getSessionUsername } from "@/lib/auth/session";
import {
  deleteGoal,
  listGoals,
  upsertGoal,
  type GoalUpsertInput,
} from "@/lib/goals/server";
import type { FinancialGoalStatus } from "@/lib/offline/types";

function normalizeStatus(value: unknown): FinancialGoalStatus {
  if (value === "paused" || value === "achieved" || value === "cancelled") return value;
  return "active";
}

export async function GET() {
  const username = await getSessionUsername();
  if (!username) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const goals = await listGoals(username);
    return NextResponse.json({ goals });
  } catch (error) {
    console.error("[api/goals] GET failed:", error);
    return NextResponse.json({ error: "Failed to load goals" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const username = await getSessionUsername();
  if (!username) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = (await req.json()) as Partial<GoalUpsertInput> & { id?: string };
    if (!body.title || typeof body.targetAmount !== "number" || !body.currency) {
      return NextResponse.json(
        { error: "title, targetAmount and currency are required" },
        { status: 400 }
      );
    }
    const goal = await upsertGoal(username, {
      id: body.id,
      title: String(body.title),
      targetAmount: Number(body.targetAmount),
      currency: String(body.currency),
      deadline: body.deadline ?? null,
      progressAmount: typeof body.progressAmount === "number" ? body.progressAmount : 0,
      status: normalizeStatus(body.status),
      note: body.note ?? null,
    });
    if (!goal) {
      return NextResponse.json({ error: "Database not available" }, { status: 503 });
    }
    return NextResponse.json({ goal });
  } catch (error) {
    console.error("[api/goals] POST failed:", error);
    return NextResponse.json({ error: "Failed to save goal" }, { status: 500 });
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
    const deleted = await deleteGoal(username, id);
    if (!deleted) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[api/goals] DELETE failed:", error);
    return NextResponse.json({ error: "Failed to delete goal" }, { status: 500 });
  }
}
