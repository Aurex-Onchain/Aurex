"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchApi } from "@/lib/api";
import type { MarketResponse } from "@/types/api";

export function useMarket() {
  return useQuery({
    queryKey: ["market"],
    queryFn: () => fetchApi<MarketResponse>("/api/market"),
    refetchInterval: 15_000,
    staleTime: 10_000,
  });
}
