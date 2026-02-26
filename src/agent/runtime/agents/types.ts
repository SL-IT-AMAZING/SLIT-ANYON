/**
 * Agent definition types for the OMO native port.
 */

export type AgentCategory = "exploration" | "specialist" | "advisor" | "utility";

export type AgentCost = "FREE" | "CHEAP" | "EXPENSIVE";

export interface DelegationTrigger {
  domain: string;
  trigger: string;
}

export interface AgentPromptMetadata {
  category: AgentCategory;
  cost: AgentCost;
  triggers: DelegationTrigger[];
  useWhen?: string[];
  avoidWhen?: string[];
  dedicatedSection?: string;
  promptAlias?: string;
  keyTrigger?: string;
}

export type BuiltinAgentName =
  | "sisyphus"
  | "oracle"
  | "librarian"
  | "explore"
  | "multimodal-looker"
  | "metis"
  | "momus"
  | "prometheus"
  | "atlas"
  | "hephaestus"
  | "sisyphus-junior";

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
  promptMetadata?: AgentPromptMetadata;
}

export interface AgentDescriptor {
  name: string;
  description: string;
  cost: string;
  mode: string;
}
