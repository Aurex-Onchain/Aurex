"use client";

import { useState, useRef, useEffect, type FormEvent } from "react";
import { useTranslation } from "@/i18n";
import { postApi } from "@/lib/api";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}

interface ChatDialogProps {
  open: boolean;
  onClose: () => void;
  initialPrompt?: string;
  onOpened?: () => void;
}

export function ChatDialog({ open, onClose, initialPrompt, onOpened }: ChatDialogProps) {
  const { t } = useTranslation();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const sentInitial = useRef(false);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (open && initialPrompt && !sentInitial.current) {
      sentInitial.current = true;
      onOpened?.();
      sendMessage(initialPrompt);
    }
    if (!open) {
      sentInitial.current = false;
    }
  }, [open, initialPrompt]);

  async function sendMessage(content: string) {
    setMessages((prev) => [...prev, { role: "user", content, timestamp: Date.now() }]);
    setLoading(true);

    try {
      const res = await postApi<{ reply?: string; error?: string }>("/api/chat", { content });
      const reply = res.reply || res.error || "No response from advisor. Make sure OpenClaw is connected.";
      setMessages((prev) => [...prev, { role: "assistant", content: reply, timestamp: Date.now() }]);
    } catch {
      setMessages((prev) => [...prev, {
        role: "assistant",
        content: "Unable to reach the advisor. Check that the service is running.",
        timestamp: Date.now(),
      }]);
    } finally {
      setLoading(false);
    }
  }

  async function handleSend(e: FormEvent) {
    e.preventDefault();
    const content = input.trim();
    if (!content || loading) return;
    setInput("");
    await sendMessage(content);
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg mx-4 mb-4 sm:mb-0 bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl flex flex-col max-h-[70vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <span className="material-icons-outlined text-indigo-400 text-lg">smart_toy</span>
            <span className="text-sm font-medium text-zinc-200">{t("chat.title")}</span>
          </div>
          <button onClick={onClose} className="text-zinc-500 hover:text-zinc-300 transition-colors">
            <span className="material-icons-outlined text-lg">close</span>
          </button>
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {messages.length === 0 && (
            <p className="text-sm text-zinc-500 text-center py-8">{t("chat.hint")}</p>
          )}
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                msg.role === "user"
                  ? "bg-indigo-600 text-white rounded-br-md"
                  : "bg-zinc-800 text-zinc-200 rounded-bl-md"
              }`}>
                {msg.content}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-zinc-800 text-zinc-400 px-4 py-2.5 rounded-2xl rounded-bl-md text-sm">
                <span className="inline-flex gap-1">
                  <span className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <form onSubmit={handleSend} className="px-5 py-4 border-t border-zinc-800">
          <div className="flex items-center gap-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={t("chat.inputPlaceholder")}
              disabled={loading}
              className="flex-1 bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-indigo-500 disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="w-9 h-9 rounded-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white flex items-center justify-center transition-colors"
            >
              <span className="material-icons-outlined" style={{ fontSize: "16px" }}>send</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}