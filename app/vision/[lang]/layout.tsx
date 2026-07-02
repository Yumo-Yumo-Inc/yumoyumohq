import { notFound } from "next/navigation";
import { Footer } from "@/components/footer";
import { Navigation } from "@/components/navigation";
import { I18nProvider } from "@/lib/i18n/context";
import { isWhitepaperLocale } from "@/lib/whitepaper/site";

type LayoutProps = {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
};

export default async function VisionLangLayout({
  children,
  params,
}: LayoutProps) {
  const { lang } = await params;

  if (!isWhitepaperLocale(lang)) {
    notFound();
  }

  return (
    <I18nProvider initialLocale={lang}>
      <Navigation />
      {children}
      <Footer />
    </I18nProvider>
  );
}
