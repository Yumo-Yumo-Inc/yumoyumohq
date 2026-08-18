import { NextResponse } from "next/server";
import { getSessionState } from "@/lib/auth/session";
import { applyDemoPreviewCookie, isDemoPreview } from "@/lib/auth/demo-preview";
import { DEMO_DISPLAY_NAME } from "@/lib/demo/constants";

export async function GET() {
  const session = await getSessionState();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const active = await isDemoPreview();
  return NextResponse.json({
    active,
    persona: active ? DEMO_DISPLAY_NAME : null,
    username: session.username,
  });
}

export async function POST(req: Request) {
  const session = await getSessionState();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = (await req.json().catch(() => ({}))) as { action?: string };
  const enter = body.action === "enter";
  const response = NextResponse.json({
    active: enter,
    persona: enter ? DEMO_DISPLAY_NAME : null,
  });
  applyDemoPreviewCookie(response, enter);
  return response;
}
