import { SECTION_IDS } from "@/lib/settingsSearchIndex";
import { providerSettingsRoute } from "@/routes/settings/providers/$provider";
import { useNavigate } from "@tanstack/react-router";
import {
  AlertCircle,
  CheckCircle,
  ChevronRight,
  Folder,
  GiftIcon,
  Loader2,
  Settings,
  XCircle,
} from "lucide-react";

import SetupProviderCard from "@/components/SetupProviderCard";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { useLanguageModelProviders } from "@/hooks/useLanguageModelProviders";
import { useScrollAndNavigateTo } from "@/hooks/useScrollAndNavigateTo";
import { useSettings } from "@/hooks/useSettings";
import { type NodeSystemInfo, ipc } from "@/ipc/types";
import { showError } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { usePostHog } from "posthog-js/react";
import { useCallback, useEffect, useState } from "react";
// @ts-ignore
import googleIcon from "../../assets/ai-logos/google-g-icon.svg";
// @ts-ignore
import openrouterLogo from "../../assets/ai-logos/openrouter-logo.png";
// @ts-ignore
import logo from "../../assets/logo.svg";
import { DyadProTrialDialog } from "./DyadProTrialDialog";
import { OnboardingBanner } from "./home/OnboardingBanner";

type NodeInstallStep =
  | "install"
  | "waiting-for-continue"
  | "continue-processing"
  | "finished-checking";

export function SetupBanner() {
  const posthog = usePostHog();
  const navigate = useNavigate();
  const [isOnboardingVisible, setIsOnboardingVisible] = useState(true);
  const { isAnyProviderSetup, isLoading: loading } =
    useLanguageModelProviders();
  const [nodeSystemInfo, setNodeSystemInfo] = useState<NodeSystemInfo | null>(
    null,
  );
  const [nodeCheckError, setNodeCheckError] = useState<boolean>(false);
  const [nodeInstallStep, setNodeInstallStep] =
    useState<NodeInstallStep>("install");
  const checkNode = useCallback(async () => {
    try {
      setNodeCheckError(false);
      const status = await ipc.system.getNodejsStatus();
      setNodeSystemInfo(status);
    } catch (error) {
      console.error("Failed to check Node.js status:", error);
      setNodeSystemInfo(null);
      setNodeCheckError(true);
    }
  }, [setNodeSystemInfo, setNodeCheckError]);
  const [showManualConfig, setShowManualConfig] = useState(false);
  const [isSelectingPath, setIsSelectingPath] = useState(false);
  const [showDyadProTrialDialog, setShowDyadProTrialDialog] = useState(false);
  const { updateSettings } = useSettings();

  // Add handler for manual path selection
  const handleManualNodeConfig = useCallback(async () => {
    setIsSelectingPath(true);
    try {
      const result = await ipc.system.selectNodeFolder();
      if (result.path) {
        await updateSettings({ customNodePath: result.path });
        await ipc.system.reloadEnvPath();
        await checkNode();
        setNodeInstallStep("finished-checking");
        setShowManualConfig(false);
      } else if (result.path === null && result.canceled === false) {
        showError(
          `Could not find Node.js at the path "${result.selectedPath}"`,
        );
      }
    } catch (error) {
      showError("Error setting Node.js path:" + error);
    } finally {
      setIsSelectingPath(false);
    }
  }, [checkNode]);

  useEffect(() => {
    checkNode();
  }, [checkNode]);

  const settingsScrollAndNavigateTo = useScrollAndNavigateTo("/settings", {
    behavior: "smooth",
    block: "start",
  });

  const handleGoogleSetupClick = () => {
    posthog.capture("setup-flow:ai-provider-setup:google:click");
    navigate({
      to: providerSettingsRoute.id,
      params: { provider: "google" },
    });
  };

  const handleOpenRouterSetupClick = () => {
    posthog.capture("setup-flow:ai-provider-setup:openrouter:click");
    navigate({
      to: providerSettingsRoute.id,
      params: { provider: "openrouter" },
    });
  };
  const handleDyadProSetupClick = () => {
    posthog.capture("setup-flow:ai-provider-setup:dyad:click");
    setShowDyadProTrialDialog(true);
  };

  const handleOtherProvidersClick = () => {
    posthog.capture("setup-flow:ai-provider-setup:other:click");
    settingsScrollAndNavigateTo(SECTION_IDS.providers);
  };

  const handleNodeInstallClick = useCallback(async () => {
    posthog.capture("setup-flow:start-node-install-click");
    setNodeInstallStep("waiting-for-continue");
    ipc.system.openExternalUrl(nodeSystemInfo!.nodeDownloadUrl);
  }, [nodeSystemInfo, setNodeInstallStep]);

  const finishNodeInstall = useCallback(async () => {
    posthog.capture("setup-flow:continue-node-install-click");
    setNodeInstallStep("continue-processing");
    await ipc.system.reloadEnvPath();
    await checkNode();
    setNodeInstallStep("finished-checking");
  }, [checkNode, setNodeInstallStep]);

  // We only check for node version because pnpm is not required for the app to run.
  const isNodeSetupComplete = Boolean(nodeSystemInfo?.nodeVersion);

  const itemsNeedAction: string[] = [];
  if (!isNodeSetupComplete && nodeSystemInfo) {
    itemsNeedAction.push("node-setup");
  }
  if (!isAnyProviderSetup() && !loading) {
    itemsNeedAction.push("ai-setup");
  }

  if (itemsNeedAction.length === 0) {
    return (
      <h1 className="text-center text-5xl font-bold mb-8 bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 dark:from-gray-100 dark:to-gray-400 tracking-tight">
        Build a new app
      </h1>
    );
  }

  const bannerClasses = cn(
    "w-full mb-6 border rounded-xl shadow-sm overflow-hidden",
    "border-border",
  );

  const getStatusIcon = (isComplete: boolean, hasError = false) => {
    if (hasError) {
      return <XCircle className="w-5 h-5 text-red-500" />;
    }
    return isComplete ? (
      <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-500" />
    ) : (
      <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-500" />
    );
  };

  return (
    <>
      <p className="text-xl font-medium text-muted-foreground p-4 pt-6">
        Setup Dyad
      </p>
      <OnboardingBanner
        isVisible={isOnboardingVisible}
        setIsVisible={setIsOnboardingVisible}
      />
      <div className={bannerClasses}>
        <Accordion multiple className="w-full" defaultValue={itemsNeedAction}>
          <AccordionItem
            value="node-setup"
            className={cn(
              nodeCheckError
                ? "bg-red-50 dark:bg-red-900/30"
                : isNodeSetupComplete
                  ? "bg-green-50 dark:bg-green-900/30"
                  : "bg-yellow-50 dark:bg-yellow-900/30",
            )}
          >
            <AccordionTrigger className="px-4 py-3 transition-colors w-full hover:no-underline">
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-3">
                  {getStatusIcon(isNodeSetupComplete, nodeCheckError)}
                  <span className="font-medium text-sm">
                    1. Install Node.js (App Runtime)
                  </span>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 pt-2 pb-4 bg-card border-t border-inherit">
              {nodeCheckError && (
                <p className="text-sm text-red-600 dark:text-red-400">
                  Error checking Node.js status. Try installing Node.js.
                </p>
              )}
              {isNodeSetupComplete ? (
                <p className="text-sm">
                  Node.js ({nodeSystemInfo!.nodeVersion}) installed.{" "}
                  {nodeSystemInfo!.pnpmVersion && (
                    <span className="text-xs text-muted-foreground">
                      {" "}
                      (optional) pnpm ({nodeSystemInfo!.pnpmVersion}) installed.
                    </span>
                  )}
                </p>
              ) : (
                <div className="text-sm">
                  <p>Node.js is required to run apps locally.</p>
                  {nodeInstallStep === "waiting-for-continue" && (
                    <p className="mt-1">
                      After you have installed Node.js, click "Continue". If the
                      installer didn't work, try{" "}
                      <a
                        className="text-blue-500 dark:text-blue-400 hover:underline"
                        onClick={() => {
                          ipc.system.openExternalUrl(
                            "https://nodejs.org/en/download",
                          );
                        }}
                      >
                        more download options
                      </a>
                      .
                    </p>
                  )}
                  <NodeInstallButton
                    nodeInstallStep={nodeInstallStep}
                    handleNodeInstallClick={handleNodeInstallClick}
                    finishNodeInstall={finishNodeInstall}
                  />

                  <div className="mt-3 pt-3 border-t border-border">
                    <button
                      onClick={() => setShowManualConfig(!showManualConfig)}
                      className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      Node.js already installed? Configure path manually →
                    </button>

                    {showManualConfig && (
                      <div className="mt-3 p-3 bg-muted rounded-lg">
                        <Button
                          onClick={handleManualNodeConfig}
                          disabled={isSelectingPath}
                          variant="outline"
                          size="sm"
                        >
                          {isSelectingPath ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Selecting...
                            </>
                          ) : (
                            <>
                              <Folder className="mr-2 h-4 w-4" />
                              Browse for Node.js folder
                            </>
                          )}
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              )}
              <NodeJsHelpCallout />
            </AccordionContent>
          </AccordionItem>

          <AccordionItem
            value="ai-setup"
            className={cn(
              isAnyProviderSetup()
                ? "bg-green-50 dark:bg-green-900/30"
                : "bg-yellow-50 dark:bg-yellow-900/30",
            )}
          >
            <AccordionTrigger
              className={cn(
                "px-4 py-3 transition-colors w-full hover:no-underline",
              )}
            >
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-3">
                  {getStatusIcon(isAnyProviderSetup())}
                  <span className="font-medium text-sm">
                    2. Setup AI Access
                  </span>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 pt-2 pb-4 bg-card border-t border-inherit">
              <p className="text-[15px] mb-3">
                Not sure what to do? Watch the Get Started video above ☝️
              </p>

              <SetupProviderCard
                variant="dyad"
                onClick={handleDyadProSetupClick}
                tabIndex={isNodeSetupComplete ? 0 : -1}
                leadingIcon={
                  <img src={logo} alt="Dyad Logo" className="w-6 h-6 mr-0.5" />
                }
                title="Start with Dyad Pro free trial"
                subtitle="Unlock the full power of Dyad"
                chip={<>Recommended</>}
              />
              <div className="mt-2 flex gap-2">
                <SetupProviderCard
                  className="flex-1"
                  variant="google"
                  onClick={handleGoogleSetupClick}
                  tabIndex={isNodeSetupComplete ? 0 : -1}
                  leadingIcon={
                    <img src={googleIcon} alt="Google" className="w-4 h-4" />
                  }
                  title="Setup Google Gemini API Key"
                  chip={<>Free</>}
                />

                <SetupProviderCard
                  className="flex-1"
                  variant="openrouter"
                  onClick={handleOpenRouterSetupClick}
                  tabIndex={isNodeSetupComplete ? 0 : -1}
                  leadingIcon={
                    <img
                      src={openrouterLogo}
                      alt="OpenRouter"
                      className="w-4 h-4"
                    />
                  }
                  title="Setup OpenRouter API Key"
                  chip={<>Free</>}
                />
              </div>

              <div
                className="mt-2 p-3 bg-muted border border-border rounded-lg cursor-pointer hover:bg-accent transition-colors"
                onClick={handleOtherProvidersClick}
                role="button"
                tabIndex={isNodeSetupComplete ? 0 : -1}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <div className="bg-muted p-1.5 rounded-full">
                      <Settings className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div>
                      <h4 className="font-medium text-[15px] text-foreground">
                        Setup other AI providers
                      </h4>
                      <p className="text-xs text-muted-foreground">
                        OpenAI, Anthropic and more
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>

      <DyadProTrialDialog
        isOpen={showDyadProTrialDialog}
        onClose={() => setShowDyadProTrialDialog(false)}
      />
    </>
  );
}

function NodeJsHelpCallout() {
  return (
    <div className="mt-3 p-3 bg-(--background-lighter) border rounded-lg text-sm">
      <p>
        If you run into issues, read our{" "}
        <a
          onClick={() => {
            ipc.system.openExternalUrl("https://www.dyad.sh/docs/help/nodejs");
          }}
          className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
        >
          Node.js troubleshooting guide
        </a>
        .{" "}
      </p>
      <p className="mt-2">
        Still stuck? Click the <b>Help</b> button in the bottom-left corner and
        then <b>Report a Bug</b>.
      </p>
    </div>
  );
}

function NodeInstallButton({
  nodeInstallStep,
  handleNodeInstallClick,
  finishNodeInstall,
}: {
  nodeInstallStep: NodeInstallStep;
  handleNodeInstallClick: () => void;
  finishNodeInstall: () => void;
}) {
  switch (nodeInstallStep) {
    case "install":
      return (
        <Button className="mt-3" onClick={handleNodeInstallClick}>
          Install Node.js Runtime
        </Button>
      );
    case "continue-processing":
      return (
        <Button className="mt-3" onClick={finishNodeInstall} disabled>
          <div className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            Checking Node.js setup...
          </div>
        </Button>
      );
    case "waiting-for-continue":
      return (
        <Button className="mt-3" onClick={finishNodeInstall}>
          <div className="flex items-center gap-2">
            Continue | I installed Node.js
          </div>
        </Button>
      );
    case "finished-checking":
      return (
        <div className="mt-3 text-sm text-red-600 dark:text-red-400">
          Node.js not detected. Closing and re-opening Dyad usually fixes this.
        </div>
      );
    default:
      const _exhaustiveCheck: never = nodeInstallStep;
  }
}

export const OpenRouterSetupBanner = ({
  className,
}: {
  className?: string;
}) => {
  const posthog = usePostHog();
  const navigate = useNavigate();
  return (
    <SetupProviderCard
      className={cn("mt-2", className)}
      variant="openrouter"
      onClick={() => {
        posthog.capture("setup-flow:ai-provider-setup:openrouter:click");
        navigate({
          to: providerSettingsRoute.id,
          params: { provider: "openrouter" },
        });
      }}
      tabIndex={0}
      leadingIcon={
        <img src={openrouterLogo} alt="OpenRouter" className="w-4 h-4" />
      }
      title="Setup OpenRouter API Key"
      chip={
        <>
          <GiftIcon className="w-3 h-3" />
          Free models available
        </>
      }
    />
  );
};
