"use client";

import { useState } from "react";
import { useConfigure } from "@/hooks/use-advisor-api";
import { useTranslation } from "@/i18n";

export function ConfigPanel() {
  const [scoreThreshold, setScoreThreshold] = useState("");
  const [intervalMs, setIntervalMs] = useState("");
  const configure = useConfigure();
  const { t } = useTranslation();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const body: Record<string, number> = {};
    if (scoreThreshold) body.score_threshold = Number(scoreThreshold);
    if (intervalMs) body.interval_ms = Number(intervalMs);
    if (Object.keys(body).length > 0) {
      configure.mutate(body);
    }
  };

  return (
    <div className="p-6 rounded-lg border border-zinc-800 bg-zinc-900/50">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs text-zinc-500 uppercase mb-1">
            {t("advisor.scoreThreshold")}
          </label>
          <input
            type="number"
            value={scoreThreshold}
            onChange={(e) => setScoreThreshold(e.target.value)}
            placeholder="e.g. 10"
            className="w-full px-3 py-2 rounded bg-zinc-800 border border-zinc-700 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-zinc-500"
          />
        </div>
        <div>
          <label className="block text-xs text-zinc-500 uppercase mb-1">
            {t("advisor.signalInterval")}
          </label>
          <input
            type="number"
            value={intervalMs}
            onChange={(e) => setIntervalMs(e.target.value)}
            placeholder="e.g. 60000"
            className="w-full px-3 py-2 rounded bg-zinc-800 border border-zinc-700 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-zinc-500"
          />
        </div>
        <button
          type="submit"
          disabled={configure.isPending}
          className="px-4 py-2 rounded bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-500 disabled:opacity-50 transition-colors"
        >
          {configure.isPending ? t("advisor.updating") : t("advisor.updateConfig")}
        </button>
        {configure.isSuccess && (
          <p className="text-xs text-green-400">{t("advisor.configUpdated")}</p>
        )}
        {configure.isError && (
          <p className="text-xs text-red-400">{t("advisor.configFailed")}</p>
        )}
      </form>
    </div>
  );
}
