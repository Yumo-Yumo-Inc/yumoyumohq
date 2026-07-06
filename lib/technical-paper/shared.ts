import type { Locale } from "@/lib/i18n/types";

export type TechnicalPaperLocale = Locale;

export type TechnicalPaperTocItem = {
  /** Heading text without the leading number (e.g. "Pipeline at a glance"). */
  title: string;
  /** Heading number as printed in the doc, e.g. "2.2". null for non-numbered H2. */
  number: string | null;
  /** GitHub-style slug for the anchor. */
  anchor: string;
};

export type TechnicalPaperNavItem = {
  title: string;
  href: string;
  slug: string;
  file: string;
  /** 0 = top-level section, 1 = child under a section, 2 = grandchild. */
  depth: number;
};

// Same locales as the Vision Paper. Content for missing locales falls back to EN.
export const technicalPaperLocales: TechnicalPaperLocale[] = ["tr", "en", "es", "ru", "th", "zh"];

export const technicalPaperLocaleLabels: Record<TechnicalPaperLocale, string> = {
  tr: "Türkçe",
  en: "English",
  es: "Español",
  ru: "Русский",
  th: "ไทย",
  zh: "简体中文",
};

export type TechnicalPaperUiStrings = {
  documentation: string;
  technicalPaper: string;
  visionPaperLink: string;
  previous: string;
  next: string;
  openMenu: string;
  closeMenu: string;
  language: string;
  draftBadge: string;
};

export const technicalPaperUiStrings: Record<TechnicalPaperLocale, TechnicalPaperUiStrings> = {
  tr: {
    documentation: "Teknik Doküman",
    technicalPaper: "Technical Paper",
    visionPaperLink: "Vision Paper'a dön",
    previous: "Önceki",
    next: "Sonraki",
    openMenu: "Menüyü aç",
    closeMenu: "Menüyü kapat",
    language: "Dil",
    draftBadge: "v0.1",
  },
  en: {
    documentation: "Technical Doc",
    technicalPaper: "Technical Paper",
    visionPaperLink: "Back to Vision Paper",
    previous: "Previous",
    next: "Next",
    openMenu: "Open menu",
    closeMenu: "Close menu",
    language: "Language",
    draftBadge: "v0.1",
  },
  es: {
    documentation: "Doc Técnico",
    technicalPaper: "Technical Paper",
    visionPaperLink: "Volver al Vision Paper",
    previous: "Anterior",
    next: "Siguiente",
    openMenu: "Abrir menú",
    closeMenu: "Cerrar menú",
    language: "Idioma",
    draftBadge: "v0.1",
  },
  ru: {
    documentation: "Техдокумент",
    technicalPaper: "Technical Paper",
    visionPaperLink: "Назад к Vision Paper",
    previous: "Предыдущий",
    next: "Следующий",
    openMenu: "Открыть меню",
    closeMenu: "Закрыть меню",
    language: "Язык",
    draftBadge: "v0.1",
  },
  th: {
    documentation: "เอกสารเทคนิค",
    technicalPaper: "Technical Paper",
    visionPaperLink: "กลับไปที่ Vision Paper",
    previous: "ก่อนหน้า",
    next: "ถัดไป",
    openMenu: "เปิดเมนู",
    closeMenu: "ปิดเมนู",
    language: "ภาษา",
    draftBadge: "v0.1",
  },
  zh: {
    documentation: "技术文档",
    technicalPaper: "Technical Paper",
    visionPaperLink: "返回 Vision Paper",
    previous: "上一节",
    next: "下一节",
    openMenu: "打开菜单",
    closeMenu: "关闭菜单",
    language: "语言",
    draftBadge: "v0.1",
  },
};
