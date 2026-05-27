"use client";

import { useMemo, useState } from "react";
import { useMessages, type Message } from "@/hooks/use-messages";
import { FeedCard } from "./feed-card";
import { useTranslation } from "@/i18n";
import { TickerBar } from "./ticker-bar";
import { useCollapsed } from "@/components/ui/collapsible-header";

interface FeedListProps {
  onAccept: (message: Message) => void;
}

export function FeedList({ onAccept }: FeedListProps) {
  const { data, isLoading } = useMessages();
  const { t } = useTranslation();
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(() => new Set());
  const collapsed = useCollapsed();

  if (isLoading) {
    return (
      <div className="space-y-3 px-3 sm:px-5">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-32 animate-pulse rounded-xl bg-zinc-100 dark:bg-zinc-900" />
        ))}
      </div>
    );
  }

  const messages = data?.messages ?? [];
  const visibleMessages = messages.filter((message) => !dismissedIds.has(message.id));

  if (visibleMessages.length === 0) {
    return (
      <div className="px-3 py-12 sm:px-5">
        <div className="rounded-lg border border-dashed border-zinc-300 p-8 text-center dark:border-zinc-800">
          <span className="material-icons-outlined text-3xl text-zinc-400">sensors</span>
          <p className="mt-3 text-sm text-zinc-500">{t("feed.empty")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3 px-3 sm:px-5">
      <MarketPulse messages={visibleMessages} />
      <div
        aria-hidden={collapsed}
        className={`transition-opacity duration-150 ${collapsed ? "pointer-events-none opacity-0" : "opacity-100"}`}
      >
        <TickerBar />
      </div>
      {visibleMessages.map((msg) => (
        <FeedCard
          key={msg.id}
          message={msg}
          onAccept={onAccept}
          onDismiss={(message) => {
            setDismissedIds((current) => {
              const next = new Set(current);
              next.add(message.id);
              return next;
            });
          }}
        />
      ))}
    </div>
  );
}

function MarketPulse({ messages }: { messages: Message[] }) {
  const { t } = useTranslation();

  const stats = useMemo(() => {
    const hot = messages.filter(isHighAttention).length;
    const executable = messages.filter((message) => message.type === "recommendation" && message.role === "assistant").length;
    const live = messages.filter((message) => ["signal_alert", "price_alert", "fee_change"].includes(message.type)).length;
    const latest = messages[0]?.createdAt ?? null;
    return { hot, executable, live, latest };
  }, [messages]);

  return (
    <section className="rounded-2xl border border-zinc-200/80 bg-zinc-50/60 px-3 py-2 backdrop-blur-sm dark:border-zinc-800/80 dark:bg-zinc-900/60">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex shrink-0 items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center overflow-hidden rounded-md border border-emerald-200 bg-emerald-50 text-emerald-600 dark:border-emerald-500/25 dark:bg-emerald-500/10 dark:text-emerald-300">
            <span
              className="material-icons-outlined"
              style={{ fontSize: "16px", lineHeight: 1, width: "16px" }}
            >
              monitoring
            </span>
          </span>
          <div className="leading-tight">
            <h3 className="text-xs font-semibold text-zinc-700 dark:text-zinc-200">
              {t("feed.pulse.title")}
            </h3>
            <p className="text-[11px] text-zinc-500">{t("feed.pulse.refresh")}</p>
          </div>
        </div>
        <div className="flex min-w-0 flex-wrap gap-1.5 sm:justify-end">
          <PulseMetric label={t("feed.pulse.live")} value={String(stats.live)} tone="text-emerald-600 dark:text-emerald-300" />
          <PulseMetric label={t("feed.pulse.hot")} value={String(stats.hot)} tone="text-teal-700 dark:text-teal-200" />
          <PulseMetric label={t("feed.pulse.executable")} value={String(stats.executable)} tone="text-green-700 dark:text-green-200" />
          <PulseMetric label={t("feed.pulse.latest")} value={stats.latest ? formatTime(stats.latest) : "--"} tone="text-green-700 dark:text-green-200" />
        </div>
      </div>
    </section>
  );
}

function PulseMetric({ label, value, tone }: { label: string; value: string; tone: string }) {
  return (
    <div className="inline-flex h-8 items-center gap-2 rounded-md border border-zinc-200 bg-zinc-50 px-2.5 dark:border-zinc-800 dark:bg-zinc-900/60">
      <span className="text-[11px] font-medium text-zinc-500">{label}</span>
      <span className={`text-sm font-semibold ${tone}`}>{value}</span>
    </div>
  );
}

function isHighAttention(message: Message): boolean {
  const changePct = readNumber(message.metadata, "changePct");
  return message.type === "signal_expired"
    || message.type === "fee_change"
    || message.type === "signal_alert"
    || (changePct !== null && Math.abs(changePct) >= 5);
}

function readNumber(metadata: Record<string, unknown> | null, key: string): number | null {
  const value = metadata?.[key];
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}
