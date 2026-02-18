import { GitHubIntegration } from "@/components/GitHubIntegration";
import { SupabaseIntegration } from "@/components/SupabaseIntegration";
import { VercelIntegration } from "@/components/VercelIntegration";
import { useTranslation } from "react-i18next";

export function IntegrationsPanel() {
  const { t } = useTranslation("app");

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-foreground">
        {t("settings.tabs.integrations")}
      </h2>

      <div className="space-y-4">
        <GitHubIntegration />
        <VercelIntegration />
        <SupabaseIntegration />
      </div>
    </div>
  );
}
