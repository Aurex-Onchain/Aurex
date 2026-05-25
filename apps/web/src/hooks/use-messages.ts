"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchApi } from "@/lib/api";

export interface Message {
  id: string;
  type: "recommendation" | "signal_alert" | "chat" | "strategy" | "price_alert" | "signal_expired" | "fee_change" | "system";
  role: "assistant" | "user";
  content: string;
  metadata: Record<string, unknown> | null;
  createdAt: number;
}

interface MessagesResponse {
  messages: Message[];
}

export function useMessages(since = 0, limit = 50) {
  return useQuery({
    queryKey: ["messages", since, limit],
    queryFn: () => fetchApi<MessagesResponse>(`/api/messages?since=${since}&limit=${limit}`),
    refetchInterval: 3000,
  });
}
