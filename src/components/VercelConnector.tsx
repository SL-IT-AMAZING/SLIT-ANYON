import { Button } from "@/components/ui/button";
import {} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useDeepLink } from "@/contexts/DeepLinkContext";
import { useLoadApp } from "@/hooks/useLoadApp";
import { useSettings } from "@/hooks/useSettings";
import { useVercelDeployments } from "@/hooks/useVercelDeployments";
import { type App, ipc } from "@/ipc/types";
import { Globe } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

interface VercelConnectorProps {
  appId: number | null;
  folderName: string;
  onProjectCreated?: () => void;
}

interface VercelProject {
  id: string;
  name: string;
  framework?: string | null;
}

interface ConnectedVercelConnectorProps {
  appId: number;
  app: App;
  refreshApp: () => void;
}

interface UnconnectedVercelConnectorProps {
  appId: number | null;
  folderName: string;
  settings: any;
  refreshSettings: () => void;
  refreshApp: () => void;
  onProjectCreated?: () => void;
}

/** Sanitize a string into a Vercel-compatible project name */
function sanitizeVercelProjectName(name: string): string {
  return name
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9._-]/g, "")
    .replace(/-{3,}/g, "--")
    .replace(/^-+|-+$/g, "")
    .slice(0, 100);
}

/** Validate a project name against Vercel's rules. Returns error string or null. */
function validateVercelProjectName(name: string): string | null {
  if (!name) return "Project name is required.";
  if (name.length > 100) return "Project name must be 100 characters or less.";
  if (name !== name.toLowerCase()) return "Project name must be lowercase.";
  if (/[^a-z0-9._-]/.test(name))
    return "Project name can only contain lowercase letters, digits, '.', '_', and '-'.";
  if (name.includes("---")) return "Project name cannot contain '---'.";
  return null;
}

function ConnectedVercelConnector({
  appId,
  app,
  refreshApp,
}: ConnectedVercelConnectorProps) {
  const { t } = useTranslation("app");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const {
    deployments,
    isLoading: isLoadingDeployments,
    error: deploymentsError,
    getDeployments,
    disconnectProject,
    isDisconnecting,
    disconnectError,
  } = useVercelDeployments(appId);

  const handleGetDeployments = async () => {
    setIsRefreshing(true);
    try {
      const minLoadingTime = new Promise((resolve) => setTimeout(resolve, 750));
      await Promise.all([getDeployments(), minLoadingTime]);
      // Refresh app data to get the updated deployment URL
      refreshApp();
    } finally {
      setIsRefreshing(false);
    }
  };

  const isLoadingOrRefreshing = isLoadingDeployments || isRefreshing;

  const handleDisconnectProject = async () => {
    await disconnectProject();
    refreshApp();
  };

  return (
    <div
      className="mt-4 w-full rounded-md"
      data-testid="vercel-connected-project"
    >
      <p className="text-sm text-muted-foreground">
        {t("connect.vercel.connectedToProject")}
      </p>
      <a
        onClick={(e) => {
          e.preventDefault();
          ipc.system.openExternalUrl(
            `https://vercel.com/${app.vercelTeamSlug}/${app.vercelProjectName}`,
          );
        }}
        className="cursor-pointer text-blue-600 hover:underline dark:text-blue-400"
        target="_blank"
        rel="noopener noreferrer"
      >
        {app.vercelProjectName}
      </a>
      {app.vercelDeploymentUrl && (
        <div className="mt-2">
          <p className="text-sm text-muted-foreground">
            {t("connect.vercel.liveUrl")}{" "}
            <a
              onClick={(e) => {
                e.preventDefault();
                if (app.vercelDeploymentUrl) {
                  ipc.system.openExternalUrl(app.vercelDeploymentUrl);
                }
              }}
              className="cursor-pointer text-blue-600 hover:underline dark:text-blue-400 font-mono"
              target="_blank"
              rel="noopener noreferrer"
            >
              {app.vercelDeploymentUrl}
            </a>
          </p>
        </div>
      )}
      <div className="mt-2 flex gap-2">
        <Button onClick={handleGetDeployments} disabled={isLoadingOrRefreshing}>
          {isLoadingOrRefreshing ? (
            <>
              <svg
                className="animate-spin h-5 w-5 mr-2 inline"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                style={{ display: "inline" }}
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              {t("buttons.refreshing", { ns: "common" })}
            </>
          ) : (
            t("connect.vercel.refreshDeployments")
          )}
        </Button>
        <Button
          onClick={handleDisconnectProject}
          disabled={isDisconnecting}
          variant="outline"
        >
          {isDisconnecting
            ? t("buttons.disconnecting", { ns: "common" })
            : t("connect.vercel.disconnectFromProject")}
        </Button>
      </div>
      {deploymentsError && (
        <div className="mt-2">
          <p className="text-red-600">{deploymentsError}</p>
        </div>
      )}
      {deployments.length > 0 && (
        <div className="mt-4">
          <h4 className="font-medium mb-2">Recent Deployments:</h4>
          <div className="space-y-2">
            {deployments.map((deployment) => (
              <div key={deployment.uid} className="bg-muted rounded-md p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        deployment.readyState === "READY"
                          ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300"
                          : deployment.readyState === "BUILDING"
                            ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300"
                            : "bg-muted text-foreground"
                      }`}
                    >
                      {deployment.readyState}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {new Date(deployment.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <a
                    onClick={(e) => {
                      e.preventDefault();
                      ipc.system.openExternalUrl(`https://${deployment.url}`);
                    }}
                    className="cursor-pointer text-blue-600 hover:underline dark:text-blue-400 text-sm"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Globe className="h-4 w-4 inline mr-1" />
                    View
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      {disconnectError && (
        <p className="text-red-600 mt-2">{disconnectError}</p>
      )}
    </div>
  );
}

function UnconnectedVercelConnector({
  appId,
  folderName,
  settings,
  refreshSettings,
  refreshApp,
  onProjectCreated,
}: UnconnectedVercelConnectorProps) {
  const { t } = useTranslation("app");
  const { lastDeepLink, clearLastDeepLink } = useDeepLink();

  // --- Manual Token Entry State ---
  const [accessToken, setAccessToken] = useState("");
  const [isSavingToken, setIsSavingToken] = useState(false);
  const [tokenError, setTokenError] = useState<string | null>(null);
  const [tokenSuccess, setTokenSuccess] = useState(false);
  const [showManualToken, setShowManualToken] = useState(false);
  const [deviceAuthState, setDeviceAuthState] = useState<{
    userCode: string;
    verificationUriComplete: string;
    interval: number;
    expiresAt: number;
  } | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectError, setConnectError] = useState<string | null>(null);

  // --- Project Setup State ---
  const [projectSetupMode, setProjectSetupMode] = useState<
    "create" | "existing"
  >("create");
  const [availableProjects, setAvailableProjects] = useState<VercelProject[]>(
    [],
  );
  const [isLoadingProjects, setIsLoadingProjects] = useState(false);
  const [selectedProject, setSelectedProject] = useState<string>("");

  // Create new project state
  const [projectName, setProjectName] = useState(
    sanitizeVercelProjectName(folderName),
  );
  const [projectAvailable, setProjectAvailable] = useState<boolean | null>(
    null,
  );
  const [projectCheckError, setProjectCheckError] = useState<string | null>(
    null,
  );
  const [isCheckingProject, setIsCheckingProject] = useState(false);
  const [isCreatingProject, setIsCreatingProject] = useState(false);
  const [createProjectError, setCreateProjectError] = useState<string | null>(
    null,
  );
  const [createProjectSuccess, setCreateProjectSuccess] =
    useState<boolean>(false);

  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const hasVercelToken =
    !!settings?.vercel?.accessToken || !!settings?.vercelAccessToken;

  useEffect(() => {
    const handleDeepLink = async () => {
      if (lastDeepLink?.type === "vercel-oauth-return") {
        await refreshSettings();
        refreshApp();
        toast.success(t("connect.vercel.connected"));
        clearLastDeepLink();
      }
    };
    handleDeepLink();
  }, [lastDeepLink?.type, clearLastDeepLink, refreshApp, refreshSettings, t]);

  useEffect(() => {
    if (!deviceAuthState) {
      return;
    }

    let isMounted = true;
    let isPolling = false;
    const poll = async () => {
      if (isPolling || !isMounted) {
        return;
      }

      isPolling = true;
      try {
        const result = await ipc.vercel.pollDeviceAuth();
        if (!isMounted) {
          return;
        }

        if (result.status === "success") {
          setDeviceAuthState(null);
          setIsConnecting(false);
          setConnectError(null);
          await refreshSettings();
          refreshApp();
          toast.success("Successfully connected to Vercel!");
          return;
        }

        if (result.status === "expired") {
          setDeviceAuthState(null);
          setIsConnecting(false);
          setConnectError("Device authorization expired. Please try again.");
          return;
        }

        if (result.status === "denied") {
          setDeviceAuthState(null);
          setIsConnecting(false);
          setConnectError("Authorization was denied. Please try again.");
          return;
        }

        if (result.status === "error") {
          setDeviceAuthState(null);
          setIsConnecting(false);
          setConnectError(
            result.error || "Failed to complete Vercel device authorization.",
          );
        }
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setDeviceAuthState(null);
        setIsConnecting(false);
        setConnectError(
          error instanceof Error
            ? error.message
            : "Failed to poll Vercel authorization status.",
        );
      } finally {
        isPolling = false;
      }
    };

    const intervalId = setInterval(poll, deviceAuthState.interval * 1000);
    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, [deviceAuthState, refreshApp, refreshSettings]);

  // Load available projects when Vercel is connected
  useEffect(() => {
    if (hasVercelToken && projectSetupMode === "existing") {
      loadAvailableProjects();
    }
  }, [hasVercelToken, projectSetupMode]);

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []);

  const loadAvailableProjects = async () => {
    setIsLoadingProjects(true);
    try {
      const projects = await ipc.vercel.listProjects();
      setAvailableProjects(projects);
    } catch (error) {
      console.error("Failed to load Vercel projects:", error);
    } finally {
      setIsLoadingProjects(false);
    }
  };

  const handleSaveAccessToken = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken.trim()) return;

    setIsSavingToken(true);
    setTokenError(null);
    setTokenSuccess(false);

    try {
      await ipc.vercel.saveToken({
        token: accessToken.trim(),
      });
      setTokenSuccess(true);
      setAccessToken("");
      refreshSettings();
    } catch (err: any) {
      setTokenError(err.message || "Failed to save access token.");
    } finally {
      setIsSavingToken(false);
    }
  };

  const handleStartDeviceAuth = async () => {
    setConnectError(null);
    setTokenError(null);
    setTokenSuccess(false);
    setIsConnecting(true);

    try {
      const start = await ipc.vercel.startDeviceAuth();
      setDeviceAuthState({
        userCode: start.userCode,
        verificationUriComplete: start.verificationUriComplete,
        interval: start.interval,
        expiresAt: Date.now() + start.expiresIn * 1000,
      });
      await ipc.system.openExternalUrl(start.verificationUriComplete);
    } catch (error) {
      setIsConnecting(false);
      setDeviceAuthState(null);
      setConnectError(
        error instanceof Error
          ? error.message
          : "Failed to start Vercel device authorization.",
      );
    }
  };

  const checkProjectAvailability = useCallback(async (name: string) => {
    setProjectCheckError(null);
    setProjectAvailable(null);
    if (!name) return;

    const validationError = validateVercelProjectName(name);
    if (validationError) {
      setProjectAvailable(false);
      setProjectCheckError(validationError);
      return;
    }

    setIsCheckingProject(true);
    try {
      const result = await ipc.vercel.isProjectAvailable({
        name,
      });
      setProjectAvailable(result.available);
      if (!result.available) {
        setProjectCheckError(result.error || "Project name is not available.");
      }
    } catch (err: any) {
      setProjectCheckError(
        err.message || "Failed to check project availability.",
      );
    } finally {
      setIsCheckingProject(false);
    }
  }, []);

  const debouncedCheckProjectAvailability = useCallback(
    (name: string) => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
      debounceTimeoutRef.current = setTimeout(() => {
        checkProjectAvailability(name);
      }, 500);
    },
    [checkProjectAvailability],
  );

  const handleSetupProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!appId) return;

    setCreateProjectError(null);
    setIsCreatingProject(true);
    setCreateProjectSuccess(false);

    try {
      if (projectSetupMode === "create") {
        await ipc.vercel.createProject({
          name: projectName,
          appId,
        });
      } else {
        await ipc.vercel.connectExistingProject({
          projectId: selectedProject,
          appId,
        });
      }
      setCreateProjectSuccess(true);
      setProjectCheckError(null);
      refreshApp();
      onProjectCreated?.();
    } catch (err: any) {
      setCreateProjectError(
        err.message ||
          `Failed to ${projectSetupMode === "create" ? "create" : "connect to"} project.`,
      );
    } finally {
      setIsCreatingProject(false);
    }
  };

  if (!hasVercelToken) {
    return (
      <div className="mt-1 w-full" data-testid="vercel-unconnected-project">
        <div className="w-full">
          <div className="flex items-center gap-2 mb-4">
            <h3 className="font-medium">Connect to Vercel</h3>
          </div>

          <div className="space-y-4">
            <Button
              onClick={handleStartDeviceAuth}
              variant="outline"
              className="w-full h-10"
              disabled={isConnecting}
              data-testid="connect-vercel-button"
            >
              {deviceAuthState
                ? `Opening browser... Enter code: ${deviceAuthState.userCode}`
                : isConnecting
                  ? "Opening browser..."
                  : "Connect to Vercel"}
            </Button>

            {deviceAuthState && (
              <div className="rounded-md border border-border bg-muted/40 p-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <svg
                    className="h-4 w-4 animate-spin"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                  Waiting for authorization...
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  Enter this code in your browser:
                </p>
                <p className="mt-1 font-mono text-lg font-semibold tracking-wider">
                  {deviceAuthState.userCode}
                </p>
              </div>
            )}

            {connectError && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-3">
                <p className="text-sm text-red-800 dark:text-red-200">
                  {connectError}
                </p>
              </div>
            )}

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">or</span>
              </div>
            </div>

            {showManualToken ? (
              <>
                <form onSubmit={handleSaveAccessToken} className="space-y-3">
                  <div>
                    <Label className="block text-sm font-medium mb-1">
                      Vercel Access Token
                    </Label>
                    <Input
                      type="password"
                      placeholder="Enter your Vercel access token"
                      value={accessToken}
                      onChange={(e) => setAccessToken(e.target.value)}
                      disabled={isSavingToken}
                      className="w-full"
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button
                      type="submit"
                      disabled={!accessToken.trim() || isSavingToken}
                      className="flex-1"
                    >
                      {isSavingToken ? "Saving Token..." : "Save Access Token"}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowManualToken(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>

                {tokenError && (
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-3">
                    <p className="text-sm text-red-800 dark:text-red-200">
                      {tokenError}
                    </p>
                  </div>
                )}

                {tokenSuccess && (
                  <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md p-3">
                    <p className="text-sm text-green-800 dark:text-green-200">
                      Successfully connected to Vercel! You can now set up your
                      project below.
                    </p>
                  </div>
                )}
              </>
            ) : (
              <Button
                variant="ghost"
                className="w-full text-sm text-muted-foreground"
                onClick={() => setShowManualToken(true)}
              >
                Use manual access token instead
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-4 w-full rounded-md" data-testid="vercel-setup-project">
      {/* Collapsible Header */}
      <div className="font-medium mb-2">Set up your Vercel project</div>

      {/* Collapsible Content */}
      <div className="overflow-hidden transition-all duration-300 ease-in-out">
        <div className="pt-0 space-y-4">
          {/* Mode Selection */}
          <div>
            <div className="flex rounded-md border border-border">
              <Button
                type="button"
                variant={projectSetupMode === "create" ? "default" : "ghost"}
                className={`flex-1 rounded-none rounded-l-md border-0 ${
                  projectSetupMode === "create"
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-accent"
                }`}
                onClick={() => {
                  setProjectSetupMode("create");
                  setCreateProjectError(null);
                  setCreateProjectSuccess(false);
                }}
              >
                Create new project
              </Button>
              <Button
                type="button"
                variant={projectSetupMode === "existing" ? "default" : "ghost"}
                className={`flex-1 rounded-none rounded-r-md border-0 border-l border-border ${
                  projectSetupMode === "existing"
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-accent"
                }`}
                onClick={() => {
                  setProjectSetupMode("existing");
                  setCreateProjectError(null);
                  setCreateProjectSuccess(false);
                }}
              >
                Connect to existing project
              </Button>
            </div>
          </div>

          <form className="space-y-4" onSubmit={handleSetupProject}>
            {projectSetupMode === "create" ? (
              <>
                <div>
                  <Label className="block text-sm font-medium">
                    Project Name
                  </Label>
                  <Input
                    data-testid="vercel-create-project-name-input"
                    className="w-full mt-1"
                    value={projectName}
                    onChange={(e) => {
                      const newValue = e.target.value;
                      setProjectName(newValue);
                      setProjectAvailable(null);
                      setProjectCheckError(null);
                      debouncedCheckProjectAvailability(newValue);
                    }}
                    disabled={isCreatingProject}
                  />
                  {isCheckingProject && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Checking availability...
                    </p>
                  )}
                  {projectAvailable === true && (
                    <p className="text-xs text-green-600 mt-1">
                      Project name is available!
                    </p>
                  )}
                  {projectAvailable === false && (
                    <p className="text-xs text-red-600 mt-1">
                      {projectCheckError}
                    </p>
                  )}
                </div>
              </>
            ) : (
              <>
                <div>
                  <Label className="block text-sm font-medium">
                    Select Project
                  </Label>
                  <Select
                    value={selectedProject}
                    onValueChange={(v) => setSelectedProject(v ?? "")}
                    disabled={isLoadingProjects}
                  >
                    <SelectTrigger
                      className="w-full mt-1"
                      data-testid="vercel-project-select"
                    >
                      <SelectValue
                        placeholder={
                          isLoadingProjects
                            ? "Loading projects..."
                            : "Select a project"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {availableProjects.map((project) => (
                        <SelectItem key={project.id} value={project.id}>
                          {project.name}{" "}
                          {project.framework && `(${project.framework})`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            <Button
              type="submit"
              disabled={
                isCreatingProject ||
                (projectSetupMode === "create" &&
                  (projectAvailable === false || !projectName)) ||
                (projectSetupMode === "existing" && !selectedProject)
              }
            >
              {isCreatingProject
                ? projectSetupMode === "create"
                  ? "Creating..."
                  : "Connecting..."
                : projectSetupMode === "create"
                  ? "Create Project"
                  : "Connect to Project"}
            </Button>
          </form>

          {createProjectError && (
            <p className="text-red-600 mt-2">{createProjectError}</p>
          )}
          {createProjectSuccess && (
            <p className="text-green-600 mt-2">
              {projectSetupMode === "create"
                ? "Project created and linked!"
                : "Connected to project!"}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export function VercelConnector({
  appId,
  folderName,
  onProjectCreated,
}: VercelConnectorProps) {
  const { app, refreshApp } = useLoadApp(appId);
  const { settings, refreshSettings } = useSettings();

  if (app?.vercelProjectId && appId) {
    return (
      <ConnectedVercelConnector
        appId={appId}
        app={app}
        refreshApp={refreshApp}
      />
    );
  }

  return (
    <UnconnectedVercelConnector
      appId={appId}
      folderName={folderName}
      settings={settings}
      refreshSettings={refreshSettings}
      refreshApp={refreshApp}
      onProjectCreated={onProjectCreated}
    />
  );
}
