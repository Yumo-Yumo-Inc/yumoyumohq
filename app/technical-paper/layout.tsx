import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Technical Paper",
  description:
    "Yumo Yumo Technical Whitepaper — receipt pipeline, tokenomics mechanics, data schema, and risk treatment for the Yumo platform.",
};

export default function TechnicalPaperLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Navigation, Footer, and I18nProvider are mounted inside
  // app/technical-paper/[lang]/layout.tsx so they receive the URL locale.
  return <>{children}</>;
}
