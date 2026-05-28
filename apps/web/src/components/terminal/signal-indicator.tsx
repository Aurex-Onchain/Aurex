"use client";

import type { SerializedSignal, SerializedPolicy } from "@/types/api";
import { formatAddress, formatFee, formatScore, timeUntilExpiry, isExpired } from "@/lib/format";
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
      <div className="flex h-full flex-col gap-4">
        <div className="flex flex-col gap-4 2xl:flex-row 2xl:items-center 2xl:justify-between">
          <div className="flex min-w-0 items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-zinc-200 bg-white/70 text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950/40 dark:text-zinc-400">
              <span className="material-icons-outlined" style={{ fontSize: "20px", lineHeight: 1 }}>
                signal_cellular_off
              </span>
            </span>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  {t("terminal.signalStatus")}
                </h3>
                <StatusPill active={false} label={t("terminal.signalInactive")} />
              </div>
              <p className="mt-1 text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">
                {t("terminal.noSignal")}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:min-w-64">
            <SummaryTile label={t("terminal.dynamicFee")} value="--" />
            <SummaryTile label={t("terminal.expiresIn")} value="--" />
          </div>
        </div>
      </div>
    );
  }

  const expired = isExpired(signal.expiresAt);
  const riskScore = formatScore(signal.riskScore);
  const alphaScore = formatScore(signal.alphaScore);
  const liquidityScore = formatScore(signal.liquidityScore);
  const volatilityScore = formatScore(signal.volatilityScore);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 2xl:flex-row 2xl:items-start 2xl:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${signalValid ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/25 dark:bg-emerald-500/10 dark:text-emerald-200" : "border-zinc-200 bg-white/70 text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950/40 dark:text-zinc-400"}`}>
            <span className="material-icons-outlined" style={{ fontSize: "20px", lineHeight: 1 }}>
              {signalValid ? "sensors" : "signal_cellular_off"}
            </span>
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                {t("terminal.signalStatus")}
              </h3>
              <StatusPill
                active={signalValid}
                label={signalValid ? t("terminal.signalLive") : expired ? t("signals.statusExpired") : t("terminal.signalInactive")}
              />
            </div>
            <p className="mt-1 text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">
              #{signal.signalId.slice(0, 8)} · {t("terminal.publisher")} {formatAddress(signal.signer)}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:min-w-64">
          <SummaryTile label={t("terminal.dynamicFee")} value={formatFee(signal.recommendedFee)} tone="emerald" />
          <SummaryTile label={t("terminal.expiresIn")} value={expired ? t("signals.statusExpired") : timeUntilExpiry(signal.expiresAt)} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
        <ScoreTile label={t("terminal.risk")} value={riskScore} tone={scoreTone(riskScore, "lower")} />
        <ScoreTile label={t("terminal.alpha")} value={alphaScore} tone={scoreTone(alphaScore, "higher")} />
        <ScoreTile label={t("terminal.liq")} value={liquidityScore} tone={scoreTone(liquidityScore, "higher")} />
        <ScoreTile label={t("terminal.vol")} value={volatilityScore} tone={scoreTone(volatilityScore, "lower")} />
      </div>

      {signalValid && policy && (
        <HookActionApplied
          defaultFee={policy.defaultFee}
          dynamicFee={signal.recommendedFee}
          riskScore={riskScore}
          appliedLabel={t("terminal.hookActionApplied")}
          escalatedLabel={t("terminal.feeEscalated")}
          relaxedLabel={t("terminal.feeRelaxed")}
          riskLabel={t("terminal.feeRiskLabel")}
        />
      )}
    </div>
  );
}

function StatusPill({ active, label }: { active: boolean; label: string }) {
  return (
    <span className={`inline-flex h-[26px] items-center gap-1.5 rounded-md border px-2 text-[11px] font-semibold ${
      active
        ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/25 dark:bg-emerald-500/10 dark:text-emerald-200"
        : "border-zinc-200 bg-white/60 text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950/60 dark:text-zinc-400"
    }`}>
      <span className={`h-1.5 w-1.5 rounded-full ${active ? "live-dot bg-emerald-500 text-emerald-500 dark:bg-emerald-300 dark:text-emerald-300" : "bg-zinc-400 dark:bg-zinc-500"}`} />
      {label}
    </span>
  );
}

function SummaryTile({ label, value, tone = "zinc" }: { label: string; value: string; tone?: "emerald" | "zinc" }) {
  return (
    <div className={`rounded-xl border px-3 py-2 ${
      tone === "emerald"
        ? "border-emerald-200 bg-emerald-50/60 dark:border-emerald-500/20 dark:bg-emerald-500/10"
        : "border-zinc-200 bg-white/60 dark:border-zinc-800 dark:bg-zinc-950/40"
    }`}>
      <p className={`text-[11px] font-medium ${tone === "emerald" ? "text-emerald-700 dark:text-emerald-200" : "text-zinc-500"}`}>{label}</p>
      <p className={`mt-1 truncate text-sm font-semibold ${tone === "emerald" ? "text-emerald-800 dark:text-emerald-100" : "text-zinc-900 dark:text-zinc-100"}`}>
        {value}
      </p>
    </div>
  );
}

type ScoreTone = "emerald" | "yellow" | "red";

function scoreTone(score: number, direction: "higher" | "lower"): ScoreTone {
  if (direction === "higher") {
    if (score >= 70) return "emerald";
    if (score >= 40) return "yellow";
    return "red";
  }
  if (score <= 30) return "emerald";
  if (score <= 60) return "yellow";
  return "red";
}

function ScoreTile({ label, value, tone }: { label: string; value: number; tone: ScoreTone }) {
  const toneClasses = {
    emerald: "border-emerald-200 bg-emerald-50/60 text-emerald-800 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-100",
    yellow: "border-yellow-200 bg-yellow-50/70 text-yellow-800 dark:border-yellow-500/25 dark:bg-yellow-500/10 dark:text-yellow-100",
    red: "border-red-200 bg-red-50/70 text-red-800 dark:border-red-500/25 dark:bg-red-500/10 dark:text-red-100",
  }[tone];

  return (
    <div className={`rounded-xl border px-3 py-2 ${toneClasses}`}>
      <p className="text-[11px] font-medium opacity-75">{label}</p>
      <p className="mt-1 text-lg font-semibold leading-none">
        <AnimatedNumber value={value} />
      </p>
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
  riskLabel,
}: {
  defaultFee: number;
  dynamicFee: number;
  riskScore: number;
  appliedLabel: string;
  escalatedLabel: string;
  relaxedLabel: string;
  riskLabel: string;
}) {
  const escalated = dynamicFee >= defaultFee;

  return (
    <div className="hook-action scanner-panel rounded-xl border border-emerald-500/25 bg-emerald-50/70 px-3 py-3 dark:bg-emerald-950/20">
      <div className="flex flex-col gap-2 xl:flex-row xl:items-center xl:justify-between">
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
            {riskLabel} <AnimatedNumber value={riskScore} />
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
