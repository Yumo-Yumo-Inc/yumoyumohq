import { NextResponse } from "next/server";
import { getSessionUsername } from "@/lib/auth/session";
import {
  deleteSubscription,
  listSubscriptions,
  upsertSubscription,
  type SubscriptionUpsertInput,
} from "@/lib/subscriptions/server";
import type { SubscriptionCadence, SubscriptionStatus } from "@/lib/offline/types";

function normalizeCadence(value: unknown): SubscriptionCadence {
  if (value === "weekly" || value === "yearly" || value === "unknown") return value;
  return "monthly";
}

function normalizeStatus(value: unknown): SubscriptionStatus {
  if (value === "paused" || value === "cancelled") return value;
  return "active";
}

export async function GET() {
  const username = await getSessionUsername();
  if (!username) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const subscriptions = await listSubscriptions(username);
    return NextResponse.json({ subscriptions });
  } catch (error) {
    console.error("[api/subscriptions] GET failed:", error);
    return NextResponse.json({ error: "Failed to load subscriptions" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const username = await getSessionUsername();
  if (!username) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = (await req.json()) as Partial<SubscriptionUpsertInput> & { id?: string };
    if (!body.merchantName || typeof body.amount !== "number" || !body.currency) {
      return NextResponse.json(
        { error: "merchantName, amount and currency are required" },
        { status: 400 }
      );
    }
    const subscription = await upsertSubscription(username, {
      id: body.id,
      merchantName: String(body.merchantName),
      category: body.category ?? null,
      amount: Number(body.amount),
      currency: String(body.currency),
      cadence: normalizeCadence(body.cadence),
      nextChargeAt: body.nextChargeAt ?? null,
      source: body.source === "auto_detected" ? "auto_detected" : "manual",
      confidence: typeof body.confidence === "number" ? body.confidence : 1,
      status: normalizeStatus(body.status),
      lastSeenAt: body.lastSeenAt ?? null,
    });
    if (!subscription) {
      return NextResponse.json({ error: "Database not available" }, { status: 503 });
    }
    return NextResponse.json({ subscription });
  } catch (error) {
    console.error("[api/subscriptions] POST failed:", error);
    return NextResponse.json({ error: "Failed to save subscription" }, { status: 500 });
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
    const deleted = await deleteSubscription(username, id);
    if (!deleted) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[api/subscriptions] DELETE failed:", error);
    return NextResponse.json({ error: "Failed to delete subscription" }, { status: 500 });
  }
}
