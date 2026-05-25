"use client";

import type { SerializedSignal, SerializedPolicy } from "@/types/api";
import { formatAddress, formatFee, formatScore } from "@/lib/format";
import { useTranslation } from "@/i18n";

interface Props {
  signal: SerializedSignal;
  policy: SerializedPolicy | null;
}

export function SignalAttribution({ signal, policy }: Props) {
  const { t } = useTranslation();

  const defaultFee = policy?.defaultFee ?? 0;
  const dynamicFee = signal.recommendedFee;
  const riskScore = formatScore(signal.riskScore);

  return (
    <div className="p-3 rounded-xl bg-indigo-950/30 border border-indigo-500/20 space-y-2.5">
      {/* Header badge */}
      <div className="flex items-center gap-2">
        <span className="material-icons-outlined text-sm text-indigo-400">auto_awesome</span>
        <span className="text-xs font-semibold text-indigo-300 uppercase tracking-wide">
          {t("terminal.signalAttribution")}
        </span>
      </div>

      {/* Publisher row */}
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-2 text-zinc-400">
          <span className="material-icons-outlined text-sm">person</span>
          <span>{t("terminal.signalPublisher")}</span>
        </div>
        <span className="font-mono text-zinc-200">{formatAddress(signal.signer)}</span>
      </div>

      {/* Fee adjustment row */}
      <div className="flex items-center justify-between text-xs">
        <span className="text-zinc-400">{t("terminal.feeAdjustment")}</span>
        <div className="flex items-center gap-1.5">
          <span className="text-zinc-500">{t("terminal.feeDefault")} {formatFee(defaultFee)}</span>
          <span className="material-icons-outlined text-sm text-indigo-400">arrow_forward</span>
          <span className="text-indigo-300 font-medium">
            {t("terminal.feeDynamic")} {formatFee(dynamicFee)}
          </span>
          <span className="px-1.5 py-0.5 rounded bg-indigo-500/15 border border-indigo-500/25 text-indigo-300 text-[10px] font-medium">
            {t("terminal.feeRiskLabel")}: {riskScore}
          </span>
        </div>
      </div>
    </div>
  );
}
