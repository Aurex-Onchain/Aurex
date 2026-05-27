"use client";

import { useTranslation, SUPPORTED_LOCALES, type Locale } from "@/i18n";

const LOCALE_LABEL_KEYS: Record<Locale, "language.en" | "language.zh"> = {
  en: "language.en",
  "zh-CN": "language.zh",
};

export function LanguageSwitcher() {
  const { locale, setLocale, t } = useTranslation();

  const nextLocale = SUPPORTED_LOCALES[
    (SUPPORTED_LOCALES.indexOf(locale) + 1) % SUPPORTED_LOCALES.length
  ];

  return (
    <button
      onClick={() => setLocale(nextLocale)}
      className="px-2 py-1 rounded text-xs text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors"
      aria-label={`Switch language to ${t(LOCALE_LABEL_KEYS[nextLocale])}`}
    >
      {t(LOCALE_LABEL_KEYS[locale])}
    </button>
  );
}
