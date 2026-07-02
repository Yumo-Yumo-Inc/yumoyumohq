import { NextResponse } from "next/server";
import { getSessionUsername } from "@/lib/auth/session";
import {
  createServiceProvider,
  isValidCategory,
  listServiceProviders,
} from "@/lib/service-providers/server";

export async function GET() {
  const username = await getSessionUsername();
  if (!username) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const providers = await listServiceProviders(username);
  return NextResponse.json({ success: true, providers });
}

export async function POST(req: Request) {
  const username = await getSessionUsername();
  if (!username) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  if (!isValidCategory(body.category)) {
    return NextResponse.json({ error: "invalid_category" }, { status: 400 });
  }
  if (typeof body.name !== "string" || body.name.trim().length < 1 || body.name.trim().length > 80) {
    return NextResponse.json({ error: "invalid_name" }, { status: 400 });
  }
  const paymentDay = Number(body.paymentDay);
  if (!Number.isInteger(paymentDay) || paymentDay < 1 || paymentDay > 31) {
    return NextResponse.json({ error: "invalid_payment_day" }, { status: 400 });
  }

  const reminderDaysBefore = Array.isArray(body.reminderDaysBefore)
    ? body.reminderDaysBefore
        .map((d: unknown) => Number(d))
        .filter((d: number) => Number.isInteger(d) && d >= 0 && d <= 30)
    : undefined;

  const provider = await createServiceProvider(username, {
    category: body.category,
    name: body.name,
    paymentDay,
    reminderDaysBefore,
    reminderSameDay: Boolean(body.reminderSameDay),
    reminderHour: typeof body.reminderHour === "number" ? body.reminderHour : 9,
    expectedAmount:
      typeof body.expectedAmount === "number" && Number.isFinite(body.expectedAmount)
        ? body.expectedAmount
        : null,
  });

  return NextResponse.json({ success: true, provider });
}
