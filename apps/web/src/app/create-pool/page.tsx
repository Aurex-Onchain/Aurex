"use client";

import { CreatePoolForm } from "@/components/create-pool/create-pool-form";
import { useTranslation } from "@/i18n";
import { CollapsibleHeader } from "@/components/ui/collapsible-header";

export default function CreatePoolPage() {
  const { t } = useTranslation();

  return (
    <CollapsibleHeader title={t("createPool.title")} description={t("createPool.description")}>
      <div className="px-5 pb-8 max-w-3xl">
        <CreatePoolForm />
      </div>
    </CollapsibleHeader>
  );
}
