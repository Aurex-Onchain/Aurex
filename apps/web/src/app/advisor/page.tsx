"use client";

import { PublisherStatus } from "@/components/advisor/publisher-status";
import { BehaviorDashboard } from "@/components/advisor/behavior-dashboard";
import { OpenClawStatus } from "@/components/advisor/openclaw-status";
import { OpenClawGuide } from "@/components/advisor/openclaw-guide";
import { RecentPoolEvents } from "@/components/advisor/recent-pool-events";
import { WatchedTokenEvents } from "@/components/advisor/watched-token-events";
import { useTranslation } from "@/i18n";
import { CollapsibleHeader } from "@/components/ui/collapsible-header";

export default function AdvisorPage() {
  const { t } = useTranslation();

  return (
    <CollapsibleHeader title={t("advisor.title")} description={t("advisor.description")}>
      <div className="px-5 pb-8 space-y-8">
        <section>
          <h3 className="text-sm font-semibold text-zinc-400 uppercase mb-4">
            {t("advisor.openclawConnection")}
          </h3>
          <OpenClawStatus />
          <OpenClawGuide />
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
          <section className="flex min-h-0 flex-col">
            <h3 className="text-sm font-semibold text-zinc-400 uppercase mb-4">
              {t("advisor.publisher")}
            </h3>
            <div className="flex-1 [&>*]:h-full">
              <PublisherStatus />
            </div>
          </section>
          <section className="flex min-h-0 flex-col">
            <h3 className="text-sm font-semibold text-zinc-400 uppercase mb-4">
              {t("advisor.behaviorMonitor")}
            </h3>
            <div className="flex-1 [&>*]:h-full">
              <BehaviorDashboard />
            </div>
          </section>
        </div>

        <section>
          <h3 className="text-sm font-semibold text-zinc-400 uppercase mb-4">
            {t("advisor.recentPoolEvents")}
          </h3>
          <RecentPoolEvents />
        </section>

        <section>
          <h3 className="text-sm font-semibold text-zinc-400 uppercase mb-4">
            {t("advisor.watchedTokenEvents")}
          </h3>
          <WatchedTokenEvents />
        </section>
      </div>
    </CollapsibleHeader>
  );
}
