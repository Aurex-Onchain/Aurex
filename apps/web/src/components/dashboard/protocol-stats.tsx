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

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        title={t("dashboard.activePools")}
        value={String(activePools)}
        loading={marketLoading}
      />
      <StatCard
        title={t("dashboard.validSignals")}
        value={`${validSignals} / ${activePools}`}
        loading={marketLoading}
      />
      <StatCard
        title={t("dashboard.publishers")}
        value={String(market?.pools.length ? "Active" : "None")}
        loading={marketLoading}
      />
      <StatCard
        title={t("dashboard.behaviorLevel")}
        value={behaviorLevel.charAt(0).toUpperCase() + behaviorLevel.slice(1)}
        loading={behaviorLoading}
      />
    </div>
  );
}
