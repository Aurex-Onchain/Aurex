"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { postApi } from "@/lib/api";
import type { ConfigureRequest, ConfigureResponse, PublishResponse } from "@/types/api";

export function useConfigure() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: ConfigureRequest) =>
      postApi<ConfigureResponse>("/api/configure", body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["market"] });
      queryClient.invalidateQueries({ queryKey: ["strategy"] });
    },
  });
}

export function usePublish() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (poolId: string) =>
      postApi<PublishResponse>("/api/publish", { pool_id: poolId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["market"] });
      queryClient.invalidateQueries({ queryKey: ["publisher"] });
    },
  });
}
