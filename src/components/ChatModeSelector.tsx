import { chatMessagesByIdAtom } from "@/atoms/chatAtoms";
import {
  MiniSelectTrigger,
  Select,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { detectIsMac } from "@/hooks/useChatModeToggle";
import { useFreeAgentQuota } from "@/hooks/useFreeAgentQuota";
import { useSettings } from "@/hooks/useSettings";
import type { ChatMode } from "@/lib/schemas";
import { isAnyonProEnabled } from "@/lib/schemas";
import { cn } from "@/lib/utils";
import { useRouterState } from "@tanstack/react-router";
import { useAtomValue } from "jotai";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { LocalAgentNewChatToast } from "./LocalAgentNewChatToast";

function NewBadge({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center rounded-full px-2 text-[11px] font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
      {label}
    </span>
  );
}

export function ChatModeSelector() {
  const { t } = useTranslation("chat");
  const { settings, updateSettings } = useSettings();
  const routerState = useRouterState();
  const isChatRoute = routerState.location.pathname === "/chat";
  const messagesById = useAtomValue(chatMessagesByIdAtom);
  const chatId = routerState.location.search.id as number | undefined;
  const currentChatMessages = chatId ? (messagesById.get(chatId) ?? []) : [];

  const selectedMode = settings?.selectedChatMode || "build";
  const isProEnabled = settings ? isAnyonProEnabled(settings) : false;
  const { messagesRemaining, isQuotaExceeded } = useFreeAgentQuota();

  const handleModeChange = (value: string) => {
    const newMode = value as ChatMode;
    updateSettings({ selectedChatMode: newMode });

    // We want to show a toast when user is switching to the new agent mode
    // because they might weird results mixing Build and Agent mode in the same chat.
    //
    // Only show toast if:
    // - User is switching to the new agent mode
    // - User is on the chat (not home page) with existing messages
    // - User has not explicitly disabled the toast
    if (
      newMode === "local-agent" &&
      isChatRoute &&
      currentChatMessages.length > 0 &&
      !settings?.hideLocalAgentNewChatToast
    ) {
      toast.custom(
        (t) => (
          <LocalAgentNewChatToast
            toastId={t}
            onNeverShowAgain={() => {
              updateSettings({ hideLocalAgentNewChatToast: true });
            }}
          />
        ),
        // Make the toast shorter in test mode for faster tests.
        { duration: settings?.isTestMode ? 50 : 8000 },
      );
    }
  };

  const getModeDisplayName = (mode: ChatMode) => {
    switch (mode) {
      case "build":
        return t("modes.build");
      case "ask":
        return t("modes.ask");
      case "agent":
        return t("modes.buildWithMcp");
      case "local-agent":
        // Show "Basic Agent" for non-Pro users, "Agent" for Pro users
        return isProEnabled ? t("modes.agent") : t("modes.basicAgent");
      case "plan":
        return t("modes.plan");
      default:
        return t("modes.build");
    }
  };
  const isMac = detectIsMac();

  return (
    <Select
      value={selectedMode}
      onValueChange={(v) => v && handleModeChange(v)}
    >
      <Tooltip>
        <TooltipTrigger
          render={
            <MiniSelectTrigger
              data-testid="chat-mode-selector"
              className={cn(
                "h-6 w-fit px-1.5 py-0 text-xs-sm font-medium shadow-none gap-0.5",
                selectedMode === "build" ||
                  selectedMode === "local-agent" ||
                  selectedMode === "plan"
                  ? "bg-background hover:bg-muted/50 focus:bg-muted/50"
                  : "bg-primary/10 hover:bg-primary/20 focus:bg-primary/20 text-primary border-primary/20 dark:bg-primary/20 dark:hover:bg-primary/30 dark:focus:bg-primary/30",
              )}
              size="sm"
            />
          }
        >
          <SelectValue>{getModeDisplayName(selectedMode)}</SelectValue>
        </TooltipTrigger>
        <TooltipContent>
          {t("modeMenu.tooltip", {
            shortcut: isMac ? "\u2318 + ." : "Ctrl + .",
          })}
        </TooltipContent>
      </Tooltip>
      <SelectContent align="start">
        {isProEnabled && (
          <>
            <SelectItem value="local-agent">
              <div className="flex flex-col items-start">
                <div className="flex items-center gap-1.5">
                  <span className="font-medium">{t("modes.agentV2")}</span>
                  <NewBadge label={t("modes.newBadge")} />
                </div>
                <span className="text-xs text-muted-foreground">
                  {t("modeDescriptions.agentV2")}
                </span>
              </div>
            </SelectItem>
            <SelectItem value="plan">
              <div className="flex flex-col items-start">
                <div className="flex items-center gap-1.5">
                  <span className="font-medium">{t("modes.plan")}</span>
                  <NewBadge label={t("modes.newBadge")} />
                </div>
                <span className="text-xs text-muted-foreground">
                  {t("modeDescriptions.plan")}
                </span>
              </div>
            </SelectItem>
          </>
        )}
        {!isProEnabled && (
          <SelectItem value="local-agent" disabled={isQuotaExceeded}>
            <div className="flex flex-col items-start">
              <div className="flex items-center gap-1.5">
                <span className="font-medium">{t("modes.basicAgent")}</span>
                <span className="text-xs text-muted-foreground">
                  {t("modeDescriptions.remainingToday", {
                    remaining: isQuotaExceeded ? 0 : messagesRemaining,
                  })}
                </span>
              </div>
              <span className="text-xs text-muted-foreground">
                {isQuotaExceeded
                  ? t("modeDescriptions.basicAgentLimitReached")
                  : t("modeDescriptions.basicAgentFree")}
              </span>
            </div>
          </SelectItem>
        )}
        <SelectItem value="build">
          <div className="flex flex-col items-start">
            <span className="font-medium">{t("modes.build")}</span>
            <span className="text-xs text-muted-foreground">
              {t("modeDescriptions.build")}
            </span>
          </div>
        </SelectItem>
        <SelectItem value="ask">
          <div className="flex flex-col items-start">
            <span className="font-medium">{t("modes.ask")}</span>
            <span className="text-xs text-muted-foreground">
              {t("modeDescriptions.ask")}
            </span>
          </div>
        </SelectItem>
        <SelectItem value="agent">
          <div className="flex flex-col items-start">
            <div className="flex items-center gap-1.5">
              <span className="font-medium">{t("modes.buildWithMcp")}</span>
            </div>
            <span className="text-xs text-muted-foreground">
              {t("modeDescriptions.buildWithMcp")}
            </span>
          </div>
        </SelectItem>
      </SelectContent>
    </Select>
  );
}
