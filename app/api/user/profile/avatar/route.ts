import { randomUUID } from "crypto";
import { mkdir, unlink, writeFile } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import { del, put } from "@vercel/blob";
import sharp from "sharp";
import { getSessionUsername } from "@/lib/auth/session";
import { getUserProfile, saveUserProfileAvatar } from "@/lib/storage/user-profile-storage";

const MAX_AVATAR_SIZE = 5 * 1024 * 1024;
const LOCAL_AVATAR_DIR = path.join(process.cwd(), "public", "profile-avatars");
const isVercel = process.env.VERCEL === "1" || process.cwd().startsWith("/var/task");

function isBlobStorageAvailable(): boolean {
  return !!process.env.BLOB_READ_WRITE_TOKEN;
}

function safeUsername(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9_-]+/g, "-").replace(/^-+|-+$/g, "") || "user";
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

async function deleteOldAvatar(avatarUrl: string | null | undefined) {
  if (!avatarUrl) return;

  if (isBlobStorageAvailable() && avatarUrl.startsWith("http")) {
    await del(avatarUrl).catch(() => {});
    return;
  }

  if (avatarUrl.startsWith("/profile-avatars/")) {
    const filename = path.basename(avatarUrl);
    await unlink(path.join(LOCAL_AVATAR_DIR, filename)).catch(() => {});
  }
}

export async function POST(req: Request) {
  const username = await getSessionUsername();
  if (!username) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "Profile photo must be an image" }, { status: 400 });
    }

    if (file.size > MAX_AVATAR_SIZE) {
      return NextResponse.json(
        {
          error: "Profile photo is too large",
          maxSize: MAX_AVATAR_SIZE,
          receivedSize: file.size,
        },
        { status: 400 }
      );
    }

    const inputBuffer = Buffer.from(await file.arrayBuffer());
    const avatarBuffer = await sharp(inputBuffer)
      .rotate()
      .resize(512, 512, { fit: "cover", position: "center" })
      .webp({ quality: 84 })
      .toBuffer();

    const filename = `${safeUsername(username)}-${randomUUID()}.webp`;
    const currentProfile = await getUserProfile(username);
    let avatarUrl: string;

    if (isBlobStorageAvailable() && isVercel) {
      const blob = await put(`profile-avatars/${filename}`, avatarBuffer, {
        access: "public",
        contentType: "image/webp",
      });
      avatarUrl = blob.url;
    } else {
      await mkdir(LOCAL_AVATAR_DIR, { recursive: true });
      await writeFile(path.join(LOCAL_AVATAR_DIR, filename), avatarBuffer);
      avatarUrl = `/profile-avatars/${filename}`;
    }

    await saveUserProfileAvatar(username, avatarUrl);
    await deleteOldAvatar(currentProfile?.avatarUrl);

    return NextResponse.json({
      success: true,
      avatarUrl,
    });
  } catch (error: unknown) {
    console.error("[api/user/profile/avatar] upload failed:", error);
    return NextResponse.json(
      {
        error: "Failed to upload profile photo",
        details: getErrorMessage(error),
      },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  const username = await getSessionUsername();
  if (!username) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const currentProfile = await getUserProfile(username);
    await deleteOldAvatar(currentProfile?.avatarUrl);
    await saveUserProfileAvatar(username, null);

    return NextResponse.json({ success: true, avatarUrl: null });
  } catch (error: unknown) {
    console.error("[api/user/profile/avatar] delete failed:", error);
    return NextResponse.json(
      {
        error: "Failed to remove profile photo",
        details: getErrorMessage(error),
      },
      { status: 500 }
    );
  }
}
