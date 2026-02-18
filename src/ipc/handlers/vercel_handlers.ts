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
import { writeSettings } from "../../main/settings";
import { getVercelAccessToken } from "../../vercel_admin/vercel_management_client";
import {
  type ConnectToExistingVercelProjectParams,
  type CreateVercelProjectParams,
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
  serverUrl: "SUPABASE_URL",
  serverAnonKey: "SUPABASE_ANON_KEY",
} as const;

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
  options?: { search?: string },
): Promise<GetVercelProjectsResponse> {
  const url = new URL(`${VERCEL_API_BASE}/v9/projects`);
  if (options?.search) {
    url.searchParams.set("search", options.search);
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

async function getDefaultTeamId(token: string): Promise<string> {
  try {
    const response = await fetch(`${VERCEL_API_BASE}/v2/teams?limit=1`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(
        `Failed to fetch teams: ${response.status} ${response.statusText}`,
      );
    }

    const data = await response.json();

    // Use the first team (typically the personal account or default team)
    if (data.teams && data.teams.length > 0) {
      return data.teams[0].id;
    }

    throw new Error("No teams found for this user");
  } catch (error) {
    logger.error("Error getting default team ID:", error);
    throw new Error("Failed to get team information");
  }
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

async function getSupabasePublishableKey({
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

  await retryWithRateLimit(
    () =>
      vercel.projects.createProjectEnv({
        idOrName: vercelProjectId,
        teamId: app.vercelTeamId ?? undefined,
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

  if (!app?.supabaseProjectId || !app.vercelProjectId) {
    return;
  }

  try {
    await syncSupabaseEnvVarsForApp(appId);
  } catch (error) {
    logger.warn(
      `Automatic Supabase->Vercel env sync failed for app ${appId}:`,
      error,
    );
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

    logger.log("Successfully saved Vercel access token.");
  } catch (error: any) {
    logger.error("Error saving Vercel token:", error);
    throw new Error(`Failed to save access token: ${error.message}`);
  }
}

// --- Vercel List Projects Handler ---
async function handleListVercelProjects(): Promise<VercelProject[]> {
  try {
    const accessToken = await getVercelAccessToken();
    const response = await getVercelProjects(accessToken);

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

    // Check if project name is available by searching for projects with that name
    const response = await getVercelProjects(accessToken, { search: name });

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

    const projectData = hasGitHub
      ? await vercel.projects.createProject({
          requestBody: {
            name: name,
            gitRepository: {
              type: "github",
              repo: `${app.githubOrg}/${app.githubRepo}`,
            },
            framework: detectedFramework,
          },
        })
      : await vercel.projects.createProject({
          requestBody: {
            name: name,
            framework: detectedFramework,
          },
        });
    if (!projectData.id) {
      throw new Error("Failed to create project: No project ID returned.");
    }

    // Get the default team ID
    const teamId = await getDefaultTeamId(accessToken);

    const projectDomains = await vercel.projects.getProjectDomains({
      idOrName: projectData.id,
    });
    const projectUrl = projectDomains.domains?.[0]?.name
      ? `https://${projectDomains.domains[0].name}`
      : null;

    // Store project info in the app's DB row
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

    const accessToken = await getVercelAccessToken();
    const vercel = createVercelClient(accessToken);
    const appPath = getAnyonAppPath(app.path);

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
      app.vercelTeamId,
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

    const detectedFramework = await detectFramework(appPath);

    const deploymentFiles = files.map((f) => ({
      file: f.filePath,
      sha: f.sha1,
      size: f.size,
    }));

    const deploymentResponse = await vercel.deployments.createDeployment({
      ...(app.vercelTeamId && { teamId: app.vercelTeamId }),
      requestBody: {
        name: app.vercelProjectName || app.vercelProjectId,
        project: app.vercelProjectId,
        target: production !== false ? "production" : "preview",
        files: deploymentFiles,
        projectSettings: {
          framework: detectedFramework || null,
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
        .set({ vercelDeploymentUrl: deploymentUrl })
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

    // Verify the project exists and get its details
    const response = await getVercelProjects(accessToken);
    const projectData = response.projects?.find(
      (p) => p.id === projectId || p.name === projectId,
    );

    if (!projectData) {
      throw new Error("Project not found. Please check the project ID.");
    }

    // Get the default team ID
    const teamId = await getDefaultTeamId(accessToken);

    // Store project info in the app's DB row
    await updateAppVercelProject({
      appId,
      projectId: projectData.id,
      projectName: projectData.name,
      teamId: teamId,
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
    })
    .where(eq(apps.id, appId));
}

// --- Registration ---
export function registerVercelHandlers() {
  // DO NOT LOG this handler because tokens are sensitive
  createTypedHandler(vercelContracts.saveToken, async (event, params) => {
    await handleSaveVercelToken(event, params);
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
  teamId: string;
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
