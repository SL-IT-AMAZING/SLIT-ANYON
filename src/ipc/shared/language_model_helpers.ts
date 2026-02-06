import type { LanguageModelProvider, LanguageModel } from "@/ipc/types";
import {
  getOpenCodeProviders,
  type OpenCodeProviderListResponse,
} from "../utils/opencode_api";
import log from "electron-log";

const logger = log.scope("language-model-helpers");

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

export async function getLanguageModelProviders(): Promise<
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

export async function getLanguageModels({
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

export async function getLanguageModelsByProviders(): Promise<
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

export function invalidateProviderCache() {
  cachedProviders = null;
  cacheTimestamp = 0;
}
