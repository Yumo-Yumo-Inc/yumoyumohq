import fs from "node:fs";
import path from "node:path";
import type { WhitepaperLocale, WhitepaperNavItem } from "@/lib/whitepaper/shared";
import { whitepaperLocales } from "@/lib/whitepaper/shared";

const CONTENT_ROOT = path.join(process.cwd(), "content", "whitepaper");

export function isWhitepaperLocale(value: string): value is WhitepaperLocale {
  return whitepaperLocales.includes(value as WhitepaperLocale);
}

export function getWhitepaperLocaleRoot(locale: WhitepaperLocale) {
  return path.join(CONTENT_ROOT, locale);
}

export function getWhitepaperNavigation(locale: WhitepaperLocale): WhitepaperNavItem[] {
  const summaryPath = path.join(getWhitepaperLocaleRoot(locale), "SUMMARY.md");
  const raw = fs.readFileSync(summaryPath, "utf8");

  return raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.startsWith("* ["))
    .map((line) => {
      const match = /^\* \[(.+?)\]\((.+?)\)$/.exec(line);
      if (!match) {
        return null;
      }

      const [, title, file] = match;
      const slug = file === "README.md" ? "" : file.replace(/\.md$/, "");
      const anchor = slug || "opening";

      return {
        title,
        file,
        slug,
        anchor,
        href: slug ? `/whitepaper/${locale}/${slug}` : `/whitepaper/${locale}`,
      } satisfies WhitepaperNavItem;
    })
    .filter(Boolean) as WhitepaperNavItem[];
}

export function getWhitepaperOnePageDocument(locale: WhitepaperLocale) {
  const navigation = getWhitepaperNavigation(locale);
  const sections = navigation.map((item) => {
    const absolutePath = path.join(getWhitepaperLocaleRoot(locale), item.file);

    return {
      ...item,
      markdown: fs.readFileSync(absolutePath, "utf8"),
    };
  });

  return {
    locale,
    navigation,
    sections,
  };
}

export function getWhitepaperDocument(locale: WhitepaperLocale, slug?: string[]) {
  const navigation = getWhitepaperNavigation(locale);
  const currentSlug = slug?.join("/") ?? "";
  const current =
    navigation.find((item) => item.slug === currentSlug) ?? navigation[0];

  const absolutePath = path.join(getWhitepaperLocaleRoot(locale), current.file);
  const markdown = fs.readFileSync(absolutePath, "utf8");
  const index = navigation.findIndex((item) => item.slug === current.slug);

  return {
    locale,
    navigation,
    current,
    markdown,
    previous: index > 0 ? navigation[index - 1] : null,
    next: index < navigation.length - 1 ? navigation[index + 1] : null,
  };
}
