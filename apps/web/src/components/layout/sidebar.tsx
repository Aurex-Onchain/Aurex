"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LanguageSwitcher } from "@/components/ui/language-switcher";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { useTranslation, type TranslationKeys } from "@/i18n";

const navItems: { href: string; labelKey: TranslationKeys; icon: string }[] = [
  { href: "/feed", labelKey: "sidebar.feed", icon: "dynamic_feed" },
  { href: "/", labelKey: "sidebar.dashboard", icon: "dashboard" },
  { href: "/signals", labelKey: "sidebar.signals", icon: "sensors" },
  { href: "/hook-pools", labelKey: "sidebar.hookPools", icon: "route" },
  { href: "/create-pool", labelKey: "sidebar.createPool", icon: "add_circle" },
  { href: "/advisor", labelKey: "sidebar.advisor", icon: "hub" },
  { href: "/terminal", labelKey: "sidebar.terminal", icon: "swap_horiz" },
];

export function Sidebar() {
  const pathname = usePathname();
  const { t } = useTranslation();

  return (
    <aside className="hidden md:flex w-60 h-screen sticky top-0 border-r border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 flex-col pl-2">
      <div className="px-4 pt-6 pb-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-lg font-bold text-zinc-900 dark:text-white tracking-tight">Aurex</h1>
            <p className="text-[11px] text-zinc-500 mt-0.5">{t("sidebar.subtitle")}</p>
          </div>
          <button
            type="button"
            onClick={() => window.dispatchEvent(new Event("aurex:open-command-palette"))}
            aria-label={t("command.open")}
            title={t("command.placeholder")}
            className="flex h-8 w-8 items-center justify-center rounded-md border border-zinc-200 text-zinc-500 transition-colors hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-600 dark:border-zinc-800 dark:hover:border-emerald-500/30 dark:hover:bg-emerald-500/10 dark:hover:text-emerald-300"
          >
            <span className="material-icons-outlined" style={{ fontSize: "17px", lineHeight: 1 }}>manage_search</span>
          </button>
        </div>
      </div>
      <nav className="flex-1 px-1 pr-2">
        {navItems.map((item) => {
          const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`mb-0.5 flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors ${
                active
                  ? "bg-zinc-100 text-zinc-900 dark:bg-zinc-900 dark:text-white"
                  : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-white"
              }`}
            >
              <span className={`material-icons-outlined shrink-0 ${active ? "text-emerald-500 dark:text-emerald-300" : "text-zinc-400"}`} style={{ fontSize: "17px", lineHeight: 1 }}>
                {item.icon}
              </span>
              <span className="truncate">{t(item.labelKey)}</span>
            </Link>
          );
        })}
      </nav>
      <div className="px-4 py-3 flex items-center justify-between">
        <LanguageSwitcher />
        <div className="flex items-center gap-1">
          <ThemeToggle />
          <Link
            href="/settings"
            className="w-7 h-7 flex items-center justify-center rounded hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
          >
            <span className="material-icons-outlined" style={{ fontSize: "16px" }}>settings</span>
          </Link>
        </div>
      </div>
    </aside>
  );
}
