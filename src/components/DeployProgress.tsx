import type { DeployPhase } from "@/hooks/useDirectDeploy";
import { ipc } from "@/ipc/types";

interface DeployProgressProps {
  phase: DeployPhase;
  message: string;
  progress: number;
  totalFiles: number;
  filesUploaded: number;
  deploymentUrl: string | null;
  deploymentId: string | null;
  projectName: string | null;
  teamSlug: string | null;
  error: string | null;
  onRetry: () => void;
  onDismiss: () => void;
}

const PHASE_STEPS: { key: DeployPhase; label: string }[] = [
  { key: "collecting", label: "Collect" },
  { key: "uploading", label: "Upload" },
  { key: "creating", label: "Create" },
  { key: "building", label: "Build" },
  { key: "ready", label: "Live" },
];

function getPhaseIndex(phase: DeployPhase): number {
  const idx = PHASE_STEPS.findIndex((s) => s.key === phase);
  return idx === -1 ? 0 : idx;
}

export function DeployProgress({
  phase,
  message,
  progress,
  deploymentUrl,
  deploymentId,
  projectName,
  teamSlug,
  error,
  onRetry,
  onDismiss,
}: DeployProgressProps) {
  const currentIndex = getPhaseIndex(phase);
  const isComplete = phase === "ready";
  const isError = phase === "error";
  const isActive = !isComplete && !isError && phase !== "idle";

  return (
    <div className="space-y-3">
      {isActive && (
        <div className="flex items-center justify-between px-1">
          {PHASE_STEPS.map((step, i) => {
            const isStepComplete = i < currentIndex;
            const isStepActive = i === currentIndex;

            return (
              <div key={step.key} className="flex items-center gap-1.5">
                <div
                  className={`h-2 w-2 rounded-full transition-colors ${
                    isStepComplete
                      ? "bg-green-500"
                      : isStepActive
                        ? "animate-pulse bg-blue-500"
                        : "bg-muted-foreground/30"
                  }`}
                />
                <span
                  className={`text-xs ${
                    isStepComplete
                      ? "text-green-600 dark:text-green-400"
                      : isStepActive
                        ? "font-medium text-foreground"
                        : "text-muted-foreground"
                  }`}
                >
                  {step.label}
                </span>
                {i < PHASE_STEPS.length - 1 && (
                  <div
                    className={`h-px w-6 ${
                      isStepComplete ? "bg-green-500" : "bg-muted-foreground/30"
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>
      )}

      {isActive && (
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-blue-500 transition-all duration-300"
            style={{ width: `${Math.max(progress, 2)}%` }}
          />
        </div>
      )}

      {isActive && <p className="text-xs text-muted-foreground">{message}</p>}

      {isComplete && deploymentUrl && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-3 dark:border-green-800 dark:bg-green-950/30">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium text-green-700 dark:text-green-300">
                Deployed successfully!
              </p>
              <p className="max-w-[250px] truncate text-xs text-green-600 dark:text-green-400">
                {deploymentUrl}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => ipc.system.openExternalUrl(deploymentUrl)}
                className="rounded-md bg-green-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-green-700"
              >
                Open Site
              </button>
              {deploymentId && projectName && (
                <button
                  type="button"
                  onClick={() => {
                    const baseUrl = teamSlug 
                      ? `https://vercel.com/${teamSlug}/${projectName}`
                      : `https://vercel.com/${projectName}`;
                    ipc.system.openExternalUrl(`${baseUrl}/${deploymentId}`);
                  }}
                  className="rounded-md border border-green-300 px-3 py-1.5 text-xs font-medium text-green-700 transition-colors hover:bg-green-100 dark:border-green-700 dark:text-green-300 dark:hover:bg-green-900/50"
                >
                  Build Logs
                </button>
              )}
              <button
                type="button"
                onClick={onDismiss}
                className="rounded-md border border-green-300 px-3 py-1.5 text-xs font-medium text-green-700 transition-colors hover:bg-green-100 dark:border-green-700 dark:text-green-300 dark:hover:bg-green-900/50"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {isError && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-800 dark:bg-red-950/30">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium text-red-700 dark:text-red-300">
                Deployment failed
              </p>
              <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onRetry}
                className="rounded-md bg-red-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-red-700"
              >
                Retry
              </button>
              <button
                type="button"
                onClick={onDismiss}
                className="rounded-md border border-red-300 px-3 py-1.5 text-xs font-medium text-red-700 transition-colors hover:bg-red-100 dark:border-red-700 dark:text-red-300 dark:hover:bg-red-900/50"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
