import { execSync } from "child_process";
import {
  createWriteStream,
  existsSync,
  mkdirSync,
  readdirSync,
  rmSync,
} from "fs";
import { platform } from "os";
import { basename, join } from "path";
import { net, type IpcMainInvokeEvent, ipcMain } from "electron";
import log from "electron-log";
import { writeSettings } from "../../main/settings";
import {
  getNodeDownloadUrl,
  getNodeInstallDir,
  isNodeVersionSufficient,
} from "./node_handlers";

const logger = log.scope("node_install_handlers");

const NODE_INSTALL_CHANNEL = "node:install";
const NODE_INSTALL_PROGRESS_CHANNEL = "node:install:progress";
const NODE_INSTALL_END_CHANNEL = "node:install:end";
const NODE_INSTALL_ERROR_CHANNEL = "node:install:error";

type InstallStage =
  | "downloading"
  | "extracting"
  | "verifying"
  | "installing-pnpm"
  | "unknown";

function getExpectedExtractedDirName(archiveFilename: string): string {
  return archiveFilename.replace(/\.tar\.gz$|\.zip$/i, "");
}

function escapePowershellPath(input: string): string {
  return input.replace(/'/g, "''");
}

export function registerNodeInstallHandlers() {
  ipcMain.handle(
    NODE_INSTALL_CHANNEL,
    async (event: IpcMainInvokeEvent, params: { requestId: string }) => {
      const { requestId } = params;

      const sendProgress = (data: Record<string, unknown>) => {
        event.sender.send(NODE_INSTALL_PROGRESS_CHANNEL, data);
      };
      const sendEnd = (data: Record<string, unknown>) => {
        event.sender.send(NODE_INSTALL_END_CHANNEL, data);
      };
      const sendError = (data: Record<string, unknown>) => {
        event.sender.send(NODE_INSTALL_ERROR_CHANNEL, data);
      };

      let currentStage: InstallStage = "unknown";

      try {
        currentStage = "downloading";
        const downloadUrl = getNodeDownloadUrl();
        const installDir = getNodeInstallDir();
        mkdirSync(installDir, { recursive: true });

        const archiveFilename = basename(downloadUrl);
        const archivePath = join(installDir, archiveFilename);

        logger.info("Starting Node.js download", {
          requestId,
          downloadUrl,
          archivePath,
        });

        const response = await net.fetch(downloadUrl);
        if (!response.ok) {
          throw new Error(`Download failed with status ${response.status}`);
        }
        if (!response.body) {
          throw new Error("Download response body is empty");
        }

        const contentLength = Number(
          response.headers.get("content-length") || 0,
        );
        const fileStream = createWriteStream(archivePath);
        const reader = response.body.getReader();

        let downloaded = 0;
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            if (!value) continue;

            const canContinue = fileStream.write(value);
            downloaded += value.byteLength;

            sendProgress({
              requestId,
              stage: "downloading",
              percent:
                contentLength > 0
                  ? Math.round((downloaded / contentLength) * 100)
                  : null,
              bytesDownloaded: downloaded,
              bytesTotal: contentLength || null,
              message: "Downloading Node.js...",
            });

            if (!canContinue) {
              await new Promise<void>((resolve) => {
                fileStream.once("drain", resolve);
              });
            }
          }
        } catch (error) {
          fileStream.destroy();
          throw error;
        }

        fileStream.end();
        await new Promise<void>((resolve, reject) => {
          fileStream.once("finish", resolve);
          fileStream.once("error", reject);
        });

        currentStage = "extracting";
        sendProgress({
          requestId,
          stage: "extracting",
          percent: null,
          message: "Extracting Node.js archive...",
        });

        const expectedExtractedDirName =
          getExpectedExtractedDirName(archiveFilename);
        const expectedExtractedPath = join(
          installDir,
          expectedExtractedDirName,
        );
        if (existsSync(expectedExtractedPath)) {
          rmSync(expectedExtractedPath, { recursive: true, force: true });
        }

        if (platform() === "win32") {
          const escapedArchivePath = escapePowershellPath(archivePath);
          const escapedInstallDir = escapePowershellPath(installDir);
          execSync(
            `powershell -NoProfile -Command "Expand-Archive -Path '${escapedArchivePath}' -DestinationPath '${escapedInstallDir}' -Force"`,
            { timeout: 120000 },
          );
        } else {
          execSync(`tar -xzf "${archivePath}" -C "${installDir}"`, {
            timeout: 120000,
          });
        }

        const entries = readdirSync(installDir, { withFileTypes: true });
        const extractedDirName = entries.find(
          (entry) =>
            entry.isDirectory() &&
            (entry.name === expectedExtractedDirName ||
              entry.name.startsWith("node-")),
        )?.name;

        if (!extractedDirName) {
          throw new Error("Extraction failed: node directory not found");
        }

        const extractedPath = join(installDir, extractedDirName);
        rmSync(archivePath, { force: true });

        currentStage = "verifying";
        sendProgress({
          requestId,
          stage: "verifying",
          percent: null,
          message: "Verifying Node.js installation...",
        });

        const isWindows = platform() === "win32";
        const nodeBinary = isWindows ? "node.exe" : "node";
        const nodeBinPath = isWindows
          ? extractedPath
          : join(extractedPath, "bin");
        const nodeExePath = join(nodeBinPath, nodeBinary);

        if (!existsSync(nodeExePath)) {
          throw new Error(`Node.js binary not found at ${nodeExePath}`);
        }

        const nodeVersion = execSync(`"${nodeExePath}" --version`, {
          encoding: "utf8",
          timeout: 30000,
        }).trim();

        if (!isNodeVersionSufficient(nodeVersion)) {
          throw new Error(
            `Installed Node.js version ${nodeVersion} does not meet minimum requirements`,
          );
        }

        writeSettings({ customNodePath: nodeBinPath });

        const separator = isWindows ? ";" : ":";
        process.env.PATH = `${nodeBinPath}${separator}${process.env.PATH || ""}`;

        currentStage = "installing-pnpm";
        sendProgress({
          requestId,
          stage: "installing-pnpm",
          percent: null,
          message: "Installing pnpm...",
        });

        const npmBinary = isWindows ? "npm.cmd" : "npm";
        const npmPath = join(nodeBinPath, npmBinary);
        const commandEnv = {
          ...process.env,
          PATH: `${nodeBinPath}${separator}${process.env.PATH || ""}`,
        };

        let pnpmVersion: string;
        try {
          execSync(`"${npmPath}" exec -- corepack enable pnpm`, {
            encoding: "utf8",
            timeout: 60000,
            env: commandEnv,
          });
          pnpmVersion = execSync("pnpm --version", {
            encoding: "utf8",
            timeout: 30000,
            env: commandEnv,
          }).trim();
        } catch {
          execSync(`"${npmPath}" install -g pnpm@latest-10`, {
            encoding: "utf8",
            timeout: 120000,
            env: commandEnv,
          });
          pnpmVersion = execSync("pnpm --version", {
            encoding: "utf8",
            timeout: 30000,
            env: commandEnv,
          }).trim();
        }

        logger.info("Node.js and pnpm installation completed", {
          requestId,
          nodeVersion,
          pnpmVersion,
          nodeBinPath,
        });

        sendEnd({
          requestId,
          nodeVersion,
          pnpmVersion,
          installedPath: nodeBinPath,
        });
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        logger.error("Node.js installation failed", {
          requestId,
          stage: currentStage,
          error: message,
        });
        sendError({ requestId, error: message, stage: currentStage });
      }
    },
  );
}
