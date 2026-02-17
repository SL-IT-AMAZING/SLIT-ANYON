import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useSettings } from "@/hooks/useSettings";
import { ipc } from "@/ipc/types";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

export function AutoUpdateSwitch() {
  const { t } = useTranslation("settings");
  const { settings, updateSettings } = useSettings();

  if (!settings) {
    return null;
  }

  return (
    <div className="flex items-center space-x-2">
      <Switch
        id="enable-auto-update"
        aria-label={t("general.autoUpdate")}
        checked={settings.enableAutoUpdate}
        onCheckedChange={(checked) => {
          updateSettings({ enableAutoUpdate: checked });
          toast(t("general.autoUpdateChanged"), {
            description: t("general.restartRequired"),
            action: {
              label: t("general.restartAnyon"),
              onClick: () => {
                ipc.system.restartAnyon();
              },
            },
          });
        }}
      />
      <Label htmlFor="enable-auto-update">{t("general.autoUpdate")}</Label>
    </div>
  );
}
