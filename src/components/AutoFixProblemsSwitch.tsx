import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useSettings } from "@/hooks/useSettings";
import { useTranslation } from "react-i18next";

import { showInfo } from "@/lib/toast";

export function AutoFixProblemsSwitch({
  showToast = false,
}: {
  showToast?: boolean;
}) {
  const { t } = useTranslation("settings");
  const { settings, updateSettings } = useSettings();
  return (
    <div className="flex items-center space-x-2">
      <Switch
        id="auto-fix-problems"
        aria-label={t("workflow.autoFix")}
        checked={settings?.enableAutoFixProblems}
        onCheckedChange={() => {
          updateSettings({
            enableAutoFixProblems: !settings?.enableAutoFixProblems,
          });
          if (!settings?.enableAutoFixProblems && showToast) {
            showInfo(t("workflow.autoFixDisableHint"));
          }
        }}
      />
      <Label htmlFor="auto-fix-problems">{t("workflow.autoFix")}</Label>
    </div>
  );
}
