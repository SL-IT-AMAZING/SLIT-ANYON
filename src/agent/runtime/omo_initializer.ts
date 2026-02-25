import log from "electron-log";

import { type OmoAgentDefinition, getAllAgentDefinitions } from "./agents";
import { BackgroundManager } from "./background_manager";
import { CommandRegistry } from "./commands";
import type { ConcurrencyConfig } from "./concurrency_manager";
import { ContextCollector } from "./context_collector";
import { HookRegistry } from "./hook_system";
import { registerAllOmoHooks } from "./hooks";
import { SessionStateManager } from "./session_state";
import { SkillLoader } from "./skills";

const logger = log.scope("omo-initializer");

export interface OmoRuntimeContext {
  hookRegistry: HookRegistry;
  sessionState: SessionStateManager;
  contextCollector: ContextCollector;
  skillLoader: SkillLoader;
  commandRegistry: CommandRegistry;
  backgroundManager: BackgroundManager;
  agentDefinitions: OmoAgentDefinition[];
}

export async function initializeOmoRuntime(opts: {
  projectDir: string;
  chatId: number;
  sessionId: number;
}): Promise<OmoRuntimeContext> {
  logger.info(
    `Initializing OMO runtime for chat ${opts.chatId}, session ${opts.sessionId}`,
  );

  const hookRegistry = new HookRegistry();
  const sessionState = new SessionStateManager();
  const contextCollector = new ContextCollector();

  const skillLoader = new SkillLoader(opts.projectDir);
  try {
    await skillLoader.discover();
    logger.info(`Discovered ${skillLoader.list().length} skills`);
  } catch (err) {
    logger.warn("Skill discovery failed:", err);
  }

  const commandRegistry = new CommandRegistry();
  try {
    await commandRegistry.discover(opts.projectDir);
    logger.info(`Discovered ${commandRegistry.list().length} commands`);
  } catch (err) {
    logger.warn("Command discovery failed:", err);
  }

  registerAllOmoHooks(hookRegistry);
  logger.info("OMO hooks registered");

  const agentDefinitions = getAllAgentDefinitions();

  const concurrencyConfig: ConcurrencyConfig = {
    defaultConcurrency: 8,
    providerConcurrency: { anthropic: 3, openai: 5, google: 3 },
  };
  const backgroundManager = new BackgroundManager(concurrencyConfig);

  logger.info("OMO runtime initialized successfully");

  return {
    hookRegistry,
    sessionState,
    contextCollector,
    skillLoader,
    commandRegistry,
    backgroundManager,
    agentDefinitions,
  };
}

export async function cleanupOmoRuntime(ctx: OmoRuntimeContext): Promise<void> {
  logger.info("Cleaning up OMO runtime");
  ctx.backgroundManager.destroy();
}
