"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchApi } from "@/lib/api";
import { TOKENS } from "@/lib/contracts";

export interface PriceChange {
  token: string;
  currentPrice: number;
  change24hPct: number | null;
}

export interface PricesResponse {
  prices: PriceChange[];
  timestamp: number;
}

export function useTokenPrices(tokenAddresses?: string[]) {
  const sourceTokens = tokenAddresses === undefined
    ? TOKENS.map((t) => t.address)
    : tokenAddresses;
  const tokenQuery = sourceTokens
    .map((address) => address.trim().toLowerCase())
    .filter(Boolean)
    .join(",");

  return useQuery({
    queryKey: ["token-prices", tokenQuery],
    queryFn: () => fetchApi<PricesResponse>(`/api/prices?tokens=${tokenQuery}`),
    enabled: tokenQuery.length > 0,
    refetchInterval: 30_000,
    staleTime: 20_000,
  });
}

export function getPriceForToken(prices: PriceChange[] | undefined, address: string): number | null {
  if (!prices) return null;
  const normalizedAddress = address.toLowerCase();
  const entry = prices.find((p) => p.token.toLowerCase() === normalizedAddress);
  return entry?.currentPrice ?? null;
}
