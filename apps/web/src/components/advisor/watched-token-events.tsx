"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchApi } from "@/lib/api";
import { LoadingSkeleton } from "@/components/ui/loading-skeleton";
import { useTranslation } from "@/i18n";
import { TOKENS } from "@/lib/contracts";

// Default watched tokens: includes high-volatility tokens for active price alerts
const DEFAULT_WATCHED_TOKENS = [
  "0x5A77f1443D16ee5761d310e38b62f77f726bC71c", // WETH
  "0xEA034fb02eB1808C2cc3adbC15f447B93CbE08e1", // WBTC
  "0x0000000000000000000000000000000000000001", // PEPE
  "0x0000000000000000000000000000000000000002", // DOGE
  "0x0000000000000000000000000000000000000003", // SOL
  "0x0000000000000000000000000000000000000004", // BONK
];

interface PriceEntry {
  token: string;
  currentPrice: number;
  change1hPct: number | null;
  change24hPct: number | null;
  volatility1h: number | null;
}

interface PricesResponse {
  prices: PriceEntry[];
  timestamp: number;
}

const EXTRA_SYMBOLS: Record<string, string> = {
  "0x0000000000000000000000000000000000000001": "PEPE",
  "0x0000000000000000000000000000000000000002": "DOGE",
  "0x0000000000000000000000000000000000000003": "SOL",
  "0x0000000000000000000000000000000000000004": "BONK",
};

function getTokenSymbol(address: string): string {
  const token = TOKENS.find((t) => t.address.toLowerCase() === address.toLowerCase());
  if (token) return token.symbol;
  return EXTRA_SYMBOLS[address.toLowerCase()] ?? `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function WatchedTokenEvents() {
  const { t } = useTranslation();
  const tokenAddresses = DEFAULT_WATCHED_TOKENS.map((a) => a.toLowerCase()).join(",");

  const { data, isLoading } = useQuery({
    queryKey: ["watched-token-prices"],
    queryFn: () => fetchApi<PricesResponse>(`/api/prices?tokens=${tokenAddresses}`),
    refetchInterval: 30_000,
    staleTime: 20_000,
  });

  if (isLoading) return <LoadingSkeleton rows={3} />;

  const prices = data?.prices ?? [];

  if (prices.length === 0) {
    return (
      <div className="p-6 rounded-lg border border-zinc-800 bg-zinc-900/50">
        <p className="text-zinc-500 text-sm">{t("advisor.noTokenEvents")}</p>
        <p className="text-xs text-zinc-600 mt-2">{t("advisor.tokenEventsHint")}</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 divide-y divide-zinc-800">
      {prices.map((entry) => {
        const symbol = getTokenSymbol(entry.token);
        const change1h = entry.change1hPct;
        const change24h = entry.change24hPct;
        const isVolatile = (entry.volatility1h ?? 0) > 3;
        const isBigMove = Math.abs(change1h ?? 0) > 5;

        return (
          <div key={entry.token} className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center">
                  <span className="text-xs font-bold text-zinc-300">{symbol.slice(0, 2)}</span>
                </div>
                <div>
                  <span className="text-sm font-medium text-zinc-200">{symbol}</span>
                  <p className="text-xs text-zinc-500 font-mono">
                    {entry.token.slice(0, 6)}...{entry.token.slice(-4)}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-zinc-200">
                  ${entry.currentPrice < 1 ? entry.currentPrice.toFixed(6) : entry.currentPrice.toFixed(2)}
                </p>
                {change1h !== null && (
                  <p className={`text-xs ${change1h >= 0 ? "text-green-400" : "text-red-400"}`}>
                    {change1h >= 0 ? "+" : ""}{change1h.toFixed(2)}% (1h)
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3 mt-3">
              {change24h !== null && (
                <span className={`text-xs px-2 py-0.5 rounded ${
                  change24h >= 0 ? "bg-green-900/20 text-green-400" : "bg-red-900/20 text-red-400"
                }`}>
                  24h: {change24h >= 0 ? "+" : ""}{change24h.toFixed(2)}%
                </span>
              )}
              {isVolatile && (
                <span className="text-xs px-2 py-0.5 rounded bg-amber-900/20 text-amber-400">
                  {t("advisor.highVolatility")}
                </span>
              )}
              {isBigMove && (
                <span className="text-xs px-2 py-0.5 rounded bg-indigo-900/20 text-indigo-400">
                  {t("advisor.significantMove")}
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
