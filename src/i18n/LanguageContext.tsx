import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { SUPPORTED_LANGUAGES, DEFAULT_LANGUAGE, LanguageInfo } from './languages';
import { en, TranslationSchema } from './translations/en';
import { hi } from './translations/hi';
import { sat } from './translations/sat';
import { nag } from './translations/nag';
import { kh } from './translations/kh';
import { kur } from './translations/kur';
import { unr } from './translations/unr';
import { hoc } from './translations/hoc';

const DICTIONARIES: Record<string, any> = {
  en,
  hi,
  sat,
  nag,
  kh,
  kur,
  unr,
  hoc
};

const STORAGE_KEY = 'joharcraft_language';

interface LanguageContextType {
  language: string;
  setLanguage: (lang: string) => void;
  t: (path: string, params?: Record<string, string | number>) => string;
  currentLanguage: LanguageInfo;
  languages: LanguageInfo[];
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

function getNestedValue(obj: any, path: string): string | undefined {
  if (!obj) return undefined;
  const parts = path.split('.');
  let current = obj;
  for (const part of parts) {
    if (current === undefined || current === null) return undefined;
    current = current[part];
  }
  return typeof current === 'string' ? current : undefined;
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved && SUPPORTED_LANGUAGES.some((l) => l.code === saved)) {
        return saved;
      }
    } catch (_) {
      // Ignore localStorage read errors
    }
    return DEFAULT_LANGUAGE;
  });

  const setLanguage = (lang: string) => {
    if (!SUPPORTED_LANGUAGES.some((l) => l.code === lang)) return;
    setLanguageState(lang);
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch (_) {
      // Ignore localStorage write errors
    }
  };

  useEffect(() => {
    try {
      document.documentElement.lang = language;
    } catch (_) {}
  }, [language]);

  const currentLanguage = useMemo(() => {
    return (
      SUPPORTED_LANGUAGES.find((l) => l.code === language) ||
      SUPPORTED_LANGUAGES[0]
    );
  }, [language]);

  // Robust 3-tier fallback translation function: Regional -> Hindi -> English -> Key
  const t = (path: string, params?: Record<string, string | number>): string => {
    const selectedDict = DICTIONARIES[language];
    const hindiDict = DICTIONARIES['hi'];
    const englishDict = DICTIONARIES['en'];

    // 1. Try selected language
    let val = getNestedValue(selectedDict, path);

    // 2. Fallback to Hindi if not English
    if (!val && language !== 'hi' && language !== 'en') {
      val = getNestedValue(hindiDict, path);
    }

    // 3. Fallback to English
    if (!val) {
      val = getNestedValue(englishDict, path);
    }

    // 4. Safe string default if all else fails
    if (!val) {
      const parts = path.split('.');
      val = parts[parts.length - 1] || path;
    }

    // Interpolate params if provided
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        val = val!.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
      });
    }

    return val;
  };

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        t,
        currentLanguage,
        languages: SUPPORTED_LANGUAGES
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
