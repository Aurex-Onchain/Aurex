"use client";

import { useMarket } from "@/hooks/use-market";
import { StatCard } from "@/components/ui/stat-card";
import { useBehavior } from "@/hooks/use-behavior";
import { useTranslation } from "@/i18n";

export function ProtocolStats() {
  const { data: market, isLoading: marketLoading } = useMarket();
  const { data: behavior, isLoading: behaviorLoading } = useBehavior();
  const { t } = useTranslation();

  const activePools = market?.pools.length ?? 0;
  const validSignals = market?.pools.filter((p) => p.signalValid).length ?? 0;
  const behaviorLevel = behavior?.level ?? "normal";
  const publisherStatus = market?.pools.length ? t("dashboard.publisherActive") : t("dashboard.publisherNone");

  return (
    <div className="grid auto-rows-fr grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
      <StatCard
        title={t("dashboard.activePools")}
        value={String(activePools)}
        subtitle={t("dashboard.activePoolsHint")}
        icon="hub"
        tone="emerald"
        loading={marketLoading}
      />
      <StatCard
        title={t("dashboard.validSignals")}
        value={`${validSignals} / ${activePools}`}
        subtitle={validSignals > 0 ? t("dashboard.validSignalsLive") : t("dashboard.validSignalsIdle")}
        icon="sensors"
        tone={validSignals > 0 ? "emerald" : "zinc"}
        loading={marketLoading}
      />
      <StatCard
        title={t("dashboard.publishers")}
        value={publisherStatus}
        subtitle={t("dashboard.publishersHint")}
        icon="verified_user"
        tone={market?.pools.length ? "teal" : "zinc"}
        loading={marketLoading}
      />
      <StatCard
        title={t("dashboard.behaviorLevel")}
        value={behaviorLevel.charAt(0).toUpperCase() + behaviorLevel.slice(1)}
        subtitle={t("dashboard.behaviorLevelHint")}
        icon="shield"
        tone={behaviorLevel === "normal" ? "emerald" : "green"}
        loading={behaviorLoading}
      />
    </div>
  );
}
