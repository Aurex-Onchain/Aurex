const levelColors = {
  normal: "bg-emerald-600 dark:bg-green-500",
  info: "bg-emerald-600 dark:bg-emerald-500",
  warning: "bg-amber-500 dark:bg-yellow-500",
  critical: "bg-red-600 dark:bg-red-500",
} as const;

const levelLabels = {
  normal: "Normal",
  info: "Info",
  warning: "Warning",
  critical: "Critical",
} as const;

export function BehaviorIndicator({
  level,
}: {
  level: "normal" | "info" | "warning" | "critical";
}) {
  return (
    <span className="inline-flex items-center gap-1.5 text-sm">
      <span
        className={`w-2 h-2 rounded-full ${levelColors[level]} ${level === "critical" ? "animate-pulse" : ""}`}
      />
      <span className="text-zinc-700 dark:text-zinc-300">{levelLabels[level]}</span>
    </span>
  );
}
