"use client";

import { useState } from "react";
import { useMarket } from "@/hooks/use-market";
import { formatAddress, formatScore, timeUntilExpiry } from "@/lib/format";
import { SignalBadge } from "@/components/ui/signal-badge";
import { LoadingSkeleton } from "@/components/ui/loading-skeleton";
import { VerificationBadge } from "@/components/signals/verification-badge";
import { useTranslation } from "@/i18n";
import { AnimatedNumber, useNumberFlash } from "@/components/motion/animated-number";

type Filter = "all" | "valid" | "expired";

export function SignalTable() {
  const { data: market, isLoading, refetch } = useMarket();
  const [filter, setFilter] = useState<Filter>("all");
  const { t } = useTranslation();

  if (isLoading) return <LoadingSkeleton rows={6} />;

  const allSignals = (market?.pools ?? [])
    .filter((p) => p.latestSignal)
    .map((p) => ({
      ...p.latestSignal!,
      poolId: p.poolId,
      valid: p.signalValid,
      policy: p.policy,
      verified: p.verified,
      slashed: p.slashed,
    }));

  const signals =
    filter === "all"
      ? allSignals
      : filter === "valid"
        ? allSignals.filter((s) => s.valid)
        : allSignals.filter((s) => !s.valid);

  if (allSignals.length === 0) {
    return (
      <div className="p-6 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
        <p className="text-zinc-500 text-sm">
          {t("signals.noSignals")}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {(["all", "valid", "expired"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
              filter === f
                ? "bg-zinc-200 dark:bg-zinc-700 text-zinc-900 dark:text-white"
                : "bg-zinc-100 dark:bg-zinc-900 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
            }`}
          >
            {t(`signals.filter${f.charAt(0).toUpperCase() + f.slice(1)}` as "signals.filterAll" | "signals.filterValid" | "signals.filterExpired")}
            {f === "all" && ` (${allSignals.length})`}
            {f === "valid" && ` (${allSignals.filter((s) => s.valid).length})`}
            {f === "expired" && ` (${allSignals.filter((s) => !s.valid).length})`}
          </button>
        ))}
      </div>

      <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 overflow-x-auto">
        <table className="w-full text-sm min-w-[800px]">
          <thead className="bg-zinc-50 dark:bg-zinc-900">
            <tr className="text-left text-xs text-zinc-500 uppercase">
              <th className="px-4 py-3">{t("signals.colPool")}</th>
              <th className="px-4 py-3">{t("signals.colRisk")}</th>
              <th className="px-4 py-3">{t("signals.colAlpha")}</th>
              <th className="px-4 py-3">{t("signals.colLiquidity")}</th>
              <th className="px-4 py-3">{t("signals.colVolatility")}</th>
              <th className="px-4 py-3">{t("signals.colFee")}</th>
              <th className="px-4 py-3">{t("signals.colExpires")}</th>
              <th className="px-4 py-3">{t("signals.colSigner")}</th>
              <th className="px-4 py-3">{t("signals.colStatus")}</th>
              <th className="px-4 py-3">{t("signals.colVerification")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {signals.map((sig) => (
              <tr key={sig.signalId} className="transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-900/50">
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
                  <AnimatedScoreText value={formatScore(sig.liquidityScore)} />
                </td>
                <td className="px-4 py-3 text-zinc-400">
                  <AnimatedScoreText value={formatScore(sig.volatilityScore)} />
                </td>
                <td className="px-4 py-3 text-zinc-400">
                  <AnimatedFee value={sig.recommendedFee} />
                </td>
                <td className="px-4 py-3 text-zinc-400">
                  {timeUntilExpiry(sig.expiresAt)}
                </td>
                <td className="px-4 py-3 font-mono text-zinc-400">
                  {formatAddress(sig.signer)}
                </td>
                <td className="px-4 py-3">
                  <StatusPill valid={sig.valid} validLabel={t("signals.statusValid")} expiredLabel={t("signals.statusExpired")} />
                </td>
                <td className="px-4 py-3">
                  <VerificationBadge
                    signalId={sig.signalId}
                    valid={sig.valid}
                    verified={sig.verified}
                    slashed={sig.slashed}
                    onVerified={() => refetch()}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AnimatedScoreText({ value }: { value: number }) {
  const flash = useNumberFlash(value);

  return (
    <span className={`inline-flex rounded px-1 font-mono text-zinc-500 dark:text-zinc-400 ${flash}`}>
      <AnimatedNumber value={value} />
    </span>
  );
}

function AnimatedFee({ value }: { value: number }) {
  const percent = value / 100;
  const flash = useNumberFlash(percent);

  return (
    <span className={`inline-flex rounded px-1 font-mono text-zinc-500 dark:text-zinc-400 ${flash}`}>
      <AnimatedNumber value={percent} decimals={2} suffix="%" />
    </span>
  );
}

function StatusPill({ valid, validLabel, expiredLabel }: { valid: boolean; validLabel: string; expiredLabel: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded px-2 py-0.5 text-xs ${
        valid
          ? "border border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/25 dark:bg-emerald-500/10 dark:text-emerald-300"
          : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800"
      }`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${valid ? "live-dot bg-emerald-500 text-emerald-500 dark:bg-emerald-300 dark:text-emerald-300" : "bg-zinc-500"}`} />
      {valid ? validLabel : expiredLabel}
    </span>
  );
}
