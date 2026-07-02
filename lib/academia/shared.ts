import type { Locale } from "@/lib/i18n/types";

export type AcademiaLocale = Locale;

export type AcademiaTocItem = {
  /** Heading text without the leading number (e.g. "The model family"). */
  title: string;
  /** Heading number as printed, e.g. "1.2". null for non-numbered H2. */
  number: string | null;
  /** GitHub-style slug for the anchor. */
  anchor: string;
};

export type AcademiaNavItem = {
  title: string;
  href: string;
  slug: string;
  file: string;
  /** 0 = top-level section, 1 = child under a section, 2 = grandchild. */
  depth: number;
};

// Same locales as the other papers. Content for missing locales falls back to EN.
export const academiaLocales: AcademiaLocale[] = ["tr", "en", "es", "ru", "th", "zh"];

export const academiaLocaleLabels: Record<AcademiaLocale, string> = {
  tr: "Türkçe",
  en: "English",
  es: "Español",
  ru: "Русский",
  th: "ไทย",
  zh: "简体中文",
};

export type AcademiaUiStrings = {
  documentation: string;
  paperTitle: string;
  visionPaperLink: string;
  previous: string;
  next: string;
  openMenu: string;
  closeMenu: string;
  language: string;
  draftBadge: string;
};

export const academiaUiStrings: Record<AcademiaLocale, AcademiaUiStrings> = {
  tr: {
    documentation: "Metodoloji",
    paperTitle: "Academia",
    visionPaperLink: "Vision Paper'a dön",
    previous: "Önceki",
    next: "Sonraki",
    openMenu: "Menüyü aç",
    closeMenu: "Menüyü kapat",
    language: "Dil",
    draftBadge: "v0.1",
  },
  en: {
    documentation: "Methodology",
    paperTitle: "Academia",
    visionPaperLink: "Back to Vision Paper",
    previous: "Previous",
    next: "Next",
    openMenu: "Open menu",
    closeMenu: "Close menu",
    language: "Language",
    draftBadge: "v0.1",
  },
  es: {
    documentation: "Metodología",
    paperTitle: "Academia",
    visionPaperLink: "Volver al Vision Paper",
    previous: "Anterior",
    next: "Siguiente",
    openMenu: "Abrir menú",
    closeMenu: "Cerrar menú",
    language: "Idioma",
    draftBadge: "v0.1",
  },
  ru: {
    documentation: "Методология",
    paperTitle: "Academia",
    visionPaperLink: "Назад к Vision Paper",
    previous: "Предыдущий",
    next: "Следующий",
    openMenu: "Открыть меню",
    closeMenu: "Закрыть меню",
    language: "Язык",
    draftBadge: "v0.1",
  },
  th: {
    documentation: "ระเบียบวิธี",
    paperTitle: "Academia",
    visionPaperLink: "กลับไปที่ Vision Paper",
    previous: "ก่อนหน้า",
    next: "ถัดไป",
    openMenu: "เปิดเมนู",
    closeMenu: "ปิดเมนู",
    language: "ภาษา",
    draftBadge: "v0.1",
  },
  zh: {
    documentation: "方法论",
    paperTitle: "Academia",
    visionPaperLink: "返回 Vision Paper",
    previous: "上一节",
    next: "下一节",
    openMenu: "打开菜单",
    closeMenu: "关闭菜单",
    language: "语言",
    draftBadge: "v0.1",
  },
};
