import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import path from "node:path";

export const runtime = "nodejs";
export const alt = "Yumo Yumo — Proof of Expense";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpenGraphImage() {
  const iconPath = path.join(process.cwd(), "public", "pwa", "icon-512.png");
  const iconData = await readFile(iconPath);
  const iconSrc = `data:image/png;base64,${iconData.toString("base64")}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          background: "linear-gradient(135deg, #0a0d14 0%, #15151B 100%)",
          padding: "72px",
        }}
      >
        <img src={iconSrc} alt="" width={300} height={300} />
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            marginLeft: 48,
            color: "white",
          }}
        >
          <div style={{ fontSize: 72, fontWeight: 700 }}>Yumo Yumo</div>
          <div style={{ fontSize: 34, fontWeight: 600, color: "#FF7A1A", marginTop: 8 }}>
            Proof of Expense
          </div>
          <div style={{ fontSize: 28, color: "#9CA3AF", marginTop: 16, maxWidth: 680 }}>
            Upload receipts. Uncover hidden costs. Earn rewards.
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
