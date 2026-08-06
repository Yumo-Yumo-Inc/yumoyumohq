import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { getSql, warmUpConnection } from "@/lib/db/client";
import { rateLimit, getRateLimitKey } from "@/lib/auth/rate-limit";

let schemaReady = false;

async function ensureSchema(): Promise<void> {
  if (schemaReady) return;
  const sql = getSql();
  if (!sql) return;
  await warmUpConnection();
  await sql`
    CREATE TABLE IF NOT EXISTS support_requests (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      subject TEXT NOT NULL,
      message TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'open',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  schemaReady = true;
}

/**
 * Best-effort email notification via the Resend REST API. The DB row is the
 * source of truth; a failed or unconfigured send never fails the request.
 */
async function notifySupportInbox(input: {
  name: string;
  email: string;
  subject: string;
  message: string;
}): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.SUPPORT_INBOX_EMAIL;
  if (!apiKey || !to) return;
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.SUPPORT_FROM_EMAIL ?? "noreply@yumoyumo.com",
        to,
        reply_to: input.email,
        subject: `Support Request: ${input.subject}`,
        text: `From: ${input.name} <${input.email}>\n\n${input.message}`,
      }),
    });
    if (!res.ok) {
      console.error("[support] email notify failed:", res.status, await res.text());
    }
  } catch (error) {
    console.error("[support] email notify failed:", error);
  }
}

export async function POST(req: Request) {
  try {
    // Public form: throttle by IP against spam / DB bloat.
    const rl = await rateLimit({
      key: getRateLimitKey(req, "anon"),
      endpoint: "support-form",
      maxHits: 5,
      windowMs: 60 * 1000,
    });
    if (!rl.allowed) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    const body = await req.json();
    const { name, email, subject, message } = body;
    const nameText = typeof name === "string" ? name.trim() : "";
    const emailText = typeof email === "string" ? email.trim() : "";
    const subjectText = typeof subject === "string" ? subject.trim() : "";
    const messageText = typeof message === "string" ? message.trim() : "";

    // Validate required fields
    if (!nameText || !emailText || !subjectText || !messageText) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }

    if (
      nameText.length > 120 ||
      emailText.length > 254 ||
      subjectText.length > 160 ||
      messageText.length > 4000
    ) {
      return NextResponse.json(
        { error: "Support request is too long" },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailText)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    // Persist first — success is only returned once the request is stored.
    const sql = getSql();
    if (!sql) {
      return NextResponse.json(
        { error: "Support is temporarily unavailable. Please try again later." },
        { status: 503 }
      );
    }
    await ensureSchema();
    const id = randomUUID();
    await sql`
      INSERT INTO support_requests (id, name, email, subject, message)
      VALUES (${id}, ${nameText}, ${emailText}, ${subjectText}, ${messageText})
    `;

    await notifySupportInbox({
      name: nameText,
      email: emailText,
      subject: subjectText,
      message: messageText,
    });

    return NextResponse.json({
      success: true,
      message: "Support request submitted successfully",
    });
  } catch (error) {
    console.error("Support form error:", error);
    return NextResponse.json(
      {
        error: "Failed to submit support request",
      },
      { status: 500 }
    );
  }
}




