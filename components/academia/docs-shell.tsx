"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  GraduationCap,
  Globe,
  Check,
  ArrowLeft,
} from "lucide-react";
import type {
  AcademiaLocale,
  AcademiaNavItem,
  AcademiaTocItem,
} from "@/lib/academia/shared";
import { academiaLocaleLabels, academiaUiStrings } from "@/lib/academia/shared";

const MONO_STACK = "var(--font-jetbrains-mono), ui-monospace, Menlo, Consolas, monospace";
const ACCENT = "#A78BFA";
const ACCENT_BG = "rgba(167, 139, 250, 0.08)";
const ACCENT_BORDER = "rgba(167, 139, 250, 0.25)";
const BG_BASE = "#0B0D10";
const BG_ELEVATED = "#0E1014";
const BG_SURFACE = "rgba(255, 255, 255, 0.02)";
const BG_SURFACE_HOVER = "rgba(255, 255, 255, 0.04)";
const TEXT_PRIMARY = "#F9FAFB";
const TEXT_SECONDARY = "#9CA3AF";
const TEXT_MUTED = "#6B7280";
const BORDER = "rgba(255, 255, 255, 0.06)";
const BORDER_STRONG = "rgba(255, 255, 255, 0.1)";

type LanguageLink = {
  code: AcademiaLocale;
  label: string;
  href: string;
};

function LanguageControl({
  locale,
  languageLinks,
  open,
  onOpenChange,
  menuFrom,
}: {
  locale: AcademiaLocale;
  languageLinks: LanguageLink[];
  open: boolean;
  onOpenChange: (next: boolean) => void;
  menuFrom: "left" | "right";
}) {
  const menuAlign =
    menuFrom === "right"
      ? "right-0 top-[calc(100%+8px)]"
      : "left-0 top-[calc(100%+8px)]";

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => onOpenChange(!open)}
        className="inline-flex shrink-0 items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-medium uppercase tracking-[0.08em] transition-colors"
        style={{
          fontFamily: MONO_STACK,
          color: TEXT_SECONDARY,
          border: `0.5px solid ${BORDER_STRONG}`,
          background: BG_SURFACE,
          borderRadius: "4px",
        }}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <Globe className="h-3.5 w-3.5" style={{ color: ACCENT }} />
        <span>{locale}</span>
      </button>
      {open ? (
        <>
          <div
            className="fixed inset-0 z-30"
            onClick={() => onOpenChange(false)}
            aria-hidden
          />
          <div
            role="listbox"
            className={`absolute ${menuAlign} z-40 w-56 overflow-hidden`}
            style={{
              border: `0.5px solid ${BORDER_STRONG}`,
              background: BG_ELEVATED,
              borderRadius: "6px",
              boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
            }}
          >
            {languageLinks.map((item) => {
              const active = item.code === locale;
              return (
                <Link
                  key={item.code}
                  href={item.href}
                  onClick={() => onOpenChange(false)}
                  className="flex items-center justify-between gap-3 px-4 py-2.5 text-[13px] transition-colors"
                  style={{
                    background: active ? BG_SURFACE_HOVER : "transparent",
                    color: active ? TEXT_PRIMARY : TEXT_SECONDARY,
                  }}
                >
                  <span className="flex items-center gap-2.5">
                    <span
                      className="inline-flex w-7 text-[10px] font-medium uppercase tracking-[0.08em]"
                      style={{ color: ACCENT, fontFamily: MONO_STACK }}
                    >
                      {item.code}
                    </span>
                    <span>{item.label}</span>
                  </span>
                  {active ? (
                    <Check className="h-3.5 w-3.5" style={{ color: ACCENT }} />
                  ) : null}
                </Link>
              );
            })}
          </div>
        </>
      ) : null}
    </div>
  );
}

type NavSection = {
  parent: AcademiaNavItem;
  children: AcademiaNavItem[];
};

function groupNavigation(items: AcademiaNavItem[]): NavSection[] {
  const sections: NavSection[] = [];
  let current: NavSection | null = null;
  for (const item of items) {
    if (item.depth === 0) {
      current = { parent: item, children: [] };
      sections.push(current);
    } else if (current) {
      current.children.push(item);
    }
  }
  return sections;
}

function isSectionActive(section: NavSection, currentPath: string): boolean {
  if (section.parent.href === currentPath) return true;
  if (currentPath.startsWith(section.parent.href + "/")) return true;
  return section.children.some(
    (child) =>
      child.href === currentPath || currentPath.startsWith(child.href + "/"),
  );
}

type DocsShellProps = {
  locale: AcademiaLocale;
  currentPath: string;
  navigation: AcademiaNavItem[];
  toc: AcademiaTocItem[];
  previous: AcademiaNavItem | null;
  next: AcademiaNavItem | null;
  languageLinks: LanguageLink[];
  children: React.ReactNode;
};

export function AcademiaDocsShell({
  locale,
  currentPath,
  navigation,
  toc,
  previous,
  next,
  languageLinks,
  children,
}: DocsShellProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const ui = academiaUiStrings[locale];

  const sections = useMemo(() => groupNavigation(navigation), [navigation]);

  const initialExpanded = useMemo(() => {
    const state: Record<string, boolean> = {};
    for (const section of sections) {
      state[section.parent.href] = isSectionActive(section, currentPath);
    }
    return state;
  }, [sections, currentPath]);

  const [expanded, setExpanded] = useState<Record<string, boolean>>(initialExpanded);

  const toggleSection = (href: string) => {
    setExpanded((prev) => ({ ...prev, [href]: !prev[href] }));
  };

  return (
    <div className="min-h-screen" style={{ background: BG_BASE, color: TEXT_PRIMARY }}>
      <header
        className="sticky top-16 z-40 backdrop-blur-xl"
        style={{
          background: "rgba(11, 13, 16, 0.85)",
          borderBottom: `0.5px solid ${BORDER}`,
        }}
      >
        <div className="mx-auto flex w-full max-w-[1400px] items-center gap-3 px-4 py-2.5 md:px-6">
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            className="inline-flex h-8 w-8 shrink-0 items-center justify-center transition-colors lg:hidden"
            style={{
              border: `0.5px solid ${BORDER_STRONG}`,
              background: BG_SURFACE,
              color: TEXT_SECONDARY,
              borderRadius: "4px",
            }}
            aria-label={ui.openMenu}
          >
            <Menu className="h-4 w-4" />
          </button>

          <div className="flex min-w-0 flex-1 items-center gap-2">
            <GraduationCap className="h-3.5 w-3.5 shrink-0" style={{ color: ACCENT }} />
            <span
              className="truncate text-[11px] font-medium uppercase tracking-[0.12em]"
              style={{ color: TEXT_SECONDARY, fontFamily: MONO_STACK }}
            >
              {ui.paperTitle}
            </span>
            <span
              className="hidden sm:inline-flex items-center text-[10px] font-medium uppercase tracking-[0.06em]"
              style={{
                fontFamily: MONO_STACK,
                color: ACCENT,
                background: ACCENT_BG,
                border: `0.5px solid ${ACCENT_BORDER}`,
                padding: "2px 7px",
                borderRadius: "4px",
              }}
            >
              {ui.draftBadge}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href={`/vision/${locale}`}
              className="hidden items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-medium uppercase tracking-[0.08em] transition-colors md:inline-flex"
              style={{ fontFamily: MONO_STACK, color: TEXT_SECONDARY }}
            >
              <ArrowLeft className="h-3 w-3" />
              {ui.visionPaperLink}
            </Link>
            <LanguageControl
              locale={locale}
              languageLinks={languageLinks}
              open={langOpen}
              onOpenChange={setLangOpen}
              menuFrom="right"
            />
          </div>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-[1400px]">
        {/* Desktop sidebar */}
        <aside
          className="hidden w-[260px] shrink-0 lg:block"
          style={{ borderRight: `0.5px solid ${BORDER}` }}
        >
          <div className="sticky top-[calc(4rem+57px)] h-[calc(100vh-4rem-57px)] overflow-y-auto px-5 py-6">
            <div className="mb-5">
              <div
                className="text-[10px] font-medium uppercase tracking-[0.12em]"
                style={{ color: TEXT_MUTED, fontFamily: MONO_STACK }}
              >
                {ui.documentation}
              </div>
              <div
                className="mt-1.5 text-[14px] font-medium tracking-tight"
                style={{ color: TEXT_PRIMARY }}
              >
                {academiaLocaleLabels[locale]}
              </div>
              <div
                className="mt-3 h-px w-10"
                style={{ background: `linear-gradient(to right, ${ACCENT}, transparent)` }}
              />
            </div>

            <nav className="space-y-0.5">
              {sections.map((section) => {
                const parent = section.parent;
                const sectionActive = isSectionActive(section, currentPath);
                const isOpen = expanded[parent.href] ?? sectionActive;
                const parentOnPage = parent.href === currentPath;
                const match = /^(\d{2})\s+(.+)$/.exec(parent.title);
                const sectionNum = match ? match[1] : null;
                const sectionTitle = match ? match[2] : parent.title;
                const hasChildren = section.children.length > 0;
                return (
                  <div key={parent.href}>
                    <div
                      className="group relative flex items-stretch leading-snug"
                      style={{
                        background: parentOnPage
                          ? ACCENT_BG
                          : sectionActive
                            ? "rgba(167, 139, 250, 0.04)"
                            : "transparent",
                        borderRadius: "6px",
                        borderLeft: parentOnPage
                          ? `2px solid ${ACCENT}`
                          : "2px solid transparent",
                      }}
                    >
                      <Link
                        href={parent.href}
                        className="flex min-w-0 flex-1 items-start gap-3 py-2 transition-colors"
                        style={{
                          color: parentOnPage || sectionActive ? TEXT_PRIMARY : TEXT_SECONDARY,
                          paddingLeft: parentOnPage ? "10px" : "12px",
                          paddingRight: hasChildren ? "4px" : "12px",
                          fontFamily: MONO_STACK,
                          fontSize: "12.5px",
                        }}
                      >
                        <span
                          className="mt-0.5 inline-flex h-4 w-6 shrink-0 items-center justify-start text-[10px] font-medium tabular-nums"
                          style={{ color: parentOnPage || sectionActive ? ACCENT : TEXT_MUTED }}
                        >
                          {sectionNum ?? "—"}
                        </span>
                        <span className="block min-w-0 flex-1">{sectionTitle}</span>
                      </Link>
                      {hasChildren ? (
                        <button
                          type="button"
                          onClick={() => toggleSection(parent.href)}
                          className="flex shrink-0 items-center justify-center px-2 transition-colors"
                          style={{ color: TEXT_MUTED, borderRadius: "6px" }}
                          aria-label={isOpen ? ui.closeMenu : ui.openMenu}
                          aria-expanded={isOpen}
                        >
                          {isOpen ? (
                            <ChevronDown className="h-3.5 w-3.5" />
                          ) : (
                            <ChevronRight className="h-3.5 w-3.5" />
                          )}
                        </button>
                      ) : null}
                    </div>
                    {parentOnPage && toc.length > 0 ? (
                      <ul
                        className="my-1 ml-8 space-y-0.5"
                        style={{ borderLeft: `0.5px solid ${BORDER_STRONG}` }}
                      >
                        {toc.map((heading, index) => (
                          <li key={`${heading.anchor}-${index}`}>
                            <a
                              href={`#${heading.anchor}`}
                              className="block py-1 pl-3 text-[12px] leading-snug transition-colors hover:text-white"
                              style={{ color: TEXT_MUTED, fontFamily: MONO_STACK }}
                            >
                              {heading.number ? (
                                <span style={{ marginRight: "6px", color: TEXT_MUTED }}>
                                  {heading.number}
                                </span>
                              ) : null}
                              <span>{heading.title}</span>
                            </a>
                          </li>
                        ))}
                      </ul>
                    ) : null}
                    {isOpen && hasChildren ? (
                      <div className="mt-0.5 space-y-0.5 pb-1">
                        {section.children.map((child) => {
                          const childActive = child.href === currentPath;
                          return (
                            <div key={child.href}>
                              <Link
                                href={child.href}
                                className="group relative flex items-start gap-2 py-1.5 leading-snug transition-colors"
                                style={{
                                  background: childActive ? ACCENT_BG : "transparent",
                                  color: childActive ? TEXT_PRIMARY : TEXT_SECONDARY,
                                  borderRadius: "6px",
                                  borderLeft: childActive
                                    ? `2px solid ${ACCENT}`
                                    : "2px solid transparent",
                                  paddingLeft: childActive ? "26px" : "28px",
                                  paddingRight: "12px",
                                  fontFamily: MONO_STACK,
                                  fontSize: "11.5px",
                                }}
                              >
                                <span
                                  aria-hidden
                                  className="mt-1.5 mr-1 inline-block h-px w-2 shrink-0"
                                  style={{ background: childActive ? ACCENT : TEXT_MUTED }}
                                />
                                <span className="block min-w-0 flex-1">{child.title}</span>
                              </Link>
                              {childActive && toc.length > 0 ? (
                                <ul
                                  className="my-1 ml-10 space-y-0.5"
                                  style={{ borderLeft: `0.5px solid ${BORDER_STRONG}` }}
                                >
                                  {toc.map((heading, index) => (
                                    <li key={`${heading.anchor}-${index}`}>
                                      <a
                                        href={`#${heading.anchor}`}
                                        className="block py-1 pl-3 text-[12px] leading-snug transition-colors hover:text-white"
                                        style={{ color: TEXT_MUTED, fontFamily: MONO_STACK }}
                                      >
                                        {heading.number ? (
                                          <span style={{ marginRight: "6px", color: TEXT_MUTED }}>
                                            {heading.number}
                                          </span>
                                        ) : null}
                                        <span>{heading.title}</span>
                                      </a>
                                    </li>
                                  ))}
                                </ul>
                              ) : null}
                            </div>
                          );
                        })}
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </nav>

            <div
              className="mt-6 pt-4 text-[10px] uppercase tracking-[0.08em]"
              style={{
                fontFamily: MONO_STACK,
                color: "#4B5563",
                borderTop: `0.5px solid ${BORDER}`,
              }}
            >
              EN · TR · ES · RU · TH · ZH
            </div>
          </div>
        </aside>

        {/* Mobile drawer */}
        {drawerOpen ? (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div
              className="absolute inset-0"
              style={{ background: "rgba(0,0,0,0.6)" }}
              onClick={() => setDrawerOpen(false)}
              aria-hidden
            />
            <div
              className="relative h-full w-[88vw] max-w-[340px] overflow-y-auto p-5"
              style={{ background: BG_ELEVATED, borderRight: `0.5px solid ${BORDER_STRONG}` }}
            >
              <div className="mb-5 flex items-center justify-between">
                <div
                  className="text-[10px] font-medium uppercase tracking-[0.12em]"
                  style={{ color: TEXT_MUTED, fontFamily: MONO_STACK }}
                >
                  {ui.documentation}
                </div>
                <button
                  type="button"
                  onClick={() => setDrawerOpen(false)}
                  className="inline-flex h-8 w-8 items-center justify-center transition-colors"
                  style={{
                    border: `0.5px solid ${BORDER_STRONG}`,
                    background: BG_SURFACE,
                    color: TEXT_SECONDARY,
                    borderRadius: "4px",
                  }}
                  aria-label={ui.closeMenu}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <nav className="space-y-0.5">
                {sections.map((section) => {
                  const parent = section.parent;
                  const sectionActive = isSectionActive(section, currentPath);
                  const isOpen = expanded[parent.href] ?? sectionActive;
                  const parentOnPage = parent.href === currentPath;
                  const match = /^(\d{2})\s+(.+)$/.exec(parent.title);
                  const sectionNum = match ? match[1] : null;
                  const sectionTitle = match ? match[2] : parent.title;
                  const hasChildren = section.children.length > 0;
                  return (
                    <div key={parent.href}>
                      <div
                        className="flex items-stretch"
                        style={{
                          background: parentOnPage ? ACCENT_BG : "transparent",
                          borderRadius: "6px",
                        }}
                      >
                        <Link
                          href={parent.href}
                          onClick={() => setDrawerOpen(false)}
                          className="flex min-w-0 flex-1 items-start gap-3 py-2 leading-snug transition-colors"
                          style={{
                            color: parentOnPage || sectionActive ? TEXT_PRIMARY : TEXT_SECONDARY,
                            fontFamily: MONO_STACK,
                            paddingLeft: "10px",
                            paddingRight: hasChildren ? "4px" : "10px",
                            fontSize: "13px",
                          }}
                        >
                          <span
                            className="mt-0.5 inline-flex h-4 w-6 shrink-0 items-center justify-start text-[10px] font-medium tabular-nums"
                            style={{ color: parentOnPage || sectionActive ? ACCENT : TEXT_MUTED }}
                          >
                            {sectionNum ?? "—"}
                          </span>
                          <span className="block min-w-0 flex-1">{sectionTitle}</span>
                        </Link>
                        {hasChildren ? (
                          <button
                            type="button"
                            onClick={() => toggleSection(parent.href)}
                            className="flex shrink-0 items-center justify-center px-3 transition-colors"
                            style={{ color: TEXT_MUTED }}
                            aria-label={isOpen ? ui.closeMenu : ui.openMenu}
                            aria-expanded={isOpen}
                          >
                            {isOpen ? (
                              <ChevronDown className="h-3.5 w-3.5" />
                            ) : (
                              <ChevronRight className="h-3.5 w-3.5" />
                            )}
                          </button>
                        ) : null}
                      </div>
                      {isOpen && hasChildren ? (
                        <div className="mt-0.5 space-y-0.5 pb-1">
                          {section.children.map((child) => {
                            const childActive = child.href === currentPath;
                            return (
                              <Link
                                key={child.href}
                                href={child.href}
                                onClick={() => setDrawerOpen(false)}
                                className="flex items-start gap-2 py-1.5 leading-snug transition-colors"
                                style={{
                                  background: childActive ? ACCENT_BG : "transparent",
                                  color: childActive ? TEXT_PRIMARY : TEXT_SECONDARY,
                                  borderRadius: "6px",
                                  fontFamily: MONO_STACK,
                                  paddingLeft: "32px",
                                  paddingRight: "10px",
                                  fontSize: "12px",
                                }}
                              >
                                <span
                                  aria-hidden
                                  className="mt-1.5 mr-1 inline-block h-px w-2 shrink-0"
                                  style={{ background: childActive ? ACCENT : TEXT_MUTED }}
                                />
                                <span className="block min-w-0 flex-1">{child.title}</span>
                              </Link>
                            );
                          })}
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </nav>
            </div>
          </div>
        ) : null}

        {/* Main content */}
        <main className="min-w-0 flex-1 px-4 py-8 md:px-8 md:py-10 lg:px-10">
          <div className="mx-auto max-w-[760px]">
            <article className="px-1 py-2 md:px-2 md:py-4">{children}</article>

            {/* Prev / Next */}
            <div
              className="mt-10 grid gap-3 pt-6 md:grid-cols-2"
              style={{ borderTop: `0.5px solid ${BORDER}` }}
            >
              {previous ? (
                <Link
                  href={previous.href}
                  className="group flex flex-col px-4 py-3 transition-colors"
                  style={{
                    border: `0.5px solid ${BORDER_STRONG}`,
                    background: BG_SURFACE,
                    borderRadius: "6px",
                  }}
                >
                  <div
                    className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-[0.08em]"
                    style={{ fontFamily: MONO_STACK, color: TEXT_MUTED }}
                  >
                    <ChevronLeft className="h-3 w-3" />
                    {ui.previous}
                  </div>
                  <div
                    className="mt-1.5 text-[13.5px] font-medium leading-snug"
                    style={{ color: TEXT_PRIMARY }}
                  >
                    {previous.title}
                  </div>
                </Link>
              ) : (
                <div />
              )}

              {next ? (
                <Link
                  href={next.href}
                  className="group flex flex-col px-4 py-3 text-right transition-colors"
                  style={{
                    border: `0.5px solid ${BORDER_STRONG}`,
                    background: BG_SURFACE,
                    borderRadius: "6px",
                  }}
                >
                  <div
                    className="flex items-center justify-end gap-1.5 text-[10px] font-medium uppercase tracking-[0.08em]"
                    style={{ fontFamily: MONO_STACK, color: ACCENT }}
                  >
                    {ui.next}
                    <ChevronRight className="h-3 w-3" />
                  </div>
                  <div
                    className="mt-1.5 text-[13.5px] font-medium leading-snug"
                    style={{ color: TEXT_PRIMARY }}
                  >
                    {next.title}
                  </div>
                </Link>
              ) : null}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
