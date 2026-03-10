import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { chatClient } from "@/ipc/types";
import { cn } from "@/lib/utils";
import { Check, ChevronsUpDown, Copy, FileCode, Search, Wrench } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { PartVM } from "../chat/renderModel";
import { BasicTool } from "./BasicTool";
import { LogoSpinner } from "./LogoSpinner";
import { MarkdownContent } from "./MarkdownContent";
import { type Question, QuestionPrompt } from "./QuestionPrompt";
import { getToolIcon } from "./tools";

export function computeStatus(toolName: string | undefined): string {
  switch (toolName) {
    case "task":
      return "Delegating work";
    case "todowrite":
    case "todoread":
      return "Planning next steps";
    case "read":
      return "Gathering context";
    case "list":
    case "grep":
    case "glob":
      return "Searching the codebase";
    case "webfetch":
      return "Searching the web";
    case "edit":
    case "write":
      return "Making edits";
    case "bash":
      return "Running commands";
    default:
      return "Thinking";
  }
}

export interface StepItem {
  id: string;
  type: "tool" | "reasoning" | "text" | "question" | "todo" | "context-group";
  toolName?: string;
  statusToolName?: string;
  toolIcon?: LucideIcon;
  title?: string;
  subtitle?: string;
  args?: string[];
  content?: React.ReactNode;
  text?: string;
  groupedSteps?: StepItem[];
}

export interface FileDiff {
  file: string;
  additions: number;
  deletions: number;
  content?: React.ReactNode;
}

export interface PermissionItem {
  id: string;
  toolName: string;
  toolIcon?: LucideIcon;
  title: string;
  subtitle?: string;
  content?: React.ReactNode;
}

export interface SessionTurnProps {
  userMessage: string;
  steps: StepItem[];
  parts?: PartVM[];
  diffs?: FileDiff[];
  working?: boolean;
  statusText?: string;
  duration?: string;
  stepsExpanded?: boolean;
  onToggleSteps?: () => void;
  error?: string;
  permissions?: PermissionItem[];
  className?: string;
  isActive?: boolean;
}

function isToggleOnlyStep(step: StepItem): boolean {
  return (
    step.type === "tool" ||
    step.type === "context-group" ||
    step.type === "reasoning" ||
    step.type === "todo"
  );
}

type Segment =
  | { kind: "toggle"; steps: StepItem[] }
  | { kind: "visible"; step: StepItem };

function buildSegments(steps: StepItem[]): Segment[] {
  const segments: Segment[] = [];
  let toggleBuf: StepItem[] = [];

  function flushToggle() {
    if (toggleBuf.length > 0) {
      segments.push({ kind: "toggle", steps: toggleBuf });
      toggleBuf = [];
    }
  }

  for (const step of steps) {
    if (isToggleOnlyStep(step)) {
      toggleBuf.push(step);
    } else {
      flushToggle();
      segments.push({ kind: "visible", step });
    }
  }
  flushToggle();
  return segments;
}

function renderToggleStep(step: StepItem): React.ReactNode {
  if (step.type === "reasoning") {
    return (
      <div
        key={step.id}
        className="ml-6 border-l border-border/50 pl-3 py-1 text-xs text-muted-foreground"
      >
        <MarkdownContent content={step.text ?? ""} />
      </div>
    );
  }

  if (step.type === "tool") {
    const Icon = step.toolIcon ?? Wrench;
    return (
      <BasicTool
        key={step.id}
        icon={Icon}
        trigger={{
          title: step.title ?? step.toolName ?? "Tool",
          subtitle: step.subtitle,
          args: step.args,
        }}
      >
        {step.content}
      </BasicTool>
    );
  }

  if (step.type === "context-group" && step.groupedSteps) {
    const Icon = step.toolIcon ?? Search;
    return (
      <BasicTool
        key={step.id}
        icon={Icon}
        trigger={{
          title: step.title ?? "Gathered context",
          subtitle: step.subtitle,
        }}
      >
        <div className="space-y-0.5">
          {step.groupedSteps.map((gs) => {
            const GsIcon = gs.toolIcon ?? Wrench;
            return (
              <BasicTool
                key={gs.id}
                icon={GsIcon}
                trigger={{
                  title: gs.title ?? gs.toolName ?? "Tool",
                  subtitle: gs.subtitle,
                  args: gs.args,
                }}
              >
                {gs.content}
              </BasicTool>
            );
          })}
        </div>
      </BasicTool>
    );
  }

  if (step.type === "todo") {
    return null;
  }

  return (
    <div key={step.id} className="text-xs text-muted-foreground pl-6 py-1">
      {step.text}
    </div>
  );
}

function isToggleOnlyPart(part: PartVM): boolean {
  return part.kind === "tool" || part.kind === "reasoning" || part.kind === "todo";
}

type PartSegment =
  | { kind: "toggle"; parts: PartVM[] }
  | { kind: "visible"; part: PartVM };

type ContextToolPartVM = Extract<PartVM, { kind: "tool" }>;

type ToggleEntry =
  | { kind: "part"; part: PartVM }
  | {
      kind: "context-group";
      id: string;
      title: string;
      subtitle: string;
      parts: ContextToolPartVM[];
    };

const CONTEXT_GROUP_TOOLS = new Set(["read", "grep", "glob", "list", "search"]);

function useThrottledText(text: string, delay = 100) {
  const [value, setValue] = useState(text);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setValue(text);
    }, delay);
    return () => window.clearTimeout(timeout);
  }, [text, delay]);

  return value;
}

function isContextToolPart(part: PartVM): part is ContextToolPartVM {
  if (part.kind !== "tool") return false;
  const name = part.statusToolName || part.toolName;
  return CONTEXT_GROUP_TOOLS.has(name);
}

function summarizeContextToolParts(parts: ContextToolPartVM[]) {
  const counts = new Map<string, number>();

  for (const part of parts) {
    const name =
      (part.statusToolName || part.toolName) === "glob"
        ? "search"
        : (part.statusToolName || part.toolName || "read");
    counts.set(name, (counts.get(name) ?? 0) + 1);
  }

  return [...counts.entries()]
    .map(([name, count]) => `${count} ${name}${count > 1 ? "s" : ""}`)
    .join(", ");
}

function buildToggleEntries(parts: PartVM[]): ToggleEntry[] {
  const entries: ToggleEntry[] = [];
  let contextBuf: ContextToolPartVM[] = [];

  function flushContext() {
    if (contextBuf.length === 0) return;
    if (contextBuf.length === 1) {
      entries.push({ kind: "part", part: contextBuf[0] });
    } else {
      entries.push({
        kind: "context-group",
        id: `context-group-${contextBuf[0].id}`,
        title: "Gathered context",
        subtitle: summarizeContextToolParts(contextBuf),
        parts: [...contextBuf],
      });
    }
    contextBuf = [];
  }

  for (const part of parts) {
    if (isContextToolPart(part)) {
      contextBuf.push(part);
      continue;
    }
    flushContext();
    entries.push({ kind: "part", part });
  }

  flushContext();
  return entries;
}

function TextPartBlock({
  content,
  partId,
  showCopy = false,
  className,
}: {
  content: string;
  partId: string;
  showCopy?: boolean;
  className?: string;
}) {
  const throttledText = useThrottledText(content);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!content.trim()) return;
    await navigator.clipboard.writeText(content.trim());
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div key={partId} className={cn("group py-2", className)}>
      <div className="text-sm">
        <MarkdownContent content={throttledText} />
      </div>
      {showCopy && (
        <div className="mt-1 flex items-center justify-end opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
          <button
            type="button"
            aria-label={copied ? "Copied response" : "Copy response"}
            onClick={handleCopy}
            className="inline-flex items-center gap-1 rounded px-1.5 py-1 text-xs text-muted-foreground hover:bg-muted/40 hover:text-foreground"
          >
            {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
            <span>{copied ? "Copied" : "Copy"}</span>
          </button>
        </div>
      )}
    </div>
  );
}

function buildPartSegments(parts: PartVM[]): PartSegment[] {
  const segments: PartSegment[] = [];
  let toggleBuf: PartVM[] = [];

  function flushToggle() {
    if (toggleBuf.length > 0) {
      segments.push({ kind: "toggle", parts: toggleBuf });
      toggleBuf = [];
    }
  }

  for (const part of parts) {
    if (part.kind === "unsupported") continue;
    if (isToggleOnlyPart(part)) {
      toggleBuf.push(part);
    } else {
      flushToggle();
      segments.push({ kind: "visible", part });
    }
  }

  flushToggle();
  return segments;
}

function renderTogglePart(part: PartVM): React.ReactNode {
  if (part.kind === "reasoning") {
    return (
      <div
        key={part.id}
        className="ml-6 border-l border-border/50 pl-3 py-1 text-xs text-muted-foreground"
      >
        <TextPartBlock content={part.text} partId={part.id} className="py-0" />
      </div>
    );
  }

  if (part.kind === "tool") {
    const Icon = getToolIcon(part.iconToolName);
    return (
      <BasicTool
        key={part.id}
        icon={Icon}
        trigger={{
          title: part.title,
          subtitle: part.subtitle,
        }}
      >
        {part.content}
      </BasicTool>
    );
  }

  return null;
}

export function SessionTurn({
  userMessage,
  steps,
  parts,
  diffs,
  working = false,
  statusText,
  duration,
  stepsExpanded = false,
  onToggleSteps,
  error,
  permissions,
  isActive = false,
  className,
}: SessionTurnProps) {
  const [throttledStatus, setThrottledStatus] = useState(statusText);
  const lastStatusUpdateRef = useRef(0);
  const statusTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );
  const STATUS_SWAP_MS = 1200;

  useEffect(() => {
    if (!working) {
      setThrottledStatus(statusText);
      return;
    }

    const now = Date.now();
    const elapsed = now - lastStatusUpdateRef.current;

    if (elapsed >= STATUS_SWAP_MS) {
      setThrottledStatus(statusText);
      lastStatusUpdateRef.current = now;
    } else {
      clearTimeout(statusTimerRef.current);
      statusTimerRef.current = setTimeout(() => {
        setThrottledStatus(statusText);
        lastStatusUpdateRef.current = Date.now();
      }, STATUS_SWAP_MS - elapsed);
    }

    return () => clearTimeout(statusTimerRef.current);
  }, [statusText, working]);

  const submitQuestionAnswer = async (
    requestID: string,
    answers: string[][],
  ) => {
    await chatClient.replyToQuestion({ requestID, answers });
  };

  const displayParts = parts?.filter((part) => part.kind !== "todo") ?? [];
  const partSegments = parts ? buildPartSegments(displayParts) : [];
  const lastTextPartId =
    !working
      ? [...displayParts]
          .reverse()
          .find((part) => part.kind === "text" && part.text.trim())?.id
      : undefined;

  const visibleSteps = working
    ? steps
    : steps.filter((step) => step.type !== "reasoning");
  const displaySteps = visibleSteps.filter((step) => step.type !== "todo");
  const stepSegments = buildSegments(displaySteps);

  const canExpandSteps = parts
    ? displayParts.some(isToggleOnlyPart)
    : displaySteps.some(isToggleOnlyStep);
  const hasUserMessage = userMessage.trim().length > 0;
  const hasSteps = working || canExpandSteps;

  const hasDiffs = !working && !!(diffs && diffs.length > 0);

  const renderQuestionPrompt = (text: string | undefined, key: string) => {
    let questionData: { requestId: string; questions: Question[] } | null = null;

    try {
      questionData = text
        ? (JSON.parse(text) as {
            requestId: string;
            questions: Question[];
          })
        : null;
    } catch {
      questionData = null;
    }

    if (!questionData) {
      return null;
    }

    return (
      <div key={key} className="py-2">
        <QuestionPrompt
          questions={questionData.questions}
          onSubmit={(answers) => submitQuestionAnswer(questionData.requestId, answers)}
        />
      </div>
    );
  };

  const renderVisibleStep = (step: StepItem) => {
    if (step.type === "text") {
      return (
        <div key={step.id} className="text-sm py-2">
          <MarkdownContent content={step.text ?? ""} />
        </div>
      );
    }

    if (step.type === "question") {
      return renderQuestionPrompt(step.text, step.id);
    }

    return null;
  };

  const renderVisiblePart = (part: PartVM) => {
    if (part.kind === "text") {
      return (
        <TextPartBlock
          key={part.id}
          content={part.text}
          partId={part.id}
          showCopy={part.id === lastTextPartId}
        />
      );
    }

    if (part.kind === "question") {
      return renderQuestionPrompt(part.text, part.id);
    }

    return null;
  };

  const renderPartSegment = (segment: PartSegment, idx: number) => {
    if (segment.kind === "visible") {
      return renderVisiblePart(segment.part);
    }

    if (!stepsExpanded) return null;

    const entries = buildToggleEntries(segment.parts);

    return (
      <div key={`toggle-seg-${idx}`} className="py-1 space-y-0.5">
        {entries.map((entry) => {
          if (entry.kind === "part") {
            return renderTogglePart(entry.part);
          }

          return (
            <BasicTool
              key={entry.id}
              icon={Search}
              trigger={{ title: entry.title, subtitle: entry.subtitle }}
            >
              <div className="space-y-0.5">
                {entry.parts.map((part) => {
                  const Icon = getToolIcon(part.iconToolName);
                  return (
                    <BasicTool
                      key={part.id}
                      icon={Icon}
                      trigger={{
                        title: part.title,
                        subtitle: part.subtitle,
                      }}
                    >
                      {part.content}
                    </BasicTool>
                  );
                })}
              </div>
            </BasicTool>
          );
        })}
      </div>
    );
  };

  const renderStepSegment = (segment: Segment, idx: number) => {
    if (segment.kind === "visible") {
      return renderVisibleStep(segment.step);
    }

    if (!stepsExpanded) return null;

    return (
      <div key={`toggle-seg-${idx}`} className="py-1 space-y-0.5">
        {segment.steps.map(renderToggleStep)}
      </div>
    );
  };

  return (
    <div
      data-component="session-turn"
      className={cn("flex flex-col", className)}
    >
      {hasUserMessage && (
        <div
          className={cn("z-10 bg-background pb-1", isActive && "sticky top-0")}
        >
          <div className="ml-auto w-fit max-w-[92%] rounded-xl border border-border/70 bg-muted/35 px-3 py-1.5">
            <div className="text-sm text-foreground whitespace-pre-wrap break-words">
              {userMessage}
            </div>
          </div>
        </div>
      )}

      {hasSteps && (
        <div
          className={cn(
            "z-[1] bg-background",
            isActive && "sticky",
            isActive && hasUserMessage ? "top-[28px]" : isActive ? "top-0" : "",
          )}
        >
          <button
            type="button"
            onClick={onToggleSteps}
            className="flex items-center gap-2 py-1.5 px-2 text-xs text-muted-foreground hover:bg-muted/30 rounded w-full transition-colors"
          >
            {working && <LogoSpinner variant="pulseWave" size={14} />}

            <span className={cn("truncate", working && "animate-shimmer")}>
              {working
                ? throttledStatus || "Thinking"
                : stepsExpanded
                  ? "Hide steps"
                  : "Show steps"}
            </span>

            <span className="text-muted-foreground/60 select-none">
              &middot;
            </span>

            {duration && (
              <span className="tabular-nums shrink-0">{duration}</span>
            )}

            {canExpandSteps && (
              <ChevronsUpDown className="size-3.5 shrink-0 ml-auto" />
            )}
          </button>
        </div>
      )}

      {parts ? partSegments.map(renderPartSegment) : stepSegments.map(renderStepSegment)}

      {!stepsExpanded && permissions && permissions.length > 0 && (
        <div className="py-2 space-y-2">
          {permissions.map((p) => {
            const Icon = p.toolIcon ?? Wrench;
            return (
              <BasicTool
                key={p.id}
                icon={Icon}
                trigger={{ title: p.title, subtitle: p.subtitle }}
                forceOpen
              >
                {p.content}
              </BasicTool>
            );
          })}
        </div>
      )}

      {hasDiffs && diffs && (
        <div className="pt-4 space-y-3">
          <Accordion>
            {diffs.map((diff) => (
              <AccordionItem key={diff.file} value={diff.file}>
                <AccordionTrigger className="py-2 text-sm hover:no-underline">
                  <div className="flex items-center gap-2 w-full">
                    <FileCode className="size-4 shrink-0 text-muted-foreground" />
                    <span className="text-sm truncate">{diff.file}</span>
                    <span className="text-xs text-muted-foreground ml-auto tabular-nums shrink-0">
                      +{diff.additions} &minus;{diff.deletions}
                    </span>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  {diff.content ?? (
                    <pre className="text-xs text-muted-foreground font-mono whitespace-pre-wrap">
                      diff content
                    </pre>
                  )}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      )}

      {error && (
        <div className="mt-3 p-3 rounded-lg border border-border bg-muted/20 text-sm text-muted-foreground">
          {error}
        </div>
      )}
    </div>
  );
}
