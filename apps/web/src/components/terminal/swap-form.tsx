"use client";

import { useState, useMemo } from "react";
import { useAccount } from "wagmi";
import { TOKENS, type TokenInfo } from "@/lib/contracts";
import type { PoolStatusResponse } from "@/types/api";
import { useSwap } from "@/hooks/use-swap";
import { SwapResult } from "./swap-result";
import { SignalAttribution } from "./signal-attribution";
import { useTranslation } from "@/i18n";
import { formatFee } from "@/lib/format";

interface Props {
  pool: PoolStatusResponse;
}

const SLIPPAGE_OPTIONS = [0.1, 0.5, 1.0];

export function SwapForm({ pool }: Props) {
  const { isConnected } = useAccount();
  const [tokenIn, setTokenIn] = useState<TokenInfo | null>(null);
  const [tokenOut, setTokenOut] = useState<TokenInfo | null>(null);
  const [amountIn, setAmountIn] = useState("");
  const [slippage, setSlippage] = useState(0.5);
  const [customSlippage, setCustomSlippage] = useState("");
  const [showSlippage, setShowSlippage] = useState(false);
  const { execute, result, isPending, error, reset } = useSwap();
  const { t } = useTranslation();

  const knownTokens = TOKENS;
  const signal = pool.latestSignal;
  const fee = signal ? signal.recommendedFee : pool.policy?.defaultFee ?? 0;

  // Simulated exchange rate (in production this would come from sqrtPriceX96)
  const exchangeRate = useMemo(() => {
    if (!tokenIn || !tokenOut) return null;
    // Derive a mock rate from pool sqrtPriceX96 for display
    return 1.0;
  }, [tokenIn, tokenOut]);

  const estimatedOut = useMemo(() => {
    if (!amountIn || !exchangeRate) return "";
    const raw = parseFloat(amountIn) * exchangeRate * (1 - fee / 1_000_000);
    return isNaN(raw) ? "" : raw.toFixed(6);
  }, [amountIn, exchangeRate, fee]);

  const effectiveSlippage = customSlippage ? parseFloat(customSlippage) : slippage;
  const minimumReceived = estimatedOut
    ? (parseFloat(estimatedOut) * (1 - effectiveSlippage / 100)).toFixed(6)
    : "";

  const priceImpact = useMemo(() => {
    // Simplified price impact estimation
    if (!amountIn) return 0;
    const amt = parseFloat(amountIn);
    if (isNaN(amt) || amt === 0) return 0;
    return Math.min(amt * 0.001, 5); // Mock: scales with size
  }, [amountIn]);

  function handleFlip() {
    setTokenIn(tokenOut);
    setTokenOut(tokenIn);
    setAmountIn("");
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!tokenIn || !tokenOut || !amountIn || !pool.poolId) return;

    const direction =
      tokenIn.address.toLowerCase() < tokenOut.address.toLowerCase()
        ? "buy"
        : "sell";

    execute({
      poolId: pool.poolId,
      tokenIn: tokenIn.address,
      tokenOut: tokenOut.address,
      amount: amountIn,
      direction,
    });
  }

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <span className="material-icons-outlined text-4xl text-zinc-600 mb-3">account_balance_wallet</span>
        <p className="text-zinc-400 text-sm">{t("terminal.connectWallet")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Slippage Settings Toggle */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-zinc-500 uppercase font-medium">{t("terminal.swap")}</span>
        <button
          type="button"
          onClick={() => setShowSlippage(!showSlippage)}
          className="flex items-center gap-1 text-xs text-zinc-400 hover:text-zinc-200 transition-colors"
        >
          <span className="material-icons-outlined text-sm">tune</span>
          {t("terminal.slippage")}: {customSlippage || slippage}%
        </button>
      </div>

      {/* Slippage Panel */}
      {showSlippage && (
        <div className="p-3 rounded-lg bg-zinc-800/50 border border-zinc-700/50 space-y-2">
          <p className="text-xs text-zinc-400">{t("terminal.slippageTolerance")}</p>
          <div className="flex gap-2">
            {SLIPPAGE_OPTIONS.map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => { setSlippage(opt); setCustomSlippage(""); }}
                className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                  !customSlippage && slippage === opt
                    ? "bg-indigo-600 text-white"
                    : "bg-zinc-700 text-zinc-300 hover:bg-zinc-600"
                }`}
              >
                {opt}%
              </button>
            ))}
            <input
              type="text"
              value={customSlippage}
              onChange={(e) => setCustomSlippage(e.target.value)}
              placeholder={t("terminal.custom")}
              className="w-20 px-2 py-1.5 rounded bg-zinc-700 border border-zinc-600 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3">
        {/* You Pay Section */}
        <div className="relative z-30 p-4 rounded-xl bg-zinc-800/60 border border-zinc-700/50 overflow-visible">
          <span className="text-xs text-zinc-500">{t("terminal.youPay")}</span>
          <div className="flex items-center justify-between mt-2">
            <input
              type="text"
              value={amountIn}
              onChange={(e) => setAmountIn(e.target.value)}
              placeholder="0.0"
              className="flex-1 min-w-0 bg-transparent text-2xl font-medium text-zinc-100 placeholder-zinc-600 focus:outline-none"
            />
            <TokenSelect
              tokens={knownTokens}
              selected={tokenIn}
              onChange={setTokenIn}
              exclude={tokenOut}
              placeholder={t("terminal.selectToken")}
            />
          </div>
        </div>

        {/* Flip Button */}
        <div className="flex justify-center -my-1 relative z-10">
          <button
            type="button"
            onClick={handleFlip}
            className="p-2 rounded-lg bg-zinc-800 border border-zinc-700 hover:bg-zinc-700 hover:border-zinc-600 transition-colors"
          >
            <span className="material-icons-outlined text-lg text-zinc-400">swap_vert</span>
          </button>
        </div>

        {/* You Receive Section */}
        <div className="relative z-20 p-4 rounded-xl bg-zinc-800/60 border border-zinc-700/50 overflow-visible">
          <span className="text-xs text-zinc-500">{t("terminal.youReceive")}</span>
          <div className="flex items-center justify-between mt-2">
            <input
              type="text"
              value={estimatedOut}
              readOnly
              placeholder="0.0"
              className="flex-1 min-w-0 bg-transparent text-2xl font-medium text-zinc-100 placeholder-zinc-600 focus:outline-none"
            />
            <TokenSelect
              tokens={knownTokens}
              selected={tokenOut}
              onChange={setTokenOut}
              exclude={tokenIn}
              placeholder={t("terminal.selectToken")}
            />
          </div>
        </div>

        {/* Exchange Rate */}
        {tokenIn && tokenOut && exchangeRate && (
          <div className="flex items-center justify-between px-1 text-xs text-zinc-400">
            <span className="flex items-center gap-1">
              <span className="material-icons-outlined text-sm">sync_alt</span>
              1 {tokenIn.symbol} = {exchangeRate} {tokenOut.symbol}
            </span>
          </div>
        )}

        {/* Order Summary */}
        {amountIn && tokenIn && tokenOut && (
          <div className="p-3 rounded-lg bg-zinc-800/40 border border-zinc-700/30 space-y-2 text-xs">
            <div className="flex items-center justify-between text-zinc-400">
              <span>{t("terminal.fee")}</span>
              <span className="text-zinc-200">{formatFee(fee)}</span>
            </div>
            <div className="flex items-center justify-between text-zinc-400">
              <span>{t("terminal.priceImpact")}</span>
              <span className={priceImpact > 1 ? "text-yellow-400" : "text-emerald-400"}>
                {priceImpact.toFixed(2)}%
              </span>
            </div>
            <div className="flex items-center justify-between text-zinc-400">
              <span>{t("terminal.slippageTolerance")}</span>
              <span className="text-zinc-200">{effectiveSlippage}%</span>
            </div>
            {minimumReceived && (
              <div className="flex items-center justify-between text-zinc-400 pt-1 border-t border-zinc-700/50">
                <span>{t("terminal.minimumReceived")}</span>
                <span className="text-zinc-200">{minimumReceived} {tokenOut.symbol}</span>
              </div>
            )}
          </div>
        )}

        {/* Signal Attribution Badge */}
        {signal && pool.signalValid && (
          <SignalAttribution signal={signal} policy={pool.policy} />
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={!tokenIn || !tokenOut || !amountIn || isPending}
          className="w-full px-4 py-3.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {isPending ? (
            <span className="flex items-center justify-center gap-2">
              <span className="material-icons-outlined text-sm animate-spin">autorenew</span>
              {t("terminal.executing")}
            </span>
          ) : (
            t("terminal.swapViaAdvisor")
          )}
        </button>
      </form>

      {error && (
        <div className="p-3 rounded-lg border border-red-900/50 bg-red-950/30 text-sm text-red-400 flex items-center justify-between">
          <span>{error}</span>
          <button onClick={reset} className="text-xs underline text-red-500 hover:text-red-400">{t("terminal.dismiss")}</button>
        </div>
      )}

      {result && <SwapResult result={result} pool={pool} />}
    </div>
  );
}

/* ─── Token Selector Button ─── */
function TokenSelect({
  tokens,
  selected,
  onChange,
  exclude,
  placeholder,
}: {
  tokens: TokenInfo[];
  selected: TokenInfo | null;
  onChange: (t: TokenInfo) => void;
  exclude: TokenInfo | null;
  placeholder: string;
}) {
  const [open, setOpen] = useState(false);
  const available = tokens.filter(
    (t) => t.address.toLowerCase() !== exclude?.address.toLowerCase()
  );

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-2 px-4 py-2.5 rounded-full border transition-colors ${
          selected
            ? "bg-zinc-700/90 border-zinc-600 text-zinc-100 shadow-sm"
            : "bg-zinc-700/50 border-zinc-600 text-zinc-400"
        } hover:bg-zinc-600/80 hover:border-zinc-500`}
      >
        <span className="material-icons-outlined text-base text-indigo-400">token</span>
        {selected ? (
          <span className="font-bold text-sm">{selected.symbol}</span>
        ) : (
          <span className="text-sm">{placeholder}</span>
        )}
        <span className="material-icons-outlined text-sm text-zinc-400">expand_more</span>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 w-44 rounded-xl bg-zinc-800 border border-zinc-700 shadow-2xl z-50 py-1 max-h-48 overflow-y-auto">
          {available.map((token) => (
            <button
              key={token.address}
              type="button"
              onClick={() => { onChange(token); setOpen(false); }}
              className="w-full px-3 py-2.5 text-left text-sm text-zinc-200 hover:bg-zinc-700/70 transition-colors flex items-center gap-2"
            >
              <span className="material-icons-outlined text-sm text-indigo-400">token</span>
              <span className="font-semibold">{token.symbol}</span>
              <span className="text-xs text-zinc-500 ml-auto">{token.decimals}d</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
