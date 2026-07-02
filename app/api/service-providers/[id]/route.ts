import { NextResponse } from "next/server";
import { getSessionUsername } from "@/lib/auth/session";
import {
  deleteServiceProvider,
  isValidCategory,
  updateServiceProvider,
} from "@/lib/service-providers/server";

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

  const patch: Record<string, unknown> = {};

  if (body.category !== undefined) {
    if (!isValidCategory(body.category)) {
      return NextResponse.json({ error: "invalid_category" }, { status: 400 });
    }
    patch.category = body.category;
  }
  if (body.name !== undefined) {
    if (typeof body.name !== "string" || body.name.trim().length < 1 || body.name.trim().length > 80) {
      return NextResponse.json({ error: "invalid_name" }, { status: 400 });
    }
    patch.name = body.name;
  }
  if (body.paymentDay !== undefined) {
    const day = Number(body.paymentDay);
    if (!Number.isInteger(day) || day < 1 || day > 31) {
      return NextResponse.json({ error: "invalid_payment_day" }, { status: 400 });
    }
    patch.paymentDay = day;
  }
  if (body.reminderDaysBefore !== undefined) {
    if (!Array.isArray(body.reminderDaysBefore)) {
      return NextResponse.json({ error: "invalid_reminders" }, { status: 400 });
    }
    patch.reminderDaysBefore = body.reminderDaysBefore
      .map((d: unknown) => Number(d))
      .filter((d: number) => Number.isInteger(d) && d >= 0 && d <= 30);
  }
  if (body.reminderSameDay !== undefined) patch.reminderSameDay = Boolean(body.reminderSameDay);
  if (body.reminderHour !== undefined) {
    const hour = Number(body.reminderHour);
    if (!Number.isInteger(hour) || hour < 0 || hour > 23) {
      return NextResponse.json({ error: "invalid_hour" }, { status: 400 });
    }
    patch.reminderHour = hour;
  }
  if (body.expectedAmount !== undefined) {
    if (body.expectedAmount === null) {
      patch.expectedAmount = null;
    } else {
      const amt = Number(body.expectedAmount);
      if (!Number.isFinite(amt) || amt < 0 || amt > 1_000_000) {
        return NextResponse.json({ error: "invalid_amount" }, { status: 400 });
      }
      patch.expectedAmount = amt;
    }
  }
  if (body.isActive !== undefined) patch.isActive = Boolean(body.isActive);
  if (body.lastPaidAt !== undefined) {
    if (body.lastPaidAt === null) {
      patch.lastPaidAt = null;
    } else if (typeof body.lastPaidAt === "string") {
      const parsed = new Date(body.lastPaidAt);
      if (Number.isNaN(parsed.getTime())) {
        return NextResponse.json({ error: "invalid_last_paid_at" }, { status: 400 });
      }
      patch.lastPaidAt = parsed.toISOString();
    } else {
      return NextResponse.json({ error: "invalid_last_paid_at" }, { status: 400 });
    }
  }

  const updated = await updateServiceProvider(username, id, patch);
  if (!updated) return NextResponse.json({ error: "not_found" }, { status: 404 });

  return NextResponse.json({ success: true, provider: updated });
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const username = await getSessionUsername();
  if (!username) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const id = await readId(ctx);
  if (id === null) return NextResponse.json({ error: "invalid_id" }, { status: 400 });

  const ok = await deleteServiceProvider(username, id);
  if (!ok) return NextResponse.json({ error: "not_found" }, { status: 404 });
  return NextResponse.json({ success: true });
}
