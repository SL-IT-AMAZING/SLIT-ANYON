import { openCodeServer } from "./opencode_server";
import log from "electron-log";

const logger = log.scope("opencode-api");

export interface OpenCodeModelCost {
  input: number;
  output: number;
}

export interface OpenCodeModel {
  id: string;
  name: string;
  context_length?: number;
  max_output?: number;
  cost?: OpenCodeModelCost;
  family?: string;
  release_date?: string;
}

export interface OpenCodeProvider {
  id: string;
  name: string;
  models: Record<string, OpenCodeModel>;
}

export interface OpenCodeProviderListResponse {
  all: OpenCodeProvider[];
  default: Record<string, string>;
  connected: string[];
}

async function fetchOpenCodeAPI<T>(
  path: string,
  options?: RequestInit,
): Promise<T> {
  const serverInfo = await openCodeServer.ensureRunning();
  const url = `${serverInfo.url}${path}`;
  const credentials = Buffer.from(`opencode:${serverInfo.password}`).toString(
    "base64",
  );

  const response = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ message: response.statusText }));
    throw new Error(
      `OpenCode API error [${response.status}]: ${error.message || "Unknown error"}`,
    );
  }

  return response.json() as Promise<T>;
}

export async function getOpenCodeProviders(): Promise<OpenCodeProviderListResponse> {
  logger.debug("Fetching providers from OpenCode server");
  return fetchOpenCodeAPI<OpenCodeProviderListResponse>("/provider");
}

export async function getOpenCodeAuthMethods(): Promise<
  Record<string, unknown[]>
> {
  logger.debug("Fetching auth methods from OpenCode server");
  return fetchOpenCodeAPI<Record<string, unknown[]>>("/provider/auth");
}

export async function getOpenCodeAgents(): Promise<unknown[]> {
  logger.debug("Fetching agents from OpenCode server");
  return fetchOpenCodeAPI<unknown[]>("/app/agents");
}
