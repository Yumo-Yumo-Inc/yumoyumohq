import type { Locale } from "@/lib/i18n/types";

export type WhitepaperLocale = Locale;

export type WhitepaperNavItem = {
  title: string;
  href: string;
  slug: string;
  file: string;
  anchor: string;
};

export const whitepaperLocales: WhitepaperLocale[] = ["tr", "en", "es", "ru", "th", "zh"];

export const whitepaperLocaleLabels: Record<WhitepaperLocale, string> = {
  tr: "Türkçe",
  en: "English",
  es: "Español",
  ru: "Русский",
  th: "ไทย",
  zh: "简体中文",
};

export type WhitepaperUiStrings = {
  documentation: string;
  whitepaper: string;
  previous: string;
  next: string;
  openMenu: string;
  closeMenu: string;
  language: string;
  visionPaper: string;
  section: string;
  mode: string;
  vision: string;
  localeLabel: string;
  readingSurface: string;
  pageThesis: string;
  whyItMatters: string;
  focus: string;
  narrativeFirst: string;
  signalRichStructure: string;
  designedBreathingRoom: string;
  chapterAtmosphere: string;
};

export const whitepaperUiStrings: Record<WhitepaperLocale, WhitepaperUiStrings> = {
  tr: {
    documentation: "Belgeler",
    whitepaper: "Whitepaper",
    previous: "Önceki",
    next: "Sonraki",
    openMenu: "Menüyü aç",
    closeMenu: "Menüyü kapat",
    language: "Dil",
    visionPaper: "Vision Paper",
    section: "Bölüm",
    mode: "Mod",
    vision: "Vizyon",
    localeLabel: "Dil",
    readingSurface: "Okuma Yüzeyi",
    pageThesis: "Sayfa Tezi",
    whyItMatters: "Neden Önemli",
    focus: "Odak",
    narrativeFirst: "Anlatı öncelikli",
    signalRichStructure: "Sinyal yoğun yapı",
    designedBreathingRoom: "Tasarımlı nefes alanı",
    chapterAtmosphere: "Bölüm Atmosferi",
  },
  en: {
    documentation: "Documentation",
    whitepaper: "Whitepaper",
    previous: "Previous",
    next: "Next",
    openMenu: "Open menu",
    closeMenu: "Close menu",
    language: "Language",
    visionPaper: "Vision Paper",
    section: "Section",
    mode: "Mode",
    vision: "Vision",
    localeLabel: "Locale",
    readingSurface: "Reading Surface",
    pageThesis: "Page Thesis",
    whyItMatters: "Why It Matters",
    focus: "Focus",
    narrativeFirst: "Narrative first",
    signalRichStructure: "Signal-rich structure",
    designedBreathingRoom: "Designed breathing room",
    chapterAtmosphere: "Chapter Atmosphere",
  },
  es: {
    documentation: "Documentación",
    whitepaper: "Whitepaper",
    previous: "Anterior",
    next: "Siguiente",
    openMenu: "Abrir menú",
    closeMenu: "Cerrar menú",
    language: "Idioma",
    visionPaper: "Vision Paper",
    section: "Sección",
    mode: "Modo",
    vision: "Visión",
    localeLabel: "Idioma",
    readingSurface: "Superficie de lectura",
    pageThesis: "Tesis de la página",
    whyItMatters: "Por qué importa",
    focus: "Enfoque",
    narrativeFirst: "Narrativa primero",
    signalRichStructure: "Estructura rica en señales",
    designedBreathingRoom: "Espacio visual diseñado",
    chapterAtmosphere: "Atmósfera del capítulo",
  },
  ru: {
    documentation: "Документация",
    whitepaper: "Whitepaper",
    previous: "Назад",
    next: "Далее",
    openMenu: "Открыть меню",
    closeMenu: "Закрыть меню",
    language: "Язык",
    visionPaper: "Vision Paper",
    section: "Раздел",
    mode: "Режим",
    vision: "Видение",
    localeLabel: "Язык",
    readingSurface: "Поверхность чтения",
    pageThesis: "Тезис страницы",
    whyItMatters: "Почему это важно",
    focus: "Фокус",
    narrativeFirst: "Сначала нарратив",
    signalRichStructure: "Структура, богатая сигналами",
    designedBreathingRoom: "Продуманное визуальное пространство",
    chapterAtmosphere: "Атмосфера главы",
  },
  th: {
    documentation: "เอกสาร",
    whitepaper: "Whitepaper",
    previous: "ก่อนหน้า",
    next: "ถัดไป",
    openMenu: "เปิดเมนู",
    closeMenu: "ปิดเมนู",
    language: "ภาษา",
    visionPaper: "Vision Paper",
    section: "ส่วน",
    mode: "โหมด",
    vision: "วิสัยทัศน์",
    localeLabel: "ภาษา",
    readingSurface: "พื้นที่อ่าน",
    pageThesis: "วิทยานิพนธ์ของหน้า",
    whyItMatters: "ทำไมจึงสำคัญ",
    focus: "โฟกัส",
    narrativeFirst: "เน้นเรื่องเล่าก่อน",
    signalRichStructure: "โครงสร้างที่เต็มไปด้วยสัญญาณ",
    designedBreathingRoom: "จังหวะหายใจที่ถูกออกแบบไว้",
    chapterAtmosphere: "บรรยากาศของบท",
  },
  zh: {
    documentation: "文档",
    whitepaper: "白皮书",
    previous: "上一篇",
    next: "下一篇",
    openMenu: "打开菜单",
    closeMenu: "关闭菜单",
    language: "语言",
    visionPaper: "Vision Paper",
    section: "章节",
    mode: "模式",
    vision: "愿景",
    localeLabel: "语言",
    readingSurface: "阅读界面",
    pageThesis: "页面论点",
    whyItMatters: "为什么重要",
    focus: "焦点",
    narrativeFirst: "叙事优先",
    signalRichStructure: "富含信号的结构",
    designedBreathingRoom: "经过设计的留白",
    chapterAtmosphere: "章节氛围",
  },
};
