"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Check, FileText, Globe, Menu, Sparkles, X } from "lucide-react";
import type { WhitepaperLocale, WhitepaperNavItem } from "@/lib/whitepaper/shared";
import { whitepaperLocaleLabels, whitepaperUiStrings } from "@/lib/whitepaper/shared";

type LanguageLink = {
  code: WhitepaperLocale;
  label: string;
  href: string;
};

type DocsShellProps = {
  locale: WhitepaperLocale;
  rootHref: string;
  currentPath: string;
  currentSectionAnchor: string;
  navigation: WhitepaperNavItem[];
  languageLinks: LanguageLink[];
  children: React.ReactNode;
};

function WhitepaperLanguageControl({
  locale,
  languageLinks,
  open,
  onOpenChange,
  menuFrom,
  triggerClassName,
}: {
  locale: WhitepaperLocale;
  languageLinks: LanguageLink[];
  open: boolean;
  onOpenChange: (next: boolean) => void;
  menuFrom: "left" | "right";
  triggerClassName: string;
}) {
  const menuAlign =
    menuFrom === "right" ? "right-0 top-[calc(100%+8px)]" : "left-0 top-[calc(100%+8px)]";

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => onOpenChange(!open)}
        className={triggerClassName}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <Globe className="h-4 w-4 shrink-0 text-[#C9A84C]" />
        <span className="text-xs font-bold uppercase tracking-[0.18em]">{locale}</span>
        <span className="hidden text-xs text-gray-400 sm:inline">
          {whitepaperLocaleLabels[locale]}
        </span>
      </button>

      {open ? (
        <>
          <div className="fixed inset-0 z-30" onClick={() => onOpenChange(false)} aria-hidden />
          <div
            role="listbox"
            className={`absolute ${menuAlign} z-40 w-56 overflow-hidden rounded-xl border border-white/10 bg-[#0f0f0f] shadow-[0_20px_60px_rgba(0,0,0,0.5)]`}
          >
            {languageLinks.map((item) => {
              const active = item.code === locale;
              return (
                <Link
                  key={item.code}
                  href={item.href}
                  onClick={() => onOpenChange(false)}
                  className={`flex items-center justify-between gap-3 px-4 py-2.5 text-sm transition-colors ${
                    active
                      ? "bg-white/[0.06] text-white"
                      : "text-gray-300 hover:bg-white/[0.04] hover:text-white"
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    <span className="inline-flex w-7 text-[10px] font-bold uppercase tracking-[0.16em] text-[#C9A84C]">
                      {item.code}
                    </span>
                    <span>{item.label}</span>
                  </span>
                  {active ? <Check className="h-4 w-4 text-[#C9A84C]" /> : null}
                </Link>
              );
            })}
          </div>
        </>
      ) : null}
    </div>
  );
}

export function DocsShell({
  locale,
  rootHref,
  currentSectionAnchor,
  navigation,
  languageLinks,
  children,
}: DocsShellProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [activeAnchor, setActiveAnchor] = useState(() => {
    if (typeof window !== "undefined") {
      return window.location.hash.replace(/^#/, "") || currentSectionAnchor;
    }
    return currentSectionAnchor;
  });
  const ui = whitepaperUiStrings[locale];

  const chapterNames = useMemo(
    () =>
      ({
        tr: "Bölüm",
        en: "Chapter",
        es: "Capítulo",
        ru: "Глава",
        th: "บท",
        zh: "章节",
      })[locale],
    [locale]
  );

  const heroCopy = useMemo(
    () =>
      ({
        tr: {
          eyebrow: "One Page Vision",
          title: "Yumo Yumo Vision Paper",
          body:
            "Bu yüzey artık bir doküman dizini değil; ürün vizyonunu, ekonomik omurgayı ve kullanıcı anlamını tek bir sinematik akışta taşıyan bir manifesto.",
          points: ["Tek akış", "Daha ferah ritim", "Görsel anlatı"],
        },
        en: {
          eyebrow: "One Page Vision",
          title: "Yumo Yumo Vision Paper",
          body:
            "This is no longer a document index. It is a single manifesto surface for product vision, economic design, and user meaning.",
          points: ["Single flow", "Airier rhythm", "Visual storytelling"],
        },
        es: {
          eyebrow: "Visión en una sola página",
          title: "Yumo Yumo Vision Paper",
          body:
            "Esto ya no funciona como un índice documental, sino como una superficie-manifiesto para la visión del producto, el diseño económico y el sentido para el usuario.",
          points: ["Un solo flujo", "Ritmo más aireado", "Narrativa visual"],
        },
        ru: {
          eyebrow: "Vision на одной странице",
          title: "Yumo Yumo Vision Paper",
          body:
            "Это больше не индекс документов, а единая манифестная поверхность для продуктового видения, экономического дизайна и пользовательского смысла.",
          points: ["Единый поток", "Больше воздуха", "Визуальный нарратив"],
        },
        th: {
          eyebrow: "วิสัยทัศน์แบบหน้าเดียว",
          title: "Yumo Yumo Vision Paper",
          body:
            "สิ่งนี้ไม่ใช่ดัชนีเอกสารอีกต่อไป แต่เป็นพื้นผิวแบบ manifesto เดียวที่พาวิสัยทัศน์ของผลิตภัณฑ์ โครงสร้างเศรษฐกิจ และความหมายต่อผู้ใช้ไปพร้อมกัน",
          points: ["การไหลเดียว", "จังหวะที่โปร่งขึ้น", "การเล่าเรื่องด้วยภาพ"],
        },
        zh: {
          eyebrow: "单页愿景",
          title: "Yumo Yumo Vision Paper",
          body:
            "它不再是一个文档目录，而是一张单一的 manifesto 画布，用来承载产品愿景、经济设计与用户意义。",
          points: ["单一流线", "更松弛的节奏", "视觉叙事"],
        },
      })[locale],
    [locale]
  );

  const currentItem =
    navigation.find((item) => item.anchor === activeAnchor) ?? navigation[0];
  const currentIndex = navigation.findIndex((item) => item.anchor === currentItem.anchor);
  const sectionNo = String((currentIndex >= 0 ? currentIndex : 0) + 1).padStart(2, "0");

  useEffect(() => {
    if (typeof window === "undefined") return;

    if (currentSectionAnchor && currentSectionAnchor !== "opening") {
      const el = document.getElementById(currentSectionAnchor);
      if (el) {
        requestAnimationFrame(() => {
          el.scrollIntoView({ block: "start", behavior: "auto" });
          window.history.replaceState(null, "", `${rootHref}#${currentSectionAnchor}`);
          setActiveAnchor(currentSectionAnchor);
        });
      }
    }
  }, [currentSectionAnchor, rootHref]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const onHashChange = () => {
      const hash = window.location.hash.replace(/^#/, "");
      if (hash) setActiveAnchor(hash);
    };

    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const sections = Array.from(
      document.querySelectorAll<HTMLElement>("[data-whitepaper-anchor]")
    );
    if (!sections.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

        const anchor = visible?.target.getAttribute("data-whitepaper-anchor");
        if (anchor) {
          setActiveAnchor(anchor);
          window.history.replaceState(null, "", `${rootHref}#${anchor}`);
        }
      },
      {
        rootMargin: "-20% 0px -55% 0px",
        threshold: [0.15, 0.35, 0.6],
      }
    );

    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, [rootHref]);

  return (
    <div className="min-h-screen bg-[#070707] text-white">
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_12%,rgba(232,201,122,0.08),transparent_24%),radial-gradient(circle_at_78%_18%,rgba(236,72,153,0.08),transparent_26%),radial-gradient(circle_at_58%_74%,rgba(59,130,246,0.08),transparent_28%)]" />
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px)",
            backgroundSize: "32px 32px",
            maskImage: "radial-gradient(circle at center, black, transparent 84%)",
            WebkitMaskImage: "radial-gradient(circle at center, black, transparent 84%)",
          }}
        />
      </div>

      <header className="sticky top-16 z-40 border-b border-white/10 bg-black/50 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-[1680px] items-center gap-4 px-4 py-3.5 md:px-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-gray-200 transition-colors hover:bg-white/[0.08] lg:hidden"
              aria-label={ui.openMenu}
            >
              <Menu className="h-5 w-5" />
            </button>

            <Link href="/" className="group flex items-center gap-3 transition-opacity hover:opacity-90">
              <div className="yumo-lockup-topbar" style={{ fontSize: "17px" } as React.CSSProperties}>
                <span className="yumo-word yumo-word-gold">YUMO</span>
                <div className="yumo-sep" />
                <span className="yumo-word yumo-word-silver">YUMO</span>
              </div>
              <div className="hidden items-center gap-2 border-l border-white/10 pl-3 sm:flex">
                <FileText className="h-3.5 w-3.5 text-[#C9A84C]" />
                <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-gray-300">
                  {ui.visionPaper}
                </span>
              </div>
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-[1680px]">
        <aside
          className="hidden shrink-0 border-r border-white/[0.06] lg:block"
          style={{ width: 320, flexBasis: 320 }}
        >
          <div className="sticky top-[calc(4rem+65px)] h-[calc(100vh-4rem-65px)] overflow-y-auto px-5 py-7">
            <div className="mb-6">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="text-[10px] font-bold uppercase tracking-[0.28em] text-[#C9A84C]">
                    {heroCopy.eyebrow}
                  </div>
                  <div className="mt-1.5 text-base font-semibold tracking-tight text-white">
                    {whitepaperLocaleLabels[locale]}
                  </div>
                  <div className="mt-3 h-px w-10 bg-gradient-to-r from-[#C9A84C] to-transparent" />
                </div>
                <WhitepaperLanguageControl
                  locale={locale}
                  languageLinks={languageLinks}
                  open={langOpen}
                  onOpenChange={setLangOpen}
                  menuFrom="right"
                  triggerClassName="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.04] px-2.5 py-2 text-sm font-medium text-gray-200 transition-colors hover:bg-white/[0.08]"
                />
              </div>

              <div className="mt-6 rounded-[26px] border border-white/10 bg-[linear-gradient(160deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02))] p-4">
                <div className="flex items-center gap-2 text-[10px] font-[family:var(--font-orbitron)] uppercase tracking-[0.24em] text-[#E8C97A]">
                  <Sparkles className="h-3.5 w-3.5" />
                  {heroCopy.title}
                </div>
                <p className="mt-3 text-sm leading-[1.75] text-white/68">{heroCopy.body}</p>
              </div>
            </div>

            <nav className="space-y-1.5">
              {navigation.map((item, idx) => {
                const active = item.anchor === activeAnchor;
                return (
                  <Link
                    key={item.anchor}
                    href={item.href}
                    className={`group relative flex items-start gap-3 rounded-[20px] px-3.5 py-3 text-[13.5px] leading-snug transition-all ${
                      active
                        ? "bg-white/[0.08] text-white shadow-[0_12px_28px_rgba(0,0,0,0.18)]"
                        : "text-gray-400 hover:bg-white/[0.03] hover:text-gray-100"
                    }`}
                  >
                    {active ? (
                      <span className="absolute left-0 top-1/2 h-6 w-[2px] -translate-y-1/2 rounded-r-full bg-gradient-to-b from-[#E8C97A] to-[#A07830]" />
                    ) : null}
                    <span
                      className={`mt-0.5 inline-flex h-6 min-w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-mono font-bold tabular-nums ${
                        active
                          ? "bg-[#E8C97A]/14 text-[#E8C97A]"
                          : "bg-white/[0.04] text-gray-500 group-hover:text-gray-300"
                      }`}
                    >
                      {String(idx + 1).padStart(2, "0")}
                    </span>
                    <span className="block min-w-0 flex-1">{item.title}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
        </aside>

        {drawerOpen ? (
          <div
            className="fixed inset-0 z-[90] bg-black/70 backdrop-blur-sm lg:hidden"
            onClick={() => setDrawerOpen(false)}
          >
            <div
              className="relative z-[100] h-full w-[88vw] max-w-[360px] overflow-y-auto border-r border-white/10 bg-[#0a0a0a] px-5 py-6 shadow-2xl"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="mb-6 flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1 pr-1">
                  <div className="text-[10px] font-bold uppercase tracking-[0.28em] text-[#C9A84C]">
                    {heroCopy.eyebrow}
                  </div>
                  <div className="mt-1 text-base font-semibold text-white">
                    {whitepaperLocaleLabels[locale]}
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <WhitepaperLanguageControl
                    locale={locale}
                    languageLinks={languageLinks}
                    open={langOpen}
                    onOpenChange={setLangOpen}
                    menuFrom="right"
                    triggerClassName="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.04] px-2.5 py-2 text-sm font-medium text-gray-200 transition-colors hover:bg-white/[0.08]"
                  />
                  <button
                    type="button"
                    onClick={() => setDrawerOpen(false)}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-gray-200"
                    aria-label={ui.closeMenu}
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              <nav className="space-y-1.5">
                {navigation.map((item, idx) => {
                  const active = item.anchor === activeAnchor;
                  return (
                    <Link
                      key={item.anchor}
                      href={item.href}
                      onClick={() => setDrawerOpen(false)}
                      className={`group relative flex items-start gap-3 rounded-[20px] px-3.5 py-3 text-[14px] leading-snug transition-colors ${
                        active
                          ? "bg-white/[0.08] text-white"
                          : "text-gray-300 hover:bg-white/[0.03] hover:text-gray-100"
                      }`}
                    >
                      <span
                        className={`mt-0.5 inline-flex h-6 min-w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-mono font-bold tabular-nums ${
                          active
                            ? "bg-[#E8C97A]/14 text-[#E8C97A]"
                            : "bg-white/[0.04] text-gray-500 group-hover:text-gray-300"
                        }`}
                      >
                        {String(idx + 1).padStart(2, "0")}
                      </span>
                      <span className="block min-w-0 flex-1">{item.title}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>
          </div>
        ) : null}

        <main className="min-w-0 flex-1 px-4 py-8 md:px-8 md:py-10 lg:px-12">
          <div className="mx-auto max-w-[1220px]">
            <section className="relative overflow-hidden rounded-[36px] border border-white/10 bg-[linear-gradient(145deg,rgba(255,255,255,0.05),rgba(255,255,255,0.018))] px-5 py-8 shadow-[0_30px_90px_rgba(0,0,0,0.26)] md:px-9 md:py-10">
              <div
                aria-hidden
                className="absolute inset-0"
                style={{
                  background:
                    "radial-gradient(circle at 14% 18%, rgba(232,201,122,0.16), transparent 24%), radial-gradient(circle at 82% 18%, rgba(236,72,153,0.14), transparent 24%), radial-gradient(circle at 52% 82%, rgba(59,130,246,0.12), transparent 24%)",
                }}
              />

              <div className="relative grid gap-7 lg:grid-cols-[minmax(0,1.25fr)_minmax(280px,0.75fr)] lg:items-end">
                <div className="min-w-0">
                  <div className="inline-flex items-center gap-2 rounded-full border border-[#E8C97A]/18 bg-[#E8C97A]/[0.08] px-3 py-1.5 text-[10px] font-[family:var(--font-orbitron)] uppercase tracking-[0.24em] text-[#F4DDA0]">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#E8C97A]" />
                    {heroCopy.eyebrow}
                  </div>

                  <h1 className="mt-5 max-w-[11ch] text-[42px] font-black leading-[0.9] tracking-[-0.06em] text-white md:text-[78px]">
                    {heroCopy.title}
                  </h1>

                  <p className="mt-6 max-w-[30ch] font-serif text-[22px] leading-[1.38] tracking-[-0.02em] text-white/90 md:text-[30px]">
                    {heroCopy.body}
                  </p>
                </div>

                <div className="grid gap-3">
                  <div className="rounded-[28px] border border-white/10 bg-black/18 p-5 backdrop-blur-sm">
                    <div className="text-[10px] font-[family:var(--font-orbitron)] uppercase tracking-[0.22em] text-[#E8C97A]">
                      {chapterNames} {sectionNo}
                    </div>
                    <div className="mt-3 text-[28px] font-bold leading-[1.02] tracking-[-0.04em] text-white">
                      {currentItem.title}
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    {heroCopy.points.map((point) => (
                      <div
                        key={point}
                        className="rounded-[22px] border border-white/10 bg-white/[0.03] px-3 py-3 text-[12px] font-medium leading-[1.5] text-white/78"
                      >
                        {point}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            <div className="mt-10">{children}</div>
          </div>
        </main>
      </div>
    </div>
  );
}
