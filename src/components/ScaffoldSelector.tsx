import { useSettings } from "@/hooks/useSettings";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ScaffoldId } from "@/shared/templates";
import { useTranslation } from "react-i18next";

export function ScaffoldSelector() {
  const { t } = useTranslation("settings");
  const { settings, updateSettings } = useSettings();

  if (!settings) {
    return null;
  }

  const handleChange = (value: ScaffoldId) => {
    updateSettings({ selectedTemplateId: value });
  };

  return (
    <div className="space-y-1">
      <div className="flex items-center space-x-2">
        <label
          htmlFor="scaffold-selector"
          className="text-sm font-medium text-muted-foreground"
        >
          {t("general.scaffold")}
        </label>
        <Select
          value={settings.selectedTemplateId}
          onValueChange={(v) => v && handleChange(v as ScaffoldId)}
        >
          <SelectTrigger className="w-40" id="scaffold-selector">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="react">
              {t("general.scaffoldOptions.react")}
            </SelectItem>
            <SelectItem value="next">
              {t("general.scaffoldOptions.next")}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="text-sm text-muted-foreground">
        {t("general.scaffoldDescription")}
      </div>
    </div>
  );
}
