import type { UserSettings } from "../../lib/schemas";
import { PROVIDERS_THAT_SUPPORT_THINKING } from "../shared/language_model_constants";

function getThinkingBudgetTokens(
  thinkingBudget?: "low" | "medium" | "high",
): number {
  switch (thinkingBudget) {
    case "low":
      return 1_000;
    case "medium":
      return 4_000;
    case "high":
      return -1;
    default:
      return 4_000; // Default to medium
  }
}

function getReasoningEffort(
  thinkingBudget?: "low" | "medium" | "high",
): "low" | "medium" | "high" {
  switch (thinkingBudget) {
    case "low":
      return "low";
    case "high":
      return "high";
    default:
      return "medium";
  }
}

export function getExtraProviderOptions(
  providerId: string | undefined,
  settings: UserSettings,
): Record<string, any> {
  if (!providerId) {
    return {};
  }
  if (providerId === "openai") {
    return { reasoning_effort: getReasoningEffort(settings?.thinkingBudget) };
  }
  if (PROVIDERS_THAT_SUPPORT_THINKING.includes(providerId)) {
    const budgetTokens = getThinkingBudgetTokens(settings?.thinkingBudget);
    return {
      thinking: {
        type: "enabled",
        include_thoughts: true,
        // -1 means dynamic thinking where model determines.
        // budget_tokens: 128, // minimum for Gemini Pro is 128
        budget_tokens: budgetTokens,
      },
    };
  }
  return {};
}
