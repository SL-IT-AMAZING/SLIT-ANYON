import type { LanguageModel } from "ai";
import type { LargeLanguageModel, UserSettings } from "../../lib/schemas";
import log from "electron-log";
import { createOpenCodeProvider } from "./opencode_provider";

export interface ModelClient {
  model: LanguageModel;
  builtinProviderId?: string;
}

const logger = log.scope("getModelClient");

export async function getModelClient(
  model: LargeLanguageModel,
  settings: UserSettings,
  options?: { chatId?: number; appPath?: string },
): Promise<{
  modelClient: ModelClient;
  isEngineEnabled?: boolean;
  isSmartContextEnabled?: boolean;
  isOpenCodeMode?: boolean;
}> {
  logger.info(`Using OpenCode for model: ${model.provider}/${model.name}`);

  const conversationId = options?.chatId
    ? `dyad-chat-${options.chatId}`
    : undefined;

  const provider = createOpenCodeProvider({
    agentName: settings.selectedAgent,
    conversationId,
    appPath: options?.appPath,
  });
  return {
    modelClient: {
      model: provider(model.name, model.provider),
      builtinProviderId: model.provider,
    },
    isEngineEnabled: false,
    isSmartContextEnabled: false,
    isOpenCodeMode: true,
  };
}
