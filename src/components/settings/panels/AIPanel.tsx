import { MaxChatTurnsSelector } from "@/components/MaxChatTurnsSelector";
import { OpenCodeConnectionModeSelector } from "@/components/OpenCodeConnectionModeSelector";
import { ThinkingBudgetSelector } from "@/components/ThinkingBudgetSelector";
import { useTranslation } from "react-i18next";

export function AIPanel() {
  const { t } = useTranslation("app");

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-foreground">
        {t("settings.tabs.ai")}
      </h2>

      <div className="space-y-4">
        <OpenCodeConnectionModeSelector />
        <ThinkingBudgetSelector />
        <MaxChatTurnsSelector />
      </div>
    </div>
  );
}
