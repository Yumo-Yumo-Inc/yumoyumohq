import { notFound } from "next/navigation";
import { Footer } from "@/components/footer";
import { Navigation } from "@/components/navigation";
import { I18nProvider } from "@/lib/i18n/context";
import { isTechnicalPaperLocale } from "@/lib/technical-paper/site";

type LayoutProps = {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
};

export default async function TechnicalPaperLangLayout({
  children,
  params,
}: LayoutProps) {
  const { lang } = await params;

  if (!isTechnicalPaperLocale(lang)) {
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
