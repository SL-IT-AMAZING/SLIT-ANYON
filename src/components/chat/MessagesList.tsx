import type { Message } from "@/ipc/types";
import type React from "react";
import { forwardRef, useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Virtuoso } from "react-virtuoso";
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
import { useSettings } from "@/hooks/useSettings";
import { useStreamChat } from "@/hooks/useStreamChat";
import { useUserBudgetInfo } from "@/hooks/useUserBudgetInfo";
import { useVersions } from "@/hooks/useVersions";
import { ipc } from "@/ipc/types";
import { showError, showWarning } from "@/lib/toast";
import { useAtomValue, useSetAtom } from "jotai";
import { Loader2, RefreshCw, Undo } from "lucide-react";
import { PromoMessage } from "./PromoMessage";
import { resolveTurnDuration } from "./durationUtils";
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

type OpenCodeQuestionData = {
  requestId: string;
  questions: Array<{
    question: string;
    header?: string;
    options: Array<{ label: string; description?: string }>;
    multiple?: boolean;
  }>;
};

const CONTEXT_TOOLS = new Set(["read", "grep", "glob", "list", "search"]);
const EDIT_TOOLS = new Set(["edit", "write", "search-replace"]);

type ToolGroupKind = "context" | "edit" | "verify";

function getToolGroupKind(step: StepItem): ToolGroupKind | null {
  if (step.type !== "tool") return null;
  const names = [step.toolName, step.statusToolName].filter(
    Boolean,
  ) as string[];
  if (names.some((n) => CONTEXT_TOOLS.has(n))) return "context";
  if (names.some((n) => EDIT_TOOLS.has(n))) return "edit";
  if (names.some((n) => n.startsWith("lsp") || n === "diagnostics"))
    return "verify";
  return null;
}

function groupToolSteps(steps: StepItem[]): StepItem[] {
  const result: StepItem[] = [];
  let currentGroup: StepItem[] = [];
  let currentKind: ToolGroupKind | null = null;

  function flushGroup() {
    if (currentGroup.length === 0) return;
    if (currentGroup.length === 1) {
      result.push(currentGroup[0]);
    } else if (currentKind === "context") {
      const counts = new Map<string, number>();
      for (const s of currentGroup) {
        const name =
          (s.statusToolName ?? s.toolName) === "glob"
            ? "search"
            : (s.statusToolName ?? s.toolName ?? "read");
        counts.set(name, (counts.get(name) ?? 0) + 1);
      }
      const parts: string[] = [];
      for (const [name, count] of counts) {
        parts.push(`${count} ${name}${count > 1 ? "s" : ""}`);
      }
      result.push({
        id: `context-group-${currentGroup[0].id}`,
        type: "context-group",
        toolIcon: getToolIcon("anyon-read"),
        title: "Gathered context",
        subtitle: parts.join(", "),
        groupedSteps: [...currentGroup],
      });
    } else if (currentKind === "edit") {
      const uniqueFiles = new Set<string>();
      for (const s of currentGroup) {
        if (s.subtitle) uniqueFiles.add(s.subtitle);
      }
      const fileCount = uniqueFiles.size || currentGroup.length;
      result.push({
        id: `edit-group-${currentGroup[0].id}`,
        type: "context-group",
        toolIcon: getToolIcon("anyon-edit"),
        title: "Making edits",
        subtitle: `${fileCount} file${fileCount > 1 ? "s" : ""}`,
        groupedSteps: [...currentGroup],
      });
    } else if (currentKind === "verify") {
      result.push({
        id: `verify-group-${currentGroup[0].id}`,
        type: "context-group",
        toolIcon: getToolIcon("anyon-status"),
        title: "Verifying code",
        subtitle: `${currentGroup.length} check${currentGroup.length > 1 ? "s" : ""}`,
        groupedSteps: [...currentGroup],
      });
    }
    currentGroup = [];
    currentKind = null;
  }

  for (const step of steps) {
    const kind = getToolGroupKind(step);
    if (kind !== null) {
      if (currentKind !== null && currentKind !== kind) {
        flushGroup();
      }
      currentKind = kind;
      currentGroup.push(step);
    } else {
      flushGroup();
      result.push(step);
    }
  }

  flushGroup();
  return result;
}

function keepOnlyLastTodoStep(steps: StepItem[]): StepItem[] {
  let lastTodoIndex = -1;
  for (let index = steps.length - 1; index >= 0; index -= 1) {
    if (steps[index]?.type === "todo") {
      lastTodoIndex = index;
      break;
    }
  }

  if (lastTodoIndex === -1) {
    return steps;
  }

  return steps.filter(
    (step, index) => step.type !== "todo" || index === lastTodoIndex,
  );
}

function mapTagToStatusTool(tag: string): string {
  switch (tag) {
    case "opencode-tool":
      return "";
    case "opencode-question":
      return "question";
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
  nowMs: number,
): {
  steps: StepItem[];
  statusText: string | undefined;
  duration: string | undefined;
} {
  const steps: StepItem[] = [];
  let activeToolName: string | undefined;

  for (const message of turn.assistantMessages) {
    const pieces = parseCustomTagsWithDedup(message.content ?? "");

    for (const piece of pieces) {
      if (piece.type === "markdown") {
        if (piece.content.trim()) {
          steps.push({
            id: `${message.id}-text-${steps.length}`,
            type: "text",
            text: piece.content,
          });
        }
        continue;
      }

      const { tagInfo } = piece;
      if (tagInfo.tag === "anyon-chat-summary") {
        continue;
      }

      if (tagInfo.tag === "anyon-app-name") {
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

      if (tagInfo.tag === "opencode-question") {
        let questionData: OpenCodeQuestionData | null = null;
        try {
          questionData = JSON.parse(tagInfo.content) as OpenCodeQuestionData;
        } catch {}

        if (questionData) {
          steps.push({
            id: `${message.id}-question-${steps.length}`,
            type: "question",
            toolName: "question",
            title: questionData.questions[0]?.header || "Question",
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

      if (statusToolName === "todoread") {
        continue;
      }

      if (statusToolName === "todowrite") {
        steps.push({
          id: `${message.id}-todo-${steps.length}`,
          type: "todo",
          toolName: "todowrite",
          statusToolName,
          toolIcon: getToolIcon("todowrite"),
          title: "To-dos",
        });
        if (isRunning) {
          activeToolName = statusToolName;
        }
        continue;
      }

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
        statusToolName,
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

  const groupedSteps = groupToolSteps(steps);
  const dedupedSteps = keepOnlyLastTodoStep(groupedSteps);

  let duration: string | undefined;
  const assistantWithCreatedAt = turn.assistantMessages.filter(
    (m) => m.createdAt,
  );
  const startCandidate =
    assistantWithCreatedAt[0]?.createdAt ??
    (isTurnWorking ? turn.userMessage?.createdAt : undefined);

  if (startCandidate) {
    const start = new Date(startCandidate as string | Date);
    const endCandidate = isTurnWorking
      ? new Date(nowMs)
      : (assistantWithCreatedAt[assistantWithCreatedAt.length - 1]?.createdAt ??
        startCandidate);
    const end = new Date(endCandidate as string | Date);

    if (!Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime())) {
      duration = formatDuration(start, end);
    }
  }

  return {
    steps: dedupedSteps,
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
}

// Footer component for Virtuoso - receives context via props
function FooterComponent({ context }: { context?: FooterContext }) {
  const { t } = useTranslation(["chat", "common"]);
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
  } = context;

  return (
    <>
      {!isStreaming && (
        <div className="flex max-w-3xl mx-auto gap-1">
          {!!messages.length &&
            messages[messages.length - 1].role === "assistant" && (
              <Button
                variant="ghost"
                size="xs"
                className="text-muted-foreground hover:text-foreground"
                disabled={isUndoLoading}
                onClick={async () => {
                  if (isUndoLoading) {
                    return;
                  }

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
                      showWarning(t("actions.undoNoSourceCommit"));
                    }
                  } catch (error) {
                    console.error("Error during undo operation:", error);
                    showError(t("actions.undoFailed"));
                  } finally {
                    setIsUndoLoading(false);
                  }
                }}
              >
                {isUndoLoading ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Undo size={14} />
                )}
                Undo
              </Button>
            )}
          {!!messages.length && (
            <Button
              variant="ghost"
              size="xs"
              className="text-muted-foreground hover:text-foreground"
              disabled={isRetryLoading}
              onClick={async () => {
                if (isRetryLoading) {
                  return;
                }

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
                        showWarning(t("actions.retryNoInitialCommit"));
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
                  showError(t("actions.retryFailed"));
                } finally {
                  setIsRetryLoading(false);
                }
              }}
            >
              {isRetryLoading ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <RefreshCw size={14} />
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
    </>
  );
}

export const MessagesList = forwardRef<HTMLDivElement, MessagesListProps>(
  function MessagesList({ messages, messagesEndRef, onAtBottomChange }, ref) {
    const { t } = useTranslation(["chat", "common"]);
    const appId = useAtomValue(selectedAppIdAtom);
    const { versions, revertVersion } = useVersions(appId);
    const { streamMessage, isStreaming } = useStreamChat();
    const { settings } = useSettings();
    const setMessagesById = useSetAtom(chatMessagesByIdAtom);
    const [isUndoLoading, setIsUndoLoading] = useState(false);
    const [isRetryLoading, setIsRetryLoading] = useState(false);
    const [nowMs, setNowMs] = useState(() => Date.now());
    const [cachedTurnDurations, setCachedTurnDurations] = useState<
      Map<string, string>
    >(new Map());
    const [expandedTurnIds, setExpandedTurnIds] = useState<Set<string>>(
      new Set(),
    );
    const selectedChatId = useAtomValue(selectedChatIdAtom);
    const { userBudget } = useUserBudgetInfo();

    useEffect(() => {
      if (!isStreaming) return;
      setNowMs(Date.now());
      const timer = window.setInterval(() => {
        setNowMs(Date.now());
      }, 1000);
      return () => window.clearInterval(timer);
    }, [isStreaming]);

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

    const turns = useMemo(() => groupMessagesIntoTurns(messages), [messages]);

    useEffect(() => {
      if (!isStreaming || turns.length === 0) {
        return;
      }

      const lastTurn = turns[turns.length - 1];
      const lastTurnSummary = summarizeTurn(lastTurn, true, nowMs);
      const streamingDuration = lastTurnSummary.duration;
      if (!streamingDuration) {
        return;
      }

      setCachedTurnDurations((prev) => {
        const current = prev.get(lastTurn.id);
        if (current === streamingDuration) {
          return prev;
        }
        const next = new Map(prev);
        next.set(lastTurn.id, streamingDuration);
        return next;
      });
    }, [isStreaming, turns, nowMs]);

    // Memoized item renderer for virtualized list
    const itemContent = useCallback(
      (index: number, turn: MessageTurn) => {
        const isLastTurn = index === turns.length - 1;
        const isTurnWorking = isStreaming && isLastTurn;
        const turnSummary = summarizeTurn(turn, isTurnWorking, nowMs);
        const fallbackDuration = cachedTurnDurations.get(turn.id);
        const displayDuration = resolveTurnDuration({
          isTurnWorking,
          currentDuration: turnSummary.duration,
          fallbackDuration,
        });
        const userMessageText = turn.userMessage?.content ?? "";
        const hasAssistantContent = turn.assistantMessages.length > 0;
        const hasVisibleTextSteps = turnSummary.steps.some(
          (s) => s.type === "text" || s.type === "question",
        );
        const shouldAutoExpand =
          !isTurnWorking &&
          !hasVisibleTextSteps &&
          turnSummary.steps.length > 0;
        const stepsExpanded = expandedTurnIds.has(turn.id) || shouldAutoExpand;

        return (
          <div className="px-4 max-w-3xl mx-auto w-full" key={turn.id}>
            <SessionTurn
              userMessage={userMessageText}
              steps={turnSummary.steps}
              working={isTurnWorking}
              isActive={isTurnWorking}
              statusText={turnSummary.statusText}
              duration={displayDuration}
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
      [turns, isStreaming, expandedTurnIds, nowMs, cachedTurnDurations],
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
      ],
    );

    // Render empty state
    if (messages.length === 0) {
      return (
        <div
          className="absolute inset-0 overflow-y-auto p-4"
          ref={ref}
          data-testid="messages-list"
        >
          <div className="flex flex-col items-center justify-center h-full max-w-2xl mx-auto">
            <div className="flex flex-1 items-center justify-center text-muted-foreground">
              {t("messages.noMessages")}
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
            const turnSummary = summarizeTurn(turn, isTurnWorking, nowMs);
            const fallbackDuration = cachedTurnDurations.get(turn.id);
            const displayDuration = resolveTurnDuration({
              isTurnWorking,
              currentDuration: turnSummary.duration,
              fallbackDuration,
            });
            const hasAssistantContent = turn.assistantMessages.length > 0;
            const hasVisibleTextSteps = turnSummary.steps.some(
              (s) => s.type === "text" || s.type === "question",
            );
            const shouldAutoExpand =
              !isTurnWorking &&
              !hasVisibleTextSteps &&
              turnSummary.steps.length > 0;
            const stepsExpanded =
              expandedTurnIds.has(turn.id) || shouldAutoExpand;
            return (
              <div className="px-4 max-w-3xl mx-auto w-full" key={turn.id}>
                <SessionTurn
                  userMessage={turn.userMessage?.content ?? ""}
                  steps={turnSummary.steps}
                  working={isTurnWorking}
                  isActive={isTurnWorking}
                  statusText={turnSummary.statusText}
                  duration={displayDuration}
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
