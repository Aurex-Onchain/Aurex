"use client";

import { useState } from "react";
import { useTranslation } from "@/i18n";
import { formatAddress } from "@/lib/format";

interface Props {
  addresses: string[];
  onChange: (addresses: string[]) => void;
}

const ADDRESS_REGEX = /^0x[a-fA-F0-9]{40}$/;

export function PublisherWhitelist({ addresses, onChange }: Props) {
  const { t } = useTranslation();
  const [input, setInput] = useState("");
  const [error, setError] = useState("");

  function handleAdd() {
    const trimmed = input.trim();
    setError("");

    if (!ADDRESS_REGEX.test(trimmed)) {
      setError(t("createPool.whitelistInvalidAddress"));
      return;
    }

    if (addresses.some((a) => a.toLowerCase() === trimmed.toLowerCase())) {
      setError(t("createPool.whitelistDuplicate"));
      return;
    }

    onChange([...addresses, trimmed]);
    setInput("");
  }

  function handleRemove(index: number) {
    onChange(addresses.filter((_, i) => i !== index));
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAdd();
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => { setInput(e.target.value); setError(""); }}
          onKeyDown={handleKeyDown}
          placeholder="0x..."
          className="flex-1 px-3 py-2 rounded bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-sm text-zinc-900 dark:text-zinc-200 placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none focus:border-emerald-600 font-mono transition-colors"
        />
        <button
          type="button"
          onClick={handleAdd}
          disabled={!input.trim()}
          className="inline-flex items-center justify-center px-3 py-2 rounded bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 hover:text-zinc-900 dark:hover:text-zinc-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <span className="material-icons-outlined text-base leading-none">add</span>
        </button>
      </div>

      {error && (
        <p className="text-xs text-red-400">{error}</p>
      )}

      {addresses.length > 0 && (
        <div className="space-y-1">
          {addresses.map((addr, i) => (
            <div
              key={addr}
              className="flex items-center justify-between px-3 py-1.5 rounded bg-zinc-100/50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800 group"
            >
              <span className="font-mono text-xs text-zinc-700 dark:text-zinc-300">{formatAddress(addr)}</span>
              <button
                type="button"
                onClick={() => handleRemove(i)}
                className="inline-flex items-center justify-center text-zinc-400 dark:text-zinc-600 hover:text-red-500 dark:hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
              >
                <span className="material-icons-outlined text-sm leading-none">close</span>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
