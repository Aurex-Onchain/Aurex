"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LanguageSwitcher } from "@/components/ui/language-switcher";
import { useTranslation, type TranslationKeys } from "@/i18n";

const navItems: { href: string; labelKey: TranslationKeys }[] = [
  { href: "/feed", labelKey: "sidebar.feed" },
  { href: "/", labelKey: "sidebar.dashboard" },
  { href: "/signals", labelKey: "sidebar.signals" },
  { href: "/hook-pools", labelKey: "sidebar.hookPools" },
  { href: "/create-pool", labelKey: "sidebar.createPool" },
  { href: "/advisor", labelKey: "sidebar.advisor" },
  { href: "/terminal", labelKey: "sidebar.terminal" },
];

export function Sidebar() {
  const pathname = usePathname();
  const { t } = useTranslation();

  return (
    <aside className="hidden md:flex w-60 h-screen sticky top-0 border-r border-zinc-800 bg-zinc-950 flex-col pl-2">
      <div className="px-4 pt-6 pb-5">
        <h1 className="text-lg font-bold text-white tracking-tight">Aurex</h1>
        <p className="text-[11px] text-zinc-500 mt-0.5">{t("sidebar.subtitle")}</p>
      </div>
      <nav className="flex-1 px-1 pr-2">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`block px-3 py-2 rounded-md text-sm mb-0.5 transition-colors ${
              pathname === item.href
                ? "bg-zinc-800 text-white"
                : "text-zinc-400 hover:text-white hover:bg-zinc-900"
            }`}
          >
            {t(item.labelKey)}
          </Link>
        ))}
      </nav>
      <div className="px-4 py-3 flex items-center justify-between">
        <LanguageSwitcher />
        <Link
          href="/settings"
          className="w-7 h-7 flex items-center justify-center rounded hover:bg-zinc-800 transition-colors text-zinc-500 hover:text-zinc-300"
        >
          <span className="material-icons-outlined" style={{ fontSize: "16px" }}>settings</span>
        </Link>
      </div>
    </aside>
  );
}
