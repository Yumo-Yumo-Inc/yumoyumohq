import "./globals.css";
import type { ReactNode } from "react";
import type { Metadata, Viewport } from "next";
import { DM_Sans, DM_Mono, Orbitron, JetBrains_Mono, Barlow_Condensed, Space_Grotesk } from "next/font/google";
import { RootBodyShell } from "@/components/root-body-shell";
import { DOMErrorHandler } from "@/components/dom-error-handler";
import { GoogleTranslateBlocker } from "@/components/google-translate-blocker";
import { PwaInit } from "@/components/pwa/pwa-init";
import { ThemeInitScript } from "@/components/theme-init-script";
import { SpeedInsightsClient } from "@/components/speed-insights-client";

export const metadata: Metadata = {
  applicationName: "Yumo Yumo",
  title: {
    default: "Yumo Yumo",
    template: "%s | Yumo Yumo",
  },
  description: "Upload receipts, track rewards, and use Yumo Yumo like an installable mobile app.",
  // NOTE: manifest link is rendered manually in <head> below with
  // crossOrigin="use-credentials" so the auth/WAF cookie is sent.
  // Without it, the WAF rejects the cookieless manifest fetch with 403
  // (X-Proxy-Error: blocked-by-allowlist).
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Yumo Yumo",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    apple: "/pwa/apple-touch-icon.png",
    icon: [
      { url: "/pwa/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/pwa/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    shortcut: "/pwa/icon-192.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
  themeColor: "#0F1117",
  colorScheme: "dark",
};

const dmSans = DM_Sans({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-dm-sans",
  display: "swap",
});

const dmMono = DM_Mono({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500"],
  variable: "--font-dm-mono",
  display: "swap",
});

const orbitron = Orbitron({
  subsets: ["latin"],
  weight: ["500"],
  variable: "--font-orbitron",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

// Condensed grotesk — boarding-pass display type for the receipt detail surface.
const barlowCondensed = Barlow_Condensed({
  subsets: ["latin", "latin-ext"],
  weight: ["500", "600", "700"],
  variable: "--font-barlow-condensed",
  display: "swap",
});

// Display grotesk — the scan-analysis story surface (new-scanning-page.html).
const spaceGrotesk = Space_Grotesk({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-space-grotesk",
  display: "swap",
});

// Blocking inline script: reads localStorage before React hydration to prevent theme flash.
// Defined outside JSX to avoid TypeScript 5.9 template-literal-in-JSX parse issue.
const THEME_INIT_SCRIPT =
  "try{var __t=localStorage.getItem('app-theme');if(__t==='light')document.documentElement.classList.add('app-theme-light')}catch(_){}";

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html lang="en" className={`dark ${dmSans.variable} ${dmMono.variable} ${orbitron.variable} ${jetbrainsMono.variable} ${barlowCondensed.variable} ${spaceGrotesk.variable}`} suppressHydrationWarning>
      <head>
        {/*
          Manifest must be fetched WITH credentials so the WAF/auth cookie
          travels along — otherwise the proxy returns 403
          (X-Proxy-Error: blocked-by-allowlist). Next.js metadata API does
          not let us set crossOrigin, so we render the link manually.
        */}
        <link
          rel="manifest"
          href="/manifest.webmanifest"
          crossOrigin="use-credentials"
        />
      </head>
      <body suppressHydrationWarning className={dmSans.className}>
        <ThemeInitScript />
        <PwaInit />
        <GoogleTranslateBlocker />
        <DOMErrorHandler />
        <RootBodyShell>{children}</RootBodyShell>
        <SpeedInsightsClient />
      </body>
    </html>
  );
}
