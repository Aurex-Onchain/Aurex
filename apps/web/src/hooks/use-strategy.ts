"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchApi } from "@/lib/api";
import type { StrategyResponse } from "@/types/api";

export function useStrategy(address?: string) {
  return useQuery({
    queryKey: ["strategy", address],
    queryFn: () =>
      fetchApi<StrategyResponse>(
        `/api/strategy${address ? `?address=${address}` : ""}`
      ),
    refetchInterval: 20_000,
    staleTime: 15_000,
  });
}
