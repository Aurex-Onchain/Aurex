"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import type { Message } from "@/hooks/use-messages";
import { useExecuteTrade } from "@/hooks/use-chat";
import { useTranslation } from "@/i18n";

interface ExecuteDialogProps {
  message: Message | null;
  onClose: () => void;
}

export function ExecuteDialog({ message, onClose }: ExecuteDialogProps) {
  const { t } = useTranslation();
  const executeTrade = useExecuteTrade();
  const [result, setResult] = useState<{ status: string; txHash?: string; error?: string } | null>(null);

  if (!message || typeof document === "undefined") return null;

  const metadata = message.metadata as {
    pool_id?: string;
    direction?: string;
    amount?: string;
    token_in?: string;
    token_out?: string;
  } | null;

  const handleConfirm = async () => {
    if (!metadata?.pool_id) return;
    try {
      const res = await executeTrade.mutateAsync({
        pool_id: metadata.pool_id,
        action_type: "swap",
        direction: metadata.direction,
        amount: metadata.amount,
        token_in: metadata.token_in,
        token_out: metadata.token_out,
        confirm: true,
      });
      setResult({ status: res.status, txHash: res.results?.[0]?.txHash, error: res.error });
    } catch (err) {
      setResult({ status: "error", error: err instanceof Error ? err.message : String(err) });
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl">
        <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-3">
          {t("feed.confirmExecution")}
        </h3>
        <p className="text-sm text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap mb-4">
          {message.content}
        </p>

        {metadata?.pool_id && (
          <div className="text-xs text-zinc-500 space-y-1 mb-4 bg-zinc-100 dark:bg-zinc-800 rounded p-3">
            <div>{t("common.pool")}: {metadata.pool_id.slice(0, 10)}...</div>
            {metadata.direction && <div>{t("common.direction")}: {metadata.direction}</div>}
            {metadata.amount && <div>{t("common.amount")}: {metadata.amount}</div>}
          </div>
        )}

        {result && (
          <div className={`text-xs p-3 rounded mb-4 ${result.error ? "bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300" : "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300"}`}>
            <div>{t("common.status")}: {result.status}</div>
            {result.txHash && <div>{t("common.tx")}: {result.txHash.slice(0, 16)}...</div>}
            {result.error && <div>{t("common.error")}: {result.error}</div>}
          </div>
        )}

        <div className="flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors"
          >
            {result ? t("feed.close") : t("feed.cancel")}
          </button>
          {!result && (
            <button
              onClick={handleConfirm}
              disabled={executeTrade.isPending || !metadata?.pool_id}
              className="px-4 py-2 text-sm bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-lg transition-colors"
            >
              {executeTrade.isPending ? t("feed.executing") : t("feed.confirmExecute")}
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
