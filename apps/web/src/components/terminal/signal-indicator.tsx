"use client";

import type { SerializedSignal, SerializedPolicy } from "@/types/api";
import { formatFee, formatScore, timeUntilExpiry, isExpired } from "@/lib/format";
import { SignalBadge } from "@/components/ui/signal-badge";
import { useTranslation } from "@/i18n";

interface Props {
  signal: SerializedSignal | null;
  policy: SerializedPolicy | null;
  signalValid: boolean;
}

export function SignalIndicator({ signal, policy, signalValid }: Props) {
  const { t } = useTranslation();

  if (!signal) {
    return (
      <div className="p-4 rounded-xl bg-zinc-800/40 border border-zinc-700/30">
        <div className="flex items-center gap-2 text-zinc-500">
          <span className="material-icons-outlined text-lg">signal_cellular_off</span>
          <span className="text-sm">{t("terminal.noSignal")}</span>
        </div>
      </div>
    );
  }

  const expired = isExpired(signal.expiresAt);
  const riskScore = formatScore(signal.riskScore);
  const riskLevel = riskScore <= 30 ? "low" : riskScore <= 60 ? "medium" : "high";
  const riskColor = riskLevel === "low" ? "text-emerald-400" : riskLevel === "medium" ? "text-yellow-400" : "text-red-400";
  const riskBg = riskLevel === "low" ? "bg-emerald-500/10" : riskLevel === "medium" ? "bg-yellow-500/10" : "bg-red-500/10";
  const riskBorder = riskLevel === "low" ? "border-emerald-500/20" : riskLevel === "medium" ? "border-yellow-500/20" : "border-red-500/20";

  return (
    <div className={`p-4 rounded-xl border ${signalValid ? riskBorder : "border-zinc-700/30"} ${signalValid ? riskBg : "bg-zinc-800/40"}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className={`material-icons-outlined text-lg ${signalValid ? riskColor : "text-zinc-500"}`}>
            {signalValid ? "signal_cellular_alt" : "signal_cellular_off"}
          </span>
          <span className="text-sm font-medium text-zinc-200">{t("terminal.signalStatus")}</span>
        </div>
        <div className="flex items-center gap-1.5">
          {signalValid ? (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              {t("terminal.signalLive")}
            </span>
          ) : (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-zinc-700/50 border border-zinc-600/50 text-zinc-400 text-xs font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-zinc-500" />
              {expired ? t("signals.statusExpired") : t("terminal.signalInactive")}
            </span>
          )}
        </div>
      </div>

      {/* Scores Grid */}
      <div className="grid grid-cols-4 gap-2 mb-3">
        <SignalBadge score={formatScore(signal.riskScore)} label={t("terminal.risk")} />
        <SignalBadge score={formatScore(signal.alphaScore)} label={t("terminal.alpha")} />
        <SignalBadge score={formatScore(signal.liquidityScore)} label={t("terminal.liq")} />
        <SignalBadge score={formatScore(signal.volatilityScore)} label={t("terminal.vol")} />
      </div>

      {/* Fee & Expiry */}
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-3">
          <span className="text-zinc-500">{t("terminal.dynamicFee")}</span>
          <span className="text-zinc-200 font-medium">{formatFee(signal.recommendedFee)}</span>
        </div>
        {!expired && (
          <div className="flex items-center gap-1 text-zinc-500">
            <span className="material-icons-outlined text-xs">schedule</span>
            <span>{timeUntilExpiry(signal.expiresAt)}</span>
          </div>
        )}
      </div>
    </div>
  );
}
