import { NextResponse } from "next/server";
import { applySessionCookies, getSessionUsername } from "@/lib/auth/session";
import { issueEmailVerificationToken } from "@/lib/auth/email-verification";
import { sendVerificationEmail } from "@/lib/auth/resend";
import { getUserAuthRecord, updateUserEmail } from "@/lib/storage/user-auth-storage";

export async function GET() {
  try {
    const username = await getSessionUsername();
    if (!username) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await getUserAuthRecord(username);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(
      {
        email: user.email,
        emailVerified: !!user.emailVerifiedAt,
      },
      {
        headers: { "Cache-Control": "private, no-store" },
      }
    );
  } catch (error: unknown) {
    console.error("[api/user/email] GET error:", error);
    return NextResponse.json({ error: "Failed to load email" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const username = await getSessionUsername();
    if (!username) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const email = typeof body.email === "string" ? body.email.trim() : "";

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    const result = await updateUserEmail(username, email);
    if (!result.ok) {
      if (result.error === "INVALID_EMAIL") {
        return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
      }
      if (result.error === "EMAIL_IN_USE") {
        return NextResponse.json({ error: "That email is already in use" }, { status: 409 });
      }
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const emailVerified = !!result.emailVerifiedAt;
    let emailSent = false;
    if (!emailVerified) {
      const verification = await issueEmailVerificationToken(username, result.email);
      try {
        emailSent = await sendVerificationEmail({
          email: result.email,
          username,
          verificationUrl: verification.verificationUrl,
        });
      } catch (error) {
        console.error("[api/user/email] verification email send failed:", error);
      }
    }

    const response = NextResponse.json({
      success: true,
      email: result.email,
      emailVerified,
      emailSent,
    });
    await applySessionCookies(response, { username, emailVerified });
    return response;
  } catch (error: unknown) {
    console.error("[api/user/email] PATCH error:", error);
    return NextResponse.json({ error: "Failed to update email" }, { status: 500 });
  }
}
