import { useSettings } from "@/hooks/useSettings";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ipc } from "@/ipc/types";
import type { ReleaseChannel } from "@/lib/schemas";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

export function ReleaseChannelSelector() {
  const { t } = useTranslation("settings");
  const { settings, updateSettings } = useSettings();

  if (!settings) {
    return null;
  }

  const handleReleaseChannelChange = (value: ReleaseChannel) => {
    updateSettings({ releaseChannel: value });
    if (value === "stable") {
      toast(t("general.releaseChannelToasts.stable.title"), {
        description: t("general.releaseChannelToasts.stable.description"),
        action: {
          label: t("general.releaseChannelToasts.stable.action"),
          onClick: () => {
            ipc.system.openExternalUrl("https://any-on.dev/download");
          },
        },
      });
    } else {
      toast(t("general.releaseChannelToasts.beta.title"), {
        description: t("general.releaseChannelToasts.beta.description"),
        action: {
          label: t("general.releaseChannelToasts.beta.action"),
          onClick: () => {
            ipc.system.restartAnyon();
          },
        },
      });
    }
  };

  return (
    <div className="space-y-1">
      <div className="flex items-center space-x-2">
        <label
          htmlFor="release-channel"
          className="text-sm font-medium text-muted-foreground"
        >
          {t("general.releaseChannel")}
        </label>
        <Select
          value={settings.releaseChannel}
          onValueChange={(v) => v && handleReleaseChannelChange(v)}
        >
          <SelectTrigger className="w-32" id="release-channel">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="stable">
              {t("general.releaseChannelOptions.stable")}
            </SelectItem>
            <SelectItem value="beta">
              {t("general.releaseChannelOptions.beta")}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="text-sm text-muted-foreground">
        <p>{t("general.releaseChannelStableNote")}</p>
        <p>{t("general.releaseChannelBetaNote")}</p>
      </div>
    </div>
  );
}
