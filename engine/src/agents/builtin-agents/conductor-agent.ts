import type { AgentConfig } from "@opencode-ai/sdk";
import type { CategoriesConfig, CategoryConfig } from "../../config/schema";
import {
  AGENT_MODEL_REQUIREMENTS,
  isAnyFallbackModelAvailable,
} from "../../shared";
import { createConductorAgent } from "../conductor";
import type {
  AvailableAgent,
  AvailableCategory,
  AvailableSkill,
} from "../dynamic-agent-prompt-builder";
import type { AgentOverrides } from "../types";
import { applyOverrides } from "./agent-overrides";
import { applyEnvironmentContext } from "./environment-context";
import {
  applyModelResolution,
  getFirstFallbackModel,
} from "./model-resolution";

export function maybeCreateConductorConfig(input: {
  disabledAgents: string[];
  agentOverrides: AgentOverrides;
  uiSelectedModel?: string;
  availableModels: Set<string>;
  systemDefaultModel?: string;
  isFirstRunNoCache: boolean;
  availableAgents: AvailableAgent[];
  availableSkills: AvailableSkill[];
  availableCategories: AvailableCategory[];
  mergedCategories: Record<string, CategoryConfig>;
  directory?: string;
  userCategories?: CategoriesConfig;
  useTaskSystem: boolean;
  disableOmoEnv?: boolean;
}): AgentConfig | undefined {
  const {
    disabledAgents,
    agentOverrides,
    uiSelectedModel,
    availableModels,
    systemDefaultModel,
    isFirstRunNoCache,
    availableAgents,
    availableSkills,
    availableCategories,
    mergedCategories,
    directory,
    useTaskSystem,
    disableOmoEnv = false,
  } = input;

  const conductorOverride = agentOverrides["conductor"];
  const conductorRequirement = AGENT_MODEL_REQUIREMENTS["conductor"];
  const hasConductorExplicitConfig = conductorOverride !== undefined;
  const meetsConductorAnyModelRequirement =
    !conductorRequirement?.requiresAnyModel ||
    hasConductorExplicitConfig ||
    isFirstRunNoCache ||
    isAnyFallbackModelAvailable(
      conductorRequirement.fallbackChain,
      availableModels,
    );

  if (
    disabledAgents.includes("conductor") ||
    !meetsConductorAnyModelRequirement
  )
    return undefined;

  let conductorResolution = applyModelResolution({
    uiSelectedModel: conductorOverride?.model ? undefined : uiSelectedModel,
    userModel: conductorOverride?.model,
    requirement: conductorRequirement,
    availableModels,
    systemDefaultModel,
  });

  if (isFirstRunNoCache && !conductorOverride?.model && !uiSelectedModel) {
    conductorResolution = getFirstFallbackModel(conductorRequirement);
  }

  if (!conductorResolution) return undefined;
  const { model: conductorModel, variant: conductorResolvedVariant } =
    conductorResolution;

  let conductorConfig = createConductorAgent(
    conductorModel,
    availableAgents,
    undefined,
    availableSkills,
    availableCategories,
    useTaskSystem,
  );

  if (conductorResolvedVariant) {
    conductorConfig = { ...conductorConfig, variant: conductorResolvedVariant };
  }

  conductorConfig = applyOverrides(
    conductorConfig,
    conductorOverride,
    mergedCategories,
    directory,
  );
  conductorConfig = applyEnvironmentContext(conductorConfig, directory, {
    disableOmoEnv,
  });

  return conductorConfig;
}
