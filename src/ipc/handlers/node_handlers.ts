import { dialog, ipcMain, app } from "electron";
import { execSync } from "child_process";
import { platform, arch } from "os";
import fixPath from "fix-path";
import { runShellCommand } from "../utils/runShellCommand";
import log from "electron-log";
import { existsSync } from "fs";
import { join } from "path";
import { readSettings } from "../../main/settings";
import { createTypedHandler } from "./base";
import { systemContracts } from "../types/system";

const logger = log.scope("node_handlers");

// Test-only: Mock state for Node.js installation status
// null = use real check, true = mock as installed, false = mock as not installed
let mockNodeInstalled: boolean | null = null;

const NODE_VERSION = "v22.14.0";
const NODE_MIN_MAJOR = 18;

export function getNodeDownloadUrl(): string {
  const base = `https://nodejs.org/dist/${NODE_VERSION}`;
  const p = platform();
  const a = arch();

  if (p === "win32") {
    const winArch = a === "arm64" || a === "arm" ? "arm64" : "x64";
    return `${base}/node-${NODE_VERSION}-win-${winArch}.zip`;
  }
  if (p === "darwin") {
    const macArch = a === "arm64" ? "arm64" : "x64";
    return `${base}/node-${NODE_VERSION}-darwin-${macArch}.tar.gz`;
  }
  // Linux
  const linuxArch = a === "arm64" ? "arm64" : "x64";
  return `${base}/node-${NODE_VERSION}-linux-${linuxArch}.tar.gz`;
}

export function getNodeInstallDir(): string {
  return join(app.getPath("userData"), "nodejs");
}

export function isNodeVersionSufficient(version: string | null): boolean {
  if (!version) return false;
  // version looks like "v22.14.0" or "22.14.0"
  const match = version.match(/(\d+)\./);
  if (!match) return false;
  return parseInt(match[1], 10) >= NODE_MIN_MAJOR;
}

export function registerNodeHandlers() {
  // Test-only handler to control Node.js mock state
  // Guarded by E2E_TEST_BUILD environment variable
  if (process.env.E2E_TEST_BUILD === "true") {
    ipcMain.handle(
      "test:set-node-mock",
      async (_, { installed }: { installed: boolean | null }) => {
        logger.log("test:set-node-mock called with installed:", installed);
        mockNodeInstalled = installed;
      },
    );
  }

  createTypedHandler(systemContracts.getNodejsStatus, async () => {
    logger.log(
      "handling ipc: nodejs-status for platform:",
      platform(),
      "and arch:",
      arch(),
    );

    const nodeDownloadUrl = getNodeDownloadUrl();

    // Test-only: Return mock state if set
    if (process.env.E2E_TEST_BUILD === "true" && mockNodeInstalled !== null) {
      logger.log("Using mock Node.js status:", mockNodeInstalled);
      if (mockNodeInstalled) {
        return {
          nodeVersion: "v22.14.0",
          pnpmVersion: "9.0.0",
          nodeDownloadUrl,
          isVersionSufficient: true,
        };
      }
      return {
        nodeVersion: null,
        pnpmVersion: null,
        nodeDownloadUrl,
        isVersionSufficient: false,
      };
    }

    // Run checks in parallel
    const [nodeVersion, pnpmVersion] = await Promise.all([
      runShellCommand("node --version"),
      // First, check if pnpm is installed.
      // If not, try to install it using corepack.
      // If both fail, then pnpm is not available.
      runShellCommand(
        "pnpm --version || (corepack enable pnpm && pnpm --version) || (npm install -g pnpm@latest-10 && pnpm --version)",
      ),
    ]);
    return {
      nodeVersion,
      pnpmVersion,
      nodeDownloadUrl,
      isVersionSufficient: isNodeVersionSufficient(nodeVersion),
    };
  });

  createTypedHandler(systemContracts.reloadEnvPath, async () => {
    logger.debug("Reloading env path, previously:", process.env.PATH);
    if (platform() === "win32") {
      const newPath = execSync("cmd /c echo %PATH%", {
        encoding: "utf8",
      }).trim();
      process.env.PATH = newPath;
    } else {
      fixPath();
    }
    const settings = readSettings();
    if (settings.customNodePath) {
      const separator = platform() === "win32" ? ";" : ":";
      process.env.PATH = `${settings.customNodePath}${separator}${process.env.PATH}`;
      logger.debug(
        "Added custom Node.js path to PATH:",
        settings.customNodePath,
      );
    }
    logger.debug("Reloaded env path, now:", process.env.PATH);
  });

  createTypedHandler(systemContracts.selectNodeFolder, async () => {
    const result = await dialog.showOpenDialog({
      title: "Select Node.js Installation Folder",
      properties: ["openDirectory"],
      message: "Select the folder where Node.js is installed",
    });

    if (result.canceled) {
      return { path: null, canceled: true, selectedPath: null };
    }

    if (!result.filePaths[0]) {
      return { path: null, canceled: false, selectedPath: null };
    }

    const selectedPath = result.filePaths[0];

    // Verify Node.js exists in selected path
    const nodeBinary = platform() === "win32" ? "node.exe" : "node";
    const nodePath = join(selectedPath, nodeBinary);

    if (!existsSync(nodePath)) {
      // Check bin subdirectory (common on Unix systems)
      const binPath = join(selectedPath, "bin", nodeBinary);
      if (existsSync(binPath)) {
        return {
          path: join(selectedPath, "bin"),
          canceled: false,
          selectedPath,
        };
      }
      return { path: null, canceled: false, selectedPath };
    }
    return { path: selectedPath, canceled: false, selectedPath };
  });
}
