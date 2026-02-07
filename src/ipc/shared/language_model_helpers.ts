import type { LanguageModelProvider, LanguageModel } from "@/ipc/types";
import {
  getOpenCodeProviders,
  type OpenCodeProviderListResponse,
} from "../utils/opencode_api";
import { IS_TEST_BUILD } from "../utils/test_utils";
import { db } from "@/db";
import {
  language_model_providers as languageModelProvidersSchema,
  language_models as languageModelsSchema,
} from "@/db/schema";
import { eq } from "drizzle-orm";
import {
  LOCAL_PROVIDERS,
  CLOUD_PROVIDERS,
  MODEL_OPTIONS,
  PROVIDER_TO_ENV_VAR,
} from "./language_model_constants";
import log from "electron-log";

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

let cachedProviders: OpenCodeProviderListResponse | null = null;
let cacheTimestamp = 0;
const CACHE_TTL = 30_000;

async function fetchProviders(): Promise<OpenCodeProviderListResponse> {
  const now = Date.now();
  if (cachedProviders && now - cacheTimestamp < CACHE_TTL) {
    return cachedProviders;
  }
  try {
    cachedProviders = await getOpenCodeProviders();
    cacheTimestamp = now;
    return cachedProviders;
  } catch (error) {
    logger.error("Failed to fetch providers from OpenCode:", error);
    if (cachedProviders) return cachedProviders;
    return { all: [], default: {}, connected: [] };
  }
}

async function getLanguageModelProvidersOpenCode(): Promise<
  LanguageModelProvider[]
> {
  const data = await fetchProviders();
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
}: {
  providerId: string;
}): Promise<LanguageModel[]> {
  const data = await fetchProviders();
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

async function getLanguageModelsByProvidersOpenCode(): Promise<
  Record<string, LanguageModel[]>
> {
  const data = await fetchProviders();
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

export async function getLanguageModelProviders(): Promise<
  LanguageModelProvider[]
> {
  if (IS_TEST_BUILD) {
    return getLanguageModelProvidersUpstream();
  }
  return getLanguageModelProvidersOpenCode();
}

export async function getLanguageModels({
  providerId,
}: {
  providerId: string;
}): Promise<LanguageModel[]> {
  if (IS_TEST_BUILD) {
    return getLanguageModelsUpstream({ providerId });
  }
  return getLanguageModelsOpenCode({ providerId });
}

export async function getLanguageModelsByProviders(): Promise<
  Record<string, LanguageModel[]>
> {
  if (IS_TEST_BUILD) {
    return getLanguageModelsByProvidersUpstream();
  }
  return getLanguageModelsByProvidersOpenCode();
}

export function invalidateProviderCache() {
  cachedProviders = null;
  cacheTimestamp = 0;
}
