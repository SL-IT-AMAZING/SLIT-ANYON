import { ipc } from "@/ipc/types";
import type { DeployEnd, DeployError, DeployProgressChunk } from "@/ipc/types";
import { queryKeys } from "@/lib/queryKeys";
import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useRef, useState } from "react";

export type DeployPhase =
  | "idle"
  | "collecting"
  | "uploading"
  | "creating"
  | "building"
  | "ready"
  | "error";

export interface DeployState {
  phase: DeployPhase;
  message: string;
  progress: number;
  totalFiles: number;
  filesUploaded: number;
  deploymentUrl: string | null;
  deploymentId: string | null;
  error: string | null;
  isDeploying: boolean;
}

const INITIAL_STATE: DeployState = {
  phase: "idle",
  message: "",
  progress: 0,
  totalFiles: 0,
  filesUploaded: 0,
  deploymentUrl: null,
  deploymentId: null,
  error: null,
  isDeploying: false,
};

export function useDirectDeploy(appId: number | null) {
  const [state, setState] = useState<DeployState>(INITIAL_STATE);
  const queryClient = useQueryClient();
  const isDeployingRef = useRef(false);

  const startDeploy = useCallback(async () => {
    if (!appId || isDeployingRef.current) return;

    isDeployingRef.current = true;
    setState({
      ...INITIAL_STATE,
      phase: "collecting",
      message: "Starting deployment...",
      isDeploying: true,
    });

    ipc.vercelDeployStream.start(
      { appId, production: true },
      {
        onChunk: (chunk: DeployProgressChunk) => {
          setState((prev) => ({
            ...prev,
            phase: chunk.phase as DeployPhase,
            message: chunk.message,
            progress: chunk.progress ?? prev.progress,
            totalFiles: chunk.totalFiles ?? prev.totalFiles,
            filesUploaded: chunk.filesUploaded ?? prev.filesUploaded,
          }));
        },
        onEnd: (end: DeployEnd) => {
          setState({
            phase: "ready",
            message: "Deployment complete!",
            progress: 100,
            totalFiles: 0,
            filesUploaded: 0,
            deploymentUrl: end.url,
            deploymentId: end.deploymentId,
            error: null,
            isDeploying: false,
          });
          isDeployingRef.current = false;

          queryClient.invalidateQueries({
            queryKey: queryKeys.vercel.deployments({ appId }),
          });
        },
        onError: (err: DeployError) => {
          setState((prev) => ({
            ...prev,
            phase: "error",
            message: err.error,
            error: err.error,
            isDeploying: false,
          }));
          isDeployingRef.current = false;
        },
      },
    );
  }, [appId, queryClient]);

  const reset = useCallback(() => {
    setState(INITIAL_STATE);
    isDeployingRef.current = false;
  }, []);

  return {
    ...state,
    startDeploy,
    reset,
  };
}
