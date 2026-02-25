/**
 * Agent Variant System — determines model quality tier for agents.
 */

export type AgentVariant = "low" | "medium" | "high" | "max";

const VARIANT_ORDER: AgentVariant[] = ["low", "medium", "high", "max"];

export function getAgentVariant(variantStr?: string): AgentVariant {
  if (variantStr && VARIANT_ORDER.includes(variantStr as AgentVariant)) {
    return variantStr as AgentVariant;
  }
  return "high"; // default
}

export function isVariantAtLeast(
  current: AgentVariant,
  minimum: AgentVariant,
): boolean {
  return VARIANT_ORDER.indexOf(current) >= VARIANT_ORDER.indexOf(minimum);
}

export interface ModelSpec {
  provider: string;
  modelId: string;
}

// Default model mappings per variant
const DEFAULT_MODELS: Record<AgentVariant, Record<string, ModelSpec>> = {
  low: {
    primary: { provider: "anthropic", modelId: "claude-haiku-4-5" },
    subagent: { provider: "anthropic", modelId: "claude-haiku-4-5" },
  },
  medium: {
    primary: { provider: "anthropic", modelId: "claude-sonnet-4-6" },
    subagent: { provider: "anthropic", modelId: "claude-haiku-4-5" },
  },
  high: {
    primary: { provider: "anthropic", modelId: "claude-sonnet-4-6" },
    subagent: { provider: "anthropic", modelId: "claude-sonnet-4-6" },
  },
  max: {
    primary: { provider: "anthropic", modelId: "claude-opus-4-6" },
    subagent: { provider: "anthropic", modelId: "claude-sonnet-4-6" },
  },
};

export function getModelForVariant(
  agentKind: "primary" | "subagent",
  variant: AgentVariant,
): ModelSpec {
  return DEFAULT_MODELS[variant][agentKind] ?? DEFAULT_MODELS.high[agentKind];
}
