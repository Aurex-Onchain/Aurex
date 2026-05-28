"use client";

import { useMarket } from "@/hooks/use-market";
import { formatAddress } from "@/lib/format";
import { SignalBadge } from "@/components/ui/signal-badge";
import { LoadingSkeleton } from "@/components/ui/loading-skeleton";
import { useTranslation } from "@/i18n";
import { CollapsibleHeader } from "@/components/ui/collapsible-header";
import { AnimatedNumber, useNumberFlash } from "@/components/motion/animated-number";

export default function HookPoolsPage() {
  const { data: market, isLoading } = useMarket();
  const { t } = useTranslation();

  const pools = market?.pools ?? [];
  const activeHookActions = pools.filter(
    (pool) => pool.signalValid && pool.latestSignal && pool.policy && pool.latestSignal.recommendedFee !== pool.policy.defaultFee,
  );

  return (
    <CollapsibleHeader title={t("hookPools.title")} description={t("hookPools.description")}>
      <div className="px-3 sm:px-5 pb-8">

      {isLoading ? (
        <LoadingSkeleton rows={4} />
      ) : pools.length === 0 ? (
        <div className="p-6 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
          <p className="text-zinc-500 text-sm">
            {t("hookPools.noPools")}
          </p>
        </div>
      ) : (
        <>
        {activeHookActions.length > 0 && (
          <div className="mb-4">
            <HookActionSummary
              actionCount={activeHookActions.length}
              defaultFee={activeHookActions[0].policy?.defaultFee ?? 0}
              dynamicFee={activeHookActions[0].latestSignal?.recommendedFee ?? 0}
              poolId={activeHookActions[0].poolId}
              riskScore={Number(activeHookActions[0].latestSignal?.riskScore ?? 0)}
              labels={{
                applied: t("hookPools.actionApplied"),
                active: t("hookPools.actionsActive"),
                feeEscalated: t("hookPools.feeEscalated"),
                feeRelaxed: t("hookPools.feeRelaxed"),
              }}
            />
          </div>
        )}
        <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 overflow-x-auto">
          <table className="w-full text-sm min-w-[700px]">
            <thead className="bg-zinc-50 dark:bg-zinc-900">
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
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {pools.map((pool) => (
                <tr key={pool.poolId} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/50">
                  <td className="px-4 py-3 font-mono text-zinc-700 dark:text-zinc-300">
                    {formatAddress(pool.poolId)}
                  </td>
                  <td className="px-4 py-3">
                    <SignalStatusPill active={pool.signalValid} activeLabel={t("hookPools.signalActive")} idleLabel={t("hookPools.signalNone")} />
                  </td>
                  <td className="px-4 py-3">
                    {pool.latestSignal ? (
                      <SignalBadge score={Number(pool.latestSignal.riskScore)} />
                    ) : (
                      <span className="text-zinc-600">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-zinc-400">
                    {pool.policy ? <AnimatedFee value={pool.policy.defaultFee} /> : "—"}
                  </td>
                  <td className="px-4 py-3 text-zinc-400">
                    {pool.policy ? <AnimatedFee value={pool.policy.maxFee} /> : "—"}
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
        </>
      )}
      </div>
    </CollapsibleHeader>
  );
}

function HookActionSummary({
  actionCount,
  defaultFee,
  dynamicFee,
  poolId,
  riskScore,
  labels,
}: {
  actionCount: number;
  defaultFee: number;
  dynamicFee: number;
  poolId: string;
  riskScore: number;
  labels: {
    applied: string;
    active: string;
    feeEscalated: string;
    feeRelaxed: string;
  };
}) {
  const escalated = dynamicFee >= defaultFee;

  return (
    <div className="hook-action scanner-panel rounded-2xl border border-emerald-500/25 bg-emerald-50/70 p-4 backdrop-blur-sm dark:bg-emerald-950/20">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-emerald-300 bg-white/70 text-emerald-600 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300">
            <span className="material-icons-outlined" style={{ fontSize: "20px", lineHeight: 1 }}>bolt</span>
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase text-emerald-700 dark:text-emerald-300">
              {labels.applied}
            </p>
            <p className="truncate font-mono text-xs text-zinc-500 dark:text-zinc-400">{formatAddress(poolId)}</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="rounded border border-zinc-200 bg-white/70 px-2 py-1 text-xs font-medium text-zinc-600 dark:border-zinc-800 dark:bg-zinc-950/50 dark:text-zinc-300">
            {actionCount} {labels.active}
          </span>
          <span className="rounded border border-zinc-200 bg-white/70 px-2 py-1 font-mono text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950/50">
            <AnimatedFee value={defaultFee} />
          </span>
          <span className="material-icons-outlined text-sm text-emerald-500">arrow_forward</span>
          <span className="rounded border border-emerald-200 bg-emerald-100/80 px-2 py-1 font-mono font-semibold text-emerald-700 dark:border-emerald-500/25 dark:bg-emerald-500/10 dark:text-emerald-300">
            <AnimatedFee value={dynamicFee} />
          </span>
          <span className="rounded border border-zinc-200 bg-white/70 px-2 py-1 text-xs font-medium text-zinc-600 dark:border-zinc-800 dark:bg-zinc-950/50 dark:text-zinc-300">
            {escalated ? labels.feeEscalated : labels.feeRelaxed} · risk <AnimatedNumber value={riskScore} />
          </span>
        </div>
      </div>
    </div>
  );
}

function AnimatedFee({ value }: { value: number }) {
  const percent = value / 100;
  const flash = useNumberFlash(percent);

  return (
    <span className={`inline-flex rounded px-0.5 ${flash}`}>
      <AnimatedNumber value={percent} decimals={2} suffix="%" />
    </span>
  );
}

function SignalStatusPill({ active, activeLabel, idleLabel }: { active: boolean; activeLabel: string; idleLabel: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded px-2 py-0.5 text-xs ${
        active
          ? "border border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/25 dark:bg-emerald-500/10 dark:text-emerald-300"
          : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800"
      }`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${active ? "live-dot bg-emerald-500 text-emerald-500 dark:bg-emerald-300 dark:text-emerald-300" : "bg-zinc-500"}`} />
      {active ? activeLabel : idleLabel}
    </span>
  );
}
