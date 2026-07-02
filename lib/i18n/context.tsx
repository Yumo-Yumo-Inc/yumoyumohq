'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import type { Locale } from './types';
import { getMessages, type Messages } from './translations';
import { defaultLocale, isValidLocale } from './config';

interface I18nContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  messages: Messages;
  isLoading: boolean;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export function useLocale() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useLocale must be used within I18nProvider');
  }
  return context;
}

interface I18nProviderProps {
  children: ReactNode;
  initialLocale?: string;
}

export function I18nProvider({ children, initialLocale }: I18nProviderProps) {
  const [locale, setLocaleState] = useState<Locale>(() => {
    // When the route provides a locale (e.g. /vision/[lang]), trust it
    // for the initial render. Otherwise fall back to defaultLocale during SSR
    // to keep hydration stable; the useEffect below will pick up cookie/IP.
    if (initialLocale && isValidLocale(initialLocale)) {
      return initialLocale;
    }
    return defaultLocale;
  });

  const [messages, setMessages] = useState<Messages>(() => {
    // Initialize with English, will load proper locale in useEffect
    // Use dynamic import to avoid SSR issues
    try {
      return require('../../messages/en.json');
    } catch {
      // Fallback empty object if file doesn't exist yet
      return {} as Messages;
    }
  });

  const [isLoading, setIsLoading] = useState(true);

  // Load locale from URL prop, cookie, browser language, or IP on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Priority 1: URL-provided locale (e.g. /vision/[lang]).
    // URL is the user's most explicit signal: they're literally reading this
    // language right now. It overrides any stale cookie.
    if (initialLocale && isValidLocale(initialLocale)) {
      if (initialLocale !== locale) {
        setLocaleState(initialLocale);
      }
      return;
    }

    // Priority 2: Check cookie (user's previously saved choice)
    const cookieLocale = document.cookie
      .split('; ')
      .find(row => row.startsWith('locale='))
      ?.split('=')[1];

    if (cookieLocale && isValidLocale(cookieLocale)) {
      if (cookieLocale !== locale) {
        setLocaleState(cookieLocale);
      }
      return; // Cookie exists and is valid, use it
    }
    
    // Priority 3: Detect from IP and browser language
    // Only detect if no cookie exists (first visit) - run once
    let isDetecting = false;
    
    const detectAndSetLocale = async () => {
      // Prevent multiple simultaneous detection calls
      if (isDetecting) return;
      isDetecting = true;
      
      try {
        const { detectLocaleFromIP } = await import('./config');
        
        // Try IP detection (includes browser language fallback)
        const detectedLocale = await detectLocaleFromIP();
        
        // Only reload if we detected a different locale and it's not the default
        if (detectedLocale !== locale && detectedLocale !== defaultLocale) {
          // Save detected locale to cookie for future visits
          document.cookie = `locale=${detectedLocale}; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Lax`;
          // Reload to apply new locale (only once)
          setTimeout(() => window.location.reload(), 100);
        }
      } catch (error) {
        console.warn('Locale detection failed:', error);
      } finally {
        isDetecting = false;
      }
    };
    
    detectAndSetLocale();
  }, []); // Run only once on mount

  useEffect(() => {
    async function loadMessages() {
      setIsLoading(true);
      try {
        const loadedMessages = await getMessages(locale);
        setMessages(loadedMessages);
      } catch (error) {
        console.error('Failed to load messages:', error);
      } finally {
        setIsLoading(false);
      }
    }

    loadMessages();
  }, [locale]);

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale);
    // Save to cookie
    if (typeof window !== 'undefined') {
      document.cookie = `locale=${newLocale}; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Lax`;
      // Reload page to apply new locale
      window.location.reload();
    }
  };

  return (
    <I18nContext.Provider value={{ locale, setLocale, messages, isLoading }}>
      {children}
    </I18nContext.Provider>
  );
}



































