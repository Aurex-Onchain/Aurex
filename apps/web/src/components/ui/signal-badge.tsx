"use client";

import { AnimatedNumber, useNumberFlash } from "@/components/motion/animated-number";

export function SignalBadge({ score, label }: { score: number; label?: string }) {
  const flash = useNumberFlash(score);
  const color =
    score <= 30
      ? "bg-green-900/50 text-green-400 border-green-800"
      : score <= 60
        ? "bg-yellow-900/50 text-yellow-400 border-yellow-800"
        : "bg-red-900/50 text-red-400 border-red-800";

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
