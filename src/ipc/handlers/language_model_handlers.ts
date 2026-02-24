import { getNativeAgents } from "@/agent/runtime/agent_config";
import type { LanguageModel, LanguageModelProvider } from "@/ipc/types";
import type { IpcMainInvokeEvent } from "electron";
import log from "electron-log";
import {
  getLanguageModelProviders,
  getLanguageModels,
  getLanguageModelsByProviders,
} from "../shared/language_model_helpers";
import { createLoggedHandler } from "./safe_handle";

const logger = log.scope("language_model_handlers");
const handle = createLoggedHandler(logger);

export function registerLanguageModelHandlers() {
  handle(
    "get-language-model-providers",
    async (
      event: IpcMainInvokeEvent,
      params?: { appPath?: string },
    ): Promise<LanguageModelProvider[]> => {
      return getLanguageModelProviders(params?.appPath);
    },
  );

  handle(
    "get-language-models",
    async (
      event: IpcMainInvokeEvent,
      params: { providerId: string; appPath?: string },
    ): Promise<LanguageModel[]> => {
      if (!params || typeof params.providerId !== "string") {
        throw new Error("Invalid parameters: providerId (string) is required.");
      }
      const providers = await getLanguageModelProviders(params.appPath);
      const provider = providers.find((p) => p.id === params.providerId);
      if (!provider) {
        throw new Error(`Provider with ID "${params.providerId}" not found`);
      }
      return getLanguageModels({
        providerId: params.providerId,
        appPath: params.appPath,
      });
    },
  );

  handle(
    "get-language-models-by-providers",
    async (
      event: IpcMainInvokeEvent,
      params?: { appPath?: string },
    ): Promise<Record<string, LanguageModel[]>> => {
      return getLanguageModelsByProviders(params?.appPath);
    },
  );

  handle(
    "get-opencode-agents",
    async (_event: IpcMainInvokeEvent, _params?: { appPath?: string }) => {
      return getNativeAgents();
    },
  );
}
