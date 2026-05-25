"use client";

import { ProtocolStats } from "@/components/dashboard/protocol-stats";
import { PoolList } from "@/components/dashboard/pool-list";
import { PublisherLeaderboard } from "@/components/dashboard/publisher-leaderboard";
import { SignalTimeline } from "@/components/dashboard/signal-timeline";
import { LatestSignals } from "@/components/dashboard/latest-signals";
import { StakingPanel } from "@/components/dashboard/staking-panel";
import { useTranslation } from "@/i18n";
import { CollapsibleHeader } from "@/components/ui/collapsible-header";

export default function DashboardPage() {
  const { t } = useTranslation();

  return (
    <CollapsibleHeader title={t("dashboard.title")}>
      <div className="px-3 sm:px-5 pb-8 space-y-6 sm:space-y-8">
        <ProtocolStats />
        <StakingPanel />
        <section>
          <h3 className="text-sm font-semibold text-zinc-400 uppercase mb-4">
            {t("timeline.title")}
          </h3>
          <SignalTimeline />
        </section>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <section>
            <h3 className="text-sm font-semibold text-zinc-400 uppercase mb-4">
              {t("dashboard.pools")}
            </h3>
            <PoolList />
          </section>
          <section>
            <h3 className="text-sm font-semibold text-zinc-400 uppercase mb-4">
              {t("dashboard.publisherLeaderboard")}
            </h3>
            <PublisherLeaderboard />
          </section>
        </div>
        <section>
          <h3 className="text-sm font-semibold text-zinc-400 uppercase mb-4">
            {t("dashboard.latestSignals")}
          </h3>
          <LatestSignals />
        </section>
      </div>
    </CollapsibleHeader>
  );
}
