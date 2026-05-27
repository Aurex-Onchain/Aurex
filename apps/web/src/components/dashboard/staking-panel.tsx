"use client";

import { useState } from "react";
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { parseUnits, formatUnits } from "viem";
import { CONTRACTS, signalRegistryStakingAbi, erc20Abi } from "@/lib/contracts";
import { useTranslation } from "@/i18n";

const MIN_STAKE = BigInt(100);
const AUREX_DECIMALS = 18;

type PublisherInfo = {
  stakeAmount: bigint;
  active: boolean;
};

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

  const { isLoading: approveConfirming } =
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

  const publisher = publisherInfo as PublisherInfo | undefined;
  const isRegistered = Boolean(publisher?.active);
  const currentStake = publisher?.stakeAmount ?? BigInt(0);

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
      <div className="rounded-2xl border border-zinc-200/80 bg-zinc-50/60 p-4 backdrop-blur-sm dark:border-zinc-800/80 dark:bg-zinc-900/60 sm:p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/25 dark:bg-emerald-500/10 dark:text-emerald-200">
              <span className="material-icons-outlined" style={{ fontSize: "20px", lineHeight: 1 }}>
                account_balance_wallet
              </span>
            </span>
            <div className="min-w-0">
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                {t("staking.title")}
              </h3>
              <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
                {t("staking.connectWallet")}
              </p>
            </div>
          </div>
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 px-3 py-2 dark:border-emerald-500/20 dark:bg-emerald-500/10">
            <p className="text-[11px] font-medium text-emerald-700 dark:text-emerald-200">{t("staking.minimum")}</p>
            <p className="mt-1 text-sm font-semibold text-emerald-800 dark:text-emerald-100">
              {MIN_STAKE.toString()} AUREX
            </p>
          </div>
        </div>
      </div>
    );
  }

  const txError = approveError || stakeError || unregisterError;
  const isBusy = approvePending || approveConfirming || stakePending || stakeConfirming || unregisterPending || unregisterConfirming;
  const currentStakeLabel = `${formatUnits(currentStake, AUREX_DECIMALS)} AUREX`;

  return (
    <div className="rounded-2xl border border-zinc-200/80 bg-zinc-50/60 p-4 backdrop-blur-sm dark:border-zinc-800/80 dark:bg-zinc-900/60 sm:p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/25 dark:bg-emerald-500/10 dark:text-emerald-200">
            <span className="material-icons-outlined" style={{ fontSize: "20px", lineHeight: 1 }}>
              token
            </span>
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                {t("staking.title")}
              </h3>
              <span className={`inline-flex h-[26px] items-center rounded-md border px-2 text-[11px] font-semibold ${
                isRegistered
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/25 dark:bg-emerald-500/10 dark:text-emerald-200"
                  : "border-zinc-200 bg-white/60 text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950/60 dark:text-zinc-400"
              }`}
              >
                {isRegistered ? t("staking.active") : t("staking.ready")}
              </span>
            </div>
            <p className="mt-1 max-w-2xl text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">
              {t("staking.becomePublisher")}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:min-w-64">
          <div className="rounded-xl border border-zinc-200 bg-white/60 px-3 py-2 dark:border-zinc-800 dark:bg-zinc-950/40">
            <p className="text-[11px] font-medium text-zinc-500">{t("staking.currentStake")}</p>
            <p className="mt-1 truncate text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              {currentStakeLabel}
            </p>
          </div>
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 px-3 py-2 dark:border-emerald-500/20 dark:bg-emerald-500/10">
            <p className="text-[11px] font-medium text-emerald-700 dark:text-emerald-200">{t("staking.minimum")}</p>
            <p className="mt-1 text-sm font-semibold text-emerald-800 dark:text-emerald-100">
              {MIN_STAKE.toString()} AUREX
            </p>
          </div>
        </div>
      </div>

      {!isRegistered ? (
        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-end">
          <label className="min-w-0 flex-1">
            <span className="mb-1 block text-[11px] font-medium text-zinc-500">{t("staking.stake")}</span>
            <div className="flex h-11 items-center rounded-xl border border-zinc-200 bg-white/70 px-3 dark:border-zinc-800 dark:bg-zinc-950/50">
              <input
                type="number"
                min="100"
                step="1"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="100"
                className="min-w-0 flex-1 bg-transparent text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none dark:text-zinc-100 dark:placeholder-zinc-600"
              />
              <span className="shrink-0 text-xs font-semibold text-zinc-500">AUREX</span>
            </div>
          </label>
          <button
            onClick={() => handleApproveAndStake("registerPublisher")}
            disabled={isBusy || !amount || Number(amount) < 100}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-emerald-600 bg-emerald-700 px-4 text-sm font-semibold text-white transition-colors hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-40 sm:min-w-44"
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
        <div className="mt-5 space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <label className="min-w-0 flex-1">
              <span className="mb-1 block text-[11px] font-medium text-zinc-500">{t("staking.increaseStake")}</span>
              <div className="flex h-11 items-center rounded-xl border border-zinc-200 bg-white/70 px-3 dark:border-zinc-800 dark:bg-zinc-950/50">
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="100"
                  className="min-w-0 flex-1 bg-transparent text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none dark:text-zinc-100 dark:placeholder-zinc-600"
                />
                <span className="shrink-0 text-xs font-semibold text-zinc-500">AUREX</span>
              </div>
            </label>
            <button
              onClick={() => handleApproveAndStake("increaseStake")}
              disabled={isBusy || !amount || Number(amount) <= 0}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-emerald-600 bg-emerald-700 px-4 text-sm font-semibold text-white transition-colors hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-40 sm:min-w-36"
            >
              <span className="material-icons-outlined text-base">add_circle</span>
              {step === "approving"
                ? t("staking.approving")
                : step === "staking"
                ? t("staking.staking")
                : t("staking.stake")}
            </button>
          </div>

          <div className="flex flex-col gap-3 rounded-xl border border-zinc-200 bg-white/50 p-3 dark:border-zinc-800 dark:bg-zinc-950/30 sm:flex-row sm:items-center sm:justify-between">
            <p className="flex min-w-0 items-center gap-2 text-sm text-zinc-600 dark:text-zinc-300">
              <span className="material-icons-outlined text-base text-emerald-600 dark:text-emerald-300">schedule</span>
              {t("staking.cooldownWarning")}
            </p>
            <button
              onClick={handleUnregister}
              disabled={isBusy}
              className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-zinc-300 bg-zinc-100 px-3 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
            >
              <span className="material-icons-outlined text-base">logout</span>
              {unregisterPending || unregisterConfirming
                ? t("staking.withdrawing")
                : t("staking.withdraw")}
            </button>
          </div>
        </div>
      )}

      {(stakeSuccess || unregisterSuccess) && (
        <div className="mt-4 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700 dark:border-emerald-500/25 dark:bg-emerald-500/10 dark:text-emerald-200">
          <span className="material-icons-outlined text-base">check_circle</span>
          {t("staking.success")}
        </div>
      )}

      {txError && (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-400">
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
