"use client";

import { createContext, useContext, useEffect, useMemo, type ReactNode } from "react";
import { dictionaries, type Dictionary, type SupportedLanguage as Language } from "../lib/translations";
import type { TranslationValues } from "../lib/ui-translations";

const STORAGE_KEY = "hisab-erp-language";
const COOKIE_NAME = "hisab_locale";
const ENGLISH = "en" as Language;

type LanguageContextValue = {
  language: Language;
  dictionary: Dictionary;
  setLanguage: (language: Language) => void;
  t: (source: string, values?: TranslationValues) => string;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

function interpolate(source: string, values?: TranslationValues) {
  if (!values) return source;
  return source.replace(/\{([A-Za-z0-9_]+)\}/g, (token, key: string) => {
    const value = Array.isArray(values)
      ? values[Number(key)]
      : (values as Record<string, string | number>)[key];
    return value === undefined ? token : String(value);
  });
}

/** Hisab now ships one English interface. */
export function LanguageProvider({ children }: { children: ReactNode; initialLanguage?: Language }) {
  useEffect(() => {
    const root = document.documentElement;
    root.lang = "en";
    root.dataset.language = "en";
    root.dir = "ltr";

    try {
      window.localStorage.setItem(STORAGE_KEY, "en");
    } catch {
      // Storage may be unavailable in restricted browser contexts.
    }

    document.cookie = `${COOKIE_NAME}=en; Path=/; Max-Age=31536000; SameSite=Lax`;
  }, []);

  const value = useMemo<LanguageContextValue>(() => ({
    language: ENGLISH,
    dictionary: dictionaries.en,
    setLanguage: () => undefined,
    t: interpolate,
  }), []);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error("useLanguage must be used within LanguageProvider");
  return context;
}

/** Language selection was removed; keep a null compatibility export. */
export function LanguageSelector(_props: { compact?: boolean } = {}) {
  return null;
}
