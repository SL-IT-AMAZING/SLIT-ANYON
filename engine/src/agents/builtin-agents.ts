import type { AgentConfig } from "@opencode-ai/sdk";
import type { CategoriesConfig, GitMasterConfig } from "../config/schema";
import type { BrowserAutomationProvider } from "../config/schema";
import type { LoadedSkill } from "../features/opencode-skill-loader/types";
import {
  fetchAvailableModels,
  readConnectedProvidersCache,
  readProviderModelsCache,
} from "../shared";
import { mergeCategories } from "../shared/merge-categories";
import { CATEGORY_DESCRIPTIONS } from "../tools/delegate-task/constants";
import { ADVISOR_PROMPT_METADATA, createAdvisorAgent } from "./advisor";
import { analystPromptMetadata, createAnalystAgent } from "./analyst";
import { buildAvailableSkills } from "./builtin-agents/available-skills";
import { maybeCreateConductorConfig } from "./builtin-agents/conductor-agent";
import { maybeCreateCraftsmanConfig } from "./builtin-agents/craftsman-agent";
import { collectPendingBuiltinAgents } from "./builtin-agents/general-agents";
import { maybeCreateTaskmasterConfig } from "./builtin-agents/taskmaster-agent";
import { createConductorAgent } from "./conductor";
import { createCraftsmanAgent } from "./craftsman";
import { createCriticAgent, criticPromptMetadata } from "./critic";
import {
  buildCustomAgentMetadata,
  parseRegisteredAgentSummaries,
} from "./custom-agent-summaries";
import type { AvailableCategory } from "./dynamic-agent-prompt-builder";
import { INSPECTOR_PROMPT_METADATA, createInspectorAgent } from "./inspector";
import { RESEARCHER_PROMPT_METADATA, createResearcherAgent } from "./researcher";
import { SCOUT_PROMPT_METADATA, createScoutAgent } from "./scout";
import { createTaskmasterAgent, taskmasterPromptMetadata } from "./taskmaster";
import type {
  AgentFactory,
  AgentOverrides,
  AgentPromptMetadata,
  BuiltinAgentName,
} from "./types";

type AgentSource = AgentFactory | AgentConfig;

const agentSources: Record<BuiltinAgentName, AgentSource> = {
  conductor: createConductorAgent,
  craftsman: createCraftsmanAgent,
  advisor: createAdvisorAgent,
  researcher: createResearcherAgent,
  scout: createScoutAgent,
  inspector: createInspectorAgent,
  analyst: createAnalystAgent,
  critic: createCriticAgent,
  // Note: Taskmaster is handled specially in createBuiltinAgents()
  // because it needs OrchestratorContext, not just a model string
  taskmaster: createTaskmasterAgent as AgentFactory,
};

/**
 * Metadata for each agent, used to build Conductor's dynamic prompt sections
 * (Delegation Table, Tool Selection, Key Triggers, etc.)
 */
const agentMetadata: Partial<Record<BuiltinAgentName, AgentPromptMetadata>> = {
  advisor: ADVISOR_PROMPT_METADATA,
  researcher: RESEARCHER_PROMPT_METADATA,
  scout: SCOUT_PROMPT_METADATA,
  inspector: INSPECTOR_PROMPT_METADATA,
  analyst: analystPromptMetadata,
  critic: criticPromptMetadata,
  taskmaster: taskmasterPromptMetadata,
};

export async function createBuiltinAgents(
  disabledAgents: string[] = [],
  agentOverrides: AgentOverrides = {},
  directory?: string,
  systemDefaultModel?: string,
  categories?: CategoriesConfig,
  gitMasterConfig?: GitMasterConfig,
  discoveredSkills: LoadedSkill[] = [],
  customAgentSummaries?: unknown,
  browserProvider?: BrowserAutomationProvider,
  uiSelectedModel?: string,
  disabledSkills?: Set<string>,
  useTaskSystem = false,
  disableOmoEnv = false,
): Promise<Record<string, AgentConfig>> {
  const connectedProviders = readConnectedProvidersCache();
  const providerModelsConnected = connectedProviders
    ? (readProviderModelsCache()?.connected ?? [])
    : [];
  const mergedConnectedProviders = Array.from(
    new Set([...(connectedProviders ?? []), ...providerModelsConnected]),
  );
  // IMPORTANT: Do NOT call OpenCode client APIs during plugin initialization.
  // This function is called from config handler, and calling client API causes deadlock.
  // See: https://github.com/SL-IT-AMAZING/anyon-cli/issues/1301
  const availableModels = await fetchAvailableModels(undefined, {
    connectedProviders:
      mergedConnectedProviders.length > 0
        ? mergedConnectedProviders
        : undefined,
  });
  const isFirstRunNoCache =
    availableModels.size === 0 && mergedConnectedProviders.length === 0;

  const result: Record<string, AgentConfig> = {};

  const mergedCategories = mergeCategories(categories);

  const availableCategories: AvailableCategory[] = Object.entries(
    mergedCategories,
  ).map(([name]) => ({
    name,
    description:
      categories?.[name]?.description ??
      CATEGORY_DESCRIPTIONS[name] ??
      "General tasks",
  }));

  const availableSkills = buildAvailableSkills(
    discoveredSkills,
    browserProvider,
    disabledSkills,
  );

  // Collect general agents first (for availableAgents), but don't add to result yet
  const { pendingAgentConfigs, availableAgents } = collectPendingBuiltinAgents({
    agentSources,
    agentMetadata,
    disabledAgents,
    agentOverrides,
    directory,
    systemDefaultModel,
    mergedCategories,
    gitMasterConfig,
    browserProvider,
    uiSelectedModel,
    availableModels,
    disabledSkills,
    disableOmoEnv,
  });

  const registeredAgents = parseRegisteredAgentSummaries(customAgentSummaries);
  const builtinAgentNames = new Set(
    Object.keys(agentSources).map((name) => name.toLowerCase()),
  );
  const disabledAgentNames = new Set(
    disabledAgents.map((name) => name.toLowerCase()),
  );

  for (const agent of registeredAgents) {
    const lowerName = agent.name.toLowerCase();
    if (builtinAgentNames.has(lowerName)) continue;
    if (disabledAgentNames.has(lowerName)) continue;
    if (
      availableAgents.some(
        (availableAgent) => availableAgent.name.toLowerCase() === lowerName,
      )
    )
      continue;

    availableAgents.push({
      name: agent.name,
      description: agent.description,
      metadata: buildCustomAgentMetadata(agent.name, agent.description),
    });
  }

  const conductorConfig = maybeCreateConductorConfig({
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
    userCategories: categories,
    useTaskSystem,
    disableOmoEnv,
  });
  if (conductorConfig) {
    result["conductor"] = conductorConfig;
  }

  const craftsmanConfig = maybeCreateCraftsmanConfig({
    disabledAgents,
    agentOverrides,
    availableModels,
    systemDefaultModel,
    isFirstRunNoCache,
    availableAgents,
    availableSkills,
    availableCategories,
    mergedCategories,
    directory,
    useTaskSystem,
    disableOmoEnv,
  });
  if (craftsmanConfig) {
    result["craftsman"] = craftsmanConfig;
  }

  // Add pending agents after conductor and craftsman to maintain order
  for (const [name, config] of pendingAgentConfigs) {
    result[name] = config;
  }

  const taskmasterConfig = maybeCreateTaskmasterConfig({
    disabledAgents,
    agentOverrides,
    uiSelectedModel,
    availableModels,
    systemDefaultModel,
    availableAgents,
    availableSkills,
    mergedCategories,
    directory,
    userCategories: categories,
  });
  if (taskmasterConfig) {
    result["taskmaster"] = taskmasterConfig;
  }

  return result;
}
