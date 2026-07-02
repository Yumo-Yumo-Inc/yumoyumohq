import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Academia",
  description:
    "Yumo Yumo Academia — the methodology and sources behind the hidden-cost estimate and the spending identity. Every figure tied to an institution, every archetype to the literature.",
};

export default function AcademiaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Navigation, Footer, and I18nProvider are mounted inside
  // app/academia/[lang]/layout.tsx so they receive the URL locale.
  return <>{children}</>;
}
