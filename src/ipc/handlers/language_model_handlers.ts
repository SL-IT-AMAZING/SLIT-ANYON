import type { LanguageModelProvider, LanguageModel } from "@/ipc/types";
import { createLoggedHandler } from "./safe_handle";
import log from "electron-log";
import {
  getLanguageModelProviders,
  getLanguageModels,
  getLanguageModelsByProviders,
} from "../shared/language_model_helpers";
import { getOpenCodeAgents } from "../utils/opencode_api";
import { IpcMainInvokeEvent } from "electron";

const logger = log.scope("language_model_handlers");
const handle = createLoggedHandler(logger);

export function registerLanguageModelHandlers() {
  handle(
    "get-language-model-providers",
    async (): Promise<LanguageModelProvider[]> => {
      return getLanguageModelProviders();
    },
  );

  handle(
    "get-language-models",
    async (
      event: IpcMainInvokeEvent,
      params: { providerId: string },
    ): Promise<LanguageModel[]> => {
      if (!params || typeof params.providerId !== "string") {
        throw new Error("Invalid parameters: providerId (string) is required.");
      }
      const providers = await getLanguageModelProviders();
      const provider = providers.find((p) => p.id === params.providerId);
      if (!provider) {
        throw new Error(`Provider with ID "${params.providerId}" not found`);
      }
      return getLanguageModels({ providerId: params.providerId });
    },
  );

  handle(
    "get-language-models-by-providers",
    async (): Promise<Record<string, LanguageModel[]>> => {
      return getLanguageModelsByProviders();
    },
  );

  handle("get-opencode-agents", async () => {
    return getOpenCodeAgents();
  });
}
