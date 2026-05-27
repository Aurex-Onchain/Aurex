"use client";

import { useMarket } from "@/hooks/use-market";
import { SignalBadge } from "@/components/ui/signal-badge";
import { formatAddress, formatFee } from "@/lib/format";
import { LoadingSkeleton } from "@/components/ui/loading-skeleton";
import { useTranslation } from "@/i18n";

export function PoolList() {
  const { data: market, isLoading } = useMarket();
  const { t } = useTranslation();

  if (isLoading) return <LoadingSkeleton rows={3} />;

  const pools = market?.pools ?? [];

  if (pools.length === 0) {
    return (
      <div className="p-6 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
        <p className="text-zinc-500 text-sm">{t("dashboard.noPools")}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {pools.map((pool) => (
        <div
          key={pool.poolId}
          className="p-4 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 overflow-hidden"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="font-mono text-sm text-zinc-700 dark:text-zinc-300">
              {formatAddress(pool.poolId)}
            </span>
            <span
              className={`w-2 h-2 rounded-full ${pool.signalValid ? "bg-green-500" : "bg-zinc-600"}`}
            />
          </div>
          {pool.latestSignal ? (
            <div className="space-y-2">
              <div className="flex gap-2 flex-wrap overflow-hidden">
                <SignalBadge score={Number(pool.latestSignal.riskScore)} label="Risk" />
                <SignalBadge score={Number(pool.latestSignal.alphaScore)} label="Alpha" />
              </div>
              <p className="text-xs text-zinc-500">
                {t("common.fee")}: {formatFee(pool.latestSignal.recommendedFee)}
              </p>
            </div>
          ) : (
            <p className="text-xs text-zinc-500">{t("dashboard.noSignalPublished")}</p>
          )}
        </div>
      ))}
    </div>
  );
}
