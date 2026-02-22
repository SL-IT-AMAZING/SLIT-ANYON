import log from "electron-log";
import { openCodeServer } from "./opencode_server";

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
  cwd?: string,
): Promise<T> {
  const serverInfo = await openCodeServer.ensureRunning(cwd ? { cwd } : {});
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

export async function getOpenCodeProviders(
  appPath?: string,
): Promise<OpenCodeProviderListResponse> {
  logger.debug("Fetching providers from OpenCode server", { appPath });
  return fetchOpenCodeAPI<OpenCodeProviderListResponse>(
    "/provider",
    undefined,
    appPath,
  );
}

export async function getOpenCodeAuthMethods(): Promise<
  Record<string, unknown[]>
> {
  logger.debug("Fetching auth methods from OpenCode server");
  return fetchOpenCodeAPI<Record<string, unknown[]>>("/provider/auth");
}

export interface OpenCodeAgent {
  name: string;
  description: string;
  mode: "primary" | "subagent" | "all";
  native: boolean;
  hidden?: boolean;
  color?: string;
  variant?: string;
  model?: {
    providerID: string;
    modelID: string;
  };
}

export async function getOpenCodeAgents(
  appPath?: string,
): Promise<OpenCodeAgent[]> {
  logger.debug("Fetching agents from OpenCode server", { appPath });
  const agents = await fetchOpenCodeAPI<OpenCodeAgent[]>(
    "/agent",
    undefined,
    appPath,
  );
  // Match OpenCode desktop app's filter: show all non-subagent, non-hidden agents
  // This includes mode "primary" and "all" (agents usable as both primary and subagent)
  return agents.filter((a) => !a.hidden && a.mode !== "subagent");
}
