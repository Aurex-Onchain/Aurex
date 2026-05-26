"use client";

import { useState } from "react";
import { FeedList } from "@/components/feed/feed-list";
import { ChatDialog } from "@/components/feed/chat-dialog";
import { ExecuteDialog } from "@/components/feed/execute-dialog";
import type { Message } from "@/hooks/use-messages";
import { useTranslation } from "@/i18n";
import { CollapsibleHeader } from "@/components/ui/collapsible-header";

export default function FeedPage() {
  const { t } = useTranslation();
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [initialPrompt, setInitialPrompt] = useState("");

  function handleSend(content: string) {
    setInitialPrompt(content);
    setChatOpen(true);
  }

  return (
    <CollapsibleHeader title={t("feed.title")} description={t("feed.description")}>
      <div className="relative h-full">
        <div className="pb-28">
          <FeedList onAccept={setSelectedMessage} />
        </div>

        {!chatOpen && (
          <div className="sticky bottom-0 px-3 sm:px-5 pb-6 pt-4">
            <ChatInputBar onSend={handleSend} />
          </div>
        )}

        <ChatDialog open={chatOpen} onClose={() => setChatOpen(false)} initialPrompt={initialPrompt} onOpened={() => setInitialPrompt("")} />
        <ExecuteDialog message={selectedMessage} onClose={() => setSelectedMessage(null)} />
      </div>
    </CollapsibleHeader>
  );
}

function ChatInputBar({ onSend }: { onSend: (content: string) => void }) {
  const { t } = useTranslation();
  const [value, setValue] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = value.trim();
    if (!trimmed) return;
    onSend(trimmed);
    setValue("");
  }

  return (
    <form onSubmit={handleSubmit} className="backdrop-blur-md bg-white/70 dark:bg-zinc-900/70 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 shadow-lg">
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={t("chat.inputPlaceholder")}
        className="w-full bg-transparent text-sm text-zinc-800 dark:text-zinc-200 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none"
      />
      <div className="flex justify-end mt-3">
        <button
          type="submit"
          disabled={!value.trim()}
          className="w-9 h-9 rounded-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white flex items-center justify-center transition-colors"
        >
          <span className="material-icons-outlined" style={{ fontSize: "18px" }}>send</span>
        </button>
      </div>
    </form>
  );
}
