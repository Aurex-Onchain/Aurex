"use client";

import { useHealth } from "@/hooks/use-health";
import { LoadingSkeleton } from "@/components/ui/loading-skeleton";
import { useTranslation } from "@/i18n";

export function OpenClawStatus() {
  const { data, isLoading } = useHealth();
  const { t } = useTranslation();

  if (isLoading) return <LoadingSkeleton rows={2} />;

  const connected = data?.status === "ok";

  return (
    <div className="p-6 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-sm text-zinc-500 dark:text-zinc-400">{t("advisor.openclawStatus")}</span>
        <div className="flex items-center gap-2">
          <span
            className={`inline-block w-2 h-2 rounded-full ${
              connected ? "bg-green-400 shadow-[0_0_6px_rgba(74,222,128,0.5)]" : "bg-zinc-600"
            }`}
          />
          <span className={connected ? "text-green-400 text-sm" : "text-zinc-500 text-sm"}>
            {connected ? t("advisor.connected") : t("advisor.disconnected")}
          </span>
        </div>
      </div>

      {connected && data && (
        <>
          <div className="flex items-center justify-between">
            <span className="text-sm text-zinc-500 dark:text-zinc-400">{t("advisor.version")}</span>
            <span className="text-zinc-800 dark:text-zinc-200 text-sm font-mono">{data.version}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-zinc-500 dark:text-zinc-400">{t("advisor.signalLoop")}</span>
            <span className={data.loop ? "text-green-400 text-sm" : "text-zinc-500 text-sm"}>
              {data.loop ? t("advisor.running") : t("advisor.stopped")}
            </span>
          </div>
          {data.publisher && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-zinc-500 dark:text-zinc-400">{t("advisor.publisher")}</span>
              <span className="text-zinc-800 dark:text-zinc-200 text-sm font-mono">
                {data.publisher.slice(0, 6)}...{data.publisher.slice(-4)}
              </span>
            </div>
          )}
        </>
      )}

      {!connected && (
        <p className="text-xs text-zinc-500">
          {t("advisor.openclawHint")}
        </p>
      )}
    </div>
  );
}
