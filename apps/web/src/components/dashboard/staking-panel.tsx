"use client";

import { useState } from "react";
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { parseUnits, formatUnits } from "viem";
import { CONTRACTS, signalRegistryStakingAbi, erc20Abi } from "@/lib/contracts";
import { useTranslation } from "@/i18n";

const MIN_STAKE = BigInt(100);
const AUREX_DECIMALS = 18;

export function StakingPanel() {
  const { t } = useTranslation();
  const { address, isConnected } = useAccount();
  const [amount, setAmount] = useState("100");
  const [step, setStep] = useState<"idle" | "approving" | "staking">("idle");

  // Read publisher info
  const { data: publisherInfo, refetch: refetchPublisher } = useReadContract({
    address: CONTRACTS.signalRegistry,
    abi: signalRegistryStakingAbi,
    functionName: "getPublisherInfo",
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  // Approve tx
  const {
    writeContract: writeApprove,
    data: approveHash,
    isPending: approvePending,
    error: approveError,
    reset: resetApprove,
  } = useWriteContract();

  const { isLoading: approveConfirming, isSuccess: approveSuccess } =
    useWaitForTransactionReceipt({ hash: approveHash });

  // Register / Increase stake tx
  const {
    writeContract: writeStake,
    data: stakeHash,
    isPending: stakePending,
    error: stakeError,
    reset: resetStake,
  } = useWriteContract();

  const { isLoading: stakeConfirming, isSuccess: stakeSuccess } =
    useWaitForTransactionReceipt({ hash: stakeHash });

  // Unregister tx
  const {
    writeContract: writeUnregister,
    data: unregisterHash,
    isPending: unregisterPending,
    error: unregisterError,
    reset: resetUnregister,
  } = useWriteContract();
  const { isLoading: unregisterConfirming, isSuccess: unregisterSuccess } =
    useWaitForTransactionReceipt({ hash: unregisterHash });

  const isRegistered = publisherInfo && (publisherInfo as any).active;
  const currentStake = publisherInfo ? (publisherInfo as any).stakeAmount : BigInt(0);

  function handleApproveAndStake(functionName: "registerPublisher" | "increaseStake") {
    const parsedAmount = parseUnits(amount || "0", AUREX_DECIMALS);
    if (parsedAmount < parseUnits(String(MIN_STAKE), AUREX_DECIMALS) && functionName === "registerPublisher") return;

    setStep("approving");
    writeApprove(
      {
        address: CONTRACTS.aurexToken,
        abi: erc20Abi,
        functionName: "approve",
        args: [CONTRACTS.signalRegistry, parsedAmount],
      },
      {
        onSuccess: () => {
          setStep("staking");
          writeStake({
            address: CONTRACTS.signalRegistry,
            abi: signalRegistryStakingAbi,
            functionName,
            args: [parsedAmount],
          }, {
            onSuccess: () => {
              setStep("idle");
              refetchPublisher();
            },
            onError: () => setStep("idle"),
          });
        },
        onError: () => setStep("idle"),
      }
    );
  }

  function handleUnregister() {
    writeUnregister({
      address: CONTRACTS.signalRegistry,
      abi: signalRegistryStakingAbi,
      functionName: "unregisterPublisher",
      args: [],
    }, {
      onSuccess: () => refetchPublisher(),
    });
  }

  if (!isConnected) {
    return (
      <div className="p-6 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 text-center">
        <p className="text-zinc-500 dark:text-zinc-400">{t("staking.connectWallet")}</p>
      </div>
    );
  }

  const txError = approveError || stakeError || unregisterError;
  const isBusy = approvePending || approveConfirming || stakePending || stakeConfirming || unregisterPending || unregisterConfirming;

  return (
    <div className="p-6 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 space-y-4">
      <div className="flex items-center gap-2">
        <span className="material-icons-outlined text-emerald-400 text-xl">token</span>
        <h3 className="text-sm font-semibold text-zinc-500 dark:text-zinc-400 uppercase">
          {t("staking.title")}
        </h3>
      </div>

      {!isRegistered ? (
        /* --- Not registered: Become Publisher --- */
        <div className="space-y-3">
          <p className="text-sm text-zinc-700 dark:text-zinc-300">{t("staking.becomePublisher")}</p>
          <p className="text-xs text-zinc-500">{t("staking.minStakeHint")}</p>
          <div className="flex items-center gap-3">
            <input
              type="number"
              min="100"
              step="1"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="100"
              className="w-40 px-3 py-2 rounded bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-sm text-zinc-900 dark:text-zinc-200 placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none focus:border-emerald-500"
            />
            <span className="text-xs text-zinc-500">AUREX</span>
          </div>
          <button
            onClick={() => handleApproveAndStake("registerPublisher")}
            disabled={isBusy || !amount || Number(amount) < 100}
            className="flex items-center gap-2 px-4 py-2 rounded bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <span className="material-icons-outlined text-base">how_to_reg</span>
            {approvePending || approveConfirming
              ? t("staking.approving")
              : stakePending || stakeConfirming
              ? t("staking.registering")
              : t("staking.register")}
          </button>
        </div>
      ) : (
        /* --- Registered: Show stake info + actions --- */
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div>
              <p className="text-xs text-zinc-500 uppercase">{t("staking.currentStake")}</p>
              <p className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                {formatUnits(currentStake, AUREX_DECIMALS)} AUREX
              </p>
            </div>
            <span className="material-icons-outlined text-emerald-400">verified</span>
          </div>

          {/* Increase Stake */}
          <div className="space-y-2">
            <p className="text-sm text-zinc-700 dark:text-zinc-300">{t("staking.increaseStake")}</p>
            <div className="flex items-center gap-3">
              <input
                type="number"
                min="1"
                step="1"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="100"
                className="w-40 px-3 py-2 rounded bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-sm text-zinc-900 dark:text-zinc-200 placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none focus:border-emerald-500"
              />
              <button
                onClick={() => handleApproveAndStake("increaseStake")}
                disabled={isBusy || !amount || Number(amount) <= 0}
                className="flex items-center gap-2 px-4 py-2 rounded bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <span className="material-icons-outlined text-base">add_circle</span>
                {step === "approving"
                  ? t("staking.approving")
                  : step === "staking"
                  ? t("staking.staking")
                  : t("staking.stake")}
              </button>
            </div>
          </div>

          {/* Withdraw / Unregister */}
          <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800 space-y-2">
            <p className="text-xs text-amber-400 flex items-center gap-1">
              <span className="material-icons-outlined text-sm">warning</span>
              {t("staking.cooldownWarning")}
            </p>
            <button
              onClick={handleUnregister}
              disabled={isBusy}
              className="flex items-center gap-2 px-4 py-2 rounded bg-zinc-100 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-red-500 dark:text-red-400 text-sm font-medium hover:bg-zinc-200 dark:hover:bg-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <span className="material-icons-outlined text-base">logout</span>
              {unregisterPending || unregisterConfirming
                ? t("staking.withdrawing")
                : t("staking.withdraw")}
            </button>
          </div>
        </div>
      )}

      {/* Transaction status */}
      {(stakeSuccess || unregisterSuccess) && (
        <div className="p-3 rounded border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50 dark:bg-emerald-950/30 text-sm text-emerald-700 dark:text-emerald-400 flex items-center gap-2">
          <span className="material-icons-outlined text-base">check_circle</span>
          {t("staking.success")}
        </div>
      )}

      {txError && (
        <div className="p-3 rounded border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/30 text-sm text-red-700 dark:text-red-400">
          {txError.message.slice(0, 200)}
          <button
            onClick={() => { resetApprove(); resetStake(); resetUnregister(); }}
            className="ml-2 underline text-xs text-red-600 dark:text-red-500 hover:text-red-800 dark:hover:text-red-300"
          >
            {t("staking.dismiss")}
          </button>
        </div>
      )}
    </div>
  );
}
