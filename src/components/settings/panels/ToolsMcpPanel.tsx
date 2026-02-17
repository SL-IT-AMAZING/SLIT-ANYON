import { ToolsMcpSettings } from "@/components/settings/ToolsMcpSettings";
import { useTranslation } from "react-i18next";

export function ToolsMcpPanel() {
  const { t } = useTranslation("app");

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-foreground">
        {t("settings.tabs.toolsMcp")}
      </h2>
      <ToolsMcpSettings />
    </div>
  );
}
