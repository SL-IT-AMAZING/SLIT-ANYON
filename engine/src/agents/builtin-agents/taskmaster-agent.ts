import type { AgentConfig } from "@opencode-ai/sdk";
import type { CategoriesConfig, CategoryConfig } from "../../config/schema";
import { AGENT_MODEL_REQUIREMENTS } from "../../shared";
import type {
  AvailableAgent,
  AvailableSkill,
} from "../dynamic-agent-prompt-builder";
import { createTaskmasterAgent } from "../taskmaster";
import type { AgentOverrides } from "../types";
import { applyOverrides } from "./agent-overrides";
import { applyModelResolution } from "./model-resolution";

export function maybeCreateTaskmasterConfig(input: {
  disabledAgents: string[];
  agentOverrides: AgentOverrides;
  uiSelectedModel?: string;
  availableModels: Set<string>;
  systemDefaultModel?: string;
  availableAgents: AvailableAgent[];
  availableSkills: AvailableSkill[];
  mergedCategories: Record<string, CategoryConfig>;
  directory?: string;
  userCategories?: CategoriesConfig;
  useTaskSystem?: boolean;
}): AgentConfig | undefined {
  const {
    disabledAgents,
    agentOverrides,
    uiSelectedModel,
    availableModels,
    systemDefaultModel,
    availableAgents,
    availableSkills,
    mergedCategories,
    directory,
    userCategories,
  } = input;

  if (disabledAgents.includes("taskmaster")) return undefined;

  const taskmasterOverride = agentOverrides["taskmaster"];
  const taskmasterRequirement = AGENT_MODEL_REQUIREMENTS["taskmaster"];

  const taskmasterResolution = applyModelResolution({
    uiSelectedModel: taskmasterOverride?.model ? undefined : uiSelectedModel,
    userModel: taskmasterOverride?.model,
    requirement: taskmasterRequirement,
    availableModels,
    systemDefaultModel,
  });

  if (!taskmasterResolution) return undefined;
  const { model: taskmasterModel, variant: taskmasterResolvedVariant } =
    taskmasterResolution;

  let taskmasterConfig = createTaskmasterAgent({
    model: taskmasterModel,
    availableAgents,
    availableSkills,
    userCategories,
  });

  if (taskmasterResolvedVariant) {
    taskmasterConfig = {
      ...taskmasterConfig,
      variant: taskmasterResolvedVariant,
    };
  }

  taskmasterConfig = applyOverrides(
    taskmasterConfig,
    taskmasterOverride,
    mergedCategories,
    directory,
  );

  return taskmasterConfig;
}
