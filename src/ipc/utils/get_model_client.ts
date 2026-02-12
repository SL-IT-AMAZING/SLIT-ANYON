import type { LanguageModel } from "ai";
import type { LargeLanguageModel, UserSettings } from "../../lib/schemas";
import log from "electron-log";
import { createOpenCodeProvider } from "./opencode_provider";
import { getModelClientUpstream } from "./get_model_client_upstream";
import { IS_TEST_BUILD } from "./test_utils";

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
  // E2E test mode: use original upstream provider routing so the
  // fake-llm-server (OpenAI-format) works without an OpenCode server.
  if (IS_TEST_BUILD) {
    logger.info(
      `E2E mode: using upstream provider for model: ${model.provider}/${model.name}`,
    );
    const result = await getModelClientUpstream(model, settings);
    return {
      ...result,
      isOpenCodeMode: false,
    };
  }

  logger.info(`Using OpenCode for model: ${model.provider}/${model.name}`);

  const conversationId = options?.chatId
    ? `anyon-chat-${options.chatId}`
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
