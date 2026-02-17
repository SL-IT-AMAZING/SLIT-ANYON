import type { Message } from "@/ipc/types";
import type React from "react";
import { forwardRef, useCallback, useMemo, useState } from "react";
import { Virtuoso } from "react-virtuoso";
import { OpenRouterSetupBanner } from "../SetupBanner";
import {
  SessionTurn,
  type StepItem,
  computeStatus,
} from "../chat-v2/SessionTurn";
import { getToolIcon } from "../chat-v2/tools";
import {
  getState,
  parseCustomTagsWithDedup,
  renderCustomTag,
} from "./AnyonMarkdownParser";

import { selectedAppIdAtom } from "@/atoms/appAtoms";
import { selectedChatIdAtom } from "@/atoms/chatAtoms";
import { chatMessagesByIdAtom } from "@/atoms/chatAtoms";
import { Button } from "@/components/ui/button";
import { useLanguageModelProviders } from "@/hooks/useLanguageModelProviders";
import { useSettings } from "@/hooks/useSettings";
import { useStreamChat } from "@/hooks/useStreamChat";
import { useUserBudgetInfo } from "@/hooks/useUserBudgetInfo";
import { useVersions } from "@/hooks/useVersions";
import { ipc } from "@/ipc/types";
import { showError, showWarning } from "@/lib/toast";
import { useAtomValue, useSetAtom } from "jotai";
import { Loader2, RefreshCw, Undo } from "lucide-react";
import { PromoMessage } from "./PromoMessage";
import {
  findLastIndexByRole,
  findLastMessageByRole,
  findPreviousAssistantWithCommitBefore,
  findPreviousMessageByRole,
} from "./messagesListUtils";

interface MessagesListProps {
  messages: Message[];
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
  onAtBottomChange?: (atBottom: boolean) => void;
}

interface MessageTurn {
  id: string;
  userMessage: Message | null;
  assistantMessages: Message[];
}

function mapTagToStatusTool(tag: string): string {
  switch (tag) {
    case "opencode-tool":
      return "";
    case "anyon-read":
      return "read";
    case "anyon-list-files":
      return "list";
    case "anyon-grep":
    case "anyon-code-search":
    case "anyon-code-search-result":
      return "grep";
    case "anyon-web-search":
    case "anyon-web-search-result":
    case "anyon-web-crawl":
      return "webfetch";
    case "anyon-edit":
    case "anyon-search-replace":
      return "edit";
    case "anyon-write":
      return "write";
    case "anyon-command":
      return "bash";
    case "anyon-write-plan":
      return "todowrite";
    default:
      return tag.replace(/^anyon-/, "");
  }
}

function groupMessagesIntoTurns(messages: Message[]): MessageTurn[] {
  const turns: MessageTurn[] = [];
  let currentTurn: MessageTurn | null = null;

  for (const [index, message] of messages.entries()) {
    if (message.role === "user") {
      currentTurn = {
        id: `turn-${message.id}`,
        userMessage: message,
        assistantMessages: [],
      };
      turns.push(currentTurn);
      continue;
    }

    if (!currentTurn) {
      currentTurn = {
        id: `turn-orphan-${message.id}-${index}`,
        userMessage: null,
        assistantMessages: [message],
      };
      turns.push(currentTurn);
      continue;
    }

    currentTurn.assistantMessages.push(message);
  }

  return turns;
}

function formatDuration(from: Date, to: Date): string {
  const seconds = Math.max(
    1,
    Math.round((to.getTime() - from.getTime()) / 1000),
  );
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remaining = seconds % 60;
  if (remaining === 0) return `${minutes}m`;
  return `${minutes}m ${remaining}s`;
}

function summarizeTurn(
  turn: MessageTurn,
  isTurnWorking: boolean,
): {
  steps: StepItem[];
  response: string;
  statusText: string | undefined;
  duration: string | undefined;
} {
  const steps: StepItem[] = [];
  const responseChunks: string[] = [];
  let activeToolName: string | undefined;

  for (const message of turn.assistantMessages) {
    const pieces = parseCustomTagsWithDedup(message.content ?? "");

    for (const piece of pieces) {
      if (piece.type === "markdown") {
        if (piece.content.trim()) {
          responseChunks.push(piece.content);
        }
        continue;
      }

      const { tagInfo } = piece;
      if (tagInfo.tag === "anyon-chat-summary") {
        continue;
      }

      if (tagInfo.tag === "think") {
        if (tagInfo.content.trim()) {
          steps.push({
            id: `${message.id}-think-${steps.length}`,
            type: "reasoning",
            text: tagInfo.content,
          });
        }
        continue;
      }

      const toolName =
        tagInfo.tag === "opencode-tool"
          ? tagInfo.attributes.name || "tool"
          : tagInfo.tag.replace(/^anyon-/, "");
      const statusToolName =
        tagInfo.tag === "opencode-tool"
          ? tagInfo.attributes.name || "tool"
          : mapTagToStatusTool(tagInfo.tag);
      const iconToolName =
        tagInfo.tag === "opencode-tool"
          ? tagInfo.attributes.name || "tool"
          : tagInfo.tag;

      const isRunning =
        tagInfo.tag === "opencode-tool"
          ? tagInfo.attributes.status === "running"
          : getState({
              isStreaming: isTurnWorking,
              inProgress: tagInfo.inProgress,
            }) === "pending";

      if (isRunning) {
        activeToolName = statusToolName;
      }

      const rendered = renderCustomTag(tagInfo, { isStreaming: isTurnWorking });
      if (!rendered) {
        continue;
      }

      steps.push({
        id: `${message.id}-${toolName}-${steps.length}`,
        type: "tool",
        toolName,
        toolIcon: getToolIcon(iconToolName),
        title:
          tagInfo.attributes.title ||
          tagInfo.attributes.name ||
          tagInfo.attributes.tool ||
          toolName,
        subtitle:
          tagInfo.attributes.path ||
          tagInfo.attributes.query ||
          tagInfo.attributes.description ||
          tagInfo.attributes.provider ||
          undefined,
        content: rendered,
      });
    }
  }

  let duration: string | undefined;
  const assistantWithCreatedAt = turn.assistantMessages.filter(
    (m) => m.createdAt,
  );
  if (assistantWithCreatedAt.length > 0) {
    const start = new Date(
      assistantWithCreatedAt[0].createdAt as string | Date,
    );
    const end = new Date(
      assistantWithCreatedAt[assistantWithCreatedAt.length - 1].createdAt as
        | string
        | Date,
    );
    if (!Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime())) {
      duration = formatDuration(start, end);
    }
  }

  return {
    steps,
    response: responseChunks.join("\n").trim(),
    statusText: activeToolName ? computeStatus(activeToolName) : undefined,
    duration,
  };
}

// Context type for Virtuoso
interface FooterContext {
  messages: Message[];
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
  isStreaming: boolean;
  isUndoLoading: boolean;
  isRetryLoading: boolean;
  setIsUndoLoading: (loading: boolean) => void;
  setIsRetryLoading: (loading: boolean) => void;
  versions: ReturnType<typeof useVersions>["versions"];
  revertVersion: ReturnType<typeof useVersions>["revertVersion"];
  streamMessage: ReturnType<typeof useStreamChat>["streamMessage"];
  selectedChatId: number | null;
  appId: number | null;
  setMessagesById: ReturnType<typeof useSetAtom<typeof chatMessagesByIdAtom>>;
  settings: ReturnType<typeof useSettings>["settings"];
  userBudget: ReturnType<typeof useUserBudgetInfo>["userBudget"];
  renderSetupBanner: () => React.ReactNode;
}

// Footer component for Virtuoso - receives context via props
function FooterComponent({ context }: { context?: FooterContext }) {
  if (!context) return null;

  const {
    messages,
    messagesEndRef,
    isStreaming,
    isUndoLoading,
    isRetryLoading,
    setIsUndoLoading,
    setIsRetryLoading,
    versions,
    revertVersion,
    streamMessage,
    selectedChatId,
    appId,
    setMessagesById,
    settings,
    userBudget,
    renderSetupBanner,
  } = context;

  return (
    <>
      {!isStreaming && (
        <div className="flex max-w-3xl mx-auto gap-2">
          {!!messages.length &&
            messages[messages.length - 1].role === "assistant" && (
              <Button
                variant="outline"
                size="sm"
                disabled={isUndoLoading}
                onClick={async () => {
                  if (!selectedChatId || !appId) {
                    console.error("No chat selected or app ID not available");
                    return;
                  }

                  setIsUndoLoading(true);
                  try {
                    const currentMessage = messages[messages.length - 1];
                    const currentMessageIndex = messages.length - 1;
                    const userMessage = findPreviousMessageByRole(
                      messages,
                      currentMessageIndex,
                      "user",
                    );
                    if (currentMessage?.sourceCommitHash) {
                      console.debug(
                        "Reverting to source commit hash",
                        currentMessage.sourceCommitHash,
                      );
                      await revertVersion({
                        versionId: currentMessage.sourceCommitHash,
                        currentChatMessageId: userMessage
                          ? {
                              chatId: selectedChatId,
                              messageId: userMessage.id,
                            }
                          : undefined,
                      });
                      const chat = await ipc.chat.getChat(selectedChatId);
                      setMessagesById((prev) => {
                        const next = new Map(prev);
                        next.set(selectedChatId, chat.messages);
                        return next;
                      });
                    } else {
                      showWarning(
                        "No source commit hash found for message. Need to manually undo code changes",
                      );
                    }
                  } catch (error) {
                    console.error("Error during undo operation:", error);
                    showError("Failed to undo changes");
                  } finally {
                    setIsUndoLoading(false);
                  }
                }}
              >
                {isUndoLoading ? (
                  <Loader2 size={16} className="mr-1 animate-spin" />
                ) : (
                  <Undo size={16} />
                )}
                Undo
              </Button>
            )}
          {!!messages.length && (
            <Button
              variant="outline"
              size="sm"
              disabled={isRetryLoading}
              onClick={async () => {
                if (!selectedChatId) {
                  console.error("No chat selected");
                  return;
                }

                setIsRetryLoading(true);
                try {
                  // The last message is usually an assistant, but it might not be.
                  const lastVersion = versions[0];
                  const lastMessage = messages[messages.length - 1];
                  let shouldRedo = true;
                  if (
                    lastVersion.oid === lastMessage.commitHash &&
                    lastMessage.role === "assistant"
                  ) {
                    const lastUserIndex = findLastIndexByRole(messages, "user");
                    const previousAssistantMessage =
                      lastUserIndex >= 0
                        ? findPreviousAssistantWithCommitBefore(
                            messages,
                            lastUserIndex,
                          )
                        : undefined;
                    if (
                      previousAssistantMessage?.role === "assistant" &&
                      previousAssistantMessage?.commitHash
                    ) {
                      console.debug("Reverting to previous assistant version");
                      await revertVersion({
                        versionId: previousAssistantMessage.commitHash,
                      });
                      shouldRedo = false;
                    } else {
                      const chat = await ipc.chat.getChat(selectedChatId);
                      if (chat.initialCommitHash) {
                        console.debug(
                          "Reverting to initial commit hash",
                          chat.initialCommitHash,
                        );
                        await revertVersion({
                          versionId: chat.initialCommitHash,
                        });
                      } else {
                        showWarning(
                          "No initial commit hash found for chat. Need to manually undo code changes",
                        );
                      }
                    }
                  }

                  // Find the last user message
                  const lastUserMessage = findLastMessageByRole(
                    messages,
                    "user",
                  );
                  if (!lastUserMessage) {
                    console.error("No user message found");
                    return;
                  }
                  // Need to do a redo, if we didn't delete the message from a revert.
                  const redo = shouldRedo;
                  console.debug("Streaming message with redo", redo);

                  streamMessage({
                    prompt: lastUserMessage.content,
                    chatId: selectedChatId,
                    redo,
                  });
                } catch (error) {
                  console.error("Error during retry operation:", error);
                  showError("Failed to retry message");
                } finally {
                  setIsRetryLoading(false);
                }
              }}
            >
              {isRetryLoading ? (
                <Loader2 size={16} className="mr-1 animate-spin" />
              ) : (
                <RefreshCw size={16} />
              )}
              Retry
            </Button>
          )}
        </div>
      )}

      {isStreaming &&
        !settings?.enableAnyonPro &&
        !userBudget &&
        messages.length > 0 && (
          <PromoMessage
            seed={messages.length * (appId ?? 1) * (selectedChatId ?? 1)}
          />
        )}
      <div ref={messagesEndRef} />
      {renderSetupBanner()}
    </>
  );
}

export const MessagesList = forwardRef<HTMLDivElement, MessagesListProps>(
  function MessagesList({ messages, messagesEndRef, onAtBottomChange }, ref) {
    const appId = useAtomValue(selectedAppIdAtom);
    const { versions, revertVersion } = useVersions(appId);
    const { streamMessage, isStreaming } = useStreamChat();
    const { isAnyProviderSetup, isProviderSetup } = useLanguageModelProviders();
    const { settings } = useSettings();
    const setMessagesById = useSetAtom(chatMessagesByIdAtom);
    const [isUndoLoading, setIsUndoLoading] = useState(false);
    const [isRetryLoading, setIsRetryLoading] = useState(false);
    const [expandedTurnIds, setExpandedTurnIds] = useState<Set<string>>(
      new Set(),
    );
    const selectedChatId = useAtomValue(selectedChatIdAtom);
    const { userBudget } = useUserBudgetInfo();

    // Virtualization only renders visible DOM elements, which creates issues for E2E tests:
    // 1. Off-screen logs don't exist in the DOM and can't be queried by test selectors
    // 2. Tests would need complex scrolling logic to bring elements into view before interaction
    // 3. Race conditions and timing issues occur when waiting for virtualized elements to render after scrolling
    const isTestMode = settings?.isTestMode;

    // Wrap state setters in useCallback to stabilize references
    const handleSetIsUndoLoading = useCallback((loading: boolean) => {
      setIsUndoLoading(loading);
    }, []);

    const handleSetIsRetryLoading = useCallback((loading: boolean) => {
      setIsRetryLoading(loading);
    }, []);

    const renderSetupBanner = useCallback(() => {
      const selectedModel = settings?.selectedModel;
      const needsOpenRouterSetup =
        (selectedModel?.name === "free" &&
          selectedModel?.provider === "auto" &&
          !isProviderSetup("openrouter")) ||
        !isAnyProviderSetup();

      return needsOpenRouterSetup ? (
        <OpenRouterSetupBanner className="w-full" />
      ) : null;
    }, [settings?.selectedModel, isProviderSetup, isAnyProviderSetup]);

    const turns = useMemo(() => groupMessagesIntoTurns(messages), [messages]);

    // Memoized item renderer for virtualized list
    const itemContent = useCallback(
      (index: number, turn: MessageTurn) => {
        const isLastTurn = index === turns.length - 1;
        const isTurnWorking = isStreaming && isLastTurn;
        const turnSummary = summarizeTurn(turn, isTurnWorking);
        const userMessageText = turn.userMessage?.content ?? "";
        const hasAssistantContent = turn.assistantMessages.length > 0;
        const stepsExpanded = expandedTurnIds.has(turn.id);

        return (
          <div className="px-4" key={turn.id}>
            <SessionTurn
              userMessage={userMessageText}
              steps={turnSummary.steps}
              response={turnSummary.response}
              working={isTurnWorking}
              statusText={turnSummary.statusText}
              duration={turnSummary.duration}
              stepsExpanded={stepsExpanded}
              onToggleSteps={() => {
                setExpandedTurnIds((prev) => {
                  const next = new Set(prev);
                  if (next.has(turn.id)) {
                    next.delete(turn.id);
                  } else {
                    next.add(turn.id);
                  }
                  return next;
                });
              }}
              className={!hasAssistantContent ? "opacity-70" : undefined}
            />
          </div>
        );
      },
      [turns, isStreaming, expandedTurnIds],
    );

    // Create context object for Footer component with stable references
    const footerContext = useMemo<FooterContext>(
      () => ({
        messages,
        messagesEndRef,
        isStreaming,
        isUndoLoading,
        isRetryLoading,
        setIsUndoLoading: handleSetIsUndoLoading,
        setIsRetryLoading: handleSetIsRetryLoading,
        versions,
        revertVersion,
        streamMessage,
        selectedChatId,
        appId,
        setMessagesById,
        settings,
        userBudget,
        renderSetupBanner,
      }),
      [
        messages,
        messagesEndRef,
        isStreaming,
        isUndoLoading,
        isRetryLoading,
        handleSetIsUndoLoading,
        handleSetIsRetryLoading,
        versions,
        revertVersion,
        streamMessage,
        selectedChatId,
        appId,
        setMessagesById,
        settings,
        userBudget,
        renderSetupBanner,
      ],
    );

    // Render empty state or setup banner
    if (messages.length === 0) {
      const setupBanner = renderSetupBanner();
      if (setupBanner) {
        return (
          <div
            className="absolute inset-0 overflow-y-auto p-4"
            ref={ref}
            data-testid="messages-list"
          >
            {setupBanner}
          </div>
        );
      }
      return (
        <div
          className="absolute inset-0 overflow-y-auto p-4"
          ref={ref}
          data-testid="messages-list"
        >
          <div className="flex flex-col items-center justify-center h-full max-w-2xl mx-auto">
            <div className="flex flex-1 items-center justify-center text-muted-foreground">
              No messages yet
            </div>
          </div>
        </div>
      );
    }

    // In test mode, render all messages without virtualization
    // so E2E tests can query all messages in the DOM
    if (isTestMode) {
      return (
        <div
          className="absolute inset-0 p-4 overflow-y-auto"
          ref={ref}
          data-testid="messages-list"
        >
          {turns.map((turn, index) => {
            const isLastTurn = index === turns.length - 1;
            const isTurnWorking = isStreaming && isLastTurn;
            const turnSummary = summarizeTurn(turn, isTurnWorking);
            const hasAssistantContent = turn.assistantMessages.length > 0;
            const stepsExpanded = expandedTurnIds.has(turn.id);
            return (
              <div className="px-4" key={turn.id}>
                <SessionTurn
                  userMessage={turn.userMessage?.content ?? ""}
                  steps={turnSummary.steps}
                  response={turnSummary.response}
                  working={isTurnWorking}
                  statusText={turnSummary.statusText}
                  duration={turnSummary.duration}
                  stepsExpanded={stepsExpanded}
                  onToggleSteps={() => {
                    setExpandedTurnIds((prev) => {
                      const next = new Set(prev);
                      if (next.has(turn.id)) {
                        next.delete(turn.id);
                      } else {
                        next.add(turn.id);
                      }
                      return next;
                    });
                  }}
                  className={!hasAssistantContent ? "opacity-70" : undefined}
                />
              </div>
            );
          })}
          <FooterComponent context={footerContext} />
        </div>
      );
    }

    return (
      <div
        className="absolute inset-0 overflow-y-auto p-4"
        ref={ref}
        data-testid="messages-list"
      >
        <Virtuoso
          data={turns}
          computeItemKey={(_index, turn) => turn.id}
          increaseViewportBy={{ top: 1000, bottom: 500 }}
          initialTopMostItemIndex={turns.length - 1}
          itemContent={itemContent}
          components={{ Footer: FooterComponent }}
          context={footerContext}
          atBottomThreshold={80}
          atBottomStateChange={onAtBottomChange}
          followOutput={(isAtBottom) => (isAtBottom ? "auto" : false)}
        />
      </div>
    );
  },
);
