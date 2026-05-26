"use client";

import { useMarket } from "@/hooks/use-market";
import { formatAddress, formatFee, formatScore, timeUntilExpiry } from "@/lib/format";
import { SignalBadge } from "@/components/ui/signal-badge";
import { LoadingSkeleton } from "@/components/ui/loading-skeleton";
import { useTranslation } from "@/i18n";

export function LatestSignals() {
  const { data: market, isLoading } = useMarket();
  const { t } = useTranslation();

  if (isLoading) return <LoadingSkeleton rows={4} />;

  const signals = (market?.pools ?? [])
    .filter((p) => p.latestSignal)
    .map((p) => ({ ...p.latestSignal!, poolId: p.poolId, valid: p.signalValid, verified: p.verified, slashed: p.slashed }));

  if (signals.length === 0) {
    return (
      <div className="p-6 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
        <p className="text-zinc-500 text-sm">{t("dashboard.noSignals")}</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-zinc-50 dark:bg-zinc-900">
          <tr className="text-left text-xs text-zinc-500 uppercase">
            <th className="px-4 py-3">{t("signals.colPool")}</th>
            <th className="px-4 py-3">{t("signals.colRisk")}</th>
            <th className="px-4 py-3">{t("signals.colAlpha")}</th>
            <th className="px-4 py-3">{t("signals.colFee")}</th>
            <th className="px-4 py-3">{t("signals.colExpires")}</th>
            <th className="px-4 py-3">{t("signals.colSigner")}</th>
            <th className="px-4 py-3">{t("signals.colStatus")}</th>
            <th className="px-4 py-3">{t("signals.colVerification")}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
          {signals.map((sig) => (
            <tr key={sig.signalId} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/50">
              <td className="px-4 py-3 font-mono text-zinc-700 dark:text-zinc-300">
                {formatAddress(sig.poolId)}
              </td>
              <td className="px-4 py-3">
                <SignalBadge score={formatScore(sig.riskScore)} />
              </td>
              <td className="px-4 py-3">
                <SignalBadge score={formatScore(sig.alphaScore)} />
              </td>
              <td className="px-4 py-3 text-zinc-400">
                {formatFee(sig.recommendedFee)}
              </td>
              <td className="px-4 py-3 text-zinc-400">
                {timeUntilExpiry(sig.expiresAt)}
              </td>
              <td className="px-4 py-3 font-mono text-zinc-400">
                {formatAddress(sig.signer)}
              </td>
              <td className="px-4 py-3">
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded text-xs ${
                    sig.valid
                      ? "bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-400"
                      : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500"
                  }`}
                >
                  {sig.valid ? t("signals.statusValid") : t("signals.statusExpired")}
                </span>
              </td>
              <td className="px-4 py-3">
                {sig.slashed ? (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400">
                    {t("signals.slashed")}
                  </span>
                ) : sig.verified ? (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400">
                    {t("signals.verified")}
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-zinc-100 dark:bg-zinc-800 text-zinc-500">
                    {t("signals.pending")}
                  </span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
