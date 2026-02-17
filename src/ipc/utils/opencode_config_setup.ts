import { spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import log from "electron-log";
import { getOmocBinaryPath } from "./vendor_binary_utils";

const logger = log.scope("opencode-config-setup");

export function getOpenCodeConfigDir(): string {
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
 * Deep-merges a model preset (agents + categories) into the existing
 * oh-my-opencode.json config. Preserves all other settings (MCPs, hooks, etc).
 */
export function updateOmocConfig(preset: {
  agents: Record<string, { model: string; variant?: string }>;
  categories: Record<string, { model: string; variant?: string }>;
}): void {
  const configPath = path.join(getOpenCodeConfigDir(), "oh-my-opencode.json");

  let existing: Record<string, unknown> = {};
  try {
    if (fs.existsSync(configPath)) {
      existing = JSON.parse(fs.readFileSync(configPath, "utf-8")) as Record<
        string,
        unknown
      >;
    }
  } catch (err) {
    logger.warn("Failed to read existing OMOC config, starting fresh:", err);
  }

  const merged = {
    ...existing,
    agents: {
      ...(existing.agents as Record<string, unknown> | undefined),
      ...preset.agents,
    },
    categories: {
      ...(existing.categories as Record<string, unknown> | undefined),
      ...preset.categories,
    },
  };

  fs.writeFileSync(configPath, JSON.stringify(merged, null, 2), "utf-8");
  logger.info("Updated OMOC config with model preset");
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

    // Apply Light preset as default for fresh installs.
    // This ensures non-paying users get the standard model configuration.
    try {
      updateOmocConfig({
        agents: {
          Sisyphus: { model: "anthropic/claude-sonnet-4-5" },
          oracle: { model: "openai/gpt-5.2", variant: "high" },
          explore: { model: "opencode/grok-code-fast-1" },
          librarian: { model: "opencode/glm-4.7" },
          "multimodal-looker": { model: "google/gemini-3-pro-preview" },
          "Prometheus (Planner)": { model: "anthropic/claude-sonnet-4-5" },
          "Metis (Plan Consultant)": { model: "anthropic/claude-sonnet-4-5" },
          "Momus (Plan Reviewer)": {
            model: "openai/gpt-5.2",
            variant: "medium",
          },
          Atlas: { model: "anthropic/claude-sonnet-4-5" },
        },
        categories: {
          "visual-engineering": { model: "google/gemini-3-pro-preview" },
          ultrabrain: { model: "openai/gpt-5.2-codex" },
          artistry: { model: "google/gemini-3-pro-preview", variant: "max" },
          quick: { model: "anthropic/claude-haiku-4-5" },
          "unspecified-low": { model: "anthropic/claude-sonnet-4-5" },
          "unspecified-high": { model: "anthropic/claude-sonnet-4-5" },
          writing: { model: "google/gemini-3-flash-preview" },
        },
      });
    } catch (presetErr) {
      logger.warn(
        "Failed to apply default model preset after install:",
        presetErr,
      );
    }
  } catch (err) {
    logger.error("Error during OpenCode config setup:", err);
  }
}
