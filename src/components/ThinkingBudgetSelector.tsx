import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSettings } from "@/hooks/useSettings";
import type React from "react";
import { useTranslation } from "react-i18next";

interface OptionInfo {
  value: "low" | "medium" | "high";
  labelKey:
    | "ai.thinkingBudgetOptions.low"
    | "ai.thinkingBudgetOptions.medium"
    | "ai.thinkingBudgetOptions.high";
  descriptionKey:
    | "ai.thinkingBudgetDescriptions.low"
    | "ai.thinkingBudgetDescriptions.medium"
    | "ai.thinkingBudgetDescriptions.high";
}

const defaultValue = "medium" as const;

const options: OptionInfo[] = [
  {
    value: "low",
    labelKey: "ai.thinkingBudgetOptions.low",
    descriptionKey: "ai.thinkingBudgetDescriptions.low",
  },
  {
    value: defaultValue,
    labelKey: "ai.thinkingBudgetOptions.medium",
    descriptionKey: "ai.thinkingBudgetDescriptions.medium",
  },
  {
    value: "high",
    labelKey: "ai.thinkingBudgetOptions.high",
    descriptionKey: "ai.thinkingBudgetDescriptions.high",
  },
];

export const ThinkingBudgetSelector: React.FC = () => {
  const { t } = useTranslation("settings");
  const { settings, updateSettings } = useSettings();

  const handleValueChange = (value: string) => {
    updateSettings({ thinkingBudget: value as "low" | "medium" | "high" });
  };

  // Determine the current value
  const currentValue = settings?.thinkingBudget || defaultValue;

  // Find the current option to display its description
  const currentOption =
    options.find((opt) => opt.value === currentValue) || options[1];

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-4">
        <label
          htmlFor="thinking-budget"
          className="text-sm font-medium text-muted-foreground"
        >
          {t("ai.thinkingBudget")}
        </label>
        <Select
          value={currentValue}
          onValueChange={(v) => v && handleValueChange(v)}
        >
          <SelectTrigger className="w-[180px]" id="thinking-budget">
            <SelectValue placeholder={t("ai.thinkingBudgetPlaceholder")} />
          </SelectTrigger>
          <SelectContent>
            {options.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {t(option.labelKey)}
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
