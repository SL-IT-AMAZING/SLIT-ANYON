import { type ChildProcess, spawn } from "node:child_process";
import log from "electron-log";
import { McpJsonRpcClient } from "./mcp_json_rpc";
import type {
  McpResource,
  McpServerConfig,
  McpServerDescriptor,
  McpServerStatus,
  McpTool,
} from "./types";

const logger = log.scope("mcp-manager");

interface McpServerInstance {
  name: string;
  config: McpServerConfig;
  process: ChildProcess;
  client: McpJsonRpcClient;
  status: McpServerStatus;
  tools: McpTool[];
}

export class McpManager {
  private servers = new Map<string, McpServerInstance>();

  async startServer(config: McpServerConfig): Promise<void> {
    if (this.servers.has(config.name)) {
      logger.warn(`MCP server "${config.name}" already running`);
      return;
    }

    logger.info(
      `Starting MCP server: ${config.name} (${config.command} ${config.args.join(" ")})`,
    );

    const proc = spawn(config.command, config.args, {
      stdio: ["pipe", "pipe", "pipe"],
      env: { ...process.env, ...config.env },
      cwd: config.cwd,
    });

    const client = new McpJsonRpcClient(proc);
    const instance: McpServerInstance = {
      name: config.name,
      config,
      process: proc,
      client,
      status: "starting",
      tools: [],
    };

    this.servers.set(config.name, instance);

    try {
      await client.request("initialize", {
        protocolVersion: "2024-11-05",
        capabilities: {},
        clientInfo: { name: "anyon", version: "1.0.0" },
      });

      client.notify("notifications/initialized");
      instance.status = "running";

      try {
        const result = (await client.request("tools/list")) as {
          tools?: McpTool[];
        };
        instance.tools = result.tools ?? [];
        logger.info(
          `MCP server "${config.name}" ready with ${instance.tools.length} tools`,
        );
      } catch {
        logger.warn(`Failed to list tools for "${config.name}"`);
      }
    } catch (err) {
      instance.status = "error";
      logger.error(`Failed to initialize MCP server "${config.name}":`, err);
      this.killProcess(proc);
      this.servers.delete(config.name);
      throw err;
    }

    proc.on("exit", (code) => {
      logger.info(`MCP server "${config.name}" exited with code ${code}`);
      instance.status = "stopped";
      this.servers.delete(config.name);
    });
  }

  async stopServer(name: string): Promise<void> {
    const instance = this.servers.get(name);
    if (!instance) {
      return;
    }

    try {
      instance.client.destroy();
      this.killProcess(instance.process);
    } catch (err) {
      logger.warn(`Error stopping MCP server "${name}":`, err);
    }

    this.servers.delete(name);
  }

  async stopAll(): Promise<void> {
    const names = [...this.servers.keys()];
    await Promise.all(names.map(async (name) => this.stopServer(name)));
  }

  async listTools(serverName: string): Promise<McpTool[]> {
    const instance = this.servers.get(serverName);
    if (!instance) {
      throw new Error(`MCP server "${serverName}" not found`);
    }

    return instance.tools;
  }

  async callTool(
    serverName: string,
    toolName: string,
    args: unknown,
  ): Promise<unknown> {
    const instance = this.servers.get(serverName);
    if (!instance) {
      throw new Error(`MCP server "${serverName}" not found`);
    }

    if (instance.status !== "running") {
      throw new Error(`MCP server "${serverName}" is ${instance.status}`);
    }

    return instance.client.request("tools/call", {
      name: toolName,
      arguments: args,
    });
  }

  async listResources(serverName: string): Promise<McpResource[]> {
    const instance = this.servers.get(serverName);
    if (!instance) {
      throw new Error(`MCP server "${serverName}" not found`);
    }

    const result = (await instance.client.request("resources/list")) as {
      resources?: McpResource[];
    };
    return result.resources ?? [];
  }

  async readResource(serverName: string, uri: string): Promise<unknown> {
    const instance = this.servers.get(serverName);
    if (!instance) {
      throw new Error(`MCP server "${serverName}" not found`);
    }

    return instance.client.request("resources/read", { uri });
  }

  async getPrompt(
    serverName: string,
    promptName: string,
    args?: unknown,
  ): Promise<string> {
    const instance = this.servers.get(serverName);
    if (!instance) {
      throw new Error(`MCP server "${serverName}" not found`);
    }

    const result = (await instance.client.request("prompts/get", {
      name: promptName,
      arguments: args,
    })) as {
      messages?: Array<{
        content?: {
          text?: string;
        };
      }>;
    };

    return (
      result.messages
        ?.map((message) => message.content?.text ?? "")
        .join("\n") ?? ""
    );
  }

  isServerRunning(name: string): boolean {
    const instance = this.servers.get(name);
    return instance?.status === "running";
  }

  getServerDescriptors(): McpServerDescriptor[] {
    return [...this.servers.values()].map((server) => ({
      name: server.name,
      status: server.status,
      tools: server.tools.map((tool) => tool.name),
    }));
  }

  private killProcess(proc: ChildProcess): void {
    try {
      if (proc.pid) {
        proc.kill("SIGTERM");
        setTimeout(() => {
          try {
            proc.kill("SIGKILL");
          } catch {
            return;
          }
        }, 5000);
      }
    } catch {
      return;
    }
  }
}
