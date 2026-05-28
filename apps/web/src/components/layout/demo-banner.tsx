"use client";

import { useState, useEffect } from "react";
import { useTranslation } from "@/i18n";

export function DemoBanner() {
  const { t } = useTranslation();
  const [dismissed, setDismissed] = useState(true);
  const [isDemo, setIsDemo] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const onVercel = window.location.hostname.includes("vercel.app");
    const explicitDemo = process.env.NEXT_PUBLIC_DEMO_MODE === "true";
    setIsDemo(onVercel || explicitDemo);
    const stored = localStorage.getItem("aurex-demo-banner-dismissed");
    setDismissed(stored === "true");
  }, []);

  if (!isDemo || dismissed) return null;

  function dismiss() {
    setDismissed(true);
    if (typeof window !== "undefined") {
      localStorage.setItem("aurex-demo-banner-dismissed", "true");
    }
  }

  return (
    <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-2.5 flex items-center justify-between gap-3">
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <span className="material-icons-outlined text-amber-400 flex-shrink-0" style={{ fontSize: "18px" }}>
          info
        </span>
        <p className="text-xs text-zinc-700 dark:text-zinc-300 truncate">
          <span className="font-medium text-amber-500 dark:text-amber-400">{t("demoBanner.label")}</span>
          {" — "}
          {t("demoBanner.message")}{" "}
          <a
            href="https://github.com/Aurex-Onchain/Aurex#self-host-guide"
            target="_blank"
            rel="noopener noreferrer"
            className="underline text-amber-500 dark:text-amber-400 hover:text-amber-600 dark:hover:text-amber-300"
          >
            {t("demoBanner.selfHostLink")}
          </a>
        </p>
      </div>
      <button
        onClick={dismiss}
        className="flex-shrink-0 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors"
        aria-label="Dismiss"
      >
        <span className="material-icons-outlined" style={{ fontSize: "18px" }}>close</span>
      </button>
    </div>
  );
}
