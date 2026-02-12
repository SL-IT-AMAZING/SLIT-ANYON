import { OpenAICompatibleChatLanguageModel } from "@ai-sdk/openai-compatible";
import { OpenAIResponsesLanguageModel } from "@ai-sdk/openai/internal";
import {
  FetchFunction,
  loadApiKey,
  withoutTrailingSlash,
} from "@ai-sdk/provider-utils";

import log from "electron-log";
import { getExtraProviderOptions } from "./thinking_utils";
import type { UserSettings } from "../../lib/schemas";
import type { LanguageModel } from "ai";

const logger = log.scope("llm_engine_provider");

export type ExampleChatModelId = string & {};
export interface ChatParams {
  providerId: string;
}
export interface ExampleProviderSettings {
  /**
Example API key.
*/
  apiKey?: string;
  /**
Base URL for the API calls.
*/
  baseURL?: string;
  /**
Custom headers to include in the requests.
*/
  headers?: Record<string, string>;
  /**
Optional custom url query parameters to include in request urls.
*/
  queryParams?: Record<string, string>;
  /**
Custom fetch implementation. You can use it as a middleware to intercept requests,
or to provide a custom fetch implementation for e.g. testing.
*/
  fetch?: FetchFunction;

  anyonOptions: {
    enableLazyEdits?: boolean;
    enableSmartFilesContext?: boolean;
    enableWebSearch?: boolean;
  };
  settings: UserSettings;
}

export interface AnyonEngineProvider {
  /**
Creates a model for text generation.
*/
  (modelId: ExampleChatModelId, chatParams: ChatParams): LanguageModel;

  /**
Creates a chat model for text generation.
*/
  chatModel(modelId: ExampleChatModelId, chatParams: ChatParams): LanguageModel;

  responses(modelId: ExampleChatModelId, chatParams: ChatParams): LanguageModel;
}

export function createAnyonEngine(
  options: ExampleProviderSettings,
): AnyonEngineProvider {
  const baseURL = withoutTrailingSlash(options.baseURL);
  logger.info("creating anyon engine with baseURL", baseURL);

  // Track request ID attempts
  const requestIdAttempts = new Map<string, number>();

  const getHeaders = () => ({
    Authorization: `Bearer ${loadApiKey({
      apiKey: options.apiKey,
      environmentVariableName: "ANYON_PRO_API_KEY",
      description: "Example API key",
    })}`,
    ...options.headers,
  });

  interface CommonModelConfig {
    provider: string;
    url: ({ path }: { path: string }) => string;
    headers: () => Record<string, string>;
    fetch?: FetchFunction;
  }

  const getCommonModelConfig = (): CommonModelConfig => ({
    provider: `anyon-engine`,
    url: ({ path }) => {
      const url = new URL(`${baseURL}${path}`);
      if (options.queryParams) {
        url.search = new URLSearchParams(options.queryParams).toString();
      }
      return url.toString();
    },
    headers: getHeaders,
    fetch: options.fetch,
  });

  // Custom fetch implementation that adds anyon-specific options to the request
  const createAnyonFetch = ({
    providerId,
  }: {
    providerId: string;
  }): FetchFunction => {
    return (input: RequestInfo | URL, init?: RequestInit) => {
      // Use default fetch if no init or body
      if (!init || !init.body || typeof init.body !== "string") {
        return (options.fetch || fetch)(input, init);
      }

      try {
        // Parse the request body to manipulate it
        const parsedBody = {
          ...JSON.parse(init.body),
          ...getExtraProviderOptions(providerId, options.settings),
        };
        const anyonVersionedFiles = parsedBody.anyonVersionedFiles;
        if ("anyonVersionedFiles" in parsedBody) {
          delete parsedBody.anyonVersionedFiles;
        }
        const anyonFiles = parsedBody.anyonFiles;
        if ("anyonFiles" in parsedBody) {
          delete parsedBody.anyonFiles;
        }
        const requestId = parsedBody.anyonRequestId;
        if ("anyonRequestId" in parsedBody) {
          delete parsedBody.anyonRequestId;
        }
        const anyonAppId = parsedBody.anyonAppId;
        if ("anyonAppId" in parsedBody) {
          delete parsedBody.anyonAppId;
        }
        const anyonDisableFiles = parsedBody.anyonDisableFiles;
        if ("anyonDisableFiles" in parsedBody) {
          delete parsedBody.anyonDisableFiles;
        }
        const anyonMentionedApps = parsedBody.anyonMentionedApps;
        if ("anyonMentionedApps" in parsedBody) {
          delete parsedBody.anyonMentionedApps;
        }
        const anyonSmartContextMode = parsedBody.anyonSmartContextMode;
        if ("anyonSmartContextMode" in parsedBody) {
          delete parsedBody.anyonSmartContextMode;
        }

        // Track and modify requestId with attempt number
        let modifiedRequestId = requestId;
        if (requestId) {
          const currentAttempt = (requestIdAttempts.get(requestId) || 0) + 1;
          requestIdAttempts.set(requestId, currentAttempt);
          modifiedRequestId = `${requestId}:attempt-${currentAttempt}`;
        }

        // Add files to the request if they exist
        if (!anyonDisableFiles) {
          parsedBody.anyon_options = {
            files: anyonFiles,
            versioned_files: anyonVersionedFiles,
            enable_lazy_edits: options.anyonOptions.enableLazyEdits,
            enable_smart_files_context:
              options.anyonOptions.enableSmartFilesContext,
            smart_context_mode: anyonSmartContextMode,
            enable_web_search: options.anyonOptions.enableWebSearch,
            app_id: anyonAppId,
          };
          if (anyonMentionedApps?.length) {
            parsedBody.anyon_options.mentioned_apps = anyonMentionedApps;
          }
        }

        // Return modified request with files included and requestId in headers
        const modifiedInit = {
          ...init,
          headers: {
            ...init.headers,
            ...(modifiedRequestId && {
              "X-Anyon-Request-Id": modifiedRequestId,
            }),
          },
          body: JSON.stringify(parsedBody),
        };

        // Use the provided fetch or default fetch
        return (options.fetch || fetch)(input, modifiedInit);
      } catch (e) {
        logger.error("Error parsing request body", e);
        // If parsing fails, use original request
        return (options.fetch || fetch)(input, init);
      }
    };
  };

  const createChatModel = (
    modelId: ExampleChatModelId,
    chatParams: ChatParams,
  ) => {
    const config = {
      ...getCommonModelConfig(),
      fetch: createAnyonFetch({ providerId: chatParams.providerId }),
    };

    return new OpenAICompatibleChatLanguageModel(modelId, config);
  };

  const createResponsesModel = (
    modelId: ExampleChatModelId,
    chatParams: ChatParams,
  ) => {
    const config = {
      ...getCommonModelConfig(),
      fetch: createAnyonFetch({ providerId: chatParams.providerId }),
    };

    return new OpenAIResponsesLanguageModel(modelId, config);
  };

  const provider = (modelId: ExampleChatModelId, chatParams: ChatParams) =>
    createChatModel(modelId, chatParams);

  provider.chatModel = createChatModel;
  provider.responses = createResponsesModel;

  return provider;
}
