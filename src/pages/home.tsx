import { selectedAppIdAtom } from "@/atoms/appAtoms";
import { isPreviewOpenAtom } from "@/atoms/viewAtoms";
import { PrivacyBanner } from "@/components/TelemetryBanner";
import { LogoSpinner } from "@/components/chat-v2/LogoSpinner";
import { HomeChatInput } from "@/components/chat/HomeChatInput";
import { NodeInstallDialog } from "@/components/NodeInstallDialog";
import { useAppVersion } from "@/hooks/useAppVersion";
import { useLoadApps } from "@/hooks/useLoadApps";
import { useSettings } from "@/hooks/useSettings";
import { useNodeStatus } from "@/hooks/useNodeStatus";
import { useStreamChat } from "@/hooks/useStreamChat";
import { ipc } from "@/ipc/types";
import { generateCuteAppName, getAppDisplayName } from "@/lib/utils";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { useAtom, useSetAtom } from "jotai";
import { usePostHog } from "posthog-js/react";
import { useEffect, useRef, useState } from "react";
import { homeChatInputValueAtom } from "../atoms/chatAtoms";

import { ForceCloseDialog } from "@/components/ForceCloseDialog";
import { ImportAppDialog } from "@/components/ImportAppDialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useTheme } from "@/contexts/ThemeContext";
import { invalidateAppQuery } from "@/hooks/useLoadApp";
import type { FileAttachment } from "@/ipc/types";
import { showError } from "@/lib/toast";
import { useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { ExternalLink, Upload } from "lucide-react";
import { useTranslation } from "react-i18next";
// @ts-ignore
import heroBgImage from "../../assets/bg-im.png";
// @ts-ignore
import anyonLogo from "../../img/logo3.svg";

// Adding an export for attachments
export interface HomeSubmitOptions {
  attachments?: FileAttachment[];
}

export default function HomePage() {
  const { t } = useTranslation("app");
  const [inputValue, setInputValue] = useAtom(homeChatInputValueAtom);
  const navigate = useNavigate();
  const search = useSearch({ from: "/" });
  const setSelectedAppId = useSetAtom(selectedAppIdAtom);
  const { apps, refreshApps } = useLoadApps();
  const { settings, updateSettings } = useSettings();

  const setIsPreviewOpen = useSetAtom(isPreviewOpenAtom);
  const [isLoading, setIsLoading] = useState(false);
  const [forceCloseDialogOpen, setForceCloseDialogOpen] = useState(false);
  const [performanceData, setPerformanceData] = useState<any>(undefined);
  const { streamMessage } = useStreamChat({ hasChatId: false });
  const posthog = usePostHog();
  const appVersion = useAppVersion();
  const [releaseNotesOpen, setReleaseNotesOpen] = useState(false);
  const [releaseUrl, setReleaseUrl] = useState("");
  const { theme } = useTheme();
  const queryClient = useQueryClient();
  const { data: nodeStatus, refetch: refetchNodeStatus } = useNodeStatus();
  const [installDialogOpen, setInstallDialogOpen] = useState(false);
  const isNodeMissing = !nodeStatus?.nodeVersion;
  const isNodeOutdated =
    !!nodeStatus?.nodeVersion && !nodeStatus?.isVersionSufficient;
  const autoInstallTriggeredRef = useRef(false);

  // Auto-open install dialog when Node.js is missing or outdated
  useEffect(() => {
    if (
      nodeStatus &&
      (isNodeMissing || isNodeOutdated) &&
      !autoInstallTriggeredRef.current
    ) {
      autoInstallTriggeredRef.current = true;
      setInstallDialogOpen(true);
    }
  }, [nodeStatus, isNodeMissing, isNodeOutdated]);

  // Listen for force-close events
  useEffect(() => {
    const unsubscribe = ipc.events.system.onForceCloseDetected((data) => {
      setPerformanceData(data.performanceData);
      setForceCloseDialogOpen(true);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const updateLastVersionLaunched = async () => {
      if (
        appVersion &&
        settings &&
        settings.lastShownReleaseNotesVersion !== appVersion
      ) {
        const shouldShowReleaseNotes = !!settings.lastShownReleaseNotesVersion;
        await updateSettings({
          lastShownReleaseNotesVersion: appVersion,
        });
        // It feels spammy to show release notes if it's
        // the users very first time.
        if (!shouldShowReleaseNotes) {
          return;
        }

        try {
          const result = await ipc.system.doesReleaseNoteExist({
            version: appVersion,
          });

          if (result.exists && result.url) {
            setReleaseUrl(`${result.url}?hideHeader=true&theme=${theme}`);
            setReleaseNotesOpen(true);
          }
        } catch (err) {
          console.warn(
            `Unable to check if release note exists for: ${appVersion}`,
            err,
          );
        }
      }
    };
    updateLastVersionLaunched();
  }, [appVersion, settings, updateSettings, theme]);

  // Get the appId from search params
  const appId = search.appId ? Number(search.appId) : null;

  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);

  const handleAppClick = (id: number) => {
    setSelectedAppId(id);
    navigate({ to: "/apps/$appId", params: { appId: String(id) } });
  };

  useEffect(() => {
    if (appId) {
      navigate({ to: "/app-details", search: { appId } });
    }
  }, [appId, navigate]);

  const handleSubmit = async (options?: HomeSubmitOptions) => {
    const attachments = options?.attachments || [];

    if (!inputValue.trim() && attachments.length === 0) return;

    if (isNodeMissing || isNodeOutdated) {
      setInstallDialogOpen(true);
      return;
    }

    try {
      setIsLoading(true);
      // Create the chat and navigate
      const result = await ipc.app.createApp({
        name: generateCuteAppName(),
        designSystemId: settings?.selectedDesignSystemId || undefined,
      });

      // Apply selected theme to the new app (if one is set)
      if (settings?.selectedThemeId) {
        await ipc.template.setAppTheme({
          appId: result.app.id,
          themeId: settings.selectedThemeId || null,
        });
      }

      // Stream the message with attachments
      streamMessage({
        prompt: inputValue,
        chatId: result.chatId,
        attachments,
      });

      setInputValue("");
      setSelectedAppId(result.app.id);
      setIsPreviewOpen(false);
      posthog.capture("home:chat-submit");
      navigate({ to: "/chat", search: { id: result.chatId } });

      void refreshApps();
      void invalidateAppQuery(queryClient, { appId: result.app.id });
    } catch (error) {
      console.error("Failed to create chat:", error);
      const message = error instanceof Error ? error.message : String(error);
      showError(t("home.errors.createAppFailed", { message }));
      setIsLoading(false); // Ensure loading state is reset on error
    }
    // No finally block needed for setIsLoading(false) here if navigation happens on success
  };

  // Loading overlay for app creation
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center max-w-3xl m-auto p-8">
        <div className="w-full flex flex-col items-center">
          <div className="mb-8">
            <LogoSpinner variant="strokeLoop" size={64} />
          </div>
          <h2 className="text-2xl font-bold mb-2 text-foreground">
            {t("home.loading.title")}
          </h2>
          <p className="text-muted-foreground text-center max-w-md mb-8">
            {t("home.loading.descriptionLine1")} <br />
            {t("home.loading.descriptionLine2")}
          </p>
        </div>
      </div>
    );
  }

  // Main Home Page Content
  return (
    <div className="relative min-h-full">
      <div
        className="sticky top-0 h-screen bg-no-repeat bg-center bg-cover pointer-events-none opacity-25"
        style={{
          backgroundImage: `url(${heroBgImage})`,
          marginBottom: "-100vh",
        }}
      />
      <div className="flex flex-col items-center max-w-3xl w-full m-auto px-8 pb-8 pt-[8vh] relative">
        <ForceCloseDialog
          isOpen={forceCloseDialogOpen}
          onClose={() => setForceCloseDialogOpen(false)}
          performanceData={performanceData}
        />

        <div className="w-full">
          <div className="text-center mb-[18vh]">
            <h1
              className="text-7xl font-bold tracking-tight mb-5 flex items-center justify-center gap-4 flex-wrap"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              <span>{t("home.hero.build")}</span>
              <span className="italic text-primary">
                {t("home.hero.anything")}
              </span>
              <span>{t("home.hero.with")}</span>
              <img src={anyonLogo} alt="ANYON" className="h-16 inline-block" />
            </h1>
            <p className="text-muted-foreground text-xl font-medium">
              {t("home.hero.subtitle")}
            </p>
          </div>
          <HomeChatInput onSubmit={handleSubmit} />

          <div className="flex flex-col items-center gap-3 mt-4">
            <p className="text-sm text-muted-foreground">
              {t("home.importHint")}
            </p>
            <button
              type="button"
              onClick={() => setIsImportDialogOpen(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border
                       bg-card/50 backdrop-blur-sm
                       transition-all duration-200
                       hover:bg-card hover:shadow-md hover:border-border
                       active:scale-[0.98]"
            >
              <Upload className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium text-muted-foreground">
                {t("home.import")}
              </span>
            </button>
          </div>
          <ImportAppDialog
            isOpen={isImportDialogOpen}
            onClose={() => setIsImportDialogOpen(false)}
          />
          <NodeInstallDialog
            open={installDialogOpen}
            onOpenChange={setInstallDialogOpen}
            onInstallComplete={() => void refetchNodeStatus()}
          />

          {apps.length > 0 && (
            <div className="mt-8 w-full">
              <h3 className="text-sm font-medium text-muted-foreground mb-3">
                {t("home.recentProjects.title")}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {apps.slice(0, 6).map((app) => (
                  <button
                    type="button"
                    key={app.id}
                    onClick={() => handleAppClick(app.id)}
                    className="flex flex-col items-start p-4 rounded-xl border border-border
                             bg-card/50 backdrop-blur-sm text-left
                             transition-all duration-200
                             hover:bg-card hover:shadow-md hover:border-border
                             active:scale-[0.98]"
                  >
                    <span className="font-medium text-foreground truncate w-full">
                      {getAppDisplayName(app)}
                    </span>
                    <span className="text-xs text-muted-foreground mt-1">
                      {formatDistanceToNow(new Date(app.createdAt), {
                        addSuffix: true,
                      })}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
        <PrivacyBanner />

        {/* Release Notes Dialog */}
        <Dialog open={releaseNotesOpen} onOpenChange={setReleaseNotesOpen}>
          <DialogContent className="max-w-4xl bg-(--docs-bg) pr-0 pt-4 pl-4 gap-1">
            <DialogHeader>
              <DialogTitle>
                {t("home.releaseNotes.title", { version: appVersion })}
              </DialogTitle>
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-10 top-2 focus-visible:ring-0 focus-visible:ring-offset-0"
                onClick={() =>
                  window.open(
                    releaseUrl.replace(`?hideHeader=true&theme=${theme}`, ""),
                    "_blank",
                  )
                }
              >
                <ExternalLink className="w-4 h-4" />
              </Button>
            </DialogHeader>
            <div className="overflow-auto h-[70vh] flex flex-col ">
              {releaseUrl && (
                <div className="flex-1">
                  <iframe
                    src={releaseUrl}
                    className="w-full h-full border-0 rounded-lg"
                    title={t("home.releaseNotes.iframeTitle", {
                      version: appVersion,
                    })}
                  />
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
