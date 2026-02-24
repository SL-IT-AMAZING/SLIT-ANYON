import { db } from "@/db";
import {
  language_model_providers as languageModelProvidersSchema,
  language_models as languageModelsSchema,
} from "@/db/schema";
import type { LanguageModel, LanguageModelProvider } from "@/ipc/types";
import { eq } from "drizzle-orm";
import log from "electron-log";
import {
  CLOUD_PROVIDERS,
  LOCAL_PROVIDERS,
  MODEL_OPTIONS,
  PROVIDER_TO_ENV_VAR,
} from "./language_model_constants";

const logger = log.scope("language-model-helpers");

export const CUSTOM_PROVIDER_PREFIX = "custom::";

export function isCustomProvider({ providerId }: { providerId: string }) {
  return providerId.startsWith(CUSTOM_PROVIDER_PREFIX);
}

// ---------------------------------------------------------------------------
// Upstream (DB-based) helpers — used in E2E test builds
// ---------------------------------------------------------------------------

async function getLanguageModelProvidersUpstream(): Promise<
  LanguageModelProvider[]
> {
  const customProvidersDb = await db
    .select()
    .from(languageModelProvidersSchema);

  const customProvidersMap = new Map<string, LanguageModelProvider>();
  for (const cp of customProvidersDb) {
    customProvidersMap.set(cp.id, {
      id: cp.id,
      name: cp.name,
      apiBaseUrl: cp.api_base_url,
      envVarName: cp.env_var_name ?? undefined,
      type: "custom",
    });
  }

  const hardcodedProviders: LanguageModelProvider[] = [];
  for (const providerKey in CLOUD_PROVIDERS) {
    if (Object.prototype.hasOwnProperty.call(CLOUD_PROVIDERS, providerKey)) {
      const key = providerKey as keyof typeof CLOUD_PROVIDERS;
      const providerDetails = CLOUD_PROVIDERS[key];
      if (providerDetails) {
        hardcodedProviders.push({
          id: key,
          name: providerDetails.displayName,
          hasFreeTier: providerDetails.hasFreeTier,
          websiteUrl: providerDetails.websiteUrl,
          gatewayPrefix: providerDetails.gatewayPrefix,
          secondary: providerDetails.secondary,
          envVarName: PROVIDER_TO_ENV_VAR[key] ?? undefined,
          type: "cloud",
        });
      }
    }
  }

  for (const providerKey in LOCAL_PROVIDERS) {
    if (Object.prototype.hasOwnProperty.call(LOCAL_PROVIDERS, providerKey)) {
      const key = providerKey as keyof typeof LOCAL_PROVIDERS;
      const providerDetails = LOCAL_PROVIDERS[key];
      hardcodedProviders.push({
        id: key,
        name: providerDetails.displayName,
        hasFreeTier: providerDetails.hasFreeTier,
        type: "local",
      });
    }
  }

  return [...hardcodedProviders, ...customProvidersMap.values()];
}

async function getLanguageModelsUpstream({
  providerId,
}: {
  providerId: string;
}): Promise<LanguageModel[]> {
  const allProviders = await getLanguageModelProvidersUpstream();
  const provider = allProviders.find((p) => p.id === providerId);

  if (!provider) {
    return [];
  }

  let customModels: LanguageModel[] = [];
  try {
    const customModelsDb = await db
      .select({
        id: languageModelsSchema.id,
        displayName: languageModelsSchema.displayName,
        apiName: languageModelsSchema.apiName,
        description: languageModelsSchema.description,
        maxOutputTokens: languageModelsSchema.max_output_tokens,
        contextWindow: languageModelsSchema.context_window,
      })
      .from(languageModelsSchema)
      .where(
        isCustomProvider({ providerId })
          ? eq(languageModelsSchema.customProviderId, providerId)
          : eq(languageModelsSchema.builtinProviderId, providerId),
      );

    customModels = customModelsDb.map((model) => ({
      ...model,
      description: model.description ?? "",
      tag: undefined,
      maxOutputTokens: model.maxOutputTokens ?? undefined,
      contextWindow: model.contextWindow ?? undefined,
      type: "custom",
    }));
  } catch (error) {
    logger.error(
      `Error fetching custom models for provider "${providerId}" from DB:`,
      error,
    );
  }

  let hardcodedModels: LanguageModel[] = [];
  if (provider.type === "cloud") {
    if (providerId in MODEL_OPTIONS) {
      const models = MODEL_OPTIONS[providerId] || [];
      hardcodedModels = models.map((model) => ({
        ...model,
        apiName: model.name,
        type: "cloud",
      }));
    }
  }

  return [...hardcodedModels, ...customModels];
}

async function getLanguageModelsByProvidersUpstream(): Promise<
  Record<string, LanguageModel[]>
> {
  const providers = await getLanguageModelProvidersUpstream();

  const modelPromises = providers
    .filter((p) => p.type !== "local")
    .map(async (provider) => {
      const models = await getLanguageModelsUpstream({
        providerId: provider.id,
      });
      return { providerId: provider.id, models };
    });

  const results = await Promise.all(modelPromises);

  const record: Record<string, LanguageModel[]> = {};
  for (const result of results) {
    record[result.providerId] = result.models;
  }

  return record;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export async function getLanguageModelProviders(
  _appPath?: string,
): Promise<LanguageModelProvider[]> {
  return getLanguageModelProvidersUpstream();
}

export async function getLanguageModels({
  providerId,
  appPath: _appPath,
}: {
  providerId: string;
  appPath?: string;
}): Promise<LanguageModel[]> {
  return getLanguageModelsUpstream({ providerId });
}

export async function getLanguageModelsByProviders(
  _appPath?: string,
): Promise<Record<string, LanguageModel[]>> {
  return getLanguageModelsByProvidersUpstream();
}

export function invalidateProviderCache() {
  logger.debug("Provider cache invalidation is a no-op in native runtime mode");
}
