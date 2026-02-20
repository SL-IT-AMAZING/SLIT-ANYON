import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { app } from "electron";
import log from "electron-log";

const logger = log.scope("vendor-binary");

export function getOpenCodeBinaryPath(): string | null {
  const execName = os.platform() === "win32" ? "opencode.exe" : "opencode";

  const binaryPath = !app.isPackaged
    ? path.join(app.getAppPath(), "vendor", "opencode", "bin", execName)
    : path.join(process.resourcesPath, "opencode", "bin", execName);

  if (!fs.existsSync(binaryPath)) {
    logger.warn(
      `Bundled OpenCode binary not found at: ${binaryPath}. Run \`npm run fetch-vendor\` to download vendor binaries.`,
    );
    return null;
  }

  try {
    fs.accessSync(binaryPath, fs.constants.X_OK);
  } catch {
    logger.warn(
      `Bundled OpenCode binary is not executable: ${binaryPath}. Check file permissions.`,
    );
    return null;
  }

  return binaryPath;
}

export function getOmocBinaryPath(): string | null {
  const execName =
    os.platform() === "win32" ? "oh-my-opencode.exe" : "oh-my-opencode";

  const binaryPath = !app.isPackaged
    ? path.join(app.getAppPath(), "vendor", "oh-my-opencode", "bin", execName)
    : path.join(process.resourcesPath, "oh-my-opencode", "bin", execName);

  if (!fs.existsSync(binaryPath)) {
    logger.warn(
      `Bundled Oh-My-OpenCode binary not found at: ${binaryPath}. Run \`npm run fetch-vendor\` to download vendor binaries.`,
    );
    return null;
  }

  try {
    fs.accessSync(binaryPath, fs.constants.X_OK);
  } catch {
    logger.warn(
      `Bundled Oh-My-OpenCode binary is not executable: ${binaryPath}. Check file permissions.`,
    );
    return null;
  }

  return binaryPath;
}

export function resolveVendorBinaries(): void {
  const opencodePath = getOpenCodeBinaryPath();
  if (opencodePath) {
    if (!process.env.OPENCODE_PATH) {
      process.env.OPENCODE_PATH = opencodePath;
      logger.info(`Using bundled OpenCode binary: ${opencodePath}`);
    } else {
      logger.info(
        `OPENCODE_PATH already set to: ${process.env.OPENCODE_PATH} (not using bundled binary)`,
      );
    }
  } else {
    if (app.isPackaged) {
      logger.error(
        "No bundled OpenCode binary found in packaged app. OpenCode startup will fail until vendor binaries are restored.",
      );
    } else {
      logger.warn(
        "No bundled OpenCode binary found in development. Falling back to system PATH ('opencode'). Run `npm run fetch-vendor` to use bundled binaries.",
      );
    }
  }

  const omocPath = getOmocBinaryPath();
  if (omocPath) {
    logger.info(`Bundled Oh-My-OpenCode binary found: ${omocPath}`);
  }
}
