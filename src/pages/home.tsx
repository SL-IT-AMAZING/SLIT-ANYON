import { selectedAppIdAtom } from "@/atoms/appAtoms";
import { isPreviewOpenAtom } from "@/atoms/viewAtoms";
import { PrivacyBanner } from "@/components/TelemetryBanner";
import { HomeChatInput } from "@/components/chat/HomeChatInput";
import { useAppVersion } from "@/hooks/useAppVersion";
import { useLoadApps } from "@/hooks/useLoadApps";
import { useSettings } from "@/hooks/useSettings";
import { useStreamChat } from "@/hooks/useStreamChat";
import { ipc } from "@/ipc/types";
import { generateCuteAppName } from "@/lib/utils";
import { INSPIRATION_PROMPTS } from "@/prompts/inspiration_prompts";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { useAtom, useSetAtom } from "jotai";
import { usePostHog } from "posthog-js/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { homeChatInputValueAtom } from "../atoms/chatAtoms";

import { ForceCloseDialog } from "@/components/ForceCloseDialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useTheme } from "@/contexts/ThemeContext";
import { invalidateAppQuery } from "@/hooks/useLoadApp";
import { showError } from "@/lib/toast";
import { useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { ExternalLink } from "lucide-react";

import { neonTemplateHook } from "@/client_logic/template_hook";
import { useFreeAgentQuota } from "@/hooks/useFreeAgentQuota";
import type { FileAttachment } from "@/ipc/types";
import { getEffectiveDefaultChatMode } from "@/lib/schemas";
import { NEON_TEMPLATE_IDS } from "@/shared/templates";
// @ts-ignore
import anyonLogo from "../../img/logo3.svg";

// Adding an export for attachments
export interface HomeSubmitOptions {
  attachments?: FileAttachment[];
}

export default function HomePage() {
  const [inputValue, setInputValue] = useAtom(homeChatInputValueAtom);
  const navigate = useNavigate();
  const search = useSearch({ from: "/" });
  const setSelectedAppId = useSetAtom(selectedAppIdAtom);
  const { apps, refreshApps } = useLoadApps();
  const { settings, updateSettings, envVars } = useSettings();
  const { isQuotaExceeded, isLoading: isQuotaLoading } = useFreeAgentQuota();

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
            setReleaseUrl(result.url + "?hideHeader=true&theme=" + theme);
            setReleaseNotesOpen(true);
          }
        } catch (err) {
          console.warn(
            "Unable to check if release note exists for: " + appVersion,
            err,
          );
        }
      }
    };
    updateLastVersionLaunched();
  }, [appVersion, settings, updateSettings, theme]);

  // Get the appId from search params
  const appId = search.appId ? Number(search.appId) : null;

  // State for random prompts
  const [randomPrompts, setRandomPrompts] = useState<
    typeof INSPIRATION_PROMPTS
  >([]);

  // Function to get random prompts
  const getRandomPrompts = useCallback(() => {
    const shuffled = [...INSPIRATION_PROMPTS].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, 3);
  }, []);

  useEffect(() => {
    setRandomPrompts(getRandomPrompts());
  }, [getRandomPrompts]);

  const handleAppClick = (id: number) => {
    setSelectedAppId(id);
    navigate({ to: "/app-details", search: { appId: id } });
  };

  useEffect(() => {
    if (appId) {
      navigate({ to: "/app-details", search: { appId } });
    }
  }, [appId, navigate]);

  // Apply default chat mode when navigating to home page
  // Wait for quota status to load to avoid race condition where we default to Basic Agent
  // before knowing if quota is actually exceeded
  const hasAppliedDefaultChatMode = useRef(false);
  useEffect(() => {
    if (settings && !hasAppliedDefaultChatMode.current && !isQuotaLoading) {
      hasAppliedDefaultChatMode.current = true;
      const effectiveDefaultMode = getEffectiveDefaultChatMode(
        settings,
        envVars,
        !isQuotaExceeded,
      );
      if (settings.selectedChatMode !== effectiveDefaultMode) {
        updateSettings({ selectedChatMode: effectiveDefaultMode });
      }
    }
  }, [settings, updateSettings, isQuotaExceeded, isQuotaLoading, envVars]);

  const handleSubmit = async (options?: HomeSubmitOptions) => {
    const attachments = options?.attachments || [];

    if (!inputValue.trim() && attachments.length === 0) return;

    try {
      setIsLoading(true);
      // Create the chat and navigate
      const result = await ipc.app.createApp({
        name: generateCuteAppName(),
      });
      if (
        settings?.selectedTemplateId &&
        NEON_TEMPLATE_IDS.has(settings.selectedTemplateId)
      ) {
        await neonTemplateHook({
          appId: result.app.id,
          appName: result.app.name,
        });
      }

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
      await new Promise((resolve) =>
        setTimeout(resolve, settings?.isTestMode ? 0 : 2000),
      );

      setInputValue("");
      setSelectedAppId(result.app.id);
      setIsPreviewOpen(false);
      await refreshApps(); // Ensure refreshApps is awaited if it's async
      await invalidateAppQuery(queryClient, { appId: result.app.id });
      posthog.capture("home:chat-submit");
      navigate({ to: "/chat", search: { id: result.chatId } });
    } catch (error) {
      console.error("Failed to create chat:", error);
      showError("Failed to create app. " + (error as any).toString());
      setIsLoading(false); // Ensure loading state is reset on error
    }
    // No finally block needed for setIsLoading(false) here if navigation happens on success
  };

  // Loading overlay for app creation
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center max-w-3xl m-auto p-8">
        <div className="w-full flex flex-col items-center">
          {/* Loading Spinner */}
          <div className="relative w-24 h-24 mb-8">
            <div className="absolute top-0 left-0 w-full h-full border-8 border-border rounded-full"></div>
            <div className="absolute top-0 left-0 w-full h-full border-8 border-t-primary rounded-full animate-spin"></div>
          </div>
          <h2 className="text-2xl font-bold mb-2 text-foreground">
            Building your app
          </h2>
          <p className="text-muted-foreground text-center max-w-md mb-8">
            We're setting up your app with AI magic. <br />
            This might take a moment...
          </p>
        </div>
      </div>
    );
  }

  // Main Home Page Content
  return (
    <div className="flex flex-col items-center justify-center max-w-3xl w-full m-auto p-8 relative">
      <ForceCloseDialog
        isOpen={forceCloseDialogOpen}
        onClose={() => setForceCloseDialogOpen(false)}
        performanceData={performanceData}
      />

      <div className="w-full">
        <div className="text-center mb-10">
          <h1
            className="text-6xl font-bold tracking-tight mb-4 flex items-center justify-center gap-3 flex-wrap"
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          >
            <span>Build</span>
            <span className="italic text-primary">anything</span>
            <span>with</span>
            <img src={anyonLogo} alt="ANYON" className="h-14 inline-block" />
          </h1>
          <p className="text-muted-foreground text-xl font-medium">
            Just tell me what you want. I'll handle the rest.
          </p>
        </div>
        <HomeChatInput onSubmit={handleSubmit} />

        <div className="flex flex-col gap-4 mt-2">
          <div className="flex flex-wrap gap-4 justify-center">
            {randomPrompts.map((item, index) => (
              <button
                type="button"
                key={index}
                onClick={() => setInputValue(`Build me a ${item.label}`)}
                className="flex items-center gap-3 px-4 py-2 rounded-xl border border-border
                           bg-card/50 backdrop-blur-sm
                           transition-all duration-200
                           hover:bg-card hover:shadow-md hover:border-border
                           active:scale-[0.98]"
              >
                <span className="text-muted-foreground">{item.icon}</span>
                <span className="text-sm font-medium text-muted-foreground">
                  {item.label}
                </span>
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setRandomPrompts(getRandomPrompts())}
            className="self-center flex items-center gap-2 px-4 py-2 rounded-xl border border-border
                       bg-card/50 backdrop-blur-sm
                       transition-all duration-200
                       hover:bg-card hover:shadow-md hover:border-border
                       active:scale-[0.98]"
          >
            <svg
              className="w-5 h-5 text-muted-foreground"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            <span className="text-sm font-medium text-muted-foreground">
              More ideas
            </span>
          </button>
        </div>

        {apps.length > 0 && (
          <div className="mt-8 w-full">
            <h3 className="text-sm font-medium text-muted-foreground mb-3">
              Recent Projects
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
                    {app.name}
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
            <DialogTitle>What's new in v{appVersion}?</DialogTitle>
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-10 top-2 focus-visible:ring-0 focus-visible:ring-offset-0"
              onClick={() =>
                window.open(
                  releaseUrl.replace("?hideHeader=true&theme=" + theme, ""),
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
                  title={`Release notes for v${appVersion}`}
                />
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
