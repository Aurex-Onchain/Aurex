"use client";

import { useState } from "react";
import type { PoolStatusResponse } from "@/types/api";
import { formatAddress } from "@/lib/format";
import { useTranslation } from "@/i18n";

interface Props {
  pools: PoolStatusResponse[];
  value: string;
  onChange: (poolId: string) => void;
}

export function PoolSelector({ pools, value, onChange }: Props) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  const selected = pools.find((p) => p.poolId === value);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-zinc-100 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/50 hover:border-zinc-300 dark:hover:border-zinc-600 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="material-icons-outlined text-lg text-zinc-400">pool</span>
          <div className="text-left">
            <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
              {selected ? formatAddress(selected.poolId) : t("terminal.selectPool")}
            </p>
            {selected && (
              <p className="text-xs text-zinc-500">
                {selected.signalValid ? t("hookPools.signalActive") : t("hookPools.signalNone")}
              </p>
            )}
          </div>
        </div>
        <span className="material-icons-outlined text-zinc-400">expand_more</span>
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-full mt-1 rounded-xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 shadow-2xl z-50 py-1 max-h-60 overflow-y-auto">
          {pools.map((pool) => (
            <button
              key={pool.poolId}
              type="button"
              onClick={() => { onChange(pool.poolId); setOpen(false); }}
              className={`w-full px-4 py-3 text-left hover:bg-zinc-100 dark:hover:bg-zinc-700/50 transition-colors flex items-center justify-between ${
                pool.poolId === value ? "bg-zinc-100 dark:bg-zinc-700/30" : ""
              }`}
            >
              <div>
                <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200 font-mono">
                  {formatAddress(pool.poolId)}
                </p>
                <p className="text-xs text-zinc-500 mt-0.5">
                  {pool.signalValid ? t("hookPools.signalActive") : t("hookPools.signalNone")}
                </p>
              </div>
              {pool.signalValid && (
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
