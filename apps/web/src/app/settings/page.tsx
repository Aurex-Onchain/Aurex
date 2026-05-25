"use client";

import { SettingsForm } from "@/components/settings/settings-form";
import { useTranslation } from "@/i18n";
import { CollapsibleHeader } from "@/components/ui/collapsible-header";

export default function SettingsPage() {
  const { t } = useTranslation();

  return (
    <CollapsibleHeader title={t("settings.title")} description={t("settings.description")}>
      <div className="px-5 pb-8 max-w-4xl">
        <SettingsForm />
      </div>
    </CollapsibleHeader>
  );
}
