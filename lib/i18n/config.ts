import type { Locale } from './types';

export const defaultLocale: Locale = 'en';

export function isValidLocale(locale: string): locale is Locale {
  return ['en', 'ru', 'th', 'tr', 'es', 'zh'].includes(locale);
}

// Country code to locale mapping
export const countryToLocale: Record<string, Locale> = {
  // Russia and CIS
  RU: 'ru',
  BY: 'ru', // Belarus
  KZ: 'ru', // Kazakhstan
  UA: 'ru', // Ukraine
  
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
};

export function getLocaleFromCountry(countryCode: string | null | undefined): Locale {
  if (!countryCode) return defaultLocale;
  const upperCountry = countryCode.toUpperCase();
  return countryToLocale[upperCountry] || defaultLocale;
}

// Browser language to locale mapping
export function getLocaleFromBrowserLanguage(acceptLanguage: string | null | undefined): Locale {
  if (!acceptLanguage) return defaultLocale;
  
  const langCodes = acceptLanguage.toLowerCase().split(',').map(lang => {
    const parts = lang.split(';');
    return parts[0].trim().substring(0, 2);
  });
  
  // Check for exact matches first
  for (const code of langCodes) {
    if (code === 'ru') return 'ru';
    if (code === 'th') return 'th';
    if (code === 'tr') return 'tr';
    if (code === 'es') return 'es';
    if (code === 'zh' || code === 'cn') return 'zh';
  }
  
  return defaultLocale;
}

// Detect locale from IP using free geolocation API
export async function detectLocaleFromIP(): Promise<Locale> {
  try {
    // Using ipapi.co free tier (1000 requests/day)
    const response = await fetch('https://ipapi.co/json/', {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });
    
    if (response.ok) {
      const data = await response.json();
      if (data.country_code) {
        return getLocaleFromCountry(data.country_code);
      }
    }
  } catch (error) {
    console.warn('IP geolocation failed, using browser language:', error);
  }
  
  // Fallback to browser language
  if (typeof navigator !== 'undefined' && navigator.language) {
    return getLocaleFromBrowserLanguage(navigator.language);
  }
  
  return defaultLocale;
}



































