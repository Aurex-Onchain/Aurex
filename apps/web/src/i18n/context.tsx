"use client";

import { createContext, useContext, useState, useCallback, useMemo, useEffect } from "react";
import type { Locale } from "./types";
import { DEFAULT_LOCALE } from "./types";
import type { TranslationKeys } from "./translations/en";
import en from "./translations/en";
import zhCN from "./translations/zh-CN";
import { detectLocale, persistLocale } from "./detect";

const translations: Record<Locale, Record<TranslationKeys, string>> = {
  en,
  "zh-CN": zhCN,
};

interface I18nContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: TranslationKeys, params?: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE);

  useEffect(() => {
    const detected = detectLocale();
    setLocaleState(detected);
    document.documentElement.lang = detected;
  }, []);

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale);
    persistLocale(newLocale);
    document.documentElement.lang = newLocale;
  }, []);

  const t = useCallback(
    (key: TranslationKeys, params?: Record<string, string | number>): string => {
      let text = translations[locale][key] ?? translations.en[key] ?? key;
      if (params) {
        Object.entries(params).forEach(([k, v]) => {
          text = text.replace(`{${k}}`, String(v));
        });
      }
      return text;
    },
    [locale],
  );

  const value = useMemo(() => ({ locale, setLocale, t }), [locale, setLocale, t]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useTranslation() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useTranslation must be used within I18nProvider");
  return ctx;
}
