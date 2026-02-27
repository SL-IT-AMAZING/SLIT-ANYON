import type { LanguageModel } from "ai";
import log from "electron-log";
import type { LargeLanguageModel, UserSettings } from "../../lib/schemas";
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
  _options?: { chatId?: number; appPath?: string },
): Promise<{
  modelClient: ModelClient;
  isEngineEnabled?: boolean;
  isSmartContextEnabled?: boolean;
  isNativeAgentMode?: boolean;
}> {
  // E2E test mode: use original upstream provider routing so the
  // fake-llm-server (OpenAI-format) works without native runtime routing.
  if (IS_TEST_BUILD) {
    logger.info(
      `E2E mode: using upstream provider for model: ${model.provider}/${model.name}`,
    );
    const result = await getModelClientUpstream(model, settings);
    return {
      ...result,
      isNativeAgentMode: true,
    };
  }

  logger.info(
    `Native agent mode: using upstream provider for model: ${model.provider}/${model.name}`,
  );
  const result = await getModelClientUpstream(model, settings);
  return {
    ...result,
    isNativeAgentMode: true,
  };
}
