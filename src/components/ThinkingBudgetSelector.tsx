import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSettings } from "@/hooks/useSettings";
import type React from "react";

interface OptionInfo {
  value: string;
  label: string;
  description: string;
}

const defaultValue = "medium";

const options: OptionInfo[] = [
  {
    value: "low",
    label: "Low",
    description:
      "Minimal thinking tokens for faster responses and lower costs.",
  },
  {
    value: defaultValue,
    label: "Medium (default)",
    description: "Balanced thinking for most conversations.",
  },
  {
    value: "high",
    label: "High",
    description:
      "Extended thinking for complex problems requiring deep analysis.",
  },
];

export const ThinkingBudgetSelector: React.FC = () => {
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
          Thinking Budget
        </label>
        <Select
          value={currentValue}
          onValueChange={(v) => v && handleValueChange(v)}
        >
          <SelectTrigger className="w-[180px]" id="thinking-budget">
            <SelectValue placeholder="Select budget" />
          </SelectTrigger>
          <SelectContent>
            {options.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="text-sm text-muted-foreground">
        {currentOption.description}
      </div>
    </div>
  );
};
