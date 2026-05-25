"use client";

import { usePublisher } from "@/hooks/use-publisher";
import { formatAddress, formatStake, formatScore, formatTimestamp } from "@/lib/format";
import { LoadingSkeleton } from "@/components/ui/loading-skeleton";
import { useTranslation } from "@/i18n";

export function PublisherStatus() {
  const { data, isLoading } = usePublisher();
  const { t } = useTranslation();

  if (isLoading) return <LoadingSkeleton rows={3} />;

  if (!data?.address) {
    return (
      <div className="p-6 rounded-lg border border-zinc-800 bg-zinc-900/50">
        <p className="text-zinc-500 text-sm">
          {t("advisor.noPublisher")}
        </p>
      </div>
    );
  }

  const info = data.info;

  return (
    <div className="p-6 rounded-lg border border-zinc-800 bg-zinc-900/50 space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-sm text-zinc-400">{t("advisor.address")}</span>
        <span className="font-mono text-zinc-200">{formatAddress(data.address)}</span>
      </div>
      {info && (
        <>
          <div className="flex items-center justify-between">
            <span className="text-sm text-zinc-400">{t("advisor.status")}</span>
            <span className={info.active ? "text-green-400" : "text-zinc-500"}>
              {info.active ? t("advisor.active") : t("advisor.inactive")}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-zinc-400">{t("advisor.stake")}</span>
            <span className="text-zinc-200">{formatStake(info.stakeAmount)} AUREX</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-zinc-400">{t("advisor.accuracy")}</span>
            <span className="text-zinc-200">{formatScore(info.accuracyScore)}%</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-zinc-400">{t("advisor.signalsPublished")}</span>
            <span className="text-zinc-200">{info.signalCount}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-zinc-400">{t("advisor.slashCount")}</span>
            <span className={Number(info.slashCount) > 0 ? "text-red-400" : "text-zinc-200"}>
              {info.slashCount}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-zinc-400">{t("advisor.registered")}</span>
            <span className="text-zinc-400 text-xs">{formatTimestamp(info.registeredAt)}</span>
          </div>
        </>
      )}
      {data.claimable && BigInt(data.claimable) > BigInt(0) && (
        <div className="flex items-center justify-between pt-2 border-t border-zinc-800">
          <span className="text-sm text-zinc-400">{t("advisor.claimableFees")}</span>
          <span className="text-green-400 font-medium">{formatStake(data.claimable)} AUREX</span>
        </div>
      )}
    </div>
  );
}
