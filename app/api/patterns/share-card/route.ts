import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { put } from "@vercel/blob";
import { NextResponse } from "next/server";
import { getSessionUsername } from "@/lib/auth/session";
import {
  getOrCreateShareToken,
  updateShareCard,
} from "@/lib/insights/identity/share-card-storage";

export const runtime = "nodejs";

const MAX_CARD_SIZE = 4 * 1024 * 1024;
const LOCAL_CARD_DIR = path.join(process.cwd(), "public", "identity-cards");
const isVercel = process.env.VERCEL === "1" || process.cwd().startsWith("/var/task");

function isBlobStorageAvailable(): boolean {
  return !!process.env.BLOB_READ_WRITE_TOKEN;
}

function resolveOrigin(req: Request): string {
  const env = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (env) return env.replace(/\/+$/, "");
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  const proto = req.headers.get("x-forwarded-proto") ?? "https";
  return host ? `${proto}://${host}` : "http://localhost:3000";
}

export async function POST(req: Request) {
  const username = await getSessionUsername();
  if (!username) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file");
    const classPrimary = String(formData.get("classPrimary") ?? "");
    const classSecondary = String(formData.get("classSecondary") ?? "");
    const locale = String(formData.get("locale") ?? "en");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No card image provided" }, { status: 400 });
    }
    if (file.type !== "image/png") {
      return NextResponse.json({ error: "Card must be a PNG" }, { status: 400 });
    }
    if (file.size > MAX_CARD_SIZE) {
      return NextResponse.json({ error: "Card image too large" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    // Token first — it forms the blob path and stays stable across re-shares.
    const token = await getOrCreateShareToken(username);
    const origin = resolveOrigin(req);

    let imageUrl: string;
    if (isBlobStorageAvailable() && isVercel) {
      const blob = await put(`identity-cards/${token}.png`, buffer, {
        access: "public",
        contentType: "image/png",
        allowOverwrite: true,
      });
      imageUrl = blob.url;
    } else {
      await mkdir(LOCAL_CARD_DIR, { recursive: true });
      await writeFile(path.join(LOCAL_CARD_DIR, `${token}.png`), buffer);
      imageUrl = `${origin}/identity-cards/${token}.png`;
    }

    await updateShareCard(token, { imageUrl, classPrimary, classSecondary, locale });

    return NextResponse.json({ shareUrl: `${origin}/i/${token}`, imageUrl });
  } catch (error: unknown) {
    console.error("[api/patterns/share-card] failed:", error);
    return NextResponse.json({ error: "Could not store share card" }, { status: 500 });
  }
}
