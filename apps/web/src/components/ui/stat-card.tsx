"use client";

import { AnimatedNumber, useNumberFlash } from "@/components/motion/animated-number";

export function StatCard({
  title,
  value,
  subtitle,
  icon,
  tone = "zinc",
  loading,
  details,
}: {
  title: string;
  value: string;
  subtitle?: string;
  icon?: string;
  tone?: "emerald" | "teal" | "green" | "zinc";
  loading?: boolean;
  details?: string[];
}) {
  const styles = {
    emerald: {
      icon: "border-emerald-200 bg-emerald-50 text-emerald-600 dark:border-emerald-500/25 dark:bg-emerald-500/10 dark:text-emerald-300",
      value: "text-emerald-600 dark:text-emerald-300",
    },
    teal: {
      icon: "border-teal-200 bg-teal-50 text-teal-700 dark:border-teal-500/25 dark:bg-teal-500/10 dark:text-teal-200",
      value: "text-teal-700 dark:text-teal-200",
    },
    green: {
      icon: "border-green-200 bg-green-50 text-green-700 dark:border-green-500/25 dark:bg-green-500/10 dark:text-green-200",
      value: "text-green-700 dark:text-green-200",
    },
    zinc: {
      icon: "border-zinc-200 bg-zinc-50 text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300",
      value: "text-zinc-900 dark:text-zinc-100",
    },
  }[tone];

  return (
    <div className="motion-card group min-h-28 overflow-hidden rounded-2xl border border-zinc-200/80 bg-zinc-50/60 p-4 backdrop-blur-sm dark:border-zinc-800/80 dark:bg-zinc-900/60">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-xs font-medium text-zinc-500">{title}</p>
          {loading ? (
            <div className="mt-2 h-8 w-20 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
          ) : (
            <AnimatedStatValue value={value} className={`mt-2 text-2xl font-semibold leading-none ${styles.value}`} />
          )}
        </div>
        {icon && (
          <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border transition-transform duration-200 group-hover:scale-105 ${styles.icon}`}>
            <span className="material-icons-outlined" style={{ fontSize: "18px", lineHeight: 1 }}>
              {icon}
            </span>
          </div>
        )}
      </div>
      {subtitle && <p className="mt-3 text-xs leading-relaxed text-zinc-500">{subtitle}</p>}
      {details && details.length > 0 && (
        <div className="kpi-reveal mt-2 flex flex-wrap gap-1.5">
          {details.map((detail) => (
            <span
              key={detail}
              className="rounded border border-zinc-200 bg-white/60 px-1.5 py-0.5 text-[10px] font-medium text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950/40"
            >
              {detail}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function AnimatedStatValue({ value, className }: { value: string; className: string }) {
  const numeric = Number(value);
  const ratio = value.match(/^(\d+)\s*\/\s*(\d+)$/);
  const flash = useNumberFlash(Number.isFinite(numeric) ? numeric : 0);

  if (Number.isFinite(numeric)) {
    return (
      <p className={`${className} inline-flex px-0.5 ${flash}`}>
        <AnimatedNumber value={numeric} />
      </p>
    );
  }

  if (ratio) {
    const left = Number(ratio[1]);
    const right = Number(ratio[2]);
    return (
      <p className={`${className} inline-flex items-baseline gap-1 px-0.5`}>
        <AnimatedNumber value={left} />
        <span className="text-zinc-400">/</span>
        <AnimatedNumber value={right} />
      </p>
    );
  }

  return <p className={className}>{value}</p>;
}
