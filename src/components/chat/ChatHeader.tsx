import { selectedAppIdAtom } from "@/atoms/appAtoms";
import { selectedChatIdAtom } from "@/atoms/chatAtoms";
import { SidebarToggle } from "@/components/SidebarToggle";
import { buttonVariants } from "@/components/ui/button";
import { useChats } from "@/hooks/useChats";
import { useCheckoutVersion } from "@/hooks/useCheckoutVersion";
import { useCurrentBranch } from "@/hooks/useCurrentBranch";
import { useRenameBranch } from "@/hooks/useRenameBranch";
import { useStreamChat } from "@/hooks/useStreamChat";
import { useVersions } from "@/hooks/useVersions";
import { ipc } from "@/ipc/types";
import { showError, showSuccess } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { isAnyCheckoutVersionInProgressAtom } from "@/store/appAtoms";
import { useRouter } from "@tanstack/react-router";
import { useAtom, useAtomValue } from "jotai";
import {
  GitBranch,
  History,
  Info,
  PanelRightOpen,
  PlusCircle,
} from "lucide-react";
import { PanelRightClose } from "lucide-react";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { LoadingBar } from "../ui/LoadingBar";
import { Button } from "../ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";
import { UncommittedFilesBanner } from "./UncommittedFilesBanner";

interface ChatHeaderProps {
  isVersionPaneOpen: boolean;
  isPreviewOpen: boolean;
  onTogglePreview: () => void;
  onVersionClick: () => void;
}

export function ChatHeader({
  isVersionPaneOpen,
  isPreviewOpen,
  onTogglePreview,
  onVersionClick,
}: ChatHeaderProps) {
  const { t } = useTranslation("chat");
  const appId = useAtomValue(selectedAppIdAtom);
  const { versions, loading: versionsLoading } = useVersions(appId);
  const { navigate } = useRouter();
  const [, setSelectedChatId] = useAtom(selectedChatIdAtom);
  const { invalidateChats } = useChats(appId);
  const { isStreaming } = useStreamChat();
  const isAnyCheckoutVersionInProgress = useAtomValue(
    isAnyCheckoutVersionInProgressAtom,
  );

  const {
    branchInfo,
    isLoading: branchInfoLoading,
    refetchBranchInfo,
  } = useCurrentBranch(appId);

  const { checkoutVersion, isCheckingOutVersion } = useCheckoutVersion();
  const { renameBranch, isRenamingBranch } = useRenameBranch();

  useEffect(() => {
    if (appId) {
      refetchBranchInfo();
    }
  }, [appId, refetchBranchInfo]);

  const handleCheckoutMainBranch = async () => {
    if (!appId) return;
    await checkoutVersion({ appId, versionId: "main" });
  };

  const handleRenameMasterToMain = async () => {
    if (!appId) return;
    // If this throws, it will automatically show an error toast
    await renameBranch({ oldBranchName: "master", newBranchName: "main" });

    showSuccess(t("actions.masterRenamed"));
  };

  const handleNewChat = async () => {
    if (appId) {
      try {
        const chatId = await ipc.chat.createChat(appId);
        setSelectedChatId(chatId);
        navigate({
          to: "/chat",
          search: { id: chatId },
        });
        await invalidateChats();
      } catch (error) {
        showError(
          t("actions.chatCreateFailed", { message: (error as any).toString() }),
        );
      }
    } else {
      navigate({ to: "/" });
    }
  };

  // REMINDER: KEEP UP TO DATE WITH app_handlers.ts
  const versionPostfix = versions.length === 100_000 ? "+" : "";

  const isNotMainBranch = branchInfo && branchInfo.branch !== "main";

  const currentBranchName = branchInfo?.branch;

  return (
    <div className="flex flex-col w-full @container">
      <LoadingBar isVisible={isAnyCheckoutVersionInProgress} />
      {/* If the version pane is open, it's expected to not always be on the main branch. */}
      {isNotMainBranch && !isVersionPaneOpen && (
        <div className="flex flex-col @sm:flex-row items-center justify-between px-4 py-2 bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-200">
          <div className="flex items-center gap-2 text-sm">
            <GitBranch size={16} />
            <span>
              {currentBranchName === "<no-branch>" && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger
                      render={<span className="flex items-center gap-1" />}
                    >
                      <span className="flex items-center  gap-1">
                        {isAnyCheckoutVersionInProgress ? (
                          <span>{t("ui.pleaseWaitSwitching")}</span>
                        ) : (
                          <>
                            <strong>{t("ui.warning")}:</strong>
                            <span>{t("ui.notOnBranch")}</span>
                            <Info size={14} />
                          </>
                        )}
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>
                        {isAnyCheckoutVersionInProgress
                          ? t("ui.checkoutInProgress")
                          : t("ui.checkoutMainBranch")}
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
              {currentBranchName && currentBranchName !== "<no-branch>" && (
                <span>
                  {t("ui.youAreOnBranch")} <strong>{currentBranchName}</strong>.
                </span>
              )}
              {branchInfoLoading && <span>{t("ui.checkingBranch")}</span>}
            </span>
          </div>
          {currentBranchName === "master" ? (
            <Button
              variant="outline"
              size="sm"
              onClick={handleRenameMasterToMain}
              disabled={isRenamingBranch || branchInfoLoading}
            >
              {isRenamingBranch ? t("ui.renaming") : t("ui.renameToMain")}
            </Button>
          ) : isAnyCheckoutVersionInProgress && !isCheckingOutVersion ? null : (
            <Button
              variant="outline"
              size="sm"
              onClick={handleCheckoutMainBranch}
              disabled={isCheckingOutVersion || branchInfoLoading}
            >
              {isCheckingOutVersion
                ? t("ui.checkingOut")
                : t("ui.switchToMain")}
            </Button>
          )}
        </div>
      )}

      {/* Show uncommitted files banner when on a branch and there are uncommitted changes */}
      {/* Hide while streaming to avoid distracting the user */}
      {!isVersionPaneOpen && branchInfo?.branch && !isStreaming && (
        <UncommittedFilesBanner appId={appId} />
      )}

      {/* Why is this pt-0.5? Because the loading bar is h-1 (it always takes space) and we want the vertical spacing to be consistent.*/}
      <div className="@container flex items-center justify-between pb-1.5 pt-0.5">
        <div className="flex items-center space-x-2">
          <SidebarToggle className="ml-2" />
          <Button
            onClick={handleNewChat}
            variant="ghost"
            className="hidden @2xs:flex items-center justify-start gap-2 mx-2 py-3"
          >
            <PlusCircle size={16} />
            <span>{t("ui.newChat")}</span>
          </Button>
          <Button
            onClick={onVersionClick}
            variant="ghost"
            className="hidden @6xs:flex cursor-pointer items-center gap-1 text-sm px-2 py-1 rounded-md"
          >
            <History size={16} />
            {versionsLoading
              ? "..."
              : `Version ${versions.length}${versionPostfix}`}
          </Button>
        </div>

        <Tooltip>
          <TooltipTrigger
            data-testid="toggle-preview-panel-button"
            onClick={onTogglePreview}
            className={cn(
              buttonVariants({ variant: "ghost", size: "icon" }),
              "cursor-pointer size-8 text-muted-foreground hover:text-foreground mr-2",
            )}
            aria-label={
              isPreviewOpen ? t("ui.closePreview") : t("ui.openPreview")
            }
          >
            <div className="transition-transform duration-200 ease-in-out">
              {isPreviewOpen ? (
                <PanelRightClose className="size-4" />
              ) : (
                <PanelRightOpen className="size-4" />
              )}
            </div>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            {isPreviewOpen ? t("ui.closePreview") : t("ui.openPreview")}
          </TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
}
