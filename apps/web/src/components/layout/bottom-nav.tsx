"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/feed", icon: "dynamic_feed", label: "Feed" },
  { href: "/", icon: "dashboard", label: "Home" },
  { href: "/terminal", icon: "swap_horiz", label: "Trade" },
  { href: "/signals", icon: "sensors", label: "Signals" },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-zinc-200 dark:border-zinc-800 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-sm">
      <div className="flex items-center justify-around h-14">
        {navItems.map((item) => {
          const isActive = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center gap-0.5 px-3 py-1.5 rounded-lg transition-colors ${
                isActive
                  ? "text-emerald-400"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              <span className="material-icons-outlined" style={{ fontSize: "20px" }}>
                {item.icon}
              </span>
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
