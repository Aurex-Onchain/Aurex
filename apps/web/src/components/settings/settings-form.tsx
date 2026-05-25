"use client";

import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useReadContracts } from "wagmi";
import { fetchApi } from "@/lib/api";
import { useConfigure } from "@/hooks/use-advisor-api";
import { useTranslation } from "@/i18n";
import { usePinnedTokens } from "@/hooks/use-pinned-tokens";
import { TOKENS, erc20Abi } from "@/lib/contracts";
import type { TokenInfo } from "@/lib/contracts";
import type { AdvisorConfigResponse } from "@/types/api";

function MaterialIcon({ name, className = "" }: { name: string; className?: string }) {
  return <span className={`material-icons-outlined ${className}`}>{name}</span>;
}

export function SettingsForm() {
  const { t } = useTranslation();
  const configure = useConfigure();
  const queryClient = useQueryClient();
  const { pinnedAddresses, togglePin, customTokens, addCustomToken, removeCustomToken } = usePinnedTokens();

  const [customAddress, setCustomAddress] = useState("");
  const [customError, setCustomError] = useState("");

  const { data: tokenMeta } = useReadContracts({
    contracts: [
      { address: customAddress as `0x${string}`, abi: erc20Abi, functionName: "symbol" },
      { address: customAddress as `0x${string}`, abi: erc20Abi, functionName: "decimals" },
    ],
    query: { enabled: /^0x[0-9a-fA-F]{40}$/.test(customAddress) },
  });

  function handleAddCustomToken() {
    setCustomError("");
    if (!/^0x[0-9a-fA-F]{40}$/.test(customAddress)) {
      setCustomError(t("settings.invalidAddress"));
      return;
    }
    const allKnown = [...TOKENS, ...customTokens];
    if (allKnown.some((t) => t.address.toLowerCase() === customAddress.toLowerCase())) {
      setCustomError(t("settings.tokenExists"));
      return;
    }
    const symbol = tokenMeta?.[0]?.status === "success" ? (tokenMeta[0].result as string) : undefined;
    const decimals = tokenMeta?.[1]?.status === "success" ? Number(tokenMeta[1].result) : undefined;
    if (!symbol || decimals === undefined) {
      setCustomError(t("settings.cannotResolve"));
      return;
    }
    addCustomToken({ address: customAddress as `0x${string}`, symbol, decimals });
    setCustomAddress("");
  }

  const { data: config } = useQuery({
    queryKey: ["advisor-config"],
    queryFn: () => fetchApi<AdvisorConfigResponse>("/api/config"),
  });

  const [scoreThreshold, setScoreThreshold] = useState("");
  const [intervalMs, setIntervalMs] = useState("");
  const [poolIds, setPoolIds] = useState("");
  const [hotTokens, setHotTokens] = useState("");
  const [privateKey, setPrivateKey] = useState("");
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");

  useEffect(() => {
    if (config) {
      setScoreThreshold(String(config.scoreChangeThreshold));
      setIntervalMs(String(config.intervalMs));
      setPoolIds(config.poolIds.join(",\n"));
      setHotTokens((config.hotTokens ?? []).join(",\n"));
    }
  }, [config]);

  useEffect(() => {
    if (status !== "idle") {
      const timer = setTimeout(() => setStatus("idle"), 3000);
      return () => clearTimeout(timer);
    }
  }, [status]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const body: Record<string, unknown> = {};
    if (scoreThreshold && Number(scoreThreshold) !== config?.scoreChangeThreshold) {
      body.score_threshold = Number(scoreThreshold);
    }
    if (intervalMs && Number(intervalMs) !== config?.intervalMs) {
      body.interval_ms = Number(intervalMs);
    }
    const pools = poolIds.split(/[,\n]/).map((s) => s.trim()).filter(Boolean);
    if (pools.length > 0) body.watched_pools = pools;
    const tokens = hotTokens.split(/[,\n]/).map((s) => s.trim()).filter(Boolean);
    if (tokens.length > 0) body.hot_tokens = tokens;
    if (privateKey.trim()) body.private_key = privateKey.trim();

    if (Object.keys(body).length > 0) {
      configure.mutate(body, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ["advisor-config"] });
          setPrivateKey("");
          setStatus("success");
        },
        onError: () => setStatus("error"),
      });
    }
  };

  const intervalMinutes = intervalMs ? (Number(intervalMs) / 60000).toFixed(1) : "";

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      {status !== "idle" && (
        <div className={`flex items-center gap-2 px-4 py-3 rounded-lg text-sm ${
          status === "success" ? "bg-emerald-950/50 text-emerald-300 border border-emerald-800" : "bg-red-950/50 text-red-300 border border-red-800"
        }`}>
          <MaterialIcon name={status === "success" ? "check_circle" : "error"} className="text-lg" />
          {status === "success" ? t("settings.saved") : t("settings.failed")}
        </div>
      )}

      <section className="p-5 rounded-xl border border-zinc-800 bg-zinc-900/50 space-y-4">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-9 h-9 rounded-lg bg-indigo-600/20 flex items-center justify-center">
            <MaterialIcon name="account_balance_wallet" className="text-lg text-indigo-400" />
          </div>
          <div>
            <h2 className="text-sm font-medium text-zinc-200">{t("settings.wallet")}</h2>
            <p className="text-xs text-zinc-500">{t("settings.walletDesc")}</p>
          </div>
        </div>
        {config?.hasPrivateKey && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-zinc-800/50">
            <span className="inline-block w-2 h-2 rounded-full bg-green-500" />
            <span className="text-sm text-zinc-300 font-mono">{config.publisherAddress}</span>
          </div>
        )}
        <div>
          <label className="block text-xs text-zinc-400 mb-1.5">{t("settings.privateKey")}</label>
          <input
            type="password"
            value={privateKey}
            onChange={(e) => setPrivateKey(e.target.value)}
            placeholder={config?.hasPrivateKey ? t("settings.privateKeyReplace") : "0x..."}
            className="w-full px-3 py-2.5 rounded-lg bg-zinc-800 border border-zinc-700 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 font-mono transition-colors"
          />
          <p className="text-xs text-zinc-600 mt-1.5">{t("settings.privateKeyHint")}</p>
        </div>
      </section>

      <section className="p-5 rounded-xl border border-zinc-800 bg-zinc-900/50 space-y-4">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-9 h-9 rounded-lg bg-amber-600/20 flex items-center justify-center">
            <MaterialIcon name="bolt" className="text-lg text-amber-400" />
          </div>
          <div>
            <h2 className="text-sm font-medium text-zinc-200">{t("settings.signalEngine")}</h2>
            <p className="text-xs text-zinc-500">{t("settings.signalEngineDesc")}</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-zinc-400 mb-1.5">{t("settings.scoreThreshold")}</label>
            <div className="relative">
              <input
                type="number"
                value={scoreThreshold}
                onChange={(e) => setScoreThreshold(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg bg-zinc-800 border border-zinc-700 text-sm text-zinc-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 transition-colors pr-16"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-500">points</span>
            </div>
            <p className="text-xs text-zinc-600 mt-1">{t("settings.scoreThresholdHint")}</p>
          </div>
          <div>
            <label className="block text-xs text-zinc-400 mb-1.5">{t("settings.signalInterval")}</label>
            <div className="relative">
              <input
                type="number"
                value={intervalMs}
                onChange={(e) => setIntervalMs(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg bg-zinc-800 border border-zinc-700 text-sm text-zinc-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 transition-colors pr-10"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-500">ms</span>
            </div>
            {intervalMinutes && (
              <p className="text-xs text-zinc-500 mt-1">= {intervalMinutes} min</p>
            )}
          </div>
        </div>
      </section>
      <section className="p-5 rounded-xl border border-zinc-800 bg-zinc-900/50 space-y-4">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-9 h-9 rounded-lg bg-violet-600/20 flex items-center justify-center">
            <MaterialIcon name="push_pin" className="text-lg text-violet-400" />
          </div>
          <div>
            <h2 className="text-sm font-medium text-zinc-200">{t("settings.pinnedTokens")}</h2>
            <p className="text-xs text-zinc-500">{t("settings.pinnedTokensDesc")}</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {TOKENS.map((token) => {
            const isPinned = pinnedAddresses.includes(token.address);
            return (
              <button
                key={token.address}
                type="button"
                onClick={() => togglePin(token.address)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-colors ${
                  isPinned
                    ? "border-indigo-600 bg-indigo-950/40 text-white"
                    : "border-zinc-700 bg-zinc-800/50 text-zinc-400 hover:border-zinc-600"
                }`}
              >
                <span className={`w-4 h-4 rounded border flex items-center justify-center ${
                  isPinned ? "border-indigo-500 bg-indigo-600" : "border-zinc-600"
                }`}>
                  {isPinned && <MaterialIcon name="check" className="text-xs text-white" />}
                </span>
                {token.symbol}
              </button>
            );
          })}
          {customTokens.map((token) => {
            const isPinned = pinnedAddresses.includes(token.address);
            return (
              <div key={token.address} className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => togglePin(token.address)}
                  className={`flex-1 flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-colors ${
                    isPinned
                      ? "border-indigo-600 bg-indigo-950/40 text-white"
                      : "border-zinc-700 bg-zinc-800/50 text-zinc-400 hover:border-zinc-600"
                  }`}
                >
                  <span className={`w-4 h-4 rounded border flex items-center justify-center ${
                    isPinned ? "border-indigo-500 bg-indigo-600" : "border-zinc-600"
                  }`}>
                    {isPinned && <MaterialIcon name="check" className="text-xs text-white" />}
                  </span>
                  {token.symbol}
                </button>
                <button
                  type="button"
                  onClick={() => removeCustomToken(token.address)}
                  className="p-1.5 rounded text-zinc-500 hover:text-red-400 transition-colors"
                >
                  <MaterialIcon name="close" className="text-base" />
                </button>
              </div>
            );
          })}
        </div>
        <div className="pt-2 border-t border-zinc-800">
          <label className="block text-xs text-zinc-400 mb-1.5">{t("settings.addCustomToken")}</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={customAddress}
              onChange={(e) => { setCustomAddress(e.target.value); setCustomError(""); }}
              placeholder="0x..."
              className="flex-1 px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 font-mono transition-colors"
            />
            <button
              type="button"
              onClick={handleAddCustomToken}
              className="px-3 py-2 rounded-lg bg-zinc-700 text-sm text-zinc-200 hover:bg-zinc-600 transition-colors"
            >
              <MaterialIcon name="add" className="text-base" />
            </button>
          </div>
          {customError && <p className="text-xs text-red-400 mt-1">{customError}</p>}
        </div>
      </section>


      <section className="p-5 rounded-xl border border-zinc-800 bg-zinc-900/50 space-y-4">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-9 h-9 rounded-lg bg-emerald-600/20 flex items-center justify-center">
            <MaterialIcon name="visibility" className="text-lg text-emerald-400" />
          </div>
          <div>
            <h2 className="text-sm font-medium text-zinc-200">{t("settings.watchlist")}</h2>
            <p className="text-xs text-zinc-500">{t("settings.watchlistDesc")}</p>
          </div>
        </div>
        <div>
          <label className="block text-xs text-zinc-400 mb-1.5">{t("settings.watchedPools")}</label>
          <textarea
            value={poolIds}
            onChange={(e) => setPoolIds(e.target.value)}
            rows={3}
            className="w-full px-3 py-2.5 rounded-lg bg-zinc-800 border border-zinc-700 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 font-mono transition-colors"
            placeholder="0x..."
          />
          <p className="text-xs text-zinc-600 mt-1">{t("settings.poolIdsHint")}</p>
        </div>
        <div>
          <label className="block text-xs text-zinc-400 mb-1.5">{t("settings.hotTokens")}</label>
          <textarea
            value={hotTokens}
            onChange={(e) => setHotTokens(e.target.value)}
            rows={3}
            className="w-full px-3 py-2.5 rounded-lg bg-zinc-800 border border-zinc-700 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 font-mono transition-colors"
            placeholder="0x..."
          />
          <p className="text-xs text-zinc-600 mt-1">{t("settings.hotTokensHint")}</p>
        </div>
      </section>

      <button
        type="submit"
        disabled={configure.isPending}
        className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-500 disabled:opacity-50 transition-colors"
      >
        <MaterialIcon name="save" className="text-base" />
        {configure.isPending ? t("settings.saving") : t("settings.save")}
      </button>
    </form>
  );
}
