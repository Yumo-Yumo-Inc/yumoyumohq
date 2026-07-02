import { NextResponse } from "next/server";
import { getSessionUsername } from "@/lib/auth/session";
import { verifyPassword, updatePassword } from "@/lib/storage/user-auth-storage";

export async function POST(req: Request) {
  try {
    const username = await getSessionUsername();

    if (!username) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { currentPassword, newPassword } = body;

    // Validate inputs
    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: "Current password and new password are required" },
        { status: 400 }
      );
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    // Verify current password
    const isValid = await verifyPassword(username, currentPassword);
    
    if (!isValid) {
      return NextResponse.json(
        { error: "Current password is incorrect" },
        { status: 401 }
      );
    }

    // Update password (this will create user in database if not exists)
    try {
      await updatePassword(username, newPassword);
    } catch (error) {
      console.error("[api/user/change-password] Failed to update password");
      throw error; // Re-throw to be caught by outer catch
    }

    return NextResponse.json({
      success: true,
      message: "Password changed successfully",
    });
  } catch {
    console.error("[api/user/change-password] POST failed");
    
    return NextResponse.json(
      {
        error: "Failed to change password",
      },
      { status: 500 }
    );
  }
}
