"use client";

import Link from "next/link";
import { useState } from "react";
import type { Message } from "@/hooks/use-messages";
import { useTranslation, type TranslationKeys } from "@/i18n";
import { addressToColors } from "@/lib/avatar";
import { useAccount } from "wagmi";

const typeIcons: Record<Message["type"], string> = {
  recommendation: "bolt",
  signal_alert: "sensors",
  chat: "chat_bubble",
  strategy: "analytics",
  price_alert: "show_chart",
  signal_expired: "timer_off",
  fee_change: "swap_vert",
  system: "info",
};

const urgencyStyles = {
  hot: {
    label: "feed.urgency.hot",
    icon: "local_fire_department",
  },
  live: {
    label: "feed.urgency.live",
    icon: "radio_button_checked",
  },
  warning: {
    label: "feed.urgency.warning",
    icon: "warning",
  },
  expired: {
    label: "feed.urgency.expired",
    icon: "timer_off",
  },
  info: {
    label: "feed.urgency.info",
    icon: "insights",
  },
} as const;

type Urgency = keyof typeof urgencyStyles;

const signalChrome: Record<Urgency, {
  chip: string;
  dot: string;
  primary: string;
}> = {
  hot: {
    chip: "border-teal-200 bg-teal-50 text-teal-700 dark:border-teal-500/25 dark:bg-teal-500/10 dark:text-teal-200",
    dot: "bg-teal-400",
    primary: "border-teal-600 bg-teal-700 hover:bg-teal-600",
  },
  live: {
    chip: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/25 dark:bg-emerald-500/10 dark:text-emerald-200",
    dot: "bg-emerald-400",
    primary: "border-emerald-600 bg-emerald-700 hover:bg-emerald-600",
  },
  warning: {
    chip: "border-green-200 bg-green-50 text-green-700 dark:border-green-500/25 dark:bg-green-500/10 dark:text-green-200",
    dot: "bg-green-400",
    primary: "border-emerald-600 bg-emerald-700 hover:bg-emerald-600",
  },
  expired: {
    chip: "border-zinc-300 bg-zinc-100 text-zinc-600 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
    dot: "bg-zinc-400",
    primary: "border-zinc-500 bg-zinc-700 hover:bg-zinc-600",
  },
  info: {
    chip: "border-green-200 bg-green-50 text-green-700 dark:border-green-500/25 dark:bg-green-500/10 dark:text-green-200",
    dot: "bg-green-400",
    primary: "border-green-600 bg-green-700 hover:bg-green-600",
  },
};

interface Metric {
  label: string;
  value: number;
  min: number;
  max: number;
}

interface Receipt {
  label: string;
  value: string;
}

interface FeedCardProps {
  message: Message;
  onAccept?: (message: Message) => void;
  onDismiss?: (message: Message) => void;
}

function SignalAvatar({ address }: { address: string }) {
  const [c1, c2] = addressToColors(address);
  const initials = /^0x0+$/i.test(address) ? "AI" : address.slice(2, 4).toUpperCase();

  return (
    <div
      className="flex h-10 w-10 flex-shrink-0 items-center justify-center text-sm font-semibold text-white"
      style={{
        background: `linear-gradient(135deg, ${c1}, ${c2})`,
        borderRadius: "22%",
      }}
    >
      {initials}
    </div>
  );
}

function readString(metadata: Record<string, unknown> | null, keys: string[]): string | null {
  if (!metadata) return null;
  for (const key of keys) {
    const value = metadata[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return null;
}

function readNumber(metadata: Record<string, unknown> | null, keys: string[]): number | null {
  if (!metadata) return null;
  for (const key of keys) {
    const value = metadata[key];
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string" && value.trim() !== "") {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) return parsed;
    }
  }
  return null;
}

function formatAddr(addr: string): string {
  if (addr.length <= 14) return addr;
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

function shortHash(value: string): string {
  return value.replace(/-/g, "").slice(0, 10).toUpperCase();
}

function formatDateTime(timestamp: number): string {
  const date = new Date(timestamp);
  const time = date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  const day = date.toLocaleDateString([], { month: "short", day: "numeric" });
  return `${time} · ${day}`;
}

function formatCompactNumber(value: number): string {
  if (Math.abs(value) >= 1_000_000) return `${(value / 1_000_000).toFixed(2)}M`;
  if (Math.abs(value) >= 1_000) return `${(value / 1_000).toFixed(2)}K`;
  if (Math.abs(value) >= 1) return value.toFixed(2);
  return value.toPrecision(3);
}

function firstMeaningfulLine(content: string): string {
  return content
    .split("\n")
    .map((line) => line.trim())
    .find(Boolean) ?? "";
}

function firstSentence(content: string): string {
  const normalized = firstMeaningfulLine(content).replace(/\s+/g, " ").trim();
  if (normalized.length <= 92) return normalized;
  const sentence = normalized.match(/^(.{24,110}?[.!?。！？])\s/)?.[1];
  return sentence ?? `${normalized.slice(0, 89).trim()}...`;
}

function deriveHeadline(message: Message, t: (key: TranslationKeys) => string): string {
  const metadata = message.metadata;
  const explicit = readString(metadata, ["headline", "title", "summary", "thesis"]);
  if (explicit) return explicit;

  const pool = readString(metadata, ["pool_id", "poolId"]);
  const token = readString(metadata, ["symbol", "tokenSymbol", "token"]);
  const changePct = readNumber(metadata, ["changePct", "change_pct"]);

  if (message.type === "price_alert" && token && changePct !== null) {
    const direction = changePct >= 0 ? "+" : "";
    return `${formatAddr(token)} moved ${direction}${changePct.toFixed(1)}%`;
  }

  if (message.type === "signal_expired" && pool) {
    return `${t("feed.headline.signalExpired")} ${formatAddr(pool)}`;
  }

  if (message.type === "fee_change" && pool) {
    return `${t("feed.headline.feeChange")} ${formatAddr(pool)}`;
  }

  if (message.type === "signal_alert" && pool) {
    return `${t("feed.headline.signalAlert")} ${formatAddr(pool)}`;
  }

  if (message.type === "strategy") return t("feed.headline.strategy");
  if (message.type === "chat") return message.role === "user" ? t("feed.headline.userChat") : t("feed.headline.aiChat");
  if (message.type === "system") return t("feed.headline.system");

  return firstSentence(message.content) || t("feed.headline.recommendation");
}

function deriveBody(content: string, headline: string): string {
  const trimmed = content.trim();
  if (!trimmed || trimmed === headline) return "";
  if (trimmed.startsWith(headline)) {
    return trimmed.slice(headline.length).replace(/^[\s:.-]+/, "").trim();
  }
  return trimmed;
}

function deriveUrgency(message: Message): Urgency {
  const changePct = readNumber(message.metadata, ["changePct", "change_pct"]);
  const riskScore = readNumber(message.metadata, ["riskScore", "risk_score", "risk"]);

  if (message.type === "signal_expired") return "expired";
  if (changePct !== null && Math.abs(changePct) >= 10) return "hot";
  if (message.type === "signal_alert" && riskScore !== null && riskScore >= 70) return "hot";
  if (message.type === "price_alert" || message.type === "fee_change" || message.type === "signal_alert") return "live";
  if (message.type === "recommendation") return "warning";
  return "info";
}

function metricTone(metric: Metric): string {
  const label = metric.label.toLowerCase();
  if (label.includes("risk") || label.includes("volatility")) {
    return metric.value >= 70
      ? "text-teal-700 dark:text-teal-200"
      : metric.value >= 40
        ? "text-green-700 dark:text-green-200"
        : "text-emerald-600 dark:text-emerald-300";
  }
  if (label.includes("alpha") || label.includes("liquidity")) {
    return metric.value >= 70
      ? "text-emerald-600 dark:text-emerald-300"
      : metric.value >= 40
        ? "text-teal-700 dark:text-teal-200"
        : "text-zinc-500";
  }
  return "text-zinc-700 dark:text-zinc-200";
}

function metricFill(metric: Metric): string {
  const label = metric.label.toLowerCase();
  if (label.includes("risk") || label.includes("volatility")) {
    return metric.value >= 70
      ? "bg-teal-500"
      : metric.value >= 40
        ? "bg-green-500"
        : "bg-emerald-500";
  }
  if (label.includes("alpha") || label.includes("liquidity")) {
    return metric.value >= 70
      ? "bg-emerald-500"
      : metric.value >= 40
        ? "bg-teal-500"
        : "bg-zinc-500";
  }
  return "bg-green-500";
}

function extractMetrics(message: Message): Metric[] {
  if (message.metadata?.metrics && Array.isArray(message.metadata.metrics)) {
    return (message.metadata.metrics as Metric[]).filter(
      (m) => typeof m.label === "string" && typeof m.value === "number" && typeof m.min === "number" && typeof m.max === "number",
    );
  }

  const metrics: Metric[] = [];
  const metricKeys = [
    ["riskScore", "Risk"],
    ["alphaScore", "Alpha"],
    ["liquidityScore", "Liquidity"],
    ["volatilityScore", "Volatility"],
  ] as const;

  for (const [key, label] of metricKeys) {
    const value = readNumber(message.metadata, [key]);
    if (value !== null) metrics.push({ label, value, min: 0, max: 100 });
  }

  const regex = /\b(risk|alpha|liquidity|fee|volatility)[:\s]*(\d+(?:\.\d+)?)/gi;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(message.content)) !== null) {
    const val = parseFloat(match[2]);
    if (val >= 0 && val <= 100 && !metrics.some((m) => m.label.toLowerCase() === match?.[1].toLowerCase())) {
      metrics.push({
        label: match[1].charAt(0).toUpperCase() + match[1].slice(1).toLowerCase(),
        value: val,
        min: 0,
        max: 100,
      });
    }
  }
  return metrics.slice(0, 4);
}

function buildReceipts(message: Message, t: (key: TranslationKeys) => string): Receipt[] {
  const metadata = message.metadata;
  if (!metadata) return [];

  const receipts: Receipt[] = [];
  const push = (label: TranslationKeys, value: string | null) => {
    if (value) receipts.push({ label: t(label), value });
  };

  push("feed.receipt.pool", readString(metadata, ["pool_id", "poolId"]));
  push("feed.receipt.publisher", readString(metadata, ["publisher", "signer"]));
  push("feed.receipt.tx", readString(metadata, ["txHash", "transactionHash"]));
  push("feed.receipt.execution", readString(metadata, ["executionId"]));
  push("feed.receipt.signal", readString(metadata, ["signalId"]));
  push("feed.receipt.direction", readString(metadata, ["direction"]));
  push("feed.receipt.amount", readString(metadata, ["amount"]));

  const token = readString(metadata, ["symbol", "tokenSymbol", "token"]);
  if (token) push("feed.receipt.token", token);

  const changePct = readNumber(metadata, ["changePct", "change_pct"]);
  if (changePct !== null) {
    const direction = changePct >= 0 ? "+" : "";
    push("feed.receipt.change", `${direction}${changePct.toFixed(2)}%`);
  }

  const currentPrice = readNumber(metadata, ["currentPrice"]);
  if (currentPrice !== null) push("feed.receipt.price", `$${formatCompactNumber(currentPrice)}`);

  const expiresAt = readNumber(metadata, ["expiresAt"]);
  if (expiresAt !== null) push("feed.receipt.expires", formatDateTime(expiresAt > 10_000_000_000 ? expiresAt : expiresAt * 1000));

  const alertType = readString(metadata, ["alertType"]);
  if (alertType) push("feed.receipt.alert", alertType.replace(/_/g, " "));

  return receipts;
}

function MetricChip({ metric }: { metric: Metric }) {
  const range = metric.max - metric.min;
  const pct = range > 0 ? Math.min(100, Math.max(0, ((metric.value - metric.min) / range) * 100)) : 0;

  return (
    <div className="min-h-16 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 dark:border-zinc-800 dark:bg-zinc-900/60">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] font-medium text-zinc-500">{metric.label}</span>
        <span className={`text-sm font-semibold ${metricTone(metric)}`}>{Math.round(metric.value)}</span>
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
        <div className={`h-full rounded-full ${metricFill(metric)}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function SignalHeader({
  message,
  t,
  urgencyKey,
}: {
  message: Message;
  t: (key: TranslationKeys) => string;
  urgencyKey: Urgency;
}) {
  const chrome = signalChrome[urgencyKey];
  const urgency = urgencyStyles[urgencyKey];
  const pool = readString(message.metadata, ["pool_id", "poolId"]);

  return (
    <div className="flex items-center justify-between gap-3 px-4 pt-4 sm:px-5">
      <div className="flex min-w-0 items-center gap-2">
        <span className="relative flex h-2.5 w-2.5 shrink-0">
          <span className={`absolute inline-flex h-full w-full animate-ping rounded-full ${chrome.dot} opacity-60`} />
          <span className={`relative inline-flex h-2.5 w-2.5 rounded-full ${chrome.dot}`} />
        </span>
        <span className="text-[11px] font-semibold text-zinc-700 dark:text-zinc-200">
          Aurex Signal
        </span>
        <span className="hidden text-[11px] text-zinc-400 sm:inline">{"·"}</span>
        <span className="truncate text-[11px] text-zinc-500 dark:text-zinc-400">
          {shortHash(message.id)}
        </span>
        {pool && (
          <span className="hidden rounded border border-zinc-300/70 bg-white/50 px-1.5 py-0.5 text-[11px] text-zinc-600 dark:border-zinc-700 dark:bg-zinc-950/40 dark:text-zinc-400 sm:inline">
            {formatAddr(pool)}
          </span>
        )}
      </div>
      <div className={`flex shrink-0 items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${chrome.chip}`}>
        <span className="material-icons-outlined text-sm">{urgency.icon}</span>
        {t(urgency.label)}
      </div>
    </div>
  );
}

export function FeedCard({ message, onAccept, onDismiss }: FeedCardProps) {
  const { t } = useTranslation();
  const { address: userAddress } = useAccount();
  const [copied, setCopied] = useState(false);

  const publisherAddr = readString(message.metadata, ["publisher", "signer"]);
  const avatarAddress = publisherAddr
    || userAddress
    || "0x0000000000000000000000000000000000000000";
  const displayName = publisherAddr
    ? formatAddr(publisherAddr)
    : message.role === "user"
      ? t("feed.you")
      : "Aurex AI";
  const subtitleAddr = publisherAddr
    ? formatAddr(publisherAddr)
    : userAddress
      ? formatAddr(userAddress)
      : null;
  const headline = deriveHeadline(message, t);
  const body = deriveBody(message.content, headline);
  const urgencyKey = deriveUrgency(message);
  const chrome = signalChrome[urgencyKey];
  const metrics = extractMetrics(message);
  const receipts = buildReceipts(message, t);
  const canExecute = message.type === "recommendation" && message.role === "assistant" && !!onAccept;
  const canOpenTerminal = message.role === "assistant" && message.type !== "chat" && message.type !== "system";

  async function copyThesis() {
    const thesis = `${headline}\n\n${message.content}`.trim();
    await navigator.clipboard.writeText(thesis);
    setCopied(true);
    setTimeout(() => setCopied(false), 1400);
  }

  return (
    <article className="group relative overflow-hidden rounded-2xl border border-zinc-200/80 bg-zinc-50/60 font-sans backdrop-blur-sm dark:border-zinc-800/80 dark:bg-zinc-900/60">
      <SignalHeader message={message} t={t} urgencyKey={urgencyKey} />
      <div className="relative p-4 pt-3 sm:p-5 sm:pt-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <SignalAvatar address={avatarAddress} />
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{displayName}</span>
                <span className="text-xs text-zinc-500">{formatDateTime(message.createdAt)}</span>
              </div>
              {subtitleAddr && <p className="truncate text-xs text-zinc-500">{subtitleAddr}</p>}
            </div>
          </div>
        </div>

        <div className="mt-4">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex h-[26px] w-[26px] shrink-0 items-center justify-center overflow-hidden rounded-md border border-zinc-200 bg-white/60 text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950/60 dark:text-zinc-400">
              <span
                className="material-icons-outlined"
                style={{ fontSize: "16px", lineHeight: 1, width: "16px" }}
              >
                {typeIcons[message.type]}
              </span>
            </div>
            <span className="flex h-[26px] items-center rounded-md border border-zinc-200 bg-white/60 px-2 text-[11px] font-semibold text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950/60">
              {t(`feed.type.${message.type}` as TranslationKeys)}
            </span>
            {readString(message.metadata, ["pool_id", "poolId"]) && (
              <span className="flex h-[26px] items-center rounded-md border border-emerald-200 bg-emerald-50 px-2 text-[11px] font-semibold text-emerald-700 dark:border-emerald-500/25 dark:bg-emerald-500/10 dark:text-emerald-300">
                {formatAddr(readString(message.metadata, ["pool_id", "poolId"]) ?? "")}
              </span>
            )}
          </div>
          <div className="mt-4 space-y-2">
            <h2 className="text-[17px] font-semibold leading-snug text-zinc-950 dark:text-white">
              {headline}
            </h2>
            {body && (
              <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">
                {body}
              </p>
            )}
          </div>
        </div>

        {metrics.length > 0 && (
          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {metrics.map((metric) => (
              <MetricChip key={`${metric.label}-${metric.value}`} metric={metric} />
            ))}
          </div>
        )}

        {message.role === "assistant" && (
          <div className="mt-4 flex items-end justify-between gap-3">
            <div className="flex min-w-0 flex-wrap items-center gap-1.5">
              {canOpenTerminal && (
                <Link
                  href="/terminal"
                  className="inline-flex h-[26px] items-center gap-1.5 rounded-md border border-emerald-200 bg-emerald-50/60 px-2 text-[11px] font-semibold text-emerald-800 transition-colors hover:bg-emerald-100 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-200 dark:hover:bg-emerald-500/15"
                >
                  <span className="material-icons-outlined" style={{ fontSize: "16px", lineHeight: 1 }}>
                    open_in_new
                  </span>
                  {t("feed.openTerminal")}
                </Link>
              )}
              <button
                type="button"
                onClick={copyThesis}
                title={t("feed.copyThesis")}
                className="flex h-[26px] w-[26px] items-center justify-center rounded-md border border-zinc-200 text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-800 dark:border-zinc-800 dark:hover:bg-zinc-900 dark:hover:text-zinc-100"
              >
                <span className="material-icons-outlined" style={{ fontSize: "16px", lineHeight: 1 }}>
                  {copied ? "done" : "content_copy"}
                </span>
              </button>
              {onDismiss && (
                <button
                  type="button"
                  onClick={() => onDismiss(message)}
                  title={t("feed.dismiss")}
                  className="flex h-[26px] w-[26px] items-center justify-center rounded-md border border-zinc-200 text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-800 dark:border-zinc-800 dark:hover:bg-zinc-900 dark:hover:text-zinc-100"
                >
                  <span className="material-icons-outlined" style={{ fontSize: "16px", lineHeight: 1 }}>
                    close
                  </span>
                </button>
              )}
            </div>

            {canExecute && (
              <button
                type="button"
                onClick={() => onAccept?.(message)}
                title={t("feed.accept")}
                aria-label={t("feed.accept")}
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border text-white transition-colors ${chrome.primary}`}
              >
                <span className="material-icons-outlined" style={{ fontSize: "18px", lineHeight: 1 }}>
                  bolt
                </span>
              </button>
            )}
          </div>
        )}

        {receipts.length > 0 && (
          <details className="mt-4 border-t border-zinc-200 pt-3 dark:border-zinc-800">
            <summary className="cursor-pointer select-none text-xs font-semibold text-zinc-500">
              {t("feed.receipts")}
            </summary>
            <dl className="mt-3 grid grid-cols-1 gap-2 text-xs sm:grid-cols-2">
              {receipts.map((receipt) => (
                <div key={`${receipt.label}-${receipt.value}`} className="flex min-w-0 items-center justify-between gap-3">
                  <dt className="shrink-0 text-zinc-500">{receipt.label}</dt>
                  <dd className="truncate text-zinc-700 dark:text-zinc-300" title={receipt.value}>
                    {receipt.value}
                  </dd>
                </div>
              ))}
            </dl>
          </details>
        )}
      </div>
    </article>
  );
}
