import { NextResponse } from "next/server";
import path from "path";
import { readFile, stat } from "fs/promises";

export const runtime = "nodejs";

const ALLOWED_KEYS = new Set([
  "tap",
  "whoosh",
  "tick",
  "scan_complete",
  "reveal",
  "success",
  "checkin",
  "quest_complete",
  "level_up",
  "notification",
]);

function contentType(ext: "mp3" | "ogg"): string {
  if (ext === "ogg") return "audio/ogg";
  return "audio/mpeg";
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ key: string }> }
) {
  const { key } = await params;
  if (!ALLOWED_KEYS.has(key)) {
    return NextResponse.json({ error: "Unknown sfx key" }, { status: 404 });
  }

  const url = new URL(req.url);
  const f = url.searchParams.get("f");
  const ext: "mp3" | "ogg" = f === "ogg" ? "ogg" : "mp3";

  const filePath = path.join(process.cwd(), "lib", "audio", "sfx", `${key}.${ext}`);

  try {
    const st = await stat(filePath);
    const bytesTotal = st.size;
    const range = req.headers.get("range");

    if (range) {
      const match = /^bytes=(\d+)-(\d+)?$/.exec(range);
      if (!match) {
        return new NextResponse(null, { status: 416 });
      }
      const start = Number(match[1]);
      const end = match[2] ? Number(match[2]) : Math.min(bytesTotal - 1, start + 256_000);
      if (!Number.isFinite(start) || !Number.isFinite(end) || start < 0 || end < start) {
        return new NextResponse(null, { status: 416 });
      }

      const buf = await readFile(filePath);
      const chunk = buf.subarray(start, Math.min(end + 1, buf.length));
      return new NextResponse(chunk, {
        status: 206,
        headers: {
          "Content-Type": contentType(ext),
          "Accept-Ranges": "bytes",
          "Content-Range": `bytes ${start}-${start + chunk.length - 1}/${bytesTotal}`,
          "Content-Length": String(chunk.length),
          "Cache-Control": "public, max-age=31536000, immutable",
        },
      });
    }

    const data = await readFile(filePath);
    return new NextResponse(data, {
      status: 200,
      headers: {
        "Content-Type": contentType(ext),
        "Accept-Ranges": "bytes",
        "Content-Length": String(bytesTotal),
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return NextResponse.json({ error: "SFX not found" }, { status: 404 });
  }
}

