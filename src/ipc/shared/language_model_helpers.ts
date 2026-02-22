import { db } from "@/db";
import {
  language_model_providers as languageModelProvidersSchema,
  language_models as languageModelsSchema,
} from "@/db/schema";
import type { LanguageModel, LanguageModelProvider } from "@/ipc/types";
import { eq } from "drizzle-orm";
import log from "electron-log";
import {
  type OpenCodeProviderListResponse,
  getOpenCodeProviders,
} from "../utils/opencode_api";
import { IS_TEST_BUILD } from "../utils/test_utils";
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
// OpenCode API-based helpers — used in production
// ---------------------------------------------------------------------------

const PROVIDER_CACHE_KEY_DEFAULT = "__default__";
const cachedProviders = new Map<string, OpenCodeProviderListResponse>();
const cacheTimestamps = new Map<string, number>();
const CACHE_TTL = 30_000;
const providerFetchPromises = new Map<
  string,
  Promise<OpenCodeProviderListResponse>
>();

function toProviderCacheKey(appPath?: string): string {
  return appPath ?? PROVIDER_CACHE_KEY_DEFAULT;
}

async function fetchProviders(
  appPath?: string,
): Promise<OpenCodeProviderListResponse> {
  const cacheKey = toProviderCacheKey(appPath);
  const now = Date.now();
  const cached = cachedProviders.get(cacheKey);
  const timestamp = cacheTimestamps.get(cacheKey) ?? 0;
  if (cached && now - timestamp < CACHE_TTL) {
    return cached;
  }

  const inFlight = providerFetchPromises.get(cacheKey);
  if (inFlight) {
    return inFlight;
  }

  const fetchPromise = (async () => {
    try {
      const providers = await getOpenCodeProviders(appPath);
      cachedProviders.set(cacheKey, providers);
      cacheTimestamps.set(cacheKey, Date.now());
      return providers;
    } catch (error) {
      logger.error("Failed to fetch providers from OpenCode:", error);
      const stale = cachedProviders.get(cacheKey);
      if (stale) {
        return stale;
      }
      return { all: [], default: {}, connected: [] };
    } finally {
      providerFetchPromises.delete(cacheKey);
    }
  })();

  providerFetchPromises.set(cacheKey, fetchPromise);
  return fetchPromise;
}

async function getLanguageModelProvidersOpenCode(
  appPath?: string,
): Promise<LanguageModelProvider[]> {
  const data = await fetchProviders(appPath);
  return data.all.map((p) => ({
    id: p.id,
    name: p.name,
    type: "cloud" as const,
    hasFreeTier: p.id === "opencode",
    isConnected: data.connected.includes(p.id),
  }));
}

async function getLanguageModelsOpenCode({
  providerId,
  appPath,
}: {
  providerId: string;
  appPath?: string;
}): Promise<LanguageModel[]> {
  const data = await fetchProviders(appPath);
  const provider = data.all.find((p) => p.id === providerId);
  if (!provider) return [];

  return Object.values(provider.models).map((m) => ({
    apiName: m.id,
    displayName: m.name,
    maxOutputTokens: m.max_output,
    contextWindow: m.context_length,
    type: "cloud" as const,
  }));
}

async function getLanguageModelsByProvidersOpenCode(
  appPath?: string,
): Promise<Record<string, LanguageModel[]>> {
  const data = await fetchProviders(appPath);
  const record: Record<string, LanguageModel[]> = {};

  for (const provider of data.all) {
    if (!data.connected.includes(provider.id)) continue;
    record[provider.id] = Object.values(provider.models).map((m) => ({
      apiName: m.id,
      displayName: m.name,
      maxOutputTokens: m.max_output,
      contextWindow: m.context_length,
      type: "cloud" as const,
    }));
  }

  return record;
}

// ---------------------------------------------------------------------------
// Public API — delegates to upstream or OpenCode based on build mode
// ---------------------------------------------------------------------------

export async function getLanguageModelProviders(
  appPath?: string,
): Promise<LanguageModelProvider[]> {
  if (IS_TEST_BUILD) {
    return getLanguageModelProvidersUpstream();
  }
  return getLanguageModelProvidersOpenCode(appPath);
}

export async function getLanguageModels({
  providerId,
  appPath,
}: {
  providerId: string;
  appPath?: string;
}): Promise<LanguageModel[]> {
  if (IS_TEST_BUILD) {
    return getLanguageModelsUpstream({ providerId });
  }
  return getLanguageModelsOpenCode({ providerId, appPath });
}

export async function getLanguageModelsByProviders(
  appPath?: string,
): Promise<Record<string, LanguageModel[]>> {
  if (IS_TEST_BUILD) {
    return getLanguageModelsByProvidersUpstream();
  }
  return getLanguageModelsByProvidersOpenCode(appPath);
}

export function invalidateProviderCache() {
  cachedProviders.clear();
  cacheTimestamps.clear();
  providerFetchPromises.clear();
}
