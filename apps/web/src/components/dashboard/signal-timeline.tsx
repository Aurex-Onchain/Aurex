"use client";

import { useMarket } from "@/hooks/use-market";
import { formatAddress, formatFee, formatScore } from "@/lib/format";
import { LoadingSkeleton } from "@/components/ui/loading-skeleton";
import { useTranslation, type TranslationKeys } from "@/i18n";

function riskColor(score: number): string {
  if (score < 30) return "text-emerald-700 dark:text-emerald-300";
  if (score <= 60) return "text-yellow-700 dark:text-yellow-300";
  return "text-red-700 dark:text-red-300";
}

function riskBgColor(score: number): string {
  if (score < 30) return "bg-emerald-500";
  if (score <= 60) return "bg-yellow-500";
  return "bg-red-500";
}

function relativeTime(expiresAt: string, t: (key: TranslationKeys, params?: Record<string, string | number>) => string): string {
  const ts = Number(expiresAt) * 1000;
  const diff = Date.now() - (ts - 5 * 60 * 1000); // approximate publish time as 5min before expiry
  if (diff < 60_000) return t("common.justNow");
  const mins = Math.floor(diff / 60_000);
  if (mins < 60) return t("common.minutesAgo", { minutes: mins });
  const hours = Math.floor(mins / 60);
  return t("common.hoursAgo", { hours });
}

export function SignalTimeline() {
  const { data: market, isLoading } = useMarket();
  const { t } = useTranslation();

  if (isLoading) return <LoadingSkeleton rows={5} />;

  const signals = (market?.pools ?? [])
    .filter((p) => p.latestSignal)
    .map((p) => ({
      ...p.latestSignal!,
      poolId: p.poolId,
      signalValid: p.signalValid,
    }))
    .sort((a, b) => Number(b.expiresAt) - Number(a.expiresAt));

  if (signals.length === 0) {
    return (
      <div className="p-6 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 text-center">
        <span className="material-icons-outlined mb-2 block text-3xl text-zinc-400 dark:text-zinc-600">
          sensors_off
        </span>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">{t("timeline.empty")}</p>
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-500">{t("timeline.emptyHint")}</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-30 [animation-duration:2.4s]" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
          </span>
          <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase">
            {t("timeline.liveLabel")}
          </span>
        </div>
        <span className="text-xs text-zinc-500 dark:text-zinc-500">
          {t("timeline.refreshHint")}
        </span>
      </div>

      {/* Timeline entries */}
      <div className="divide-y divide-zinc-200 dark:divide-zinc-800/50 max-h-[400px] overflow-y-auto">
        {signals.map((sig) => {
          const risk = formatScore(sig.riskScore);
          const alpha = formatScore(sig.alphaScore);
          return (
            <div
              key={sig.signalId}
              className="flex items-center gap-3 px-4 py-3 hover:bg-zinc-100 dark:hover:bg-zinc-800/30 transition-colors"
            >
              {/* Risk indicator dot */}
              <div
                className={`w-2 h-2 rounded-full shrink-0 ${riskBgColor(risk)}`}
              />

              {/* Time */}
              <span className="text-xs text-zinc-500 w-14 shrink-0">
                {relativeTime(sig.expiresAt, t)}
              </span>

              {/* Publisher */}
              <span className="font-mono text-xs text-zinc-500 dark:text-zinc-400 w-24 shrink-0">
                {formatAddress(sig.signer)}
              </span>

              {/* Pool */}
              <span className="hidden w-24 shrink-0 font-mono text-xs text-zinc-500 dark:text-zinc-400 sm:block">
                {formatAddress(sig.poolId)}
              </span>

              {/* Scores */}
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <span className={`text-xs font-medium ${riskColor(risk)}`}>
                  {t("dashboard.riskLabel")}:{risk}
                </span>
                <span className="text-xs font-medium text-emerald-700 dark:text-emerald-300">
                  {t("dashboard.alphaLabel")}:{alpha}
                </span>
                <span className="text-xs text-zinc-500 dark:text-zinc-400">
                  {formatFee(sig.recommendedFee)}
                </span>
              </div>

              {/* Live badge */}
              {sig.signalValid && (
                <span className="inline-flex items-center gap-1 rounded border border-emerald-200 bg-emerald-50 px-1.5 py-0.5 text-[10px] font-medium text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-30 [animation-duration:2.4s]" />
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
                  </span>
                  {t("timeline.live")}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
