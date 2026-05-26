"use client";

import { useBehavior } from "@/hooks/use-behavior";
import { BehaviorIndicator } from "@/components/ui/behavior-indicator";
import { LoadingSkeleton } from "@/components/ui/loading-skeleton";
import { useTranslation } from "@/i18n";

export function BehaviorDashboard() {
  const { data, isLoading } = useBehavior();
  const { t } = useTranslation();

  if (isLoading) return <LoadingSkeleton rows={2} />;
  if (!data) return null;

  return (
    <div className="p-6 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-sm text-zinc-600 dark:text-zinc-400">{t("advisor.currentLevel")}</span>
        <BehaviorIndicator level={data.level} />
      </div>

      {data.alerts.length > 0 ? (
        <div className="space-y-2">
          <p className="text-xs text-zinc-500 uppercase">{t("advisor.alerts")}</p>
          {data.alerts.map((alert, i) => (
            <div
              key={i}
              className={`p-3 rounded border text-sm ${
                alert.level === "critical"
                  ? "border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300"
                  : alert.level === "warning"
                    ? "border-amber-200 dark:border-yellow-800 bg-amber-50 dark:bg-yellow-900/20 text-amber-700 dark:text-yellow-300"
                    : "border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300"
              }`}
            >
              <p>{alert.message}</p>
              <p className="text-xs mt-1 opacity-70">
                {alert.metric}: {alert.current.toFixed(1)} / threshold {alert.threshold}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-zinc-500">{t("advisor.noAlerts")}</p>
      )}
    </div>
  );
}
