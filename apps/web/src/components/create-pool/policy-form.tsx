"use client";

import { useTranslation } from "@/i18n";

interface PolicyValues {
  maxRiskScore: string;
  minLiquidityScore: string;
  defaultFee: string;
  maxFee: string;
  publisherShareBps: string;
  blockHighRiskTrades: boolean;
  allowSwapWhenSignalExpired: boolean;
}

interface Props {
  values: PolicyValues;
  onChange: (values: PolicyValues) => void;
}

export function PolicyForm({ values, onChange }: Props) {
  const { t } = useTranslation();
  const update = (key: keyof PolicyValues, val: string | boolean) => {
    onChange({ ...values, [key]: val });
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs text-zinc-500 uppercase mb-1">{t("createPool.maxRiskScore")}</label>
          <input
            type="number"
            min={0}
            max={100}
            value={values.maxRiskScore}
            onChange={(e) => update("maxRiskScore", e.target.value)}
            placeholder="80"
            className="w-full px-3 py-2 rounded bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-sm text-zinc-900 dark:text-zinc-200 placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none focus:border-emerald-600 transition-colors"
          />
          <p className="text-xs text-zinc-600 mt-1">{t("createPool.maxRiskScoreHint")}</p>
        </div>
        <div>
          <label className="block text-xs text-zinc-500 uppercase mb-1">{t("createPool.minLiquidityScore")}</label>
          <input
            type="number"
            min={0}
            max={100}
            value={values.minLiquidityScore}
            onChange={(e) => update("minLiquidityScore", e.target.value)}
            placeholder="20"
            className="w-full px-3 py-2 rounded bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-sm text-zinc-900 dark:text-zinc-200 placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none focus:border-emerald-600 transition-colors"
          />
          <p className="text-xs text-zinc-600 mt-1">{t("createPool.minLiquidityScoreHint")}</p>
        </div>
        <div>
          <label className="block text-xs text-zinc-500 uppercase mb-1">{t("createPool.defaultFee")}</label>
          <input
            type="number"
            min={0}
            max={100000}
            value={values.defaultFee}
            onChange={(e) => update("defaultFee", e.target.value)}
            placeholder="3000"
            className="w-full px-3 py-2 rounded bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-sm text-zinc-900 dark:text-zinc-200 placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none focus:border-emerald-600 transition-colors"
          />
          <p className="text-xs text-zinc-600 mt-1">{t("createPool.defaultFeeHint")}</p>
        </div>
        <div>
          <label className="block text-xs text-zinc-500 uppercase mb-1">{t("createPool.maxFee")}</label>
          <input
            type="number"
            min={0}
            max={100000}
            value={values.maxFee}
            onChange={(e) => update("maxFee", e.target.value)}
            placeholder="10000"
            className="w-full px-3 py-2 rounded bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-sm text-zinc-900 dark:text-zinc-200 placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none focus:border-emerald-600 transition-colors"
          />
          <p className="text-xs text-zinc-600 mt-1">{t("createPool.maxFeeHint")}</p>
        </div>
        <div>
          <label className="block text-xs text-zinc-500 uppercase mb-1">{t("createPool.publisherShare")}</label>
          <input
            type="number"
            min={0}
            max={5000}
            value={values.publisherShareBps}
            onChange={(e) => update("publisherShareBps", e.target.value)}
            placeholder="500"
            className="w-full px-3 py-2 rounded bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-sm text-zinc-900 dark:text-zinc-200 placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none focus:border-emerald-600 transition-colors"
          />
          <p className="text-xs text-zinc-600 mt-1">{t("createPool.publisherShareHint")}</p>
        </div>
      </div>
      <div className="flex gap-6 pt-2">
        <label className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={values.blockHighRiskTrades}
            onChange={(e) => update("blockHighRiskTrades", e.target.checked)}
            className="w-4 h-4 rounded bg-white dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700 text-emerald-600 focus:ring-emerald-600 focus:ring-offset-0"
          />
          {t("createPool.blockHighRisk")}
        </label>
        <label className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={values.allowSwapWhenSignalExpired}
            onChange={(e) => update("allowSwapWhenSignalExpired", e.target.checked)}
            className="w-4 h-4 rounded bg-white dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700 text-emerald-600 focus:ring-emerald-600 focus:ring-offset-0"
          />
          {t("createPool.allowExpiredSignal")}
        </label>
      </div>
    </div>
  );
}

export type { PolicyValues };
