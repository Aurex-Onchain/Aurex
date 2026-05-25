"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import { TokenSelector } from "./token-selector";
import { PolicyForm, type PolicyValues } from "./policy-form";
import { PublisherWhitelist } from "./publisher-whitelist";
import { useCreatePool } from "@/hooks/use-create-pool";
import { formatAddress } from "@/lib/format";
import { useTranslation } from "@/i18n";

const DEFAULT_SQRT_PRICE = "79228162514264337593543950336";
const DEFAULT_TICK_SPACING = 60;

export function CreatePoolForm() {
  const { address, isConnected } = useAccount();
  const { createPool, hash, isPending, isConfirming, isSuccess, error, reset } = useCreatePool();
  const { t } = useTranslation();

  const [token0, setToken0] = useState("");
  const [token1, setToken1] = useState("");
  const [tickSpacing, setTickSpacing] = useState(String(DEFAULT_TICK_SPACING));
  const [sqrtPriceX96, setSqrtPriceX96] = useState(DEFAULT_SQRT_PRICE);
  const [policy, setPolicy] = useState<PolicyValues>({
    maxRiskScore: "80",
    minLiquidityScore: "20",
    defaultFee: "3000",
    maxFee: "10000",
    publisherShareBps: "500",
    blockHighRiskTrades: true,
    allowSwapWhenSignalExpired: false,
  });
  const [whitelist, setWhitelist] = useState<string[]>([]);

  const canSubmit = isConnected && token0 && token1 && token0 !== token1 && !isPending && !isConfirming;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit || !address) return;

    createPool({
      token0: token0 as `0x${string}`,
      token1: token1 as `0x${string}`,
      tickSpacing: Number(tickSpacing) || DEFAULT_TICK_SPACING,
      sqrtPriceX96: BigInt(sqrtPriceX96 || DEFAULT_SQRT_PRICE),
      policy,
      admin: address,
    });
  }

  if (!isConnected) {
    return (
      <div className="p-6 rounded-lg border border-zinc-800 bg-zinc-900/50 text-center">
        <span className="material-icons-outlined text-zinc-600 text-3xl mb-2 block">account_balance_wallet</span>
        <p className="text-zinc-400">{t("createPool.connectWallet")}</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Token Pair */}
      <div className="p-6 rounded-lg border border-zinc-800 bg-zinc-900/50 space-y-4">
        <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wide flex items-center gap-2">
          <span className="material-icons-outlined text-base">toll</span>
          {t("createPool.tokenPair")}
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <TokenSelector label={t("createPool.tokenA")} value={token0} onChange={setToken0} exclude={token1} />
          <TokenSelector label={t("createPool.tokenB")} value={token1} onChange={setToken1} exclude={token0} />
        </div>
        {token0 && token1 && token0.toLowerCase() > token1.toLowerCase() && (
          <p className="text-xs text-zinc-500 flex items-center gap-1">
            <span className="material-icons-outlined text-xs">swap_vert</span>
            {t("createPool.autoSort")}
          </p>
        )}
      </div>

      {/* Pool Parameters */}
      <div className="p-6 rounded-lg border border-zinc-800 bg-zinc-900/50 space-y-4">
        <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wide flex items-center gap-2">
          <span className="material-icons-outlined text-base">tune</span>
          {t("createPool.poolParams")}
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-zinc-500 uppercase mb-1">{t("createPool.tickSpacing")}</label>
            <input
              type="number"
              value={tickSpacing}
              onChange={(e) => setTickSpacing(e.target.value)}
              className="w-full px-3 py-2 rounded bg-zinc-800 border border-zinc-700 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-indigo-600 transition-colors"
            />
            <p className="text-xs text-zinc-600 mt-1">{t("createPool.tickSpacingHint")}</p>
          </div>
          <div>
            <label className="block text-xs text-zinc-500 uppercase mb-1">sqrtPriceX96</label>
            <input
              type="text"
              value={sqrtPriceX96}
              onChange={(e) => setSqrtPriceX96(e.target.value)}
              className="w-full px-3 py-2 rounded bg-zinc-800 border border-zinc-700 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-indigo-600 font-mono text-xs transition-colors"
            />
            <p className="text-xs text-zinc-600 mt-1">{t("createPool.sqrtPriceHint")}</p>
          </div>
        </div>
      </div>

      {/* Policy */}
      <div className="p-6 rounded-lg border border-zinc-800 bg-zinc-900/50 space-y-4">
        <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wide flex items-center gap-2">
          <span className="material-icons-outlined text-base">shield</span>
          {t("createPool.policy")}
        </h3>
        <PolicyForm values={policy} onChange={setPolicy} />
      </div>

      {/* Publisher Whitelist */}
      <div className="p-6 rounded-lg border border-zinc-800 bg-zinc-900/50 space-y-4">
        <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wide flex items-center gap-2">
          <span className="material-icons-outlined text-base">group</span>
          {t("createPool.whitelist")}
          <span className="text-xs font-normal normal-case text-zinc-600 ml-1">{t("createPool.whitelistOptional")}</span>
        </h3>
        <p className="text-xs text-zinc-500">{t("createPool.whitelistHint")}</p>
        <PublisherWhitelist addresses={whitelist} onChange={setWhitelist} />
      </div>

      {/* Submit */}
      <div className="flex items-center gap-4">
        <button
          type="submit"
          disabled={!canSubmit}
          className="px-6 py-2.5 rounded bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
        >
          <span className="material-icons-outlined text-base">rocket_launch</span>
          {isPending ? t("createPool.confirmWallet") : isConfirming ? t("createPool.creating") : t("createPool.submit")}
        </button>
        {error && (
          <button type="button" onClick={reset} className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors">
            {t("createPool.reset")}
          </button>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="p-4 rounded border border-red-900/50 bg-red-950/30 text-sm text-red-400 flex items-start gap-2">
          <span className="material-icons-outlined text-base mt-0.5">error_outline</span>
          <span>{error.message.slice(0, 200)}</span>
        </div>
      )}

      {/* Success */}
      {isSuccess && hash && (
        <div className="p-4 rounded border border-green-900/50 bg-green-950/30 text-sm text-green-400 space-y-2">
          <div className="flex items-center gap-2">
            <span className="material-icons-outlined text-base">check_circle</span>
            <p>{t("createPool.success")}</p>
          </div>
          <p className="font-mono text-xs text-green-500 pl-6">Tx: {formatAddress(hash)}</p>
          {whitelist.length > 0 && (
            <p className="text-xs text-green-600 pl-6">{t("createPool.whitelistNote")}</p>
          )}
        </div>
      )}
    </form>
  );
}
