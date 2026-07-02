export type Locale = 'en' | 'ru' | 'th' | 'tr' | 'es' | 'zh';

export const locales: Locale[] = ['en', 'ru', 'th', 'tr', 'es', 'zh'];

export const localeNames: Record<Locale, string> = {
  en: 'English',
  ru: 'Русский',
  th: 'ไทย',
  tr: 'Türkçe',
  es: 'Español',
  zh: '中文',
};

export const localeFlags: Record<Locale, string> = {
  en: 'EN',
  ru: '🇷🇺',
  th: '🇹🇭',
  tr: '🇹🇷',
  es: '🇪🇸',
  zh: '🇨🇳',
};

// Country code to locale mapping for IP-based detection
export const countryToLocale: Record<string, Locale> = {
  // Russia and CIS
  RU: 'ru',
  BY: 'ru', // Belarus
  KZ: 'ru', // Kazakhstan
  UA: 'ru', // Ukraine (can be customized)
  
  // Thailand
  TH: 'th',
  
  // Turkey
  TR: 'tr',
  
  // Spain
  ES: 'es',
  
  // China
  CN: 'zh',
  TW: 'zh', // Taiwan
  HK: 'zh', // Hong Kong
  MO: 'zh', // Macau
  SG: 'zh', // Singapore (can be customized to English)
  
  // Default to English for other countries
};



































