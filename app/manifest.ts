import type { MetadataRoute } from "next";

// Mark the manifest route as static so Next.js does not recompile it on every
// dev-mode request. Without this, the dev server reported ~9.7s compile times
// for /manifest.webmanifest because Next was treating the manifest function as
// a dynamic Server Component on each navigation.
export const dynamic = "force-static";
// Cache the result for an hour in dev/prod; the manifest contents never change
// between requests, so revalidation is cheap insurance.
export const revalidate = 3600;

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Yumo Yumo",
    short_name: "Yumo",
    description: "Upload receipts, track rewards, and use Yumo Yumo like an installable mobile app.",
    start_url: "/app",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#0F1117",
    theme_color: "#0F1117",
    lang: "en",
    categories: ["finance", "productivity", "utilities"],
    icons: [
      {
        src: "/pwa/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/pwa/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: "/pwa/icon-512-maskable.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    shortcuts: [
      {
        name: "Upload Receipt",
        short_name: "Upload",
        description: "Open the receipt upload flow",
        url: "/app/upload",
        icons: [{ src: "/pwa/icon-192.png", sizes: "192x192", type: "image/png" }],
      },
      {
        name: "My Receipts",
        short_name: "Receipts",
        description: "See saved receipts",
        url: "/app/receipts",
        icons: [{ src: "/pwa/icon-192.png", sizes: "192x192", type: "image/png" }],
      },
    ],
  };
}
