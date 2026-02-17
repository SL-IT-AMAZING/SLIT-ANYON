import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useFreeAgentQuota } from "@/hooks/useFreeAgentQuota";
import { useSettings } from "@/hooks/useSettings";
import type { ChatMode } from "@/lib/schemas";
import { getEffectiveDefaultChatMode, isAnyonProEnabled } from "@/lib/schemas";
import { useTranslation } from "react-i18next";

export function DefaultChatModeSelector() {
  const { t } = useTranslation("settings");
  const { settings, updateSettings, envVars } = useSettings();
  const { isQuotaExceeded, isLoading: isQuotaLoading } = useFreeAgentQuota();

  if (!settings) {
    return null;
  }

  const isProEnabled = isAnyonProEnabled(settings);
  // Wait for quota status to load before determining effective default
  const freeAgentQuotaAvailable = !isQuotaLoading && !isQuotaExceeded;
  const effectiveDefault = getEffectiveDefaultChatMode(
    settings,
    envVars,
    freeAgentQuotaAvailable,
  );
  // Show Basic Agent option if user is Pro OR if they have free quota available
  const showBasicAgentOption = isProEnabled || freeAgentQuotaAvailable;

  const handleDefaultChatModeChange = (value: ChatMode) => {
    updateSettings({ defaultChatMode: value });
  };

  const getModeDisplayName = (mode: ChatMode) => {
    switch (mode) {
      case "build":
        return t("ai.defaultChatModeOptions.build.title");
      case "agent":
        return t("ai.defaultChatModeOptions.agent.title");
      case "local-agent":
        return isProEnabled
          ? t("ai.defaultChatModeOptions.localAgent.proTitle")
          : t("ai.defaultChatModeOptions.localAgent.freeTitle");
      case "ask":
      default:
        throw new Error(`Unknown chat mode: ${mode}`);
    }
  };

  return (
    <div className="space-y-1">
      <div className="flex items-center space-x-2">
        <label
          htmlFor="default-chat-mode"
          className="text-sm font-medium text-muted-foreground"
        >
          {t("ai.defaultChatMode")}
        </label>
        <Select
          value={effectiveDefault}
          onValueChange={(v) => v && handleDefaultChatModeChange(v)}
        >
          <SelectTrigger className="w-40" id="default-chat-mode">
            <SelectValue>{getModeDisplayName(effectiveDefault)}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            {showBasicAgentOption && (
              <SelectItem value="local-agent">
                <div className="flex flex-col items-start">
                  <span className="font-medium">
                    {isProEnabled
                      ? t("ai.defaultChatModeOptions.localAgent.proTitle")
                      : t("ai.defaultChatModeOptions.localAgent.freeTitle")}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {isProEnabled
                      ? t("ai.defaultChatModeOptions.localAgent.proDescription")
                      : t(
                          "ai.defaultChatModeOptions.localAgent.freeDescription",
                        )}
                  </span>
                </div>
              </SelectItem>
            )}
            <SelectItem value="build">
              <div className="flex flex-col items-start">
                <span className="font-medium">
                  {t("ai.defaultChatModeOptions.build.title")}
                </span>
                <span className="text-xs text-muted-foreground">
                  {t("ai.defaultChatModeOptions.build.description")}
                </span>
              </div>
            </SelectItem>
            <SelectItem value="agent">
              <div className="flex flex-col items-start">
                <span className="font-medium">
                  {t("ai.defaultChatModeOptions.agent.title")}
                </span>
                <span className="text-xs text-muted-foreground">
                  {t("ai.defaultChatModeOptions.agent.description")}
                </span>
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="text-sm text-muted-foreground">
        {t("ai.defaultChatModeDescription")}
      </div>
    </div>
  );
}
