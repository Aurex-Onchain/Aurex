export function StatCard({
  title,
  value,
  subtitle,
  icon,
  tone = "zinc",
  loading,
}: {
  title: string;
  value: string;
  subtitle?: string;
  icon?: string;
  tone?: "emerald" | "teal" | "green" | "zinc";
  loading?: boolean;
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
    <div className="min-h-28 overflow-hidden rounded-2xl border border-zinc-200/80 bg-zinc-50/60 p-4 backdrop-blur-sm dark:border-zinc-800/80 dark:bg-zinc-900/60">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-xs font-medium text-zinc-500">{title}</p>
          {loading ? (
            <div className="mt-2 h-8 w-20 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
          ) : (
            <p className={`mt-2 text-2xl font-semibold leading-none ${styles.value}`}>{value}</p>
          )}
        </div>
        {icon && (
          <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border ${styles.icon}`}>
            <span className="material-icons-outlined" style={{ fontSize: "18px", lineHeight: 1 }}>
              {icon}
            </span>
          </div>
        )}
      </div>
      {subtitle && <p className="mt-3 text-xs leading-relaxed text-zinc-500">{subtitle}</p>}
    </div>
  );
}
