'use client';

import { useMemo } from 'react';
import { useLocale } from './context';
import { getMessages, getNestedTranslation } from './translations';
import type { Messages } from './translations';

// Hook to use translations
export function useTranslations(namespace?: string) {
  const { locale, messages } = useLocale();

  return useMemo(() => {
    const t = (key: string, params?: Record<string, string | number>): any => {
      const fullKey = namespace ? `${namespace}.${key}` : key;
      // Allow fallback to English if current locale is not English
      const allowFallback = locale !== 'en';
      let translation = getNestedTranslation(messages, fullKey, allowFallback);
      
      // If translation is a string, replace parameters
      if (typeof translation === 'string' && params) {
        Object.entries(params).forEach(([paramKey, paramValue]) => {
          translation = translation.replace(`{${paramKey}}`, String(paramValue));
        });
      }
      
      return translation;
    };

    return { t, locale, messages };
  }, [locale, messages, namespace]);
}



































