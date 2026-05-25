"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchApi } from "@/lib/api";
import type { HealthResponse } from "@/types/api";

export function useHealth() {
  return useQuery({
    queryKey: ["health"],
    queryFn: async () => {
      try {
        return await fetchApi<HealthResponse>("/health");
      } catch {
        return null;
      }
    },
    refetchInterval: 10_000,
    staleTime: 5_000,
    retry: false,
  });
}
