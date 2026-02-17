import { ProviderSettingsGrid } from "@/components/ProviderSettings";
import { useTranslation } from "react-i18next";

export function ProvidersPanel() {
  const { t } = useTranslation("app");

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-foreground">
        {t("settings.tabs.providers")}
      </h2>
      <ProviderSettingsGrid />
    </div>
  );
}
