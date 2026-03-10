import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import log from "electron-log";

const logger = log.scope("opencode-config-setup");
const ANYON_PLUGIN_PACKAGE = "@anyon-cli/anyon";

type OpenCodeConfig = {
  plugin?: string[];
  [key: string]: unknown;
};

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

function getOpenCodeConfigPaths() {
  const configDir = getOpenCodeConfigDir();
  return {
    configDir,
    opencodeJson: path.join(configDir, "opencode.json"),
    opencodeJsonc: path.join(configDir, "opencode.jsonc"),
    anyonConfig: path.join(configDir, "anyon.jsonc"),
  };
}

function detectConfigFormat(): { format: "json" | "jsonc" | "none"; path: string } {
  const { opencodeJson, opencodeJsonc } = getOpenCodeConfigPaths();
  if (fs.existsSync(opencodeJsonc)) return { format: "jsonc", path: opencodeJsonc };
  if (fs.existsSync(opencodeJson)) return { format: "json", path: opencodeJson };
  return { format: "none", path: opencodeJson };
}

function stripJsonComments(content: string): string {
  return content
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/(^|[^:])\/\/.*$/gm, "$1")
    .replace(/,\s*([}\]])/g, "$1");
}

function parseConfig(content: string): OpenCodeConfig {
  try {
    return JSON.parse(stripJsonComments(content)) as OpenCodeConfig;
  } catch {
    return {};
  }
}

function removeAnyonPluginEntries(plugins: string[]): string[] {
  return plugins.filter(
    (entry) =>
      !entry.startsWith(`${ANYON_PLUGIN_PACKAGE}@`) &&
      entry !== ANYON_PLUGIN_PACKAGE,
  );
}

function ensureDefaultConfigDoesNotActivateAnyon(): void {
  const { format, path: configPath } = detectConfigFormat();

  if (format === "none") {
    logger.info(
      `No default OpenCode config found; leaving plugin registration untouched: ${configPath}`,
    );
    return;
  }

  const raw = fs.readFileSync(configPath, "utf-8");
  const parsed = parseConfig(raw);
  const plugins = removeAnyonPluginEntries(parsed.plugin ?? []);
  parsed.plugin = plugins;

  if (format === "jsonc") {
    const pluginArrayRegex = /"plugin"\s*:\s*\[([\s\S]*?)\]/;
    if (pluginArrayRegex.test(raw)) {
      const formattedPlugins = plugins.map((entry) => `"${entry}"`).join(",\n    ");
      const nextContent = raw.replace(
        pluginArrayRegex,
        `"plugin": [\n    ${formattedPlugins}\n  ]`,
      );
      fs.writeFileSync(configPath, nextContent, "utf-8");
    } else {
      const nextContent = raw.replace(
        /(\{)/,
        `$1\n  "plugin": [],`,
      );
      fs.writeFileSync(configPath, nextContent, "utf-8");
    }
  } else {
    fs.writeFileSync(configPath, `${JSON.stringify(parsed, null, 2)}\n`, "utf-8");
  }

  logger.info(
    `Ensured default OpenCode config does not activate Anyon: ${configPath}`,
  );
}

export function updateAnyonConfig(preset: {
  agents: Record<string, { model: string; variant?: string }>;
  categories: Record<string, { model: string; variant?: string }>;
}): void {
  const { anyonConfig } = getOpenCodeConfigPaths();

  let existing: Record<string, unknown> = {};
  try {
    if (fs.existsSync(anyonConfig)) {
      existing = parseConfig(fs.readFileSync(anyonConfig, "utf-8"));
    }
  } catch (err) {
    logger.warn("Failed to read existing Anyon config, starting fresh:", err);
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

  fs.writeFileSync(anyonConfig, `${JSON.stringify(merged, null, 2)}\n`, "utf-8");
  logger.info("Updated Anyon config with model preset");
}

export async function setupOpenCodeConfig(): Promise<void> {
  try {
    const { configDir } = getOpenCodeConfigPaths();
    if (!fs.existsSync(configDir)) {
      fs.mkdirSync(configDir, { recursive: true });
      logger.info(`Created OpenCode config directory: ${configDir}`);
    }

    ensureDefaultConfigDoesNotActivateAnyon();

    try {
      updateAnyonConfig({
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
      logger.warn("Failed to apply default Anyon model preset:", presetErr);
    }
  } catch (err) {
    logger.error("Error during OpenCode config setup:", err);
  }
}
