import { type ChildProcess, execSync, spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { getMcpServerScript } from "@/opencode/mcp/mcp_server_script";
import { toolGateway } from "@/opencode/tool_gateway";
import log from "electron-log";
import { readSettings } from "../../main/settings";
import { getOpenCodeBinaryPath } from "./vendor_binary_utils";

const logger = log.scope("opencode-server");

interface ServerInfo {
  url: string;
  password: string;
  port: number;
  hostname: string;
  pid: number | null;
}

interface StartOptions {
  hostname?: string;
  port?: number;
  password?: string;
  timeout?: number;
  opencodePath?: string;
  cwd?: string;
}

class OpenCodeServerManager {
  private static instance: OpenCodeServerManager | null = null;

  private process: ChildProcess | null = null;
  private url: string | null = null;
  private password: string | null = null;
  private port: number | null = null;
  private hostname: string | null = null;
  private _cwd: string | null = null;
  private _starting = false;
  private _startPromise: Promise<ServerInfo> | null = null;
  private _externalServer = false;
  private _lastStderr = "";

  private constructor() {}

  static getInstance(): OpenCodeServerManager {
    if (!OpenCodeServerManager.instance) {
      OpenCodeServerManager.instance = new OpenCodeServerManager();
    }
    return OpenCodeServerManager.instance;
  }

  async start(options: StartOptions = {}): Promise<ServerInfo> {
    if (this.process && this.isRunning()) {
      logger.debug("Server already running");
      return this.getServerInfo()!;
    }

    if (this._starting && this._startPromise) {
      logger.debug("Start already in progress, waiting...");
      return this._startPromise;
    }

    this._starting = true;
    this._startPromise = this._startWithRetry(options);

    try {
      return await this._startPromise;
    } finally {
      this._starting = false;
      this._startPromise = null;
    }
  }

  private async _startWithRetry(
    options: StartOptions,
    maxRetries = 2,
  ): Promise<ServerInfo> {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await this._doStart(options);
      } catch (err) {
        const isLastAttempt = attempt === maxRetries;
        if (isLastAttempt) {
          logger.error(
            `Server start failed after ${maxRetries} attempts: ${err}`,
          );
          throw err;
        }

        logger.warn(
          `Server start attempt ${attempt}/${maxRetries} failed: ${err}`,
        );
        logger.info("Cleaning up before retry...");

        if (this.process) {
          try {
            this.process.kill("SIGKILL");
          } catch {
            void 0;
          }
          this.process = null;
        }
        this.url = null;
        this._externalServer = false;

        const port =
          options.port ||
          Number.parseInt(process.env.OPENCODE_PORT || "51962", 10);
        await this._killExistingServer(port);
        await this.sleep(2000);

        logger.info(`Retrying server start (attempt ${attempt + 1})...`);
      }
    }

    throw new Error("Server start failed: unexpected code path");
  }

  private async _doStart(options: StartOptions): Promise<ServerInfo> {
    const hostname =
      options.hostname || process.env.OPENCODE_HOSTNAME || "127.0.0.1";
    const port =
      options.port || Number.parseInt(process.env.OPENCODE_PORT || "51962", 10);
    const password =
      options.password ||
      process.env.OPENCODE_PASSWORD ||
      "anyon-opencode-default";
    const timeout = options.timeout || 30000;
    const opencodePath =
      options.opencodePath ||
      process.env.OPENCODE_PATH ||
      getOpenCodeBinaryPath() ||
      "opencode";

    const { port: gatewayPort, token: gatewayToken } =
      await toolGateway.start();

    const existingServer = await this._checkExistingServer(
      hostname,
      port,
      password,
    );
    if (existingServer.exists) {
      logger.info(
        `Found existing OpenCode server on port ${port}, killing to ensure fresh MCP config...`,
      );
      await this._killExistingServer(port);
      logger.info("Waiting for port to be released...");
      await this.sleep(2000);
      logger.info("Done waiting, proceeding to start server...");
    }

    logger.info(`Starting OpenCode server on ${hostname}:${port}...`);

    const args = ["serve", `--hostname=${hostname}`, `--port=${port}`];

    this._cwd = options.cwd || null;

    const settings = readSettings();
    const useProxy = settings.openCodeConnectionMode !== "direct";

    const anyonApiKey = settings.providerSettings?.auto?.apiKey?.value || "";

    const opencodeEnv: Record<string, string> = {};

    const mcpServerPath = this._ensureMcpServerScript();

    const opencodeConfig: Record<string, unknown> = {
      mcp: {
        "anyon-tools": {
          type: "local",
          command: ["node", mcpServerPath],
          enabled: true,
          environment: {
            ANYON_GATEWAY_URL: `http://127.0.0.1:${gatewayPort}`,
            ANYON_GATEWAY_TOKEN: gatewayToken,
          },
        },
      },
    };

    if (useProxy && anyonApiKey) {
      const proxyBase =
        process.env.ANYON_PROXY_URL || "https://engine.any-on.dev/api/v1";
      const anthropicBaseUrl = `${proxyBase}/anthropic`;
      const openaiBaseUrl = `${proxyBase}/openai`;
      const googleBaseUrl = `${proxyBase}/google`;
      const xaiBaseUrl = `${proxyBase}/xai`;

      opencodeConfig["provider"] = {
        anthropic: {
          options: {
            apiKey: anyonApiKey,
            baseURL: anthropicBaseUrl,
          },
        },
        openai: {
          options: {
            apiKey: anyonApiKey,
            baseURL: openaiBaseUrl,
          },
        },
        google: {
          options: {
            apiKey: anyonApiKey,
            baseURL: googleBaseUrl,
          },
        },
        xai: {
          options: {
            apiKey: anyonApiKey,
            baseURL: xaiBaseUrl,
          },
        },
      };

      opencodeEnv.ANTHROPIC_API_KEY = anyonApiKey;
      opencodeEnv.OPENAI_API_KEY = anyonApiKey;
      opencodeEnv.GOOGLE_API_KEY = anyonApiKey;
      opencodeEnv.XAI_API_KEY = anyonApiKey;
      opencodeEnv.ANTHROPIC_BASE_URL = anthropicBaseUrl;
      opencodeEnv.OPENAI_BASE_URL = openaiBaseUrl;
      opencodeEnv.GOOGLE_BASE_URL = googleBaseUrl;
      opencodeEnv.XAI_BASE_URL = xaiBaseUrl;

      opencodeEnv.OPENCODE_DISABLE_DEFAULT_PLUGINS = "true";

      logger.info(
        `Proxy config: anthropic → ${anthropicBaseUrl}, openai → ${openaiBaseUrl}, google → ${googleBaseUrl}, xai → ${xaiBaseUrl}`,
      );
    }

    opencodeEnv.OPENCODE_CONFIG_CONTENT = JSON.stringify(opencodeConfig);

    logger.info(
      `OpenCode connection mode: ${useProxy ? "proxy" : "direct (user subscription)"}`,
    );

    this.process = spawn(opencodePath, args, {
      env: {
        ...process.env,
        OPENCODE_SERVER_USERNAME: "opencode",
        OPENCODE_SERVER_PASSWORD: password,
        ...opencodeEnv,
      },
      stdio: ["ignore", "pipe", "pipe"],
      ...(options.cwd && { cwd: options.cwd }),
    });

    this.process.on("error", (err: NodeJS.ErrnoException) => {
      if (err.code === "ENOENT") {
        logger.error(`ERROR: opencode binary not found at: ${opencodePath}`);
        logger.error(
          "This is likely a build/packaging issue. The binary should be bundled with the app.",
        );
      } else {
        logger.error(`OpenCode server process error: ${err.message}`);
      }
      this.process = null;
    });

    this.process.stdout?.on("data", (data: Buffer) => {
      const line = data.toString().trim();
      if (line) {
        logger.debug(`[stdout] ${line}`);
      }
    });

    this._lastStderr = "";
    this.process.stderr?.on("data", (data: Buffer) => {
      const line = data.toString().trim();
      if (line) {
        logger.warn(`[stderr] ${line}`);
        this._lastStderr = line;
      }
    });

    this.process.on("exit", (code, signal) => {
      logger.info(
        `OpenCode server exited: code=${code}, signal=${signal}, stderr=${this._lastStderr}`,
      );
      this.process = null;
      this.url = null;
    });

    this.url = `http://${hostname}:${port}`;
    this.password = password;
    this.port = port;
    this.hostname = hostname;

    await this.waitForReady(timeout);

    logger.info(`Server ready at ${this.url} (PID: ${this.process?.pid})`);
    return this.getServerInfo()!;
  }

  async waitForReady(timeout: number): Promise<void> {
    const start = Date.now();
    const pollInterval = 100;

    while (Date.now() - start < timeout) {
      try {
        const response = await fetch(`${this.url}/global/health`, {
          headers: this.getAuthHeaders(),
          signal: AbortSignal.timeout(1000),
        });

        if (response.ok) {
          return;
        }
      } catch {
        // Server not ready yet
      }

      if (!this.isRunning() && !this._externalServer) {
        const detail = this._lastStderr ? `: ${this._lastStderr}` : "";
        throw new Error(
          `OpenCode server process terminated unexpectedly${detail}`,
        );
      }

      await this.sleep(pollInterval);
    }

    await this.stop();
    throw new Error(`OpenCode server failed to start within ${timeout}ms`);
  }

  async stop(): Promise<void> {
    try {
      await toolGateway.stop();
    } catch (error) {
      logger.warn("Failed to stop Tool Gateway:", error);
    }

    if (!this.process) return;

    const pid = this.process.pid;
    logger.info(`Stopping server (PID: ${pid})...`);

    this.process.kill("SIGTERM");

    const gracePeriod = 5000;
    const start = Date.now();

    while (this.isRunning() && Date.now() - start < gracePeriod) {
      await this.sleep(100);
    }

    if (this.isRunning()) {
      logger.warn("Server did not stop gracefully, sending SIGKILL");
      this.process.kill("SIGKILL");
    }

    this.process = null;
    this.url = null;
    this.password = null;

    logger.info("Server stopped");
  }

  isRunning(): boolean {
    if (!this.process || !this.process.pid) {
      return false;
    }

    try {
      process.kill(this.process.pid, 0);
      return true;
    } catch {
      return false;
    }
  }

  getServerInfo(): ServerInfo | null {
    if (!this.url) {
      return null;
    }

    return {
      url: this.url,
      password: this.password!,
      port: this.port!,
      hostname: this.hostname!,
      pid: this.process?.pid || null,
    };
  }

  getAuthHeaders(): Record<string, string> {
    const credentials = Buffer.from(`opencode:${this.password}`).toString(
      "base64",
    );
    return {
      Authorization: `Basic ${credentials}`,
    };
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private _mcpScriptPath: string | null = null;

  private _ensureMcpServerScript(): string {
    if (this._mcpScriptPath && fs.existsSync(this._mcpScriptPath)) {
      return this._mcpScriptPath;
    }
    const mcpDir = path.join(os.homedir(), ".anyon", "mcp");
    fs.mkdirSync(mcpDir, { recursive: true });
    const scriptPath = path.join(mcpDir, "anyon_mcp_server.cjs");
    fs.writeFileSync(scriptPath, getMcpServerScript(), "utf-8");
    this._mcpScriptPath = scriptPath;
    return scriptPath;
  }

  private async _killExistingServer(port: number): Promise<void> {
    logger.info(`Attempting to kill process on port ${port}...`);
    const currentPid = process.pid;
    const parentPid = process.ppid;

    try {
      const result = execSync(`lsof -ti:${port}`, {
        encoding: "utf-8",
        timeout: 5000,
      }).trim();
      logger.info(`Found PIDs on port ${port}: ${result}`);
      if (result) {
        const pids = result.split("\n").filter((p) => p.trim());
        for (const pidStr of pids) {
          const pid = Number.parseInt(pidStr.trim(), 10);
          if (Number.isNaN(pid)) {
            logger.warn(`Invalid PID: ${pidStr}`);
            continue;
          }
          // Don't kill our own process or parent
          if (pid === currentPid || pid === parentPid) {
            logger.warn(`Skipping kill of own process: ${pid}`);
            continue;
          }
          try {
            process.kill(pid, "SIGKILL");
            logger.info(`Killed process ${pid} on port ${port}`);
          } catch (killErr) {
            logger.warn(`Failed to kill process ${pid}: ${killErr}`);
          }
        }
      }
    } catch (err) {
      logger.info(`No process found on port ${port} or lsof failed: ${err}`);
    }
  }

  private async _checkExistingServer(
    hostname: string,
    port: number,
    password: string,
  ): Promise<{ exists: boolean; passwordMatch: boolean }> {
    const url = `http://${hostname}:${port}`;
    const credentials = Buffer.from(`opencode:${password}`).toString("base64");

    try {
      const response = await fetch(`${url}/global/health`, {
        headers: { Authorization: `Basic ${credentials}` },
        signal: AbortSignal.timeout(2000),
      });

      if (response.ok) {
        return { exists: true, passwordMatch: true };
      }

      if (response.status === 401) {
        logger.warn("Server exists on port but password mismatch");
        return { exists: true, passwordMatch: false };
      }

      return { exists: false, passwordMatch: false };
    } catch {
      return { exists: false, passwordMatch: false };
    }
  }

  async ensureRunning(options: StartOptions = {}): Promise<ServerInfo> {
    const needsCwdChange =
      options.cwd && (!this._cwd || options.cwd !== this._cwd);
    if (needsCwdChange) {
      if (this._externalServer && this.url) {
        logger.info(
          `CWD change needed: ${this._cwd ?? "(none)"} → ${options.cwd}, killing external server...`,
        );
        const port = this.port ?? 51962;
        await this._killExistingServer(port);
        this._externalServer = false;
        this.process = null;
        this.url = null;
        this.password = null;
        this._cwd = null;
        await this.sleep(1000);
      } else if (this.isRunning()) {
        logger.info(
          `CWD change needed: ${this._cwd ?? "(none)"} → ${options.cwd}, restarting server...`,
        );
        await this.stop();
      }
    }

    if (this.isRunning()) {
      return this.getServerInfo()!;
    }

    if (this._externalServer) {
      logger.info("Clearing stale external server reference, will start fresh");
      this._externalServer = false;
      this.url = null;
      this.password = null;
    }

    return this.start(options);
  }
}

export const openCodeServer = OpenCodeServerManager.getInstance();
