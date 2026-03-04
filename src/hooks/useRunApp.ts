import {
  appConsoleEntriesAtom,
  appLoadingStepAtom,
  appUrlAtom,
  currentAppAtom,
  previewCurrentUrlAtom,
  previewErrorMessageAtom,
  previewPanelKeyAtom,
  selectedAppIdAtom,
} from "@/atoms/appAtoms";
import { type AppOutput, ipc } from "@/ipc/types";
import { showInputRequest } from "@/lib/toast";
import { atom } from "jotai";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { useCallback, useEffect, useRef } from "react";

const useRunAppLoadingAtom = atom(false);

/**
 * Hook to subscribe to app output events from the main process.
 * IMPORTANT: This hook should only be called ONCE in the app (in layout.tsx)
 * to avoid duplicate event subscriptions causing duplicate log entries.
 */
export function useAppOutputSubscription() {
  const setConsoleEntries = useSetAtom(appConsoleEntriesAtom);
  const [, setAppUrlObj] = useAtom(appUrlAtom);
  const setLoading = useSetAtom(useRunAppLoadingAtom);
  const setAppLoadingStep = useSetAtom(appLoadingStepAtom);
  const setPreviewPanelKey = useSetAtom(previewPanelKeyAtom);
  const appId = useAtomValue(selectedAppIdAtom);

  const setPreviewErrorMessage = useSetAtom(previewErrorMessageAtom);

  const processProxyServerOutput = useCallback(
    (output: AppOutput) => {
      const matchesProxyServerStart = output.message.includes(
        "[anyon-proxy-server]started=[",
      );
      if (matchesProxyServerStart) {
        // Extract both proxy URL and original URL using regex
        const proxyUrlMatch = output.message.match(
          /\[anyon-proxy-server\]started=\[(.*?)\]/,
        );
        const originalUrlMatch = output.message.match(/original=\[(.*?)\]/);

        if (proxyUrlMatch?.[1]) {
          const proxyUrl = proxyUrlMatch[1];
          const originalUrl = originalUrlMatch?.[1] ?? proxyUrl;
          setAppLoadingStep("Loading preview...");
          setAppUrlObj({
            appUrl: proxyUrl,
            appId: output.appId,
            originalUrl,
          });
          setLoading(false);
          setAppLoadingStep(null);
        }
      }
    },
    [setAppLoadingStep, setAppUrlObj, setLoading],
  );

  const hmrDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onHotModuleReload = useCallback(() => {
    if (hmrDebounceRef.current) clearTimeout(hmrDebounceRef.current);
    hmrDebounceRef.current = setTimeout(() => {
      setPreviewPanelKey((prevKey) => prevKey + 1);
    }, 300);
  }, [setPreviewPanelKey]);

  const processAppOutput = useCallback(
    (output: AppOutput) => {
      const normalizedMessage = output.message.toLowerCase();
      const isInstallDone =
        /\badded\s+\d+\s+packages\b/.test(normalizedMessage) ||
        /\bup to date\b/.test(normalizedMessage) ||
        /\baudited\s+\d+\s+packages\b/.test(normalizedMessage);
      const isInstallActivity =
        /\bnpm\s+(warn|notice|http|verb|info)\b/.test(normalizedMessage) ||
        /\badded\s+\d+\s+packages\b/.test(normalizedMessage) ||
        /\baudited\s+\d+\s+packages\b/.test(normalizedMessage) ||
        /\bfound\s+\d+\s+vulnerabilities\b/.test(normalizedMessage);
      const isDevServerStart =
        /\bvite\s+v\d/.test(normalizedMessage) ||
        /\blocal:\s*https?:\/\//.test(normalizedMessage) ||
        /\bready in\s+\d+\s*ms\b/.test(normalizedMessage);

      if (isInstallActivity && !isInstallDone) {
        setAppLoadingStep("Installing packages...");
      }

      if (isInstallDone || isDevServerStart) {
        setAppLoadingStep("Starting dev server...");
      }

      // Handle input requests specially
      if (output.type === "input-requested") {
        showInputRequest(output.message, async (response) => {
          try {
            await ipc.app.respondToAppInput({
              appId: output.appId,
              response,
            });
          } catch (error) {
            console.error("Failed to respond to app input:", error);
          }
        });
        return; // Don't add to regular output
      }

      // Add to console entries
      // Use "server" type for stdout/stderr to match the backend log store
      // (app_handlers.ts stores these as type: "server")
      const logEntry = {
        level:
          output.type === "stderr" || output.type === "client-error"
            ? ("error" as const)
            : ("info" as const),
        type: "server" as const,
        message: output.message,
        appId: output.appId,
        timestamp: output.timestamp ?? Date.now(),
      };

      // Only send client-error logs to central store
      // Server logs (stdout/stderr) are already stored in the main process
      if (output.type === "client-error") {
        ipc.misc.addLog(logEntry);
      }

      // Also update UI state
      setConsoleEntries((prev) => [...prev, logEntry]);

      // Detect server exit to show error instead of infinite spinner
      if (output.message.includes("[anyon-server-exit]")) {
        setLoading(false);
        setAppLoadingStep(null);
        setPreviewErrorMessage({
          message:
            "App server failed to start. Open System Messages below to see the error details, or try Restart.",
          source: "anyon-app",
        });
      }

      // Process proxy server output
      processProxyServerOutput(output);
    },
    [
      processProxyServerOutput,
      setAppLoadingStep,
      setConsoleEntries,
      setLoading,
      setPreviewErrorMessage,
    ],
  );

  // Subscribe to app output events from main process
  useEffect(() => {
    const unsubscribe = ipc.events.misc.onAppOutput((output) => {
      // Only process events for the currently selected app
      if (appId !== null && output.appId === appId) {
        // Handle HMR updates
        if (
          output.message.includes("hmr update") &&
          output.message.includes("[vite]")
        ) {
          onHotModuleReload();
        }
        processAppOutput(output);
      }
    });

    return () => {
      unsubscribe();
      if (hmrDebounceRef.current) clearTimeout(hmrDebounceRef.current);
    };
  }, [appId, processAppOutput, onHotModuleReload]);
}

export function useRunApp() {
  const [loading, setLoading] = useAtom(useRunAppLoadingAtom);
  const setAppLoadingStep = useSetAtom(appLoadingStepAtom);
  const [app, setApp] = useAtom(currentAppAtom);
  const setConsoleEntries = useSetAtom(appConsoleEntriesAtom);
  const [, setAppUrlObj] = useAtom(appUrlAtom);
  const setPreviewPanelKey = useSetAtom(previewPanelKeyAtom);
  const setPreservedUrls = useSetAtom(previewCurrentUrlAtom);
  const appId = useAtomValue(selectedAppIdAtom);
  const setPreviewErrorMessage = useSetAtom(previewErrorMessageAtom);

  const runApp = useCallback(
    async (appId: number) => {
      setLoading(true);
      setAppLoadingStep("Checking dependencies...");
      try {
        console.debug("Running app", appId);

        // Clear the URL and add restart message
        setAppUrlObj((prevAppUrlObj) => {
          if (prevAppUrlObj?.appId !== appId) {
            return { appUrl: null, appId: null, originalUrl: null };
          }
          return prevAppUrlObj; // No change needed
        });

        const logEntry = {
          level: "info" as const,
          type: "server" as const,
          message: "Trying to restart app...",
          appId,
          timestamp: Date.now(),
        };

        // Send to central log store
        ipc.misc.addLog(logEntry);

        // Also update UI state
        setConsoleEntries((prev) => [...prev, logEntry]);
        const app = await ipc.app.getApp(appId);
        setApp(app);
        await ipc.app.runApp({ appId });
        setAppLoadingStep("Loading preview...");
        setPreviewErrorMessage(undefined);
      } catch (error) {
        console.error(`Error running app ${appId}:`, error);
        setPreviewErrorMessage(
          error instanceof Error
            ? { message: error.message, source: "anyon-app" }
            : {
                message: error?.toString() || "Unknown error",
                source: "anyon-app",
              },
        );
        setLoading(false);
        setAppLoadingStep(null);
      }
    },
    [
      setApp,
      setAppLoadingStep,
      setConsoleEntries,
      setLoading,
      setPreviewErrorMessage,
      setAppUrlObj,
    ],
  );

  const stopApp = useCallback(
    async (appId: number) => {
      if (appId === null) {
        return;
      }

      setLoading(true);
      setAppLoadingStep(null);
      try {
        await ipc.app.stopApp({ appId });

        setPreviewErrorMessage(undefined);
      } catch (error) {
        console.error(`Error stopping app ${appId}:`, error);
        setPreviewErrorMessage(
          error instanceof Error
            ? { message: error.message, source: "anyon-app" }
            : {
                message: error?.toString() || "Unknown error",
                source: "anyon-app",
              },
        );
      } finally {
        setLoading(false);
      }
    },
    [setAppLoadingStep, setLoading, setPreviewErrorMessage],
  );

  const restartApp = useCallback(
    async ({
      removeNodeModules = false,
    }: { removeNodeModules?: boolean } = {}) => {
      if (appId === null) {
        return;
      }
      setLoading(true);
      setAppLoadingStep("Checking dependencies...");
      try {
        console.debug(
          "Restarting app",
          appId,
          removeNodeModules ? "with node_modules cleanup" : "",
        );

        // Clear the URL and add restart message
        setAppUrlObj({ appUrl: null, appId: null, originalUrl: null });

        // Clear preserved URL to prevent stale route restoration after restart
        setPreservedUrls((prev) => {
          const next = { ...prev };
          delete next[appId];
          return next;
        });

        // Clear logs in both the backend store and UI state
        await ipc.misc.clearLogs({ appId });
        setConsoleEntries([]);

        const logEntry = {
          level: "info" as const,
          type: "server" as const,
          message: "Restarting app...",
          appId: appId!,
          timestamp: Date.now(),
        };

        // Send to central log store
        ipc.misc.addLog(logEntry);

        // Also update UI state
        setConsoleEntries((prev) => [...prev, logEntry]);

        const app = await ipc.app.getApp(appId);
        setApp(app);
        await ipc.app.restartApp({ appId, removeNodeModules });
      } catch (error) {
        console.error(`Error restarting app ${appId}:`, error);
        setPreviewErrorMessage(
          error instanceof Error
            ? { message: error.message, source: "anyon-app" }
            : {
                message: error?.toString() || "Unknown error",
                source: "anyon-app",
              },
        );
      } finally {
        setPreviewPanelKey((prevKey) => prevKey + 1);
        setLoading(false);
        setAppLoadingStep(null);
      }
    },
    [
      appId,
      setApp,
      setLoading,
      setConsoleEntries,
      setAppUrlObj,
      setAppLoadingStep,
      setPreviewPanelKey,
      setPreviewErrorMessage,
      setPreservedUrls,
    ],
  );

  const refreshAppIframe = useCallback(async () => {
    setPreviewPanelKey((prevKey) => prevKey + 1);
  }, [setPreviewPanelKey]);

  return {
    loading,
    runApp,
    stopApp,
    restartApp,
    app,
    refreshAppIframe,
  };
}
