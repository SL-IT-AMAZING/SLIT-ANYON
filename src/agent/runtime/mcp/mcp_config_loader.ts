import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import log from "electron-log";
import type { McpServerConfig } from "./types";

const logger = log.scope("mcp-config");

export function loadMcpServerConfigs(projectDir: string): McpServerConfig[] {
  const configs: McpServerConfig[] = [];
  const seen = new Set<string>();

  const userConfigPath = path.join(
    os.homedir(),
    ".config",
    "opencode",
    "opencode.json",
  );
  loadConfigsFromFile(userConfigPath, configs, seen);

  const projectConfigPath = path.join(projectDir, ".opencode", "mcp.json");
  loadConfigsFromFile(projectConfigPath, configs, seen);

  const omoConfigPath = path.join(
    os.homedir(),
    ".config",
    "opencode",
    "oh-my-opencode.json",
  );
  loadConfigsFromFile(omoConfigPath, configs, seen);

  logger.info(`Loaded ${configs.length} MCP server configs`);
  return configs;
}

function loadConfigsFromFile(
  filePath: string,
  configs: McpServerConfig[],
  seen: Set<string>,
): void {
  if (!fs.existsSync(filePath)) {
    return;
  }

  try {
    const raw = fs.readFileSync(filePath, "utf-8");
    const data = JSON.parse(raw) as {
      mcp?: { servers?: Record<string, unknown> };
      mcpServers?: Record<string, unknown>;
      servers?: Record<string, unknown>;
    };

    const serversSection =
      data.mcp?.servers ?? data.mcpServers ?? data.servers ?? {};

    for (const [name, config] of Object.entries(serversSection)) {
      if (seen.has(name)) {
        continue;
      }

      seen.add(name);
      const parsed = toServerConfig(name, config);
      if (parsed) {
        configs.push(parsed);
      }
    }
  } catch (err) {
    logger.debug(`Failed to load MCP config from ${filePath}:`, err);
  }
}

function toServerConfig(name: string, config: unknown): McpServerConfig | null {
  if (!config || typeof config !== "object") {
    return null;
  }

  const cfg = config as {
    command?: unknown;
    args?: unknown;
    env?: unknown;
    cwd?: unknown;
  };

  if (typeof cfg.command !== "string") {
    return null;
  }

  return {
    name,
    command: cfg.command,
    args: Array.isArray(cfg.args) ? cfg.args.map((arg) => String(arg)) : [],
    env: parseEnv(cfg.env),
    cwd: typeof cfg.cwd === "string" ? cfg.cwd : undefined,
  };
}

function parseEnv(value: unknown): Record<string, string> | undefined {
  if (!value || typeof value !== "object") {
    return undefined;
  }

  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).map(([key, envValue]) => [
      key,
      String(envValue),
    ]),
  );
}
