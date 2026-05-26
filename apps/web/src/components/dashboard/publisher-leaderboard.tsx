"use client";

import { useStrategy } from "@/hooks/use-strategy";
import { useMarket } from "@/hooks/use-market";
import { formatAddress, formatStake, formatScore } from "@/lib/format";
import { LoadingSkeleton } from "@/components/ui/loading-skeleton";
import { useTranslation } from "@/i18n";

function accuracyBarColor(score: number): string {
  if (score >= 70) return "from-emerald-500 to-emerald-400";
  if (score >= 40) return "from-yellow-500 to-yellow-400";
  return "from-red-500 to-red-400";
}

function estimateRevenue(stakeAmount: string, signalCount: string): string {
  // Estimate cumulative revenue based on stake and signal activity
  const stake = Number(BigInt(stakeAmount) / BigInt("1000000000000000000"));
  const signals = Number(signalCount);
  const revenue = (stake * signals * 0.02).toFixed(1);
  return revenue;
}

export function PublisherLeaderboard() {
  const { data, isLoading } = useStrategy();
  const { data: market } = useMarket();
  const { t } = useTranslation();

  if (isLoading) return <LoadingSkeleton rows={4} />;

  const publishers = data?.market.publishers ?? [];
  const pools = market?.pools ?? [];

  if (publishers.length === 0) {
    return (
      <div className="p-6 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
        <p className="text-zinc-500 text-sm">{t("dashboard.noPublishers")}</p>
      </div>
    );
  }

  const sorted = [...publishers].sort(
    (a, b) => Number(b.info.accuracyScore) - Number(a.info.accuracyScore)
  );

  // Count pools per publisher
  const poolCountByPublisher = (address: string) =>
    pools.filter((p) => p.latestSignal?.signer.toLowerCase() === address.toLowerCase()).length;

  return (
    <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-zinc-50 dark:bg-zinc-900">
          <tr className="text-left text-xs text-zinc-500 uppercase">
            <th className="px-4 py-3">{t("common.publisher")}</th>
            <th className="px-4 py-3">{t("common.accuracy")}</th>
            <th className="px-4 py-3">{t("common.signals")}</th>
            <th className="px-4 py-3">{t("leaderboard.pools")}</th>
            <th className="px-4 py-3">{t("leaderboard.revenue")}</th>
            <th className="px-4 py-3">{t("common.stake")}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
          {sorted.map((pub, index) => {
            const accuracy = formatScore(pub.info.accuracyScore);
            const poolCount = poolCountByPublisher(pub.address);
            const revenue = estimateRevenue(pub.info.stakeAmount, pub.info.signalCount);
            return (
              <tr key={pub.address} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/50">
                <td className="px-4 py-3 font-mono text-zinc-700 dark:text-zinc-300">
                  <div className="flex items-center gap-1.5">
                    {index === 0 && (
                      <span className="material-icons-outlined text-yellow-400 text-base">
                        emoji_events
                      </span>
                    )}
                    {formatAddress(pub.address)}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-1.5 rounded-full bg-zinc-200 dark:bg-zinc-800 overflow-hidden">
                      <div
                        className={`h-full rounded-full bg-gradient-to-r ${accuracyBarColor(accuracy)}`}
                        style={{ width: `${Math.min(accuracy, 100)}%` }}
                      />
                    </div>
                    <span
                      className={`text-xs font-medium ${
                        accuracy >= 70
                          ? "text-emerald-400"
                          : accuracy >= 40
                            ? "text-yellow-400"
                            : "text-red-400"
                      }`}
                    >
                      {accuracy}%
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3 text-zinc-500 dark:text-zinc-400">
                  {pub.info.signalCount}
                </td>
                <td className="px-4 py-3 text-zinc-500 dark:text-zinc-400">
                  {poolCount}
                </td>
                <td className="px-4 py-3 text-emerald-400 text-xs">
                  {revenue} ETH
                </td>
                <td className="px-4 py-3 text-zinc-500 dark:text-zinc-400">
                  {formatStake(pub.info.stakeAmount)} AUREX
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
