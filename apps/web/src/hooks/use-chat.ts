"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { postApi } from "@/lib/api";
import type { Message } from "./use-messages";

interface ChatResponse {
  message: Message;
}

interface ExecuteResponse {
  executionId: string;
  status: string;
  results?: { status: string; txHash?: string; error?: string }[];
  error?: string;
}

export function useChat() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (content: string) =>
      postApi<ChatResponse>("/api/messages/chat", { content }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["messages"] });
    },
  });
}

export function useExecuteTrade() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: {
      pool_id: string;
      action_type: string;
      direction?: string;
      amount?: string;
      token_in?: string;
      token_out?: string;
      confirm?: boolean;
    }) => postApi<ExecuteResponse>("/api/execute", params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["messages"] });
      queryClient.invalidateQueries({ queryKey: ["market"] });
    },
  });
}
