'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import enMessages from '../../messages/en.json';
import trMessages from '../../messages/tr.json';
import ruMessages from '../../messages/ru.json';
import thMessages from '../../messages/th.json';
import esMessages from '../../messages/es.json';
import zhMessages from '../../messages/zh.json';

export type AppLocale = 'en' | 'tr' | 'ru' | 'th' | 'es' | 'zh';

interface AppI18nContextType {
  locale: AppLocale;
  setLocale: (locale: AppLocale) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}

const AppI18nContext = createContext<AppI18nContextType | undefined>(undefined);

export function useAppLocale() {
  const context = useContext(AppI18nContext);
  if (!context) {
    // Fallback - return English translations if context not available
    return {
      locale: 'en' as AppLocale,
      setLocale: () => {},
      t: (key: string) => humanizeKey(key),
    };
  }
  return context;
}

interface AppI18nProviderProps {
  children: ReactNode;
  initialLocale?: AppLocale;
}

const VALID_LOCALES: readonly AppLocale[] = ['en', 'tr', 'ru', 'th', 'es', 'zh'] as const;

// Merge top-level keys with the nested "app" namespace so both are reachable via t().
// Keys defined inside "app" take priority; top-level keys are the fallback.
function mergeMessages(root: Record<string, unknown>): Record<string, unknown> {
  const appNs = (root.app as Record<string, unknown>) ?? {};
  return { ...root, ...appNs };
}

// Static imports of app namespaces from messages/*.json
const appMessages: Record<AppLocale, Record<string, unknown>> = {
  en: mergeMessages(enMessages as Record<string, unknown>),
  tr: mergeMessages(trMessages as Record<string, unknown>),
  ru: mergeMessages(ruMessages as Record<string, unknown>),
  th: mergeMessages(thMessages as Record<string, unknown>),
  es: mergeMessages(esMessages as Record<string, unknown>),
  zh: mergeMessages(zhMessages as Record<string, unknown>),
};

function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  const parts = path.split('.');
  let value: unknown = obj;
  for (const part of parts) {
    if (value && typeof value === 'object' && part in value) {
      value = (value as Record<string, unknown>)[part];
    } else {
      return undefined;
    }
  }
  // _ fallback: if result is an object with _ key, return _
  if (value && typeof value === 'object' && value !== null && '_' in value) {
    return (value as Record<string, unknown>)['_'];
  }
  return value;
}

/**
 * Last-resort human fallback for a missing translation key. Takes the final
 * path segment and turns camelCase / snake_case into spaced, sentence-case text
 * so the UI never shows a raw dotted key like "correctionModal.awaitingApproval".
 */
function humanizeKey(key: string): string {
  const last = key.split('.').pop() ?? key;
  const spaced = last
    .replace(/[_-]+/g, ' ')
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .trim()
    .toLowerCase();
  if (!spaced) return '';
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

function readCookieLocale(): AppLocale {
  if (typeof document === 'undefined') return 'en';
  const cookieLocale = document.cookie
    .split('; ')
    .find(row => row.startsWith('app_locale='))
    ?.split('=')[1];
  if (cookieLocale && (VALID_LOCALES as readonly string[]).includes(cookieLocale)) {
    return cookieLocale as AppLocale;
  }
  return 'en';
}

export function AppI18nProvider({ children, initialLocale = "en" }: AppI18nProviderProps) {
  const [locale, setLocaleState] = useState<AppLocale>(initialLocale);
  useEffect(() => {
    const cookieLocale = readCookieLocale();
    if (cookieLocale !== initialLocale) {
      setLocaleState(cookieLocale);
    }
  }, [initialLocale]);

  const setLocale = (newLocale: AppLocale) => {
    setLocaleState(newLocale);
    // App UI locale only — companion language is managed separately.
    if (typeof window !== 'undefined') {
      document.cookie = `app_locale=${newLocale}; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Lax`;
    }
  };

  const t = (key: string, params?: Record<string, string | number>): string => {
    let translation: string | undefined;

    // Try current locale first
    const currentMessages = appMessages[locale];
    if (currentMessages) {
      const val = getNestedValue(currentMessages, key);
      if (typeof val === 'string') translation = val;
    }

    // Fallback to English
    if (translation === undefined) {
      const enVal = getNestedValue(appMessages.en, key);
      if (typeof enVal === 'string') translation = enVal;
    }

    // Final fallback: NEVER surface the raw dotted key (code leaking) to the user.
    // Humanise the last segment instead (e.g. "correctionModal.awaitingApproval"
    // → "Awaiting approval"). A missing translation degrades to readable language,
    // never to a code-looking string. See decision 2026-06-05-no-raw-i18n-keys-in-ui.
    if (translation === undefined) {
      if (process.env.NODE_ENV !== 'production') {
        console.warn(`[i18n] missing key for locale "${locale}": ${key}`);
      }
      translation = humanizeKey(key);
    }

    // Replace parameters
    if (params) {
      Object.entries(params).forEach(([paramKey, paramValue]) => {
        translation = translation!.replace(`{${paramKey}}`, String(paramValue));
      });
    }

    return translation;
  };

  return (
    <AppI18nContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </AppI18nContext.Provider>
  );
}

/** Map known API error messages (EN) to translation keys so locale-aware messages are shown */
const API_ERROR_KEY_MAP: Record<string, string> = {
  'No file provided': 'errors.api.noFile',
  'Screenshot detected - please upload a photo of a real receipt, not a screenshot': 'errors.api.screenshotDetected',
  'File must be an image or PDF': 'errors.api.fileMustBeImageOrPdf',
  'File size exceeds 4.5 MB limit': 'errors.api.fileSizeExceeded',
  'Invalid file data': 'errors.api.invalidFileData',
  'Lütfen fişi bir zemin üzerinde çekin. Fotoğrafın üst ve altından, sağ ve solundan biraz boşluk bırakın.': 'errors.api.marginGeneral',
  'Lütfen fişi bir zemin üzerinde çekin. Fotoğrafın üst ve altından, ayrıca sağ ve solundan biraz boşluk bırakın.': 'errors.api.marginGeneral',
  'Fotoğrafın üst ve altından biraz boşluk bırakın.': 'errors.api.marginVertical',
  'Fotoğrafın sağ ve solundan biraz boşluk bırakın.': 'errors.api.marginHorizontal',
  'Too many photos with insufficient margins today. Please follow photo guidelines.': 'errors.api.marginTooMany',
  'Failed to upload receipt': 'errors.api.uploadFailed',
  'Unauthorized': 'errors.api.unauthorized',
  'Username and password are required': 'errors.api.usernamePasswordRequired',
  'Invalid username or password': 'errors.login.invalidCredentials',
  'Internal server error': 'errors.api.internalServerError',
  'COUNTRY_REQUIRED': 'errors.api.selectCountryFirst',
  'Please select your country first': 'errors.api.selectCountryFirst',
  'You already uploaded this receipt': 'errors.api.duplicateSameUser',
  'This looks like a duplicate receipt (similar image detected)': 'errors.api.duplicateVisual',
  'This receipt was uploaded by another user': 'errors.api.duplicateOtherUser',
  'Failed to analyze receipt': 'errors.api.analyzeFailed',
  'The service is busy right now. Please try again in a minute or two.': 'errors.api.serviceBusy',
  'Receipt not found': 'errors.api.receiptNotFound',
  'Failed to fetch receipts': 'receipts.error.load',
  'Failed to save receipt': 'receipts.error.delete',
  'receiptId is required': 'errors.api.receiptNotFound',
  'Failed to delete receipt': 'errors.receiptDetail.deleteFailed',
  "This document doesn't appear to be a valid receipt.": 'errors.api.notValidReceipt',
  'Receipt country does not match your account country': 'errors.api.receiptCountryMismatch',
  'Total amount could not be reliably extracted': 'errors.api.totalNotReliable',
  'Merchant name could not be read from the receipt. Please try again.': 'errors.api.merchantNotReadable',
  'All fields are required': 'errors.api.allFieldsRequired',
  'Invalid email address': 'errors.api.invalidEmail',
  'Invalid birth date': 'errors.api.invalidBirthDate',
  'Birth date cannot be in the future': 'errors.api.futureBirthDate',
  'Username must be 3-32 characters and use only letters, numbers, dot, dash, or underscore': 'errors.api.usernameInvalid',
  'Password must be at least 8 characters': 'errors.api.passwordTooShort',
  'Password must be at least 8 characters and include uppercase, lowercase, a number, and a special character.': 'errors.api.passwordRequirements',
  'An account with this email or username already exists.': 'errors.api.accountAlreadyExists',
  'Too many registration attempts. Please try again later.': 'errors.api.tooManyRegistrationAttempts',
  'Too many requests': 'errors.api.tooManyRequests',
  'Invalid request origin': 'errors.api.invalidRequestOrigin',
  'Yumo Yumo is available only to users 18 or older': 'errors.api.ageRestriction',
  'Failed to register account': 'errors.api.registrationFailed',
  'Email already exists': 'errors.api.emailAlreadyExists',
  'Username already exists': 'errors.api.usernameAlreadyExists',
  'Captcha token is required': 'errors.api.captchaRequired',
  'Captcha verification failed': 'errors.api.captchaFailed',
  'Captcha service is not configured': 'errors.api.captchaNotConfigured',
  'Email is already verified': 'errors.api.emailAlreadyVerified',
  'No email is attached to this account': 'errors.api.noEmailOnAccount',
  'Failed to resend verification email': 'errors.api.resendVerificationFailed',
  'User not found': 'errors.api.userNotFound',
  'Email or username is required': 'errors.api.identifierRequired',
  'Failed to send password reset email': 'errors.api.resetEmailFailed',
  'Token and password are required': 'errors.api.resetTokenPasswordRequired',
  'Password reset link is invalid': 'errors.api.resetInvalid',
  'Password reset link has expired': 'errors.api.resetExpired',
  'Password reset link has already been used': 'errors.api.resetConsumed',
  'Failed to reset password': 'errors.api.resetFailed',
  'Terms and privacy acceptance is required': 'errors.api.legalAcceptanceRequired',
  'Log listesi alınamadı': 'errors.admin.logsLoadFailed',
  'Dosyalar alınamadı': 'errors.admin.filesLoadFailed',
  // Fraud rejection reasons (TR + EN variants)
  'Arka plan yok': 'errors.rejection.noBackground',
  'Arka plan tespit edilmedi - fiş fotoğrafı etrafında boşluk olmalı. Lütfen fişi koyu bir yüzeye yerleştirip kenarlardan boşluk bırakarak çekin.': 'errors.rejection.noBackground',
  'No background detected - receipt fills frame (screenshot-like)': 'errors.rejection.noBackground',
};

/** When unknownFallback is true, unknown API messages are shown as locale-aware generic error instead of raw English. */
export function translateApiError(
  message: string | undefined | null,
  t: (key: string) => string,
  unknownFallback?: boolean
): string {
  if (!message || typeof message !== 'string') return t('errors.api.unknown');
  const trimmed = message.trim();
  const key = API_ERROR_KEY_MAP[trimmed];
  if (key) return t(key);
  // Combined messages (e.g. from upload page: error + "\n\nPlease check...") — translate known phrases
  if (trimmed.includes('Total amount could not be reliably extracted')) return t('errors.api.totalNotReliable');
  if (trimmed.includes('Merchant name could not be read from the receipt')) {
    return t('errors.api.merchantNotReadable');
  }
  if (trimmed.startsWith('Please wait ') && trimmed.includes('before requesting another email')) {
    return t('errors.api.verificationCooldown');
  }
  return unknownFallback ? t('errors.api.unknown') : message;
}
