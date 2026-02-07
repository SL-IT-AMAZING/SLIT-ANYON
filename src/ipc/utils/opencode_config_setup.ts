import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import log from "electron-log";
import { getOmocBinaryPath } from "./vendor_binary_utils";

const logger = log.scope("opencode-config-setup");

function getOpenCodeConfigDir(): string {
  if (os.platform() === "win32") {
    return path.join(
      process.env.APPDATA || path.join(os.homedir(), "AppData", "Roaming"),
      "opencode",
    );
  }
  return path.join(
    process.env.XDG_CONFIG_HOME || path.join(os.homedir(), ".config"),
    "opencode",
  );
}

function isOmocConfigured(): boolean {
  const omocConfigPath = path.join(
    getOpenCodeConfigDir(),
    "oh-my-opencode.json",
  );
  return fs.existsSync(omocConfigPath);
}

const OMOC_INSTALL_TIMEOUT_MS = 30_000;

function runOmocInstall(omocBinaryPath: string): Promise<void> {
  return new Promise((resolve) => {
    logger.info(
      `Running OMOC install: ${omocBinaryPath} install --no-tui --claude=yes`,
    );

    const child = spawn(
      omocBinaryPath,
      ["install", "--no-tui", "--claude=yes"],
      {
        stdio: ["ignore", "pipe", "pipe"],
        env: { ...process.env },
        detached: false,
      },
    );

    let stderr = "";
    let settled = false;

    const finish = (success: boolean, reason: string) => {
      if (settled) return;
      settled = true;
      if (success) {
        logger.info(`OMOC install completed: ${reason}`);
      } else {
        logger.warn(`OMOC install did not complete: ${reason}`);
      }
      resolve();
    };

    const timer = setTimeout(() => {
      try {
        child.kill("SIGTERM");
      } catch {
        void 0;
      }
      finish(false, `timed out after ${OMOC_INSTALL_TIMEOUT_MS}ms`);
    }, OMOC_INSTALL_TIMEOUT_MS);

    child.stdout?.on("data", (data: Buffer) => {
      logger.debug(`[omoc-install stdout] ${data.toString().trim()}`);
    });

    child.stderr?.on("data", (data: Buffer) => {
      stderr += data.toString();
      logger.debug(`[omoc-install stderr] ${data.toString().trim()}`);
    });

    child.on("error", (err) => {
      clearTimeout(timer);
      finish(false, `spawn error: ${err.message}`);
    });

    child.on("exit", (code) => {
      clearTimeout(timer);
      if (code === 0) {
        finish(true, "exit code 0");
      } else {
        finish(false, `exit code ${code}${stderr ? `: ${stderr.trim()}` : ""}`);
      }
    });
  });
}

/**
 * Idempotent OpenCode config setup. Ensures config directory exists and runs
 * OMOC install if not yet configured. Non-blocking with 30s timeout.
 */
export async function setupOpenCodeConfig(): Promise<void> {
  try {
    const configDir = getOpenCodeConfigDir();
    if (!fs.existsSync(configDir)) {
      fs.mkdirSync(configDir, { recursive: true });
      logger.info(`Created OpenCode config directory: ${configDir}`);
    }

    if (isOmocConfigured()) {
      logger.debug("OMOC already configured, skipping install");
      return;
    }

    const omocPath = getOmocBinaryPath();
    if (!omocPath) {
      logger.info(
        "OMOC binary not available, skipping config setup. OpenCode will still work without OMOC customizations.",
      );
      return;
    }

    await runOmocInstall(omocPath);
  } catch (err) {
    logger.error("Error during OpenCode config setup:", err);
  }
}
