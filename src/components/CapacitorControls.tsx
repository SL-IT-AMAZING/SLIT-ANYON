import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ipc } from "@/ipc/types";
import { queryKeys } from "@/lib/queryKeys";
import { showSuccess } from "@/lib/toast";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  Copy,
  ExternalLink,
  Loader2,
  Smartphone,
  TabletSmartphone,
} from "lucide-react";
import { useCallback, useState } from "react";

interface CapacitorControlsProps {
  appId: number;
}

type CapacitorStatus = "idle" | "syncing" | "opening";

export function CapacitorControls({ appId }: CapacitorControlsProps) {
  const { t } = useTranslation(["app", "common"]);
  const [errorDialogOpen, setErrorDialogOpen] = useState(false);
  const [errorDetails, setErrorDetails] = useState<{
    title: string;
    message: string;
  } | null>(null);
  const [iosStatus, setIosStatus] = useState<CapacitorStatus>("idle");
  const [androidStatus, setAndroidStatus] = useState<CapacitorStatus>("idle");

  // Check if Capacitor is installed
  const { data: isCapacitor, isLoading } = useQuery({
    queryKey: queryKeys.appUpgrades.isCapacitor({ appId }),
    queryFn: () => ipc.capacitor.isCapacitor({ appId }),
    enabled: appId !== undefined && appId !== null,
  });

  const showErrorDialog = (title: string, error: unknown) => {
    const errorMessage = error instanceof Error ? error.message : String(error);
    setErrorDetails({ title, message: errorMessage });
    setErrorDialogOpen(true);
  };

  // Sync and open iOS mutation
  const syncAndOpenIosMutation = useMutation({
    mutationFn: async () => {
      setIosStatus("syncing");
      // First sync
      await ipc.capacitor.syncCapacitor({ appId });
      setIosStatus("opening");
      // Then open iOS
      await ipc.capacitor.openIos({ appId });
    },
    onSuccess: () => {
      setIosStatus("idle");
      showSuccess(t("capacitor.syncedIos"));
    },
    onError: (error) => {
      setIosStatus("idle");
      showErrorDialog(t("capacitor.syncIosFailed"), error);
    },
  });

  // Sync and open Android mutation
  const syncAndOpenAndroidMutation = useMutation({
    mutationFn: async () => {
      setAndroidStatus("syncing");
      // First sync
      await ipc.capacitor.syncCapacitor({ appId });
      setAndroidStatus("opening");
      // Then open Android
      await ipc.capacitor.openAndroid({ appId });
    },
    onSuccess: () => {
      setAndroidStatus("idle");
      showSuccess(t("capacitor.syncedAndroid"));
    },
    onError: (error) => {
      setAndroidStatus("idle");
      showErrorDialog(t("capacitor.syncAndroidFailed"), error);
    },
  });

  // Helper function to get button text based on status
  const getIosButtonText = () => {
    switch (iosStatus) {
      case "syncing":
        return {
          main: t("capacitor.syncing"),
          sub: t("capacitor.buildingApp"),
        };
      case "opening":
        return {
          main: t("capacitor.opening"),
          sub: t("capacitor.launchingXcode"),
        };
      default:
        return {
          main: t("capacitor.syncAndOpenIos"),
          sub: t("capacitor.xcode"),
        };
    }
  };

  const getAndroidButtonText = () => {
    switch (androidStatus) {
      case "syncing":
        return {
          main: t("capacitor.syncing"),
          sub: t("capacitor.buildingApp"),
        };
      case "opening":
        return {
          main: t("capacitor.opening"),
          sub: t("capacitor.launchingAndroidStudio"),
        };
      default:
        return {
          main: t("capacitor.syncAndOpenAndroid"),
          sub: t("capacitor.androidStudio"),
        };
    }
  };

  // Don't render anything if loading or if Capacitor is not installed
  if (isLoading || !isCapacitor) {
    return null;
  }

  const iosButtonText = getIosButtonText();
  const androidButtonText = getAndroidButtonText();

  const handleSyncAndOpenIos = useCallback(() => {
    if (syncAndOpenIosMutation.isPending) {
      return;
    }
    syncAndOpenIosMutation.mutate();
  }, [syncAndOpenIosMutation]);

  const handleSyncAndOpenAndroid = useCallback(() => {
    if (syncAndOpenAndroidMutation.isPending) {
      return;
    }
    syncAndOpenAndroidMutation.mutate();
  }, [syncAndOpenAndroidMutation]);

  return (
    <>
      <Card className="mt-1" data-testid="capacitor-controls">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            {t("capacitor.title")}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                // TODO: Add actual help link
                ipc.system.openExternalUrl(
                  "https://docs.any-on.dev/guides/mobile-app#troubleshooting",
                );
              }}
              className="text-sm text-muted-foreground hover:text-accent-foreground flex items-center gap-1"
            >
              {t("capacitor.needHelp")}
              <ExternalLink className="h-3 w-3" />
            </Button>
          </CardTitle>
          <CardDescription>{t("capacitor.description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2">
            <Button
              onClick={handleSyncAndOpenIos}
              disabled={syncAndOpenIosMutation.isPending}
              variant="outline"
              size="sm"
              className="flex items-center gap-2 h-10"
            >
              {syncAndOpenIosMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Smartphone className="h-4 w-4" />
              )}
              <div className="text-left">
                <div className="text-xs font-medium">{iosButtonText.main}</div>
                <div className="text-xs text-muted-foreground">
                  {iosButtonText.sub}
                </div>
              </div>
            </Button>

            <Button
              onClick={handleSyncAndOpenAndroid}
              disabled={syncAndOpenAndroidMutation.isPending}
              variant="outline"
              size="sm"
              className="flex items-center gap-2 h-10"
            >
              {syncAndOpenAndroidMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <TabletSmartphone className="h-4 w-4" />
              )}
              <div className="text-left">
                <div className="text-xs font-medium">
                  {androidButtonText.main}
                </div>
                <div className="text-xs text-muted-foreground">
                  {androidButtonText.sub}
                </div>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Error Dialog */}
      <Dialog open={errorDialogOpen} onOpenChange={setErrorDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="pr-8">{errorDetails?.title}</DialogTitle>
            <DialogDescription>
              {t("capacitor.errorDialogDescription")}
            </DialogDescription>
          </DialogHeader>

          {errorDetails && (
            <div className="max-h-[40vh] w-full overflow-y-auto rounded-md border bg-muted/40 p-3">
              <pre className="text-xs whitespace-pre-wrap break-words font-mono leading-relaxed">
                {errorDetails.message}
              </pre>
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button
              onClick={() => {
                if (errorDetails) {
                  navigator.clipboard.writeText(errorDetails.message);
                  showSuccess(t("capacitor.errorCopied"));
                }
              }}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <Copy className="h-4 w-4" />
              {t("capacitor.copyError")}
            </Button>
            <Button
              onClick={() => setErrorDialogOpen(false)}
              variant="outline"
              size="sm"
            >
              {t("buttons.close", { ns: "common" })}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
