import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { app } from "electron";
import log from "electron-log";

const logger = log.scope("vendor-binary");
const preparedBinaryPaths = new Set<string>();

function hasWriteAccess(binaryPath: string): boolean {
  try {
    fs.accessSync(binaryPath, fs.constants.W_OK);
    return true;
  } catch {
    return false;
  }
}

function removeXattrIfPresent(binaryPath: string, attribute: string): void {
  try {
    execFileSync("xattr", ["-d", attribute, binaryPath], {
      stdio: "ignore",
    });
    logger.info(`Removed ${attribute} from bundled OpenCode binary`);
  } catch {
  }
}

export function prepareBundledOpenCodeBinaryForLaunch(
  binaryPath: string,
  options: { force?: boolean } = {},
): boolean {
  if (process.platform !== "darwin") {
    return false;
  }

  if (preparedBinaryPaths.has(binaryPath) && !options.force) {
    return false;
  }

  if (!fs.existsSync(binaryPath)) {
    return false;
  }

  if (!hasWriteAccess(binaryPath)) {
    logger.warn(
      `Bundled OpenCode binary is not writable for macOS launch preparation: ${binaryPath}`,
    );
    return false;
  }

  removeXattrIfPresent(binaryPath, "com.apple.quarantine");
  removeXattrIfPresent(binaryPath, "com.apple.provenance");

  execFileSync("codesign", ["--force", "--sign", "-", binaryPath], {
    stdio: "pipe",
  });

  preparedBinaryPaths.add(binaryPath);
  logger.info(`Prepared bundled OpenCode binary for macOS launch: ${binaryPath}`);
  return true;
}

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

  if (process.platform === "darwin") {
    try {
      prepareBundledOpenCodeBinaryForLaunch(binaryPath);
    } catch (error) {
      logger.warn(
        `Failed to prepare bundled OpenCode binary for launch: ${binaryPath}`,
        error,
      );
    }
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

}
