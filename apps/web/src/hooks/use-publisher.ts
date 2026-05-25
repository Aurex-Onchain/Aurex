"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchApi } from "@/lib/api";
import type { PublisherResponse } from "@/types/api";

export function usePublisher() {
  return useQuery({
    queryKey: ["publisher"],
    queryFn: () => fetchApi<PublisherResponse>("/api/publisher"),
    refetchInterval: 30_000,
    staleTime: 20_000,
  });
}
