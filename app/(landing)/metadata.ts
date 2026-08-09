import type { Metadata } from "next";

const SITE_URL = "https://yumoyumo.com";

const siteDescription =
  "Upload receipts, uncover hidden costs, and earn contribution rewards with Yumo Yumo.";

export const landingMetadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  openGraph: {
    type: "website",
    siteName: "Yumo Yumo",
    url: SITE_URL,
    title: "Yumo Yumo",
    description: siteDescription,
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Yumo Yumo",
    description: siteDescription,
  },
};
