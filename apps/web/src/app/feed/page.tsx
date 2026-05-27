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
        <div className="pb-52">
          <FeedList onAccept={setSelectedMessage} />
        </div>

        {!chatOpen && (
          <div className="sticky bottom-0 z-10 border-t border-zinc-200 bg-white/95 px-3 pb-6 pt-4 backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-950/95 sm:px-5">
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
  const prompts = [
    { icon: "whatshot", label: t("feed.prompt.highAlpha") },
    { icon: "schedule", label: t("feed.prompt.lastHour") },
    { icon: "swap_vert", label: t("feed.prompt.bestPool") },
    { icon: "shield", label: t("feed.prompt.riskCheck") },
  ];

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = value.trim();
    if (!trimmed) return;
    onSend(trimmed);
    setValue("");
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl border border-zinc-200/80 bg-zinc-50/80 p-3 backdrop-blur-sm dark:border-zinc-800/80 dark:bg-zinc-900/80">
      <div className="mb-3 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {prompts.map((prompt) => (
          <button
            key={prompt.label}
            type="button"
            onClick={() => setValue(prompt.label)}
            className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg border border-zinc-200 px-2.5 text-xs font-medium text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-white"
          >
            <span className="material-icons-outlined text-sm">{prompt.icon}</span>
            {prompt.label}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={t("chat.inputPlaceholder")}
          className="min-w-0 flex-1 bg-transparent text-sm text-zinc-800 placeholder-zinc-400 focus:outline-none dark:text-zinc-200 dark:placeholder-zinc-500"
        />
        <button
          type="submit"
          disabled={!value.trim()}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white transition-colors hover:bg-emerald-500 disabled:opacity-50"
        >
          <span className="material-icons-outlined" style={{ fontSize: "18px" }}>send</span>
        </button>
      </div>
    </form>
  );
}
