import { selectedAppIdAtom } from "@/atoms/appAtoms";
import { DeployProgress } from "@/components/DeployProgress";
import { GitHubConnector } from "@/components/GitHubConnector";
import { GithubCollaboratorManager } from "@/components/GithubCollaboratorManager";
import { VercelConnector } from "@/components/VercelConnector";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useDirectDeploy } from "@/hooks/useDirectDeploy";
import { useLoadApp } from "@/hooks/useLoadApp";
import { useAtomValue } from "jotai";
import { ChevronRight } from "lucide-react";
import { useState } from "react";

export const PublishPanel = () => {
  const selectedAppId = useAtomValue(selectedAppIdAtom);
  const { app, loading } = useLoadApp(selectedAppId);
  const deploy = useDirectDeploy(selectedAppId);
  const [showAdvanced, setShowAdvanced] = useState(false);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
          <svg
            className="w-6 h-6 text-blue-600 dark:text-blue-400 animate-spin"
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
              d="m4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 0 1 4 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-foreground">Loading...</h2>
      </div>
    );
  }

  if (!selectedAppId || !app) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
          <svg
            className="w-6 h-6 text-muted-foreground"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
            />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-foreground">
          No App Selected
        </h2>
        <p className="text-muted-foreground max-w-md">
          Select an app to view publishing options.
        </p>
      </div>
    );
  }

  const hasVercelProject = !!app.vercelProjectId;
  const canDeploy = hasVercelProject && deploy.phase === "idle";
  const isDeployActive = deploy.phase !== "idle";

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="p-4 space-y-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground mb-2">
            Publish App
          </h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M24 22.525H0l12-21.05 12 21.05z" />
              </svg>
              Deploy
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Publish your app by deploying it to Vercel.
            </p>

            <VercelConnector appId={selectedAppId} folderName={app.name} />

            {canDeploy && (
              <Button onClick={deploy.startDeploy} className="w-full" size="lg">
                {app.vercelDeploymentUrl ? "Redeploy" : "Publish"}
              </Button>
            )}

            {isDeployActive && (
              <DeployProgress
                phase={deploy.phase}
                message={deploy.message}
                progress={deploy.progress}
                totalFiles={deploy.totalFiles}
                filesUploaded={deploy.filesUploaded}
                deploymentUrl={deploy.deploymentUrl}
                error={deploy.error}
                onRetry={deploy.startDeploy}
                onDismiss={deploy.reset}
              />
            )}
          </CardContent>
        </Card>

        <div className="rounded-lg border border-border">
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex w-full items-center justify-between p-4 text-left"
          >
            <span className="text-sm font-medium text-muted-foreground">
              Advanced: Version Control
            </span>
            <ChevronRight
              className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${
                showAdvanced ? "rotate-90" : ""
              }`}
            />
          </button>
          {showAdvanced && (
            <div className="space-y-4 px-4 pb-4">
              <p className="text-sm text-muted-foreground">
                Sync your code to GitHub for collaboration.
              </p>
              <GitHubConnector
                appId={selectedAppId}
                folderName={app.name}
                expanded={true}
              />
              {app.githubOrg && app.githubRepo && (
                <div className="border-t border-border pt-4">
                  <GithubCollaboratorManager appId={selectedAppId} />
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
