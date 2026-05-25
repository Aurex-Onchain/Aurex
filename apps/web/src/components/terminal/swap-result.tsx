"use client";

import { formatAddress, formatFee } from "@/lib/format";
import { useTranslation } from "@/i18n";
import type { PoolStatusResponse } from "@/types/api";

interface ExecutionResult {
  executionId: string;
  status: string;
  results?: { status: string; txHash?: string; error?: string; amountOut?: string }[];
}

interface Props {
  result: ExecutionResult;
  pool?: PoolStatusResponse;
}

export function SwapResult({ result, pool }: Props) {
  const { t } = useTranslation();
  const isCompleted = result.status === "completed";
  const txHash = result.results?.[0]?.txHash;
  const execError = result.results?.[0]?.error;
  const amountOut = result.results?.[0]?.amountOut;

  const signal = pool?.latestSignal;
  const policy = pool?.policy;
  const hasSignal = signal && pool?.signalValid;

  // Calculate publisher revenue: publisherShareBps / 10000 * amountOut
  const publisherRevenue = hasSignal && policy && amountOut
    ? (parseFloat(amountOut) * policy.publisherShareBps / 10000).toFixed(6)
    : null;

  // Error state
  if (execError) {
    return (
      <div className="p-4 rounded-xl border border-red-900/50 bg-red-950/30 text-sm space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs uppercase text-zinc-500">{t("terminal.status")}</span>
          <span className="font-medium text-red-400">{result.status}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs uppercase text-zinc-500">{t("terminal.executionId")}</span>
          <span className="font-mono text-xs text-red-300">{result.executionId.slice(0, 12)}...</span>
        </div>
        <p className="text-red-400 text-xs">{execError}</p>
      </div>
    );
  }

  // Success: Proof-of-Alpha receipt card
  return (
    <div className="rounded-xl border border-emerald-500/20 bg-emerald-950/20 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 bg-emerald-500/10 border-b border-emerald-500/20 flex items-center gap-2">
        <span className="material-icons-outlined text-base text-emerald-400">verified</span>
        <span className="text-sm font-semibold text-emerald-300">{t("terminal.proofOfAlpha")}</span>
        {isCompleted && (
          <span className="ml-auto flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/25 text-emerald-400 text-[10px] font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            {result.status}
          </span>
        )}
      </div>

      <div className="p-4 space-y-3">
        {/* Signal attribution */}
        {hasSignal && (
          <div className="flex items-center gap-2 text-xs">
            <span className="material-icons-outlined text-sm text-emerald-400">auto_awesome</span>
            <span className="text-zinc-300">
              {t("terminal.executedUnderSignal")} <span className="font-mono text-emerald-300">#{signal.signalId.slice(0, 8)}</span>
            </span>
          </div>
        )}

        {/* Publisher info */}
        {hasSignal && (
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-zinc-400">
              <span className="material-icons-outlined text-sm">person</span>
              <span>{t("terminal.signalPublisher")}</span>
            </div>
            <span className="font-mono text-zinc-200">{formatAddress(signal.signer)}</span>
          </div>
        )}

        {/* Fee comparison */}
        {hasSignal && policy && (
          <div className="flex items-center justify-between text-xs">
            <span className="text-zinc-400">{t("terminal.feeApplied")}</span>
            <div className="flex items-center gap-2">
              <span className="text-emerald-300 font-medium">{formatFee(signal.recommendedFee)}</span>
              <span className="text-zinc-600">|</span>
              <span className="text-zinc-500">{t("terminal.vsDefault")} {formatFee(policy.defaultFee)}</span>
            </div>
          </div>
        )}

        {/* Publisher revenue */}
        {publisherRevenue && (
          <div className="flex items-center justify-between text-xs">
            <span className="text-zinc-400">{t("terminal.publisherRevenue")}</span>
            <div className="flex items-center gap-1.5">
              <span className="text-emerald-300 font-medium">{publisherRevenue}</span>
              <span className="text-zinc-600 text-[10px]">{t("terminal.fromThisSwap")}</span>
            </div>
          </div>
        )}

        {/* Divider */}
        <div className="border-t border-emerald-500/10" />

        {/* Execution ID */}
        <div className="flex items-center justify-between text-xs">
          <span className="text-zinc-500">{t("terminal.executionId")}</span>
          <span className="font-mono text-zinc-400">{result.executionId.slice(0, 12)}...</span>
        </div>

        {/* Tx Hash with explorer link */}
        {txHash && (
          <div className="flex items-center justify-between text-xs">
            <span className="text-zinc-500">{t("terminal.txHash")}</span>
            <a
              href={`https://etherscan.io/tx/${txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 font-mono text-emerald-400 hover:text-emerald-300 transition-colors"
            >
              {formatAddress(txHash)}
              <span className="material-icons-outlined text-xs">open_in_new</span>
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

export type { ExecutionResult };
