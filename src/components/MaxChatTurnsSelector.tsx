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

interface OptionInfo {
  value: string;
  label: string;
  description: string;
}

const defaultValue = "default";

const options: OptionInfo[] = [
  {
    value: "2",
    label: "Economy (2)",
    description:
      "Minimal context to reduce token usage and improve response times.",
  },
  {
    value: defaultValue,
    label: `Default (${MAX_CHAT_TURNS_IN_CONTEXT})  `,
    description: "Balanced context size for most conversations.",
  },
  {
    value: "5",
    label: "Plus (5)",
    description: "Slightly higher context size for detailed conversations.",
  },
  {
    value: "10",
    label: "High (10)",
    description:
      "Extended context for complex conversations requiring more history.",
  },
  {
    value: "100",
    label: "Max (100)",
    description: "Maximum context (not recommended due to cost and speed).",
  },
];

export const MaxChatTurnsSelector: React.FC = () => {
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
          Maximum number of chat turns used in context
        </label>
        <Select
          value={currentValue}
          onValueChange={(v) => v && handleValueChange(v)}
        >
          <SelectTrigger className="w-[180px]" id="max-chat-turns">
            <SelectValue placeholder="Select turns" />
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
