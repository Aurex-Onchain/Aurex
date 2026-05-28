"use client";

import type { SerializedSignal, SerializedPolicy } from "@/types/api";
import { formatFee, formatScore, timeUntilExpiry, isExpired } from "@/lib/format";
import { SignalBadge } from "@/components/ui/signal-badge";
import { useTranslation } from "@/i18n";
import { AnimatedNumber, useNumberFlash } from "@/components/motion/animated-number";

interface Props {
  signal: SerializedSignal | null;
  policy: SerializedPolicy | null;
  signalValid: boolean;
}

export function SignalIndicator({ signal, policy, signalValid }: Props) {
  const { t } = useTranslation();

  if (!signal) {
    return (
      <div className="p-4 rounded-xl bg-zinc-100 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-700/30">
        <div className="flex items-center gap-2 text-zinc-500">
          <span className="material-icons-outlined text-lg">signal_cellular_off</span>
          <span className="text-sm">{t("terminal.noSignal")}</span>
        </div>
      </div>
    );
  }

  const expired = isExpired(signal.expiresAt);
  const riskScore = formatScore(signal.riskScore);
  const riskLevelKey = riskScore <= 30 ? "low" : riskScore <= 60 ? "medium" : "high";
  const riskColor = riskLevelKey === "low" ? "text-emerald-400" : riskLevelKey === "medium" ? "text-yellow-400" : "text-red-400";
  const riskBg = riskLevelKey === "low" ? "bg-emerald-500/10" : riskLevelKey === "medium" ? "bg-yellow-500/10" : "bg-red-500/10";
  const riskBorder = riskLevelKey === "low" ? "border-emerald-500/20" : riskLevelKey === "medium" ? "border-yellow-500/20" : "border-red-500/20";

  return (
    <div className={`p-4 rounded-xl border ${signalValid ? riskBorder : "border-zinc-200 dark:border-zinc-700/30"} ${signalValid ? riskBg : "bg-zinc-100 dark:bg-zinc-800/40"}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className={`material-icons-outlined text-lg ${signalValid ? riskColor : "text-zinc-500"}`}>
            {signalValid ? "signal_cellular_alt" : "signal_cellular_off"}
          </span>
          <span className="text-sm font-medium text-zinc-800 dark:text-zinc-200">{t("terminal.signalStatus")}</span>
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

      {signalValid && policy && (
        <HookActionApplied
          defaultFee={policy.defaultFee}
          dynamicFee={signal.recommendedFee}
          riskScore={riskScore}
          appliedLabel={t("terminal.hookActionApplied")}
          escalatedLabel={t("terminal.feeEscalated")}
          relaxedLabel={t("terminal.feeRelaxed")}
        />
      )}

      {/* Fee & Expiry */}
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-3">
          <span className="text-zinc-500">{t("terminal.dynamicFee")}</span>
          <span className="text-zinc-800 dark:text-zinc-200 font-medium">{formatFee(signal.recommendedFee)}</span>
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

function HookActionApplied({
  defaultFee,
  dynamicFee,
  riskScore,
  appliedLabel,
  escalatedLabel,
  relaxedLabel,
}: {
  defaultFee: number;
  dynamicFee: number;
  riskScore: number;
  appliedLabel: string;
  escalatedLabel: string;
  relaxedLabel: string;
}) {
  const escalated = dynamicFee >= defaultFee;

  return (
    <div className="hook-action scanner-panel mb-3 rounded-lg border border-emerald-500/25 bg-emerald-50/70 px-3 py-2 dark:bg-emerald-950/20">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-md border border-emerald-200 bg-white/70 text-emerald-600 dark:border-emerald-500/25 dark:bg-emerald-500/10 dark:text-emerald-300">
            <span className="material-icons-outlined" style={{ fontSize: "16px", lineHeight: 1 }}>bolt</span>
          </span>
          <div className="leading-tight">
            <p className="text-[11px] font-semibold uppercase text-emerald-700 dark:text-emerald-300">{appliedLabel}</p>
            <p className="text-[11px] text-zinc-500">{escalated ? escalatedLabel : relaxedLabel}</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-xs">
          <AnimatedFee value={defaultFee} muted />
          <span className="material-icons-outlined text-sm text-emerald-500">arrow_forward</span>
          <AnimatedFee value={dynamicFee} />
          <span className="rounded border border-zinc-200 bg-white/70 px-1.5 py-0.5 text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950/50">
            risk <AnimatedNumber value={riskScore} />
          </span>
        </div>
      </div>
    </div>
  );
}

function AnimatedFee({ value, muted = false }: { value: number; muted?: boolean }) {
  const percent = value / 100;
  const flash = useNumberFlash(percent);

  return (
    <span className={`rounded px-1.5 py-0.5 font-mono ${flash} ${
      muted
        ? "border border-zinc-200 bg-white/70 text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950/50"
        : "border border-emerald-200 bg-emerald-100/80 font-semibold text-emerald-700 dark:border-emerald-500/25 dark:bg-emerald-500/10 dark:text-emerald-300"
    }`}>
      <AnimatedNumber value={percent} decimals={2} suffix="%" />
    </span>
  );
}
