/**
 * Taskmaster - Master Orchestrator Agent
 *
 * Orchestrates work via task() to complete ALL tasks in a todo list until fully done.
 * You are the conductor of a symphony of specialized agents.
 *
 * Routing:
 * 1. GPT models (openai/*, github-copilot/gpt-*) → gpt.ts (GPT-5.2 optimized)
 * 2. Gemini models (google/*, google-vertex/*) → gemini.ts (Gemini-optimized)
 * 3. Default (Claude, etc.) → default.ts (Claude-optimized)
 */

import type { AgentConfig } from "@opencode-ai/sdk";
import type { CategoryConfig } from "../../config/schema";
import { mergeCategories } from "../../shared/merge-categories";
import type {
  AvailableAgent,
  AvailableCategory,
  AvailableSkill,
} from "../dynamic-agent-prompt-builder";
import { buildCategorySkillsDelegationGuide } from "../dynamic-agent-prompt-builder";
import type { AgentMode, AgentPromptMetadata } from "../types";
import { isGeminiModel, isGptModel } from "../types";

import { getDefaultTaskmasterPrompt } from "./default";
import { getGeminiTaskmasterPrompt } from "./gemini";
import { getGptTaskmasterPrompt } from "./gpt";
import {
  buildAgentSelectionSection,
  buildCategorySection,
  buildDecisionMatrix,
  buildSkillsSection,
  getCategoryDescription,
} from "./prompt-section-builder";

const MODE: AgentMode = "all";

export type TaskmasterPromptSource = "default" | "gpt" | "gemini";

/**
 * Determines which Taskmaster prompt to use based on model.
 */
export function getTaskmasterPromptSource(
  model?: string,
): TaskmasterPromptSource {
  if (model && isGptModel(model)) {
    return "gpt";
  }
  if (model && isGeminiModel(model)) {
    return "gemini";
  }
  return "default";
}

export interface OrchestratorContext {
  model?: string;
  availableAgents?: AvailableAgent[];
  availableSkills?: AvailableSkill[];
  userCategories?: Record<string, CategoryConfig>;
}

/**
 * Gets the appropriate Taskmaster prompt based on model.
 */
export function getTaskmasterPrompt(model?: string): string {
  const source = getTaskmasterPromptSource(model);

  switch (source) {
    case "gpt":
      return getGptTaskmasterPrompt();
    case "gemini":
      return getGeminiTaskmasterPrompt();
    case "default":
    default:
      return getDefaultTaskmasterPrompt();
  }
}

function buildDynamicOrchestratorPrompt(ctx?: OrchestratorContext): string {
  const agents = ctx?.availableAgents ?? [];
  const skills = ctx?.availableSkills ?? [];
  const userCategories = ctx?.userCategories;
  const model = ctx?.model;

  const allCategories = mergeCategories(userCategories);
  const availableCategories: AvailableCategory[] = Object.entries(
    allCategories,
  ).map(([name]) => ({
    name,
    description: getCategoryDescription(name, userCategories),
  }));

  const categorySection = buildCategorySection(userCategories);
  const agentSection = buildAgentSelectionSection(agents);
  const decisionMatrix = buildDecisionMatrix(agents, userCategories);
  const skillsSection = buildSkillsSection(skills);
  const categorySkillsGuide = buildCategorySkillsDelegationGuide(
    availableCategories,
    skills,
  );

  const basePrompt = getTaskmasterPrompt(model);

  return basePrompt
    .replace("{CATEGORY_SECTION}", categorySection)
    .replace("{AGENT_SECTION}", agentSection)
    .replace("{DECISION_MATRIX}", decisionMatrix)
    .replace("{SKILLS_SECTION}", skillsSection)
    .replace("{{CATEGORY_SKILLS_DELEGATION_GUIDE}}", categorySkillsGuide);
}

export function createTaskmasterAgent(ctx: OrchestratorContext): AgentConfig {
  const baseConfig = {
    description:
      "Orchestrates work via task() to complete ALL tasks in a todo list until fully done. (Taskmaster - Anyon)",
    mode: MODE,
    ...(ctx.model ? { model: ctx.model } : {}),
    temperature: 0.1,
    prompt: buildDynamicOrchestratorPrompt(ctx),
    color: "#10B981",
  };

  return baseConfig as AgentConfig;
}
createTaskmasterAgent.mode = MODE;

export const taskmasterPromptMetadata: AgentPromptMetadata = {
  category: "advisor",
  cost: "EXPENSIVE",
  promptAlias: "Taskmaster",
  triggers: [
    {
      domain: "Todo list orchestration",
      trigger: "Complete ALL tasks in a todo list with verification",
    },
    {
      domain: "Multi-agent coordination",
      trigger: "Parallel task execution across specialized agents",
    },
  ],
  useWhen: [
    "User provides a todo list path (.anyon/plans/{name}.md)",
    "Multiple tasks need to be completed in sequence or parallel",
    "Work requires coordination across multiple specialized agents",
  ],
  avoidWhen: [
    "Single simple task that doesn't require orchestration",
    "Tasks that can be handled directly by one agent",
    "When user wants to execute tasks manually",
  ],
  keyTrigger:
    "Todo list path provided OR multiple tasks requiring multi-agent orchestration",
};
