/**
 * Provider-free, localized copy for crash surfaces (ErrorBoundary, error.tsx,
 * global-error.tsx). These render exactly when the React tree / app bundle /
 * i18n provider may be broken, so their strings must NOT depend on the runtime
 * translation context or the large messages/*.json import chain. Locale is read
 * from the same `app_locale` cookie the provider uses; falls back to English.
 *
 * A crash surface never shows a raw `error.message` — that leaks technical /
 * JavaScript text to the user. Only these fixed strings are shown.
 */

export type AppLocale = "en" | "tr" | "ru" | "th" | "es" | "zh";

const VALID_LOCALES: readonly AppLocale[] = ["en", "tr", "ru", "th", "es", "zh"];

export interface CrashCopy {
  /** Generic unexpected error */
  title: string;
  description: string;
  /** Lost network connection */
  networkTitle: string;
  networkDescription: string;
  /** Stale-chunk self-heal (new deploy, reloading) */
  updatingTitle: string;
  updatingDescription: string;
  /** Buttons */
  tryAgain: string;
  reload: string;
}

const COPY: Record<AppLocale, CrashCopy> = {
  en: {
    title: "Something went wrong",
    description: "An unexpected error occurred. Please try again or refresh the page.",
    networkTitle: "No internet connection",
    networkDescription: "Please check your network and try again.",
    updatingTitle: "Updating…",
    updatingDescription: "A new version is loading, the page will refresh shortly.",
    tryAgain: "Try again",
    reload: "Reload page",
  },
  tr: {
    title: "Bir şeyler ters gitti",
    description: "Beklenmeyen bir hata oluştu. Lütfen tekrar deneyin veya sayfayı yenileyin.",
    networkTitle: "İnternet bağlantısı yok",
    networkDescription: "Lütfen ağınızı kontrol edip tekrar deneyin.",
    updatingTitle: "Güncelleniyor…",
    updatingDescription: "Yeni sürüm yükleniyor, sayfa birazdan yenilenecek.",
    tryAgain: "Tekrar dene",
    reload: "Sayfayı yenile",
  },
  ru: {
    title: "Что-то пошло не так",
    description: "Произошла непредвиденная ошибка. Попробуйте снова или обновите страницу.",
    networkTitle: "Нет подключения к интернету",
    networkDescription: "Проверьте соединение и попробуйте снова.",
    updatingTitle: "Обновление…",
    updatingDescription: "Загружается новая версия, страница скоро обновится.",
    tryAgain: "Повторить",
    reload: "Обновить страницу",
  },
  th: {
    title: "เกิดข้อผิดพลาด",
    description: "เกิดข้อผิดพลาดที่ไม่คาดคิด โปรดลองใหม่อีกครั้งหรือรีเฟรชหน้า",
    networkTitle: "ไม่มีการเชื่อมต่ออินเทอร์เน็ต",
    networkDescription: "โปรดตรวจสอบเครือข่ายแล้วลองใหม่อีกครั้ง",
    updatingTitle: "กำลังอัปเดต…",
    updatingDescription: "กำลังโหลดเวอร์ชันใหม่ หน้าจะรีเฟรชในไม่ช้า",
    tryAgain: "ลองอีกครั้ง",
    reload: "โหลดหน้าใหม่",
  },
  es: {
    title: "Algo salió mal",
    description: "Ocurrió un error inesperado. Inténtalo de nuevo o actualiza la página.",
    networkTitle: "Sin conexión a internet",
    networkDescription: "Comprueba tu red e inténtalo de nuevo.",
    updatingTitle: "Actualizando…",
    updatingDescription: "Se está cargando una nueva versión, la página se actualizará en breve.",
    tryAgain: "Reintentar",
    reload: "Recargar página",
  },
  zh: {
    title: "出现了一些问题",
    description: "发生了意外错误。请重试或刷新页面。",
    networkTitle: "无网络连接",
    networkDescription: "请检查你的网络后重试。",
    updatingTitle: "正在更新…",
    updatingDescription: "正在加载新版本，页面即将刷新。",
    tryAgain: "重试",
    reload: "刷新页面",
  },
};

/** Reads the app UI locale from the `app_locale` cookie; falls back to English. */
function getStaticLocale(): AppLocale {
  if (typeof document === "undefined") return "en";
  try {
    const cookieLocale = document.cookie
      .split("; ")
      .find((row) => row.startsWith("app_locale="))
      ?.split("=")[1];
    if (cookieLocale && (VALID_LOCALES as readonly string[]).includes(cookieLocale)) {
      return cookieLocale as AppLocale;
    }
  } catch {
    // document.cookie access can throw in rare sandboxed contexts — fall through.
  }
  return "en";
}

/** Localized crash copy for the current (or given) locale. */
export function getCrashCopy(locale?: AppLocale): CrashCopy {
  return COPY[locale ?? getStaticLocale()] ?? COPY.en;
}
