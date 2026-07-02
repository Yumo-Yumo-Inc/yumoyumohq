import React from "react";
import { Navigation } from "@/components/navigation";
import { Footer } from "@/components/footer";
import { CookieConsentBanner } from "@/components/cookie-consent-banner";
import { I18nProvider } from "@/lib/i18n/context";
import NextAuthProvider from "@/components/session-provider";

export default function LandingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <I18nProvider>
      <NextAuthProvider>
        <div
          className="landing-page min-h-screen flex flex-col text-white"
          style={{
            background: '#0a0d14',
            backgroundImage: `
              radial-gradient(at 0% 0%, rgba(255, 122, 26, 0.15) 0px, transparent 50%),
              radial-gradient(at 100% 100%, rgba(0, 200, 200, 0.1) 0px, transparent 50%),
              url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.02'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")
            `,
            fontFamily: "Inter, system-ui, sans-serif",
          }}
        >
          <Navigation />
          <main style={{ flex: 1 }}>
            {children}
          </main>
          <Footer />
          <CookieConsentBanner />
        </div>
      </NextAuthProvider>
    </I18nProvider>
  );
}


