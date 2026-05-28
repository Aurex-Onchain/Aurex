"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchApi } from "@/lib/api";
import { TOKENS, type TokenInfo } from "@/lib/contracts";
import { usePinnedTokens } from "@/hooks/use-pinned-tokens";
import { useTokenPrices } from "@/hooks/use-token-prices";
import { useTranslation } from "@/i18n";
import type { AdvisorConfigResponse } from "@/types/api";

interface TokenPrice {
  symbol: string;
  price: number | null;
  change24h: number | null;
}

interface TickerBarProps {
  collapsed?: boolean;
}

const HOT_TOKEN_SYMBOLS: Record<string, string> = {
  "0x0000000000000000000000000000000000000001": "PEPE",
  "0x0000000000000000000000000000000000000002": "DOGE",
  "0x0000000000000000000000000000000000000003": "SOL",
  "0x0000000000000000000000000000000000000004": "BONK",
};

function isAddress(value: string): value is `0x${string}` {
  return /^0x[0-9a-fA-F]{40}$/.test(value);
}

function formatAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function resolveSymbol(address: string, tokenMeta: TokenInfo[]): string {
  const normalized = address.toLowerCase();
  const token = tokenMeta.find((item) => item.address.toLowerCase() === normalized);
  return token?.symbol ?? HOT_TOKEN_SYMBOLS[normalized] ?? formatAddress(address);
}

export function TickerBar({ collapsed = false }: TickerBarProps) {
  const { t } = useTranslation();
  const { customTokens } = usePinnedTokens();
  const { data: config } = useQuery({
    queryKey: ["advisor-config"],
    queryFn: () => fetchApi<AdvisorConfigResponse>("/api/config"),
  });

  const hotTokenAddresses = useMemo(
    () => {
      const configured = (config?.hotTokens ?? []).filter(isAddress);
      return configured.length > 0 ? configured : TOKENS.map((token) => token.address);
    },
    [config?.hotTokens],
  );
  const { data: priceData, isLoading } = useTokenPrices(hotTokenAddresses);

  const tokenMeta = useMemo(() => {
    const known = new Map<string, TokenInfo>();
    for (const token of [...TOKENS, ...customTokens]) {
      known.set(token.address.toLowerCase(), token);
    }
    return Array.from(known.values());
  }, [customTokens]);

  const tokens = useMemo<TokenPrice[]>(() => {
    return hotTokenAddresses.map((address) => {
      const normalizedAddress = address.toLowerCase();
      const price = priceData?.prices.find((entry) => entry.token.toLowerCase() === normalizedAddress);
      return {
        symbol: resolveSymbol(address, tokenMeta),
        price: price?.currentPrice ?? null,
        change24h: price?.change24hPct ?? null,
      };
    });
  }, [hotTokenAddresses, priceData?.prices, tokenMeta]);

  const formatPrice = (price: number) => {
    if (price >= 1000) return `$${price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    if (price >= 1) return `$${price.toFixed(2)}`;
    return `$${price.toFixed(4)}`;
  };

  const formatChange = (change: number) => {
    const sign = change >= 0 ? "+" : "";
    return `${sign}${change.toFixed(2)}%`;
  };

  const renderToken = (token: TokenPrice, idx: number, compact: boolean) => {
    const hasChange = token.change24h !== null;
    const changePositive = (token.change24h ?? 0) >= 0;
    const changeTone = hasChange
      ? changePositive
        ? "text-emerald-700 dark:text-emerald-300"
        : "text-red-600 dark:text-red-400"
      : "text-zinc-500";

    return (
      <div
        key={`${token.symbol}-${idx}`}
        className={`flex shrink-0 items-center border-r border-zinc-200/80 transition-colors hover:bg-zinc-100/70 dark:border-zinc-800/70 dark:hover:bg-zinc-800/40 ${
          compact ? "gap-2 px-4" : "gap-3 px-5"
        }`}
      >
        <span className="live-dot h-1.5 w-1.5 rounded-full bg-emerald-500 text-emerald-500 dark:bg-emerald-300 dark:text-emerald-300" />
        <span className={`${compact ? "text-xs" : "text-sm"} font-bold text-zinc-900 dark:text-zinc-100`}>{token.symbol}</span>
        <span className={`${compact ? "text-xs" : "text-sm"} font-semibold text-zinc-600 dark:text-zinc-300`}>
          {token.price === null ? (isLoading ? "..." : "--") : formatPrice(token.price)}
        </span>
        <div className={`flex items-center ${compact ? "gap-0.5" : "gap-1"}`}>
          {hasChange && (
            <span
              className={`material-icons-outlined ${changeTone}`}
              style={{ fontSize: compact ? "14px" : "16px" }}
            >
              {changePositive ? "arrow_upward" : "arrow_downward"}
            </span>
          )}
          <span className={`${compact ? "text-xs" : "text-sm"} font-semibold ${changeTone}`}>
            {token.change24h === null ? "--" : formatChange(token.change24h)}
          </span>
        </div>
      </div>
    );
  };

  const displayTokens = [...tokens, ...tokens];

  if (tokens.length === 0) {
    return (
      <div className={`${collapsed ? "rounded-lg" : "rounded-xl"} scanner-panel overflow-hidden border border-zinc-200/80 bg-white/90 dark:border-zinc-800/80 dark:bg-zinc-900/95`}>
        <div className={`${collapsed ? "h-10" : "h-12"} flex items-center px-4 text-xs font-medium text-zinc-500 dark:text-zinc-400`}>
          {t("feed.ticker.empty")}
        </div>
      </div>
    );
  }

  if (collapsed) {
    return (
    <div className="scanner-panel overflow-hidden rounded-lg border border-zinc-200/80 bg-white/90 dark:border-zinc-800/80 dark:bg-zinc-900/95">
        <div className="relative h-10 overflow-hidden">
          <div className="absolute inset-0 flex items-center animate-ticker">
            {displayTokens.map((token, idx) => renderToken(token, idx, true))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="scanner-panel overflow-hidden rounded-xl border border-zinc-200/80 bg-white/90 dark:border-zinc-800/80 dark:bg-zinc-900/95">
      <div className="relative h-12 overflow-hidden">
        <div className="absolute inset-0 flex items-center animate-ticker">
          {displayTokens.map((token, idx) => renderToken(token, idx, false))}
        </div>
      </div>
    </div>
  );
}
