"use client";

import { useMessages, type Message } from "@/hooks/use-messages";
import { FeedCard } from "./feed-card";
import { useTranslation } from "@/i18n";

interface FeedListProps {
  onAccept: (message: Message) => void;
}

export function FeedList({ onAccept }: FeedListProps) {
  const { data, isLoading } = useMessages();
  const { t } = useTranslation();

  if (isLoading) {
    return (
      <div className="space-y-3 px-5">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 bg-zinc-900 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  const messages = data?.messages ?? [];

  if (messages.length === 0) {
    return (
      <div className="text-center py-12 text-zinc-500 text-sm px-5">
        {t("feed.empty")}
      </div>
    );
  }

  return (
    <div className="divide-y divide-zinc-800">
      {messages.map((msg) => (
        <FeedCard key={msg.id} message={msg} onAccept={onAccept} />
      ))}
    </div>
  );
}
