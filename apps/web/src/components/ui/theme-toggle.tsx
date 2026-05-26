"use client";

import { useTheme, type Theme } from "@/components/theme/theme-provider";
import { useTranslation } from "@/i18n";

const themeOrder: Theme[] = ["dark", "light", "system"];

const themeIcons: Record<Theme, string> = {
  dark: "dark_mode",
  light: "light_mode",
  system: "brightness_auto",
};

const themeLabelKeys: Record<Theme, string> = {
  dark: "theme.dark",
  light: "theme.light",
  system: "theme.system",
};

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const { t } = useTranslation();

  function cycle() {
    const idx = themeOrder.indexOf(theme);
    const next = themeOrder[(idx + 1) % themeOrder.length];
    setTheme(next);
  }

  return (
    <button
      onClick={cycle}
      className="w-7 h-7 flex items-center justify-center rounded hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
      title={t(themeLabelKeys[theme] as any)}
      aria-label={t(themeLabelKeys[theme] as any)}
    >
      <span className="material-icons-outlined" style={{ fontSize: "16px" }}>
        {themeIcons[theme]}
      </span>
    </button>
  );
}
