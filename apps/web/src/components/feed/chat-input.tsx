"use client";

import { useState, type FormEvent } from "react";
import { useTranslation } from "@/i18n";

interface ChatInputProps {
  onSend: (content: string) => void;
  disabled?: boolean;
}

export function ChatInput({ onSend, disabled }: ChatInputProps) {
  const [value, setValue] = useState("");
  const { t } = useTranslation();

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = value.trim();
    if (!trimmed) return;
    onSend(trimmed);
    setValue("");
  };

  return (
    <form onSubmit={handleSubmit} className="backdrop-blur-md bg-white/70 dark:bg-zinc-900/70 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 shadow-lg">
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={t("feed.inputPlaceholder")}
        disabled={disabled}
        className="w-full bg-transparent text-sm text-zinc-800 dark:text-zinc-200 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none disabled:opacity-50"
      />
      <div className="flex justify-end mt-3">
        <button
          type="submit"
          disabled={disabled || !value.trim()}
          className="w-9 h-9 rounded-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:hover:bg-emerald-600 text-white flex items-center justify-center transition-colors"
        >
          <span className="material-icons-outlined" style={{ fontSize: "18px" }}>send</span>
        </button>
      </div>
    </form>
  );
}
