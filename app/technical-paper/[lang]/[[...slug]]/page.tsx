import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { TechnicalPaperDocsShell } from "@/components/technical-paper/docs-shell";
import { TechnicalPaperMarkdown } from "@/components/technical-paper/markdown";
import {
  type TechnicalPaperLocale,
  technicalPaperLocaleLabels,
  technicalPaperLocales,
} from "@/lib/technical-paper/shared";
import {
  getTechnicalPaperDocument,
  getTechnicalPaperNavigation,
  isTechnicalPaperLocale,
} from "@/lib/technical-paper/site";

type RouteParams = {
  lang: string;
  slug?: string[];
};

type PageProps = {
  params: Promise<RouteParams>;
};

export async function generateStaticParams() {
  return technicalPaperLocales.flatMap((lang) => {
    const navigation = getTechnicalPaperNavigation(lang);
    return navigation.map((item) => ({
      lang,
      slug: item.slug ? item.slug.split("/") : [],
    }));
  });
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { lang, slug } = await params;

  if (!isTechnicalPaperLocale(lang)) {
    return {};
  }

  const document = getTechnicalPaperDocument(lang, slug);
  return {
    title: `${document.current.title} | Technical Paper · ${technicalPaperLocaleLabels[lang]}`,
    description: `Yumo Yumo Technical Whitepaper — ${document.current.title}`,
  };
}

export default async function TechnicalPaperDocumentPage({ params }: PageProps) {
  const { lang, slug } = await params;

  if (!isTechnicalPaperLocale(lang)) {
    notFound();
  }

  const locale = lang as TechnicalPaperLocale;
  const document = getTechnicalPaperDocument(locale, slug);
  const currentPath = document.current.href;
  const currentIndex = document.navigation.findIndex(
    (item) => item.href === currentPath
  );
  const languageLinks = technicalPaperLocales.map((code) => {
    const targetNavigation = getTechnicalPaperNavigation(code);
    const fallbackItem = targetNavigation[0];
    const targetItem = targetNavigation[currentIndex] ?? fallbackItem;
    return {
      code,
      label: technicalPaperLocaleLabels[code],
      href: targetItem.href,
    };
  });

  return (
    <TechnicalPaperDocsShell
      locale={locale}
      currentPath={currentPath}
      navigation={document.navigation}
      toc={document.toc}
      previous={document.previous}
      next={document.next}
      languageLinks={languageLinks}
    >
      <TechnicalPaperMarkdown markdown={document.markdown} />
    </TechnicalPaperDocsShell>
  );
}
