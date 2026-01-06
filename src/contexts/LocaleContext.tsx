'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import {
  Locale,
  defaultLocale,
  getTranslation,
  t as translate,
  getStoredLocale,
  setStoredLocale,
  isRTL,
  TranslationDictionary,
} from '@/lib/i18n';

interface LocaleContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (path: string, replacements?: Record<string, string | number>) => string;
  dict: TranslationDictionary;
  isRTL: boolean;
  direction: 'ltr' | 'rtl';
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

interface LocaleProviderProps {
  children: React.ReactNode;
  initialLocale?: Locale;
}

export function LocaleProvider({ children, initialLocale }: LocaleProviderProps) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale || defaultLocale);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize from localStorage on mount
  useEffect(() => {
    const storedLocale = getStoredLocale();
    if (storedLocale && !initialLocale) {
      setLocaleState(storedLocale);
    }
    setIsInitialized(true);
  }, [initialLocale]);

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale);
    setStoredLocale(newLocale);
  }, []);

  const t = useCallback(
    (path: string, replacements?: Record<string, string | number>) => {
      return translate(locale, path, replacements);
    },
    [locale]
  );

  const dict = getTranslation(locale);
  const rtl = isRTL(locale);

  // Prevent hydration mismatch by not rendering until initialized
  if (!isInitialized) {
    return null;
  }

  return (
    <LocaleContext.Provider
      value={{
        locale,
        setLocale,
        t,
        dict,
        isRTL: rtl,
        direction: rtl ? 'rtl' : 'ltr',
      }}
    >
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale(): LocaleContextValue {
  const context = useContext(LocaleContext);
  if (!context) {
    throw new Error('useLocale must be used within a LocaleProvider');
  }
  return context;
}

// Hook for checking user's previous locale from their submissions
export function usePreviousLocale(userIdentifier: string | null): Locale | null {
  const [previousLocale, setPreviousLocale] = useState<Locale | null>(null);

  useEffect(() => {
    if (!userIdentifier) {
      setPreviousLocale(null);
      return;
    }

    // Fetch user's last submission locale
    const fetchUserLocale = async () => {
      try {
        const response = await fetch(
          `/api/admin/users/${encodeURIComponent(userIdentifier)}`
        );
        if (response.ok) {
          const data = await response.json();
          if (data.user?.submissions?.[0]?.locale) {
            const locale = data.user.submissions[0].locale as Locale;
            if (locale === 'en' || locale === 'he') {
              setPreviousLocale(locale);
            }
          }
        }
      } catch {
        // Ignore errors - this is an optional enhancement
      }
    };

    fetchUserLocale();
  }, [userIdentifier]);

  return previousLocale;
}
