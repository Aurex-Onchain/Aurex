"use client";

import type { Message } from "@/hooks/use-messages";
import { useTranslation } from "@/i18n";
import { addressToColors } from "@/lib/avatar";
import { useAccount } from "wagmi";

const typeIcons: Record<Message["type"], string> = {
  recommendation: "lightbulb",
  signal_alert: "sensors",
  chat: "chat_bubble",
  strategy: "analytics",
  price_alert: "show_chart",
  signal_expired: "timer_off",
  fee_change: "receipt_long",
  system: "info",
};

function getTypeColor(message: Message): string {
  switch (message.type) {
    case "price_alert": {
      const changePct = message.metadata?.changePct as number | undefined;
      return changePct !== undefined && changePct >= 0 ? "text-emerald-400" : "text-red-400";
    }
    case "signal_expired":
      return "text-amber-400";
    case "fee_change":
      return "text-emerald-400";
    case "system":
      return "text-zinc-400";
    default:
      return "text-zinc-500";
  }
}

interface Metric {
  label: string;
  value: number;
  min: number;
  max: number;
}

interface FeedCardProps {
  message: Message;
  onAccept?: (message: Message) => void;
}

function GradientAvatar({ address }: { address: string }) {
  const [c1, c2] = addressToColors(address);
  return (
    <div
      className="w-10 h-10 flex-shrink-0"
      style={{
        background: `linear-gradient(135deg, ${c1}, ${c2})`,
        borderRadius: "22%",
      }}
    />
  );
}

function ProgressBar({ metric }: { metric: Metric }) {
  const range = metric.max - metric.min;
  const pct = range > 0 ? Math.min(100, Math.max(0, ((metric.value - metric.min) / range) * 100)) : 0;

  return (
    <div className="space-y-1.5">
      <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-200">{metric.label}</p>
      <div className="h-2 w-full bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
        <div
          className="h-full bg-emerald-500 rounded-full transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="flex justify-between text-[11px] text-zinc-500">
        <span>{metric.min}</span>
        <span>{metric.max}</span>
      </div>
    </div>
  );
}

function MetricsCard({ metrics }: { metrics: Metric[] }) {
  return (
    <div className="mt-4 p-4 bg-zinc-50 dark:bg-zinc-900 rounded-lg space-y-4">
      {metrics.map((m, i) => (
        <ProgressBar key={i} metric={m} />
      ))}
    </div>
  );
}

function extractMetrics(message: Message): Metric[] {
  if (message.metadata?.metrics && Array.isArray(message.metadata.metrics)) {
    return (message.metadata.metrics as Metric[]).filter(
      (m) => typeof m.label === "string" && typeof m.value === "number" && typeof m.min === "number" && typeof m.max === "number"
    );
  }

  const metrics: Metric[] = [];
  const regex = /\b(risk|alpha|liquidity|fee|volatility)[:\s]*(\d+(?:\.\d+)?)/gi;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(message.content)) !== null) {
    const val = parseFloat(match[2]);
    if (val >= 0 && val <= 100) {
      metrics.push({ label: match[1].charAt(0).toUpperCase() + match[1].slice(1).toLowerCase(), value: val, min: 0, max: 100 });
    }
  }
  return metrics;
}

function formatAddr(addr: string): string {
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

function formatDateTime(timestamp: number): string {
  const date = new Date(timestamp);
  const time = date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  const day = date.toLocaleDateString([], { year: "numeric", month: "long", day: "numeric" });
  return `${time} · ${day}`;
}

export function FeedCard({ message, onAccept }: FeedCardProps) {
  const { t } = useTranslation();
  const { address: userAddress } = useAccount();
  const publisherAddr = message.metadata?.publisher as string | undefined;

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

  return (
    <div className="py-4 px-5">
      <div className="flex items-center gap-3">
        <GradientAvatar address={avatarAddress} />
        <div>
          <span className="text-sm font-medium text-zinc-700 dark:text-zinc-200">{displayName}</span>
          {subtitleAddr && (
            <p className="text-xs text-zinc-500">{subtitleAddr}</p>
          )}
        </div>
      </div>

      <p className="mt-3 text-[15px] text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap break-words leading-relaxed">
        {message.content}
      </p>

      {(() => {
        const metrics = extractMetrics(message);
        return metrics.length > 0 ? <MetricsCard metrics={metrics} /> : null;
      })()}

      {message.type === "recommendation" && message.role === "assistant" && onAccept && (
        <div className="mt-3 flex items-center justify-end gap-3">
          <button
            onClick={() => onAccept(message)}
            className="w-9 h-9 flex items-center justify-center bg-emerald-600 hover:bg-emerald-500 text-white rounded-full transition-colors"
          >
            <span className="material-icons-outlined" style={{ fontSize: "18px" }}>check</span>
          </button>
          <button className="w-9 h-9 flex items-center justify-center bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300 rounded-full transition-colors">
            <span className="material-icons-outlined" style={{ fontSize: "18px" }}>close</span>
          </button>
        </div>
      )}

      <div className="mt-3 flex items-center justify-between">
        <p className="text-xs text-zinc-600">
          {formatDateTime(message.createdAt)}
        </p>
        <div className={`flex items-center gap-1 text-xs ${getTypeColor(message)}`}>
          <span className="material-icons-outlined text-sm">{typeIcons[message.type]}</span>
          {t(`feed.type.${message.type}` as Parameters<typeof t>[0])}
        </div>
      </div>
    </div>
  );
}
