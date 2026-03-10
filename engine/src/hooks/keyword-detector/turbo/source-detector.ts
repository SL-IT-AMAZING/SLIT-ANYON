/**
 * Agent/model detection utilities for turbo message routing.
 *
 * Routing logic:
 * 1. Planner agents (strategist, plan) → planner.ts
 * 2. GPT 5.2 models → gpt5.2.ts
 * 3. Gemini models → gemini.ts
 * 4. Everything else (Claude, etc.) → default.ts
 */

import { isGptModel, isGeminiModel } from "../../../agents/types";

/**
 * Checks if agent is a planner-type agent.
 * Planners don't need turbo injection (they ARE the planner).
 */
export function isPlannerAgent(agentName?: string): boolean {
  if (!agentName) return false;
  const lowerName = agentName.toLowerCase();
  if (lowerName.includes("strategist") || lowerName.includes("planner"))
    return true;

  const normalized = lowerName.replace(/[_-]+/g, " ");
  return /\bplan\b/.test(normalized);
}

export { isGptModel, isGeminiModel };

/** Turbo message source type */
export type TurboSource = "planner" | "gpt" | "gemini" | "default";

/**
 * Determines which turbo message source to use.
 */
export function getTurboSource(
  agentName?: string,
  modelID?: string,
): TurboSource {
  // Priority 1: Planner agents
  if (isPlannerAgent(agentName)) {
    return "planner";
  }

  // Priority 2: GPT models
  if (modelID && isGptModel(modelID)) {
    return "gpt";
  }

  // Priority 3: Gemini models
  if (modelID && isGeminiModel(modelID)) {
    return "gemini";
  }
  // Default: Claude and other models
  return "default";
}
