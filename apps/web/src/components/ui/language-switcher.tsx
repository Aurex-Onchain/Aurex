"use client";

import { useTranslation, SUPPORTED_LOCALES, type Locale } from "@/i18n";

const LOCALE_LABELS: Record<Locale, string> = {
  en: "EN",
  "zh-CN": "中文",
};

export function LanguageSwitcher() {
  const { locale, setLocale } = useTranslation();

  const nextLocale = SUPPORTED_LOCALES[
    (SUPPORTED_LOCALES.indexOf(locale) + 1) % SUPPORTED_LOCALES.length
  ];

  return (
    <button
      onClick={() => setLocale(nextLocale)}
      className="px-2 py-1 rounded text-xs text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors"
      aria-label={`Switch language to ${LOCALE_LABELS[nextLocale]}`}
    >
      {LOCALE_LABELS[locale]}
    </button>
  );
}
