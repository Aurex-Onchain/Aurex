"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation, type TranslationKeys } from "@/i18n";

interface CommandItem {
  id: string;
  labelKey: TranslationKeys;
  detailKey: TranslationKeys;
  icon: string;
  href: string;
  groupKey: TranslationKeys;
}

const COMMANDS: CommandItem[] = [
  {
    id: "feed",
    labelKey: "sidebar.feed",
    detailKey: "command.detailFeed",
    icon: "dynamic_feed",
    href: "/feed",
    groupKey: "command.groupNavigate",
  },
  {
    id: "dashboard",
    labelKey: "sidebar.dashboard",
    detailKey: "command.detailDashboard",
    icon: "dashboard",
    href: "/",
    groupKey: "command.groupNavigate",
  },
  {
    id: "signals",
    labelKey: "sidebar.signals",
    detailKey: "command.detailSignals",
    icon: "sensors",
    href: "/signals",
    groupKey: "command.groupNavigate",
  },
  {
    id: "hook-pools",
    labelKey: "sidebar.hookPools",
    detailKey: "command.detailHooks",
    icon: "route",
    href: "/hook-pools",
    groupKey: "command.groupNavigate",
  },
  {
    id: "terminal",
    labelKey: "sidebar.terminal",
    detailKey: "command.detailTerminal",
    icon: "swap_horiz",
    href: "/terminal",
    groupKey: "command.groupNavigate",
  },
  {
    id: "advisor",
    labelKey: "sidebar.advisor",
    detailKey: "command.detailAdvisor",
    icon: "hub",
    href: "/advisor",
    groupKey: "command.groupNavigate",
  },
  {
    id: "create-pool",
    labelKey: "sidebar.createPool",
    detailKey: "command.detailCreatePool",
    icon: "add_circle",
    href: "/create-pool",
    groupKey: "command.groupActions",
  },
  {
    id: "check-risk",
    labelKey: "command.checkRisk",
    detailKey: "command.detailCheckRisk",
    icon: "shield",
    href: "/signals",
    groupKey: "command.groupActions",
  },
  {
    id: "explain-hook",
    labelKey: "command.explainHook",
    detailKey: "command.detailExplainHook",
    icon: "auto_awesome",
    href: "/hook-pools",
    groupKey: "command.groupActions",
  },
];

export function CommandPalette() {
  const { t } = useTranslation();
  const reduceMotion = useReducedMotion();
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return COMMANDS;
    return COMMANDS.filter((command) => {
      const haystack = `${t(command.labelKey)} ${t(command.detailKey)} ${command.id}`.toLowerCase();
      return haystack.includes(normalized);
    });
  }, [query, t]);

  const runCommand = useCallback((command: CommandItem) => {
    setOpen(false);
    setQuery("");
    window.dispatchEvent(new CustomEvent("aurex:navigate", { detail: { href: command.href } }));
  }, []);

  useEffect(() => {
    if (!open) return;
    const timer = window.setTimeout(() => inputRef.current?.focus(), 20);
    return () => window.clearTimeout(timer);
  }, [open]);

  useEffect(() => {
    function onOpenPalette() {
      setActiveIndex(0);
      setOpen(true);
    }

    function onKeyDown(event: KeyboardEvent) {
      const commandKey = event.metaKey || event.ctrlKey;
      if (commandKey && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((value) => !value);
        return;
      }
      if (!open) return;
      if (event.key === "Escape") {
        event.preventDefault();
        setOpen(false);
        return;
      }
      if (event.key === "ArrowDown") {
        event.preventDefault();
        setActiveIndex((value) => Math.min(value + 1, filtered.length - 1));
        return;
      }
      if (event.key === "ArrowUp") {
        event.preventDefault();
        setActiveIndex((value) => Math.max(value - 1, 0));
        return;
      }
      if (event.key === "Enter" && filtered[activeIndex]) {
        event.preventDefault();
        runCommand(filtered[activeIndex]);
      }
    }

    window.addEventListener("aurex:open-command-palette", onOpenPalette);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("aurex:open-command-palette", onOpenPalette);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [activeIndex, filtered, open, runCommand]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-start justify-center bg-zinc-950/35 px-3 pt-[12vh] backdrop-blur-sm"
          initial={reduceMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={reduceMotion ? undefined : { opacity: 0 }}
          transition={{ duration: 0.14 }}
          onMouseDown={() => setOpen(false)}
        >
          <motion.div
            className="command-shell w-full max-w-2xl overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-2xl shadow-zinc-950/25 dark:border-emerald-500/20 dark:bg-zinc-950"
            initial={reduceMotion ? false : { opacity: 0, y: 12, scale: 0.98, filter: "blur(8px)" }}
            animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
            exit={reduceMotion ? undefined : { opacity: 0, y: 8, scale: 0.99, filter: "blur(6px)" }}
            transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="scanner-panel border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
              <div className="flex items-center gap-3">
                <span className="material-icons-outlined text-emerald-500 dark:text-emerald-300">manage_search</span>
                <input
                  ref={inputRef}
                  value={query}
                  onChange={(event) => {
                    setQuery(event.target.value);
                    setActiveIndex(0);
                  }}
                  placeholder={t("command.placeholder")}
                  className="min-w-0 flex-1 bg-transparent text-sm text-zinc-900 placeholder-zinc-400 outline-none dark:text-zinc-100 dark:placeholder-zinc-600"
                />
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label={t("command.close")}
                  title={t("command.close")}
                  className="flex h-7 w-7 items-center justify-center rounded-md border border-zinc-200 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700 dark:border-zinc-800 dark:hover:bg-zinc-900 dark:hover:text-zinc-200"
                >
                  <span className="material-icons-outlined" style={{ fontSize: "16px", lineHeight: 1 }}>close</span>
                </button>
              </div>
            </div>

            <div className="max-h-[55vh] overflow-y-auto p-2">
              {filtered.length === 0 ? (
                <div className="px-3 py-8 text-center text-sm text-zinc-500">{t("command.empty")}</div>
              ) : (
                filtered.map((command, index) => {
                  const active = index === activeIndex;
                  const previousGroup = filtered[index - 1]?.groupKey;
                  const showGroup = previousGroup !== command.groupKey;
                  return (
                    <div key={command.id}>
                      {showGroup && (
                        <div className="px-2 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-wide text-zinc-400">
                          {t(command.groupKey)}
                        </div>
                      )}
                      <button
                        type="button"
                        onMouseEnter={() => setActiveIndex(index)}
                        onClick={() => runCommand(command)}
                        className={`command-item flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors ${
                          active
                            ? "bg-emerald-50 text-zinc-950 dark:bg-emerald-500/10 dark:text-white"
                            : "text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-900"
                        }`}
                      >
                        <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md border ${
                          active
                            ? "border-emerald-200 bg-white text-emerald-600 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300"
                            : "border-zinc-200 bg-zinc-50 text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400"
                        }`}>
                          <span className="material-icons-outlined" style={{ fontSize: "17px", lineHeight: 1 }}>
                            {command.icon}
                          </span>
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-sm font-semibold">{t(command.labelKey)}</span>
                          <span className="block truncate text-xs text-zinc-500 dark:text-zinc-500">
                            {t(command.detailKey)}
                          </span>
                        </span>
                        <span className="material-icons-outlined text-base text-zinc-400">arrow_forward</span>
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
