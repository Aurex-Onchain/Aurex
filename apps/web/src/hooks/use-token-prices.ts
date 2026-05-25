"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchApi } from "@/lib/api";
import { TOKENS } from "@/lib/contracts";

interface PriceChange {
  token: string;
  currentPrice: number;
  change24hPct: number | null;
}

interface PricesResponse {
  prices: PriceChange[];
  timestamp: number;
}

export function useTokenPrices() {
  const tokenAddresses = TOKENS.map((t) => t.address.toLowerCase()).join(",");

  return useQuery({
    queryKey: ["token-prices"],
    queryFn: () => fetchApi<PricesResponse>(`/api/prices?tokens=${tokenAddresses}`),
    refetchInterval: 30_000,
    staleTime: 20_000,
  });
}

export function getPriceForToken(prices: PriceChange[] | undefined, address: string): number | null {
  if (!prices) return null;
  const entry = prices.find((p) => p.token === address.toLowerCase());
  return entry?.currentPrice ?? null;
}
