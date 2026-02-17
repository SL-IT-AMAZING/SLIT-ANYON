import { AutoApproveSwitch } from "@/components/AutoApproveSwitch";
import { AutoExpandPreviewSwitch } from "@/components/AutoExpandPreviewSwitch";
import { AutoFixProblemsSwitch } from "@/components/AutoFixProblemsSwitch";
import { ChatCompletionNotificationSwitch } from "@/components/ChatCompletionNotificationSwitch";
import { DefaultChatModeSelector } from "@/components/DefaultChatModeSelector";
import { useTranslation } from "react-i18next";

export function WorkflowPanel() {
  const { t } = useTranslation(["app", "settings"]);

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-foreground">
        {t("settings.tabs.workflow")}
      </h2>

      <div className="space-y-4">
        <DefaultChatModeSelector />

        <div className="space-y-1">
          <AutoApproveSwitch showToast={false} />
          <div className="text-sm text-muted-foreground">
            {t("workflow.autoApproveDescription", { ns: "settings" })}
          </div>
        </div>

        <div className="space-y-1">
          <AutoFixProblemsSwitch />
          <div className="text-sm text-muted-foreground">
            {t("workflow.autoFixDescription", { ns: "settings" })}
          </div>
        </div>

        <div className="space-y-1">
          <AutoExpandPreviewSwitch />
          <div className="text-sm text-muted-foreground">
            {t("workflow.autoExpandPreviewDescription", { ns: "settings" })}
          </div>
        </div>

        <div className="space-y-1">
          <ChatCompletionNotificationSwitch />
          <div className="text-sm text-muted-foreground">
            {t("workflow.chatCompletionNotificationDescription", {
              ns: "settings",
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
