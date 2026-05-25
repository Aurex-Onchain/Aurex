"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchApi } from "@/lib/api";
import type { BehaviorResponse } from "@/types/api";

export function useBehavior() {
  return useQuery({
    queryKey: ["behavior"],
    queryFn: () => fetchApi<BehaviorResponse>("/api/behavior"),
    refetchInterval: 10_000,
    staleTime: 5_000,
  });
}
