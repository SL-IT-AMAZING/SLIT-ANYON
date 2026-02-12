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
import { toast } from "sonner";

export function ReleaseChannelSelector() {
  const { settings, updateSettings } = useSettings();

  if (!settings) {
    return null;
  }

  const handleReleaseChannelChange = (value: ReleaseChannel) => {
    updateSettings({ releaseChannel: value });
    if (value === "stable") {
      toast("Using Stable release channel", {
        description:
          "You'll stay on your current version until a newer stable release is available, or you can manually downgrade now.",
        action: {
          label: "Download Stable",
          onClick: () => {
            ipc.system.openExternalUrl("https://any-on.dev/download");
          },
        },
      });
    } else {
      toast("Using Beta release channel", {
        description:
          "You will need to restart ANYON for your settings to take effect.",
        action: {
          label: "Restart ANYON",
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
          Release Channel
        </label>
        <Select
          value={settings.releaseChannel}
          onValueChange={(v) => v && handleReleaseChannelChange(v)}
        >
          <SelectTrigger className="w-32" id="release-channel">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="stable">Stable</SelectItem>
            <SelectItem value="beta">Beta</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="text-sm text-muted-foreground">
        <p>Stable is recommended for most users. </p>
        <p>Beta receives more frequent updates but may have more bugs.</p>
      </div>
    </div>
  );
}
