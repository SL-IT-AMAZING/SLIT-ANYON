import * as crypto from "node:crypto";
import * as fs from "node:fs";
import * as path from "node:path";
import { retryWithRateLimit } from "@/ipc/utils/retryWithRateLimit";
import { getAnyonAppPath } from "@/paths/paths";
import { getSupabaseClient } from "@/supabase_admin/supabase_management_client";
import { Vercel } from "@vercel/sdk";
import type { CreateProjectFramework } from "@vercel/sdk/models/createprojectop.js";
import { eq } from "drizzle-orm";
import { type IpcMainInvokeEvent, ipcMain } from "electron";
import log from "electron-log";
import { db } from "../../db";
import * as schema from "../../db/schema";
import { apps } from "../../db/schema";
import { readSettings, writeSettings } from "../../main/settings";
import {
  DeviceAuthError,
  pollForToken,
  requestDeviceCode,
} from "../../vercel_admin/vercel_device_auth";
import {
  getVercelAccessToken,
  getVercelTeamId,
} from "../../vercel_admin/vercel_management_client";
import {
  type ConnectToExistingVercelProjectParams,
  type CreateVercelProjectParams,
  type DeviceAuthPollResponse,
  type DeviceAuthStartResponse,
  type DirectDeployParams,
  DirectDeployParamsSchema,
  type DisconnectVercelProjectParams,
  type GetVercelDeploymentsParams,
  type IsVercelProjectAvailableParams,
  type SaveVercelAccessTokenParams,
  type SyncSupabaseEnvParams,
  type VercelDeployment,
  type VercelProject,
  vercelContracts,
  vercelDeployStreamContract,
} from "../types/vercel";
import {
  type CollectedFile,
  collectDeployFiles,
} from "../utils/file_collector";
import { IS_TEST_BUILD } from "../utils/test_utils";
import { createTypedHandler } from "./base";

const logger = log.scope("vercel_handlers");

// Use test server URLs when in test mode
const TEST_SERVER_BASE = "http://localhost:3500";

const VERCEL_API_BASE = IS_TEST_BUILD
  ? `${TEST_SERVER_BASE}/vercel/api`
  : "https://api.vercel.com";
const VERCEL_ENV_TARGETS = ["production", "preview", "development"] as const;

const SUPABASE_VERCEL_ENV_KEYS = {
  publicUrl: "NEXT_PUBLIC_SUPABASE_URL",
  publicAnonKey: "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  vitePublicUrl: "VITE_SUPABASE_URL",
  vitePublicAnonKey: "VITE_SUPABASE_ANON_KEY",
  anyonPublicUrl: "ANYON_SUPABASE_URL",
  anyonPublicAnonKey: "ANYON_SUPABASE_ANON_KEY",
  serverUrl: "SUPABASE_URL",
  serverAnonKey: "SUPABASE_ANON_KEY",
} as const;

interface ActiveDeviceAuthSession {
  deviceCode: string;
  expiresAt: number;
  interval: number;
}

let activeDeviceAuthSession: ActiveDeviceAuthSession | null = null;

// --- Helper Functions ---

function createVercelClient(token: string): Vercel {
  return new Vercel({
    bearerToken: token,
    ...(IS_TEST_BUILD && { serverURL: VERCEL_API_BASE }),
  });
}

interface VercelProjectResponse {
  id: string;
  name: string;
  framework?: string | null;
  targets?: {
    production?: {
      url?: string;
    };
  };
}

interface GetVercelProjectsResponse {
  projects: VercelProjectResponse[];
}

/**
 * Fetch Vercel projects via HTTP request (bypasses the broken SDK).
 * Mimics the SDK's `vercel.projects.getProjects` API.
 */
async function getVercelProjects(
  token: string,
  options?: { search?: string; teamId?: string | null },
): Promise<GetVercelProjectsResponse> {
  const url = new URL(`${VERCEL_API_BASE}/v9/projects`);
  if (options?.search) {
    url.searchParams.set("search", options.search);
  }
  if (options?.teamId) {
    url.searchParams.set("teamId", options.teamId);
  }

  const response = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Failed to fetch Vercel projects: ${response.status} ${response.statusText} - ${errorText}`,
    );
  }

  const data = await response.json();
  return {
    projects: data.projects || [],
  };
}

async function validateVercelToken(token: string): Promise<boolean> {
  try {
    const vercel = createVercelClient(token);
    await vercel.user.getAuthUser();
    return true;
  } catch (error) {
    logger.error("Error validating Vercel token:", error);
    return false;
  }
}

// Northstar accounts require defaultTeamId for write endpoints (403 without it).
// Resolution: GET /v2/user (northstar defaultTeamId) → fallback GET /v2/teams
async function getDefaultTeamId(token: string): Promise<string | null> {
  try {
    const userResponse = await fetch(`${VERCEL_API_BASE}/v2/user`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (userResponse.ok) {
      const userData = await userResponse.json();
      logger.info(
        `[getDefaultTeamId] /v2/user response: version=${userData.user?.version}, defaultTeamId=${userData.user?.defaultTeamId}, username=${userData.user?.username}`,
      );
      if (
        userData.user?.version === "northstar" &&
        userData.user?.defaultTeamId
      ) {
        return userData.user.defaultTeamId;
      }
    } else {
      logger.warn(
        `[getDefaultTeamId] /v2/user failed: ${userResponse.status} ${userResponse.statusText}`,
      );
    }

    const teamsResponse = await fetch(`${VERCEL_API_BASE}/v2/teams?limit=1`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!teamsResponse.ok) {
      logger.warn(
        `[getDefaultTeamId] /v2/teams failed: ${teamsResponse.status} ${teamsResponse.statusText}`,
      );
      return null;
    }

    const teamsData = await teamsResponse.json();
    logger.info(
      `[getDefaultTeamId] /v2/teams returned ${teamsData.teams?.length ?? 0} teams`,
    );

    if (teamsData.teams && teamsData.teams.length > 0) {
      return teamsData.teams[0].id;
    }

    return null;
  } catch (error) {
    logger.warn("[getDefaultTeamId] error:", error);
    return null;
  }
}

async function fetchAndStoreUserDefaultTeamId(
  token: string,
): Promise<string | null> {
  const teamId = await getDefaultTeamId(token);
  if (teamId) {
    const settings = readSettings();
    writeSettings({
      vercel: {
        ...settings.vercel,
        teamId,
      },
    });
    logger.info(`Stored default teamId in settings: ${teamId}`);
  }
  return teamId;
}

async function detectFramework(
  appPath: string,
): Promise<CreateProjectFramework | undefined> {
  try {
    // Check for specific config files first
    const configFiles: Array<{
      file: string;
      framework: CreateProjectFramework;
    }> = [
      { file: "next.config.js", framework: "nextjs" },
      { file: "next.config.mjs", framework: "nextjs" },
      { file: "next.config.ts", framework: "nextjs" },
      { file: "vite.config.js", framework: "vite" },
      { file: "vite.config.ts", framework: "vite" },
      { file: "vite.config.mjs", framework: "vite" },
      { file: "nuxt.config.js", framework: "nuxtjs" },
      { file: "nuxt.config.ts", framework: "nuxtjs" },
      { file: "astro.config.js", framework: "astro" },
      { file: "astro.config.mjs", framework: "astro" },
      { file: "astro.config.ts", framework: "astro" },
      { file: "svelte.config.js", framework: "svelte" },
    ];

    for (const { file, framework } of configFiles) {
      if (fs.existsSync(path.join(appPath, file))) {
        return framework;
      }
    }

    // Check package.json for dependencies
    const packageJsonPath = path.join(appPath, "package.json");
    if (fs.existsSync(packageJsonPath)) {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
      const dependencies = {
        ...packageJson.dependencies,
        ...packageJson.devDependencies,
      };

      // Check for framework dependencies in order of preference
      if (dependencies.next) return "nextjs";
      if (dependencies.vite) return "vite";
      if (dependencies.nuxt) return "nuxtjs";
      if (dependencies.astro) return "astro";
      if (dependencies.svelte) return "svelte";
      if (dependencies["@angular/core"]) return "angular";
      if (dependencies.vue) return "vue";
      if (dependencies["react-scripts"]) return "create-react-app";
      if (dependencies.gatsby) return "gatsby";
      if (dependencies.remix) return "remix";
    }

    // Default fallback
    return undefined;
  } catch (error) {
    logger.error("Error detecting framework:", error);
    return undefined;
  }
}

/**
 * Returns explicit build settings for the detected framework.
 * While Vercel auto-detects these from the framework field, explicit
 * specification is more reliable for direct API deploys.
 */
function getFrameworkBuildSettings(
  framework: CreateProjectFramework | undefined,
  appPath: string,
): {
  buildCommand: string | null;
  outputDirectory: string | null;
  installCommand: string | null;
} {
  // Detect package manager from lock files
  let installCommand: string;
  let buildPrefix: string;
  if (fs.existsSync(path.join(appPath, "bun.lock")) || fs.existsSync(path.join(appPath, "bun.lockb"))) {
    installCommand = "bun install";
    buildPrefix = "bun run";
  } else if (fs.existsSync(path.join(appPath, "pnpm-lock.yaml"))) {
    installCommand = "pnpm install";
    buildPrefix = "pnpm run";
  } else if (fs.existsSync(path.join(appPath, "yarn.lock"))) {
    installCommand = "yarn install";
    buildPrefix = "yarn";
  } else {
    installCommand = "npm install";
    buildPrefix = "npm run";
  }

  // Framework-specific build command and output directory
  switch (framework) {
    case "vite":
    case "vue":
    case "svelte":
    case "astro":
      return { buildCommand: `${buildPrefix} build`, outputDirectory: "dist", installCommand };
    case "nextjs":
      return { buildCommand: `${buildPrefix} build`, outputDirectory: ".next", installCommand };
    case "nuxtjs":
      return { buildCommand: `${buildPrefix} build`, outputDirectory: ".output", installCommand };
    case "create-react-app":
      return { buildCommand: `${buildPrefix} build`, outputDirectory: "build", installCommand };
    case "gatsby":
      return { buildCommand: `${buildPrefix} build`, outputDirectory: "public", installCommand };
    case "angular":
      return { buildCommand: `${buildPrefix} build`, outputDirectory: "dist", installCommand };
    case "remix":
      return { buildCommand: `${buildPrefix} build`, outputDirectory: "public", installCommand };
    default:
      return { buildCommand: `${buildPrefix} build`, outputDirectory: "dist", installCommand };
  }
}

export async function getSupabasePublishableKey({
  projectId,
  organizationSlug,
}: {
  projectId: string;
  organizationSlug: string | null;
}): Promise<string> {
  if (IS_TEST_BUILD) {
    return "test-publishable-key";
  }

  const supabase = await getSupabaseClient({ organizationSlug });
  const keys = await retryWithRateLimit(
    () => supabase.getProjectApiKeys(projectId),
    `Get API keys for ${projectId}`,
  );

  if (!keys) {
    throw new Error(`No API keys found for Supabase project ${projectId}.`);
  }

  const publishableKey = keys.find(
    (key) =>
      (key as { name?: string; type?: string }).name === "anon" ||
      (key as { name?: string; type?: string }).type === "publishable",
  );

  if (!publishableKey?.api_key) {
    throw new Error(
      `No publishable API key found for Supabase project ${projectId}.`,
    );
  }

  return publishableKey.api_key;
}

export async function syncSupabaseEnvVarsForApp(appId: number): Promise<void> {
  const app = await db.query.apps.findFirst({ where: eq(apps.id, appId) });

  if (!app) {
    throw new Error(`App ${appId} not found.`);
  }

  if (!app.supabaseProjectId || !app.vercelProjectId) {
    throw new Error(
      `App ${appId} must be linked to both Supabase and Vercel before syncing env vars.`,
    );
  }

  const vercelProjectId = app.vercelProjectId;

  const supabaseUrl = `https://${app.supabaseProjectId}.supabase.co`;
  const supabaseAnonKey = await getSupabasePublishableKey({
    projectId: app.supabaseProjectId,
    organizationSlug: app.supabaseOrganizationSlug,
  });

  const accessToken = await getVercelAccessToken();
  const vercel = createVercelClient(accessToken);
  const teamId = app.vercelTeamId ?? getVercelTeamId() ?? undefined;

  await retryWithRateLimit(
    () =>
      vercel.projects.createProjectEnv({
        idOrName: vercelProjectId,
        teamId,
        upsert: "true",
        requestBody: [
          {
            key: SUPABASE_VERCEL_ENV_KEYS.publicUrl,
            value: supabaseUrl,
            type: "plain",
            target: [...VERCEL_ENV_TARGETS],
          },
          {
            key: SUPABASE_VERCEL_ENV_KEYS.publicAnonKey,
            value: supabaseAnonKey,
            type: "plain",
            target: [...VERCEL_ENV_TARGETS],
          },
          {
            key: SUPABASE_VERCEL_ENV_KEYS.serverUrl,
            value: supabaseUrl,
            type: "plain",
            target: [...VERCEL_ENV_TARGETS],
          },
          {
            key: SUPABASE_VERCEL_ENV_KEYS.serverAnonKey,
            value: supabaseAnonKey,
            type: "plain",
            target: [...VERCEL_ENV_TARGETS],
          },
          {
            key: SUPABASE_VERCEL_ENV_KEYS.vitePublicUrl,
            value: supabaseUrl,
            type: "plain",
            target: [...VERCEL_ENV_TARGETS],
          },
          {
            key: SUPABASE_VERCEL_ENV_KEYS.vitePublicAnonKey,
            value: supabaseAnonKey,
            type: "plain",
            target: [...VERCEL_ENV_TARGETS],
          },
          {
            key: SUPABASE_VERCEL_ENV_KEYS.anyonPublicUrl,
            value: supabaseUrl,
            type: "plain",
            target: [...VERCEL_ENV_TARGETS],
          },
          {
            key: SUPABASE_VERCEL_ENV_KEYS.anyonPublicAnonKey,
            value: supabaseAnonKey,
            type: "plain",
            target: [...VERCEL_ENV_TARGETS],
          },
        ],
      }),
    `Sync Supabase env vars to Vercel project ${vercelProjectId}`,
  );

  logger.info(
    `Synced Supabase env vars to Vercel project ${vercelProjectId} for app ${appId}`,
  );
}

export async function autoSyncSupabaseEnvVarsIfConnected(
  appId: number,
): Promise<void> {
  const app = await db.query.apps.findFirst({ where: eq(apps.id, appId) });
  if (!app?.supabaseProjectId || !app?.vercelProjectId) {
    return;
  }

  try {
    await syncSupabaseEnvVarsForApp(appId);
  } catch (error) {
    // Log the error for diagnostics, then re-throw so callers know the sync
    // failed.  handleDirectDeploy can still proceed because the injected .env
    // file provides a fallback, but the caller should be aware.
    logger.error(
      `Automatic Supabase->Vercel env sync failed for app ${appId}:`,
      error,
    );
    throw error;
  }
}

async function handleSyncSupabaseEnvVars(
  _event: IpcMainInvokeEvent,
  { appId }: SyncSupabaseEnvParams,
): Promise<void> {
  await syncSupabaseEnvVarsForApp(appId);
}

// --- IPC Handlers ---

async function handleSaveVercelToken(
  event: IpcMainInvokeEvent,
  { token }: SaveVercelAccessTokenParams,
): Promise<void> {
  logger.debug("Saving Vercel access token");

  if (!token || token.trim() === "") {
    throw new Error("Access token is required.");
  }

  try {
    // Validate the token by making a test API call
    const isValid = await validateVercelToken(token.trim());
    if (!isValid) {
      throw new Error(
        "Invalid access token. Please check your token and try again.",
      );
    }

    writeSettings({
      vercelAccessToken: {
        value: token.trim(),
      },
    });

    await fetchAndStoreUserDefaultTeamId(token.trim());

    logger.log("Successfully saved Vercel access token.");
  } catch (error: any) {
    logger.error("Error saving Vercel token:", error);
    throw new Error(`Failed to save access token: ${error.message}`);
  }
}

async function handleStartDeviceAuth(): Promise<DeviceAuthStartResponse> {
  const deviceCodeResponse = await requestDeviceCode();
  activeDeviceAuthSession = {
    deviceCode: deviceCodeResponse.device_code,
    expiresAt: Date.now() + deviceCodeResponse.expires_in * 1000,
    interval: deviceCodeResponse.interval,
  };

  return {
    userCode: deviceCodeResponse.user_code,
    verificationUri: deviceCodeResponse.verification_uri,
    verificationUriComplete: deviceCodeResponse.verification_uri_complete,
    expiresIn: deviceCodeResponse.expires_in,
    interval: deviceCodeResponse.interval,
  };
}

async function handlePollDeviceAuth(): Promise<DeviceAuthPollResponse> {
  if (!activeDeviceAuthSession) {
    return {
      status: "error",
      error: "No active Vercel device authorization session.",
    };
  }

  try {
    const tokens = await pollForToken(
      activeDeviceAuthSession.deviceCode,
      activeDeviceAuthSession.interval,
      activeDeviceAuthSession.expiresAt,
    );

    writeSettings({
      vercel: {
        accessToken: { value: tokens.access_token },
        ...(tokens.refresh_token && {
          refreshToken: { value: tokens.refresh_token },
        }),
        expiresIn: tokens.expires_in,
        tokenTimestamp: Math.floor(Date.now() / 1000),
        authMethod: "device",
      },
    });

    try {
      await fetchAndStoreUserDefaultTeamId(tokens.access_token);
    } catch (teamIdError) {
      logger.warn(
        "Failed to resolve default teamId after device auth (non-fatal):",
        teamIdError,
      );
    }

    activeDeviceAuthSession = null;
    return { status: "success" };
  } catch (error) {
    if (error instanceof DeviceAuthError) {
      if (error.code === "authorization_pending") {
        return { status: "pending" };
      }

      if (error.code === "slow_down") {
        if (activeDeviceAuthSession) {
          activeDeviceAuthSession.interval =
            error.nextInterval ?? activeDeviceAuthSession.interval + 5;
        }
        return { status: "pending" };
      }

      if (error.code === "expired_token") {
        activeDeviceAuthSession = null;
        return { status: "expired" };
      }

      if (error.code === "access_denied") {
        activeDeviceAuthSession = null;
        return { status: "denied" };
      }

      return { status: "error", error: error.message };
    }

    const message = error instanceof Error ? error.message : String(error);
    logger.error("Failed to poll Vercel device auth:", error);
    return { status: "error", error: message };
  }
}

// --- Vercel List Projects Handler ---
async function handleListVercelProjects(): Promise<VercelProject[]> {
  try {
    const accessToken = await getVercelAccessToken();
    const teamId = getVercelTeamId();
    const response = await getVercelProjects(accessToken, { teamId });

    if (!response.projects) {
      throw new Error("Failed to retrieve projects from Vercel.");
    }

    return response.projects.map((project) => ({
      id: project.id,
      name: project.name,
      framework: project.framework || null,
    }));
  } catch (err: any) {
    logger.error("[Vercel Handler] Failed to list projects:", err);
    throw new Error(err.message || "Failed to list Vercel projects.");
  }
}

// --- Vercel Project Availability Handler ---
async function handleIsProjectAvailable(
  event: IpcMainInvokeEvent,
  { name }: IsVercelProjectAvailableParams,
): Promise<{ available: boolean; error?: string }> {
  try {
    const accessToken = await getVercelAccessToken();
    const teamId = getVercelTeamId();

    // Check if project name is available by searching for projects with that name
    const response = await getVercelProjects(accessToken, { search: name, teamId });

    if (!response.projects) {
      return {
        available: false,
        error: "Failed to check project availability.",
      };
    }

    const projectExists = response.projects.some(
      (project) => project.name === name,
    );

    return {
      available: !projectExists,
      error: projectExists ? "Project name is not available." : undefined,
    };
  } catch (err: any) {
    return { available: false, error: err.message || "Unknown error" };
  }
}

// --- Vercel Create Project Handler ---
async function handleCreateProject(
  event: IpcMainInvokeEvent,
  { name, appId }: CreateVercelProjectParams,
): Promise<void> {
  try {
    const accessToken = await getVercelAccessToken();
    logger.info(`Creating Vercel project: ${name} for app ${appId}`);

    // Get app details to determine the framework
    const app = await db.query.apps.findFirst({ where: eq(apps.id, appId) });
    if (!app) {
      throw new Error("App not found.");
    }

    const hasGitHub = !!(app.githubOrg && app.githubRepo);

    // Detect the framework from the app's directory
    const detectedFramework = await detectFramework(getAnyonAppPath(app.path));

    logger.info(
      `Detected framework: ${detectedFramework || "none detected"} for app at ${app.path}`,
    );

    const vercel = createVercelClient(accessToken);

    const appPath = getAnyonAppPath(app.path);
    const buildSettings = getFrameworkBuildSettings(detectedFramework, appPath);

    const requestBody = hasGitHub
      ? {
          name: name,
          gitRepository: {
            type: "github" as const,
            repo: `${app.githubOrg}/${app.githubRepo}`,
          },
          framework: detectedFramework,
          buildCommand: buildSettings.buildCommand,
          outputDirectory: buildSettings.outputDirectory,
          installCommand: buildSettings.installCommand,
        }
      : {
          name: name,
          framework: detectedFramework,
          buildCommand: buildSettings.buildCommand,
          outputDirectory: buildSettings.outputDirectory,
          installCommand: buildSettings.installCommand,
        };

    // --- Resolve teamId ---
    // Always force-resolve from /v2/user at creation time (don't rely on cached settings)
    let teamId: string | null = getVercelTeamId();
    let userDiagnostic = "";
    if (!teamId) {
      // Force-fetch from /v2/user to get Northstar defaultTeamId
      try {
        const userRes = await fetch(`${VERCEL_API_BASE}/v2/user`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (userRes.ok) {
          const userData = await userRes.json();
          const u = userData.user;
          userDiagnostic = `version=${u?.version}, defaultTeamId=${u?.defaultTeamId}, username=${u?.username}`;
          if (u?.version === "northstar" && u?.defaultTeamId) {
            teamId = u.defaultTeamId;
            // Persist for future use
            const settings = readSettings();
            writeSettings({
              vercel: { ...settings.vercel, teamId: teamId ?? undefined },
            });
          }
        } else {
          const userErrBody = await userRes.text().catch(() => "(unreadable)");
          userDiagnostic = `/v2/user returned ${userRes.status}: ${userErrBody.slice(0, 200)}`;
        }
      } catch (e) {
        userDiagnostic = `/v2/user threw: ${e instanceof Error ? e.message : String(e)}`;
      }

      // Fallback: try /v2/teams
      if (!teamId) {
        try {
          const teamsRes = await fetch(`${VERCEL_API_BASE}/v2/teams?limit=1`, {
            headers: { Authorization: `Bearer ${accessToken}` },
          });
          if (teamsRes.ok) {
            const teamsData = await teamsRes.json();
            if (teamsData.teams?.length > 0) {
              teamId = teamsData.teams[0].id;
              userDiagnostic += `, teams[0].id=${teamId}`;
              const settings = readSettings();
              writeSettings({
                vercel: { ...settings.vercel, teamId: teamId ?? undefined },
              });
            } else {
              userDiagnostic += ", teams=empty";
            }
          } else {
            const teamsErrBody = await teamsRes.text().catch(() => "(unreadable)");
            userDiagnostic += `, /v2/teams returned ${teamsRes.status}: ${teamsErrBody.slice(0, 200)}`;
          }
        } catch (e) {
          userDiagnostic += `, /v2/teams threw: ${e instanceof Error ? e.message : String(e)}`;
        }
      }
    } else {
      userDiagnostic = "from cached settings";
    }
    logger.info(
      `[createProject] teamId=${teamId ?? "none"} (${userDiagnostic})`,
    );

    // Helper to attempt project creation with a given scope
    const attemptCreateProject = async (
      scopeTeamId: string | null,
      scopeLabel: string,
    ): Promise<Response> => {
      const url = new URL(`${VERCEL_API_BASE}/v1/projects`);
      if (scopeTeamId) {
        url.searchParams.set("teamId", scopeTeamId);
      }
      logger.info(
        `[createProject] POST ${url.toString()} (scope: ${scopeLabel}) body=${JSON.stringify(requestBody)}`,
      );
      return fetch(url.toString(), {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });
    };

    // Try primary scope, then fallback to opposite scope if 403
    let createResponse = await attemptCreateProject(
      teamId,
      teamId ? `team:${teamId}` : "personal",
    );

    if (createResponse.status === 403) {
      if (teamId) {
        // Had teamId but 403 → try personal scope
        logger.warn(
          `[createProject] 403 with teamId=${teamId}, retrying without teamId...`,
        );
        createResponse = await attemptCreateProject(null, "personal-fallback");
      } else {
        // No teamId and 403 → force-resolve teamId and retry with it
        logger.warn(
          `[createProject] 403 without teamId. User diagnostic: ${userDiagnostic}`,
        );
        // If we still don't have teamId, we can't retry — just fall through to error
      }
    }

    if (!createResponse.ok) {
      const errorBody = await createResponse.text();
      const tokenPrefix = accessToken.substring(0, 8);
      logger.error(
        `[createProject] Failed: ${createResponse.status} ${createResponse.statusText} - ${errorBody}`,
      );
      const settings = readSettings();
      const tokenSource = settings.vercel?.accessToken?.value
        ? "vercel.accessToken"
        : settings.vercelAccessToken?.value
          ? "vercelAccessToken(legacy)"
          : "none";
      throw new Error(
        `Failed to create project: ${createResponse.status} - ${errorBody}\n` +
          `[Debug] teamId=${teamId ?? "none"}, token=${tokenPrefix}..., authMethod=${settings.vercel?.authMethod ?? "unknown"}, tokenSource=${tokenSource}, IS_TEST_BUILD=${IS_TEST_BUILD}, API_BASE=${VERCEL_API_BASE}, userInfo=(${userDiagnostic})`,
      );
    }

    const projectData = await createResponse.json();

    if (!projectData?.id) {
      throw new Error("Failed to create project: No project ID returned.");
    }

    const projectDomains = await vercel.projects.getProjectDomains({
      idOrName: projectData.id,
    });
    const projectUrl = projectDomains.domains?.[0]?.name
      ? `https://${projectDomains.domains[0].name}`
      : null;

    await updateAppVercelProject({
      appId,
      projectId: projectData.id,
      projectName: projectData.name,
      teamId: teamId,
      deploymentUrl: projectUrl,
    });

    await autoSyncSupabaseEnvVarsIfConnected(appId);

    logger.info(`Successfully created Vercel project: ${projectData.id}`);

    if (hasGitHub) {
      logger.info(`Triggering first deployment for project: ${projectData.id}`);
      try {
        const deploymentData = await vercel.deployments.createDeployment({
          ...(teamId && { teamId }),
          requestBody: {
            name: projectData.name,
            project: projectData.id,
            target: "production",
            gitSource: {
              type: "github",
              org: app.githubOrg!,
              repo: app.githubRepo!,
              ref: app.githubBranch || "main",
            },
          },
        });

        if (deploymentData.url) {
          logger.info(`First deployment successful: ${deploymentData.url}`);
        } else {
          logger.warn("First deployment failed: No deployment URL returned");
        }
      } catch (deployError: unknown) {
        const message =
          deployError instanceof Error
            ? deployError.message
            : String(deployError);
        logger.warn(`First deployment failed with error: ${message}`);
      }
    } else {
      logger.info(
        `Project ${projectData.id} created without GitHub — use direct deploy to publish.`,
      );
    }
  } catch (err: any) {
    logger.error("[Vercel Handler] Failed to create project:", err);
    throw new Error(err.message || "Failed to create Vercel project.");
  }
}

async function uploadFilesToVercel(
  accessToken: string,
  teamId: string | null,
  files: CollectedFile[],
  onProgress: (uploaded: number) => void,
): Promise<void> {
  let uploaded = 0;
  const BATCH_SIZE = 10;

  for (let i = 0; i < files.length; i += BATCH_SIZE) {
    const batch = files.slice(i, i + BATCH_SIZE);

    await Promise.all(
      batch.map(async (file) => {
        const url = new URL(`${VERCEL_API_BASE}/v2/files`);
        if (teamId) {
          url.searchParams.set("teamId", teamId);
        }

        const response = await fetch(url.toString(), {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Length": String(file.size),
            "x-vercel-digest": file.sha1,
            "Content-Type": "application/octet-stream",
          },
          body: new Uint8Array(file.content),
        });

        if (!response.ok && response.status !== 409) {
          const errorText = await response.text();
          throw new Error(
            `File upload failed for ${file.filePath}: ${response.status} ${errorText}`,
          );
        }

        uploaded++;
        onProgress(uploaded);
      }),
    );
  }
}

async function pollDeploymentStatus(
  vercel: Vercel,
  deploymentId: string,
  onStatusChange: (readyState: string) => void,
): Promise<{ readyState: string; url: string | null }> {
  const MAX_ATTEMPTS = 120;
  const POLL_INTERVAL = 5000;
  let lastState = "";

  for (let i = 0; i < MAX_ATTEMPTS; i++) {
    const deployment = await vercel.deployments.getDeployment({
      idOrUrl: deploymentId,
    });

    const readyState = deployment.readyState || "UNKNOWN";

    if (readyState !== lastState) {
      lastState = readyState;
      onStatusChange(readyState);
    }

    if (readyState === "READY") {
      return { readyState, url: deployment.url || null };
    }

    if (readyState === "ERROR" || readyState === "CANCELED") {
      const errorMessage =
        "errorMessage" in deployment &&
        typeof deployment.errorMessage === "string"
          ? deployment.errorMessage
          : "Unknown error";
      throw new Error(
        `Deployment ${readyState.toLowerCase()}: ${errorMessage}`,
      );
    }

    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL));
  }

  throw new Error("Deployment timed out after 10 minutes.");
}

async function handleDirectDeploy(
  event: IpcMainInvokeEvent,
  { appId, production }: DirectDeployParams,
): Promise<void> {
  const sendProgress = (data: Record<string, unknown>) => {
    event.sender.send(vercelDeployStreamContract.events.chunk.channel, data);
  };
  const sendEnd = (data: Record<string, unknown>) => {
    event.sender.send(vercelDeployStreamContract.events.end.channel, data);
  };
  const sendError = (data: Record<string, unknown>) => {
    event.sender.send(vercelDeployStreamContract.events.error.channel, data);
  };

  try {
    const app = await db.query.apps.findFirst({ where: eq(apps.id, appId) });
    if (!app) {
      throw new Error("App not found.");
    }
    if (!app.vercelProjectId) {
      throw new Error("App must have a Vercel project. Create one first.");
    }


    // Sync Supabase env vars before every deploy (in case they were connected after project creation).
    // Non-fatal: the injected .env file provides a fallback if the project-level sync fails.
    try {
      await autoSyncSupabaseEnvVarsIfConnected(appId);
    } catch {
      // Error already logged inside autoSyncSupabaseEnvVarsIfConnected.
    }

    const accessToken = await getVercelAccessToken();
    const vercel = createVercelClient(accessToken);
    const appPath = getAnyonAppPath(app.path);

    let resolvedTeamId = app.vercelTeamId;
    if (!resolvedTeamId) {
      resolvedTeamId = getVercelTeamId();
    }
    if (!resolvedTeamId) {
      resolvedTeamId = await fetchAndStoreUserDefaultTeamId(accessToken);
    }

    sendProgress({
      appId,
      phase: "collecting",
      message: "Scanning project files...",
      progress: 0,
    });

    const { files, totalSize, fileCount } = await collectDeployFiles(
      appPath,
      (progress) => {
        sendProgress({
          appId,
          phase: "collecting",
          message: `Scanning files... (${progress.filesScanned} found)`,
          progress:
            progress.phase === "hashing" && progress.totalFiles > 0
              ? Math.round((progress.filesHashed / progress.totalFiles) * 100)
              : 0,
          totalFiles: progress.totalFiles,
        });
      },
    );

    logger.info(
      `Collected ${fileCount} files (${(totalSize / 1024 / 1024).toFixed(2)} MB) for direct deploy of app ${appId}`,
    );

    if (fileCount === 0) {
      throw new Error(
        "No files found to deploy. Check your project directory.",
      );
    }

    // Detect framework before upload so we can inject vercel.json if needed
    const detectedFramework = await detectFramework(appPath);

    // Inject vercel.json with SPA routing for client-side frameworks
    // that need catch-all rewrites to index.html. SSR frameworks (Next.js,
    // Nuxt, Remix, Astro) handle routing server-side and don't need this.
    const SPA_FRAMEWORKS: CreateProjectFramework[] = [
      "vite",
      "create-react-app",
      "vue",
      "svelte",
      "angular",
      "gatsby",
    ];

    const hasVercelJson = files.some((f) => f.filePath === "vercel.json");

    if (
      detectedFramework &&
      SPA_FRAMEWORKS.includes(detectedFramework) &&
      !hasVercelJson
    ) {
      const vercelJsonContent = JSON.stringify(
        {
          rewrites: [{ source: "/(.*)", destination: "/index.html" }],
        },
        null,
        2,
      );
      const contentBuffer = Buffer.from(vercelJsonContent, "utf-8");
      const sha1 = crypto
        .createHash("sha1")
        .update(contentBuffer)
        .digest("hex");

      files.push({
        filePath: "vercel.json",
        sha1,
        size: contentBuffer.length,
        content: contentBuffer,
      });

      logger.info(
        `Injected vercel.json with SPA routing for framework: ${detectedFramework}`,
      );
    }


    // Inject .env file with Supabase env vars so Vite has them at build time.
    // Project-level env vars set via the API are available during builds, but
    // build cache can serve stale artifacts that miss newly-added vars.
    // Including .env in the file upload guarantees Vite sees them regardless.
    if (app.supabaseProjectId) {
      try {
        const supabaseUrl = `https://${app.supabaseProjectId}.supabase.co`;
        const supabaseAnonKey = await getSupabasePublishableKey({
          projectId: app.supabaseProjectId,
          organizationSlug: app.supabaseOrganizationSlug,
        });

        const envLines = [
          `SUPABASE_URL=${supabaseUrl}`,
          `SUPABASE_ANON_KEY=${supabaseAnonKey}`,
          `VITE_SUPABASE_URL=${supabaseUrl}`,
          `VITE_SUPABASE_ANON_KEY=${supabaseAnonKey}`,
          `NEXT_PUBLIC_SUPABASE_URL=${supabaseUrl}`,
          `NEXT_PUBLIC_SUPABASE_ANON_KEY=${supabaseAnonKey}`,
          `ANYON_SUPABASE_URL=${supabaseUrl}`,
          `ANYON_SUPABASE_ANON_KEY=${supabaseAnonKey}`,
        ];

        const envContent = envLines.join("\n") + "\n";
        const envBuffer = Buffer.from(envContent, "utf-8");
        const envSha1 = crypto
          .createHash("sha1")
          .update(envBuffer)
          .digest("hex");

        // Remove any existing .env from collected files (shouldn't exist due to
        // SECURITY_DENY_PATTERNS, but guard against it to avoid duplicates).
        const envIdx = files.findIndex((f) => f.filePath === ".env");
        if (envIdx !== -1) {
          files.splice(envIdx, 1);
        }

        files.push({
          filePath: ".env",
          sha1: envSha1,
          size: envBuffer.length,
          content: envBuffer,
        });

        logger.info(
          `Injected .env file with Supabase env vars for deploy of app ${appId}`,
        );
      } catch (envError) {
        logger.warn(
          `Failed to inject .env file for app ${appId} (non-fatal, relying on project-level env vars):`,
          envError,
        );
      }
    }

    sendProgress({
      appId,
      phase: "uploading",
      message: `Uploading ${fileCount} files...`,
      progress: 0,
      totalFiles: fileCount,
      filesUploaded: 0,
    });

    await uploadFilesToVercel(
      accessToken,
      resolvedTeamId,
      files,
      (uploaded) => {
        sendProgress({
          appId,
          phase: "uploading",
          message: `Uploading files... (${uploaded}/${fileCount})`,
          progress: Math.round((uploaded / fileCount) * 100),
          totalFiles: fileCount,
          filesUploaded: uploaded,
        });
      },
    );

    sendProgress({
      appId,
      phase: "creating",
      message: "Creating deployment...",
      progress: 0,
    });

    const deploymentFiles = files.map((f) => ({
      file: f.filePath,
      sha: f.sha1,
      size: f.size,
    }));

    const buildSettings = getFrameworkBuildSettings(detectedFramework, appPath);

    const deploymentResponse = await vercel.deployments.createDeployment({
      ...(resolvedTeamId && { teamId: resolvedTeamId }),
      forceNew: "1",
      requestBody: {
        name: app.vercelProjectName || app.vercelProjectId,
        project: app.vercelProjectId,
        target: production !== false ? "production" : "preview",
        files: deploymentFiles,
        projectSettings: {
          framework: detectedFramework || null,
          buildCommand: buildSettings.buildCommand,
          outputDirectory: buildSettings.outputDirectory,
          installCommand: buildSettings.installCommand,
        },
      },
    });

    if (!deploymentResponse.id) {
      throw new Error("Deployment creation failed: no deployment ID returned.");
    }

    logger.info(`Deployment created: ${deploymentResponse.id}`);

    sendProgress({
      appId,
      phase: "building",
      message: "Building your app on Vercel...",
      progress: 0,
    });

    const result = await pollDeploymentStatus(
      vercel,
      deploymentResponse.id,
      (readyState) => {
        sendProgress({
          appId,
          phase: "building",
          message: `Build status: ${readyState}...`,
          progress:
            readyState === "BUILDING"
              ? 50
              : readyState === "INITIALIZING"
                ? 25
                : 10,
        });
      },
    );

    if (result.url) {
      const deploymentUrl = `https://${result.url}`;
      await db
        .update(apps)
        .set({ 
          vercelDeploymentUrl: deploymentUrl,
          vercelDeploymentId: deploymentResponse.id,
        })
        .where(eq(apps.id, appId));
    }

    sendEnd({
      appId,
      url: result.url ? `https://${result.url}` : "",
      deploymentId: deploymentResponse.id,
      readyState: result.readyState,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    logger.error("[Vercel Direct Deploy] Failed:", err);
    sendError({
      appId,
      error: message,
      phase: "unknown",
    });
  }
}

// --- Vercel Connect to Existing Project Handler ---
async function handleConnectToExistingProject(
  event: IpcMainInvokeEvent,
  { projectId, appId }: ConnectToExistingVercelProjectParams,
): Promise<void> {
  try {
    const accessToken = await getVercelAccessToken();

    logger.info(
      `Connecting to existing Vercel project: ${projectId} for app ${appId}`,
    );

    // Resolve teamId first so we can scope the project lookup
    let teamId = getVercelTeamId();
    if (!teamId) {
      teamId = await fetchAndStoreUserDefaultTeamId(accessToken);
    }

    // Verify the project exists and get its details
    const response = await getVercelProjects(accessToken, { teamId });
    const projectData = response.projects?.find(
      (p) => p.id === projectId || p.name === projectId,
    );

    if (!projectData) {
      throw new Error("Project not found. Please check the project ID.");
    }

    await updateAppVercelProject({
      appId,
      projectId: projectData.id,
      projectName: projectData.name,
      teamId,
      deploymentUrl: projectData.targets?.production?.url
        ? `https://${projectData.targets.production.url}`
        : null,
    });

    await autoSyncSupabaseEnvVarsIfConnected(appId);

    logger.info(`Successfully connected to Vercel project: ${projectData.id}`);
  } catch (err: any) {
    logger.error(
      "[Vercel Handler] Failed to connect to existing project:",
      err,
    );
    throw new Error(err.message || "Failed to connect to existing project.");
  }
}

// --- Vercel Get Deployments Handler ---
async function handleGetVercelDeployments(
  event: IpcMainInvokeEvent,
  { appId }: GetVercelDeploymentsParams,
): Promise<VercelDeployment[]> {
  try {
    const accessToken = await getVercelAccessToken();

    const app = await db.query.apps.findFirst({ where: eq(apps.id, appId) });
    if (!app || !app.vercelProjectId) {
      throw new Error("App is not linked to a Vercel project.");
    }

    logger.info(
      `Getting deployments for Vercel project: ${app.vercelProjectId} for app ${appId}`,
    );

    const vercel = createVercelClient(accessToken);

    // Get deployments for the project
    const deploymentsResponse = await vercel.deployments.getDeployments({
      projectId: app.vercelProjectId,
      limit: 5, // Get last 5 deployments
    });

    if (!deploymentsResponse.deployments) {
      throw new Error("Failed to retrieve deployments from Vercel.");
    }

    // Find the most recent READY production deployment and update the stored URL
    const readyProductionDeployment = deploymentsResponse.deployments.find(
      (d) => d.readyState === "READY" && d.target === "production",
    );

    if (readyProductionDeployment?.url) {
      const newDeploymentUrl = `https://${readyProductionDeployment.url}`;
      // Only update if the URL has changed
      if (newDeploymentUrl !== app.vercelDeploymentUrl) {
        logger.info(
          `Updating deployment URL for app ${appId}: ${app.vercelDeploymentUrl} -> ${newDeploymentUrl}`,
        );
        await db
          .update(apps)
          .set({ vercelDeploymentUrl: newDeploymentUrl })
          .where(eq(apps.id, appId));
      }
    }

    // Map deployments to our interface format
    return deploymentsResponse.deployments.map((deployment) => ({
      uid: deployment.uid,
      url: deployment.url,
      state: deployment.state || "unknown",
      createdAt: deployment.createdAt || 0,
      target: deployment.target || "production",
      readyState: deployment.readyState || "unknown",
    }));
  } catch (err: any) {
    logger.error("[Vercel Handler] Failed to get deployments:", err);
    throw new Error(err.message || "Failed to get Vercel deployments.");
  }
}

async function handleDisconnectVercelProject(
  event: IpcMainInvokeEvent,
  { appId }: DisconnectVercelProjectParams,
): Promise<void> {
  logger.log(`Disconnecting Vercel project for appId: ${appId}`);

  const app = await db.query.apps.findFirst({
    where: eq(apps.id, appId),
  });

  if (!app) {
    throw new Error("App not found");
  }

  // Update app in database to remove Vercel project info
  await db
    .update(apps)
    .set({
      vercelProjectId: null,
      vercelProjectName: null,
      vercelTeamId: null,
      vercelDeploymentUrl: null,
      vercelDeploymentId: null,
    })
    .where(eq(apps.id, appId));
}

// --- Registration ---
export function registerVercelHandlers() {
  // DO NOT LOG this handler because tokens are sensitive
  createTypedHandler(vercelContracts.saveToken, async (event, params) => {
    await handleSaveVercelToken(event, params);
  });

  createTypedHandler(vercelContracts.startDeviceAuth, async () => {
    return handleStartDeviceAuth();
  });

  createTypedHandler(vercelContracts.pollDeviceAuth, async () => {
    return handlePollDeviceAuth();
  });

  createTypedHandler(vercelContracts.listProjects, async () => {
    return handleListVercelProjects();
  });

  createTypedHandler(
    vercelContracts.isProjectAvailable,
    async (event, params) => {
      return handleIsProjectAvailable(event, params);
    },
  );

  createTypedHandler(vercelContracts.createProject, async (event, params) => {
    await handleCreateProject(event, params);
  });

  createTypedHandler(
    vercelContracts.connectExistingProject,
    async (event, params) => {
      await handleConnectToExistingProject(event, params);
    },
  );

  createTypedHandler(vercelContracts.getDeployments, async (event, params) => {
    return handleGetVercelDeployments(event, params);
  });

  createTypedHandler(vercelContracts.disconnect, async (event, params) => {
    await handleDisconnectVercelProject(event, params);
  });

  createTypedHandler(vercelContracts.syncSupabaseEnv, async (event, params) => {
    await handleSyncSupabaseEnvVars(event, params);
  });

  ipcMain.handle(vercelDeployStreamContract.channel, async (event, params) => {
    const parsed = DirectDeployParamsSchema.parse(params);
    await handleDirectDeploy(event, parsed);
  });

  createTypedHandler(vercelContracts.triggerDeploy, async (event, params) => {
    await handleDirectDeploy(event, { ...params, production: true });
  });

  logger.debug("Registered Vercel IPC handlers");
}

export async function updateAppVercelProject({
  appId,
  projectId,
  projectName,
  teamId,
  deploymentUrl,
}: {
  appId: number;
  projectId: string;
  projectName: string;
  teamId: string | null;
  deploymentUrl?: string | null;
}): Promise<void> {
  await db
    .update(schema.apps)
    .set({
      vercelProjectId: projectId,
      vercelProjectName: projectName,
      vercelTeamId: teamId,
      vercelDeploymentUrl: deploymentUrl,
    })
    .where(eq(schema.apps.id, appId));
}
