import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AcademiaDocsShell } from "@/components/academia/docs-shell";
import { AcademiaMarkdown } from "@/components/academia/markdown";
import {
  type AcademiaLocale,
  academiaLocaleLabels,
  academiaLocales,
} from "@/lib/academia/shared";
import {
  getAcademiaDocument,
  getAcademiaNavigation,
  isAcademiaLocale,
} from "@/lib/academia/site";

// The source-registry section embeds live DB data; refresh on the same 30-minute
// cadence the hidden-cost override cache uses, so an approved draft surfaces without
// a redeploy. Prose pages simply re-render identically.
export const revalidate = 1800;

type RouteParams = {
  lang: string;
  slug?: string[];
};

type PageProps = {
  params: Promise<RouteParams>;
};

export async function generateStaticParams() {
  return academiaLocales.flatMap((lang) => {
    const navigation = getAcademiaNavigation(lang);
    return navigation.map((item) => ({
      lang,
      slug: item.slug ? item.slug.split("/") : [],
    }));
  });
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { lang, slug } = await params;
  if (!isAcademiaLocale(lang)) return {};
  const document = getAcademiaDocument(lang, slug);
  return {
    title: `${document.current.title} | Academia · ${academiaLocaleLabels[lang]}`,
    description: `Yumo Yumo Academia — ${document.current.title}`,
  };
}

export default async function AcademiaDocumentPage({ params }: PageProps) {
  const { lang, slug } = await params;
  if (!isAcademiaLocale(lang)) notFound();

  const locale = lang as AcademiaLocale;
  const document = getAcademiaDocument(locale, slug);
  const currentPath = document.current.href;
  const currentIndex = document.navigation.findIndex(
    (item) => item.href === currentPath,
  );
  const languageLinks = academiaLocales.map((code) => {
    const targetNavigation = getAcademiaNavigation(code);
    const fallbackItem = targetNavigation[0];
    const targetItem = targetNavigation[currentIndex] ?? fallbackItem;
    return {
      code,
      label: academiaLocaleLabels[code],
      href: targetItem.href,
    };
  });

  return (
    <AcademiaDocsShell
      locale={locale}
      currentPath={currentPath}
      navigation={document.navigation}
      toc={document.toc}
      previous={document.previous}
      next={document.next}
      languageLinks={languageLinks}
    >
      <AcademiaMarkdown markdown={document.markdown} locale={locale} />
    </AcademiaDocsShell>
  );
}
