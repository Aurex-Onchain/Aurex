"use client";

import { SignalTable } from "@/components/signals/signal-table";
import { useTranslation } from "@/i18n";
import { CollapsibleHeader } from "@/components/ui/collapsible-header";

export default function SignalsPage() {
  const { t } = useTranslation();

  return (
    <CollapsibleHeader title={t("signals.title")} description={t("signals.description")}>
      <div className="px-3 sm:px-5 pb-8">
        <SignalTable />
      </div>
    </CollapsibleHeader>
  );
}
