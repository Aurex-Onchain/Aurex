"use client";

import { useState } from "react";
import { useMarket } from "@/hooks/use-market";
import { formatAddress, formatFee } from "@/lib/format";
import { LoadingSkeleton } from "@/components/ui/loading-skeleton";
import { PoolSelector } from "@/components/terminal/pool-selector";
import { SwapForm } from "@/components/terminal/swap-form";
import { SignalIndicator } from "@/components/terminal/signal-indicator";
import { useTranslation } from "@/i18n";
import { CollapsibleHeader } from "@/components/ui/collapsible-header";

export default function TerminalPage() {
  const { data: market, isLoading } = useMarket();
  const [selectedPoolId, setSelectedPoolId] = useState("");
  const { t } = useTranslation();

  const pools = market?.pools ?? [];
  const activePool = selectedPoolId
    ? pools.find((p) => p.poolId === selectedPoolId)
    : pools.find((p) => p.signalValid) ?? pools[0];

  const signal = activePool?.latestSignal;
  const policy = activePool?.policy;

  return (
    <CollapsibleHeader title={t("terminal.title")}>
      <div className="px-3 sm:px-5 pb-8">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5 items-stretch">
            {/* Pool Selector Card */}
            <div className="relative z-20 order-1 lg:order-none lg:col-span-5 p-5 rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-50/60 dark:bg-zinc-900/60 backdrop-blur-sm">
              <div className="flex items-center gap-2 mb-3">
                <span className="material-icons-outlined text-sm text-emerald-400">layers</span>
                <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">
                  {t("terminal.pool")}
                </h3>
              </div>
              {isLoading ? (
                <LoadingSkeleton rows={1} />
              ) : (
                <PoolSelector pools={pools} value={selectedPoolId} onChange={setSelectedPoolId} />
              )}
            </div>

            {/* Signal Indicator */}
            <div className="order-3 lg:order-none lg:col-span-7 lg:col-start-6 p-5 rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-50/60 dark:bg-zinc-900/60 backdrop-blur-sm">
              <div className="flex items-center gap-2 mb-3">
                <span className="material-icons-outlined text-sm text-emerald-400">sensors</span>
                <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">
                  {t("terminal.activeSignal")}
                </h3>
              </div>
              {isLoading ? (
                <LoadingSkeleton rows={3} />
              ) : (
                <SignalIndicator
                  signal={signal ?? null}
                  policy={policy ?? null}
                  signalValid={activePool?.signalValid ?? false}
                />
              )}
            </div>

            {/* Swap Card */}
            <div className="order-2 lg:order-none lg:col-span-5 p-5 rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-50/60 dark:bg-zinc-900/60 backdrop-blur-sm">
              {activePool ? (
                <SwapForm pool={activePool} />
              ) : (
                <div className="flex h-full flex-col items-center justify-center py-8">
                  <span className="material-icons-outlined text-3xl text-zinc-600 mb-2">swap_horiz</span>
                  <p className="text-zinc-500 text-sm">{t("terminal.selectPool")}</p>
                </div>
              )}
            </div>

            {/* Pool Details Card */}
            {activePool && policy && (
              <div className="order-4 lg:order-none lg:col-span-7 lg:col-start-6 p-5 rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-50/60 dark:bg-zinc-900/60 backdrop-blur-sm">
                <div className="flex items-center gap-2 mb-4">
                  <span className="material-icons-outlined text-sm text-emerald-400">info</span>
                  <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">
                    {t("terminal.poolDetails")}
                  </h3>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <InfoItem
                    label={t("terminal.defaultFee")}
                    value={formatFee(policy.defaultFee)}
                  />
                  <InfoItem
                    label={t("terminal.maxFee")}
                    value={formatFee(policy.maxFee)}
                  />
                  <InfoItem
                    label={t("terminal.publisherShare")}
                    value={`${policy.publisherShareBps} bps`}
                  />
                  <InfoItem
                    label={t("terminal.highRiskBlock")}
                    value={policy.blockHighRiskTrades ? t("common.yes") : t("common.no")}
                  />
                  {signal && (
                    <>
                      <InfoItem
                        label={t("terminal.publisher")}
                        value={formatAddress(signal.signer)}
                        mono
                      />
                      <InfoItem
                        label={t("terminal.currentFee")}
                        value={formatFee(signal.recommendedFee)}
                        highlight
                      />
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Execution Info */}
            <div className="order-5 lg:order-none lg:col-span-7 lg:col-start-6 p-5 rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-50/60 dark:bg-zinc-900/60 backdrop-blur-sm">
              <div className="flex items-center gap-2 mb-3">
                <span className="material-icons-outlined text-sm text-emerald-400">bolt</span>
                <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">
                  {t("terminal.executionInfo")}
                </h3>
              </div>
              <div className="flex items-start gap-3 text-xs text-zinc-500">
                <span className="material-icons-outlined text-sm mt-0.5">info</span>
                <p className="leading-relaxed">{t("terminal.executionNote")}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </CollapsibleHeader>
  );
}

function InfoItem({ label, value, mono, highlight }: { label: string; value: string; mono?: boolean; highlight?: boolean }) {
  return (
    <div className="space-y-1">
      <p className="text-xs text-zinc-500">{label}</p>
      <p className={`text-sm font-medium ${highlight ? "text-emerald-400" : "text-zinc-700 dark:text-zinc-200"} ${mono ? "font-mono" : ""}`}>
        {value}
      </p>
    </div>
  );
}
