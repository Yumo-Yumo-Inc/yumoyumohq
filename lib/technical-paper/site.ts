import fs from "node:fs";
import path from "node:path";
import type {
  TechnicalPaperLocale,
  TechnicalPaperNavItem,
  TechnicalPaperTocItem,
} from "@/lib/technical-paper/shared";
import { technicalPaperLocales } from "@/lib/technical-paper/shared";

function slugifyHeading(raw: string, fallbackIndex: number): string {
  const anchor = raw
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
  return anchor || `section-${fallbackIndex}`;
}

// Extracts H2 headings from markdown into a flat TOC.
// "## 1.1 High-level system map" → { number: "1.1", title: "High-level system map", anchor: "1-1-high-level-system-map" }
function extractToc(markdown: string): TechnicalPaperTocItem[] {
  const out: TechnicalPaperTocItem[] = [];
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

const CONTENT_ROOT = path.join(process.cwd(), "content", "technical-paper");
const FALLBACK_LOCALE: TechnicalPaperLocale = "en";

export function isTechnicalPaperLocale(value: string): value is TechnicalPaperLocale {
  return technicalPaperLocales.includes(value as TechnicalPaperLocale);
}

export function getTechnicalPaperLocaleRoot(locale: TechnicalPaperLocale) {
  return path.join(CONTENT_ROOT, locale);
}

// Returns true if the locale directory has a SUMMARY.md. Locales without content
// fall back to EN at render time.
function localeHasContent(locale: TechnicalPaperLocale): boolean {
  const summaryPath = path.join(getTechnicalPaperLocaleRoot(locale), "SUMMARY.md");
  return fs.existsSync(summaryPath);
}

function resolveContentLocale(locale: TechnicalPaperLocale): TechnicalPaperLocale {
  return localeHasContent(locale) ? locale : FALLBACK_LOCALE;
}

export function getTechnicalPaperNavigation(locale: TechnicalPaperLocale): TechnicalPaperNavItem[] {
  const contentLocale = resolveContentLocale(locale);
  const summaryPath = path.join(getTechnicalPaperLocaleRoot(contentLocale), "SUMMARY.md");
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
        href: slug
          ? `/technical-paper/${locale}/${slug}`
          : `/technical-paper/${locale}`,
      } satisfies TechnicalPaperNavItem;
    })
    .filter((x): x is TechnicalPaperNavItem => x !== null);
}

export function getTechnicalPaperDocument(locale: TechnicalPaperLocale, slug?: string[]) {
  const contentLocale = resolveContentLocale(locale);
  const navigation = getTechnicalPaperNavigation(locale);
  const currentSlug = slug?.join("/") ?? "";
  const current =
    navigation.find((item) => item.slug === currentSlug) ?? navigation[0];

  const absolutePath = path.join(getTechnicalPaperLocaleRoot(contentLocale), current.file);

  // If a per-section file is missing in the locale, also fall back to EN for just this file.
  const finalPath = fs.existsSync(absolutePath)
    ? absolutePath
    : path.join(getTechnicalPaperLocaleRoot(FALLBACK_LOCALE), current.file);

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
