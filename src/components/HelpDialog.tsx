import { selectedChatIdAtom } from "@/atoms/chatAtoms";
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
import { useUserBudgetInfo } from "@/hooks/useUserBudgetInfo";
import { ipc } from "@/ipc/types";
import type { ChatLogsData } from "@/ipc/types";
import { showError } from "@/lib/toast";
import { useAtomValue } from "jotai";
import {
  BookOpenIcon,
  BugIcon,
  CheckIcon,
  ChevronLeftIcon,
  FileIcon,
  SparklesIcon,
  UploadIcon,
  XIcon,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { BugScreenshotDialog } from "./BugScreenshotDialog";
import { HelpBotDialog } from "./HelpBotDialog";

interface HelpDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function HelpDialog({ isOpen, onClose }: HelpDialogProps) {
  const { t } = useTranslation(["app", "common"]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [reviewMode, setReviewMode] = useState(false);
  const [chatLogsData, setChatLogsData] = useState<ChatLogsData | null>(null);
  const [uploadComplete, setUploadComplete] = useState(false);
  const [sessionId, setSessionId] = useState("");
  const [isHelpBotOpen, setIsHelpBotOpen] = useState(false);
  const [isBugScreenshotOpen, setIsBugScreenshotOpen] = useState(false);
  const selectedChatId = useAtomValue(selectedChatIdAtom);
  const { settings } = useSettings();
  const { userBudget } = useUserBudgetInfo();
  const isAnyonProUser = settings?.providerSettings?.["auto"]?.apiKey?.value;

  // Function to reset all dialog state
  const resetDialogState = () => {
    setIsLoading(false);
    setIsUploading(false);
    setReviewMode(false);
    setChatLogsData(null);
    setUploadComplete(false);
    setSessionId("");
  };

  // Reset state when dialog closes or reopens
  useEffect(() => {
    if (!isOpen) {
      resetDialogState();
    }
  }, [isOpen]);

  // Wrap the original onClose to also reset state
  const handleClose = () => {
    onClose();
  };

  const handleReportBug = async () => {
    setIsLoading(true);
    try {
      // Get system debug info
      const debugInfo = await ipc.system.getSystemDebugInfo();

      // Create a formatted issue body with the debug info
      const issueBody = `
<!-- Please fill in all fields in English -->

## Bug Description (required)
<!-- Please describe the issue you're experiencing and how to reproduce it -->

## Screenshot (recommended)
<!-- Screenshot of the bug -->

## System Information
- ANYON Version: ${debugInfo.anyonVersion}
- Platform: ${debugInfo.platform}
- Architecture: ${debugInfo.architecture}
- Node Version: ${debugInfo.nodeVersion || "n/a"}
- PNPM Version: ${debugInfo.pnpmVersion || "n/a"}
- Node Path: ${debugInfo.nodePath || "n/a"}
- Pro User ID: ${userBudget?.redactedUserId || "n/a"}
- Telemetry ID: ${debugInfo.telemetryId || "n/a"}
- Model: ${debugInfo.selectedLanguageModel || "n/a"}

## Logs
\`\`\`
${debugInfo.logs.slice(-3_500) || "No logs available"}
\`\`\`
`;

      // Create the GitHub issue URL with the pre-filled body
      const encodedBody = encodeURIComponent(issueBody);
      const encodedTitle = encodeURIComponent("[bug] <WRITE TITLE HERE>");
      const labels = ["bug"];
      if (isAnyonProUser) {
        labels.push("pro");
      }
      const githubIssueUrl = `https://github.com/SL-IT-AMAZING/SLIT-ANYON/issues/new?title=${encodedTitle}&labels=${labels}&body=${encodedBody}`;

      // Open the pre-filled GitHub issue page
      ipc.system.openExternalUrl(githubIssueUrl);
    } catch (error) {
      console.error("Failed to prepare bug report:", error);
      // Fallback to opening the regular GitHub issue page
      ipc.system.openExternalUrl(
        "https://github.com/SL-IT-AMAZING/SLIT-ANYON/issues/new",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleUploadChatSession = async () => {
    if (!selectedChatId) {
      alert("Please select a chat first");
      return;
    }

    setIsUploading(true);
    try {
      // Get chat logs (includes debug info, chat data, and codebase)
      const chatLogs = await ipc.misc.getChatLogs(selectedChatId);

      // Store data for review and switch to review mode
      setChatLogsData(chatLogs);
      setReviewMode(true);
    } catch (error) {
      console.error("Failed to upload chat session:", error);
      alert(
        "Failed to upload chat session. Please try again or report manually.",
      );
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmitChatLogs = async () => {
    if (!chatLogsData) return;

    // Upload feature is currently disabled for ANYON
    // TODO: Implement ANYON-specific chat log upload when backend is ready
    showError(t("toasts.uploadDisabled", { ns: "common" }));
  };

  const handleCancelReview = () => {
    setReviewMode(false);
    setChatLogsData(null);
  };

  const handleOpenGitHubIssue = () => {
    // Create a GitHub issue with the session ID
    const issueBody = `
<!-- Please fill in all fields in English -->

Session ID: ${sessionId}
Pro User ID: ${userBudget?.redactedUserId || "n/a"}

## Issue Description (required)
<!-- Please describe the issue you're experiencing -->

## Expected Behavior (required)
<!-- What did you expect to happen? -->

## Actual Behavior (required)
<!-- What actually happened? -->
`;

    const encodedBody = encodeURIComponent(issueBody);
    const encodedTitle = encodeURIComponent("[session report] <add title>");
    const labels = ["support"];
    if (isAnyonProUser) {
      labels.push("pro");
    }
    const githubIssueUrl = `https://github.com/SL-IT-AMAZING/SLIT-ANYON/issues/new?title=${encodedTitle}&labels=${labels}&body=${encodedBody}`;

    ipc.system.openExternalUrl(githubIssueUrl);
    handleClose();
  };

  if (uploadComplete) {
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("help.uploadComplete", { ns: "app" })}</DialogTitle>
          </DialogHeader>
          <div className="py-6 flex flex-col items-center space-y-4">
            <div className="bg-green-50 dark:bg-green-900/20 p-6 rounded-full">
              <CheckIcon className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
            <h3 className="text-lg font-medium">
              {t("help.uploadedSuccessfully", { ns: "app" })}
            </h3>
            <div className="bg-muted p-3 rounded flex items-center space-x-2 font-mono text-sm">
              <FileIcon
                className="h-4 w-4 cursor-pointer"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(sessionId);
                  } catch (err) {
                    console.error("Failed to copy session ID:", err);
                  }
                }}
              />
              <span>{sessionId}</span>
            </div>
            <p className="text-center text-sm">
              {t("help.mustOpenGitHubIssue", { ns: "app" })}
            </p>
          </div>
          <DialogFooter>
            <Button onClick={handleOpenGitHubIssue} className="w-full">
              {t("help.openGitHubIssue", { ns: "app" })}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  if (reviewMode && chatLogsData) {
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <Button
                variant="ghost"
                className="mr-2 p-0 h-8 w-8"
                onClick={handleCancelReview}
              >
                <ChevronLeftIcon className="h-4 w-4" />
              </Button>
              {t("help.okToUpload", { ns: "app" })}
            </DialogTitle>
          </DialogHeader>
          <DialogDescription>
            {t("help.reviewBeforeSubmit", { ns: "app" })}
          </DialogDescription>

          <div className="space-y-4 overflow-y-auto flex-grow">
            <div className="border rounded-md p-3">
              <h3 className="font-medium mb-2">
                {t("help.chatMessages", { ns: "app" })}
              </h3>
              <div className="text-sm bg-muted rounded p-2 max-h-40 overflow-y-auto">
                {chatLogsData.chat.messages.map((msg) => (
                  <div key={msg.id} className="mb-2">
                    <span className="font-semibold">
                      {msg.role === "user" ? "You" : "Assistant"}:{" "}
                    </span>
                    <span>{msg.content}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="border rounded-md p-3">
              <h3 className="font-medium mb-2">
                {t("help.codebaseSnapshot", { ns: "app" })}
              </h3>
              <div className="text-sm bg-muted rounded p-2 max-h-40 overflow-y-auto font-mono">
                {chatLogsData.codebase}
              </div>
            </div>

            <div className="border rounded-md p-3">
              <h3 className="font-medium mb-2">
                {t("help.logs", { ns: "app" })}
              </h3>
              <div className="text-sm bg-muted rounded p-2 max-h-40 overflow-y-auto font-mono">
                {chatLogsData.debugInfo.logs}
              </div>
            </div>

            <div className="border rounded-md p-3">
              <h3 className="font-medium mb-2">
                {t("help.systemInformation", { ns: "app" })}
              </h3>
              <div className="text-sm bg-muted rounded p-2 max-h-32 overflow-y-auto">
                <p>ANYON Version: {chatLogsData.debugInfo.anyonVersion}</p>
                <p>Platform: {chatLogsData.debugInfo.platform}</p>
                <p>Architecture: {chatLogsData.debugInfo.architecture}</p>
                <p>
                  Node Version:{" "}
                  {chatLogsData.debugInfo.nodeVersion || "Not available"}
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-between mt-4 pt-2 sticky bottom-0 bg-background">
            <Button
              variant="outline"
              onClick={handleCancelReview}
              className="flex items-center"
            >
              <XIcon className="mr-2 h-4 w-4" />{" "}
              {t("buttons.cancel", { ns: "common" })}
            </Button>
            <Button
              onClick={handleSubmitChatLogs}
              className="flex items-center"
              disabled={isUploading}
            >
              {isUploading ? (
                t("help.uploading", { ns: "app" })
              ) : (
                <>
                  <CheckIcon className="mr-2 h-4 w-4" />{" "}
                  {t("help.upload", { ns: "app" })}
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("help.needHelp", { ns: "app" })}</DialogTitle>
        </DialogHeader>
        <DialogDescription className="">
          {t("help.description", { ns: "app" })}
        </DialogDescription>
        <div className="flex flex-col space-y-4 w-full">
          {isAnyonProUser ? (
            <div className="flex flex-col space-y-2">
              <Button
                variant="default"
                onClick={() => {
                  setIsHelpBotOpen(true);
                }}
                className="w-full py-6 border-primary/50 shadow-sm shadow-primary/10 transition-all hover:shadow-md hover:shadow-primary/15"
              >
                <SparklesIcon className="mr-2 h-5 w-5" />{" "}
                {t("help.chatWithBot", { ns: "app" })}
              </Button>
              <p className="text-sm text-muted-foreground px-2">
                {t("help.botDescription", { ns: "app" })}
              </p>
            </div>
          ) : (
            <div className="flex flex-col space-y-2">
              <Button
                variant="outline"
                onClick={() => {
                  ipc.system.openExternalUrl("https://docs.any-on.dev");
                }}
                className="w-full py-6 bg-(--background-lightest)"
              >
                <BookOpenIcon className="mr-2 h-5 w-5" />{" "}
                {t("help.openDocs", { ns: "app" })}
              </Button>
              <p className="text-sm text-muted-foreground px-2">
                {t("help.docsDescription", { ns: "app" })}
              </p>
            </div>
          )}

          <div className="flex flex-col space-y-2">
            <Button
              variant="outline"
              onClick={() => {
                handleClose();
                setIsBugScreenshotOpen(true);
              }}
              disabled={isLoading}
              className="w-full py-6 bg-(--background-lightest)"
            >
              <BugIcon className="mr-2 h-5 w-5" />
              {isLoading
                ? t("help.preparingReport", { ns: "app" })
                : t("help.reportBug", { ns: "app" })}
            </Button>
            <p className="text-sm text-muted-foreground px-2">
              {t("help.bugDescription", { ns: "app" })}
            </p>
          </div>
          <div className="flex flex-col space-y-2">
            <Button
              variant="outline"
              onClick={handleUploadChatSession}
              disabled={isUploading || !selectedChatId}
              className="w-full py-6 bg-(--background-lightest)"
            >
              <UploadIcon className="mr-2 h-5 w-5" />
              {isUploading
                ? t("help.preparingUpload", { ns: "app" })
                : t("help.uploadSession", { ns: "app" })}
            </Button>
            <p className="text-sm text-muted-foreground px-2">
              {t("help.uploadDescription", { ns: "app" })}
            </p>
          </div>
        </div>
      </DialogContent>
      <HelpBotDialog
        isOpen={isHelpBotOpen}
        onClose={() => setIsHelpBotOpen(false)}
      />
      <BugScreenshotDialog
        isOpen={isBugScreenshotOpen}
        onClose={() => setIsBugScreenshotOpen(false)}
        handleReportBug={handleReportBug}
        isLoading={isLoading}
      />
    </Dialog>
  );
}
