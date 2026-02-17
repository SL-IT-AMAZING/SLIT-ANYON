import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MAX_CHAT_TURNS_IN_CONTEXT } from "@/constants/settings_constants";
import { useSettings } from "@/hooks/useSettings";
import type React from "react";
import { useTranslation } from "react-i18next";

interface OptionInfo {
  value: string;
  labelKey:
    | "ai.maxChatTurnsOptions.economy"
    | "ai.maxChatTurnsOptions.default"
    | "ai.maxChatTurnsOptions.plus"
    | "ai.maxChatTurnsOptions.high"
    | "ai.maxChatTurnsOptions.max";
  descriptionKey:
    | "ai.maxChatTurnsDescriptions.economy"
    | "ai.maxChatTurnsDescriptions.default"
    | "ai.maxChatTurnsDescriptions.plus"
    | "ai.maxChatTurnsDescriptions.high"
    | "ai.maxChatTurnsDescriptions.max";
}

const defaultValue = "default";

const options: OptionInfo[] = [
  {
    value: "2",
    labelKey: "ai.maxChatTurnsOptions.economy",
    descriptionKey: "ai.maxChatTurnsDescriptions.economy",
  },
  {
    value: defaultValue,
    labelKey: "ai.maxChatTurnsOptions.default",
    descriptionKey: "ai.maxChatTurnsDescriptions.default",
  },
  {
    value: "5",
    labelKey: "ai.maxChatTurnsOptions.plus",
    descriptionKey: "ai.maxChatTurnsDescriptions.plus",
  },
  {
    value: "10",
    labelKey: "ai.maxChatTurnsOptions.high",
    descriptionKey: "ai.maxChatTurnsDescriptions.high",
  },
  {
    value: "100",
    labelKey: "ai.maxChatTurnsOptions.max",
    descriptionKey: "ai.maxChatTurnsDescriptions.max",
  },
];

export const MaxChatTurnsSelector: React.FC = () => {
  const { t } = useTranslation("settings");
  const { settings, updateSettings } = useSettings();

  const handleValueChange = (value: string) => {
    if (value === "default") {
      updateSettings({ maxChatTurnsInContext: undefined });
    } else {
      const numValue = Number.parseInt(value, 10);
      updateSettings({ maxChatTurnsInContext: numValue });
    }
  };

  // Determine the current value
  const currentValue =
    settings?.maxChatTurnsInContext?.toString() || defaultValue;

  // Find the current option to display its description
  const currentOption =
    options.find((opt) => opt.value === currentValue) || options[1];

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-4">
        <label
          htmlFor="max-chat-turns"
          className="text-sm font-medium text-muted-foreground"
        >
          {t("ai.maxChatTurnsLabel")}
        </label>
        <Select
          value={currentValue}
          onValueChange={(v) => v && handleValueChange(v)}
        >
          <SelectTrigger className="w-[180px]" id="max-chat-turns">
            <SelectValue placeholder={t("ai.maxChatTurnsPlaceholder")} />
          </SelectTrigger>
          <SelectContent>
            {options.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {t(option.labelKey, { count: MAX_CHAT_TURNS_IN_CONTEXT })}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="text-sm text-muted-foreground">
        {t(currentOption.descriptionKey)}
      </div>
    </div>
  );
};
