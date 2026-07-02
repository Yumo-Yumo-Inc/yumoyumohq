import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { VisionPaper } from "@/components/vision/vision-paper";
import {
  type WhitepaperLocale,
  whitepaperLocaleLabels,
  whitepaperLocales,
} from "@/lib/whitepaper/shared";
import { isWhitepaperLocale } from "@/lib/whitepaper/site";

type RouteParams = {
  lang: string;
  slug?: string[];
};

type PageProps = {
  params: Promise<RouteParams>;
};

export function generateStaticParams() {
  return whitepaperLocales.map((lang) => ({ lang, slug: [] }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { lang } = await params;
  if (!isWhitepaperLocale(lang)) return {};
  return {
    title: `${whitepaperLocaleLabels[lang]} Vision Paper · Yumo Yumo`,
    description:
      "Yumo Yumo vision paper — peel the price stack, surface the hidden cost, return a token the holder can carry, convert, or trade.",
  };
}

export default async function VisionPage({ params }: PageProps) {
  const { lang } = await params;
  if (!isWhitepaperLocale(lang)) notFound();
  return <VisionPaper lang={lang as WhitepaperLocale} />;
}
