import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useSettings } from "@/hooks/useSettings";
import { ipc } from "@/ipc/types";
import { showError, showSuccess } from "@/lib/toast";
import { AlertCircle, CheckCircle, FolderOpen, RotateCcw } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

export function NodePathSelector() {
  const { t } = useTranslation("settings");
  const { settings, updateSettings } = useSettings();
  const [isSelectingPath, setIsSelectingPath] = useState(false);
  const [nodeStatus, setNodeStatus] = useState<{
    version: string | null;
    isValid: boolean;
  }>({
    version: null,
    isValid: false,
  });
  const [isCheckingNode, setIsCheckingNode] = useState(false);
  const [systemPath, setSystemPath] = useState<string>(
    t("general.nodePath.loading"),
  );

  // Check Node.js status when component mounts or path changes
  useEffect(() => {
    checkNodeStatus();
  }, [settings?.customNodePath]);

  const fetchSystemPath = async () => {
    try {
      const debugInfo = await ipc.system.getSystemDebugInfo();
      setSystemPath(
        debugInfo.nodePath || t("general.nodePath.systemPathUnavailable"),
      );
    } catch (err) {
      console.error("Failed to fetch system path:", err);
      setSystemPath(t("general.nodePath.systemPathUnavailable"));
    }
  };

  useEffect(() => {
    // Fetch system path on mount
    fetchSystemPath();
  }, []);

  const checkNodeStatus = async () => {
    if (!settings) return;
    setIsCheckingNode(true);
    try {
      const status = await ipc.system.getNodejsStatus();
      setNodeStatus({
        version: status.nodeVersion,
        isValid: !!status.nodeVersion,
      });
    } catch (error) {
      console.error("Failed to check Node.js status:", error);
      setNodeStatus({ version: null, isValid: false });
    } finally {
      setIsCheckingNode(false);
    }
  };
  const handleSelectNodePath = async () => {
    setIsSelectingPath(true);
    try {
      // Call the IPC method to select folder
      const result = await ipc.system.selectNodeFolder();
      if (result.path) {
        // Save the custom path to settings
        await updateSettings({ customNodePath: result.path });
        // Update the environment PATH
        await ipc.system.reloadEnvPath();
        // Recheck Node.js status
        await checkNodeStatus();
        showSuccess(t("general.nodePath.updateSuccess"));
      } else if (result.path === null && result.canceled === false) {
        showError(
          t("general.nodePath.notFoundAtPath", {
            path: result.selectedPath,
          }),
        );
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      showError(t("general.nodePath.updateFailed", { message }));
    } finally {
      setIsSelectingPath(false);
    }
  };
  const handleResetToDefault = async () => {
    try {
      // Clear the custom path
      await updateSettings({ customNodePath: null });
      // Reload environment to use system PATH
      await ipc.system.reloadEnvPath();
      // Recheck Node.js status
      await fetchSystemPath();
      await checkNodeStatus();
      showSuccess(t("general.nodePath.resetSuccess"));
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      showError(t("general.nodePath.resetFailed", { message }));
    }
  };

  if (!settings) {
    return null;
  }
  const currentPath = settings.customNodePath || systemPath;
  const isCustomPath = !!settings.customNodePath;
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="flex gap-2">
          <Label className="text-sm font-medium">
            {t("general.nodePath.title")}
          </Label>

          <Button
            onClick={handleSelectNodePath}
            disabled={isSelectingPath}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <FolderOpen className="w-4 h-4" />
            {isSelectingPath
              ? t("general.nodePath.selecting")
              : t("general.nodePath.browse")}
          </Button>

          {isCustomPath && (
            <Button
              onClick={handleResetToDefault}
              variant="ghost"
              size="sm"
              className="flex items-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              {t("general.nodePath.resetDefault")}
            </Button>
          )}
        </div>
        <div className="p-3 bg-muted rounded-lg border border-border">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-medium text-muted-foreground">
                  {isCustomPath
                    ? t("general.nodePath.customPath")
                    : t("general.nodePath.systemPath")}
                </span>
                {isCustomPath && (
                  <span className="px-2 py-0.5 text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded">
                    {t("general.nodePath.customBadge")}
                  </span>
                )}
              </div>
              <p className="text-sm font-mono text-muted-foreground break-all max-h-32 overflow-y-auto">
                {currentPath}
              </p>
            </div>

            {/* Status Indicator */}
            <div className="ml-3 flex items-center">
              {isCheckingNode ? (
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-border border-t-blue-500" />
              ) : nodeStatus.isValid ? (
                <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
                  <CheckCircle className="w-4 h-4" />
                  <span className="text-xs">{nodeStatus.version}</span>
                </div>
              ) : (
                <div className="flex items-center gap-1 text-yellow-600 dark:text-yellow-400">
                  <AlertCircle className="w-4 h-4" />
                  <span className="text-xs">
                    {t("general.nodePath.notFound")}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Help Text */}
        <div className="text-sm text-muted-foreground">
          {nodeStatus.isValid ? (
            <p>{t("general.nodePath.configured")}</p>
          ) : (
            <>
              <p>{t("general.nodePath.help")}</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
