import { type Locale, SUPPORTED_LOCALES, DEFAULT_LOCALE } from "./types";

const STORAGE_KEY = "aurex-locale";

export function detectLocale(): Locale {
  if (typeof window !== "undefined") {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && SUPPORTED_LOCALES.includes(stored as Locale)) {
      return stored as Locale;
    }
  }

  if (typeof navigator !== "undefined") {
    const langs = navigator.languages ?? [navigator.language];
    for (const lang of langs) {
      const normalized = lang.toLowerCase();
      if (normalized.startsWith("zh")) return "zh-CN";
      if (normalized.startsWith("en")) return "en";
    }
  }

  return DEFAULT_LOCALE;
}

export function persistLocale(locale: Locale): void {
  localStorage.setItem(STORAGE_KEY, locale);
}
