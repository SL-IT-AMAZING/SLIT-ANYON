import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSettings } from "@/hooks/useSettings";
import { ipc } from "@/ipc/types";
import { showError } from "@/lib/toast";
import { useTranslation } from "react-i18next";

export function RuntimeModeSelector() {
  const { t } = useTranslation("settings");
  const { settings, updateSettings } = useSettings();

  if (!settings) {
    return null;
  }

  const isDockerMode = settings?.runtimeMode2 === "docker";

  const handleRuntimeModeChange = async (value: "host" | "docker") => {
    try {
      await updateSettings({ runtimeMode2: value });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      showError(t("general.runtimeModeUpdateFailed", { message }));
    }
  };

  return (
    <div className="space-y-2">
      <div className="space-y-1">
        <div className="flex items-center space-x-2">
          <Label className="text-sm font-medium" htmlFor="runtime-mode">
            {t("general.runtimeMode")}
          </Label>
          <Select
            value={settings.runtimeMode2 ?? "host"}
            onValueChange={(v) => v && handleRuntimeModeChange(v)}
          >
            <SelectTrigger className="w-48" id="runtime-mode">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="host">
                {t("general.runtimeModeOptions.host")}
              </SelectItem>
              <SelectItem value="docker">
                {t("general.runtimeModeOptions.docker")}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="text-sm text-muted-foreground">
          {t("general.runtimeModeDescription")}
        </div>
      </div>
      {isDockerMode && (
        <div className="text-sm text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 p-2 rounded">
          {t("general.runtimeModeDockerWarningPrefix")}{" "}
          <b>{t("general.runtimeModeDockerExperimental")}</b>{" "}
          {t("general.runtimeModeDockerWarningMiddle")}{" "}
          <button
            type="button"
            className="underline font-medium cursor-pointer"
            onClick={() =>
              ipc.system.openExternalUrl(
                "https://www.docker.com/products/docker-desktop/",
              )
            }
          >
            {t("general.runtimeModeDockerDesktop")}
          </button>{" "}
          {t("general.runtimeModeDockerWarningSuffix")}
        </div>
      )}
    </div>
  );
}
