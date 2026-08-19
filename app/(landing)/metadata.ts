import type { Metadata } from "next";

const SITE_URL = "https://yumoyumo.com";

const siteTitle = "Yumo Yumo — Receipt-powered spending intelligence";
const siteDescription =
  "Upload receipts, uncover hidden costs, and earn contribution rewards with Yumo Yumo.";

export const landingMetadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    absolute: siteTitle,
  },
  description: siteDescription,
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    siteName: "Yumo Yumo",
    url: SITE_URL,
    title: siteTitle,
    description: siteDescription,
    locale: "en_US",
    // Explicit reference to the app/opengraph-image.tsx route (1200x630 PNG).
    // Defining openGraph here replaces the inherited object, so the image
    // must be wired in manually.
    images: [{ url: "/opengraph-image", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: siteTitle,
    description: siteDescription,
    images: ["/opengraph-image"],
  },
};
