"use client";

import { useMarket } from "@/hooks/use-market";
import { LoadingSkeleton } from "@/components/ui/loading-skeleton";
import { useTranslation } from "@/i18n";
import type { TranslationKeys } from "@/i18n";
import { formatAddress, formatFee, isExpired } from "@/lib/format";

interface PoolEvent {
  poolId: string;
  type: "signal_published" | "signal_expired" | "fee_change" | "high_risk";
  description: string;
  timestamp: number;
}

function derivePoolEvents(pools: {
  poolId: string;
  latestSignal: {
    signalId: string;
    riskScore: string;
    alphaScore: string;
    recommendedFee: number;
    expiresAt: string;
    signer: string;
  } | null;
  signalValid: boolean;
  policy: { defaultFee: number; maxFee: number } | null;
  verified: boolean | null;
  slashed: boolean | null;
}[]): PoolEvent[] {
  const events: PoolEvent[] = [];

  for (const pool of pools) {
    if (pool.latestSignal) {
      const signal = pool.latestSignal;
      const expired = isExpired(signal.expiresAt);

      if (!expired && pool.signalValid) {
        events.push({
          poolId: pool.poolId,
          type: "signal_published",
          description: `Signal by ${formatAddress(signal.signer)} — Risk: ${signal.riskScore}, Alpha: ${signal.alphaScore}, Fee: ${formatFee(signal.recommendedFee)}`,
          timestamp: Date.now(),
        });
      }

      if (expired) {
        events.push({
          poolId: pool.poolId,
          type: "signal_expired",
          description: `Signal expired (was by ${formatAddress(signal.signer)})`,
          timestamp: Number(signal.expiresAt) * 1000,
        });
      }

      if (Number(signal.riskScore) > 70) {
        events.push({
          poolId: pool.poolId,
          type: "high_risk",
          description: `High risk score: ${signal.riskScore}/100`,
          timestamp: Date.now(),
        });
      }

      if (pool.policy && signal.recommendedFee !== pool.policy.defaultFee) {
        events.push({
          poolId: pool.poolId,
          type: "fee_change",
          description: `Dynamic fee adjusted: ${formatFee(pool.policy.defaultFee)} -> ${formatFee(signal.recommendedFee)}`,
          timestamp: Date.now(),
        });
      }
    }
  }

  return events.sort((a, b) => b.timestamp - a.timestamp).slice(0, 10);
}

const EVENT_TYPE_KEYS: Record<string, TranslationKeys> = {
  signal_published: "advisor.event.signal_published",
  signal_expired: "advisor.event.signal_expired",
  fee_change: "advisor.event.fee_change",
  high_risk: "advisor.event.high_risk",
};

const EVENT_STYLES: Record<string, { icon: string; color: string; bg: string }> = {
  signal_published: { icon: "broadcast_on_personal", color: "text-emerald-400", bg: "bg-emerald-900/20" },
  signal_expired: { icon: "timer_off", color: "text-zinc-400", bg: "bg-zinc-800/40" },
  fee_change: { icon: "swap_vert", color: "text-amber-400", bg: "bg-amber-900/20" },
  high_risk: { icon: "warning", color: "text-red-400", bg: "bg-red-900/20" },
};

export function RecentPoolEvents() {
  const { data, isLoading } = useMarket();
  const { t } = useTranslation();

  if (isLoading) return <LoadingSkeleton rows={4} />;

  if (!data?.pools?.length) {
    return (
      <div className="p-6 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
        <p className="text-zinc-500 text-sm">{t("advisor.noPoolEvents")}</p>
      </div>
    );
  }

  const events = derivePoolEvents(data.pools);

  if (events.length === 0) {
    return (
      <div className="p-6 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
        <p className="text-zinc-500 text-sm">{t("advisor.noPoolEvents")}</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 divide-y divide-zinc-200 dark:divide-zinc-800">
      {events.map((event, i) => {
        const style = EVENT_STYLES[event.type] || EVENT_STYLES.signal_published;
        return (
          <div key={`${event.poolId}-${event.type}-${i}`} className="flex items-start gap-3 p-4">
            <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${style.bg}`}>
              <span className={`material-icons-outlined text-base ${style.color}`}>{style.icon}</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-zinc-500">{formatAddress(event.poolId)}</span>
                <span className={`text-xs px-1.5 py-0.5 rounded ${style.bg} ${style.color}`}>
                  {t(EVENT_TYPE_KEYS[event.type])}
                </span>
              </div>
              <p className="text-sm text-zinc-300 mt-1">{event.description}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
