import type { Message } from "@/ipc/types";
import type { ReactNode } from "react";
import { type StepItem, computeStatus } from "../chat-v2/SessionTurn";
import { getToolIcon } from "../chat-v2/tools";
import {
  getState,
  parseCustomTagsWithDedup,
  renderCustomTag,
} from "./AnyonMarkdownParser";

export interface MessageTurn {
  id: string;
  userMessage: Message | null;
  assistantMessages: Message[];
}

export type OpenCodeQuestionData = {
  requestId: string;
  questions: Array<{
    question: string;
    header?: string;
    options: Array<{ label: string; description?: string }>;
    multiple?: boolean;
  }>;
};

type BasePartVM = {
  id: string;
  messageId: Message["id"];
  order: number;
};

export type TextPartVM = BasePartVM & {
  kind: "text";
  text: string;
};

export type ReasoningPartVM = BasePartVM & {
  kind: "reasoning";
  text: string;
  visibleAfterCompletion: true;
};

export type ToolPartVM = BasePartVM & {
  kind: "tool";
  toolName: string;
  statusToolName: string;
  iconToolName: string;
  title: string;
  subtitle?: string;
  content: ReactNode;
  isRunning: boolean;
};

export type QuestionPartVM = BasePartVM & {
  kind: "question";
  toolName: "question";
  title: string;
  text: string;
};

export type TodoPartVM = BasePartVM & {
  kind: "todo";
  toolName: "todowrite";
  statusToolName: string;
  isRunning: boolean;
};

export type UnsupportedPartVM = BasePartVM & {
  kind: "unsupported";
  tag: string;
  raw: string;
};

export type PartVM =
  | TextPartVM
  | ReasoningPartVM
  | ToolPartVM
  | QuestionPartVM
  | TodoPartVM
  | UnsupportedPartVM;

export interface TurnVM extends MessageTurn {
  parts: PartVM[];
}

const CONTEXT_TOOLS = new Set(["read", "grep", "glob", "list", "search"]);
const EDIT_TOOLS = new Set(["edit", "write", "search-replace"]);

type ToolGroupKind = "context" | "edit" | "verify";

type LegacyTurnSummary = {
  steps: StepItem[];
  statusText: string | undefined;
  duration: string | undefined;
};

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

function getToolGroupKind(step: StepItem): ToolGroupKind | null {
  if (step.type !== "tool") return null;
  const names = [step.toolName, step.statusToolName].filter(Boolean) as string[];
  if (names.some((name) => CONTEXT_TOOLS.has(name))) return "context";
  if (names.some((name) => EDIT_TOOLS.has(name))) return "edit";
  if (names.some((name) => name.startsWith("lsp") || name === "diagnostics")) {
    return "verify";
  }
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
      for (const step of currentGroup) {
        const name =
          (step.statusToolName ?? step.toolName) === "glob"
            ? "search"
            : (step.statusToolName ?? step.toolName ?? "read");
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
      for (const step of currentGroup) {
        if (step.subtitle) uniqueFiles.add(step.subtitle);
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

function formatDuration(from: Date, to: Date): string {
  const seconds = Math.max(1, Math.round((to.getTime() - from.getTime()) / 1000));
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remaining = seconds % 60;
  if (remaining === 0) return `${minutes}m`;
  return `${minutes}m ${remaining}s`;
}

function cleanHeading(value: string) {
  return value
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\[([^\]]+)\]\([^\)]+\)/g, "$1")
    .replace(/[*_~]+/g, "")
    .trim();
}

function extractHeading(text: string) {
  const markdown = text.replace(/\r\n?/g, "\n");

  const html = markdown.match(/<h[1-6][^>]*>([\s\S]*?)<\/h[1-6]>/i);
  if (html?.[1]) {
    const value = cleanHeading(html[1].replace(/<[^>]+>/g, " "));
    if (value) return value;
  }

  const atx = markdown.match(/^\s{0,3}#{1,6}[ \t]+(.+?)(?:[ \t]+#+[ \t]*)?$/m);
  if (atx?.[1]) {
    const value = cleanHeading(atx[1]);
    if (value) return value;
  }

  const setext = markdown.match(/^([^\n]+)\n(?:=+|-+)\s*$/m);
  if (setext?.[1]) {
    const value = cleanHeading(setext[1]);
    if (value) return value;
  }

  const strong = markdown.match(/^\s*(?:\*\*|__)(.+?)(?:\*\*|__)\s*$/m);
  if (strong?.[1]) {
    const value = cleanHeading(strong[1]);
    if (value) return value;
  }
}

export function groupMessagesIntoTurns(messages: Message[]): MessageTurn[] {
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

export function buildTurnVM(turn: MessageTurn, isTurnWorking: boolean): TurnVM {
  const parts: PartVM[] = [];

  for (const message of turn.assistantMessages) {
    const pieces = parseCustomTagsWithDedup(message.content ?? "");
    let order = 0;
    let textIndex = 0;
    let reasoningIndex = 0;
    let toolIndex = 0;
    let questionIndex = 0;
    let todoIndex = 0;
    let unsupportedIndex = 0;

    for (const piece of pieces) {
      if (piece.type === "markdown") {
        if (!piece.content.trim()) continue;
        parts.push({
          id: `${message.id}:text:${textIndex}`,
          kind: "text",
          messageId: message.id,
          order: order++,
          text: piece.content,
        });
        textIndex += 1;
        continue;
      }

      const { tagInfo } = piece;
      if (tagInfo.tag === "anyon-chat-summary" || tagInfo.tag === "anyon-app-name") {
        continue;
      }

      if (tagInfo.tag === "think") {
        if (!tagInfo.content.trim()) continue;
        parts.push({
          id: `${message.id}:reasoning:${reasoningIndex}`,
          kind: "reasoning",
          messageId: message.id,
          order: order++,
          text: tagInfo.content,
          visibleAfterCompletion: true,
        });
        reasoningIndex += 1;
        continue;
      }

      if (tagInfo.tag === "opencode-question") {
        let questionData: OpenCodeQuestionData | null = null;
        try {
          questionData = JSON.parse(tagInfo.content) as OpenCodeQuestionData;
        } catch {
          questionData = null;
        }

        if (!questionData) {
          parts.push({
            id: `${message.id}:unsupported:${unsupportedIndex}`,
            kind: "unsupported",
            messageId: message.id,
            order: order++,
            tag: tagInfo.tag,
            raw: tagInfo.fullMatch,
          });
          unsupportedIndex += 1;
          continue;
        }

        parts.push({
          id: `${message.id}:question:${questionData.requestId || questionIndex}`,
          kind: "question",
          messageId: message.id,
          order: order++,
          toolName: "question",
          title: questionData.questions[0]?.header || "Question",
          text: tagInfo.content,
        });
        questionIndex += 1;
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
        tagInfo.tag === "opencode-tool" ? tagInfo.attributes.name || "tool" : tagInfo.tag;
      const isRunning =
        tagInfo.tag === "opencode-tool"
          ? tagInfo.attributes.status === "running"
          : getState({ isStreaming: isTurnWorking, inProgress: tagInfo.inProgress }) === "pending";

      if (statusToolName === "todoread") {
        continue;
      }

      if (statusToolName === "todowrite") {
        parts.push({
          id: `${message.id}:todo:${tagInfo.attributes.toolid || todoIndex}`,
          kind: "todo",
          messageId: message.id,
          order: order++,
          toolName: "todowrite",
          statusToolName,
          isRunning,
        });
        todoIndex += 1;
        continue;
      }

      const rendered = renderCustomTag(tagInfo, { isStreaming: isTurnWorking });
      if (!rendered) {
        parts.push({
          id: `${message.id}:unsupported:${unsupportedIndex}`,
          kind: "unsupported",
          messageId: message.id,
          order: order++,
          tag: tagInfo.tag,
          raw: tagInfo.fullMatch,
        });
        unsupportedIndex += 1;
        continue;
      }

      parts.push({
        id: `${message.id}:tool:${tagInfo.attributes.toolid || toolName}:${toolIndex}`,
        kind: "tool",
        messageId: message.id,
        order: order++,
        toolName,
        statusToolName,
        iconToolName,
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
        isRunning,
      });
      toolIndex += 1;
    }
  }

  return {
    ...turn,
    parts,
  };
}

export function summarizeTurnFromVM(
  turn: TurnVM,
  isTurnWorking: boolean,
  nowMs: number,
): LegacyTurnSummary {
  const steps: StepItem[] = [];
  let activeToolName: string | undefined;
  let reasoningHeading: string | undefined;

  for (const part of turn.parts) {
    switch (part.kind) {
      case "text":
        steps.push({
          id: part.id,
          type: "text",
          text: part.text,
        });
        break;
      case "reasoning":
        steps.push({
          id: part.id,
          type: "reasoning",
          text: part.text,
        });
        reasoningHeading = extractHeading(part.text) ?? reasoningHeading;
        break;
      case "question":
        steps.push({
          id: part.id,
          type: "question",
          toolName: part.toolName,
          title: part.title,
          text: part.text,
        });
        break;
      case "todo":
        steps.push({
          id: part.id,
          type: "todo",
          toolName: part.toolName,
          statusToolName: part.statusToolName,
          toolIcon: getToolIcon("todowrite"),
          title: "To-dos",
        });
        if (part.isRunning) {
          activeToolName = part.statusToolName;
        }
        break;
      case "tool":
        steps.push({
          id: part.id,
          type: "tool",
          toolName: part.toolName,
          statusToolName: part.statusToolName,
          toolIcon: getToolIcon(part.iconToolName),
          title: part.title,
          subtitle: part.subtitle,
          content: part.content,
        });
        if (part.isRunning) {
          activeToolName = part.statusToolName;
        }
        break;
      case "unsupported":
        break;
    }
  }

  const groupedSteps = groupToolSteps(steps);
  const dedupedSteps = keepOnlyLastTodoStep(groupedSteps);

  let duration: string | undefined;
  const assistantWithCreatedAt = turn.assistantMessages.filter((message) => message.createdAt);
  const startCandidate =
    assistantWithCreatedAt[0]?.createdAt ??
    (isTurnWorking ? turn.userMessage?.createdAt : undefined);

  if (startCandidate) {
    const start = new Date(startCandidate as string | Date);
    const endCandidate = isTurnWorking
      ? new Date(nowMs)
      : (assistantWithCreatedAt[assistantWithCreatedAt.length - 1]?.createdAt ?? startCandidate);
    const end = new Date(endCandidate as string | Date);

    if (!Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime())) {
      duration = formatDuration(start, end);
    }
  }

  return {
    steps: dedupedSteps,
    statusText: activeToolName ? computeStatus(activeToolName) : reasoningHeading,
    duration,
  };
}

export function buildTurnVMs(messages: Message[], isStreaming: boolean): TurnVM[] {
  return groupMessagesIntoTurns(messages).map((turn, index, turns) =>
    buildTurnVM(turn, isStreaming && index === turns.length - 1),
  );
}
