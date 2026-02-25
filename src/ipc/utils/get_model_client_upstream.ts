import type { LanguageModelProvider } from "@/ipc/types";
import { createAmazonBedrock } from "@ai-sdk/amazon-bedrock";
import { createAnthropic } from "@ai-sdk/anthropic";
import { createAzure } from "@ai-sdk/azure";
import { createGoogleGenerativeAI as createGoogle } from "@ai-sdk/google";
import { createVertex as createGoogleVertex } from "@ai-sdk/google-vertex";
import { createOpenAI } from "@ai-sdk/openai";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { createXai } from "@ai-sdk/xai";
import type { LanguageModel } from "ai";
import log from "electron-log";
import type {
  AzureProviderSetting,
  LargeLanguageModel,
  UserSettings,
  VertexProviderSetting,
} from "../../lib/schemas";
import {
  FREE_OPENROUTER_MODEL_NAMES,
  GEMINI_3_FLASH,
  GPT_5_2_MODEL_NAME,
  SONNET_4_5,
} from "../shared/language_model_constants";
import { getLanguageModelProviders } from "../shared/language_model_helpers";
import {
  type AnyonEngineProvider,
  createAnyonEngine,
} from "./llm_engine_provider";
import { getEnvVar } from "./read_env";

import { getOllamaApiUrl } from "../handlers/local_model_ollama_handler";
import { LM_STUDIO_BASE_URL } from "./lm_studio_utils";
import { createOllamaProvider } from "./ollama_provider";
import { getActiveAccessToken } from "../../main/entitlement";
import { PROXY_BASE_URL } from "../../lib/oauthConfig";

const anyonEngineUrl = process.env.ANYON_ENGINE_URL;

const AUTO_MODELS = [
  {
    provider: "openai",
    name: GPT_5_2_MODEL_NAME,
  },
  {
    provider: "anthropic",
    name: SONNET_4_5,
  },
  {
    provider: "google",
    name: GEMINI_3_FLASH,
  },
  {
    provider: "google",
    name: "gemini-2.5-flash",
  },
];

export interface ModelClient {
  model: LanguageModel;
  builtinProviderId?: string;
}

const logger = log.scope("getModelClient");
export async function getModelClientUpstream(
  model: LargeLanguageModel,
  settings: UserSettings,
  // files?: File[],
): Promise<{
  modelClient: ModelClient;
  isEngineEnabled?: boolean;
  isSmartContextEnabled?: boolean;
}> {
  const allProviders = await getLanguageModelProviders();

  const anyonApiKey =
    settings.providerSettings?.auto?.apiKey?.value ||
    getEnvVar("ANYON_PRO_API_KEY");

  // --- Handle specific provider ---
  const providerConfig = allProviders.find((p) => p.id === model.provider);

  if (!providerConfig) {
    throw new Error(`Configuration not found for provider: ${model.provider}`);
  }

  // ── Anyon Pro proxy routing ──────────────────────────────────────────────
  // The Vercel server at server-green-seven.vercel.app/api/v1/[provider]/[...path]
  // authenticates via Supabase access tokens and proxies to real LLM APIs.
  // Priority: 1) Legacy engine (ANYON_ENGINE_URL + API key), 2) Vercel proxy (Supabase auth)
  if (settings.enableAnyonPro) {
    // Legacy engine path: explicit engine URL + dedicated API key
    if (anyonEngineUrl && anyonApiKey) {
      if (providerConfig.gatewayPrefix != null) {
        const enableSmartFilesContext = settings.enableProSmartFilesContextMode;
        const provider = createAnyonEngine({
          apiKey: anyonApiKey,
          baseURL: anyonEngineUrl,
          anyonOptions: {
            enableLazyEdits:
              settings.enableProLazyEditsMode &&
              settings.proLazyEditsMode !== "v2",
            enableSmartFilesContext,
            enableWebSearch: settings.enableProWebSearch,
          },
          settings,
        });

        logger.info(
          `\x1b[1;97;44m Using ANYON Engine for model: ${model.name} \x1b[0m`,
        );

        const modelName = model.name.split(":free")[0];
        const proModelClient = getProModelClient({
          model,
          provider,
          modelId: `${providerConfig.gatewayPrefix || ""}${modelName}`,
        });

        return {
          modelClient: proModelClient,
          isEngineEnabled: true,
          isSmartContextEnabled: enableSmartFilesContext,
        };
      }
    }

    // New: Route through Vercel proxy using Supabase auth token
    const proxyClient = await tryProxyModelClient(model, settings);
    if (proxyClient) {
      return proxyClient;
    }
    // Fall through to direct provider if proxy auth fails
  }
  // Handle 'auto' provider by trying each model in AUTO_MODELS until one works
  if (model.provider === "auto") {
    if (model.name === "free") {
      const openRouterProvider = allProviders.find(
        (p) => p.id === "openrouter",
      );
      if (!openRouterProvider) {
        throw new Error("OpenRouter provider not found");
      }
      // TODO: fallback_ai_model was removed - use first model from FREE_OPENROUTER_MODEL_NAMES for now
      return {
        modelClient: {
          model: getRegularModelClient(
            { provider: "openrouter", name: FREE_OPENROUTER_MODEL_NAMES[0] },
            settings,
            openRouterProvider,
          ).modelClient.model,
          builtinProviderId: "openrouter",
        },
        isEngineEnabled: false,
      };
    }
    for (const autoModel of AUTO_MODELS) {
      const providerInfo = allProviders.find(
        (p) => p.id === autoModel.provider,
      );
      const envVarName = providerInfo?.envVarName;

      const apiKey =
        settings.providerSettings?.[autoModel.provider]?.apiKey?.value ||
        (envVarName ? getEnvVar(envVarName) : undefined);

      if (apiKey) {
        logger.log(
          `Using provider: ${autoModel.provider} model: ${autoModel.name}`,
        );
        // Recursively call with the specific model found
        return await getModelClientUpstream(
          {
            provider: autoModel.provider,
            name: autoModel.name,
          },
          settings,
        );
      }
    }
    // If no models have API keys, throw an error
    throw new Error(
      "No API keys available for any model supported by the 'auto' provider.",
    );
  }
  return getRegularModelClient(model, settings, providerConfig);
}

function getProModelClient({
  model,
  provider,
  modelId,
}: {
  model: LargeLanguageModel;
  provider: AnyonEngineProvider;
  modelId: string;
}): ModelClient {
  return {
    model: provider(modelId, { providerId: model.provider }),
    builtinProviderId: model.provider,
  };
}

function getRegularModelClient(
  model: LargeLanguageModel,
  settings: UserSettings,
  providerConfig: LanguageModelProvider,
): {
  modelClient: ModelClient;
  backupModelClients: ModelClient[];
} {
  // Get API key for the specific provider
  const apiKey =
    settings.providerSettings?.[model.provider]?.apiKey?.value ||
    (providerConfig.envVarName
      ? getEnvVar(providerConfig.envVarName)
      : undefined);

  const providerId = providerConfig.id;
  // Create client based on provider ID or type
  switch (providerId) {
    case "openai": {
      const provider = createOpenAI({ apiKey });
      return {
        modelClient: {
          model: provider.responses(model.name),
          builtinProviderId: providerId,
        },
        backupModelClients: [],
      };
    }
    case "anthropic": {
      const provider = createAnthropic({ apiKey });
      return {
        modelClient: {
          model: provider(model.name),
          builtinProviderId: providerId,
        },
        backupModelClients: [],
      };
    }
    case "xai": {
      const provider = createXai({ apiKey });
      return {
        modelClient: {
          model: provider(model.name),
          builtinProviderId: providerId,
        },
        backupModelClients: [],
      };
    }
    case "google": {
      const provider = createGoogle({ apiKey });
      return {
        modelClient: {
          model: provider(model.name),
          builtinProviderId: providerId,
        },
        backupModelClients: [],
      };
    }
    case "vertex": {
      // Vertex uses Google service account credentials with project/location
      const vertexSettings = settings.providerSettings?.[
        model.provider
      ] as VertexProviderSetting;
      const project = vertexSettings?.projectId;
      const location = vertexSettings?.location;
      const serviceAccountKey = vertexSettings?.serviceAccountKey?.value;

      // Use a baseURL that does NOT pin to publishers/google so that
      // full publisher model IDs (e.g. publishers/deepseek-ai/models/...) work.
      const regionHost = `${location === "global" ? "" : `${location}-`}aiplatform.googleapis.com`;
      const baseURL = `https://${regionHost}/v1/projects/${project}/locations/${location}`;
      const provider = createGoogleVertex({
        project,
        location,
        baseURL,
        googleAuthOptions: serviceAccountKey
          ? {
              // Expecting the user to paste the full JSON of the service account key
              credentials: JSON.parse(serviceAccountKey),
            }
          : undefined,
      });
      return {
        modelClient: {
          // For built-in Google models on Vertex, the path must include
          // publishers/google/models/<model>. For partner MaaS models the
          // full publisher path is already included.
          model: provider(
            model.name.includes("/")
              ? model.name
              : `publishers/google/models/${model.name}`,
          ),
          builtinProviderId: providerId,
        },
        backupModelClients: [],
      };
    }
    case "openrouter": {
      const provider = createOpenAICompatible({
        name: "openrouter",
        baseURL: "https://openrouter.ai/api/v1",
        apiKey,
      });
      return {
        modelClient: {
          model: provider(model.name),
          builtinProviderId: providerId,
        },
        backupModelClients: [],
      };
    }
    case "azure": {
      // Check if we're in e2e testing mode
      const testAzureBaseUrl = getEnvVar("TEST_AZURE_BASE_URL");

      if (testAzureBaseUrl) {
        // Use fake server for e2e testing
        logger.info(`Using test Azure base URL: ${testAzureBaseUrl}`);
        const provider = createOpenAICompatible({
          name: "azure-test",
          baseURL: testAzureBaseUrl,
          apiKey: "fake-api-key-for-testing",
        });
        return {
          modelClient: {
            model: provider(model.name),
            builtinProviderId: providerId,
          },
          backupModelClients: [],
        };
      }

      const azureSettings = settings.providerSettings?.azure as
        | AzureProviderSetting
        | undefined;
      const azureApiKeyFromSettings = (
        azureSettings?.apiKey?.value ?? ""
      ).trim();
      const azureResourceNameFromSettings = (
        azureSettings?.resourceName ?? ""
      ).trim();
      const envResourceName = (getEnvVar("AZURE_RESOURCE_NAME") ?? "").trim();
      const envAzureApiKey = (getEnvVar("AZURE_API_KEY") ?? "").trim();

      const resourceName = azureResourceNameFromSettings || envResourceName;
      const azureApiKey = azureApiKeyFromSettings || envAzureApiKey;

      if (!resourceName) {
        throw new Error(
          "Azure OpenAI resource name is required. Provide it in Settings or set the AZURE_RESOURCE_NAME environment variable.",
        );
      }

      if (!azureApiKey) {
        throw new Error(
          "Azure OpenAI API key is required. Provide it in Settings or set the AZURE_API_KEY environment variable.",
        );
      }

      const provider = createAzure({
        resourceName,
        apiKey: azureApiKey,
      });

      return {
        modelClient: {
          model: provider(model.name),
          builtinProviderId: providerId,
        },
        backupModelClients: [],
      };
    }
    case "ollama": {
      const provider = createOllamaProvider({ baseURL: getOllamaApiUrl() });
      return {
        modelClient: {
          model: provider(model.name),
          builtinProviderId: providerId,
        },
        backupModelClients: [],
      };
    }
    case "lmstudio": {
      // LM Studio uses OpenAI compatible API
      const baseURL = providerConfig.apiBaseUrl || LM_STUDIO_BASE_URL + "/v1";
      const provider = createOpenAICompatible({
        name: "lmstudio",
        baseURL,
      });
      return {
        modelClient: {
          model: provider(model.name),
        },
        backupModelClients: [],
      };
    }
    case "bedrock": {
      // AWS Bedrock supports API key authentication using AWS_BEARER_TOKEN_BEDROCK
      // See: https://sdk.vercel.ai/providers/ai-sdk-providers/amazon-bedrock#api-key-authentication
      const provider = createAmazonBedrock({
        apiKey: apiKey,
        region: getEnvVar("AWS_REGION") || "us-east-1",
      });
      return {
        modelClient: {
          model: provider(model.name),
          builtinProviderId: providerId,
        },
        backupModelClients: [],
      };
    }
    default: {
      // Handle custom providers
      if (providerConfig.type === "custom") {
        if (!providerConfig.apiBaseUrl) {
          throw new Error(
            `Custom provider ${model.provider} is missing the API Base URL.`,
          );
        }
        // Assume custom providers are OpenAI compatible for now
        const provider = createOpenAICompatible({
          name: providerConfig.id,
          baseURL: providerConfig.apiBaseUrl,
          apiKey,
        });
        return {
          modelClient: {
            model: provider(model.name),
          },
          backupModelClients: [],
        };
      }
      // If it's not a known ID and not type 'custom', it's unsupported
      throw new Error(`Unsupported model provider: ${model.provider}`);
    }
  }
}

// ── Anyon Pro Vercel Proxy routing ────────────────────────────────────────────
// Routes LLM requests through the Vercel server proxy which authenticates via
// Supabase access tokens and forwards to real provider APIs with server-side keys.
//
// URL mapping per provider (proxy route: /api/v1/[provider]/[...path]):
//   Anthropic SDK: baseURL/v1/messages  → proxy/anthropic/v1/messages  → api.anthropic.com/v1/messages
//   OpenAI SDK:    baseURL/chat/completions → proxy/openai/v1/chat/completions → api.openai.com/v1/chat/completions
//   Google SDK:    baseURL/models/:gen    → proxy/google/v1beta/models/:gen → generativelanguage.googleapis.com/v1beta/models/:gen
//   XAI SDK:       baseURL/chat/completions → proxy/xai/v1/chat/completions → api.x.ai/v1/chat/completions

/** Maps provider ID → base URL suffix appended to the proxy root. */
const PROXY_PROVIDER_PATHS: Record<string, string> = {
  anthropic: "/anthropic",
  openai: "/openai/v1",
  google: "/google/v1beta",
  xai: "/xai/v1",
};

/**
 * Attempts to create a model client routed through the Anyon Pro Vercel proxy.
 * Returns null if the provider is unsupported or the user is not authenticated.
 */
async function tryProxyModelClient(
  model: LargeLanguageModel,
  settings: UserSettings,
): Promise<{
  modelClient: ModelClient;
  isEngineEnabled: boolean;
} | null> {
  const providerPath = PROXY_PROVIDER_PATHS[model.provider];
  if (!providerPath) {
    logger.warn(
      `Anyon Pro proxy: provider ${model.provider} not supported, falling back to direct`,
    );
    return null;
  }

  let accessToken: string;
  try {
    accessToken = await getActiveAccessToken("anyon-pro-proxy");
  } catch (error) {
    logger.warn(
      "Anyon Pro proxy: auth failed, falling back to direct provider:",
      error,
    );
    return null;
  }

  const baseURL = `${PROXY_BASE_URL}${providerPath}`;
  const authHeaders = { Authorization: `Bearer ${accessToken}` };

  logger.info(
    `\x1b[1;97;44m Using Anyon Pro proxy for ${model.provider}/${model.name} \x1b[0m`,
  );
  logger.info(`\x1b[1;30;42m Proxy base: ${baseURL} \x1b[0m`);

  const modelClient = createProxyProviderClient(
    model,
    baseURL,
    accessToken,
    authHeaders,
  );

  return { modelClient, isEngineEnabled: true };
}

/**
 * Creates native AI SDK provider clients pointed at the Vercel proxy.
 * Auth is handled by sending the Supabase token as Authorization header.
 * The proxy strips it for auth verification, then adds real provider keys.
 */
function createProxyProviderClient(
  model: LargeLanguageModel,
  baseURL: string,
  accessToken: string,
  authHeaders: Record<string, string>,
): ModelClient {
  switch (model.provider) {
    case "anthropic": {
      // Anthropic SDK sends x-api-key header (proxy overwrites with real key)
      // We add Authorization header for proxy auth verification
      const provider = createAnthropic({
        apiKey: "proxy-managed",
        baseURL,
        headers: authHeaders,
      });
      return { model: provider(model.name), builtinProviderId: model.provider };
    }
    case "openai": {
      // OpenAI SDK sends Authorization header with apiKey — use Supabase token
      // Proxy reads it for auth, then replaces with real OpenAI key
      const provider = createOpenAI({
        apiKey: accessToken,
        baseURL,
      });
      return {
        model: provider.responses(model.name),
        builtinProviderId: model.provider,
      };
    }
    case "google": {
      // Google SDK sends x-goog-api-key header (proxy overwrites with real key)
      // We add Authorization header for proxy auth verification
      const provider = createGoogle({
        apiKey: "proxy-managed",
        baseURL,
        headers: authHeaders,
      });
      return { model: provider(model.name), builtinProviderId: model.provider };
    }
    case "xai": {
      // XAI SDK sends Authorization header like OpenAI
      const provider = createXai({
        apiKey: accessToken,
        baseURL,
      });
      return { model: provider(model.name), builtinProviderId: model.provider };
    }
    default:
      throw new Error(
        `Anyon Pro proxy: unsupported provider ${model.provider}`,
      );
  }
}
