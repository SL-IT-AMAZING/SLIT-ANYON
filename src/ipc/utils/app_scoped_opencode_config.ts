import fs from "node:fs";
import path from "node:path";
import { app } from "electron";
import log from "electron-log";

const logger = log.scope("app-scoped-opencode-config");
const ANYON_PLUGIN_ENTRY = "@anyon-cli/anyon@latest";

function getDefaultOpenCodeConfigDir(homeDir: string) {
  return path.join(homeDir, ".config", "opencode");
}

function readUserAnyonConfig(homeDir: string): string | null {
  const configDir = getDefaultOpenCodeConfigDir(homeDir);
  const candidates = [
    path.join(configDir, "anyon.jsonc"),
    path.join(configDir, "anyon.json"),
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return fs.readFileSync(candidate, "utf-8");
    }
  }

  return null;
}

export function writeAppScopedOpenCodeConfig(paths: {
  userDataDir: string;
  homeDir: string;
}): string {
  const configDir = path.join(paths.userDataDir, "opencode-app");
  fs.mkdirSync(configDir, { recursive: true });

  const opencodeConfigPath = path.join(configDir, "opencode.json");
  fs.writeFileSync(
    opencodeConfigPath,
    `${JSON.stringify({ plugin: [ANYON_PLUGIN_ENTRY] }, null, 2)}\n`,
    "utf-8",
  );

  const anyonConfigPath = path.join(configDir, "anyon.jsonc");
  const userConfig = readUserAnyonConfig(paths.homeDir);
  if (userConfig) {
    fs.writeFileSync(anyonConfigPath, userConfig, "utf-8");
  } else if (!fs.existsSync(anyonConfigPath)) {
    fs.writeFileSync(anyonConfigPath, "{}\n", "utf-8");
  }

  logger.info(`Prepared app-scoped OpenCode config dir: ${configDir}`);
  return configDir;
}

export function ensureAppScopedOpenCodeConfig(): string {
  return writeAppScopedOpenCodeConfig({
    userDataDir: app.getPath("userData"),
    homeDir: process.env.HOME || app.getPath("home"),
  });
}
