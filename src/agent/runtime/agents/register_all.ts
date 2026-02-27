import { OMO_AGENTS } from "./definitions";
import type { AgentDescriptor, OmoAgentDefinition } from "./types";

/**
 * Get all OMO agent definitions.
 */
export function getAllAgentDefinitions(): OmoAgentDefinition[] {
  return [...OMO_AGENTS];
}

/**
 * Get a specific agent definition by name.
 */
export function getAgentDefinition(
  name: string,
): OmoAgentDefinition | undefined {
  return OMO_AGENTS.find((a) => a.name === name);
}

/**
 * Get lightweight agent descriptors (for prompt building, UI display, etc).
 */
export function getAgentDescriptors(): AgentDescriptor[] {
  return OMO_AGENTS.map((a) => ({
    name: a.name,
    description: a.description,
    cost: a.cost,
    mode: a.mode,
  }));
}
