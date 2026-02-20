import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useSettings } from "@/hooks/useSettings";
import { BrainIcon, GaugeIcon, ZapIcon } from "lucide-react";
import type React from "react";
import { useTranslation } from "react-i18next";

type ThinkingLevel = "low" | "medium" | "high";

type LabelKey =
  | "thinkingLevel.low"
  | "thinkingLevel.medium"
  | "thinkingLevel.high";

type DescriptionKey =
  | "thinkingLevel.lowDescription"
  | "thinkingLevel.mediumDescription"
  | "thinkingLevel.highDescription";

interface LevelOption {
  value: ThinkingLevel;
  labelKey: LabelKey;
  descriptionKey: DescriptionKey;
  icon: React.ReactNode;
}

const options: LevelOption[] = [
  {
    value: "low",
    labelKey: "thinkingLevel.low",
    descriptionKey: "thinkingLevel.lowDescription",
    icon: <ZapIcon className="h-3.5 w-3.5" />,
  },
  {
    value: "medium",
    labelKey: "thinkingLevel.medium",
    descriptionKey: "thinkingLevel.mediumDescription",
    icon: <GaugeIcon className="h-3.5 w-3.5" />,
  },
  {
    value: "high",
    labelKey: "thinkingLevel.high",
    descriptionKey: "thinkingLevel.highDescription",
    icon: <BrainIcon className="h-3.5 w-3.5" />,
  },
];

export function ThinkingLevelPicker() {
  const { t } = useTranslation("app");
  const { settings, updateSettings } = useSettings();

  const currentValue: ThinkingLevel = settings?.thinkingBudget ?? "medium";
  const currentOption =
    options.find((opt) => opt.value === currentValue) ?? options[1];

  const handleChange = (value: ThinkingLevel) => {
    updateSettings({ thinkingBudget: value });
  };

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Select
            value={currentValue}
            onValueChange={(v) => v && handleChange(v as ThinkingLevel)}
          >
            <SelectTrigger
              size="sm"
              className="h-8 w-auto min-w-0 gap-1.5 border-0 bg-transparent px-2 text-xs text-muted-foreground shadow-none hover:bg-transparent hover:text-foreground"
              data-testid="thinking-level-picker"
            >
              {currentOption.icon}
              <SelectValue />
            </SelectTrigger>
            <SelectContent align="start">
              {options.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  <span className="flex items-center gap-2">
                    {option.icon}
                    <span>{t(option.labelKey)}</span>
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        }
      />
      <TooltipContent>{t(currentOption.descriptionKey)}</TooltipContent>
    </Tooltip>
  );
}
