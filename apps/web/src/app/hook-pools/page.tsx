"use client";

import { useMarket } from "@/hooks/use-market";
import { formatAddress, formatFee } from "@/lib/format";
import { SignalBadge } from "@/components/ui/signal-badge";
import { LoadingSkeleton } from "@/components/ui/loading-skeleton";
import { useTranslation } from "@/i18n";
import { CollapsibleHeader } from "@/components/ui/collapsible-header";

export default function HookPoolsPage() {
  const { data: market, isLoading } = useMarket();
  const { t } = useTranslation();

  const pools = market?.pools ?? [];

  return (
    <CollapsibleHeader title={t("hookPools.title")} description={t("hookPools.description")}>
      <div className="px-3 sm:px-5 pb-8">

      {isLoading ? (
        <LoadingSkeleton rows={4} />
      ) : pools.length === 0 ? (
        <div className="p-6 rounded-lg border border-zinc-800 bg-zinc-900/50">
          <p className="text-zinc-500 text-sm">
            {t("hookPools.noPools")}
          </p>
        </div>
      ) : (
        <div className="rounded-lg border border-zinc-800 overflow-x-auto">
          <table className="w-full text-sm min-w-[700px]">
            <thead className="bg-zinc-900">
              <tr className="text-left text-xs text-zinc-500 uppercase">
                <th className="px-4 py-3">{t("hookPools.colPoolId")}</th>
                <th className="px-4 py-3">{t("hookPools.colSignal")}</th>
                <th className="px-4 py-3">{t("hookPools.colRisk")}</th>
                <th className="px-4 py-3">{t("hookPools.colDefaultFee")}</th>
                <th className="px-4 py-3">{t("hookPools.colMaxFee")}</th>
                <th className="px-4 py-3">{t("hookPools.colPublisherShare")}</th>
                <th className="px-4 py-3">{t("hookPools.colHighRiskBlock")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {pools.map((pool) => (
                <tr key={pool.poolId} className="hover:bg-zinc-900/50">
                  <td className="px-4 py-3 font-mono text-zinc-300">
                    {formatAddress(pool.poolId)}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-xs ${
                        pool.signalValid
                          ? "bg-green-900/50 text-green-400"
                          : "bg-zinc-800 text-zinc-500"
                      }`}
                    >
                      {pool.signalValid ? t("hookPools.signalActive") : t("hookPools.signalNone")}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {pool.latestSignal ? (
                      <SignalBadge score={Number(pool.latestSignal.riskScore)} />
                    ) : (
                      <span className="text-zinc-600">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-zinc-400">
                    {pool.policy ? formatFee(pool.policy.defaultFee) : "—"}
                  </td>
                  <td className="px-4 py-3 text-zinc-400">
                    {pool.policy ? formatFee(pool.policy.maxFee) : "—"}
                  </td>
                  <td className="px-4 py-3 text-zinc-400">
                    {pool.policy ? `${(pool.policy.publisherShareBps / 100).toFixed(1)}%` : "—"}
                  </td>
                  <td className="px-4 py-3 text-zinc-400">
                    {pool.policy ? (pool.policy.blockHighRiskTrades ? t("common.yes") : t("common.no")) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      </div>
    </CollapsibleHeader>
  );
}
