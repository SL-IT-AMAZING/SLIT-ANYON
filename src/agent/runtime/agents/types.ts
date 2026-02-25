/**
 * Agent definition types for the OMO native port.
 */

export interface OmoAgentDefinition {
  name: string;
  description: string;
  model: {
    provider: string;
    modelId: string;
  };
  systemPromptFile: string; // filename in prompts/omo-agents/
  tools: string[]; // Tool IDs this agent can use
  mode: "primary" | "subagent" | "all";
  cost: "free" | "cheap" | "moderate" | "expensive";
  maxTokens?: number;
  temperature?: number;
  thinking?: { enabled: boolean; budgetTokens?: number };
}

export interface AgentDescriptor {
  name: string;
  description: string;
  cost: string;
  mode: string;
}
