import fs from "fs";
import * as path from "node:path";
import dotenv from "dotenv";
import { BrowserWindow, Menu, app, autoUpdater, dialog } from "electron";
import log from "electron-log";
// @ts-ignore
import started from "electron-squirrel-startup";
import { BackupManager } from "./backup_manager";
import { getDatabasePath, initializeDatabase } from "./db";
import {
  AddMcpServerConfigSchema,
  type AddMcpServerPayload,
  AddPromptDataSchema,
  type AddPromptPayload,
} from "./ipc/deep_link_data";
import { registerIpcHandlers } from "./ipc/ipc_host";
import { gitAddSafeDirectory } from "./ipc/utils/git_utils";
import { setupOpenCodeConfig } from "./ipc/utils/opencode_config_setup";
import { openCodeServer } from "./ipc/utils/opencode_server";
import { IS_TEST_BUILD } from "./ipc/utils/test_utils";
import { resolveVendorBinaries } from "./ipc/utils/vendor_binary_utils";
import { getUserRolloutBucket } from "./lib/rollout";
import type { UserSettings } from "./lib/schemas";
import { initSentryMain } from "./lib/sentry";
import { handleAuthCallback } from "./main/auth";
import { syncEntitlements } from "./main/entitlement";
import {
  registerPreviewProtocol,
  registerPreviewScheme,
} from "./main/preview-protocol";
import { handleAnyonProReturn } from "./main/pro";
import {
  getSettingsFilePath,
  readSettings,
  writeSettings,
} from "./main/settings";
import { getAnyonAppsBaseDirectory } from "./paths/paths";
import { handleSupabaseOAuthReturn } from "./supabase_admin/supabase_return_handler";
import {
  startPerformanceMonitoring,
  stopPerformanceMonitoring,
} from "./utils/performance_monitor";
import { handleVercelOAuthReturn } from "./vercel_admin/vercel_return_handler";

log.errorHandler.startCatching();
log.eventLogger.startLogging();
log.scope.labelPadding = false;

const logger = log.scope("main");

// Load environment variables from .env file
dotenv.config();

initSentryMain();

// Register IPC handlers before app is ready
registerIpcHandlers();

// FIX #D: Must be called BEFORE app.whenReady()
registerPreviewScheme();

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (started) {
  app.quit();
}

// Decide the git directory depending on environment
function resolveLocalGitDirectory() {
  if (!app.isPackaged) {
    // Dev: app.getAppPath() is the project root
    return path.join(app.getAppPath(), "node_modules/dugite/git");
  }

  // Packaged app: git is bundled via extraResource
  return path.join(process.resourcesPath, "git");
}

const gitDir = resolveLocalGitDirectory();
if (fs.existsSync(gitDir)) {
  process.env.LOCAL_GIT_DIRECTORY = gitDir;
}

resolveVendorBinaries();

// https://www.electronjs.org/docs/latest/tutorial/launch-app-from-url-in-another-app#main-process-mainjs
// In dev mode (process.defaultApp), skip protocol registration so the
// installed /Applications/ANYON.app handles anyon:// deep links instead
// of the raw node_modules Electron binary (which shows the default page).
if (!process.defaultApp) {
  app.setAsDefaultProtocolClient("anyon");
}


// ---------------------------------------------------------------------------
// Auto-updater (Squirrel-based, GitHub Releases as static storage)
// ---------------------------------------------------------------------------

const REPO_OWNER = "SL-IT-AMAZING";
const REPO_NAME = "SLIT-ANYON";

function initAutoUpdater() {
  const feedBase = `https://github.com/${REPO_OWNER}/${REPO_NAME}/releases/latest/download`;

  // macOS Squirrel expects a JSON feed; Windows Squirrel expects just the base URL.
  const feedUrl =
    process.platform === "darwin"
      ? `${feedBase}/RELEASES.json`
      : feedBase;

  logger.info("Auto-updater feed URL:", feedUrl);
  autoUpdater.setFeedURL({ url: feedUrl });

  autoUpdater.on("update-available", () => {
    logger.info("Update available");
    mainWindow?.webContents.send("app:update-status", {
      status: "available" as const,
    });
  });

  autoUpdater.on("update-downloaded", (_event, releaseNotes, releaseName) => {
    logger.info("Update downloaded:", releaseName);
    mainWindow?.webContents.send("app:update-status", {
      status: "downloaded" as const,
      version: releaseName ?? undefined,
    });
  });

  autoUpdater.on("error", (err) => {
    logger.error("Auto-updater error:", err);
    mainWindow?.webContents.send("app:update-status", {
      status: "error" as const,
      error: err.message,
    });
  });

  // Check for updates after a short delay so the window is fully loaded.
  setTimeout(() => {
    autoUpdater.checkForUpdates();
  }, 10_000);
}

export async function onReady() {
  try {
    const backupManager = new BackupManager({
      settingsFile: getSettingsFilePath(),
      dbFile: getDatabasePath(),
    });
    await backupManager.initialize();
  } catch (e) {
    logger.error("Error initializing backup manager", e);
  }
  initializeDatabase();

  const settings = readSettings();

  // Add anyon-apps directory to git safe.directory (required for Windows).
  // The trailing /* allows access to all repositories under the named directory.
  // See: https://git-scm.com/docs/git-config#Documentation/git-config.txt-safedirectory
  if (settings.enableNativeGit) {
    // Don't need to await because this only needs to run before
    // the user starts interacting with Anyon app and uses a git-related feature.
    gitAddSafeDirectory(`${getAnyonAppsBaseDirectory()}/*`);
  }

  // Check if app was force-closed
  if (settings.isRunning) {
    logger.warn("App was force-closed on previous run");

    // Store performance data to send after window is created
    if (settings.lastKnownPerformance) {
      logger.warn("Last known performance:", settings.lastKnownPerformance);
      pendingForceCloseData = settings.lastKnownPerformance;
    }
  }

  // Set isRunning to true at startup
  writeSettings({ isRunning: true });

  // Start performance monitoring
  startPerformanceMonitoring();

  await onFirstRunMaybe(settings);
  registerPreviewProtocol();
  createWindow();
  void setupOpenCodeConfig().catch((err) => {
    logger.error("OpenCode config setup failed:", err);
  });
  createApplicationMenu();

  logger.info("Auto-update enabled=", settings.enableAutoUpdate);
  if (settings.enableAutoUpdate && app.isPackaged) {
    initAutoUpdater();
  }

  // Staged rollout: log the user's deterministic bucket (0–99) for observability.
  // Updates are served directly from GitHub Releases; the client bucket
  // is used for analytics (sent to PostHog via the existing telemetry pipeline).
  const rolloutBucket = getUserRolloutBucket();
  logger.info("Update rollout bucket=", rolloutBucket);
}

export async function onFirstRunMaybe(settings: UserSettings) {
  if (!settings.hasRunBefore) {
    await promptMoveToApplicationsFolder();
    writeSettings({
      hasRunBefore: true,
    });
  }
  if (IS_TEST_BUILD) {
    writeSettings({
      isTestMode: true,
    });
  }
}

/**
 * Ask the user if the app should be moved to the
 * applications folder.
 */
async function promptMoveToApplicationsFolder(): Promise<void> {
  // Why not in e2e tests?
  // There's no way to stub this dialog in time, so we just skip it
  // in e2e testing mode.
  if (IS_TEST_BUILD) return;
  if (process.env.NODE_ENV === "development") return;
  if (process.platform !== "darwin") return;
  if (app.isInApplicationsFolder()) return;
  logger.log("Prompting user to move to applications folder");

  const { response } = await dialog.showMessageBox({
    type: "question",
    buttons: ["Move to Applications Folder", "Do Not Move"],
    defaultId: 0,
    message: "Move to Applications Folder? (required for auto-update)",
  });

  if (response === 0) {
    logger.log("User chose to move to applications folder");
    app.moveToApplicationsFolder();
  } else {
    logger.log("User chose not to move to applications folder");
  }
}

declare global {
  const MAIN_WINDOW_VITE_DEV_SERVER_URL: string;
}

let mainWindow: BrowserWindow | null = null;
let pendingForceCloseData: any = null;

const createWindow = () => {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: process.env.NODE_ENV === "development" ? 1280 : 960,
    minWidth: 800,
    height: 700,
    minHeight: 500,
    titleBarStyle: "hidden",
    titleBarOverlay: false,
    trafficLightPosition: {
      x: 10,
      y: 8,
    },
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, "preload.js"),
      // transparent: true,
    },
    icon: path.join(app.getAppPath(), "assets/icon/logo.png"),
    // backgroundColor: "#00000001",
    // frame: false,
  });
  // and load the index.html of the app.
  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(
      path.join(__dirname, "../renderer/main_window/index.html"),
    );
  }
  if (
    process.env.NODE_ENV === "development" ||
    MAIN_WINDOW_VITE_DEV_SERVER_URL
  ) {
    // Open the DevTools.
    mainWindow.webContents.openDevTools();

    mainWindow.webContents.on("before-input-event", (_event, input) => {
      if (
        input.type === "keyDown" &&
        input.key === "r" &&
        (input.meta || input.control) &&
        !input.alt
      ) {
        if (input.shift) {
          mainWindow?.webContents.reloadIgnoringCache();
        } else {
          mainWindow?.webContents.reload();
        }
      }
    });
  }

  // Send force-close event if it was detected
  if (pendingForceCloseData) {
    mainWindow.webContents.once("did-finish-load", () => {
      mainWindow?.webContents.send("force-close-detected", {
        performanceData: pendingForceCloseData,
      });
      pendingForceCloseData = null;
    });
  }

  // Enable native context menu on right-click
  mainWindow.webContents.on("context-menu", (event, params) => {
    // Prevent any default behavior and show our own menu
    event.preventDefault();

    const template: Electron.MenuItemConstructorOptions[] = [];
    if (params.isEditable) {
      template.push(
        { role: "undo" },
        { role: "redo" },
        { type: "separator" },
        { role: "cut" },
        { role: "copy" },
        { role: "paste" },
        { role: "delete" },
      );
      if (params.misspelledWord) {
        const suggestions: Electron.MenuItemConstructorOptions[] =
          params.dictionarySuggestions.slice(0, 5).map((suggestion) => ({
            label: suggestion,
            click: () => {
              try {
                mainWindow?.webContents.replaceMisspelling(suggestion);
              } catch (error) {
                logger.error("Failed to replace misspelling:", error);
              }
            },
          }));
        template.push(
          { type: "separator" },
          {
            type: "submenu",
            label: `Correct "${params.misspelledWord}"`,
            submenu: suggestions,
          },
        );
      }
      template.push({ type: "separator" }, { role: "selectAll" });
    } else {
      if (params.selectionText && params.selectionText.length > 0) {
        template.push({ role: "copy" });
      }
      template.push({ role: "selectAll" });
    }

    if (process.env.NODE_ENV === "development") {
      template.push(
        { type: "separator" },
        {
          label: "Inspect Element",
          click: () =>
            mainWindow?.webContents.inspectElement(params.x, params.y),
        },
      );
    }

    const menu = Menu.buildFromTemplate(template);
    menu.popup({ window: mainWindow! });
  });
};

/**
 * Create application menu with Edit shortcuts (Undo, Redo, Cut, Copy, Paste, etc.)
 * This enables standard keyboard shortcuts like Cmd/Ctrl+C, Cmd/Ctrl+V, etc.
 */
const createApplicationMenu = () => {
  const isMac = process.platform === "darwin";

  const template: Electron.MenuItemConstructorOptions[] = [
    // App menu (macOS only)
    ...(isMac
      ? [
          {
            label: app.name,
            submenu: [
              { role: "about" as const },
              { type: "separator" as const },
              { role: "services" as const },
              { type: "separator" as const },
              { role: "hide" as const },
              { role: "hideOthers" as const },
              { role: "unhide" as const },
              { type: "separator" as const },
              { role: "quit" as const },
            ],
          },
        ]
      : []),
    // Edit menu - enables keyboard shortcuts for clipboard operations
    {
      label: "Edit",
      submenu: [
        { role: "undo" as const },
        { role: "redo" as const },
        { type: "separator" as const },
        { role: "cut" as const },
        { role: "copy" as const },
        { role: "paste" as const },
        { role: "delete" as const },
        { type: "separator" as const },
        { role: "selectAll" as const },
      ],
    },
    // View menu
    {
      label: "View",
      submenu: [
        { role: "reload" as const },
        { role: "forceReload" as const },
        ...(process.env.NODE_ENV === "development"
          ? [{ role: "toggleDevTools" as const }]
          : []),
        { type: "separator" as const },
        { role: "resetZoom" as const },
        { role: "zoomIn" as const },
        { role: "zoomOut" as const },
        { type: "separator" as const },
        { role: "togglefullscreen" as const },
      ],
    },
    // Window menu
    {
      label: "Window",
      submenu: [
        { role: "minimize" as const },
        { role: "zoom" as const },
        ...(isMac
          ? [
              { type: "separator" as const },
              { role: "front" as const },
              { type: "separator" as const },
              { role: "window" as const },
            ]
          : [{ role: "close" as const }]),
      ],
    },
  ];

  const appMenu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(appMenu);
};

const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  app.on("second-instance", (_event, commandLine, _workingDirectory) => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
    handleDeepLinkReturn(commandLine.pop()!);
  });
  app.whenReady().then(() => {
    onReady().then(() => {
      if (process.platform !== "darwin") {
        const deepLinkArg = process.argv.find((arg) =>
          arg.startsWith("anyon://"),
        );
        if (deepLinkArg) {
          handleDeepLinkReturn(deepLinkArg);
        }
      }
    });
  });
}

// Handle the protocol. In this case, we choose to show an Error Box.
app.on("open-url", (event, url) => {
  handleDeepLinkReturn(url);
});

async function handleDeepLinkReturn(url: string) {
  // example url: "anyon://supabase-oauth-return?token=a&refreshToken=b"
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    log.info("Invalid deep link URL", url);
    return;
  }

  // Intentionally do NOT log the full URL which may contain sensitive tokens.
  log.log(
    "Handling deep link: protocol",
    parsed.protocol,
    "hostname",
    parsed.hostname,
  );
  if (parsed.protocol !== "anyon:") {
    dialog.showErrorBox(
      "Invalid Protocol",
      `Expected anyon://, got ${parsed.protocol}. Full URL: ${url}`,
    );
    return;
  }
  if (parsed.hostname === "supabase-oauth-return") {
    const token = parsed.searchParams.get("token");
    const refreshToken = parsed.searchParams.get("refreshToken");
    const expiresIn = Number(parsed.searchParams.get("expiresIn"));
    if (!token || !refreshToken || !expiresIn) {
      dialog.showErrorBox(
        "Invalid URL",
        "Expected token, refreshToken, and expiresIn",
      );
      return;
    }
    await handleSupabaseOAuthReturn({ token, refreshToken, expiresIn });
    // Send message to renderer to trigger re-render
    mainWindow?.webContents.send("deep-link-received", {
      type: parsed.hostname,
    });
    return;
  }
  if (parsed.hostname === "vercel-oauth-return") {
    const token = parsed.searchParams.get("token");
    if (!token) {
      dialog.showErrorBox("Invalid URL", "Expected token parameter");
      return;
    }
    const refreshToken = parsed.searchParams.get("refreshToken") || undefined;
    const expiresIn = parsed.searchParams.get("expiresIn")
      ? Number(parsed.searchParams.get("expiresIn"))
      : undefined;
    const teamId = parsed.searchParams.get("teamId") || undefined;
    const installationId =
      parsed.searchParams.get("installationId") || undefined;
    handleVercelOAuthReturn({
      token,
      refreshToken,
      expiresIn,
      teamId,
      installationId,
    });
    mainWindow?.webContents.send("deep-link-received", {
      type: parsed.hostname,
    });
    return;
  }
  if (parsed.hostname === "auth-return") {
    const code = parsed.searchParams.get("code");
    if (!code) {
      dialog.showErrorBox("Invalid URL", "Expected code parameter");
      return;
    }
    try {
      await handleAuthCallback(code);
      mainWindow?.webContents.send("deep-link-received", {
        type: parsed.hostname,
      });
    } catch (error) {
      log.error("Auth callback failed:", error);
      dialog.showErrorBox(
        "Authentication Failed",
        error instanceof Error ? error.message : "Unknown error",
      );
    }
    return;
  }
  if (parsed.hostname === "checkout-success") {
    syncEntitlements().catch((err) => {
      log.error("Failed to sync entitlements after checkout:", err);
    });
    mainWindow?.webContents.send("deep-link-received", {
      type: parsed.hostname,
    });
    return;
  }
  // anyon://anyon-pro-return?key=123&budget_reset_at=2025-05-26T16:31:13.492000Z&max_budget=100
  if (parsed.hostname === "anyon-pro-return") {
    const apiKey = parsed.searchParams.get("key");
    if (!apiKey) {
      dialog.showErrorBox("Invalid URL", "Expected key");
      return;
    }
    handleAnyonProReturn({
      apiKey,
    });
    // Send message to renderer to trigger re-render
    mainWindow?.webContents.send("deep-link-received", {
      type: parsed.hostname,
    });
    return;
  }
  // anyon://add-mcp-server?name=Chrome%20DevTools&config=eyJjb21tYW5kIjpudWxsLCJ0eXBlIjoic3RkaW8ifQ%3D%3D
  if (parsed.hostname === "add-mcp-server") {
    const name = parsed.searchParams.get("name");
    const config = parsed.searchParams.get("config");
    if (!name || !config) {
      dialog.showErrorBox("Invalid URL", "Expected name and config");
      return;
    }

    try {
      const decodedConfigJson = atob(config);
      const decodedConfig = JSON.parse(decodedConfigJson);
      const parsedConfig = AddMcpServerConfigSchema.parse(decodedConfig);

      mainWindow?.webContents.send("deep-link-received", {
        type: parsed.hostname,
        payload: {
          name,
          config: parsedConfig,
        } as AddMcpServerPayload,
      });
    } catch (error) {
      logger.error("Failed to parse add-mcp-server deep link:", error);
      dialog.showErrorBox(
        "Invalid MCP Server Configuration",
        "The deep link contains malformed configuration data. Please check the URL and try again.",
      );
    }
    return;
  }
  // anyon://add-prompt?data=<base64-encoded-json>
  if (parsed.hostname === "add-prompt") {
    const data = parsed.searchParams.get("data");
    if (!data) {
      dialog.showErrorBox("Invalid URL", "Expected data parameter");
      return;
    }

    try {
      const decodedJson = atob(data);
      const decoded = JSON.parse(decodedJson);
      const parsedData = AddPromptDataSchema.parse(decoded);

      mainWindow?.webContents.send("deep-link-received", {
        type: parsed.hostname,
        payload: parsedData as AddPromptPayload,
      });
    } catch (error) {
      logger.error("Failed to parse add-prompt deep link:", error);
      dialog.showErrorBox(
        "Invalid Prompt Data",
        "The deep link contains malformed data. Please check the URL and try again.",
      );
    }
    return;
  }
  dialog.showErrorBox("Invalid deep link URL", url);
}

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

// Clean up OpenCode server and persist settings when the app quits.
// `openCodeServer.stop()` is async (sends SIGTERM, waits up to 5 s, then
// SIGKILL), so we prevent the default quit, run cleanup, then re-trigger quit.
let isCleaningUp = false;
app.on("will-quit", (event) => {
  if (isCleaningUp) return; // Allow quit on second pass
  isCleaningUp = true;
  event.preventDefault();

  logger.info("App is quitting, cleaning up...");
  stopPerformanceMonitoring();

  openCodeServer
    .stop()
    .catch((err: unknown) =>
      logger.warn("Failed to stop OpenCode server during quit:", err),
    )
    .finally(() => {
      writeSettings({ isRunning: false });
      app.quit(); // Re-triggers will-quit; isCleaningUp guard prevents loop
    });
});

app.on("activate", () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
