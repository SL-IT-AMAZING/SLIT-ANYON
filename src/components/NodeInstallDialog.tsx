import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useSettings } from "@/hooks/useSettings";
import { ipc } from "@/ipc/types";
import type {
  NodeInstallEnd,
  NodeInstallError,
  NodeInstallProgress,
} from "@/ipc/types";
import {
  AlertCircle,
  CheckCircle,
  ExternalLink,
  FolderOpen,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

type InstallStage =
  | "idle"
  | "downloading"
  | "extracting"
  | "verifying"
  | "installing-pnpm"
  | "success"
  | "error";

interface NodeInstallDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onInstallComplete?: () => void;
}

export function NodeInstallDialog({
  open,
  onOpenChange,
  onInstallComplete,
}: NodeInstallDialogProps) {
  const { t } = useTranslation("app");
  const { updateSettings } = useSettings();
  const [stage, setStage] = useState<InstallStage>("idle");
  const [percent, setPercent] = useState<number | null>(null);
  const [nodeVersion, setNodeVersion] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const hasStartedRef = useRef(false);

  const isInstalling =
    stage === "downloading" ||
    stage === "extracting" ||
    stage === "verifying" ||
    stage === "installing-pnpm";

  const startInstall = useCallback(() => {
    const requestId = `node-install-${Date.now()}`;
    setStage("downloading");
    setPercent(0);
    setErrorMessage("");

    ipc.nodeInstallStream.start(
      { requestId },
      {
        onChunk: (data: NodeInstallProgress) => {
          setStage(data.stage);
          setPercent(data.percent);
        },
        onEnd: (data: NodeInstallEnd) => {
          setStage("success");
          setNodeVersion(data.nodeVersion);
          setPercent(null);
        },
        onError: (data: NodeInstallError) => {
          setStage("error");
          setErrorMessage(data.error);
          setPercent(null);
        },
      },
    );
  }, []);

  useEffect(() => {
    if (open && stage === "idle" && !hasStartedRef.current) {
      hasStartedRef.current = true;
      startInstall();
    }
    if (!open) {
      hasStartedRef.current = false;

      if (!isInstalling) {
        setStage("idle");
        setPercent(null);
        setErrorMessage("");
        setNodeVersion("");
      }
    }
  }, [open, stage, startInstall, isInstalling]);

  const handleRetry = () => {
    setStage("idle");
    hasStartedRef.current = false;

    setTimeout(() => {
      hasStartedRef.current = true;
      startInstall();
    }, 0);
  };

  const handleContinue = () => {
    onInstallComplete?.();
    onOpenChange(false);
  };

  const handleManualInstall = () => {
    ipc.system.openExternalUrl("https://nodejs.org");
  };

  const handleBrowse = async () => {
    try {
      const result = await ipc.system.selectNodeFolder();
      if (result.path) {
        await updateSettings({ customNodePath: result.path });
        await ipc.system.reloadEnvPath();
        onInstallComplete?.();
        onOpenChange(false);
      }
    } catch (error) {
      console.error("Failed to select Node.js folder:", error);
    }
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (isInstalling && !nextOpen) return;
    onOpenChange(nextOpen);
  };

  const getStageText = () => {
    switch (stage) {
      case "downloading":
        return percent !== null && percent > 0
          ? t("home.nodeSetup.downloadingPercent", {
              percent: Math.round(percent),
            })
          : t("home.nodeSetup.downloading");
      case "extracting":
        return t("home.nodeSetup.extracting");
      case "verifying":
        return t("home.nodeSetup.verifying");
      case "installing-pnpm":
        return t("home.nodeSetup.installingPnpm");
      default:
        return "";
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md" showCloseButton={!isInstalling}>
        <DialogHeader>
          <DialogTitle>{t("home.nodeSetup.dialogTitle")}</DialogTitle>
        </DialogHeader>

        {isInstalling && (
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">{getStageText()}</p>
            <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
              {percent !== null ? (
                <div
                  className="h-full rounded-full bg-primary transition-all duration-300"
                  style={{ width: `${percent}%` }}
                />
              ) : (
                <div className="h-full w-full animate-pulse rounded-full bg-primary/50" />
              )}
            </div>
          </div>
        )}

        {stage === "success" && (
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <CheckCircle className="h-12 w-12 text-green-600 dark:text-green-400" />
            <div>
              <p className="text-lg font-medium text-foreground">
                {t("home.nodeSetup.installComplete")}
              </p>
              <DialogDescription className="mt-1">
                {t("home.nodeSetup.installCompleteDescription", {
                  version: nodeVersion,
                })}
              </DialogDescription>
            </div>
            <DialogFooter className="w-full pt-2">
              <Button className="w-full" onClick={handleContinue}>
                {t("home.nodeSetup.continueButton")}
              </Button>
            </DialogFooter>
          </div>
        )}

        {stage === "error" && (
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <AlertCircle className="h-12 w-12 text-destructive" />
            <div>
              <p className="text-lg font-medium text-foreground">
                {t("home.nodeSetup.installFailed")}
              </p>
              <DialogDescription className="mt-1">
                {t("home.nodeSetup.installFailedDescription", {
                  message: errorMessage,
                })}
              </DialogDescription>
            </div>
            <DialogFooter className="w-full flex-col gap-2 pt-2 sm:flex-col">
              <Button className="w-full" onClick={handleRetry}>
                {t("home.nodeSetup.retryButton")}
              </Button>
              <div className="flex w-full gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={handleManualInstall}
                >
                  <ExternalLink className="mr-2 h-4 w-4" />
                  {t("home.nodeSetup.manualInstall")}
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={handleBrowse}
                >
                  <FolderOpen className="mr-2 h-4 w-4" />
                  {t("home.nodeSetup.browseButton")}
                </Button>
              </div>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
