import { AutoUpdateSwitch } from "@/components/AutoUpdateSwitch";
import { LanguageSelector } from "@/components/LanguageSelector";
import { NodePathSelector } from "@/components/NodePathSelector";
import { ReleaseChannelSelector } from "@/components/ReleaseChannelSelector";
import { RuntimeModeSelector } from "@/components/RuntimeModeSelector";
import { TelemetrySwitch } from "@/components/TelemetrySwitch";
import { ZoomSelector } from "@/components/ZoomSelector";
import { useTheme } from "@/contexts/ThemeContext";
import { useAppVersion } from "@/hooks/useAppVersion";
import { useSettings } from "@/hooks/useSettings";
import { useTranslation } from "react-i18next";

export function GeneralPanel() {
  const { t } = useTranslation(["app", "settings"]);
  const { theme, setTheme } = useTheme();
  const { settings } = useSettings();
  const appVersion = useAppVersion();

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-foreground">
        {t("settings.tabs.general")}
      </h2>

      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <label className="text-sm font-medium text-muted-foreground">
            {t("general.theme", { ns: "settings" })}
          </label>
          <div className="relative bg-muted rounded-lg p-1 flex">
            {(["system", "light", "dark"] as const).map((option) => (
              <button
                key={option}
                onClick={() => setTheme(option)}
                className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all duration-200 ${
                  theme === option
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {t(`general.themeOptions.${option}`, { ns: "settings" })}
              </button>
            ))}
          </div>
        </div>

        <ZoomSelector />
        <LanguageSelector />

        <div className="space-y-1">
          <AutoUpdateSwitch />
          <div className="text-sm text-muted-foreground">
            {t("general.autoUpdateDescription", { ns: "settings" })}
          </div>
        </div>

        <ReleaseChannelSelector />
        <RuntimeModeSelector />
        <NodePathSelector />

        <div className="space-y-1">
          <TelemetrySwitch />
          <div className="text-sm text-muted-foreground">
            {t("telemetry.description", { ns: "settings" })}
          </div>
        </div>

        {settings && (
          <div className="flex items-center text-sm text-muted-foreground">
            <span className="mr-2 font-medium">
              {t("telemetry.idLabel", { ns: "settings" })}
            </span>
            <span className="bg-muted px-2 py-0.5 rounded text-foreground font-mono">
              {settings.telemetryUserId}
            </span>
          </div>
        )}

        <div className="flex items-center text-sm text-muted-foreground">
          <span className="mr-2 font-medium">
            {t("general.appVersion", { ns: "settings" })}
          </span>
          <span className="bg-muted px-2 py-0.5 rounded text-foreground font-mono">
            {appVersion ? appVersion : "-"}
          </span>
        </div>
      </div>
    </div>
  );
}
