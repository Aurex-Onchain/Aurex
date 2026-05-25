"use client";

import { useState, useEffect } from "react";
import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { CONTRACTS, signalRegistryVerifyAbi } from "@/lib/contracts";
import { useTranslation } from "@/i18n";

type VerificationStatus = "active" | "pending" | "verified" | "slashed";

interface VerificationBadgeProps {
  signalId: string;
  valid: boolean;
  verified: boolean | null;
  slashed: boolean | null;
  onVerified?: () => void;
}

function getStatus(valid: boolean, verified: boolean | null, slashed: boolean | null): VerificationStatus {
  if (valid) return "active";
  if (slashed) return "slashed";
  if (verified) return "verified";
  return "pending";
}

export function VerificationBadge({ signalId, valid, verified, slashed, onVerified }: VerificationBadgeProps) {
  const { t } = useTranslation();
  const [showResult, setShowResult] = useState(false);
  const status = getStatus(valid, verified, slashed);

  const {
    writeContract,
    data: hash,
    isPending,
    error,
    reset,
  } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  useEffect(() => {
    if (isSuccess) {
      setShowResult(true);
      onVerified?.();
      const timer = setTimeout(() => setShowResult(false), 4000);
      return () => clearTimeout(timer);
    }
  }, [isSuccess, onVerified]);

  function handleVerify() {
    writeContract({
      address: CONTRACTS.signalRegistry,
      abi: signalRegistryVerifyAbi,
      functionName: "verifySignal",
      args: [signalId as `0x${string}`],
    });
  }

  // Badge styles per status
  const badgeStyles: Record<VerificationStatus, string> = {
    active: "bg-indigo-900/50 text-indigo-400 border-indigo-800/50",
    pending: "bg-amber-900/50 text-amber-400 border-amber-800/50",
    verified: "bg-emerald-900/50 text-emerald-400 border-emerald-800/50",
    slashed: "bg-red-900/50 text-red-400 border-red-800/50",
  };

  const badgeLabels: Record<VerificationStatus, string> = {
    active: t("signals.active"),
    pending: t("signals.pending"),
    verified: t("signals.verified"),
    slashed: t("signals.slashed"),
  };

  // Show success toast inline
  if (showResult) {
    return (
      <div className="flex items-center gap-1.5 animate-in fade-in duration-300">
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-900/50 text-emerald-400 border border-emerald-800/50">
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          {t("signals.verifySuccess")}
        </span>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="flex items-center gap-1.5">
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-900/50 text-red-400 border border-red-800/50">
          Error
        </span>
        <button
          onClick={() => reset()}
          className="text-xs text-zinc-500 hover:text-zinc-300 underline"
        >
          {t("terminal.dismiss")}
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {/* Status badge */}
      <span
        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${badgeStyles[status]}`}
      >
        {badgeLabels[status]}
      </span>

      {/* Verify button for pending signals */}
      {status === "pending" && (
        <button
          onClick={handleVerify}
          disabled={isPending || isConfirming}
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded border border-zinc-700 text-xs text-zinc-400 hover:text-white hover:border-zinc-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {isPending || isConfirming ? (
            <>
              <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              {t("signals.verifying")}
            </>
          ) : (
            <>
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {t("signals.verify")}
            </>
          )}
        </button>
      )}
    </div>
  );
}
