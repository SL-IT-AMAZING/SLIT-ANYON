/**
 * Conductor-Junior - Focused Task Executor
 *
 * Executes delegated tasks directly without spawning other agents.
 * Category-spawned executor with domain-specific configurations.
 *
 * Routing:
 * 1. GPT models (openai/*, github-copilot/gpt-*) -> gpt.ts (GPT-5.2 optimized)
 * 2. Gemini models (google/*, google-vertex/*) -> gemini.ts (Gemini-optimized)
 * 3. Default (Claude, etc.) -> default.ts (Claude-optimized)
 */

import type { AgentConfig } from "@opencode-ai/sdk";
import type { AgentOverrideConfig } from "../../config/schema";
import {
  type PermissionValue,
  createAgentToolRestrictions,
} from "../../shared/permission-compat";
import type { AgentMode } from "../types";
import { isGeminiModel, isGptModel } from "../types";

import { buildDefaultWorkerPrompt } from "./default";
import { buildGeminiWorkerPrompt } from "./gemini";
import { buildGptWorkerPrompt } from "./gpt";

const MODE: AgentMode = "subagent";

// Core tools that Conductor-Junior must NEVER have access to
// Note: call_anyon_agent is ALLOWED so subagents can spawn explore/researcher
const BLOCKED_TOOLS = ["task"];

export const WORKER_DEFAULTS = {
  model: "anthropic/claude-sonnet-4-6",
  temperature: 0.1,
} as const;

export type WorkerPromptSource = "default" | "gpt" | "gemini";

/**
 * Determines which Conductor-Junior prompt to use based on model.
 */
export function getWorkerPromptSource(model?: string): WorkerPromptSource {
  if (model && isGptModel(model)) {
    return "gpt";
  }
  if (model && isGeminiModel(model)) {
    return "gemini";
  }
  return "default";
}

/**
 * Builds the appropriate Conductor-Junior prompt based on model.
 */
export function buildWorkerPrompt(
  model: string | undefined,
  useTaskSystem: boolean,
  promptAppend?: string,
): string {
  const source = getWorkerPromptSource(model);

  switch (source) {
    case "gpt":
      return buildGptWorkerPrompt(useTaskSystem, promptAppend);
    case "gemini":
      return buildGeminiWorkerPrompt(useTaskSystem, promptAppend);
    case "default":
    default:
      return buildDefaultWorkerPrompt(useTaskSystem, promptAppend);
  }
}

export function createWorkerAgentWithOverrides(
  override: AgentOverrideConfig | undefined,
  systemDefaultModel?: string,
  useTaskSystem = false,
): AgentConfig {
  if (override?.disable) {
    override = undefined;
  }

  const overrideModel = (override as { model?: string } | undefined)?.model;
  const model = overrideModel ?? systemDefaultModel ?? WORKER_DEFAULTS.model;
  const temperature = override?.temperature ?? WORKER_DEFAULTS.temperature;

  const promptAppend = override?.prompt_append;
  const prompt = buildWorkerPrompt(model, useTaskSystem, promptAppend);

  const baseRestrictions = createAgentToolRestrictions(BLOCKED_TOOLS);

  const userPermission = (override?.permission ?? {}) as Record<
    string,
    PermissionValue
  >;
  const basePermission = baseRestrictions.permission;
  const merged: Record<string, PermissionValue> = { ...userPermission };
  for (const tool of BLOCKED_TOOLS) {
    merged[tool] = "deny";
  }
  merged.call_anyon_agent = "allow";
  const toolsConfig = { permission: { ...merged, ...basePermission } };

  const base: AgentConfig = {
    description:
      override?.description ??
      "Focused task executor. Same discipline, no delegation. (Conductor-Junior - Anyon)",
    mode: MODE,
    model,
    temperature,
    maxTokens: 64000,
    prompt,
    color: override?.color ?? "#20B2AA",
    ...toolsConfig,
  };

  if (override?.top_p !== undefined) {
    base.top_p = override.top_p;
  }

  if (isGptModel(model)) {
    return { ...base, reasoningEffort: "medium" } as AgentConfig;
  }

  return {
    ...base,
    thinking: { type: "enabled", budgetTokens: 32000 },
  } as AgentConfig;
}

createWorkerAgentWithOverrides.mode = MODE;
