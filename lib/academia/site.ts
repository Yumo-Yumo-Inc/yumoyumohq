import fs from "node:fs";
import path from "node:path";
import type {
  AcademiaLocale,
  AcademiaNavItem,
  AcademiaTocItem,
} from "@/lib/academia/shared";
import { academiaLocales } from "@/lib/academia/shared";

function slugifyHeading(raw: string, fallbackIndex: number): string {
  const anchor = raw
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
  return anchor || `section-${fallbackIndex}`;
}

// Extracts H2 headings from markdown into a flat TOC.
// "## 1.1 The question" → { number: "1.1", title: "The question", anchor: "1-1-the-question" }
function extractToc(markdown: string): AcademiaTocItem[] {
  const out: AcademiaTocItem[] = [];
  const usedAnchors = new Set<string>();
  const lines = markdown.split(/\r?\n/);
  let inCode = false;
  for (const line of lines) {
    if (line.startsWith("```")) {
      inCode = !inCode;
      continue;
    }
    if (inCode) continue;
    const m = /^##\s+(.+?)\s*$/.exec(line);
    if (!m) continue;
    const raw = m[1];
    const numMatch = /^(\d+(?:\.\d+)*)\s+(.+)$/.exec(raw);
    const number = numMatch ? numMatch[1] : null;
    const title = numMatch ? numMatch[2] : raw;
    let anchor = slugifyHeading(raw, out.length);
    while (usedAnchors.has(anchor)) {
      anchor = `${slugifyHeading(raw, out.length)}-${usedAnchors.size}`;
    }
    usedAnchors.add(anchor);
    out.push({ title, number, anchor });
  }
  return out;
}

const CONTENT_ROOT = path.join(process.cwd(), "content", "academia");
const FALLBACK_LOCALE: AcademiaLocale = "en";

export function isAcademiaLocale(value: string): value is AcademiaLocale {
  return academiaLocales.includes(value as AcademiaLocale);
}

export function getAcademiaLocaleRoot(locale: AcademiaLocale) {
  return path.join(CONTENT_ROOT, locale);
}

// True when the locale directory has a SUMMARY.md. Locales without content
// fall back to EN at render time.
function localeHasContent(locale: AcademiaLocale): boolean {
  const summaryPath = path.join(getAcademiaLocaleRoot(locale), "SUMMARY.md");
  return fs.existsSync(summaryPath);
}

function resolveContentLocale(locale: AcademiaLocale): AcademiaLocale {
  return localeHasContent(locale) ? locale : FALLBACK_LOCALE;
}

export function getAcademiaNavigation(locale: AcademiaLocale): AcademiaNavItem[] {
  const contentLocale = resolveContentLocale(locale);
  const summaryPath = path.join(getAcademiaLocaleRoot(contentLocale), "SUMMARY.md");
  const raw = fs.readFileSync(summaryPath, "utf8");

  return raw
    .split(/\r?\n/)
    .map((line) => {
      // Capture indentation depth (2 spaces = 1 level) and strip it.
      const indentMatch = /^( *)\* \[(.+?)\]\((.+?)\)$/.exec(line);
      if (!indentMatch) return null;
      const [, indent, title, file] = indentMatch;
      const depth = Math.floor(indent.length / 2);
      const slug = file === "README.md" ? "" : file.replace(/\.md$/, "");
      return {
        title,
        file,
        slug,
        depth,
        href: slug ? `/academia/${locale}/${slug}` : `/academia/${locale}`,
      } satisfies AcademiaNavItem;
    })
    .filter((x): x is AcademiaNavItem => x !== null);
}

export function getAcademiaDocument(locale: AcademiaLocale, slug?: string[]) {
  const contentLocale = resolveContentLocale(locale);
  const navigation = getAcademiaNavigation(locale);
  const currentSlug = slug?.join("/") ?? "";
  const current =
    navigation.find((item) => item.slug === currentSlug) ?? navigation[0];

  const absolutePath = path.join(getAcademiaLocaleRoot(contentLocale), current.file);

  // If a per-section file is missing in the locale, fall back to EN for just this file.
  const finalPath = fs.existsSync(absolutePath)
    ? absolutePath
    : path.join(getAcademiaLocaleRoot(FALLBACK_LOCALE), current.file);

  const markdown = fs.readFileSync(finalPath, "utf8");
  const index = navigation.findIndex((item) => item.slug === current.slug);
  const toc = extractToc(markdown);

  return {
    locale,
    contentLocale,
    navigation,
    current,
    markdown,
    toc,
    previous: index > 0 ? navigation[index - 1] : null,
    next: index < navigation.length - 1 ? navigation[index + 1] : null,
    usedFallback: contentLocale !== locale,
  };
}
