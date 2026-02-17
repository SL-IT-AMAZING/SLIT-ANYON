import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useSettings } from "@/hooks/useSettings";
import { useTranslation } from "react-i18next";

export function TelemetrySwitch() {
  const { t } = useTranslation("settings");
  const { settings, updateSettings } = useSettings();
  return (
    <div className="flex items-center space-x-2">
      <Switch
        id="telemetry-switch"
        aria-label={t("telemetry.title")}
        checked={settings?.telemetryConsent === "opted_in"}
        onCheckedChange={() => {
          updateSettings({
            telemetryConsent:
              settings?.telemetryConsent === "opted_in"
                ? "opted_out"
                : "opted_in",
          });
        }}
      />
      <Label htmlFor="telemetry-switch">{t("telemetry.title")}</Label>
    </div>
  );
}
