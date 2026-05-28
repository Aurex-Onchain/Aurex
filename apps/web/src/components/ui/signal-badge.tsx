"use client";

import { AnimatedNumber, useNumberFlash } from "@/components/motion/animated-number";

export function SignalBadge({ score, label }: { score: number; label?: string }) {
  const flash = useNumberFlash(score);
  const color =
    score <= 30
      ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-green-900/50 dark:text-green-400 dark:border-green-800"
      : score <= 60
        ? "bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/50 dark:text-yellow-400 dark:border-yellow-800"
        : "bg-red-50 text-red-700 border-red-200 dark:bg-red-900/50 dark:text-red-400 dark:border-red-800";

  return (
    <span
      className={`inline-flex max-w-full items-center gap-1 overflow-hidden text-ellipsis whitespace-nowrap rounded border px-2 py-0.5 text-xs font-medium ${flash} ${color}`}
    >
      <span className="live-dot h-1.5 w-1.5 shrink-0 rounded-full bg-current" />
      {label && <span className="mr-1 truncate">{label}</span>}
      <AnimatedNumber value={score} />
    </span>
  );
}

